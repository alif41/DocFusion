import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, RefreshCw, AlertCircle, FileCheck } from 'lucide-react';
import { formatFileSize } from '../../utils';
import { Button } from '../common/Button';

interface SplitUploaderProps {
  currentFile: File | null;
  totalPageCount?: number;
  isLoadingMetadata?: boolean;
  onFileSelect: (file: File) => void;
  onReset: () => void;
}

export const SplitUploader: React.FC<SplitUploaderProps> = ({
  currentFile,
  totalPageCount,
  isLoadingMetadata,
  onFileSelect,
  onReset,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const validateAndSelect = (file: File) => {
    setErrorMessage(null);

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErrorMessage(`"${file.name}" is not a recognized PDF document.`);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage(`"${file.name}" exceeds the 100MB file size limit.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
    // reset input value so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // If a file is selected, show an active document card
  if (currentFile) {
    return (
      <div className="rounded-2xl border border-[#232338] bg-[#11111a] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center text-[#a78bfa] shrink-0">
              <FileCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate max-w-[260px] sm:max-w-md font-mono">
                  {currentFile.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0">
                  Ready to Split
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono flex items-center gap-2">
                <span>{formatFileSize(currentFile.size)}</span>
                <span>•</span>
                {isLoadingMetadata ? (
                  <span className="text-[#a78bfa] animate-pulse">Inspecting pages...</span>
                ) : (
                  <span>{totalPageCount ?? 1} total pages</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-neutral-400" />}
              className="text-xs"
            >
              Choose Different PDF
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center cursor-pointer group ${
          isDragOver
            ? 'border-[#7c3aed] bg-[#7c3aed]/10 shadow-2xl shadow-[#7c3aed]/20 scale-[1.01]'
            : 'border-[#222234] bg-[#0c0c14]/70 hover:border-[#7c3aed]/50 hover:bg-[#12121d]/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#141422] border border-[#252538] flex items-center justify-center mx-auto text-[#a78bfa] group-hover:scale-110 group-hover:border-[#7c3aed]/40 transition-all duration-300 shadow-lg">
            <UploadCloud className="w-8 h-8 text-[#a78bfa]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Select or Drop PDF to Split
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              Drag and drop your document here, or click to browse files
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<FileText className="w-4 h-4 text-white" />}
              className="shadow-lg shadow-[#7c3aed]/25"
            >
              Browse Files
            </Button>
          </div>

          <p className="text-[11px] font-mono text-neutral-400 pt-1">
            Standard PDF documents up to 100MB • Secure client-side processing
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
