import React, { useState, useEffect } from 'react';
import { Share2, History, Save, Check, Download } from 'lucide-react';
import api from '../../utils/api';
import html2pdf from 'html2pdf.js';
import TurndownService from 'turndown';
import './Layout.css';

const Header = ({ isGuest, onLoginClick, docDetails, provider, onOpenShare, onToggleVersions, onTitleUpdated }) => {
  const [title, setTitle] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState('');

  useEffect(() => { 
    if (docDetails) {
      setTitle(docDetails.title);
      setFolderId(docDetails.folder || '');
    }
  }, [docDetails]);

  useEffect(() => {
    if (docDetails?.role && docDetails.role !== 'viewer') {
      api.get('/api/folders').then(res => setFolders(res.data)).catch(console.error);
    }
  }, [docDetails]);

  useEffect(() => {
    if (!provider) { setCollaborators([]); return; }
    const update = () => {
      const states = provider.awareness.getStates();
      const users = [];
      const seen = new Set();
      states.forEach(s => {
        if (s.user && !seen.has(s.user.name)) {
          seen.add(s.user.name);
          users.push({ username: s.user.name, color: s.user.color });
        }
      });
      setCollaborators(users);
    };
    update();
    provider.awareness.on('change', update);
    return () => provider.awareness.off('change', update);
  }, [provider]);

  const handleBlur = async () => {
    if (!title?.trim() || title === docDetails.title) return;
    setSaving(true);
    try {
      await api.put(`/api/documents/${docDetails._id}`, { title: title.trim() });
      onTitleUpdated();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setTitle(docDetails.title); }
    finally { setSaving(false); }
  };

  const handleFolderChange = async (e) => {
    const newFolderId = e.target.value;
    setFolderId(newFolderId);
    setSaving(true);
    try {
      await api.put(`/api/documents/${docDetails._id}`, { isMove: true, folderId: newFolderId || null });
      onTitleUpdated();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setFolderId(docDetails.folder || ''); }
    finally { setSaving(false); }
  };

  const handleSaveVersion = async () => {
    const desc = prompt('Version label:');
    if (!desc?.trim()) return;
    try {
      await api.post(`/api/documents/${docDetails._id}/versions`, { description: desc.trim() });
    } catch { alert('Failed to save version.'); }
  };

  const handleExportPDF = async () => {
    const element = document.querySelector('.ProseMirror');
    if (!element) return;

    element.classList.add('exporting-pdf');

    const opt = {
      margin: 1,
      filename: `${title || 'document'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], after: '.page-break' }
    };

    await html2pdf().set(opt).from(element).save();

    element.classList.remove('exporting-pdf');
  };

  const handleExportMD = () => {
    const element = document.querySelector('.ProseMirror');
    if (!element) return;
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const markdown = turndownService.turndown(element.innerHTML);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const initials = (n) => n ? n.slice(0, 2).toUpperCase() : 'U';

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} onBlur={handleBlur} onKeyDown={e => e.key === 'Enter' && e.target.blur()} disabled={docDetails?.role === 'viewer'} placeholder="Untitled" />
          {docDetails?.role !== 'viewer' && (
            <select value={folderId} onChange={handleFolderChange} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              <option value="">Root</option>
              {folders.map(f => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          )}
        </div>
        {saving && <span style={{ fontSize: 11, color: 'var(--text-quaternary)' }}>Saving...</span>}
        {saved && <Check size={14} color="var(--color-success)" />}
      </div>

      <div className="header-right">
        <div className="presence">
          {collaborators.map((c, i) => (
            <div key={i} className="avatar tip" data-tip={c.username} style={{ background: c.color }}>{initials(c.username)}</div>
          ))}
        </div>

        {isGuest && (
          <button className="primary-btn" onClick={onLoginClick} style={{ marginLeft: 16, padding: '6px 14px', height: 32, fontSize: 13 }}>
            Sign In
          </button>
        )}

        <div className="header-btns">
          <button className="btn btn-secondary" onClick={handleExportPDF} title="Export to PDF"><Download size={14} /><span>PDF</span></button>
          <button className="btn btn-secondary" onClick={handleExportMD} title="Export to Markdown"><Download size={14} /><span>MD</span></button>
          {docDetails?.role !== 'viewer' && (
            <button className="btn btn-secondary" onClick={handleSaveVersion}><Save size={14} /><span>Save version</span></button>
          )}
          <button className="btn btn-secondary" onClick={onToggleVersions}><History size={14} /><span>History</span></button>
          {docDetails?.role === 'owner' && (
            <button className="btn btn-primary" onClick={onOpenShare}><Share2 size={14} /><span>Share</span></button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
