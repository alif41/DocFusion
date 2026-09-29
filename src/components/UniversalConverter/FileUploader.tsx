import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, AlertCircle, ShieldCheck } from 'lucide-react';
import { ConversionConfig } from './types';

interface FileUploaderProps {
  config: ConversionConfig;
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  config,
  onFileSelected,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setDragError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isSupported = config.sourceExts.includes(ext);

    if (!isSupported) {
      setDragError(
        `This file type isn't supported for this conversion. Please upload a ${config.sourceFormat} file (${config.sourceExts.join(', ')}).`
      );
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      setDragError('File exceeds the 50MB size limit. Please choose a smaller file.');
      return false;
    }

    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
      e.target.value = '';
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-[#7c3aed] bg-[#7c3aed]/10 scale-[1.01] shadow-xl shadow-[#7c3aed]/10'
            : 'border-[#28283e] bg-[#121220]/70 hover:border-[#434368] hover:bg-[#151528]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={config.sourceExts.join(',')}
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7c3aed]/20 to-[#9333ea]/15 border border-[#7c3aed]/40 flex items-center justify-center text-[#c084fc] shadow-lg shadow-[#7c3aed]/10">
            <UploadCloud className={`w-8 h-8 ${isDragging ? 'animate-bounce' : ''}`} />
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">
              Drag & Drop your {config.sourceFormat} file here
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              or browse from your local computer
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#7c3aed]/20 transition-all cursor-pointer"
          >
            Choose {config.sourceFormat}
          </button>

          {/* Formats info badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-neutral-400">
            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
              Accepted: {config.sourceExts.join(', ').toUpperCase()}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
              Max size: 50MB
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Privacy sandbox
            </span>
          </div>
        </div>
      </div>

      {dragError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{dragError}</span>
        </div>
      )}
    </div>
  );
};
