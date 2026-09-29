import React from 'react';
import {
  Trash2,
  Image as ImageIcon,
  FileText,
  Camera,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PhotoFileInfo, PhotoFormat } from './types';

interface UploadedImageCardProps {
  fileInfo: PhotoFileInfo;
  format: PhotoFormat;
  index: number;
  totalFiles: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showOrdering?: boolean;
  disabled?: boolean;
}

export const UploadedImageCard: React.FC<UploadedImageCardProps> = ({
  fileInfo,
  format,
  index,
  totalFiles,
  isSelected = false,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
  showOrdering = false,
  disabled = false,
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isPdf = format === 'PDF';
  const isRaw = format === 'RAW';
  const isHeic = format === 'HEIC';

  return (
    <div
      onClick={onSelect}
      className={`group relative bg-[#131322] border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3.5 transition-all cursor-pointer shadow-md ${
        isSelected
          ? 'border-[#7c3aed] bg-[#17172b] ring-1 ring-[#7c3aed]/50 shadow-[#7c3aed]/10'
          : 'border-[#26263c] hover:border-[#3d3d5c] hover:bg-[#161628]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Ordering position badge */}
        {showOrdering && (
          <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-neutral-400 shrink-0">
            {index + 1}
          </div>
        )}

        {/* Thumbnail or Format Icon */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shrink-0 relative">
          {isPdf ? (
            <FileText className="w-7 h-7 text-rose-400" />
          ) : isRaw ? (
            <Camera className="w-7 h-7 text-emerald-400" />
          ) : isHeic ? (
            <Camera className="w-7 h-7 text-purple-400" />
          ) : (
            <img
              src={fileInfo.previewUrl}
              alt={fileInfo.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback to icon
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          {fileInfo.status === 'processing' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-[#a78bfa] animate-spin" />
            </div>
          )}
        </div>

        {/* Metadata Details */}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs">
              {fileInfo.name}
            </h4>
            <span className="shrink-0 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-neutral-300">
              {fileInfo.extension.replace('.', '')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 font-mono">
            <span>{formatBytes(fileInfo.size)}</span>
            {fileInfo.width && fileInfo.height && (
              <>
                <span className="w-1 h-1 rounded-full bg-neutral-600" />
                <span className="text-neutral-300">
                  {fileInfo.width} × {fileInfo.height}
                </span>
              </>
            )}
            {fileInfo.status === 'completed' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Converted
              </span>
            )}
            {fileInfo.status === 'failed' && (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Failed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons: Move up/down and Remove */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {showOrdering && (
          <div className="flex items-center gap-0.5 mr-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={disabled || index === 0}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-20 cursor-pointer"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={disabled || index === totalFiles - 1}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-20 cursor-pointer"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer disabled:opacity-40"
          title="Remove photo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
