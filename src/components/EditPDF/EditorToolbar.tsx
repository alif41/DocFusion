import React, { useRef } from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Type,
  Heading,
  Image as ImageIcon,
  Table as TableIcon,
  Link as LinkIcon,
  Trash2,
  Search,
  Download,
  Save,
  RotateCcw,
  Sparkles,
  Check,
  Loader2,
  Plus,
  Minus,
  Maximize2,
} from 'lucide-react';
import { FontName, TextElement, DocumentElement } from './types';

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  selectedElement: DocumentElement | null;
  onUpdateSelectedText: (updates: Partial<TextElement>) => void;
  onInsertTextBox: () => void;
  onInsertHeading: () => void;
  onInsertImage: (file: File) => void;
  onInsertTable: () => void;
  onDeleteSelected: () => void;
  onToggleSearch: () => void;
  onExportPDF: () => void;
  onSaveAsNewPDF: () => void;
  onRestoreOriginal: () => void;
  autosaveStatus: 'saved' | 'saving' | 'error';
  isOCRUsed?: boolean;
  docTitle: string;
  onDocTitleChange: (newTitle: string) => void;
}

const FONT_FAMILIES: { label: string; value: FontName }[] = [
  { label: 'Inter (Modern Sans)', value: 'Inter' },
  { label: 'Helvetica / Arial', value: 'Helvetica' },
  { label: 'Times New Roman (Serif)', value: 'Times New Roman' },
  { label: 'Georgia (Editorial)', value: 'Georgia' },
  { label: 'Courier New (Monospace)', value: 'Courier New' },
];

const PRESET_FONT_SIZES = [9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedElement,
  onUpdateSelectedText,
  onInsertTextBox,
  onInsertHeading,
  onInsertImage,
  onInsertTable,
  onDeleteSelected,
  onToggleSearch,
  onExportPDF,
  onSaveAsNewPDF,
  onRestoreOriginal,
  autosaveStatus,
  isOCRUsed,
  docTitle,
  onDocTitleChange,
}) => {
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const isTextSelected =
    selectedElement &&
    (selectedElement.type === 'text' ||
      selectedElement.type === 'heading' ||
      selectedElement.type === 'paragraph' ||
      selectedElement.type === 'list_item');

  const textEl = isTextSelected ? (selectedElement as TextElement) : null;

  return (
    <div className="w-full bg-[#141420] border-b border-[#262638] sticky top-0 z-30 shadow-md">
      {/* Top Bar: Title, Status, Export Actions */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#222234]">
        {/* Document Title & Autosave status */}
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="text"
            value={docTitle}
            onChange={(e) => onDocTitleChange(e.target.value)}
            className="bg-transparent text-white font-bold text-sm sm:text-base border border-transparent hover:border-[#383854] focus:border-[#7c3aed] px-2 py-0.5 rounded-lg focus:outline-none transition-all truncate max-w-[200px] sm:max-w-xs"
            title="Click to rename document"
          />

          {/* Autosave Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1a1a2b] border border-[#2d2d42] text-[11px]">
            {autosaveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-amber-300 font-medium">Saving…</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300 font-medium">Saved</span>
              </>
            )}
          </div>

          {/* OCR Badge if applicable */}
          {isOCRUsed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-[11px] text-cyan-300 font-semibold">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              OCR Active
            </span>
          )}
        </div>

        {/* Global Actions: Search, Restore, Export */}
        <div className="flex items-center gap-2">
          {/* Search & Replace */}
          <button
            onClick={onToggleSearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c2e] hover:bg-[#25253c] text-neutral-300 hover:text-white border border-[#2d2d44] text-xs font-semibold transition-all cursor-pointer"
            title="Search & Replace (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span className="hidden sm:inline">Find & Replace</span>
          </button>

          {/* Restore Original */}
          <button
            onClick={onRestoreOriginal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c2e] hover:bg-amber-950/40 text-neutral-300 hover:text-amber-300 border border-[#2d2d44] hover:border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
            title="Discard changes and restore original PDF"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Restore Original</span>
          </button>

          {/* Save as New PDF */}
          <button
            onClick={onSaveAsNewPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c2e] hover:bg-[#282842] text-neutral-200 border border-[#33334e] text-xs font-semibold transition-all cursor-pointer"
            title="Save as a new PDF file preserving original"
          >
            <Save className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span className="hidden sm:inline">Save as Copy</span>
          </button>

          {/* Download PDF (Primary) */}
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#6d28d9] hover:to-[#7e22ce] text-white text-xs font-bold shadow-md shadow-[#7c3aed]/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Document Ribbon Toolbar */}
      <div className="px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-r border-[#262638] pr-2 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Font Family Dropdown */}
        <div className="shrink-0">
          <select
            value={textEl?.fontFamily || 'Inter'}
            onChange={(e) => onUpdateSelectedText({ fontFamily: e.target.value as FontName })}
            disabled={!isTextSelected}
            className="bg-[#1c1c2e] text-white border border-[#2d2d44] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#7c3aed] disabled:opacity-40"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size (+ / - / Select) */}
        <div className="flex items-center gap-1 border-r border-[#262638] pr-2 shrink-0">
          <button
            onClick={() => {
              if (!textEl) return;
              onUpdateSelectedText({ fontSize: Math.max(8, (textEl.fontSize || 12) - 1) });
            }}
            disabled={!isTextSelected}
            className="p-1 rounded-md text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer"
            title="Decrease font size"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <select
            value={textEl?.fontSize || 14}
            onChange={(e) => onUpdateSelectedText({ fontSize: Number(e.target.value) })}
            disabled={!isTextSelected}
            className="bg-[#1c1c2e] text-white border border-[#2d2d44] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#7c3aed] disabled:opacity-40 w-14 text-center font-mono"
          >
            {PRESET_FONT_SIZES.map((sz) => (
              <option key={sz} value={sz}>
                {sz} pt
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              if (!textEl) return;
              onUpdateSelectedText({ fontSize: Math.min(72, (textEl.fontSize || 12) + 1) });
            }}
            disabled={!isTextSelected}
            className="p-1 rounded-md text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer"
            title="Increase font size"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Formatting Toggles: B, I, U, S */}
        <div className="flex items-center gap-0.5 border-r border-[#262638] pr-2 shrink-0">
          <button
            onClick={() =>
              onUpdateSelectedText({
                fontWeight: textEl?.fontWeight === 'bold' ? 'normal' : 'bold',
              })
            }
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer ${
              textEl?.fontWeight === 'bold' ? 'bg-[#7c3aed]/25 text-[#a78bfa] border border-[#7c3aed]/50' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              onUpdateSelectedText({
                fontStyle: textEl?.fontStyle === 'italic' ? 'normal' : 'italic',
              })
            }
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer ${
              textEl?.fontStyle === 'italic' ? 'bg-[#7c3aed]/25 text-[#a78bfa] border border-[#7c3aed]/50' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            onClick={() => onUpdateSelectedText({ underline: !textEl?.underline })}
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer ${
              textEl?.underline ? 'bg-[#7c3aed]/25 text-[#a78bfa] border border-[#7c3aed]/50' : ''
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>

          <button
            onClick={() => onUpdateSelectedText({ strikethrough: !textEl?.strikethrough })}
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer ${
              textEl?.strikethrough ? 'bg-[#7c3aed]/25 text-[#a78bfa] border border-[#7c3aed]/50' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Color & Highlight */}
        <div className="flex items-center gap-1.5 border-r border-[#262638] pr-2 shrink-0">
          <label className="flex items-center gap-1 cursor-pointer" title="Text Color">
            <span className="font-bold underline decoration-4 text-xs" style={{ textDecorationColor: textEl?.color || '#ffffff' }}>
              A
            </span>
            <input
              type="color"
              value={textEl?.color || '#111827'}
              onChange={(e) => onUpdateSelectedText({ color: e.target.value })}
              disabled={!isTextSelected}
              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0 disabled:opacity-40"
            />
          </label>

          <label className="flex items-center gap-1 cursor-pointer" title="Highlight Color">
            <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-black">
              HL
            </span>
            <input
              type="color"
              value={textEl?.backgroundColor && textEl.backgroundColor !== 'transparent' ? textEl.backgroundColor : '#fef08a'}
              onChange={(e) => onUpdateSelectedText({ backgroundColor: e.target.value })}
              disabled={!isTextSelected}
              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0 disabled:opacity-40"
            />
          </label>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 border-r border-[#262638] pr-2 shrink-0">
          <button
            onClick={() => onUpdateSelectedText({ textAlign: 'left' })}
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer ${
              textEl?.textAlign === 'left' || !textEl?.textAlign ? 'bg-[#7c3aed]/25 text-[#a78bfa]' : ''
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => onUpdateSelectedText({ textAlign: 'center' })}
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer ${
              textEl?.textAlign === 'center' ? 'bg-[#7c3aed]/25 text-[#a78bfa]' : ''
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            onClick={() => onUpdateSelectedText({ textAlign: 'right' })}
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer ${
              textEl?.textAlign === 'right' ? 'bg-[#7c3aed]/25 text-[#a78bfa]' : ''
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onUpdateSelectedText({ textAlign: 'justify' })}
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer ${
              textEl?.textAlign === 'justify' ? 'bg-[#7c3aed]/25 text-[#a78bfa]' : ''
            }`}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Indentation */}
        <div className="flex items-center gap-0.5 border-r border-[#262638] pr-2 shrink-0">
          <button
            onClick={() =>
              onUpdateSelectedText({
                listType: textEl?.listType === 'bullet' ? 'none' : 'bullet',
                type: 'list_item',
              })
            }
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer ${
              textEl?.listType === 'bullet' ? 'bg-[#7c3aed]/25 text-[#a78bfa]' : ''
            }`}
            title="Bulleted List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              onUpdateSelectedText({
                listType: textEl?.listType === 'number' ? 'none' : 'number',
                type: 'list_item',
              })
            }
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer ${
              textEl?.listType === 'number' ? 'bg-[#7c3aed]/25 text-[#a78bfa]' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              onUpdateSelectedText({
                indent: Math.max(0, (textEl?.indent || 0) - 1),
              })
            }
            disabled={!isTextSelected}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer"
            title="Decrease Indent"
          >
            <Outdent className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              onUpdateSelectedText({
                indent: Math.min(5, (textEl?.indent || 0) + 1),
              })
            }
            disabled={!isTextSelected}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#202034] disabled:opacity-40 cursor-pointer"
            title="Increase Indent"
          >
            <Indent className="w-4 h-4" />
          </button>
        </div>

        {/* Insert Elements */}
        <div className="flex items-center gap-1 border-r border-[#262638] pr-2 shrink-0">
          <button
            onClick={onInsertTextBox}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1c1c2e] hover:bg-[#25253c] text-neutral-300 hover:text-white border border-[#2d2d44] cursor-pointer"
            title="Insert new editable text block"
          >
            <Type className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>+ Text</span>
          </button>

          <button
            onClick={onInsertHeading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1c1c2e] hover:bg-[#25253c] text-neutral-300 hover:text-white border border-[#2d2d44] cursor-pointer"
            title="Insert Heading"
          >
            <Heading className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Heading</span>
          </button>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onInsertImage(e.target.files[0]);
              }
            }}
          />

          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1c1c2e] hover:bg-[#25253c] text-neutral-300 hover:text-white border border-[#2d2d44] cursor-pointer"
            title="Insert Image"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Image</span>
          </button>

          <button
            onClick={onInsertTable}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1c1c2e] hover:bg-[#25253c] text-neutral-300 hover:text-white border border-[#2d2d44] cursor-pointer"
            title="Insert Table Grid"
          >
            <TableIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Table</span>
          </button>
        </div>

        {/* Delete Element */}
        <div className="shrink-0">
          <button
            onClick={onDeleteSelected}
            disabled={!selectedElement}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-950/30 disabled:opacity-30 cursor-pointer"
            title="Delete selected element (Del / Backspace)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
