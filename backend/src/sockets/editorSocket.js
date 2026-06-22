const Y = require('yjs');
const jwt = require('jsonwebtoken');
const Document = require('../models/Document');
const User = require('../models/User');

// Active documents cache
// Schema: documentId -> { yDoc, clients: Set<socketId>, saveTimeout: Timer }
const activeDocs = new Map();
let ioInstance = null;

// Helper to save Yjs state to MongoDB
const saveDocToDB = async (documentId, yDoc) => {
  try {
    const stateBuffer = Buffer.from(Y.encodeStateAsUpdate(yDoc));
    await Document.findByIdAndUpdate(documentId, { yjsState: stateBuffer });
    console.log(`[Socket] Autosaved document ${documentId} to MongoDB.`);
  } catch (error) {
    console.error(`[Socket] Error saving document ${documentId} to database:`, error);
  }
};

const initSocketServer = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Track rooms this socket has joined
    const joinedRooms = new Set();

    socket.on('join-document', async ({ documentId, token }) => {
      try {
        if (!documentId || !token) {
          socket.emit('error', { message: 'Missing documentId or token' });
          return;
        }

        // 1. Verify token
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecrettokenkeyforcollaborativedoceditor2026');
        } catch (err) {
          socket.emit('error', { message: 'Authentication failed' });
          return;
        }

        // 2. Fetch user and check permissions
        const user = await User.findById(decoded.id);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        const doc = await Document.findById(documentId);
        if (!doc) {
          socket.emit('error', { message: 'Document not found' });
          return;
        }

        const userIdStr = user._id.toString();
        const isOwner = doc.owner.toString() === userIdStr;
        const collaborator = doc.collaborators.find(c => c.user.toString() === userIdStr);

        if (!isOwner && !collaborator) {
          socket.emit('error', { message: 'Not authorized to view this document' });
          return;
        }

        // 3. Join Socket.io room
        const roomName = `doc:${documentId}`;
        socket.join(roomName);
        joinedRooms.add(documentId);

        // 4. Initialize in-memory Yjs Document if not already cached
        if (!activeDocs.has(documentId)) {
          const yDoc = new Y.Doc();
          
          // Load existing state from DB if present
          if (doc.yjsState) {
            Y.applyUpdate(yDoc, new Uint8Array(doc.yjsState));
          }
          
          activeDocs.set(documentId, {
            yDoc,
            clients: new Set(),
            saveTimeout: null
          });
        }

        const docRecord = activeDocs.get(documentId);
        docRecord.clients.add(socket.id);

        // Send initial document state to the joining user
        const stateUpdate = Y.encodeStateAsUpdate(docRecord.yDoc);
        
        socket.emit('init-state', {
          title: doc.title,
          state: Buffer.from(stateUpdate),
          user: {
            id: user._id,
            username: user.username,
            color: user.color
          }
        });

        console.log(`[Socket] User ${user.username} (${socket.id}) joined document ${documentId}. Total collaborators: ${docRecord.clients.size}`);
      } catch (err) {
        console.error('[Socket] Error on join-document:', err);
        socket.emit('error', { message: 'Server error joining document' });
      }
    });

    // Handle Yjs document edits
    socket.on('yjs-update', ({ documentId, update }) => {
      if (!joinedRooms.has(documentId)) return;

      const docRecord = activeDocs.get(documentId);
      if (!docRecord) return;

      try {
        const updateUint8 = new Uint8Array(update);
        // Apply update to server Yjs document
        Y.applyUpdate(docRecord.yDoc, updateUint8);

        // Broadcast updates to all OTHER users in the room
        socket.to(`doc:${documentId}`).emit('yjs-update', update);

        // Setup debounced autosave to MongoDB (3 seconds of inactivity)
        if (docRecord.saveTimeout) {
          clearTimeout(docRecord.saveTimeout);
        }
        
        docRecord.saveTimeout = setTimeout(async () => {
          await saveDocToDB(documentId, docRecord.yDoc);
          docRecord.saveTimeout = null;
        }, 3000);

      } catch (err) {
        console.error(`[Socket] Error processing yjs-update for doc ${documentId}:`, err);
      }
    });

    // Handle awareness (cursor and presence) updates
    socket.on('presence-update', ({ documentId, update }) => {
      if (!joinedRooms.has(documentId)) return;
      // Broadcast binary awareness update to everyone else in the document room
      socket.to(`doc:${documentId}`).emit('presence-update', update);
    });

    // Handle leaving the document room explicitly
    socket.on('leave-document', async ({ documentId }) => {
      if (!joinedRooms.has(documentId)) return;
      socket.leave(`doc:${documentId}`);
      joinedRooms.delete(documentId);
      await handleClientDeparture(socket.id, documentId);
    });

    // Handle connection disconnects
    socket.on('disconnect', async () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      for (const documentId of joinedRooms) {
        await handleClientDeparture(socket.id, documentId);
      }
    });
  });
};

// Handle cleanup when a socket client leaves a document room
const handleClientDeparture = async (socketId, documentId) => {
  const docRecord = activeDocs.get(documentId);
  if (!docRecord) return;

  docRecord.clients.delete(socketId);
  console.log(`[Socket] Client ${socketId} left document ${documentId}. Remaining: ${docRecord.clients.size}`);

  // If no one is editing the document anymore, flush updates to database and clean cache
  if (docRecord.clients.size === 0) {
    if (docRecord.saveTimeout) {
      clearTimeout(docRecord.saveTimeout);
      docRecord.saveTimeout = null;
    }
    await saveDocToDB(documentId, docRecord.yDoc);
    activeDocs.delete(documentId);
    console.log(`[Socket] Room ${documentId} is empty. Memory cache cleared.`);
  }
};

// Retrieve in-memory YDoc for version snapshot creation
const getActiveYDoc = (documentId) => {
  const docRecord = activeDocs.get(documentId);
  return docRecord ? docRecord.yDoc : null;
};

// Force immediate save (useful when creating manual version snapshots)
const forceSaveYDoc = async (documentId) => {
  const docRecord = activeDocs.get(documentId);
  if (docRecord) {
    if (docRecord.saveTimeout) {
      clearTimeout(docRecord.saveTimeout);
      docRecord.saveTimeout = null;
    }
    await saveDocToDB(documentId, docRecord.yDoc);
  }
};

// Overwrite in-memory document state (used for Version Rollbacks)
const setActiveYDocState = async (documentId, stateBuffer) => {
  const docRecord = activeDocs.get(documentId);
  const updateUint8 = new Uint8Array(stateBuffer);

  if (docRecord) {
    // Re-create/reset the server-side YDoc
    const newYDoc = new Y.Doc();
    Y.applyUpdate(newYDoc, updateUint8);
    docRecord.yDoc = newYDoc;
    
    if (docRecord.saveTimeout) {
      clearTimeout(docRecord.saveTimeout);
      docRecord.saveTimeout = null;
    }
  }

  // Notify all connected clients in the room to reload the state
  if (ioInstance) {
    ioInstance.to(`doc:${documentId}`).emit('rollback-state', stateBuffer);
    console.log(`[Socket] Rollback broadcasted to room doc:${documentId}`);
  }
};

module.exports = {
  initSocketServer,
  getActiveYDoc,
  forceSaveYDoc,
  setActiveYDocState
};
