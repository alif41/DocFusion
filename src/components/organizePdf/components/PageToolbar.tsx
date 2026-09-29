import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  RotateCcw,
  LayoutGrid,
  List,
  FileText,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { OrganizeViewMode } from '../types';
import { ZoomControls } from './ZoomControls';
import { formatFileSize } from '../../../utils';

interface PageToolbarProps {
  filename: string;
  fileSize: number;
  viewMode: OrganizeViewMode;
  zoomLevel: number;
  canUndo: boolean;
  canRedo: boolean;
  hasChanges: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetOrder: () => void;
  onViewModeChange: (mode: OrganizeViewMode) => void;
  onZoomChange: (zoom: number) => void;
}

export const PageToolbar: React.FC<PageToolbarProps> = ({
  filename,
  fileSize,
  viewMode,
  zoomLevel,
  canUndo,
  canRedo,
  hasChanges,
  onUndo,
  onRedo,
  onResetOrder,
  onViewModeChange,
  onZoomChange,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleConfirmReset = () => {
    onResetOrder();
    setShowResetConfirm(false);
  };

  return (
    <div className="bg-[#0e0e1a] border border-[#222236] rounded-2xl p-3 sm:px-4 sm:py-3 shadow-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Document Name & History Controls (Undo / Redo / Reset) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* File Name Tag */}
          <div className="flex items-center gap-2 max-w-[200px] sm:max-w-xs truncate text-xs font-semibold text-white bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl">
            <FileText className="w-4 h-4 text-[#a78bfa] shrink-0" />
            <span className="truncate" title={filename}>
              {filename}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono shrink-0">
              ({formatFileSize(fileSize)})
            </span>
          </div>

          <div className="h-5 w-px bg-neutral-800 hidden sm:block" />

          {/* Undo / Redo */}
          <div className="flex items-center bg-[#151524] border border-[#26263c] rounded-xl p-0.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Undo last movement (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Redo movement (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Order */}
          {showResetConfirm ? (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-xl text-xs text-amber-300 animate-fadeIn">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Reset order to original?</span>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-2 py-0.5 rounded-lg bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400 cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="p-0.5 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (hasChanges) {
                  setShowResetConfirm(true);
                } else {
                  onResetOrder();
                }
              }}
              disabled={!hasChanges}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2d2d44] bg-[#141422] text-xs font-medium text-neutral-300 hover:text-white hover:bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Restore original 1 → N sequence"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Reset Order</span>
            </button>
          )}
        </div>

        {/* Right: View Toggle (Grid / List) & Zoom Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center bg-[#151524] border border-[#26263c] rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#7c3aed] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#7c3aed] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls (Active in Grid View) */}
          {viewMode === 'grid' && (
            <ZoomControls zoomLevel={zoomLevel} onZoomChange={onZoomChange} />
          )}
        </div>
      </div>
    </div>
  );
};
