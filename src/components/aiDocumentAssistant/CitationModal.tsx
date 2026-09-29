import React from 'react';
import { X, BookOpen, Layers } from 'lucide-react';
import { DocumentPageSummary } from './types';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageSummary: DocumentPageSummary | null;
  filename: string;
}

export const CitationModal: React.FC<CitationModalProps> = ({
  isOpen,
  onClose,
  pageSummary,
  filename,
}) => {
  if (!isOpen || !pageSummary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0e0e1a] border border-[#2b2b44] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202034]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/40 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Citation Reference: Page {pageSummary.pageNumber}</span>
              </h3>
              <p className="text-[11px] font-mono text-neutral-400 truncate max-w-xs sm:max-w-md">
                {filename}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Excerpt */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
            <span className="flex items-center gap-1 text-[#c084fc]">
              <Layers className="w-3.5 h-3.5" />
              Page {pageSummary.pageNumber}
            </span>
            <span>•</span>
            <span>{pageSummary.wordCount} words</span>
            <span>•</span>
            <span>{pageSummary.charCount} characters</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-[#202034] text-xs sm:text-sm text-neutral-200 font-sans leading-relaxed whitespace-pre-wrap select-text">
            {pageSummary.preview ? (
              <p>{pageSummary.preview}</p>
            ) : (
              <p className="italic text-neutral-500">Visual layout or table elements on this page.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1a1a2e] hover:bg-[#252540] text-xs font-semibold text-white border border-[#2d2d46] transition-colors cursor-pointer"
          >
            Close Excerpt
          </button>
        </div>
      </div>
    </div>
  );
};
