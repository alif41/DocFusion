import React from 'react';
import {
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Move,
} from 'lucide-react';

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onMoveSelection: (direction: 'first' | 'left' | 'right' | 'last') => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onMoveSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-slideUp">
      <div className="bg-[#121222]/95 backdrop-blur-md border border-[#3b345e] rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-2xl shadow-black/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Count and selection buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-ping" />
            <span className="font-mono text-sm font-bold text-[#c084fc]">{selectedCount}</span>
            <span className="text-neutral-300">
              {selectedCount === 1 ? 'page' : 'pages'} selected
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-700 hidden sm:block" />

          <div className="flex items-center gap-1">
            {selectedCount < totalCount ? (
              <button
                type="button"
                onClick={onSelectAll}
                className="px-2 py-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                Select All
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClearSelection}
              className="px-2 py-1 rounded-lg text-neutral-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Right: Movement buttons for the selected group */}
        <div className="flex items-center gap-1 bg-[#1a182c] border border-[#2c264c] rounded-xl p-1">
          <button
            type="button"
            onClick={() => onMoveSelection('first')}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#7c3aed]/30 transition-colors cursor-pointer"
            title="Move selection to First position"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveSelection('left')}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#7c3aed]/30 transition-colors cursor-pointer flex items-center gap-1"
            title="Move selection Left (←)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] font-medium">Left</span>
          </button>
          <button
            type="button"
            onClick={() => onMoveSelection('right')}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#7c3aed]/30 transition-colors cursor-pointer flex items-center gap-1"
            title="Move selection Right (→)"
          >
            <span className="hidden sm:inline text-[11px] font-medium">Right</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveSelection('last')}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#7c3aed]/30 transition-colors cursor-pointer"
            title="Move selection to Last position"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Dismiss selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
