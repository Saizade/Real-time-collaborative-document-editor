import React, { useState } from 'react';
import { X, UserPlus, Trash2, Copy, Check } from 'lucide-react';
import api from '../../utils/api';
import './Modal.css';

const ShareModal = ({ isOpen, onClose, docDetails, onShareUpdated }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !docDetails) return null;

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError('');
    try {
      await api.post(`/api/documents/${docDetails._id}/share`, { email, role });
      setEmail('');
      onShareUpdated();
    } catch (err) { setError(err.response?.data?.message || 'Failed to share'); }
    finally { setLoading(false); }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Revoke access for this user?')) return;
    try { await api.delete(`/api/documents/${docDetails._id}/share`, { data: { userId } }); onShareUpdated(); }
    catch { alert('Failed to remove'); }
  };

  const handleTogglePublic = async () => {
    try {
      await api.put(`/api/documents/${docDetails._id}/public`, { isPublic: !docDetails.isPublic, publicRole: docDetails.publicRole || 'viewer' });
      onShareUpdated();
    } catch { alert('Failed to update public access'); }
  };

  const handlePublicRoleChange = async (e) => {
    try {
      await api.put(`/api/documents/${docDetails._id}/public`, { isPublic: docDetails.isPublic, publicRole: e.target.value });
      onShareUpdated();
    } catch { alert('Failed to update public role'); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/documents/${docDetails._id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = (n) => n ? n.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Share document</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Copy Link */}
          <div>
            <div className="modal-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Public access</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                <input type="checkbox" checked={docDetails.isPublic || false} onChange={handleTogglePublic} disabled={docDetails.role !== 'owner'} />
                Anyone with the link can access
              </label>
            </div>
            
            {docDetails.isPublic && (
              <div className="share-link-row" style={{ marginTop: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Public role:</span>
                <select value={docDetails.publicRole || 'viewer'} onChange={handlePublicRoleChange} disabled={docDetails.role !== 'owner'} style={{ padding: '6px', fontSize: '13px' }}>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            )}

            <div className="share-link-row">
              <input readOnly value={`${window.location.origin}/documents/${docDetails._id}`} />
              <button className="btn btn-secondary" onClick={handleCopy}>
                {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="modal-divider" />

          {/* Add Collaborator */}
          <form onSubmit={handleShare}>
            <div className="modal-section-label">Add collaborator</div>
            <div className="share-add-row">
              <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
              <select value={role} onChange={e => setRole(e.target.value)} disabled={loading}>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button type="submit" className="btn btn-primary" disabled={loading}><UserPlus size={14} /><span>Invite</span></button>
            </div>
          </form>

          {error && <div className="modal-error">{error}</div>}

          {/* List */}
          <div>
            <div className="modal-section-label">People with access</div>
            <div className="collab-list">
              <div className="collab-row">
                <div className="collab-info">
                  <div className="avatar" style={{ background: docDetails.owner.color }}>{initials(docDetails.owner.username)}</div>
                  <div>
                    <div className="collab-name">{docDetails.owner.username}</div>
                    <div className="collab-email">{docDetails.owner.email}</div>
                  </div>
                </div>
                <span className="collab-badge">Owner</span>
              </div>

              {docDetails.collaborators.map(c => (
                <div key={c.user._id} className="collab-row">
                  <div className="collab-info">
                    <div className="avatar" style={{ background: c.user.color }}>{initials(c.user.username)}</div>
                    <div>
                      <div className="collab-name">{c.user.username}</div>
                      <div className="collab-email">{c.user.email}</div>
                    </div>
                  </div>
                  <div className="collab-meta">
                    <span className="collab-badge">{c.role}</span>
                    <button className="btn-danger" onClick={() => handleRemove(c.user._id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}

              {docDetails.collaborators.length === 0 && <div className="collab-empty">Not shared yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
