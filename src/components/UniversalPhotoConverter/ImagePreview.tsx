import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Camera,
  Image as ImageIcon,
  Info,
  Layers,
} from 'lucide-react';
import { PhotoFileInfo, PhotoFormat } from './types';

interface ImagePreviewProps {
  fileInfo: PhotoFileInfo | null;
  format: PhotoFormat;
  pdfPagesCount?: number;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  fileInfo,
  format,
  pdfPagesCount,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const handleResetZoom = () => setZoomLevel(1);

  if (!fileInfo) {
    return (
      <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-[#10101c] border border-[#222238] rounded-3xl text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-neutral-500">
          <ImageIcon className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-neutral-300">No Image Selected for Preview</p>
        <p className="text-xs text-neutral-500 max-w-xs">
          Select or upload a photo to inspect its details, dimensions, and visual structure.
        </p>
      </div>
    );
  }

  const isPdf = format === 'PDF';
  const isRaw = format === 'RAW';
  const isHeic = format === 'HEIC';

  return (
    <div className="bg-[#121222] border border-[#26263e] rounded-3xl p-5 space-y-4 shadow-xl">
      {/* Header bar with zoom & metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Image Preview
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-300 border border-white/10 truncate max-w-[140px] sm:max-w-xs">
            {fileInfo.name}
          </span>
        </div>

        {/* Zoom Controls (for web-viewable images) */}
        {!isPdf && !isRaw && !isHeic && (
          <div className="flex items-center gap-1 bg-[#1a1a2e] border border-[#2e2e46] rounded-xl p-1">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 text-[10px] font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Reset zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Viewport */}
      <div className="relative w-full h-[260px] sm:h-[300px] rounded-2xl overflow-hidden bg-[#0c0c16] border border-[#222238] flex items-center justify-center p-2">
        {isPdf ? (
          <div className="text-center space-y-2 p-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-white">{fileInfo.name}</p>
            <p className="text-xs text-neutral-400">
              PDF Document • Ready to convert into high-res JPG images
            </p>
          </div>
        ) : isRaw ? (
          <div className="text-center space-y-2 p-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <Camera className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-white">{fileInfo.name}</p>
            <p className="text-xs text-neutral-400">
              Camera RAW File • Server-side decoding enabled
            </p>
          </div>
        ) : isHeic ? (
          <div className="text-center space-y-2 p-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
              <Camera className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-white">{fileInfo.name}</p>
            <p className="text-xs text-neutral-400">
              Apple HEIC/HEIF Image • Hardware decode pipeline ready
            </p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center overflow-auto scrollbar-none">
            <img
              src={fileInfo.previewUrl}
              alt={fileInfo.name}
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease-out',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              className="rounded-lg shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-[#171728] border border-[#26263a]">
          <span className="text-[10px] text-neutral-500 block uppercase">File Size</span>
          <span className="text-white font-bold">{formatBytes(fileInfo.size)}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#171728] border border-[#26263a]">
          <span className="text-[10px] text-neutral-500 block uppercase">Original Dimensions</span>
          <span className="text-white font-bold">
            {fileInfo.width && fileInfo.height
              ? `${fileInfo.width} × ${fileInfo.height} px`
              : 'Auto detected'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#171728] border border-[#26263a] col-span-2 sm:col-span-1">
          <span className="text-[10px] text-neutral-500 block uppercase">Format</span>
          <span className="text-[#a78bfa] font-bold">{format}</span>
        </div>
      </div>
    </div>
  );
};
