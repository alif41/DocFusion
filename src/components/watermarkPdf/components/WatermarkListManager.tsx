import React from 'react';
import {
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Type,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { WatermarkItem } from '../types';

interface WatermarkListManagerProps {
  watermarks: WatermarkItem[];
  activeWatermarkId: string;
  onSelect: (id: string) => void;
  onAdd: (type: 'text' | 'image') => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
}

export const WatermarkListManager: React.FC<WatermarkListManagerProps> = ({
  watermarks,
  activeWatermarkId,
  onSelect,
  onAdd,
  onDuplicate,
  onToggleVisibility,
  onDelete,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-neutral-300">
          Watermark Objects ({watermarks.length})
        </span>

        {/* Add Another Watermark dropdown/buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAdd('text')}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#a78bfa] hover:text-white px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-[#7c3aed]/30 border border-white/10 transition-colors cursor-pointer"
            title="Add text watermark"
          >
            <Plus className="w-3 h-3" />
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={() => onAdd('image')}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#a78bfa] hover:text-white px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-[#7c3aed]/30 border border-white/10 transition-colors cursor-pointer"
            title="Add image watermark"
          >
            <Plus className="w-3 h-3" />
            <span>Image</span>
          </button>
        </div>
      </div>

      {/* List of Watermark Items */}
      <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
        {watermarks.map((wm, idx) => {
          const isActive = wm.id === activeWatermarkId;

          return (
            <div
              key={wm.id}
              onClick={() => onSelect(wm.id)}
              className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-[#1e1738] border-[#7c3aed] ring-1 ring-[#7c3aed]/40 text-white'
                  : 'bg-[#121220] border-[#222234] text-neutral-400 hover:text-neutral-200 hover:border-[#38384f]'
              }`}
            >
              {/* Type Icon & Label */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-[#7c3aed] text-white'
                      : 'bg-[#1a1a2c] text-neutral-400'
                  }`}
                >
                  {wm.type === 'text' ? (
                    <Type className="w-3.5 h-3.5" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="truncate text-xs">
                  <p className="font-semibold truncate">{wm.name || `Watermark ${idx + 1}`}</p>
                  <p className="text-[10px] text-neutral-400 truncate font-mono">
                    {wm.type === 'text' ? wm.text || 'Text' : 'Image Logo'} •{' '}
                    {wm.pageSelection.type === 'all'
                      ? 'All Pages'
                      : wm.pageSelection.type === 'current'
                      ? 'Single Page'
                      : 'Custom Pages'}
                  </p>
                </div>
              </div>

              {/* Actions: Hide/Show, Duplicate, Delete */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onToggleVisibility(wm.id)}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    wm.visible ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-400'
                  }`}
                  title={wm.visible ? 'Hide Watermark' : 'Show Watermark'}
                >
                  {wm.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => onDuplicate(wm.id)}
                  className="p-1 rounded-md text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Duplicate Watermark"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(wm.id)}
                  className="p-1 rounded-md text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete Watermark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
