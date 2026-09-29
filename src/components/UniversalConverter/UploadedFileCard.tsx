import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { UploadedFileInfo, DocumentFormat } from './types';

interface UploadedFileCardProps {
  fileInfo: UploadedFileInfo;
  format: DocumentFormat;
  onRemove: () => void;
  disabled?: boolean;
}

export const UploadedFileCard: React.FC<UploadedFileCardProps> = ({
  fileInfo,
  format,
  onRemove,
  disabled = false,
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderFormatIcon = () => {
    switch (format) {
      case 'PDF':
        return <FileText className="w-6 h-6 text-rose-400" />;
      case 'Word':
        return <FileText className="w-6 h-6 text-blue-400" />;
      case 'PowerPoint':
        return <Presentation className="w-6 h-6 text-amber-400" />;
      case 'Excel':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
    }
  };

  return (
    <div className="relative bg-[#141424] border border-[#2d2d46] rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-lg shadow-black/20">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
          {renderFormatIcon()}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {fileInfo.name}
            </h4>
            <span className="shrink-0 text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-neutral-300">
              {fileInfo.extension}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span>{formatBytes(fileInfo.size)}</span>
            {fileInfo.pageCount !== undefined && fileInfo.pageCount > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-neutral-600" />
                <span className="flex items-center gap-1 text-neutral-300">
                  <Layers className="w-3 h-3 text-[#a78bfa]" />
                  {fileInfo.pageCount} {fileInfo.pageCount === 1 ? 'page' : 'pages'}
                </span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-neutral-600" />
            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              Ready
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all shrink-0 cursor-pointer disabled:opacity-40"
        title="Remove file"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
