import React from 'react';
import {
  FileSearch,
  Sparkles,
  CheckCircle2,
  Loader2,
  Scan,
  Type,
  Table,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { AnalysisProgress } from './types';

interface PDFAnalyzerProps {
  progress: AnalysisProgress;
  fileName?: string;
  onCancel?: () => void;
}

const STAGES = [
  { key: 'uploading', label: 'Uploading' },
  { key: 'scanning', label: 'Scanning' },
  { key: 'ocr', label: 'OCR' },
  { key: 'reconstructing', label: 'Reconstructing' },
  { key: 'ready', label: 'Ready' },
] as const;

export const PDFAnalyzer: React.FC<PDFAnalyzerProps> = ({ progress, fileName }) => {
  const currentStageIndex = STAGES.findIndex((s) => s.key === progress.stage);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-8 rounded-3xl bg-[#141420] border border-[#262638] shadow-2xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#7c3aed]/30 to-[#a855f7]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#a78bfa] shadow-lg shadow-[#7c3aed]/10">
          <Scan className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Analyzing your PDF…
        </h2>
        <p className="text-sm text-neutral-400">
          {fileName ? (
            <span className="font-semibold text-white truncate max-w-sm inline-block align-bottom">
              {fileName}
            </span>
          ) : (
            'Parsing layout, typography, tables, and images'
          )}
        </p>
      </div>

      {/* Step Indicator: Uploading → Scanning → OCR → Reconstructing → Ready */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={s.key}
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  isCurrent
                    ? 'text-[#a78bfa] scale-105'
                    : isCompleted
                    ? 'text-emerald-400'
                    : 'text-neutral-500'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/30 animate-pulse'
                      : 'bg-[#1a1a28] border-[#2d2d42] text-neutral-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className="hidden sm:inline-block text-[11px]">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#1c1c2e] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#2a2a3e]">
          <div
            className="bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, progress.percent)}%` }}
          />
        </div>
      </div>

      {/* Current Stage Message */}
      <div className="p-4 rounded-xl bg-[#0c0c14] border border-[#262638] flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-[#a78bfa] animate-spin shrink-0" />
        <div className="text-left flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{progress.message}</p>
          <p className="text-[11px] text-neutral-400">
            {progress.stage === 'ocr'
              ? 'Detecting text within raster scans using neural glyph recognition'
              : 'Preserving exact coordinates, fonts, margins, and page sizes'}
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-[#a78bfa]">{progress.percent}%</span>
      </div>

      {/* Live Feature Detection Checklist */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[#181826] border border-[#262638] flex items-center gap-2.5">
          <Type className="w-4 h-4 text-[#a78bfa] shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">Text & Headings</p>
            <p className="text-[10px] text-neutral-400">Detecting font styles & sizes</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#181826] border border-[#262638] flex items-center gap-2.5">
          <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">Images & Graphics</p>
            <p className="text-[10px] text-neutral-400">Preserving layout positions</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#181826] border border-[#262638] flex items-center gap-2.5">
          <Table className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">Tables & Lists</p>
            <p className="text-[10px] text-neutral-400">Reconstructing grid cells</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#181826] border border-[#262638] flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">OCR Auto-Detection</p>
            <p className="text-[10px] text-neutral-400">Extracts scanned paper text</p>
          </div>
        </div>
      </div>
    </div>
  );
};
