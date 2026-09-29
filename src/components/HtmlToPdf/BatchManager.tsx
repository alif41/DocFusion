import React from 'react';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Download,
  Archive,
} from 'lucide-react';
import { UploadedHtmlFile } from './types';

interface BatchManagerProps {
  files: UploadedHtmlFile[];
  onDownloadSingle?: (file: UploadedHtmlFile) => void;
  onDownloadAllZip?: () => void;
  isConverting?: boolean;
}

export const BatchManager: React.FC<BatchManagerProps> = ({
  files,
  onDownloadSingle,
  onDownloadAllZip,
  isConverting = false,
}) => {
  const completedCount = files.filter((f) => f.status === 'completed').length;
  const isAllComplete = completedCount === files.length && files.length > 0;

  return (
    <div className="bg-[#121220] border border-[#24243a] rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#a78bfa]" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Batch Queue ({completedCount} / {files.length} Converted)
          </h3>
        </div>

        {isAllComplete && onDownloadAllZip && (
          <button
            type="button"
            onClick={onDownloadAllZip}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-md shadow-[#7c3aed]/20 transition-all cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Download All as ZIP</span>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
        {files.map((file) => {
          const isDone = file.status === 'completed';
          const isProcessing = file.status === 'processing';
          const isFailed = file.status === 'failed';

          return (
            <div
              key={file.id}
              className="p-3 rounded-xl bg-[#161628] border border-[#252538] flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <span className="font-semibold text-white block truncate max-w-[200px] sm:max-w-xs">
                  {file.name}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {file.isPackage ? 'ZIP Package' : 'HTML Document'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isDone && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                )}

                {isProcessing && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#a78bfa] bg-[#7c3aed]/10 px-2 py-0.5 rounded-md border border-[#7c3aed]/20">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </span>
                )}

                {isFailed && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Failed
                  </span>
                )}

                {!isDone && !isProcessing && !isFailed && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/10">
                    <Clock className="w-3.5 h-3.5" />
                    Waiting
                  </span>
                )}

                {isDone && file.pdfUrl && onDownloadSingle && (
                  <button
                    type="button"
                    onClick={() => onDownloadSingle(file)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Download individual PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
