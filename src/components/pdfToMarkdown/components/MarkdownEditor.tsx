import React, { useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Table as TableIcon,
  List,
  ListOrdered,
  Quote,
  Minus,
  FileCode,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  Sparkles,
  Check,
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onInsertFrontmatter?: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onInsertFrontmatter,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Helper to wrap or insert text at current cursor selection
  const insertText = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || defaultText;
    const replacement = `${before}${selected}${after}`;

    const nextValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextValue);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(nextValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
      return;
    }

    // Ctrl/Cmd + Z
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        if (onRedo && canRedo) {
          e.preventDefault();
          onRedo();
        }
      } else {
        if (onUndo && canUndo) {
          e.preventDefault();
          onUndo();
        }
      }
    }

    // Ctrl/Cmd + B for bold
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertText('**', '**', 'bold text');
    }

    // Ctrl/Cmd + I for italic
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertText('*', '*', 'italic text');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all Markdown content in the editor?')) {
      onChange('');
    }
  };

  // Metrics
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const chars = value.length;
  const linesCount = value.split('\n').length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#101017] border-r border-slate-200 dark:border-[#1f1f2e] transition-colors">
      {/* Formatting Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#14141f] border-b border-slate-200 dark:border-[#222233] gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Headings */}
          <button
            type="button"
            onClick={() => insertText('# ', '', 'Heading 1')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('## ', '', 'Heading 2')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('### ', '', 'Heading 3')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-[#28283d] mx-0.5" />

          {/* Inline Styles */}
          <button
            type="button"
            onClick={() => insertText('**', '**', 'bold text')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('*', '*', 'italic text')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('~~', '~~', 'strikethrough text')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('`', '`', 'code')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-[#28283d] mx-0.5" />

          {/* Blocks */}
          <button
            type="button"
            onClick={() => insertText('- ', '', 'List item')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Bulleted List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('1. ', '', 'First item')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertText(
                '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n',
                '',
                ''
              )
            }
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Insert Table"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('> ', '', 'Quoted text')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('```\n', '\n```', 'code block')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Code Block"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('[', '](https://example.com)', 'link text')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('\n---\n', '', '')}
            className="p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Horizontal Divider"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-1">
          {onInsertFrontmatter && (
            <button
              type="button"
              onClick={onInsertFrontmatter}
              className="flex items-center gap-1 px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-[#7c3aed] dark:bg-[#1c1c2c] dark:hover:bg-[#28283f] dark:text-[#c4b5fd] text-[11px] font-mono border border-purple-200 dark:border-[#3730a3]/30 transition-colors cursor-pointer"
              title="Add YAML Frontmatter metadata"
            >
              <Sparkles className="w-3 h-3 text-[#7c3aed] dark:text-[#a78bfa]" />
              <span>Frontmatter</span>
            </button>
          )}

          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onRedo && (
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 p-1.5 rounded text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#232336] transition-colors cursor-pointer"
            title="Copy all Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Clear all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 relative flex">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="# Clean Markdown will appear here...&#10;&#10;Upload a PDF or begin writing directly."
          className="w-full h-full p-4 bg-transparent text-slate-900 dark:text-[#e2e8f0] font-mono text-[13px] leading-relaxed resize-none outline-none border-none focus:ring-0 selection:bg-[#7c3aed]/25 placeholder:text-slate-400 dark:placeholder:text-neutral-600 scrollbar-thin"
          spellCheck={false}
        />
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-[#14141f] border-t border-slate-200 dark:border-[#222233] text-[11px] font-mono text-slate-600 dark:text-neutral-400 select-none">
        <div className="flex items-center gap-3">
          <span>{words.toLocaleString()} words</span>
          <span>{chars.toLocaleString()} chars</span>
          <span>{linesCount} lines</span>
        </div>
        <div className="flex items-center gap-2">
          <span>~{readingTimeMinutes} min read</span>
          <span className="text-slate-300 dark:text-neutral-600">|</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">GFM Ready</span>
        </div>
      </div>
    </div>
  );
};
