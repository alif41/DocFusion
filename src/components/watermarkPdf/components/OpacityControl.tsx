import React from 'react';
import { Eye } from 'lucide-react';
import { WatermarkItem } from '../types';

interface OpacityControlProps {
  watermark: WatermarkItem;
  onChange: (updates: Partial<WatermarkItem>) => void;
}

export const OpacityControl: React.FC<OpacityControlProps> = ({
  watermark,
  onChange,
}) => {
  const percent = Math.round(watermark.opacity * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
          <Eye className="w-3.5 h-3.5 text-neutral-400" />
          <span>Opacity</span>
        </div>
        <span className="font-mono text-[#a78bfa] font-bold">{percent}%</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-neutral-500 font-mono">0%</span>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={percent}
          onChange={(e) =>
            onChange({ opacity: parseFloat((parseInt(e.target.value, 10) / 100).toFixed(2)) })
          }
          className="w-full accent-[#7c3aed] bg-[#222234] rounded-lg h-1.5 cursor-pointer"
        />
        <span className="text-[10px] text-neutral-500 font-mono">100%</span>
      </div>
    </div>
  );
};
