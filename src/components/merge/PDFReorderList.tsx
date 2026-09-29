import React, { useState, useRef } from 'react';
import {
  Combine,
  Trash2,
  ArrowDownUp,
  Layers,
  HardDrive,
  Sparkles,
  Info,
  Edit3,
} from 'lucide-react';
import { PDFFileItem } from '../../types/pdf';
import { PDFFileCard } from './PDFFileCard';
import { PDFUploader } from './PDFUploader';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils';

interface PDFReorderListProps {
  items: PDFFileItem[];
  onReorder: (newItems: PDFFileItem[]) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onAddMoreFiles: (files: File[]) => void;
  onMerge: () => void;
  customFilename: string;
  onFilenameChange: (name: string) => void;
  onPreviewThumbnail: (item: PDFFileItem) => void;
}

export const PDFReorderList: React.FC<PDFReorderListProps> = ({
  items,
  onReorder,
  onRemove,
  onClearAll,
  onAddMoreFiles,
  onMerge,
  customFilename,
  onFilenameChange,
  onPreviewThumbnail,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

  const totalPages = items.reduce((acc, curr) => acc + curr.pageCount, 0);
  const totalSize = items.reduce((acc, curr) => acc + curr.size, 0);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnter = (_e: React.DragEvent, index: number) => {
    dragOverItemIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverItemIndex.current !== null &&
      draggedIndex !== dragOverItemIndex.current
    ) {
      const updatedList = [...items];
      const draggedItem = updatedList[draggedIndex];
      updatedList.splice(draggedIndex, 1);
      updatedList.splice(dragOverItemIndex.current, 0, draggedItem);
      onReorder(updatedList);
    }
    setDraggedIndex(null);
    dragOverItemIndex.current = null;
  };

  // Accessible move handlers
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...items];
    const item = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = item;
    onReorder(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const updated = [...items];
    const item = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = item;
    onReorder(updated);
  };

  // Helper reorder buttons
  const handleReverseOrder = () => {
    onReorder([...items].reverse());
  };

  const handleSortAlphabetical = () => {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    onReorder(sorted);
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Batch Summary & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d0d16] border border-[#222234]">
        {/* Document Stats */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30 font-semibold">
            {items.length} {items.length === 1 ? 'PDF File' : 'PDF Files'}
          </span>
          <span className="flex items-center gap-1.5 text-neutral-300">
            <Layers className="w-3.5 h-3.5 text-[#7c3aed]" />
            {totalPages} Total Pages
          </span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5 text-neutral-300">
            <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
            {formatFileSize(totalSize)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <PDFUploader onFilesSelected={onAddMoreFiles} isCompact={true} />

          <button
            type="button"
            onClick={handleReverseOrder}
            className="flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-[#262638] hover:bg-white/[0.04] transition-colors cursor-pointer"
            title="Reverse list order"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reverse</span>
          </button>

          <button
            type="button"
            onClick={handleSortAlphabetical}
            className="flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-[#262638] hover:bg-white/[0.04] transition-colors cursor-pointer"
            title="Sort A to Z"
          >
            <span>A-Z</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs font-mono text-rose-400 hover:text-rose-300 px-2.5 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Remove all files"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Helpful order note */}
      <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#a78bfa]" />
          Drag cards or use arrows to adjust the merge sequence. Documents will be joined in order from #1 to #{items.length}.
        </span>
      </div>

      {/* Grid of PDF Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <PDFFileCard
            key={item.id}
            item={item}
            index={idx}
            totalCount={items.length}
            onRemove={onRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onPreviewThumbnail={onPreviewThumbnail}
            isDragging={draggedIndex === idx}
          />
        ))}
      </div>

      {/* Bottom Sticky Action Box */}
      <div className="rounded-2xl border border-[#26263c] bg-[#0e0e18] p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Filename Input */}
          <div className="flex-1 max-w-md">
            <label
              htmlFor="custom-filename"
              className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
            >
              <Edit3 className="w-3 h-3 text-[#a78bfa]" />
              Output Document Filename
            </label>
            <div className="relative">
              <input
                id="custom-filename"
                type="text"
                value={customFilename}
                onChange={(e) => onFilenameChange(e.target.value)}
                placeholder="docfusion-merged.pdf"
                className="w-full bg-[#141422] border border-[#292940] rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-500 pointer-events-none">
                .pdf
              </span>
            </div>
          </div>

          {/* Merge PDFs Button */}
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onMerge}
              disabled={items.length < 2}
              leftIcon={<Combine className="w-5 h-5 text-white" />}
              className="w-full sm:w-auto shadow-xl shadow-[#7c3aed]/30 px-8 py-3.5 text-base font-semibold"
            >
              Merge {items.length} PDFs
            </Button>
          </div>
        </div>

        {items.length < 2 && (
          <p className="text-xs text-amber-400 font-mono">
            * Please add at least one more PDF file to activate merging.
          </p>
        )}
      </div>
    </div>
  );
};
