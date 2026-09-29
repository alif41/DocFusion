import React from 'react';
import { RotateCw } from 'lucide-react';
import { WatermarkItem } from '../types';
import { WATERMARK_PDF_CONFIG } from '../config/watermarkPdfConfig';

interface RotationControlProps {
  watermark: WatermarkItem;
  onChange: (updates: Partial<WatermarkItem>) => void;
}

export const RotationControl: React.FC<RotationControlProps> = ({
  watermark,
  onChange,
}) => {
  const { quickRotations } = WATERMARK_PDF_CONFIG;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
          <RotateCw className="w-3.5 h-3.5 text-neutral-400" />
          <span>Rotation</span>
        </div>
        <span className="font-mono text-[#a78bfa] font-bold">{watermark.rotation}°</span>
      </div>

      {/* Quick Preset Buttons */}
      <div className="grid grid-cols-5 gap-1.5">
        {quickRotations.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onChange({ rotation: item.angle })}
            className={`py-1 rounded-lg text-[11px] font-mono font-medium border transition-colors cursor-pointer ${
              watermark.rotation === item.angle
                ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white font-bold'
                : 'bg-[#121220] border-[#222234] text-neutral-400 hover:text-white hover:border-[#38384f]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Range Slider */}
      <input
        type="range"
        min="-180"
        max="180"
        step="5"
        value={watermark.rotation}
        onChange={(e) => onChange({ rotation: parseInt(e.target.value, 10) })}
        className="w-full accent-[#7c3aed] bg-[#222234] rounded-lg h-1.5 cursor-pointer"
      />
    </div>
  );
};
