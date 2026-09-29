import React from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Trash2, Layers, FileText, Plus } from 'lucide-react';

interface PageThumbnailStripProps {
  numPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
  pageRotations: Record<number, number>;
  onRotatePage: (page: number) => void;
  deletedPages: number[];
  onDeletePage: (page: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddPage?: () => void;
}

export const PageThumbnailStrip: React.FC<PageThumbnailStripProps> = ({
  numPages,
  currentPage,
  onPageSelect,
  pageRotations,
  onRotatePage,
  deletedPages,
  onDeletePage,
  isCollapsed,
  onToggleCollapse,
  onAddPage,
}) => {
  const activePages = Array.from({ length: numPages }, (_, i) => i + 1).filter(
    (p) => !deletedPages.includes(p)
  );

  return (
    <aside
      className={`transition-all duration-300 relative border-r border-[#202033] bg-[#0c0c14] flex flex-col shrink-0 z-20 ${
        isCollapsed ? 'w-12' : 'w-48 sm:w-56'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#1c1c2b]">
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
            <Layers className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>Pages ({activePages.length})</span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Thumbnails' : 'Collapse Thumbnails'}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors ml-auto"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2.5 scrollbar-thin">
        {activePages.map((pageNum) => {
          const isCurrent = pageNum === currentPage;
          const rotation = pageRotations[pageNum] || 0;

          return (
            <div
              key={pageNum}
              onClick={() => onPageSelect(pageNum)}
              className={`group relative rounded-xl border p-2 cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-[#181829] border-[#7c3aed] ring-1 ring-[#7c3aed] shadow-md shadow-[#7c3aed]/10'
                  : 'bg-[#12121e] border-[#222233] hover:border-[#383852] hover:bg-[#151525]'
              }`}
            >
              {/* Miniature Page Sheet */}
              <div className="aspect-[3/4] w-full rounded-lg bg-neutral-900 border border-neutral-700/60 flex flex-col items-center justify-center p-2 relative overflow-hidden shadow-inner">
                <div
                  className="w-full h-full flex flex-col items-center justify-center transition-transform duration-300"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <FileText className="w-7 h-7 text-neutral-500 stroke-[1.2]" />
                  <span className="text-[10px] font-mono text-neutral-400 mt-1">
                    Pg {pageNum}
                  </span>
                </div>

                {rotation !== 0 && (
                  <span className="absolute top-1 left-1 text-[9px] font-mono bg-purple-500/30 text-purple-300 px-1 rounded-xs border border-purple-500/40">
                    {rotation}°
                  </span>
                )}
              </div>

              {/* Label & Quick Actions */}
              {!isCollapsed && (
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#1e1e2d]">
                  <span className="text-xs font-mono text-neutral-300 font-medium">
                    Page {pageNum}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      title="Rotate 90°"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRotatePage(pageNum);
                      }}
                      className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    {activePages.length > 1 && (
                      <button
                        type="button"
                        title="Delete Page"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(pageNum);
                        }}
                        className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Page Footer Action */}
      {onAddPage && (
        <div className="p-2 border-t border-[#1c1c2b] bg-[#0d0d16]">
          {isCollapsed ? (
            <button
              type="button"
              onClick={onAddPage}
              title="Add Blank Page"
              className="w-full py-2 flex items-center justify-center rounded-xl bg-[#181829] hover:bg-[#7c3aed] text-[#a78bfa] hover:text-white transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onAddPage}
              className="w-full py-2 px-3 flex items-center justify-center gap-2 rounded-xl bg-[#181829] hover:bg-[#202035] border border-[#2b2b40] hover:border-[#7c3aed]/50 text-xs font-semibold text-[#c4b5fd] hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Blank Page</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
