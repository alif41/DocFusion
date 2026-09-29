import React, { useRef, useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Zap,
  ShieldCheck,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../common/Button';

interface PhotoResizeUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isLoading?: boolean;
}

export const PhotoResizeUploader: React.FC<PhotoResizeUploaderProps> = ({
  onFilesSelected,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

  const validateAndAddFiles = (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    const invalidNames: string[] = [];

    Array.from(fileList).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAcceptedMime = file.type.startsWith('image/');
      const isAcceptedExt = acceptedExtensions.includes(ext);

      if (isAcceptedExt || isAcceptedMime) {
        if (file.size > 50 * 1024 * 1024) {
          invalidNames.push(`${file.name} (exceeds 50MB)`);
        } else {
          validFiles.push(file);
        }
      } else {
        invalidNames.push(`${file.name} (unsupported format)`);
      }
    });

    if (invalidNames.length > 0 && validFiles.length === 0) {
      setErrorMessage(`Could not add files: ${invalidNames.slice(0, 3).join(', ')}${invalidNames.length > 3 ? '...' : ''}. Supported formats: JPG, PNG, WEBP, HEIC.`);
      return;
    }

    if (invalidNames.length > 0) {
      setErrorMessage(`Skipped ${invalidNames.length} invalid file(s). Supported formats: JPG, PNG, WEBP, HEIC.`);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
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
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // reset input so same files can be re-selected if removed
    e.target.value = '';
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Zone */}
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
          accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7c3aed]/20 via-[#6366f1]/20 to-[#38bdf8]/20 border border-[#7c3aed]/30 text-[#7c3aed] dark:text-[#a78bfa] mx-auto flex items-center justify-center shadow-lg shadow-[#7c3aed]/10">
            <ImageIcon className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Select or Drop Photos to Resize
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
              Upload single or batch images. Set custom dimensions, lock aspect ratio, resize by percentage, or pick from social &amp; print presets.
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
              {isLoading ? 'Reading Images...' : 'Choose Photos (Single or Batch)'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-500 dark:text-neutral-400 pt-1">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
              JPG / JPEG
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
              PNG
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
              WEBP
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
              HEIC / HEIF
            </span>
            <span className="text-slate-400 dark:text-neutral-500">• Up to 50MB per photo</span>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-[#12121e] border border-slate-200 dark:border-[#1e1e2d] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Ephemeral Processing</h5>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400">Zero permanent storage</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-[#12121e] border border-slate-200 dark:border-[#1e1e2d] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/10 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Batch Resizing</h5>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400">Up to 50 photos at once</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-[#12121e] border border-slate-200 dark:border-[#1e1e2d] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Smart Quality &amp; Presets</h5>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400">Preset ratios &amp; target KB</p>
          </div>
        </div>
      </div>
    </div>
  );
};
