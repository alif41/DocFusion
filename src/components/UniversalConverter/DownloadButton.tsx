import React from 'react';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  downloadUrl: string;
  filename: string;
  sizeFormatted?: string;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  downloadUrl,
  filename,
  sizeFormatted,
  className = '',
  variant = 'primary',
}) => {
  return (
    <a
      href={downloadUrl}
      download={filename}
      className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all duration-200 cursor-pointer ${
        variant === 'primary'
          ? 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 hover:scale-[1.02]'
          : 'bg-[#1a1a2e] hover:bg-[#22223c] text-white border border-[#30304a]'
      } ${className}`}
    >
      <Download className="w-4 h-4" />
      <span>Download File</span>
      {sizeFormatted && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
          {sizeFormatted}
        </span>
      )}
    </a>
  );
};
