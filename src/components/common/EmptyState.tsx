import React from 'react';
import { FileQuestion, Plus, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  badgeText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
  badgeText = 'Architecture Ready',
}) => {
  return (
    <div
      className={`rounded-2xl border border-dashed border-[#262638] bg-[#0c0c12]/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#14141f] border border-[#232332] text-[#a78bfa] flex items-center justify-center shadow-inner">
        {icon || <FileQuestion className="w-7 h-7" />}
      </div>

      <div className="space-y-1.5 max-w-md">
        {badgeText && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#a78bfa] bg-[#7c3aed]/10 px-2 py-0.5 rounded-full border border-[#7c3aed]/20">
            {badgeText}
          </span>
        )}
        <h4 className="text-lg font-bold text-white tracking-tight">{title}</h4>
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && (
        <div className="pt-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onAction}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
