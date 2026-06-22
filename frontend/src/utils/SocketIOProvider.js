import { Observable } from 'lib0/observable';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

export class SocketIOProvider extends Observable {
  constructor(socket, documentId, doc, user) {
    super();
    this.socket = socket;
    this.documentId = documentId;
    this.doc = doc;
    this.user = user;

    // Initialize the Yjs awareness instance
    this.awareness = new awarenessProtocol.Awareness(doc);

    // Bind event handlers to maintain correct lexical scope
    this._handleYjsUpdate = this._handleYjsUpdate.bind(this);
    this._handleAwarenessUpdate = this._handleAwarenessUpdate.bind(this);
    this._handleIncomingYjsUpdate = this._handleIncomingYjsUpdate.bind(this);
    this._handleIncomingPresenceUpdate = this._handleIncomingPresenceUpdate.bind(this);
    this._handleRollbackState = this._handleRollbackState.bind(this);

    // Listen to local changes
    this.doc.on('update', this._handleYjsUpdate);
    this.awareness.on('update', this._handleAwarenessUpdate);

    // Listen to remote changes from socket server
    this.socket.on('yjs-update', this._handleIncomingYjsUpdate);
    this.socket.on('presence-update', this._handleIncomingPresenceUpdate);
    this.socket.on('rollback-state', this._handleRollbackState);

    // Set local awareness details (will trigger the update handler and broadcast)
    this.awareness.setLocalStateField('user', {
      name: user.username,
      color: user.color,
    });
  }

  init() {
    const SOCKET_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL.replace('/api', '') : 'http://localhost:5001';
    
    this.socket = io(SOCKET_URL, {
      path: '/socket.io/',
    });
  }

  _handleYjsUpdate(update, origin) {
    // Check if the update originated locally (not from server synchronization)
    if (origin !== this) {
      this.socket.emit('yjs-update', {
        documentId: this.documentId,
        update: update // Socket.io handles Uint8Array/Buffer binary transmission directly
      });
    }
  }

  _handleAwarenessUpdate({ added, updated, removed }, origin) {
    // Only broadcast local awareness changes
    if (origin !== 'socket') {
      const changedClients = added.concat(updated).concat(removed);
      const update = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients);
      this.socket.emit('presence-update', {
        documentId: this.documentId,
        update: update
      });
    }
  }

  _handleIncomingYjsUpdate(update) {
    // Apply update to local Y.Doc, tagging the origin as 'this' to avoid echo loops
    Y.applyUpdate(this.doc, new Uint8Array(update), this);
  }

  _handleIncomingPresenceUpdate(update) {
    // Apply awareness update to local Awareness state, tagging origin as 'socket'
    awarenessProtocol.applyAwarenessUpdate(this.awareness, new Uint8Array(update), 'socket');
  }

  _handleRollbackState(stateBuffer) {
    // When a document is rolled back, the server sends the full snapshot update
    // We apply it, tagging the origin as 'this' to avoid broadcasting it back
    Y.applyUpdate(this.doc, new Uint8Array(stateBuffer), this);
    this.emit('rollback', [stateBuffer]);
  }

  destroy() {
    this.doc.off('update', this._handleYjsUpdate);
    this.awareness.off('update', this._handleAwarenessUpdate);
    this.socket.off('yjs-update', this._handleIncomingYjsUpdate);
    this.socket.off('presence-update', this._handleIncomingPresenceUpdate);
    this.socket.off('rollback-state', this._handleRollbackState);
    this.awareness.destroy();
  }
}
export default SocketIOProvider;
