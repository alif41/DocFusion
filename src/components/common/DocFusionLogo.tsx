import React from 'react';

export interface DocFusionLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  variant?: 'dark' | 'original' | 'badge';
  onClick?: () => void;
}

export const DocFusionLogo: React.FC<DocFusionLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  showSubtitle = false,
  variant = 'dark',
  onClick,
}) => {
  // Icon dimensions
  const iconDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  }[size];

  // Primary title text sizes
  const titleSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl sm:text-4xl',
  }[size];

  // Subtitle text sizes
  const subtitleSizes = {
    xs: 'text-[7px] tracking-[1.4px]',
    sm: 'text-[8px] tracking-[1.8px]',
    md: 'text-[9px] tracking-[2px]',
    lg: 'text-[10px] tracking-[2.2px]',
    xl: 'text-[12px] tracking-[2.6px]',
  }[size];

  // Radiant Modern DocFusion Vector Emblem
  const renderIcon = () => (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconDimensions} flex-shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1`}
    >
      <defs>
        {/* Primary Ambient Glow */}
        <filter id="dfGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Back Document Sheet Gradient */}
        <linearGradient id="dfBackSheet" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* Front Sheet / Overlap Fusion Gradient */}
        <linearGradient id="dfFrontSheet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="60%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Dynamic Electric Fusion Core Ribbon */}
        <linearGradient id="dfFusionRibbon" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>

        {/* Glassmorphic Sheet Stroke */}
        <linearGradient id="dfStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Background Soft Glow Aura */}
      <circle cx="60" cy="60" r="42" fill="#7c3aed" opacity="0.22" filter="url(#dfGlow)" />

      {/* Layer 1: Back Document Sheet (Angled) */}
      <g transform="rotate(-6 60 60)">
        <rect
          x="26"
          y="20"
          width="54"
          height="76"
          rx="10"
          fill="url(#dfBackSheet)"
          opacity="0.85"
        />
        {/* Subtle Fold Ear on Back Sheet */}
        <path
          d="M 64 20 L 80 36 L 64 36 Z"
          fill="#4338ca"
          opacity="0.9"
        />
      </g>

      {/* Layer 2: Front Translucent / Glass Document Sheet */}
      <g transform="rotate(4 60 60)">
        <rect
          x="40"
          y="24"
          width="54"
          height="76"
          rx="10"
          fill="url(#dfFrontSheet)"
          fillOpacity="0.92"
          stroke="url(#dfStroke)"
          strokeWidth="1.5"
        />

        {/* Horizontal Document Code/Content Hint Lines */}
        <rect x="49" y="44" width="22" height="3" rx="1.5" fill="#ffffff" fillOpacity="0.75" />
        <rect x="49" y="52" width="34" height="3" rx="1.5" fill="#ffffff" fillOpacity="0.45" />
        <rect x="49" y="60" width="28" height="3" rx="1.5" fill="#ffffff" fillOpacity="0.45" />
      </g>

      {/* Layer 3: Dynamic Fusing Infinity Ribbon ('F' / 'Fusion Wave') */}
      <path
        d="M 28 82 C 34 62 48 50 64 54 C 80 58 84 76 96 66 C 102 60 102 46 96 38"
        stroke="url(#dfFusionRibbon)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sparkling Fusion Center Node */}
      <circle cx="64" cy="54" r="4.5" fill="#ffffff" />
      <circle cx="64" cy="54" r="2.5" fill="#38bdf8" />

      {/* Upper-right energy particle */}
      <circle cx="96" cy="38" r="3" fill="#38bdf8" />
      <circle cx="28" cy="82" r="3" fill="#a855f7" />
    </svg>
  );

  // Badge Variant for Light/Accent contexts
  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-3 bg-white dark:bg-[#12121e] px-3.5 py-1.5 rounded-2xl border border-slate-200/90 dark:border-[#2b2b40] shadow-sm select-none group cursor-pointer hover:border-[#7c3aed]/50 transition-colors ${className}`}
      >
        {renderIcon()}
        {showText && (
          <div className="flex flex-col">
            <span className={`${titleSizes} font-extrabold tracking-tight text-slate-900 dark:text-white leading-none flex items-center`}>
              <span>Doc</span>
              <span className="bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#38bdf8] bg-clip-text text-transparent ml-0.5">
                Fusion
              </span>
            </span>
            {(showSubtitle || size === 'lg' || size === 'xl') && (
              <span className={`${subtitleSizes} font-bold text-[#7c3aed] dark:text-[#a78bfa] uppercase mt-0.5 leading-none`}>
                DOCUMENT INTEGRATION &amp; MANAGEMENT
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Standard Modern Inline Brand Logo
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none group ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {renderIcon()}

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center">
            <span className={`${titleSizes} font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center`}>
              <span>Doc</span>
              <span className="bg-gradient-to-r from-[#8b5cf6] via-[#6366f1] to-[#38bdf8] bg-clip-text text-transparent ml-0.5">
                Fusion
              </span>
            </span>
          </div>

          {(showSubtitle || size === 'lg' || size === 'xl') && (
            <span
              className={`${subtitleSizes} font-bold text-[#7c3aed] dark:text-[#a78bfa] uppercase mt-0.5 whitespace-nowrap`}
            >
              DOCUMENT INTEGRATION &amp; MANAGEMENT
            </span>
          )}
        </div>
      )}
    </div>
  );
};
