import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { ORGANIZE_PDF_CONFIG } from '../config/organizePdfConfig';

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomChange: (newZoom: number) => void;
  disabled?: boolean;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  onZoomChange,
  disabled = false,
}) => {
  const { zoomLevels, minZoom, maxZoom, defaultZoom } = ORGANIZE_PDF_CONFIG;

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoomLevel);
    if (currentIndex > 0) {
      onZoomChange(zoomLevels[currentIndex - 1]);
    } else {
      onZoomChange(Math.max(minZoom, zoomLevel - 25));
    }
  };

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoomLevel);
    if (currentIndex < zoomLevels.length - 1 && currentIndex !== -1) {
      onZoomChange(zoomLevels[currentIndex + 1]);
    } else {
      onZoomChange(Math.min(maxZoom, zoomLevel + 25));
    }
  };

  const handleResetZoom = () => {
    onZoomChange(defaultZoom);
  };

  return (
    <div className="flex items-center bg-[#151524] border border-[#26263c] rounded-xl p-1 text-xs">
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={disabled || zoomLevel <= minZoom}
        className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Zoom Out (−)"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={handleResetZoom}
        disabled={disabled}
        className="px-2 py-0.5 text-[11px] font-mono font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer select-none"
        title="Reset zoom to 100%"
      >
        {zoomLevel}%
      </button>

      <button
        type="button"
        onClick={handleZoomIn}
        disabled={disabled || zoomLevel >= maxZoom}
        className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Zoom In (+)"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
