import React from 'react';
import { Type, Image as ImageIcon } from 'lucide-react';
import { WatermarkType } from '../types';

interface WatermarkTypeSelectorProps {
  selectedType: WatermarkType;
  onChange: (type: WatermarkType) => void;
}

export const WatermarkTypeSelector: React.FC<WatermarkTypeSelectorProps> = ({
  selectedType,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 bg-[#121220] p-1 rounded-2xl border border-[#222234]">
      <button
        type="button"
        onClick={() => onChange('text')}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          selectedType === 'text'
            ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/30'
            : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <Type className="w-4 h-4" />
        <span>Text Watermark</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('image')}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          selectedType === 'image'
            ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/30'
            : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <ImageIcon className="w-4 h-4" />
        <span>Image / Logo</span>
      </button>
    </div>
  );
};
