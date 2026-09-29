import React from 'react';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, onBack }) => {
  return (
    <div className="bg-[#141424] border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-white">Photo Conversion Interrupted</h3>
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">{message}</p>
      </div>

      <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-[#7c3aed]/20"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-[#1e1e32] hover:bg-[#272740] text-neutral-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors border border-[#30304a]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Photo Converters</span>
        </button>
      </div>
    </div>
  );
};
