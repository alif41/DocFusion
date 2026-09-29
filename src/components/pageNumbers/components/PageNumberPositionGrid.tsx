import React from 'react';
import { PageNumberPosition } from '../types';

interface PageNumberPositionGridProps {
  value: PageNumberPosition;
  onChange: (pos: PageNumberPosition) => void;
}

export const PageNumberPositionGrid: React.FC<PageNumberPositionGridProps> = ({
  value,
  onChange,
}) => {
  const positions: { id: PageNumberPosition; label: string; location: string }[] = [
    { id: 'top-left', label: 'Top Left', location: 'Header' },
    { id: 'top-center', label: 'Top Center', location: 'Header' },
    { id: 'top-right', label: 'Top Right', location: 'Header' },
    { id: 'bottom-left', label: 'Bottom Left', location: 'Footer' },
    { id: 'bottom-center', label: 'Bottom Center', location: 'Footer' },
    { id: 'bottom-right', label: 'Bottom Right', location: 'Footer' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 font-semibold">
          Page Position
        </label>
        <span className="text-[11px] font-mono text-[#7c3aed] dark:text-[#a78bfa] capitalize">
          {value.replace('-', ' ')}
        </span>
      </div>

      {/* Simulated Document Grid */}
      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-[#101018] border border-slate-200 dark:border-[#222234]">
        {/* Header Positions */}
        <div className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>Header</span>
          <span className="text-[9px]">Top Margins</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {positions.slice(0, 3).map((pos) => {
            const isSelected = value === pos.id;
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => onChange(pos.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-md shadow-[#7c3aed]/25 font-bold'
                    : 'bg-white dark:bg-[#161624] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#262638] hover:border-[#7c3aed]/50'
                }`}
              >
                <div
                  className={`w-3.5 h-2 rounded-xs border ${
                    isSelected
                      ? 'border-white bg-white/40'
                      : 'border-slate-400 dark:border-neutral-500'
                  }`}
                />
                <span className="text-[11px] truncate w-full">{pos.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Document Body Indicator */}
        <div className="my-2 py-3 px-3 rounded-xl border border-dashed border-slate-300 dark:border-[#28283c] bg-white/50 dark:bg-white/[0.02] text-center">
          <p className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
            Document Content Area
          </p>
        </div>

        {/* Footer Positions */}
        <div className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5 mt-2 flex items-center justify-between">
          <span>Footer</span>
          <span className="text-[9px]">Bottom Margins</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {positions.slice(3, 6).map((pos) => {
            const isSelected = value === pos.id;
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => onChange(pos.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-md shadow-[#7c3aed]/25 font-bold'
                    : 'bg-white dark:bg-[#161624] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#262638] hover:border-[#7c3aed]/50'
                }`}
              >
                <span className="text-[11px] truncate w-full">{pos.label}</span>
                <div
                  className={`w-3.5 h-2 rounded-xs border ${
                    isSelected
                      ? 'border-white bg-white/40'
                      : 'border-slate-400 dark:border-neutral-500'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
