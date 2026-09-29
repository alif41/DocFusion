import React, { useState } from 'react';
import {
  X,
  Download,
  FileArchive,
  Copy,
  Check,
  FileText,
  Layers,
  Table as TableIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { ConversionStats, ExtractedImageItem } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
  images: ExtractedImageItem[];
  stats?: ConversionStats;
  originalFilename: string;
  onDownloadMd: (customFilename: string) => void;
  onDownloadZip: (customFilename: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  markdown,
  images,
  stats,
  originalFilename,
  onDownloadMd,
  onDownloadZip,
}) => {
  const defaultName = originalFilename.replace(/\.pdf$/i, '') || 'document';
  const [filename, setFilename] = useState(defaultName);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#141420] border border-slate-200 dark:border-[#26263a] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#222234] bg-slate-50 dark:bg-[#171725]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Export Markdown</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Download formatted document or copy text</p>
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Filename Input */}
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-800 dark:text-neutral-200">
              Filename
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="document"
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#0c0c14] border border-slate-300 dark:border-[#2b2b40] rounded-xl text-slate-900 dark:text-neutral-200 font-mono focus:border-[#7c3aed] focus:outline-none"
              />
              <span className="font-mono text-slate-600 dark:text-neutral-400 text-xs px-2.5 py-2 bg-slate-100 dark:bg-[#171725] rounded-xl border border-slate-200 dark:border-[#28283d]">
                .md
              </span>
            </div>
          </div>

          {/* Document Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-[#0d0d16] rounded-xl border border-slate-200 dark:border-[#222234]">
              <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                <FileText className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
                <span>{stats.wordCount.toLocaleString()} Words</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>{stats.convertedPages} Pages</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                <TableIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{stats.tableCount} Tables</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>{stats.imageCount} Images</span>
              </div>
            </div>
          )}

          {/* Download Options */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#222234]">
            {/* Download .md */}
            <button
              type="button"
              onClick={() => {
                onDownloadMd(filename);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-all shadow-md shadow-[#7c3aed]/20 font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <div className="text-left">
                  <span className="block font-semibold">Download Markdown (.md)</span>
                  <span className="block text-[10px] text-white/80">Clean standalone Markdown file</span>
                </div>
              </div>
              <Download className="w-4 h-4" />
            </button>

            {/* Download ZIP with images */}
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onDownloadZip(filename);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20 font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileArchive className="w-4 h-4" />
                  <div className="text-left">
                    <span className="block font-semibold">Download ZIP Package (.zip)</span>
                    <span className="block text-[10px] text-white/80">
                      Markdown file + {images.length} extracted images in images/
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Copy Markdown */}
            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1c2b] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white dark:hover:bg-[#28283d] border border-slate-200 dark:border-transparent transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Markdown to Clipboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
