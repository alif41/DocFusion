import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Image as ImageIcon,
  Table as TableIcon,
  Code,
  FileText,
  Check,
} from 'lucide-react';
import { PdfToMarkdownOptions } from '../types';

interface ConversionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: PdfToMarkdownOptions;
  totalPages: number;
  onApply: (newOptions: PdfToMarkdownOptions) => void;
}

export const ConversionSettingsModal: React.FC<ConversionSettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  totalPages,
  onApply,
}) => {
  const [localOptions, setLocalOptions] = useState<PdfToMarkdownOptions>({ ...options });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(localOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#141420] border border-slate-200 dark:border-[#26263a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#222234] bg-slate-50 dark:bg-[#171725]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Conversion Settings</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Configure OCR, structure detection &amp; export format</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#252538] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin text-xs">
          {/* Page Range Selection */}
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-800 dark:text-neutral-200">
              Page Range Selection
            </label>
            <input
              type="text"
              value={localOptions.pageRange}
              onChange={(e) => setLocalOptions({ ...localOptions, pageRange: e.target.value })}
              placeholder={`e.g. all or 1-${totalPages} or 1, 3, 5-8`}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c0c14] border border-slate-300 dark:border-[#2b2b40] rounded-xl text-slate-900 dark:text-neutral-200 font-mono focus:border-[#7c3aed] focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 dark:text-neutral-500">
              Total document pages: {totalPages}. Type &quot;all&quot; or specify intervals like 1-5, 8.
            </span>
          </div>

          {/* OCR Engine Strategy */}
          <div className="space-y-2">
            <label className="font-medium text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
              <span>OCR Strategy (Scanned PDFs)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto', label: 'Auto Detect', desc: 'OCR on scanned pages' },
                { id: 'always', label: 'Force OCR', desc: 'All pages via OCR' },
                { id: 'never', label: 'Text Only', desc: 'Skip OCR (Fast)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalOptions({ ...localOptions, ocrStrategy: opt.id as any })}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    localOptions.ocrStrategy === opt.id
                      ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-[#7c3aed] dark:text-white shadow-xs font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-[#0f0f18] dark:border-[#222234] dark:text-neutral-400 dark:hover:border-[#33334d]'
                  }`}
                >
                  <span className="text-xs">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 dark:text-neutral-500 mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* OCR Language */}
          {localOptions.ocrStrategy !== 'never' && (
            <div className="space-y-1.5">
              <label className="block font-medium text-slate-800 dark:text-neutral-200">
                Primary OCR Language
              </label>
              <select
                value={localOptions.ocrLanguage}
                onChange={(e) => setLocalOptions({ ...localOptions, ocrLanguage: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c0c14] border border-slate-300 dark:border-[#2b2b40] rounded-xl text-slate-900 dark:text-neutral-200 focus:border-[#7c3aed] focus:outline-none"
              >
                <option value="eng">English (eng)</option>
                <option value="spa">Spanish (spa)</option>
                <option value="fra">French (fra)</option>
                <option value="deu">German (deu)</option>
                <option value="ita">Italian (ita)</option>
                <option value="por">Portuguese (por)</option>
                <option value="jpn">Japanese (jpn)</option>
                <option value="chi_sim">Chinese Simplified (chi_sim)</option>
              </select>
            </div>
          )}

          {/* Image Handling */}
          <div className="space-y-2">
            <label className="font-medium text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Extracted Images in Markdown</span>
            </label>
            <div className="space-y-1.5">
              {[
                {
                  id: 'extract_folder',
                  label: 'Reference Folder: ![Image](images/page_1_img_1.png)',
                  desc: 'Recommended. Clean markdown syntax bundled with extracted images inside export ZIP.',
                },
                {
                  id: 'inline_base64',
                  label: 'Inline Base64 Data URLs: ![Image](data:image/...)',
                  desc: 'Self-contained single Markdown file without needing external image files.',
                },
                {
                  id: 'skip',
                  label: 'Skip Image Extraction',
                  desc: 'Converts text, tables, and headings only.',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    localOptions.imageMode === opt.id
                      ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-slate-900 dark:text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 dark:bg-[#0f0f18] dark:border-[#222234] dark:text-neutral-400 dark:hover:border-[#33334d]'
                  }`}
                >
                  <input
                    type="radio"
                    name="imageMode"
                    value={opt.id}
                    checked={localOptions.imageMode === opt.id}
                    onChange={() => setLocalOptions({ ...localOptions, imageMode: opt.id as any })}
                    className="mt-0.5 accent-[#7c3aed]"
                  />
                  <div>
                    <span className="font-medium text-slate-900 dark:text-neutral-200 block">{opt.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-500 mt-0.5 block">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Structure & Layout Toggles */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-[#222234]">
            <label className="block font-medium text-slate-800 dark:text-neutral-200">
              Structure &amp; Formatting
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#0f0f18] dark:border-[#222234] cursor-pointer hover:border-slate-300 dark:hover:border-[#33334d]">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
                  <span className="text-slate-800 dark:text-neutral-200">Detect and Format Markdown Tables (GFM)</span>
                </div>
                <input
                  type="checkbox"
                  checked={localOptions.detectTables}
                  onChange={(e) => setLocalOptions({ ...localOptions, detectTables: e.target.checked })}
                  className="rounded accent-[#7c3aed]"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#0f0f18] dark:border-[#222234] cursor-pointer hover:border-slate-300 dark:hover:border-[#33334d]">
                <div className="flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-slate-800 dark:text-neutral-200">Detect Code Blocks &amp; Monospace Lines</span>
                </div>
                <input
                  type="checkbox"
                  checked={localOptions.detectCodeBlocks}
                  onChange={(e) => setLocalOptions({ ...localOptions, detectCodeBlocks: e.target.checked })}
                  className="rounded accent-[#7c3aed]"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#0f0f18] dark:border-[#222234] cursor-pointer hover:border-slate-300 dark:hover:border-[#33334d]">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-slate-800 dark:text-neutral-200">Include Document Metadata (YAML Frontmatter)</span>
                </div>
                <input
                  type="checkbox"
                  checked={localOptions.includeFrontmatter}
                  onChange={(e) => setLocalOptions({ ...localOptions, includeFrontmatter: e.target.checked })}
                  className="rounded accent-[#7c3aed]"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#0f0f18] dark:border-[#222234] cursor-pointer hover:border-slate-300 dark:hover:border-[#33334d]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                  <span className="text-slate-800 dark:text-neutral-200">Strip Isolated Page Numbers &amp; Footers</span>
                </div>
                <input
                  type="checkbox"
                  checked={localOptions.cleanPageArtifacts}
                  onChange={(e) => setLocalOptions({ ...localOptions, cleanPageArtifacts: e.target.checked })}
                  className="rounded accent-[#7c3aed]"
                />
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#222234]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1c2b] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white dark:hover:bg-[#28283d] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] font-medium shadow-md shadow-[#7c3aed]/20 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply &amp; Re-Convert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
