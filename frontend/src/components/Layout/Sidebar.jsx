import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
import { FileText, Plus, Search, LogOut, FileCode, Moon, Sun, Folder as FolderIcon, ChevronRight } from 'lucide-react';
import TemplateModal from '../Common/TemplateModal';
import './Layout.css';

const Sidebar = ({ activeDocId, onSelectDoc, refreshTrigger }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState(new Set());
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [docRes, folderRes] = await Promise.all([
        api.get('/api/documents'),
        api.get('/api/folders')
      ]);
      setDocuments(docRes.data);
      setFolders(folderRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => { fetchData(); }, [refreshTrigger]);

  const handleCreateDoc = async (template, folderId = null) => {
    setLoading(true);
    try {
      const res = await api.post('/api/documents', { 
        title: template.id !== 'blank' ? template.title : 'Untitled Document',
        folderId
      });
      await fetchData();
      onSelectDoc(res.data._id, template);
      setTemplateOpen(false);
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Folder name:');
    if (!name?.trim()) return;
    try {
      await api.post('/api/folders', { name: name.trim() });
      await fetchData();
    } catch {
      alert('Failed to create folder');
    }
  };

  const toggleFolder = (id) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredDocs = documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || documents.some(d => d.folder === f._id && d.title.toLowerCase().includes(search.toLowerCase())));

  const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const initials = (n) => n ? n.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{ background: 'transparent', padding: 0 }}>
          <img src="/logo.png" alt="DOCUMENTO Logo" style={{ width: 22, height: 22, filter: theme === 'dark' ? 'invert(1)' : 'none' }} />
        </div>
        <span className="sidebar-brand-name">DOCUMENTO</span>
      </div>

      <div className="sidebar-new">
        <button className="btn btn-primary" onClick={() => setTemplateOpen(true)} disabled={loading}>
          <Plus size={16} />
          <span>New document</span>
        </button>
      </div>

      <div className="sidebar-search">
        <Search size={14} className="sidebar-search-icon" />
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="sidebar-docs">
        <div className="sidebar-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Workspace</span>
          <button className="btn-icon" onClick={handleCreateFolder} title="New Folder" style={{ padding: 2 }}><Plus size={14} /></button>
        </div>
        <div className="doc-list">
          {/* Folders */}
          {filteredFolders.map(folder => (
            <div key={folder._id} className="folder-container">
              <div className="folder-item" onClick={() => toggleFolder(folder._id)} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, borderRadius: 6 }}>
                <FolderIcon size={14} style={{ marginRight: 6 }} />
                <span style={{ flex: 1, fontWeight: 500 }}>{folder.name}</span>
                <button className="btn-icon" style={{ opacity: 0.5, transform: openFolders.has(folder._id) ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
              
              {openFolders.has(folder._id) && (
                <div className="folder-contents" style={{ paddingLeft: 12, marginLeft: 6, borderLeft: '1px solid var(--border-secondary)' }}>
                  {filteredDocs.filter(d => d.folder === folder._id).map(doc => (
                    <div key={doc._id} className={`doc-item ${activeDocId === doc._id ? 'active' : ''}`} onClick={() => onSelectDoc(doc._id)} style={{ padding: '6px 8px', marginTop: 2 }}>
                      <FileCode size={14} className="doc-item-icon" />
                      <div className="doc-item-info">
                        <div className="doc-item-name" style={{ fontSize: 13 }}>{doc.title}</div>
                      </div>
                    </div>
                  ))}
                  {filteredDocs.filter(d => d.folder === folder._id).length === 0 && <div style={{ padding: '6px 8px', fontSize: 12, color: 'var(--text-quaternary)' }}>Empty folder</div>}
                </div>
              )}
            </div>
          ))}

          {/* Root Documents */}
          {filteredDocs.filter(d => !d.folder).map(doc => (
            <div key={doc._id} className={`doc-item ${activeDocId === doc._id ? 'active' : ''}`} onClick={() => onSelectDoc(doc._id)}>
              <FileCode size={16} className="doc-item-icon" />
              <div className="doc-item-info">
                <div className="doc-item-name">{doc.title}</div>
                <div className="doc-item-meta">
                  {doc.owner._id === user._id ? 'Owned' : `By ${doc.owner.username}`} · {formatDate(doc.updatedAt)}
                </div>
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && filteredFolders.length === 0 && <div className="doc-empty">{search ? 'No results' : 'No documents yet'}</div>}
        </div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <div className="avatar" style={{ background: user.color || '#1a1a2e' }}>{initials(user.username)}</div>
          <div>
            <div className="sidebar-user-name">{user.username}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button className="btn-icon" onClick={() => setLogoutConfirmOpen(true)} title="Log out"><LogOut size={15} /></button>
        </div>
      </div>

      {templateOpen && (
        <TemplateModal isOpen={true} onClose={() => setTemplateOpen(false)} onSelect={(t) => handleCreateDoc(t)} />
      )}

      {logoutConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setLogoutConfirmOpen(false)} style={{ zIndex: 2000 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center' }}>
            <h3 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>Log Out</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>Are you sure you want to log out of your workspace?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setLogoutConfirmOpen(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={logout} style={{ flex: 1, background: '#fa5252', color: '#fff', border: 'none' }}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
