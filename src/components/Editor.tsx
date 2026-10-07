import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Code,
  Link,
  Sigma,
  Network,
  Quote,
  Table,
  CheckSquare,
} from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../i18n/translations';

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
  onDropFile: (file: File) => void;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  language?: Language;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  onDropFile,
  onScroll,
  language = 'en',
}) => {
  const t = translations[language];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Split lines for line numbers
  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Sync line numbers scroll with textarea
  const handleScroll = () => {
    if (textareaRef.current) {
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
      if (onScroll) {
        onScroll(
          textareaRef.current.scrollTop,
          textareaRef.current.scrollHeight,
          textareaRef.current.clientHeight
        );
      }
    }
  };

  // Keyboard enhancements: Tab for spaces, auto-indent on Enter, and text formatting shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertSyntax('**', '**', 'bold text');
      return;
    }

    if (isMod && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertSyntax('*', '*', 'italic text');
      return;
    }

    if (isMod && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      insertSyntax('`', '`', 'code');
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '  ';

      const nextVal = value.substring(0, start) + spaces + value.substring(end);
      onChange(nextVal);

      // Restore cursor position after state update
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    } else if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      const currentLine = value.substring(0, start).split('\n').pop() || '';
      const matchIndent = currentLine.match(/^(\s+)/);

      if (matchIndent) {
        e.preventDefault();
        const indent = matchIndent[1];
        const nextVal = value.substring(0, start) + '\n' + indent + value.substring(start);
        onChange(nextVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        }, 0);
      }
    }
  };

  // Insert markdown helpers
  const insertSyntax = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;

    const nextVal =
      value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(nextVal);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  // Drag and drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="flex flex-col h-full bg-[var(--bg-canvas)] border-r border-[var(--border-subtle)] overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Editor Formatting Helper Bar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] overflow-x-auto text-[var(--text-secondary)] select-none">
        <button
          type="button"
          onClick={() => insertSyntax('**', '**', 'bold text')}
          className="p-1 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors"
          title={t.editor.bold}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('*', '*', 'italic text')}
          className="p-1 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors"
          title={t.editor.italic}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('~~', '~~', 'strikethrough')}
          className="p-1 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-px bg-[var(--border-subtle)] mx-1" />

        <button
          type="button"
          onClick={() => insertSyntax('## ', '', 'Section Title')}
          className="p-1 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors"
          title="Heading"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('`', '`', 'code')}
          className="p-1 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors"
          title={t.editor.code}
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('[', '](https://example.com)', 'Link label')}
          className="p-1 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors"
          title={t.editor.link}
        >
          <Link className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('> [!NOTE]\n> ', '', 'Alert message')}
          className="p-1 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors"
          title={t.editor.quote}
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-px bg-[var(--border-subtle)] mx-1" />

        <button
          type="button"
          onClick={() => insertSyntax('$$\n', '\n$$', '\\int_0^\\infty e^{-x} dx = 1')}
          className="px-1.5 py-0.5 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 text-xs font-mono"
          title={t.editor.math}
        >
          <Sigma className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
          <span>Math</span>
        </button>

        <button
          type="button"
          onClick={() =>
            insertSyntax(
              '```mermaid\nflowchart TD\n    A[Start] --> B{Process}\n    B -->|Yes| C[Complete]\n    B -->|No| D[Retry]\n```\n',
              ''
            )
          }
          className="px-1.5 py-0.5 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 text-xs font-mono"
          title={t.editor.mermaid}
        >
          <Network className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
          <span>Mermaid</span>
        </button>

        <button
          type="button"
          onClick={() =>
            insertSyntax(
              '| Column 1 | Column 2 |\n| :--- | :--- |\n| Data A | Data B |\n',
              ''
            )
          }
          className="p-1 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors"
          title={t.editor.table}
        >
          <Table className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertSyntax('- [ ] ', '', 'Task item')}
          className="p-1 rounded hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors"
          title={t.editor.task}
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Area with Line Numbers */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-4 select-none font-mono text-xs text-[var(--text-muted)] text-right pr-3 bg-[var(--bg-canvas)] border-r border-[var(--border-subtle)]/60 overflow-hidden opacity-60 flex flex-col leading-[1.65]"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={t.editor.placeholder}
          className="flex-1 w-full h-full p-4 resize-none font-mono text-[14px] leading-[1.65] bg-[var(--bg-canvas)] text-[var(--text-primary)] outline-none overflow-y-auto selection:bg-[var(--accent-amber)]/20"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
