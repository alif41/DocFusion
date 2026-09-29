import React from 'react';
import {
  GripVertical,
  X,
  FileText,
  ChevronUp,
  ChevronDown,
  Layers,
  HardDrive,
  Eye,
} from 'lucide-react';
import { PDFFileItem } from '../../types/pdf';
import { formatFileSize } from '../../utils';

interface PDFFileCardProps {
  item: PDFFileItem;
  index: number;
  totalCount: number;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnter: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onPreviewThumbnail?: (item: PDFFileItem) => void;
  isDragging?: boolean;
}

export const PDFFileCard: React.FC<PDFFileCardProps> = ({
  item,
  index,
  totalCount,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDragOver,
  onPreviewThumbnail,
  isDragging = false,
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={`group relative rounded-2xl border transition-all duration-200 bg-[#0d0d16] p-4 flex flex-col justify-between select-none ${
        isDragging
          ? 'opacity-40 border-[#7c3aed] scale-95 shadow-2xl'
          : 'border-[#222234] hover:border-[#7c3aed]/50 hover:bg-[#11111d] hover:shadow-xl hover:shadow-black/60'
      }`}
    >
      {/* Top Bar: Order Badge & Drag Handle & Remove */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Reorder Number Badge */}
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30 font-mono text-xs font-bold shadow-inner">
            {index + 1}
          </span>
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider hidden sm:inline">
            Order
          </span>
        </div>

        {/* Drag Handle & Mobile/Accessibility Reorder Arrows & Delete */}
        <div className="flex items-center gap-1">
          {/* Quick accessible Move Up / Move Down */}
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            aria-label={`Move ${item.name} up in merge sequence`}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Move Up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === totalCount - 1}
            onClick={() => onMoveDown(index)}
            aria-label={`Move ${item.name} down in merge sequence`}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Move Down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Grip Drag Handle */}
          <div
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-300 cursor-grab active:cursor-grabbing transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Delete / Remove button */}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.name} from list`}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1 cursor-pointer"
            title="Remove from batch"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnail Area */}
      <div
        onClick={() => onPreviewThumbnail?.(item)}
        className="relative w-full aspect-[4/3] rounded-xl bg-[#141422] border border-[#26263a] overflow-hidden flex items-center justify-center group/thumb cursor-pointer mb-3"
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={`${item.name} preview thumbnail`}
            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/thumb:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-neutral-500">
            <FileText className="w-8 h-8 text-[#7c3aed]/50" />
            <span className="text-[10px] font-mono">PDF Preview</span>
          </div>
        )}

        {/* Hover zoom icon */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 backdrop-blur-[1px] transition-opacity flex items-center justify-center">
          <span className="p-1.5 rounded-lg bg-[#0e0e18]/90 border border-white/10 text-white text-xs flex items-center gap-1 shadow-lg">
            <Eye className="w-3.5 h-3.5 text-[#a78bfa]" /> Inspect
          </span>
        </div>
      </div>

      {/* File Info */}
      <div className="space-y-2">
        <h4
          className="text-xs sm:text-sm font-semibold text-white truncate"
          title={item.name}
        >
          {item.name}
        </h4>

        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1 border-t border-[#1a1a28]">
          <span className="flex items-center gap-1 text-[#a78bfa] font-medium">
            <Layers className="w-3 h-3 text-[#7c3aed]" />
            {item.pageCount === 1 ? '1 Page' : `${item.pageCount} Pages`}
          </span>
          <span className="flex items-center gap-1 text-neutral-400">
            <HardDrive className="w-3 h-3 text-neutral-500" />
            {formatFileSize(item.size)}
          </span>
        </div>
      </div>
    </div>
  );
};
