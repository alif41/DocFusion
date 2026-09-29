import React from 'react';
import {
  Trash2,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { PhotoItem } from '../types';
import { formatFileSize } from '../../../utils';

interface PhotoResizeItemCardProps {
  item: PhotoItem;
  onRemove: (id: string) => void;
  onDownloadSingle?: (item: PhotoItem) => void;
  onOpenAdjust?: (item: PhotoItem) => void;
}

export const PhotoResizeItemCard: React.FC<PhotoResizeItemCardProps> = ({
  item,
  onRemove,
  onDownloadSingle,
  onOpenAdjust,
}) => {
  const isCompleted = item.status === 'completed' && item.result;
  const isProcessing = item.status === 'processing';
  const isInspecting = item.status === 'inspecting';

  // Calculate size change percentage if completed
  const calculateDelta = () => {
    if (!item.result) return null;
    const diff = item.result.newSize - item.size;
    const pct = ((diff / item.size) * 100).toFixed(1);
    const isReduction = diff <= 0;
    return {
      text: `${isReduction ? '' : '+'}${pct}%`,
      isReduction,
      diffBytes: Math.abs(diff),
    };
  };

  const delta = calculateDelta();

  const getSimplifiedRatio = (w: number, h: number): string => {
    if (!w || !h) return '';
    const ratio = w / h;
    if (Math.abs(ratio - 1) < 0.02) return '1:1';
    if (Math.abs(ratio - 16 / 9) < 0.03) return '16:9';
    if (Math.abs(ratio - 9 / 16) < 0.03) return '9:16';
    if (Math.abs(ratio - 4 / 3) < 0.03) return '4:3';
    if (Math.abs(ratio - 3 / 2) < 0.03) return '3:2';
    if (Math.abs(ratio - 2 / 3) < 0.03) return '2:3';
    if (Math.abs(ratio - 4 / 5) < 0.03) return '4:5';
    if (Math.abs(ratio - 21 / 9) < 0.04) return '21:9';
    return `${ratio.toFixed(2)}:1`;
  };

  const origRatioStr =
    item.originalWidth && item.originalHeight
      ? getSimplifiedRatio(item.originalWidth, item.originalHeight)
      : '';
  const newRatioStr =
    item.result?.newWidth && item.result?.newHeight
      ? getSimplifiedRatio(item.result.newWidth, item.result.newHeight)
      : '';

  const hasCustomAdjustments =
    item.adjustments &&
    (item.adjustments.rotation !== 0 ||
      item.adjustments.zoom > 1.05 ||
      item.adjustments.flipH ||
      item.adjustments.flipV ||
      item.adjustments.brightness !== 100 ||
      item.adjustments.contrast !== 100 ||
      item.adjustments.saturation !== 100 ||
      item.adjustments.cropX !== 0 ||
      item.adjustments.cropY !== 0);

  return (
    <div className="relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[#7c3aed]/40">
      {/* Left: Thumbnail & Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Thumbnail Preview */}
        <div
          onClick={() => onOpenAdjust && onOpenAdjust(item)}
          className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-slate-100 dark:bg-[#181828] border border-slate-200 dark:border-[#26263a] overflow-hidden shrink-0 flex items-center justify-center cursor-pointer group"
          title="Click to Preview & Adjust framing, crop, rotation & color"
        >
          {item.result?.dataUrl || item.thumbnailUrl || item.previewUrl ? (
            <img
              src={item.result?.dataUrl || item.thumbnailUrl || item.previewUrl}
              alt={item.name}
              className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-400 dark:text-neutral-500" />
          )}

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Sliders className="w-4 h-4 text-white" />
          </div>

          {/* Status Badge Over Image */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
          {isCompleted && (
            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Text & Dimension Details */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[240px] sm:max-w-xs">
              {item.name}
            </h4>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-white/[0.08] uppercase">
              {item.format}
            </span>
            {hasCustomAdjustments && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] dark:text-[#a78bfa] border border-[#7c3aed]/25 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Adjusted</span>
              </span>
            )}
          </div>

          {/* Before & After comparison row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono">
            {/* Original Info */}
            <span className="text-slate-500 dark:text-neutral-400">
              {isInspecting ? (
                'Reading dimensions...'
              ) : item.originalWidth && item.originalHeight ? (
                <>
                  {item.originalWidth} × {item.originalHeight} px
                  {origRatioStr && <span className="opacity-75"> ({origRatioStr})</span>} • {formatFileSize(item.size)}
                </>
              ) : (
                formatFileSize(item.size)
              )}
            </span>

            {/* Arrow & Resized Info if Completed */}
            {isCompleted && item.result && (
              <>
                <ArrowRight className="w-3 h-3 text-[#7c3aed] dark:text-[#a78bfa] shrink-0" />
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {item.result.newWidth} × {item.result.newHeight} px
                  {newRatioStr && <span className="text-emerald-600 dark:text-emerald-300"> ({newRatioStr})</span>} • {formatFileSize(item.result.newSize)}
                </span>
                {delta && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      delta.isReduction
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {delta.isReduction ? (
                      <TrendingDown className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingUp className="w-2.5 h-2.5" />
                    )}
                    {delta.text}
                  </span>
                )}
              </>
            )}
          </div>

          {item.error && (
            <p className="text-[11px] font-mono text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{item.error}</span>
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {onOpenAdjust && (
          <button
            type="button"
            onClick={() => onOpenAdjust(item)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#181828] dark:hover:bg-[#202034] text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-[#2a2a3e] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Preview and adjust crop, orientation, zoom & lighting"
          >
            <Sliders className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
            <span className="hidden sm:inline">Preview &amp; Adjust</span>
          </button>
        )}

        {isCompleted && onDownloadSingle && (
          <button
            type="button"
            onClick={() => onDownloadSingle(item)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 text-[#7c3aed] dark:text-[#c084fc] border border-[#7c3aed]/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download this resized photo"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
          title="Remove photo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
