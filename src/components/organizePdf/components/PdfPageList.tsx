import React from 'react';
import {
  GripVertical,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Loader2,
  FileText,
} from 'lucide-react';
import { OrganizePageItem, DragState } from '../types';

interface PdfPageListProps {
  pages: OrganizePageItem[];
  selectedPageIds: Set<string>;
  dragState: DragState;
  onToggleSelect: (pageId: string, shiftKey: boolean) => void;
  onDragStart: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDragOver: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDragLeave: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDrop: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDragEnd: () => void;
  onQuickMove: (pageId: string, direction: 'first' | 'left' | 'right' | 'last') => void;
}

export const PdfPageList: React.FC<PdfPageListProps> = ({
  pages,
  selectedPageIds,
  dragState,
  onToggleSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onQuickMove,
}) => {
  return (
    <div className="space-y-2 max-w-4xl mx-auto">
      {pages.map((page, index) => {
        const isSelected = selectedPageIds.has(page.id);
        const isBeingDragged =
          dragState.isDragging && dragState.draggedPageIds.includes(page.id);
        const isDropTarget = dragState.isDragging && dragState.dragOverPageId === page.id;
        const isReordered = page.currentPageNumber !== page.originalPageNumber;

        return (
          <div
            key={page.id}
            className="relative"
            onDragOver={(e) => onDragOver(e, page)}
            onDragLeave={(e) => onDragLeave(e, page)}
            onDrop={(e) => onDrop(e, page)}
          >
            {/* Drop Indicator Bar Above */}
            {isDropTarget && dragState.dropPosition === 'before' && (
              <div className="absolute -top-1.5 left-0 right-0 h-1 bg-[#a78bfa] rounded-full z-20 shadow-md shadow-[#7c3aed] animate-pulse" />
            )}

            <div
              draggable
              onDragStart={(e) => onDragStart(e, page)}
              onDragEnd={onDragEnd}
              onClick={(e) => onToggleSelect(page.id, e.shiftKey)}
              className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                isSelected
                  ? 'border-[#a78bfa] bg-[#1a142c] ring-1 ring-[#7c3aed]/50'
                  : isReordered
                  ? 'border-[#383358] bg-[#100f1c] hover:border-[#6d5eb5] hover:bg-[#151325]'
                  : 'border-[#202030] bg-[#0c0c16] hover:border-[#32324a] hover:bg-[#121220]'
              } ${isBeingDragged ? 'opacity-40 scale-[0.99] ring-2 ring-dashed ring-[#a78bfa]' : ''}`}
            >
              {/* Left: Drag Handle, Checkbox, Mini Thumbnail & Positions */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="p-1 rounded text-neutral-500 hover:text-white transition-colors cursor-grab"
                  title="Drag row to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(page.id, e.shiftKey);
                  }}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7c3aed] border-[#9061f9] text-white shadow-sm'
                      : 'border-[#34344d] bg-[#181826] hover:border-neutral-400 text-transparent'
                  }`}
                  aria-label={`Select page ${page.currentPageNumber}`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* Mini Preview Thumbnail */}
                <div className="w-10 h-14 rounded bg-white shadow-sm border border-neutral-300/30 overflow-hidden flex items-center justify-center shrink-0">
                  {page.isLoadingThumbnail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7c3aed]" />
                  ) : page.thumbnailUrl ? (
                    <img
                      src={page.thumbnailUrl}
                      alt={`P${page.currentPageNumber}`}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-neutral-400" />
                  )}
                </div>

                {/* Page Position Labels */}
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">
                      Page {page.currentPageNumber}
                    </span>
                    {isReordered && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Moved from {page.originalPageNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-neutral-400">
                    Original Document Page: #{page.originalPageNumber}
                  </p>
                </div>
              </div>

              {/* Right: Quick movement actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickMove(page.id, 'first');
                  }}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move to top / first"
                >
                  <ChevronsUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickMove(page.id, 'left');
                  }}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickMove(page.id, 'right');
                  }}
                  disabled={index === pages.length - 1}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickMove(page.id, 'last');
                  }}
                  disabled={index === pages.length - 1}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move to bottom / last"
                >
                  <ChevronsDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drop Indicator Bar Below */}
            {isDropTarget && dragState.dropPosition === 'after' && (
              <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-[#a78bfa] rounded-full z-20 shadow-md shadow-[#7c3aed] animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
};
