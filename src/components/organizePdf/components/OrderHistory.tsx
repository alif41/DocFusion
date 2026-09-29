import React from 'react';
import { Layers, CheckCircle2, AlertCircle, FileStack } from 'lucide-react';

interface OrderHistoryProps {
  originalPageCount: number;
  currentPageCount: number;
  reorderedCount: number;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  originalPageCount,
  currentPageCount,
  reorderedCount,
}) => {
  const hasChanges = reorderedCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
      {/* Original Pages */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-300">
        <FileStack className="w-3.5 h-3.5 text-neutral-400" />
        <span>Original Pages: {originalPageCount}</span>
      </div>

      {/* Current Pages */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-300">
        <Layers className="w-3.5 h-3.5 text-[#a78bfa]" />
        <span>Current Pages: {currentPageCount}</span>
      </div>

      {/* Pages Reordered */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-colors ${
          hasChanges
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold'
            : 'bg-white/[0.04] border-white/[0.08] text-neutral-400'
        }`}
      >
        <span>Pages Reordered: {reorderedCount}</span>
      </div>

      {/* Changes Status Badge */}
      <div className="flex items-center gap-1.5">
        {hasChanges ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-[#c084fc] font-semibold text-[11px]">
            <AlertCircle className="w-3 h-3 text-[#c084fc]" />
            Unsaved page arrangement
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            No changes made
          </span>
        )}
      </div>
    </div>
  );
};
