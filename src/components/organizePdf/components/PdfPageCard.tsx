import React from 'react';
import {
  GripVertical,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  FileText,
} from 'lucide-react';
import { OrganizePageItem, DragState } from '../types';

interface PdfPageCardProps {
  page: OrganizePageItem;
  index: number;
  totalCount: number;
  isSelected: boolean;
  dragState: DragState;
  onToggleSelect: (pageId: string, shiftKey: boolean) => void;
  onDragStart: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDragOver: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDragLeave: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDrop: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDragEnd: () => void;
  onQuickMove: (pageId: string, direction: 'first' | 'left' | 'right' | 'last') => void;
}

export const PdfPageCard: React.FC<PdfPageCardProps> = ({
  page,
  index,
  totalCount,
  isSelected,
  dragState,
  onToggleSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onQuickMove,
}) => {
  const isBeingDragged = dragState.isDragging && dragState.draggedPageIds.includes(page.id);
  const isDropTarget = dragState.isDragging && dragState.dragOverPageId === page.id;
  const isReordered = page.currentPageNumber !== page.originalPageNumber;

  return (
    <div
      className="relative flex flex-col items-center select-none"
      onDragOver={(e) => onDragOver(e, page)}
      onDragLeave={(e) => onDragLeave(e, page)}
      onDrop={(e) => onDrop(e, page)}
    >
      {/* Drop Indicator Bar (Before) */}
      {isDropTarget && dragState.dropPosition === 'before' && (
        <div className="absolute -left-2.5 top-0 bottom-0 w-1.5 bg-[#a78bfa] rounded-full z-30 shadow-lg shadow-[#7c3aed] flex items-center justify-center animate-pulse">
          <span className="hidden sm:block absolute -top-6 whitespace-nowrap text-[10px] font-mono font-bold bg-[#7c3aed] text-white px-2 py-0.5 rounded shadow">
            DROP HERE
          </span>
        </div>
      )}

      {/* Main Card Container */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, page)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          // If clicking background of card (not buttons) toggle selection
          onToggleSelect(page.id, e.shiftKey);
        }}
        className={`group relative w-full flex flex-col rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing overflow-hidden ${
          isSelected
            ? 'border-[#a78bfa] bg-[#1a142c] ring-2 ring-[#7c3aed]/50 shadow-xl shadow-[#7c3aed]/20'
            : isReordered
            ? 'border-[#383358] bg-[#100f1c] hover:border-[#6d5eb5] hover:bg-[#151325]'
            : 'border-[#222234] bg-[#0d0d16] hover:border-[#383852] hover:bg-[#121220]'
        } ${
          isBeingDragged
            ? 'opacity-40 scale-[0.98] shadow-2xl shadow-black/80 ring-2 ring-dashed ring-[#a78bfa]'
            : 'shadow-md hover:shadow-xl'
        }`}
      >
        {/* Top Header Bar: Drag Handle, Quick Movement Buttons & Selection Checkbox */}
        <div className="px-3 py-2 bg-[#12121e]/80 border-b border-[#202032] flex items-center justify-between gap-1.5 text-neutral-400">
          {/* Drag Handle & Quick Reorder */}
          <div className="flex items-center gap-1">
            <span
              className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors cursor-grab"
              title="Drag to reorder"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>

            {/* Quick left/right movement shortcuts */}
            <div className="flex items-center opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickMove(page.id, 'left');
                }}
                disabled={index === 0}
                className="p-0.5 rounded text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                title="Move Left"
                aria-label="Move page left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickMove(page.id, 'right');
                }}
                disabled={index === totalCount - 1}
                className="p-0.5 rounded text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                title="Move Right"
                aria-label="Move page right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Selection Checkbox */}
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
            title={isSelected ? 'Deselect page' : 'Select page'}
            aria-label={`Select page ${page.currentPageNumber}`}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Thumbnail Preview Area */}
        <div className="p-3 bg-[#0a0a12] flex items-center justify-center min-h-[170px] sm:min-h-[200px] overflow-hidden relative">
          {page.isLoadingThumbnail ? (
            <div className="flex flex-col items-center justify-center space-y-2 text-neutral-500 py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#a78bfa]" />
              <span className="text-[10px] font-mono">Rendering...</span>
            </div>
          ) : page.thumbnailUrl ? (
            <div className="relative rounded shadow-md border border-neutral-300/20 bg-white overflow-hidden max-w-full transition-transform duration-200 group-hover:scale-[1.02]">
              <img
                src={page.thumbnailUrl}
                alt={`Page ${page.currentPageNumber}`}
                className="block max-h-[220px] w-auto object-contain pointer-events-none"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 text-neutral-600 py-10">
              <FileText className="w-8 h-8" />
              <span className="text-[10px] font-mono">Page {page.originalPageNumber}</span>
            </div>
          )}

          {/* Reordered subtle indicator pill on preview */}
          {isReordered && (
            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-mono font-bold backdrop-blur">
              Moved
            </div>
          )}
        </div>

        {/* Footer: Position & Original Page Numbers */}
        <div className="px-3 py-2.5 bg-[#0e0e18] border-t border-[#1e1e2d] flex items-center justify-between text-xs">
          {/* New Page Number (Position) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-mono text-neutral-400 font-semibold">
              Pos:
            </span>
            <span className="font-mono font-bold text-white bg-white/[0.08] px-2 py-0.5 rounded-md border border-white/10 text-xs">
              Page {page.currentPageNumber}
            </span>
          </div>

          {/* Original Page Reference */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
            <span className="text-neutral-500">Orig:</span>
            <span
              className={
                isReordered
                  ? 'text-amber-300 font-semibold underline decoration-amber-500/50'
                  : 'text-neutral-300'
              }
            >
              {page.originalPageNumber}
            </span>
          </div>
        </div>

        {/* Hover Quick Jump to First / Last Bar (Keyboard or Click) */}
        <div className="px-3 py-1.5 bg-[#141424] border-t border-[#232338] hidden group-hover:flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickMove(page.id, 'first');
            }}
            disabled={index === 0}
            className="flex items-center gap-1 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
            title="Move to First Position"
          >
            <ChevronsLeft className="w-3 h-3" />
            <span>To First</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickMove(page.id, 'last');
            }}
            disabled={index === totalCount - 1}
            className="flex items-center gap-1 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
            title="Move to Last Position"
          >
            <span>To Last</span>
            <ChevronsRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Drop Indicator Bar (After) */}
      {isDropTarget && dragState.dropPosition === 'after' && (
        <div className="absolute -right-2.5 top-0 bottom-0 w-1.5 bg-[#a78bfa] rounded-full z-30 shadow-lg shadow-[#7c3aed] flex items-center justify-center animate-pulse">
          <span className="hidden sm:block absolute -top-6 whitespace-nowrap text-[10px] font-mono font-bold bg-[#7c3aed] text-white px-2 py-0.5 rounded shadow">
            DROP HERE
          </span>
        </div>
      )}
    </div>
  );
};
