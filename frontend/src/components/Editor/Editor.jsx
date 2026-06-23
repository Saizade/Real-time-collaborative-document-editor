import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import * as Y from 'yjs';
import SocketIOProvider from '../../utils/SocketIOProvider';
import Toolbar from './Toolbar';
import { Heading1, Heading2, List, Quote, Code, CheckSquare, SplitSquareHorizontal } from 'lucide-react';
import { PageBreak } from './extensions/PageBreak';
import './Editor.css';
import './floating-menu.css';

const TiptapContent = ({ ydoc, provider, role, pendingTemplate, clearTemplate }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider,
        user: { name: provider.user.username, color: provider.user.color },
      }),
      PageBreak,
    ],
    editable: role !== 'viewer',
    content: '',
  }, [ydoc, provider]);

  useEffect(() => { if (editor) editor.setEditable(role !== 'viewer'); }, [editor, role]);

  useEffect(() => {
    if (editor && pendingTemplate) {
      setTimeout(() => {
        editor.commands.setContent(pendingTemplate);
        clearTemplate();
      }, 500); // small delay to ensure yjs sync is ready
    }
  }, [editor, pendingTemplate]);

  return (
    <>
      {role !== 'viewer' && <Toolbar editor={editor} />}
      <div className="editor-scroll">
        {role === 'viewer' && (
          <div className="viewer-badge"><div className="viewer-badge-dot" /><span>Read only</span></div>
        )}
        <div className="editor-paper">
          {editor && role !== 'viewer' && (
            <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }} className="floating-menu">
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}><Heading1 size={14} /><span>Heading 1</span></button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}><Heading2 size={14} /><span>Heading 2</span></button>
              <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}><List size={14} /><span>Bullet List</span></button>
              <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}><Quote size={14} /><span>Quote</span></button>
              <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''}><Code size={14} /><span>Code Block</span></button>
              <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={editor.isActive('taskList') ? 'is-active' : ''}><CheckSquare size={14} /><span>Task List</span></button>
              <button onClick={() => editor.chain().focus().setPageBreak().run()}><SplitSquareHorizontal size={14} /><span>Page Break</span></button>
            </FloatingMenu>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
};

const Editor = ({ documentId, socket, user, role, onProviderReady, pendingTemplate, clearTemplate }) => {
  const [provider, setProvider] = useState(null);
  const [ydoc, setYdoc] = useState(null);

  useEffect(() => {
    if (!socket || !documentId || !user) return;

    const yDoc = new Y.Doc();
    const p = new SocketIOProvider(socket, documentId, yDoc, user);

    setYdoc(yDoc);
    setProvider(p);
    onProviderReady(p);

    socket.emit('join-document', { documentId, token: user.token });

    const onInit = ({ state }) => {
      if (state) Y.applyUpdate(yDoc, new Uint8Array(state), p);
    };
    socket.on('init-state', onInit);

    return () => {
      socket.emit('leave-document', { documentId });
      p.destroy();
      socket.off('init-state', onInit);
      onProviderReady(null);
      setProvider(null);
      setYdoc(null);
    };
  }, [socket, documentId, user]);

  return (
    <div className="editor-area">
      {!provider ? (
        <div className="editor-loading">Loading collaborative editor...</div>
      ) : (
        <TiptapContent ydoc={ydoc} provider={provider} role={role} pendingTemplate={pendingTemplate} clearTemplate={clearTemplate} />
      )}
    </div>
  );
};

export default Editor;
