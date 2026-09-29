import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, AlertCircle, Plus, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';

interface PDFUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isCompact?: boolean;
  disabled?: boolean;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  onFilesSelected,
  isCompact = false,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const filesArray = Array.from(fileList);
    const validPdfs: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of filesArray) {
      if (
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')
      ) {
        // Limit 50MB
        if (file.size > 50 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (exceeds 50MB)`);
        } else {
          validPdfs.push(file);
        }
      } else {
        invalidFiles.push(`${file.name} (not a PDF)`);
      }
    }

    if (invalidFiles.length > 0) {
      setErrorMessage(
        `Skipped invalid files: ${invalidFiles.slice(0, 3).join(', ')}${
          invalidFiles.length > 3 ? ` and ${invalidFiles.length - 3} more` : ''
        }. Only PDF files up to 50MB are supported.`
      );
    }

    if (validPdfs.length > 0) {
      onFilesSelected(validPdfs);
    }

    // Reset input so re-selecting same file fires change event
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  if (isCompact) {
    return (
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          leftIcon={<Plus className="w-4 h-4 text-[#a78bfa]" />}
          disabled={disabled}
          className="border-[#2b2b3f] hover:border-[#7c3aed]/50"
        >
          Add More PDFs
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
          isDragOver
            ? 'border-[#7c3aed] bg-[#7c3aed]/10 scale-[1.008] shadow-2xl shadow-[#7c3aed]/20'
            : 'border-[#26263a] bg-[#0c0c14]/90 hover:border-[#7c3aed]/40 hover:bg-[#10101a]'
        }`}
      >
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#7c3aed]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto flex flex-col items-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
              isDragOver
                ? 'bg-[#7c3aed] text-white border-[#9333ea] scale-110 shadow-lg shadow-[#7c3aed]/40'
                : 'bg-[#141422] border-[#292940] text-[#a78bfa]'
            }`}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isDragOver ? 'Drop PDF files here' : 'Upload PDF Files to Merge'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              Drag & drop multiple PDF files, or click to browse from your device.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              leftIcon={<FileUp className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="shadow-lg shadow-[#7c3aed]/25"
            >
              Choose PDF Files
            </Button>
          </div>

          {/* Micro requirements info */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-neutral-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> Multi-file selection
            </span>
            <span className="text-neutral-700">•</span>
            <span>PDF files only</span>
            <span className="text-neutral-700">•</span>
            <span>Up to 50MB per file</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
