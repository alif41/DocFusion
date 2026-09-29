import React from 'react';

interface ProgressBarProps {
  stage: string;
  percent: number;
  secondaryText?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  stage,
  percent,
  secondaryText,
}) => {
  const boundedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="font-bold tracking-wider text-[#171717] uppercase">
          {stage}
        </span>
        <span className="font-semibold text-[#666666]">
          {boundedPercent}%
        </span>
      </div>

      <div className="w-full h-2.5 bg-[#EAEAE5] rounded-full overflow-hidden p-0.5 border border-[#E0E0DA]">
        <div
          className="h-full bg-[#20221F] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${boundedPercent}%` }}
        />
      </div>

      {secondaryText && (
        <p className="text-xs text-[#666666] font-sans">
          {secondaryText}
        </p>
      )}
    </div>
  );
};
