import React from 'react';
import { Combine, ShieldCheck, Cpu } from 'lucide-react';

interface MergeProcessingStateProps {
  progressPercent: number;
  statusText: string;
  filesCount: number;
}

export const MergeProcessingState: React.FC<MergeProcessingStateProps> = ({
  progressPercent,
  statusText,
  filesCount,
}) => {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="rounded-3xl border border-[#26263c] bg-[#0c0c16] p-8 sm:p-12 relative overflow-hidden shadow-2xl space-y-6">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#7c3aed]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-[#141424] border border-[#2b2b42] flex items-center justify-center text-[#a78bfa] shadow-inner">
          <div className="absolute inset-0 rounded-2xl border-2 border-[#7c3aed] animate-ping opacity-25" />
          <Combine className="w-10 h-10 animate-pulse text-[#c084fc]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#a78bfa] bg-[#7c3aed]/15 px-3 py-1 rounded-full border border-[#7c3aed]/30">
            DocFusion Processing Engine
          </span>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Merging {filesCount} PDF Documents
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 font-mono">
            {statusText || 'Sequentially stitching pages and compiling output...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-2.5 rounded-full bg-[#181826] border border-[#28283c] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] transition-all duration-300 shadow-sm shadow-[#7c3aed]"
              style={{ width: `${Math.max(8, Math.min(100, progressPercent))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-neutral-500">
            <span>Pipeline: Server Sandbox</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
        </div>

        {/* Reassurance notes */}
        <div className="pt-4 border-t border-[#1a1a2a] flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono text-neutral-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Zero Disk Persistence
          </span>
          <span className="text-neutral-700 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5 text-neutral-400">
            <Cpu className="w-4 h-4 text-neutral-500" /> Vector Fidelity Preserved
          </span>
        </div>
      </div>
    </div>
  );
};
