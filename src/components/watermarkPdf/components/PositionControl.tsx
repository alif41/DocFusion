import React from 'react';
import { Move } from 'lucide-react';
import { WatermarkItem, PositionGridType } from '../types';
import { WATERMARK_PDF_CONFIG } from '../config/watermarkPdfConfig';
import { getCoordinatesFromPosition } from '../services/watermarkEngine';

interface PositionControlProps {
  watermark: WatermarkItem;
  onChange: (updates: Partial<WatermarkItem>) => void;
}

export const PositionControl: React.FC<PositionControlProps> = ({
  watermark,
  onChange,
}) => {
  const { gridPositions } = WATERMARK_PDF_CONFIG;

  const handleSelectGrid = (pos: PositionGridType) => {
    const coords = getCoordinatesFromPosition(pos);
    onChange({
      positionType: pos,
      xPercent: coords.x,
      yPercent: coords.y,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-neutral-300">Position Placement</span>
        <span className="text-[11px] font-mono text-[#a78bfa] capitalize">
          {watermark.positionType === 'custom'
            ? `Custom (${Math.round(watermark.xPercent)}%, ${Math.round(watermark.yPercent)}%)`
            : watermark.positionType.replace('-', ' ')}
        </span>
      </div>

      {/* 9-Position Visual Grid */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#121220] p-2 rounded-2xl border border-[#222234]">
        {gridPositions.map((pos) => {
          const isSelected = watermark.positionType === pos.id;
          return (
            <button
              key={pos.id}
              type="button"
              onClick={() => handleSelectGrid(pos.id)}
              className={`py-2 px-1 rounded-xl text-[10px] font-medium border transition-all cursor-pointer flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-[#7c3aed] text-white border-[#9061f9] shadow-md shadow-[#7c3aed]/20'
                  : 'bg-[#181828] border-transparent text-neutral-400 hover:text-white hover:border-[#33334d]'
              }`}
              title={pos.label}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full mb-1 ${
                  isSelected ? 'bg-white' : 'bg-neutral-500'
                }`}
              />
              <span className="truncate max-w-[65px]">{pos.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom X / Y Percentage Sliders */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>X Offset</span>
            <span className="font-mono text-white">{Math.round(watermark.xPercent)}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="95"
            value={Math.round(watermark.xPercent)}
            onChange={(e) =>
              onChange({
                positionType: 'custom',
                xPercent: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-[#7c3aed] bg-[#222234] rounded-lg h-1.5 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Y Offset</span>
            <span className="font-mono text-white">{Math.round(watermark.yPercent)}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="95"
            value={Math.round(watermark.yPercent)}
            onChange={(e) =>
              onChange({
                positionType: 'custom',
                yPercent: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-[#7c3aed] bg-[#222234] rounded-lg h-1.5 cursor-pointer"
          />
        </div>
      </div>

      <p className="text-[10px] text-neutral-500 flex items-center gap-1">
        <Move className="w-3 h-3 text-[#a78bfa]" />
        <span>Tip: You can also drag the watermark directly over the preview page!</span>
      </p>
    </div>
  );
};
