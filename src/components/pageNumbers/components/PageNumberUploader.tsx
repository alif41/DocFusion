import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  ShieldCheck,
  Zap,
  Lock,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { formatFileSize } from '../../../utils';

interface PageNumberUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const PageNumberUploader: React.FC<PageNumberUploaderProps> = ({
  onFileSelect,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('Please select a valid PDF (.pdf) document.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg('File size exceeds 100MB limit. Please upload a smaller document.');
      return;
    }
    if (file.size === 0) {
      setErrorMsg('The selected PDF file is empty (0 bytes).');
      return;
    }
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer border-2 border-dashed ${
          isDragging
            ? 'border-[#7c3aed] bg-[#7c3aed]/10 scale-[1.01]'
            : 'border-slate-300 dark:border-[#222234] bg-white dark:bg-[#0e0e18] hover:border-[#7c3aed]/50 hover:bg-slate-50/50 dark:hover:bg-[#121220]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          {/* Animated Icon Emblem */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7c3aed]/20 via-[#6366f1]/20 to-[#38bdf8]/20 border border-[#7c3aed]/30 text-[#7c3aed] dark:text-[#a78bfa] mx-auto flex items-center justify-center shadow-lg shadow-[#7c3aed]/10">
            <Hash className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Select or Drop PDF Document
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
              Drag and drop your PDF here or browse from your device. Insert headers, footers, and page numbers with zero server leaks.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              leftIcon={<Upload className="w-4 h-4 text-white" />}
              className="shadow-xl shadow-[#7c3aed]/25 font-bold"
              disabled={isLoading}
            >
              {isLoading ? 'Loading PDF...' : 'Choose PDF File'}
            </Button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 pt-2">
            Maximum file size: 100MB • Up to 1,000 pages
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Security & Feature Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-[#12121e] border border-slate-200 dark:border-[#1e1e2d] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">100% Client-Side</h5>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400">Zero data leaves browser</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-[#12121e] border border-slate-200 dark:border-[#1e1e2d] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/10 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Instant Stamping</h5>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400">Sub-second execution</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-[#12121e] border border-slate-200 dark:border-[#1e1e2d] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Cover Page Skip</h5>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400">Preserves title &amp; index</p>
          </div>
        </div>
      </div>
    </div>
  );
};
