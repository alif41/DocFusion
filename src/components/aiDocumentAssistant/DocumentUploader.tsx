import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowRight,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { Button } from '../common/Button';

interface DocumentUploaderProps {
  onFileSelected: (file: File) => void;
  onLoadSample: () => void;
  isLoading: boolean;
  loadingStatus: string;
  errorMessage: string | null;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onFileSelected,
  onLoadSample,
  isLoading,
  loadingStatus,
  errorMessage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Zone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-[#7c3aed] bg-[#7c3aed]/10 scale-[1.01] shadow-2xl shadow-[#7c3aed]/20'
            : 'border-[#26263a] bg-[#0c0c16]/90 hover:border-[#7c3aed]/50 hover:bg-[#10101f] shadow-xl'
        } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none" />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-5 py-6 relative z-10">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shadow-xl shadow-[#7c3aed]/30 animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0c0c16] flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              </span>
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Analyzing Document Intelligence...
              </h3>
              <p className="text-xs sm:text-sm text-[#a78bfa] font-mono">{loadingStatus}</p>
            </div>

            <div className="w-48 bg-[#1a1a2e] h-2 rounded-full overflow-hidden border border-[#2b2b40]">
              <div className="bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#6366f1] h-full w-full animate-indeterminate rounded-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7c3aed]/20 to-[#6366f1]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#c084fc] shadow-lg shadow-[#7c3aed]/10 group-hover:scale-105 transition-transform">
              <UploadCloud className={`w-8 h-8 ${isDragging ? 'animate-bounce' : ''}`} />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Upload Document to Chat with AI
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                Drag and drop your PDF, Word (.docx), or text file, or browse from your computer
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Button
                type="button"
                variant="primary"
                size="md"
                leftIcon={<Sparkles className="w-4 h-4 text-white" />}
                className="shadow-lg shadow-[#7c3aed]/25"
              >
                Choose Document
              </Button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadSample();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#7c3aed]/40 text-xs font-semibold text-[#a78bfa] hover:text-white transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Try Sample SLA Document</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono text-neutral-400">
              <span className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
                Supported: PDF, DOCX, TXT, MD
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
                Max Size: 45MB
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Disk Retention
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold">Document Ingestion Interrupted</p>
            <p className="text-rose-200/80">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 3 Core Capability Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-5 rounded-2xl bg-[#0e0e1a]/80 border border-[#202034] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 text-[#a78bfa] flex items-center justify-center mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Grounded Gemini Cognition</h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Answers strictly derived from your document's text. Hallucinations are actively suppressed.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e0e1a]/80 border border-[#202034] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Precise Page Citations</h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Every statement references the exact page or clause so you can verify sources in seconds.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e0e1a]/80 border border-[#202034] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Confidential In-Memory Vault</h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Buffers reside in volatile server memory during the chat session and are destroyed upon close.
          </p>
        </div>
      </div>
    </div>
  );
};
