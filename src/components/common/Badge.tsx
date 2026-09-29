import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'emerald' | 'amber' | 'blue' | 'neutral' | 'gradient';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'purple',
  size = 'sm',
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 font-mono',
    md: 'text-xs px-3 py-1 font-mono',
  }[size];

  const variantClasses = {
    purple:
      'bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#7c3aed]/15 dark:text-[#c4b5fd] border border-[#7c3aed]/30 shadow-xs',
    emerald:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25',
    amber:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25',
    blue:
      'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25',
    neutral:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/[0.05] dark:text-neutral-300 dark:border-white/[0.08]',
    gradient:
      'bg-gradient-to-r from-[#7c3aed]/15 to-[#6366f1]/15 text-[#7c3aed] dark:text-white border border-[#7c3aed]/30',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
