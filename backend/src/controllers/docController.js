const Document = require('../models/Document');
const User = require('../models/User');
const Version = require('../models/Version');
const { getActiveYDoc, setActiveYDocState, forceSaveYDoc } = require('../sockets/editorSocket');

// @desc    Create a new document
// @route   POST /api/documents
// @access  Private
const createDocument = async (req, res) => {
  try {
    const title = req.body.title || 'Untitled Document';
    const folder = req.body.folderId || null;

    const doc = await Document.create({
      title,
      owner: req.user._id,
      folder,
      collaborators: []
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('Error in createDocument:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all documents for a user (owned or shared)
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find documents owned by user OR where user is a collaborator
    const docs = await Document.find({
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ]
    })
      .populate('owner', 'username email color')
      .populate('collaborators.user', 'username email color')
      .sort({ updatedAt: -1 });

    res.json(docs);
  } catch (error) {
    console.error('Error in getDocuments:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get document details
// @route   GET /api/documents/:id
// @access  Public (if document is public) or Private
const getDocumentDetails = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('owner', 'username email color')
      .populate('collaborators.user', 'username email color');

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let role = null;
    const isPublic = doc.isPublic;

    if (req.user) {
      const userId = req.user._id.toString();
      const isOwner = doc.owner._id.toString() === userId;
      const collaborator = doc.collaborators.find(c => c.user._id.toString() === userId);

      if (isOwner) role = 'owner';
      else if (collaborator) role = collaborator.role;
    }

    // If user has no specific role, but document is public, grant public role
    if (!role && isPublic) {
      role = doc.publicRole || 'viewer';
    }

    if (!role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      _id: doc._id,
      title: doc.title,
      owner: doc.owner,
      collaborators: doc.collaborators,
      isPublic: doc.isPublic,
      publicRole: doc.publicRole,
      role,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  } catch (error) {
    console.error('Error in getDocumentDetails:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update document title or folder
// @route   PUT /api/documents/:id
// @access  Private
const updateDocumentTitle = async (req, res) => {
  try {
    const { title, folderId, isMove } = req.body;
    
    // We can update title or folder
    if (!title && !isMove) {
      return res.status(400).json({ message: 'Update payload is required' });
    }

    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const userId = req.user._id.toString();
    const isOwner = doc.owner.toString() === userId;
    const collaborator = doc.collaborators.find(c => c.user.toString() === userId);

    if (!isOwner && (!collaborator || collaborator.role !== 'editor')) {
      return res.status(403).json({ message: 'Only owners and editors can modify document details' });
    }

    if (title && title.trim() !== '') doc.title = title;
    if (isMove) doc.folder = folderId || null;
    
    await doc.save();

    res.json(doc);
  } catch (error) {
    console.error('Error in updateDocumentTitle:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Share document with user by email
// @route   POST /api/documents/:id/share
// @access  Private
const shareDocument = async (req, res) => {
  try {
    const { email, role } = req.body; // role can be 'editor' or 'viewer'

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can share
    console.log("doc owner:", doc.owner, "req user:", req.user._id); if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the document owner can share it' });
    }

    // Find user to share with
    const userToShare = await User.findOne({ email });
    if (!userToShare) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Check if target user is the owner
    if (doc.owner.toString() === userToShare._id.toString()) {
      return res.status(400).json({ message: 'User is the owner of the document' });
    }

    // Check if target user is already collaborator
    const existingIndex = doc.collaborators.findIndex(
      c => c.user.toString() === userToShare._id.toString()
    );

    if (existingIndex > -1) {
      // Update their role
      doc.collaborators[existingIndex].role = role;
    } else {
      // Add as new collaborator
      doc.collaborators.push({ user: userToShare._id, role });
    }

    await doc.save();

    const updatedDoc = await Document.findById(doc._id)
      .populate('owner', 'username email color')
      .populate('collaborators.user', 'username email color');

    res.json(updatedDoc);
  } catch (error) {
    console.error('Error in shareDocument:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove collaborator
// @route   DELETE /api/documents/:id/share
// @access  Private
const removeCollaborator = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can remove collaborator
    console.log("doc owner:", doc.owner, "req user:", req.user._id); if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the document owner can remove collaborators' });
    }

    doc.collaborators = doc.collaborators.filter(
      c => c.user.toString() !== userId
    );

    await doc.save();

    const updatedDoc = await Document.findById(doc._id)
      .populate('owner', 'username email color')
      .populate('collaborators.user', 'username email color');

    res.json(updatedDoc);
  } catch (error) {
    console.error('Error in removeCollaborator:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get version history
// @route   GET /api/documents/:id/versions
// @access  Private
const getVersions = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const userId = req.user._id.toString();
    const isOwner = doc.owner.toString() === userId;
    const collaborator = doc.collaborators.find(c => c.user.toString() === userId);

    if (!isOwner && !collaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Retrieve versions, excluding the massive Yjs state for list display, and populate creator details
    const versions = await Version.find({ documentId: req.params.id })
      .populate('createdBy', 'username color')
      .sort({ createdAt: -1 });

    res.json(versions);
  } catch (error) {
    console.error('Error in getVersions:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create manual version snapshot
// @route   POST /api/documents/:id/versions
// @access  Private
const createVersion = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim() === '') {
      return res.status(400).json({ message: 'Description is required' });
    }

    const docId = req.params.id;
    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const userId = req.user._id.toString();
    const isOwner = doc.owner.toString() === userId;
    const collaborator = doc.collaborators.find(c => c.user.toString() === userId);

    if (!isOwner && (!collaborator || collaborator.role !== 'editor')) {
      return res.status(403).json({ message: 'Only owners and editors can create versions' });
    }

    // Make sure recent memory updates are flushed to DB first
    await forceSaveYDoc(docId);

    // Re-query document to get the latest yjsState
    const updatedDoc = await Document.findById(docId);
    if (!updatedDoc.yjsState) {
      return res.status(400).json({ message: 'Document is empty, cannot create version snapshot' });
    }

    const version = await Version.create({
      documentId: docId,
      yjsState: updatedDoc.yjsState,
      createdBy: req.user._id,
      description: description
    });

    const populatedVersion = await Version.findById(version._id).populate('createdBy', 'username color');

    res.status(201).json(populatedVersion);
  } catch (error) {
    console.error('Error in createVersion:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rollback document to version
// @route   POST /api/documents/:id/versions/:versionId/rollback
// @access  Private
const rollbackVersion = async (req, res) => {
  try {
    const docId = req.params.id;
    const { versionId } = req.params;

    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const userId = req.user._id.toString();
    const isOwner = doc.owner.toString() === userId;
    const collaborator = doc.collaborators.find(c => c.user.toString() === userId);

    if (!isOwner && (!collaborator || collaborator.role !== 'editor')) {
      return res.status(403).json({ message: 'Only owners and editors can roll back versions' });
    }

    const version = await Version.findById(versionId);
    if (!version || version.documentId.toString() !== docId) {
      return res.status(404).json({ message: 'Version not found for this document' });
    }

    // Perform rollback in the active socket cache if loaded, or update database
    await setActiveYDocState(docId, version.yjsState);

    // Save back to DB
    doc.yjsState = version.yjsState;
    await doc.save();

    // Create a new version entry noting the rollback
    const rollbackLog = await Version.create({
      documentId: docId,
      yjsState: version.yjsState,
      createdBy: req.user._id,
      description: `Rolled back to version: "${version.description}"`
    });

    res.json({ message: 'Document rolled back successfully', rollbackLog });
  } catch (error) {
    console.error('Error in rollbackVersion:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle public link access
// @route   PUT /api/documents/:id/public
// @access  Private
const togglePublicAccess = async (req, res) => {
  try {
    const { isPublic, publicRole } = req.body;
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the document owner can change public access' });
    }

    if (isPublic !== undefined) doc.isPublic = isPublic;
    if (publicRole) doc.publicRole = publicRole;

    await doc.save();
    res.json({ message: 'Public access updated', isPublic: doc.isPublic, publicRole: doc.publicRole });
  } catch (error) {
    console.error('Error in togglePublicAccess:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can delete
    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the document owner can delete this document' });
    }

    // Delete versions first
    await Version.deleteMany({ documentId: doc._id });

    // Delete the document
    await Document.deleteOne({ _id: doc._id });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentDetails,
  updateDocumentTitle,
  shareDocument,
  removeCollaborator,
  getVersions,
  createVersion,
  rollbackVersion,
  togglePublicAccess,
  deleteDocument
};
