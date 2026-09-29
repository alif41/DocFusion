import React from 'react';
import { Layers, Grid3X3 } from 'lucide-react';
import { WatermarkItem, WatermarkLayer } from '../types';

interface WatermarkLayersProps {
  watermark: WatermarkItem;
  onChange: (updates: Partial<WatermarkItem>) => void;
}

export const WatermarkLayers: React.FC<WatermarkLayersProps> = ({
  watermark,
  onChange,
}) => {
  return (
    <div className="space-y-4 pt-1 border-t border-[#222234]">
      {/* 1. Watermark Layer (Behind vs Front) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>Layer Order</span>
          </div>
          <span className="text-[11px] font-mono text-[#a78bfa] capitalize">
            {watermark.layer === 'behind' ? 'Behind PDF text' : 'In front of PDF'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-[#121220] p-1 rounded-xl border border-[#222234]">
          <button
            type="button"
            onClick={() => onChange({ layer: 'behind' })}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              watermark.layer === 'behind'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Behind Content
          </button>
          <button
            type="button"
            onClick={() => onChange({ layer: 'front' })}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              watermark.layer === 'front'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            In Front of Content
          </button>
        </div>
      </div>

      {/* 2. Tiled Watermark Across Page Toggle */}
      <div className="space-y-3 bg-[#121220] p-3 rounded-2xl border border-[#222234]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1b1b2e] border border-[#2d2d46] text-[#a78bfa] flex items-center justify-center">
              <Grid3X3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Tile Across Page</p>
              <p className="text-[10px] text-neutral-400">Repeat watermark diagonally</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={watermark.isTiled}
              onChange={(e) => onChange({ isTiled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-[#252538] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7c3aed]" />
          </label>
        </div>

        {/* Tiling settings if enabled */}
        {watermark.isTiled && (
          <div className="space-y-2.5 pt-2 border-t border-[#1e1e30] animate-fadeIn">
            {/* Tile Spacing */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-neutral-400">H-Spacing ({watermark.tileSpacingX}px)</span>
                <input
                  type="range"
                  min="80"
                  max="300"
                  step="10"
                  value={watermark.tileSpacingX}
                  onChange={(e) => onChange({ tileSpacingX: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#7c3aed] bg-[#222234] rounded-lg h-1.5 cursor-pointer mt-1"
                />
              </div>

              <div>
                <span className="text-[11px] text-neutral-400">V-Spacing ({watermark.tileSpacingY}px)</span>
                <input
                  type="range"
                  min="80"
                  max="300"
                  step="10"
                  value={watermark.tileSpacingY}
                  onChange={(e) => onChange({ tileSpacingY: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#7c3aed] bg-[#222234] rounded-lg h-1.5 cursor-pointer mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
