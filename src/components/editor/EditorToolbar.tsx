import React from 'react';
import {
  MousePointer,
  Type,
  PenTool,
  Highlighter,
  FileSignature,
  Square,
  Stamp,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Download,
  ChevronLeft,
  ChevronRight,
  Bold,
  Palette,
  Sparkles,
  ShieldAlert,
  Plus,
} from 'lucide-react';
import { EditorTool, ShapeType } from '../../types/pdf';
import { Button } from '../common/Button';

interface EditorToolbarProps {
  currentTool: EditorTool;
  onToolSelect: (tool: EditorTool) => void;

  // Text options
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier';
  onFontFamilyChange: (family: 'Helvetica' | 'TimesRoman' | 'Courier') => void;
  isBold: boolean;
  onBoldToggle: () => void;
  textBgColor: string;
  onTextBgColorChange: (color: string) => void;

  // Drawing options
  penWidth: number;
  onPenWidthChange: (w: number) => void;
  penColor: string;
  onPenColorChange: (c: string) => void;

  // Highlighter options
  highlighterColor: string;
  onHighlighterColorChange: (c: string) => void;

  // Shape options
  currentShapeType: ShapeType;
  onShapeTypeChange: (type: ShapeType) => void;

  // Stamp options
  onStampSelect: (label: string, color: string, bgColor: string) => void;

  // Signature trigger
  onOpenSignatureModal: () => void;

  // Page navigation
  currentPage: number;
  numPages: number;
  onPageChange: (page: number) => void;
  onRotatePage: () => void;
  onDeletePage: () => void;
  onAddPage?: () => void;

  // Zoom
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;

  // Undo & Save
  onUndo: () => void;
  canUndo: boolean;
  onSaveExport: () => void;
  isSaving: boolean;
}

const TEXT_COLORS = [
  '#000000',
  '#1e293b',
  '#dc2626',
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#d97706',
  '#ffffff',
];

const PEN_COLORS = [
  '#000000',
  '#2563eb',
  '#dc2626',
  '#059669',
  '#7c3aed',
  '#ffffff',
];

const HIGHLIGHT_COLORS = [
  '#facc15', // yellow
  '#4ade80', // green
  '#38bdf8', // cyan
  '#f472b6', // pink
  '#c084fc', // purple
];

const STAMPS = [
  { label: 'APPROVED', color: '#16a34a', bgColor: '#dcfce7' },
  { label: 'CONFIDENTIAL', color: '#dc2626', bgColor: '#fee2e2' },
  { label: 'DRAFT', color: '#d97706', bgColor: '#fef3c7' },
  { label: 'FINAL', color: '#2563eb', bgColor: '#dbeafe' },
  { label: 'SIGN HERE', color: '#9333ea', bgColor: '#f3e8ff' },
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentTool,
  onToolSelect,
  fontSize,
  onFontSizeChange,
  textColor,
  onTextColorChange,
  fontFamily,
  onFontFamilyChange,
  isBold,
  onBoldToggle,
  textBgColor,
  onTextBgColorChange,
  penWidth,
  onPenWidthChange,
  penColor,
  onPenColorChange,
  highlighterColor,
  onHighlighterColorChange,
  currentShapeType,
  onShapeTypeChange,
  onStampSelect,
  onOpenSignatureModal,
  currentPage,
  numPages,
  onPageChange,
  onRotatePage,
  onDeletePage,
  onAddPage,
  scale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onUndo,
  canUndo,
  onSaveExport,
  isSaving,
}) => {
  return (
    <div className="sticky top-0 z-30 bg-[#0e0e17] border-b border-[#202033] shadow-xl">
      {/* Primary Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 gap-2">
        {/* Left: Tools Selection */}
        <div className="flex items-center gap-1 bg-[#141422] p-1 rounded-2xl border border-[#232338]">
          <button
            type="button"
            title="Select & Move tool"
            onClick={() => onToolSelect('select')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTool === 'select'
                ? 'bg-[#7c3aed] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>

          <button
            type="button"
            title="Add Text"
            onClick={() => onToolSelect('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTool === 'text'
                ? 'bg-[#7c3aed] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Text</span>
          </button>

          <button
            type="button"
            title="Freehand Draw / Pen"
            onClick={() => onToolSelect('draw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTool === 'draw'
                ? 'bg-[#7c3aed] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Draw</span>
          </button>

          <button
            type="button"
            title="Highlighter"
            onClick={() => onToolSelect('highlight')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTool === 'highlight'
                ? 'bg-[#7c3aed] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Highlight</span>
          </button>

          <button
            type="button"
            title="Redaction & Shapes"
            onClick={() => onToolSelect('shape')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTool === 'shape'
                ? 'bg-[#7c3aed] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shapes</span>
          </button>

          <button
            type="button"
            title="Stamps"
            onClick={() => onToolSelect('stamp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTool === 'stamp'
                ? 'bg-[#7c3aed] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Stamp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stamp</span>
          </button>

          <button
            type="button"
            title="Place Signature"
            onClick={() => {
              onOpenSignatureModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all ml-1"
          >
            <FileSignature className="w-3.5 h-3.5" />
            <span>Sign</span>
          </button>
        </div>

        {/* Center: Page Controls & Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#141422] rounded-xl border border-[#232338] px-2 py-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-white">
              {currentPage} / {numPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="p-1 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate & Delete Page */}
          <button
            type="button"
            onClick={onRotatePage}
            title="Rotate current page 90°"
            className="p-2 rounded-xl bg-[#141422] border border-[#232338] text-neutral-300 hover:text-white hover:border-[#7c3aed]/40 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDeletePage}
            disabled={numPages <= 1}
            title={numPages <= 1 ? 'Cannot delete the only page' : 'Delete current page'}
            className="p-2 rounded-xl bg-[#141422] border border-[#232338] text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Add Page Button */}
          {onAddPage && (
            <button
              type="button"
              onClick={onAddPage}
              title="Append a new blank A4 page"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141422] hover:bg-[#1f1f33] border border-[#2b2b40] hover:border-[#7c3aed]/50 text-xs font-semibold text-[#c4b5fd] hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Page</span>
            </button>
          )}
        </div>

        {/* Right: Zoom & Save Action */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden lg:flex items-center bg-[#141422] rounded-xl border border-[#232338] p-1">
            <button
              type="button"
              onClick={onZoomOut}
              className="p-1 text-neutral-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onZoomReset}
              className="text-[11px] font-mono px-2 text-neutral-300 hover:text-white"
              title="Reset 100%"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={onZoomIn}
              className="p-1 text-neutral-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Undo */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last action"
            className="p-2 rounded-xl bg-[#141422] border border-[#232338] text-neutral-300 hover:text-white disabled:opacity-30 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Save / Export CTA */}
          <Button
            variant="primary"
            size="sm"
            onClick={onSaveExport}
            isLoading={isSaving}
            disabled={isSaving}
            leftIcon={<Download className="w-4 h-4 text-white" />}
            className="shadow-md shadow-[#7c3aed]/25 font-semibold text-xs px-4"
          >
            {isSaving ? 'Baking PDF...' : 'Save & Download'}
          </Button>
        </div>
      </div>

      {/* Secondary Property Row (Contextual to active tool) */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#0a0a10] border-t border-[#1a1a29] text-xs">
        {currentTool === 'text' && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-400">Text Props:</span>
            {/* Font Family */}
            <select
              value={fontFamily}
              onChange={(e) => onFontFamilyChange(e.target.value as any)}
              className="bg-[#141422] border border-[#252538] text-neutral-200 text-xs rounded-lg px-2 py-1 outline-hidden"
            >
              <option value="Helvetica">Helvetica</option>
              <option value="TimesRoman">Times Roman</option>
              <option value="Courier">Courier Code</option>
            </select>

            {/* Font Size */}
            <select
              value={fontSize}
              onChange={(e) => onFontSizeChange(parseInt(e.target.value, 10))}
              className="bg-[#141422] border border-[#252538] text-neutral-200 text-xs rounded-lg px-2 py-1 outline-hidden"
            >
              <option value={10}>10 pt</option>
              <option value={12}>12 pt</option>
              <option value={14}>14 pt</option>
              <option value={18}>18 pt</option>
              <option value={24}>24 pt</option>
              <option value={32}>32 pt</option>
            </select>

            {/* Bold */}
            <button
              type="button"
              onClick={onBoldToggle}
              className={`p-1.5 rounded-lg border transition-all ${
                isBold
                  ? 'bg-[#7c3aed]/25 border-[#7c3aed] text-white'
                  : 'bg-[#141422] border-[#252538] text-neutral-400 hover:text-white'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Color Palette */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#222234]">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onTextColorChange(c)}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    textColor === c
                      ? 'scale-125 border-white ring-2 ring-[#7c3aed]'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Background highlight */}
            <div className="flex items-center gap-1 pl-2 border-l border-[#222234]">
              <span className="text-[10px] font-mono text-neutral-400">Highlight:</span>
              <button
                type="button"
                onClick={() => onTextBgColorChange(textBgColor === '#fef08a' ? 'transparent' : '#fef08a')}
                className={`px-1.5 py-0.5 rounded text-[10px] border ${
                  textBgColor === '#fef08a'
                    ? 'bg-yellow-400/30 border-yellow-400 text-yellow-300 font-bold'
                    : 'bg-[#141422] border-[#252538] text-neutral-400 hover:text-white'
                }`}
              >
                Yellow
              </button>
            </div>

            <span className="text-[11px] text-neutral-400 pl-2">
              (Click anywhere on the document to place text box)
            </span>
          </div>
        )}

        {currentTool === 'draw' && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-400">Pen Settings:</span>

            {/* Stroke Width */}
            <div className="flex items-center gap-1 bg-[#141422] p-0.5 rounded-lg border border-[#252538]">
              {[2, 4, 8].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onPenWidthChange(w)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    penWidth === w ? 'bg-[#7c3aed] text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>

            {/* Pen Colors */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#222234]">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onPenColorChange(c)}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    penColor === c
                      ? 'scale-125 border-white ring-2 ring-[#7c3aed]'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <span className="text-[11px] text-neutral-400 pl-2">
              (Draw with mouse or finger directly on page)
            </span>
          </div>
        )}

        {currentTool === 'highlight' && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-400">Highlighter Color:</span>
            <div className="flex items-center gap-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onHighlighterColorChange(c)}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    highlighterColor === c
                      ? 'scale-125 border-white ring-2 ring-[#7c3aed]'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <span className="text-[11px] text-neutral-400 pl-2">
              (Semi-transparent stroke for highlighting lines of text)
            </span>
          </div>
        )}

        {currentTool === 'shape' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400">Shape / Redact Type:</span>
            <button
              type="button"
              onClick={() => onShapeTypeChange('blackout')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
                currentShapeType === 'blackout'
                  ? 'bg-black text-white border-[#7c3aed] ring-1 ring-[#7c3aed]'
                  : 'bg-[#141422] border-[#252538] text-neutral-300 hover:text-white'
              }`}
            >
              <div className="w-2.5 h-2.5 bg-black border border-white/40 rounded-xs" />
              <span>Blackout Redaction</span>
            </button>

            <button
              type="button"
              onClick={() => onShapeTypeChange('whiteout')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
                currentShapeType === 'whiteout'
                  ? 'bg-white text-black border-[#7c3aed] ring-1 ring-[#7c3aed]'
                  : 'bg-[#141422] border-[#252538] text-neutral-300 hover:text-white'
              }`}
            >
              <div className="w-2.5 h-2.5 bg-white border border-neutral-400 rounded-xs" />
              <span>Whiteout Box</span>
            </button>

            <button
              type="button"
              onClick={() => onShapeTypeChange('highlight')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
                currentShapeType === 'highlight'
                  ? 'bg-yellow-400/20 text-yellow-300 border-[#7c3aed] ring-1 ring-[#7c3aed]'
                  : 'bg-[#141422] border-[#252538] text-neutral-300 hover:text-white'
              }`}
            >
              <div className="w-2.5 h-2.5 bg-yellow-400/60 rounded-xs" />
              <span>Highlight Box</span>
            </button>

            <button
              type="button"
              onClick={() => onShapeTypeChange('border')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
                currentShapeType === 'border'
                  ? 'bg-[#141422] text-blue-400 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-[#141422] border-[#252538] text-neutral-300 hover:text-white'
              }`}
            >
              <div className="w-2.5 h-2.5 border-2 border-blue-400 rounded-xs" />
              <span>Framing Border</span>
            </button>

            <span className="text-[11px] text-neutral-400 pl-2">
              (Click on page to place shape, then resize or drag)
            </span>
          </div>
        )}

        {currentTool === 'stamp' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400">Click to Stamp on Page:</span>
            {STAMPS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onStampSelect(s.label, s.color, s.bgColor)}
                className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase border transition-all hover:scale-105"
                style={{
                  color: s.color,
                  backgroundColor: s.bgColor,
                  borderColor: s.color,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {currentTool === 'select' && (
          <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
            <span>💡 Select Mode: Click and drag any placed text box, signature, or shape to reposition or resize.</span>
          </div>
        )}
      </div>
    </div>
  );
};
