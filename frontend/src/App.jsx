import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Editor from './components/Editor/Editor';
import ShareModal from './components/Common/ShareModal';
import VersionPanel from './components/VersionHistory/VersionPanel';
import api from './utils/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, background: '#fff', color: 'red' }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import { FileText, Zap, History, Shield } from 'lucide-react';
import './components/Layout/Layout.css';

const MainApp = () => {
  const { user, initializing } = useAuth();
  const socket = useSocket();
  const { theme } = useTheme();

  const [authView, setAuthView] = useState('login');
  const [activeDocId, setActiveDocId] = useState(null);
  const [docDetails, setDocDetails] = useState(null);
  const [provider, setProvider] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [forceLogin, setForceLogin] = useState(false);

  useEffect(() => {
    const route = () => {
      const m = window.location.pathname.match(/^\/documents\/([a-fA-F0-9]{24})$/);
      if (m) setActiveDocId(m[1]);
    };
    route();
    window.addEventListener('popstate', route);
    return () => window.removeEventListener('popstate', route);
  }, []);

  const selectDoc = (id, template = null) => {
    setActiveDocId(id);
    if (template && template.content) setPendingTemplate(template.content);
    else setPendingTemplate(null);
    window.history.pushState(null, '', id ? `/documents/${id}` : '/');
  };

  const [initialLoading, setInitialLoading] = useState(true);

  const fetchDetails = async () => {
    if (!activeDocId) { setDocDetails(null); setInitialLoading(false); return; }
    try { setDocDetails((await api.get(`/api/documents/${activeDocId}`)).data); }
    catch { selectDoc(null); }
    finally { setInitialLoading(false); }
  };

  useEffect(() => { fetchDetails(); setVersionsOpen(false); setShareOpen(false); }, [activeDocId]);

  if (initializing || initialLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Logo" style={{ width: 28, height: 28, filter: theme === 'dark' ? 'invert(1)' : 'none' }} />
        </div>
        <span style={{ color: 'var(--text-quaternary)', fontSize: 13 }}>Loading...</span>
      </div>
    );
  }

  const isPublicView = !user && activeDocId && docDetails?.isPublic && !forceLogin;

  if (!user && !isPublicView) {
    return authView === 'register'
      ? <Register onSwitchToLogin={() => setAuthView('login')} />
      : <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  const currentUser = user || {
    _id: `guest_${Math.floor(Math.random() * 100000)}`,
    username: `Anonymous ${Math.floor(Math.random() * 1000)}`,
    color: `#${Math.floor(Math.random() * 16777215).toString(16).padEnd(6, '0')}`
  };

  return (
    <div className="workspace">
      {user && <Sidebar activeDocId={activeDocId} onSelectDoc={selectDoc} refreshTrigger={refresh} />}
      <div className="main">
        {activeDocId && docDetails ? (
          <>
            <Header isGuest={!user} onLoginClick={() => setForceLogin(true)} docDetails={docDetails} provider={provider} onOpenShare={() => setShareOpen(true)} onToggleVersions={() => setVersionsOpen(!versionsOpen)} onTitleUpdated={() => setRefresh(r => r + 1)} />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Editor documentId={activeDocId} socket={socket} user={currentUser} role={docDetails.role} onProviderReady={setProvider} pendingTemplate={pendingTemplate} clearTemplate={() => setPendingTemplate(null)} />
              {versionsOpen && <VersionPanel documentId={activeDocId} role={docDetails.role} onClose={() => setVersionsOpen(false)} onRollbackComplete={() => { fetchDetails(); setRefresh(r => r + 1); }} />}
            </div>
            <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} docDetails={docDetails} onShareUpdated={fetchDetails} />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ maxWidth: 560, textAlign: 'center', animation: 'fadeSlideUp 0.4s ease' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                <img src="/logo.png" alt="Logo" style={{ width: 48, height: 48, filter: theme === 'dark' ? 'invert(1)' : 'none' }} />
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12, color: 'var(--text-primary)' }}>
                Welcome to DOCUMENTO
              </h1>
              <p style={{ fontSize: 15, color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 40px' }}>
                A simple, fast, real-time collaborative document editor. Create a new document or open one from the sidebar.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'left' }}>
                {[
                  { icon: <Zap size={18} />, title: 'Real-time', desc: 'Edits sync instantly across all collaborators.' },
                  { icon: <History size={18} />, title: 'Versioning', desc: 'Snapshot, preview, and restore past versions.' },
                  { icon: <Shield size={18} />, title: 'Access control', desc: 'Share as Editor or Viewer with fine-grained roles.' },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '20px 18px', border: '1px solid var(--border-secondary)', borderRadius: 12, background: 'var(--bg-primary)' }}>
                    <div style={{ marginBottom: 10, color: 'var(--text-tertiary)' }}>{f.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 650, fontFamily: 'var(--font-heading)', marginBottom: 4, color: 'var(--text-primary)' }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-quaternary)', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ErrorBoundary>
            <MainApp />
          </ErrorBoundary>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
