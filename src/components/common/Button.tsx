import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#08080a] select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4.5 py-2.5 gap-2 h-10',
    lg: 'text-sm sm:text-base px-6 py-3.5 gap-2.5 h-12',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#4f46e5] hover:from-[#6d28d9] hover:via-[#5850ec] hover:to-[#4338ca] text-white shadow-lg shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 border border-white/10',
    secondary:
      'bg-slate-100 hover:bg-slate-200 dark:bg-[#14141d] dark:hover:bg-[#1c1c28] text-slate-800 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-[#232332] shadow-xs',
    outline:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-[#2b2b3b] hover:border-slate-400 dark:hover:border-neutral-500',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white',
    danger:
      'bg-rose-600/90 hover:bg-rose-600 text-white shadow-md shadow-rose-900/30 border border-rose-500/20',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
