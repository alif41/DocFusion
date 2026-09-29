import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ALL_CONVERSIONS } from './config';
import { ConversionConfig, ConversionType } from './types';

interface ConverterSelectorProps {
  currentType: ConversionType;
  onSelect: (config: ConversionConfig) => void;
  disabled?: boolean;
}

export const ConverterSelector: React.FC<ConverterSelectorProps> = ({
  currentType,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-none py-1">
      <div className="flex items-center gap-2 min-w-max">
        {ALL_CONVERSIONS.map((cfg) => {
          const isActive = cfg.id === currentType;
          return (
            <button
              key={cfg.id}
              onClick={() => !disabled && onSelect(cfg)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25 border border-[#9061f9]'
                  : 'bg-[#141424] text-neutral-400 hover:text-white hover:bg-[#1a1a30] border border-[#26263c]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{cfg.sourceFormat}</span>
              <ArrowRight className="w-3 h-3 text-current opacity-70" />
              <span>{cfg.targetFormat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
