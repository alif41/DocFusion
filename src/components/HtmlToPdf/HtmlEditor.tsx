import React, { useState, useRef, useEffect } from 'react';
import {
  Code,
  Copy,
  Check,
  Trash2,
  Maximize2,
  Minimize2,
  Sparkles,
  ClipboardPaste,
  AlertCircle,
  FileCode,
  AlignLeft,
  Undo2,
  X,
} from 'lucide-react';

interface HtmlEditorProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const HtmlEditor: React.FC<HtmlEditorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletedHistory, setDeletedHistory] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Split lines for line numbers
  const lines = value.split('\n');
  const lineCount = lines.length;

  // Basic HTML validation
  useEffect(() => {
    if (!value.trim()) {
      setValidationWarning(null);
      return;
    }

    // Check basic tag balance
    const openTags = (value.match(/<(?!\/)[a-zA-Z0-9]+(?:\s+[^>]*)?>/g) || []).map((t) =>
      t.replace(/<([a-zA-Z0-9]+)[\s\S]*/, '$1').toLowerCase()
    );
    const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link', 'col', 'base'];
    const filteredOpen = openTags.filter((tag) => !selfClosing.includes(tag));

    const closeTags = (value.match(/<\/[a-zA-Z0-9]+>/g) || []).map((t) =>
      t.replace(/<\/([a-zA-Z0-9]+)>/, '$1').toLowerCase()
    );

    if (Math.abs(filteredOpen.length - closeTags.length) > 5) {
      setValidationWarning(
        `Notice: Possible unclosed HTML tag detected (${filteredOpen.length} open vs ${closeTags.length} close tags).`
      );
    } else {
      setValidationWarning(null);
    }
  }, [value]);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text);
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = () => {
    if (!value) return;
    if (!showConfirmDelete && value.trim().length > 30) {
      setShowConfirmDelete(true);
      return;
    }
    setDeletedHistory(value);
    onChange('');
    setShowConfirmDelete(false);
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  const handleUndoDelete = () => {
    if (deletedHistory !== null) {
      onChange(deletedHistory);
      setDeletedHistory(null);
    }
  };

  const handleFormat = () => {
    // Simple HTML indentation formatter
    try {
      let formatted = '';
      let indent = 0;
      const tab = '  ';
      const clean = value.replace(/>\s*</g, '><').trim();
      const tokens = clean.split(/(<[^>]+>)/g).filter(Boolean);

      tokens.forEach((token) => {
        if (token.startsWith('</')) {
          indent = Math.max(0, indent - 1);
          formatted += '\n' + tab.repeat(indent) + token;
        } else if (token.startsWith('<') && !token.endsWith('/>') && !token.startsWith('<!')) {
          const tagName = token.replace(/<([a-zA-Z0-9]+)[\s\S]*/, '$1').toLowerCase();
          const isVoid = ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName);
          formatted += '\n' + tab.repeat(indent) + token;
          if (!isVoid) indent++;
        } else if (token.startsWith('<!')) {
          formatted += token;
        } else {
          const text = token.trim();
          if (text) formatted += text;
        }
      });

      onChange(formatted.trim());
    } catch {
      // fallback
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#0e0e1a] border border-[#222236] rounded-3xl overflow-hidden shadow-2xl transition-all ${
        isFullScreen ? 'fixed inset-4 z-50 rounded-2xl shadow-black/80' : 'h-[580px]'
      }`}
    >
      {/* Editor Top Toolbar */}
      <div className="bg-[#141424] border-b border-[#24243a] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-white tracking-wide">
            <Code className="w-4 h-4 text-[#a78bfa]" />
            <span>HTML &amp; CSS Source</span>
          </div>

          <span className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
            {lineCount} lines
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleFormat}
            disabled={disabled || !value}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40"
            title="Auto-format HTML Indentation"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handlePaste}
            disabled={disabled}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Paste HTML from Clipboard"
          >
            <ClipboardPaste className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={disabled || !value}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Delete Option with Confirmation & Undo */}
          {showConfirmDelete ? (
            <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/40 rounded-xl p-0.5">
              <button
                type="button"
                onClick={handleDelete}
                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-md"
                title="Confirm delete all HTML & CSS code"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete?</span>
              </button>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
                title="Cancel deletion"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled || !value}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              title="Delete HTML & CSS code from editor"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          {/* Undo Delete Option */}
          {deletedHistory !== null && (
            <button
              type="button"
              onClick={handleUndoDelete}
              disabled={disabled}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 transition-all cursor-pointer"
              title="Restore previously deleted HTML"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo Delete</span>
            </button>
          )}

          <div className="h-4 w-px bg-neutral-700 mx-1" />

          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Editor'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Body: Line Numbers + Textarea */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs sm:text-[13px] leading-relaxed">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-12 sm:w-14 bg-[#0a0a14] border-r border-[#1f1f32] text-neutral-600 select-none py-3 pr-2.5 text-right font-mono text-[11px] sm:text-xs overflow-hidden"
        >
          {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
            <div key={i} className="leading-relaxed">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          disabled={disabled}
          placeholder="<!-- Type or paste your own HTML & CSS code here -->&#10;<!DOCTYPE html>&#10;<html>&#10;<head>&#10;  <meta charset=&quot;UTF-8&quot;>&#10;  <title>My Document</title>&#10;  <style>&#10;    body {&#10;      font-family: system-ui, sans-serif;&#10;      padding: 32px;&#10;      color: #111827;&#10;    }&#10;    h1 {&#10;      color: #4f46e5;&#10;    }&#10;  </style>&#10;</head>&#10;<body>&#10;  <h1>My Custom Document</h1>&#10;  <p>Write or paste your custom HTML code here...</p>&#10;</body>&#10;</html>"
          className="flex-1 w-full h-full bg-transparent text-emerald-300 placeholder:text-neutral-600 p-3 outline-none resize-none overflow-auto font-mono scrollbar-thin selection:bg-[#7c3aed]/40 selection:text-white"
          spellCheck={false}
        />
      </div>

      {/* Bottom Status / Validation Warning / Delete Notification Bar */}
      {deletedHistory !== null && !value ? (
        <div className="bg-[#141424] border-t border-[#24243a] px-4 py-2 flex items-center justify-between gap-2 text-xs text-neutral-300">
          <div className="flex items-center gap-1.5 text-rose-300">
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>HTML &amp; CSS source code was deleted.</span>
          </div>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo / Restore Code</span>
          </button>
        </div>
      ) : validationWarning ? (
        <div className="bg-[#141424] border-t border-[#24243a] px-4 py-2 flex items-center gap-2 text-xs text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="truncate">{validationWarning}</span>
        </div>
      ) : null}
    </div>
  );
};
