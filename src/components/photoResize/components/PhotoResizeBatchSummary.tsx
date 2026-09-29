import React from 'react';
import {
  Download,
  RotateCcw,
  Sparkles,
  Archive,
  Layers,
  CheckCircle2,
  Loader2,
  Plus,
  Sliders,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { PhotoItem } from '../types';
import { formatFileSize } from '../../../utils';

interface PhotoResizeBatchSummaryProps {
  items: PhotoItem[];
  isProcessing: boolean;
  onResizeAll: () => void;
  onDownloadZip: () => void;
  onClearAll: () => void;
  onAddMoreClick: () => void;
  onOpenPreviewFirst?: () => void;
}

export const PhotoResizeBatchSummary: React.FC<PhotoResizeBatchSummaryProps> = ({
  items,
  isProcessing,
  onResizeAll,
  onDownloadZip,
  onClearAll,
  onAddMoreClick,
  onOpenPreviewFirst,
}) => {
  const completedCount = items.filter((i) => i.status === 'completed' && i.result).length;
  const isAllCompleted = completedCount === items.length && items.length > 0;

  const totalInputBytes = items.reduce((acc, curr) => acc + curr.size, 0);
  const totalOutputBytes = items.reduce((acc, curr) => acc + (curr.result?.newSize || 0), 0);

  const calculateOverallSavings = () => {
    if (completedCount === 0 || totalOutputBytes === 0) return null;
    const diff = totalOutputBytes - totalInputBytes;
    const pct = ((diff / totalInputBytes) * 100).toFixed(1);
    return {
      text: `${diff <= 0 ? '' : '+'}${pct}%`,
      isReduction: diff <= 0,
    };
  };

  const overallSavings = calculateOverallSavings();

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Left: Queue Stats */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {items.length} {items.length === 1 ? 'Photo' : 'Photos'} in Batch
            </h4>
            {completedCount > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                {completedCount} / {items.length} Completed
              </span>
            )}
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 pt-0.5">
            <span>Total: {formatFileSize(totalInputBytes)}</span>
            {completedCount > 0 && totalOutputBytes > 0 && (
              <>
                <span>→</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatFileSize(totalOutputBytes)}
                </span>
                {overallSavings && (
                  <span className="text-slate-400 font-normal">
                    ({overallSavings.text})
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {items.length > 0 && onOpenPreviewFirst && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenPreviewFirst}
            leftIcon={<Sliders className="w-3.5 h-3.5 text-[#7c3aed]" />}
            className="text-xs font-semibold"
          >
            Preview &amp; Adjust
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddMoreClick}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={isProcessing}
        >
          Add More
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          disabled={isProcessing}
        >
          Clear
        </Button>

        {completedCount > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onDownloadZip}
            leftIcon={<Archive className="w-4 h-4 text-[#7c3aed]" />}
            className="font-bold"
          >
            Download ZIP
          </Button>
        )}

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onResizeAll}
          disabled={isProcessing || items.length === 0}
          leftIcon={
            isProcessing ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )
          }
          className="shadow-lg shadow-[#7c3aed]/25 font-bold px-6"
        >
          {isProcessing
            ? 'Resizing Images...'
            : isAllCompleted
            ? 'Re-Resize All'
            : 'Resize All Photos'}
        </Button>
      </div>
    </div>
  );
};
