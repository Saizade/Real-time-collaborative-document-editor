import React from 'react';
import { X, FileText, Users, Code, CheckSquare } from 'lucide-react';
import './Modal.css';

export const TEMPLATES = [
  { id: 'blank', title: 'Blank Document', icon: FileText, content: '' },
  { id: 'meeting', title: 'Meeting Notes', icon: Users, content: '<h1>Meeting Notes</h1><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h2>Agenda</h2><ul><li></li></ul><h2>Action Items</h2><ul><li></li></ul>' },
  { id: 'techspec', title: 'Tech Spec', icon: Code, content: '<h1>Technical Specification</h1><h2>Overview</h2><p>Brief description.</p><h2>Architecture</h2><p></p><h2>API Endpoints</h2><ul><li></li></ul>' },
  { id: 'todo', title: 'Project Tasks', icon: CheckSquare, content: '<h1>Project Tasks</h1><h2>To Do</h2><ul><li>Task 1</li></ul><h2>In Progress</h2><ul><li></li></ul><h2>Done</h2><ul><li></li></ul>' },
];

const TemplateModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-head">
          <h3>Choose a template</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {TEMPLATES.map(t => (
            <div 
              key={t.id} 
              onClick={() => onSelect(t)}
              style={{ 
                padding: '20px', 
                border: '1px solid var(--border-secondary)', 
                borderRadius: '12px', 
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.15s ease',
                background: 'var(--bg-primary)'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <t.icon size={20} color="var(--text-secondary)" />
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
