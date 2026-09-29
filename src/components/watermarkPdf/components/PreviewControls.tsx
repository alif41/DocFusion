import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { WATERMARK_PDF_CONFIG } from '../config/watermarkPdfConfig';

interface PreviewControlsProps {
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  onPageChange: (newPage: number) => void;
  onZoomChange: (newZoom: number) => void;
  onFitWidth?: () => void;
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({
  currentPage,
  totalPages,
  zoomLevel,
  onPageChange,
  onZoomChange,
  onFitWidth,
}) => {
  const { minZoom, maxZoom, defaultZoom } = WATERMARK_PDF_CONFIG;

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      onPageChange(val);
    }
  };

  return (
    <div className="bg-[#0e0e1a] border border-[#222236] rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Page Navigation */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 font-mono text-neutral-300">
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={handlePageInput}
            className="w-11 bg-[#1a1a2e] border border-[#2d2d46] rounded-lg px-1.5 py-0.5 text-center text-xs text-white focus:outline-none focus:border-[#7c3aed]"
          />
          <span className="text-neutral-500">/</span>
          <span className="text-neutral-400">{totalPages}</span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 bg-[#151524] border border-[#26263c] rounded-xl p-0.5">
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(minZoom, zoomLevel - 20))}
          disabled={zoomLevel <= minZoom}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Zoom Out (−)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onZoomChange(defaultZoom)}
          className="px-2 py-0.5 text-[11px] font-mono text-neutral-300 hover:text-white cursor-pointer select-none"
          title="Reset to 100%"
        >
          {zoomLevel}%
        </button>

        <button
          type="button"
          onClick={() => onZoomChange(Math.min(maxZoom, zoomLevel + 20))}
          disabled={zoomLevel >= maxZoom}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {onFitWidth && (
          <button
            type="button"
            onClick={onFitWidth}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors ml-0.5"
            title="Fit to Width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
