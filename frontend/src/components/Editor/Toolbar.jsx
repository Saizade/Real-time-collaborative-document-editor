import React from 'react';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Terminal, Minus, Undo, Redo, SplitSquareHorizontal } from 'lucide-react';
import './Editor.css';

const Toolbar = ({ editor }) => {
  if (!editor) return null;

  const B = ({ onClick, active, disabled, title, children }) => (
    <button onClick={onClick} disabled={disabled} className={`toolbar-btn ${active ? 'active' : ''}`} title={title}>{children}</button>
  );

  return (
    <div className="toolbar">
      <B onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={15} /></B>
      <B onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={15} /></B>
      <div className="toolbar-sep" />
      <B onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={15} /></B>
      <B onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={15} /></B>
      <B onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike"><Strikethrough size={15} /></B>
      <B onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code"><Code size={15} /></B>
      <div className="toolbar-sep" />
      <B onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1"><Heading1 size={15} /></B>
      <B onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2"><Heading2 size={15} /></B>
      <B onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3"><Heading3 size={15} /></B>
      <div className="toolbar-sep" />
      <B onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={15} /></B>
      <B onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List"><ListOrdered size={15} /></B>
      <B onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote"><Quote size={15} /></B>
      <B onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><Terminal size={15} /></B>
      <div className="toolbar-sep" />
      <B onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={15} /></B>
      <B onClick={() => editor.chain().focus().setPageBreak().run()} title="Page Break"><SplitSquareHorizontal size={15} /></B>
    </div>
  );
};

export default Toolbar;
