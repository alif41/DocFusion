import React from 'react';
import { Layers, Trash2, ArrowUpDown } from 'lucide-react';
import { PhotoConversionConfig, PhotoFileInfo } from './types';
import { UploadedImageCard } from './UploadedImageCard';
import { ImageUploader } from './ImageUploader';

interface ImageGridProps {
  files: PhotoFileInfo[];
  config: PhotoConversionConfig;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (newFiles: PhotoFileInfo[]) => void;
  onAddMore: (newFiles: PhotoFileInfo[]) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  files,
  config,
  selectedId,
  onSelect,
  onRemove,
  onReorder,
  onAddMore,
  onClearAll,
  disabled = false,
}) => {
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= files.length) return;

    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onReorder(updated);
  };

  const showOrdering = !!config.hasPageOrder && files.length > 1;

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#a78bfa]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Uploaded Photos
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#c084fc] font-semibold border border-white/10">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {config.allowsMultiple && (
            <ImageUploader
              config={config}
              onFilesSelected={onAddMore}
              disabled={disabled}
              isCompact={true}
            />
          )}

          <button
            type="button"
            onClick={onClearAll}
            disabled={disabled}
            className="text-xs text-neutral-400 hover:text-rose-400 p-1.5 transition-colors cursor-pointer disabled:opacity-30"
            title="Clear all uploaded photos"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showOrdering && (
        <div className="p-2.5 rounded-xl bg-[#171729] border border-[#2b2b42] flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#a78bfa]" />
            PDF page order: Photos will appear in sequential order shown below.
          </span>
        </div>
      )}

      {/* Files List / Grid */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
        {files.map((file, idx) => (
          <UploadedImageCard
            key={file.id}
            fileInfo={file}
            format={config.sourceFormat}
            index={idx}
            totalFiles={files.length}
            isSelected={file.id === selectedId}
            onSelect={() => onSelect(file.id)}
            onRemove={() => onRemove(file.id)}
            onMoveUp={() => handleMove(idx, 'up')}
            onMoveDown={() => handleMove(idx, 'down')}
            showOrdering={showOrdering}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};
