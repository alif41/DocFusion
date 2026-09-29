import React from 'react';
import { Loader2, X, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import { ConversionStage, PhotoConversionConfig } from './types';

interface ConversionProgressProps {
  stage: ConversionStage;
  progressPercent: number;
  currentFileName: string;
  filesCompleted: number;
  totalFiles: number;
  config: PhotoConversionConfig;
  onCancel?: () => void;
}

export const ConversionProgress: React.FC<ConversionProgressProps> = ({
  stage,
  progressPercent,
  currentFileName,
  filesCompleted,
  totalFiles,
  config,
  onCancel,
}) => {
  const stages: { key: ConversionStage; label: string }[] = [
    { key: 'uploading', label: 'Uploading' },
    { key: 'reading', label: 'Reading' },
    { key: 'processing', label: 'Processing' },
    { key: 'optimizing', label: 'Optimizing' },
    { key: 'finalizing', label: 'Finalizing' },
  ];

  const getStageMessage = () => {
    switch (stage) {
      case 'uploading':
        return 'Transferring photo data to secure conversion pipeline...';
      case 'reading':
        return 'Analyzing image metadata, color profiles, and dimensions...';
      case 'processing':
        return `Converting from ${config.sourceFormat} to ${config.targetFormat}...`;
      case 'optimizing':
        return 'Optimizing compression buffers and sharpness...';
      case 'finalizing':
        return 'Assembling and packaging output payload...';
      default:
        return 'Converting your photos...';
    }
  };

  const currentStageIndex = stages.findIndex((s) => s.key === stage);

  return (
    <div className="w-full bg-[#121222] border border-[#2a2a44] rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl">
      <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center text-[#c084fc] mx-auto shadow-lg shadow-[#7c3aed]/20">
        <Loader2 className="w-8 h-8 animate-spin text-[#a78bfa]" />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7c3aed]/10 text-xs font-semibold text-[#a78bfa]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{config.title} Conversion</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Converting your photos...
        </h3>

        {totalFiles > 1 ? (
          <p className="text-xs sm:text-sm font-semibold text-[#c084fc]">
            {filesCompleted} of {totalFiles} photos converted
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-neutral-400 font-mono truncate max-w-md mx-auto">
            {currentFileName}
          </p>
        )}

        <p className="text-xs text-neutral-400 pt-1">{getStageMessage()}</p>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="max-w-md mx-auto space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
          <span className="capitalize">{stage}</span>
          <span className="font-bold text-white">
            {Math.min(100, Math.round(progressPercent))}%
          </span>
        </div>

        <div className="h-2.5 w-full bg-[#1a1a2e] rounded-full overflow-hidden border border-[#2e2e48] p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#ec4899] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, Math.min(100, progressPercent))}%` }}
          />
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="pt-2 max-w-lg mx-auto flex items-center justify-between gap-1 text-[11px] font-medium text-neutral-400">
        {stages.map((stg, idx) => {
          const isDone = currentStageIndex > idx;
          const isCurrent = currentStageIndex === idx;

          return (
            <div key={stg.key} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : isCurrent
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40 scale-110'
                    : 'bg-[#18182a] text-neutral-500 border border-[#2a2a40]'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] hidden sm:inline ${
                  isCurrent ? 'text-white font-semibold' : isDone ? 'text-neutral-300' : 'text-neutral-500'
                }`}
              >
                {stg.label}
              </span>
            </div>
          );
        })}
      </div>

      {onCancel && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel Conversion</span>
          </button>
        </div>
      )}
    </div>
  );
};
