import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle, ShieldCheck, Plus } from 'lucide-react';
import { PhotoConversionConfig, PhotoFileInfo } from './types';

interface ImageUploaderProps {
  config: PhotoConversionConfig;
  onFilesSelected: (files: PhotoFileInfo[]) => void;
  disabled?: boolean;
  isCompact?: boolean; // For "+ Add More Photos" button
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  config,
  onFilesSelected,
  disabled = false,
  isCompact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File): Promise<PhotoFileInfo | null> => {
    return new Promise((resolve) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAccepted = config.sourceExts.includes(ext);

      if (!isAccepted) {
        setDragError(
          `"${file.name}" isn't a supported ${config.sourceFormat} file (${config.sourceExts.join(', ')}).`
        );
        return resolve(null);
      }

      if (file.size > 50 * 1024 * 1024) {
        setDragError(`"${file.name}" exceeds the 50MB size limit.`);
        return resolve(null);
      }

      const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);

      // If it's a standard web image, load dimensions
      if (
        file.type.startsWith('image/') &&
        !file.name.toLowerCase().endsWith('.heic') &&
        !file.name.toLowerCase().endsWith('.heif') &&
        !file.name.toLowerCase().endsWith('.cr2') &&
        !file.name.toLowerCase().endsWith('.nef') &&
        !file.name.toLowerCase().endsWith('.arw') &&
        !file.name.toLowerCase().endsWith('.dng')
      ) {
        const img = new Image();
        img.onload = () => {
          resolve({
            id,
            file,
            name: file.name,
            size: file.size,
            extension: ext,
            previewUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            status: 'ready',
          });
        };
        img.onerror = () => {
          resolve({
            id,
            file,
            name: file.name,
            size: file.size,
            extension: ext,
            previewUrl,
            status: 'ready',
          });
        };
        img.src = previewUrl;
      } else {
        // For PDF, HEIC, RAW, resolve immediately
        resolve({
          id,
          file,
          name: file.name,
          size: file.size,
          extension: ext,
          previewUrl,
          status: 'ready',
        });
      }
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setDragError(null);

    const toProcess = config.allowsMultiple ? Array.from(fileList) : [fileList[0]];
    const results = await Promise.all(toProcess.map((f) => processFile(f)));
    const valid = results.filter((r): r is PhotoFileInfo => r !== null);

    if (valid.length > 0) {
      onFilesSelected(valid);
    }
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    await handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFiles(e.target.files);
    e.target.value = '';
  };

  if (isCompact) {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={config.sourceExts.join(',')}
          multiple={config.allowsMultiple}
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c1c2e] hover:bg-[#26263e] text-xs font-semibold text-white border border-[#2d2d46] hover:border-[#7c3aed]/50 transition-all cursor-pointer disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5 text-[#a78bfa]" />
          <span>+ Add More Photos</span>
        </button>
      </div>
    );
  }

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
          multiple={config.allowsMultiple}
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
              Drag &amp; Drop your {config.sourceFormat} {config.allowsMultiple ? 'photos' : 'file'} here
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              or browse from your local computer {config.allowsMultiple ? '(batch supported)' : ''}
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#7c3aed]/20 transition-all cursor-pointer"
          >
            Choose {config.sourceFormat} {config.allowsMultiple ? 'Photos' : 'File'}
          </button>

          {/* Formats info badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-neutral-400">
            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
              Supported format: {config.sourceFormat} ({config.sourceExts.join(', ').toUpperCase()})
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
              Max size: 50MB per file
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
