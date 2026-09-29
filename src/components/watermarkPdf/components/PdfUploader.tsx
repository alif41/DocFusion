import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  FileUp,
  Stamp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { WATERMARK_PDF_CONFIG } from '../config/watermarkPdfConfig';

interface PdfUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  onFileSelect,
  isLoading = false,
  errorMessage = null,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndPass = (file: File) => {
    setValidationError(null);

    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = file.type === 'application/pdf' || file.type === '';
    if (!isPdfExt && !isPdfMime) {
      setValidationError('Unsupported format. Please upload a standard PDF (.pdf) file.');
      return;
    }

    if (file.size > WATERMARK_PDF_CONFIG.maxFileSize) {
      setValidationError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowable size is 50MB.`
      );
      return;
    }

    if (file.size === 0) {
      setValidationError('The uploaded PDF file is empty (0 bytes).');
      return;
    }

    onFileSelect(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndPass(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(e.target.files[0]);
    }
  };

  const displayError = validationError || errorMessage;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`group relative rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
          isDragOver
            ? 'border-[#7c3aed] bg-[#7c3aed]/10 scale-[1.01] shadow-2xl shadow-[#7c3aed]/20'
            : 'border-[#26263c] bg-[#0c0c16]/80 hover:border-[#7c3aed]/60 hover:bg-[#121222]/90'
        } ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#7c3aed]/20 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6366f1]/10 rounded-full blur-3xl pointer-events-none" />

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="relative z-10 flex flex-col items-center space-y-4 max-w-lg mx-auto">
          <div
            className={`w-20 h-20 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
              isDragOver
                ? 'bg-[#7c3aed] text-white border-[#9061f9] scale-110 shadow-lg shadow-[#7c3aed]/40'
                : 'bg-[#151524] border-[#2d2d46] text-[#a78bfa] group-hover:scale-105 group-hover:border-[#7c3aed]/60 group-hover:text-white'
            }`}
          >
            {isDragOver ? (
              <FileUp className="w-10 h-10 animate-bounce" />
            ) : (
              <Stamp className="w-10 h-10" />
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Drop your PDF here
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              or <span className="text-[#a78bfa] font-semibold underline underline-offset-4">Browse</span> from your computer
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-neutral-300 bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
              <FileText className="w-3.5 h-3.5 text-[#a78bfa]" />
              Supported format: PDF
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-neutral-400 bg-white/[0.03] border border-white/5 px-3 py-1 rounded-full">
              Up to 50MB • Single PDF
            </span>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<FileUp className="w-4 h-4" />}
              className="shadow-lg shadow-[#7c3aed]/25"
            >
              Select PDF File
            </Button>
          </div>
        </div>
      </div>

      {displayError && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3 text-rose-300 text-xs sm:text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-200">Unable to process PDF</p>
            <p className="text-rose-300/90 leading-relaxed">{displayError}</p>
          </div>
        </div>
      )}

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3.5 rounded-2xl bg-[#0e0e18] border border-[#1f1f30] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[#a78bfa] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Text & Logo Stamps</h4>
            <p className="text-[11px] text-neutral-400">Customizable typography & images</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e0e18] border border-[#1f1f30] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Visual Drag & Drop</h4>
            <p className="text-[11px] text-neutral-400">Position directly on preview</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e0e18] border border-[#1f1f30] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Zero Quality Loss</h4>
            <p className="text-[11px] text-neutral-400">Preserves fonts & vector graphics</p>
          </div>
        </div>
      </div>
    </div>
  );
};
