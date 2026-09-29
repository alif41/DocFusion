import React from 'react';
import {
  Loader2,
  FileCheck2,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { OrganizeProcessingStep } from '../types';

interface ProcessingStateProps {
  currentStep: OrganizeProcessingStep;
  progressPercent: number;
  filename: string;
  pageCount: number;
}

const STEPS = [
  { id: 'preparing', label: 'Preparing PDF', icon: FileText },
  { id: 'applying', label: 'Applying New Page Order', icon: Layers },
  { id: 'rebuilding', label: 'Rebuilding PDF', icon: Cpu },
  { id: 'finalizing', label: 'Finalizing Document', icon: Sparkles },
  { id: 'completed', label: 'Organized PDF Ready', icon: CheckCircle2 },
];

export const ProcessingState: React.FC<ProcessingStateProps> = ({
  currentStep,
  progressPercent,
  filename,
  pageCount,
}) => {
  const getStepStatus = (stepId: string) => {
    const order = ['preparing', 'applying', 'rebuilding', 'finalizing', 'completed'];
    const currentIndex = order.indexOf(currentStep);
    const targetIndex = order.indexOf(stepId);

    if (targetIndex < currentIndex) return 'done';
    if (targetIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="rounded-3xl border border-[#24243a] bg-[#0c0c16] p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl space-y-8">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#7c3aed]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#6366f1]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Central Spinner & Title */}
        <div className="space-y-4 relative z-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#17142b] border border-[#3b3260] flex items-center justify-center text-[#a78bfa] shadow-lg shadow-[#7c3aed]/20">
            <Loader2 className="w-8 h-8 animate-spin text-[#a78bfa]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Organizing Your PDF
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              Applying your custom page arrangement for <span className="text-neutral-200 font-mono">{filename}</span> ({pageCount} pages)
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">Progress</span>
            <span className="text-[#c084fc] font-bold">{progressPercent}%</span>
          </div>

          <div className="h-2 w-full bg-[#161626] rounded-full overflow-hidden border border-[#222234]">
            <div
              className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] transition-all duration-300 rounded-full shadow-md shadow-[#7c3aed]/40"
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            />
          </div>
        </div>

        {/* Vertical Stepper List */}
        <div className="space-y-3 pt-2 text-left relative z-10">
          {STEPS.map((step) => {
            const status = getStepStatus(step.id);
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                  status === 'done'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : status === 'active'
                    ? 'bg-[#18142c] border-[#7c3aed]/60 text-white shadow-lg shadow-[#7c3aed]/10 ring-1 ring-[#7c3aed]/40'
                    : 'bg-[#10101c]/50 border-[#1a1a2a] text-neutral-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      status === 'done'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : status === 'active'
                        ? 'bg-[#7c3aed] text-white'
                        : 'bg-[#181828] text-neutral-600'
                    }`}
                  >
                    {status === 'done' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : status === 'active' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold">{step.label}</span>
                </div>

                <span className="text-[11px] font-mono capitalize text-neutral-400">
                  {status === 'done' ? 'Done' : status === 'active' ? 'Working...' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
