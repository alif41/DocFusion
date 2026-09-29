import React from 'react';
import { Check, Eye, FileText } from 'lucide-react';
import { SplitMode } from '../../types/pdf';

interface SplitPageGridProps {
  totalPageCount: number;
  selectedPages: number[];
  onTogglePage: (pageNumber: number) => void;
  onPreviewPage?: (pageNumber: number) => void;
  mode: SplitMode;
}

export const SplitPageGrid: React.FC<SplitPageGridProps> = ({
  totalPageCount,
  selectedPages,
  onTogglePage,
  onPreviewPage,
  mode,
}) => {
  const pages = Array.from({ length: totalPageCount }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
        <span>Document Pages Overview ({totalPageCount} Total)</span>
        {mode === 'extract' && (
          <span className="text-[#a78bfa]">
            Click any page card to toggle selection
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 max-h-[500px] overflow-y-auto p-1.5 custom-scrollbar">
        {pages.map((pageNum) => {
          const isSelected = selectedPages.includes(pageNum);
          const isExtractMode = mode === 'extract';

          return (
            <div
              key={pageNum}
              onClick={() => isExtractMode && onTogglePage(pageNum)}
              className={`group relative rounded-2xl border transition-all duration-200 p-3 flex flex-col justify-between select-none ${
                isExtractMode ? 'cursor-pointer' : 'cursor-default'
              } ${
                isSelected && isExtractMode
                  ? 'border-[#7c3aed] bg-[#7c3aed]/15 shadow-lg shadow-[#7c3aed]/20 ring-1 ring-[#7c3aed]'
                  : 'border-[#202030] bg-[#101018] hover:border-[#303046] hover:bg-[#141420]'
              }`}
            >
              {/* Top Bar of Card */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-mono font-bold text-white px-2 py-0.5 rounded-md bg-[#191928] border border-[#2b2b3f]">
                  #{pageNum}
                </span>

                {isExtractMode ? (
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#7c3aed] text-white shadow-sm'
                        : 'border border-[#2d2d42] bg-[#161622] text-transparent group-hover:border-[#7c3aed]/50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-500">
                    p.{pageNum}
                  </span>
                )}
              </div>

              {/* Miniature Document Representation */}
              <div className="relative aspect-[3/4] rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 flex flex-col justify-between overflow-hidden group-hover:border-[#7c3aed]/40 transition-colors">
                <div className="space-y-1.5 opacity-60">
                  <div className="w-3/4 h-1.5 rounded-full bg-white/20" />
                  <div className="w-full h-1 rounded-full bg-white/10" />
                  <div className="w-5/6 h-1 rounded-full bg-white/10" />
                  <div className="w-2/3 h-1 rounded-full bg-white/10" />
                </div>

                <div className="flex items-center justify-center py-2 text-neutral-400 group-hover:text-white transition-colors">
                  <FileText className="w-6 h-6 stroke-[1.5]" />
                </div>

                <div className="space-y-1 opacity-40">
                  <div className="w-full h-1 rounded-full bg-white/10" />
                  <div className="w-4/5 h-1 rounded-full bg-white/10" />
                </div>

                {/* Inspect Page Hover Button */}
                {onPreviewPage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewPage(pageNum);
                    }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-[11px] font-mono text-white transition-opacity cursor-pointer"
                    title={`Inspect Page ${pageNum}`}
                  >
                    <Eye className="w-3.5 h-3.5 text-[#a78bfa]" />
                    <span>Inspect</span>
                  </button>
                )}
              </div>

              {/* Status footer */}
              <div className="mt-2 text-center">
                <span className="text-[10px] font-mono text-neutral-400">
                  {isExtractMode
                    ? isSelected
                      ? 'Selected'
                      : 'Skip'
                    : 'Included'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
