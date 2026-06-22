import React, { useState, useEffect, useMemo } from 'react';
import { X, RotateCcw, Eye, Clock, User } from 'lucide-react';
import api from '../../utils/api';
import * as Y from 'yjs';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import './VersionPanel.css';
import '../Common/Modal.css';

const PreviewModal = ({ version, onClose }) => {
  const doc = useMemo(() => {
    const ydoc = new Y.Doc();
    if (version?.yjsState) {
      const data = version.yjsState.data || Object.values(version.yjsState);
      Y.applyUpdate(ydoc, new Uint8Array(data));
    }
    return ydoc;
  }, [version]);

  const editor = useEditor({
    extensions: [StarterKit, Collaboration.configure({ document: doc })],
    editable: false,
  }, [doc]);

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 740, height: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>Preview</h3>
            <div style={{ fontSize: 12, color: 'var(--text-quaternary)', marginTop: 2 }}>"{version.description}"</div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg-secondary)' }}>
          <div className="editor-paper" style={{ margin: '0 auto', minHeight: '100%' }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
};

const VersionPanel = ({ documentId, onClose, role, onRollbackComplete }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    api.get(`/api/documents/${documentId}/versions`)
      .then(r => setVersions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleRollback = async (vId, desc) => {
    if (!confirm(`Restore to "${desc}"? Current content will be overwritten.`)) return;
    try {
      await api.post(`/api/documents/${documentId}/versions/${vId}/rollback`);
      onRollbackComplete();
      onClose();
    } catch { alert('Restore failed.'); }
  };

  const fmtDate = (d) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="version-panel">
      <div className="version-panel-head">
        <h3><Clock size={15} /> History</h3>
        <button className="btn-icon" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="version-panel-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-quaternary)', fontSize: 13 }}>Loading...</div>
        ) : versions.length === 0 ? (
          <div className="version-empty">No versions yet. Use "Save version" to create snapshots.</div>
        ) : versions.map(v => (
          <div key={v._id} className="version-card">
            <div className="version-label">{v.description}</div>
            <div className="version-byline">
              <div className="version-dot" style={{ background: v.createdBy?.color || '#1a1a2e' }} />
              <span>{v.createdBy?.username || 'Unknown'}</span>
            </div>
            <div className="version-timestamp">{fmtDate(v.createdAt)}</div>
            <div className="version-btns">
              <button className="btn btn-secondary" onClick={() => setPreview(v)}><Eye size={12} /> Preview</button>
              {role !== 'viewer' && <button className="btn btn-primary" onClick={() => handleRollback(v._id, v.description)}><RotateCcw size={12} /> Restore</button>}
            </div>
          </div>
        ))}
      </div>

      {preview && <PreviewModal version={preview} onClose={() => setPreview(null)} />}
    </div>
  );
};

export default VersionPanel;
