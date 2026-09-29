import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  Sparkles,
  FileCheck,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils';
import { generateDocumentFromTemplate } from '../../services/pdfTemplateService';

interface PDFUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({ onFileSelected, isLoading = false }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleValidateAndSelect = (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF document (.pdf format).');
      return;
    }

    // Validate size (max 80 MB)
    if (file.size > 80 * 1024 * 1024) {
      setErrorMessage(`The file is too large (${formatFileSize(file.size)}). Maximum supported file size is 80 MB.`);
      return;
    }

    if (file.size === 0) {
      setErrorMessage('The selected file is empty. Please choose a valid PDF file.');
      return;
    }

    setSelectedFileInfo({ name: file.name, size: file.size });

    // Smooth upload progress transition
    setUploadProgress(40);
    setTimeout(() => {
      setUploadProgress(100);
      setTimeout(() => {
        onFileSelected(file);
      }, 100);
    }, 150);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleValidateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSampleSelect = async (templateId: 'invoice' | 'nda' | 'blank') => {
    try {
      const generated = await generateDocumentFromTemplate(templateId);
      handleValidateAndSelect(generated.file);
    } catch (e: any) {
      setErrorMessage('Could not load sample template: ' + (e?.message || 'Unknown error'));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-xs font-medium text-[#a78bfa]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Full Document Reconstruction</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          PDF Editor
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto">
          Upload any PDF or scanned paper. Our engine extracts headings, paragraphs, tables, and images,
          giving you a realistic document editing experience while preserving visual fidelity.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 ${
          isDragging
            ? 'border-[#7c3aed] bg-[#7c3aed]/10 scale-[1.01]'
            : 'border-[#262638] bg-[#141420]/70 hover:border-[#383854] hover:bg-[#141420]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleValidateAndSelect(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#7c3aed]/30 to-[#a855f7]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#a78bfa] shadow-lg shadow-[#7c3aed]/10">
            <UploadCloud className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Drag & Drop your PDF file here
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              Supports standard PDFs, scanned documents with OCR, contracts, resumes, and multi-page reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              leftIcon={<FileText className="w-5 h-5" />}
              className="px-8 shadow-md shadow-[#7c3aed]/25"
            >
              Choose PDF File
            </Button>
          </div>

          {/* Progress / Selected Info */}
          {selectedFileInfo && (
            <div className="w-full max-w-md mt-4 p-4 rounded-xl bg-[#0c0c14] border border-[#262638] text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white truncate max-w-[240px]">
                  {selectedFileInfo.name}
                </span>
                <span className="text-neutral-400 font-mono">
                  {formatFileSize(selectedFileInfo.size)}
                </span>
              </div>
              <div className="w-full bg-[#1c1c2e] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#7c3aed] to-[#a855f7] h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-[11px] text-[#a78bfa] flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Preparing document for deep layout scanning...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="w-full max-w-md p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Document Notice</p>
                <p className="text-red-300/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Privacy & Spec Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Client-Side Privacy
            </span>
            <span className="text-neutral-600">•</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#a78bfa]" />
              Up to 80MB File Size
            </span>
            <span className="text-neutral-600">•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Automatic OCR for Scans
            </span>
          </div>
        </div>
      </div>

      {/* Quick Instant Templates */}
      <div className="bg-[#141420]/50 border border-[#262638] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Or test with instant pre-made templates:
          </span>
          <span className="text-xs text-[#a78bfa]">No upload required</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleSampleSelect('invoice')}
            className="flex items-center justify-between p-3 rounded-xl bg-[#0c0c14] border border-[#262638] hover:border-[#7c3aed]/50 text-left transition-all group cursor-pointer"
          >
            <div>
              <p className="text-xs font-bold text-white group-hover:text-[#a78bfa] transition-colors">
                Invoice Template
              </p>
              <p className="text-[11px] text-neutral-400">Tables, line items & totals</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => handleSampleSelect('nda')}
            className="flex items-center justify-between p-3 rounded-xl bg-[#0c0c14] border border-[#262638] hover:border-[#7c3aed]/50 text-left transition-all group cursor-pointer"
          >
            <div>
              <p className="text-xs font-bold text-white group-hover:text-[#a78bfa] transition-colors">
                NDA Agreement
              </p>
              <p className="text-[11px] text-neutral-400">Headings, paragraphs & signatures</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => handleSampleSelect('blank')}
            className="flex items-center justify-between p-3 rounded-xl bg-[#0c0c14] border border-[#262638] hover:border-[#7c3aed]/50 text-left transition-all group cursor-pointer"
          >
            <div>
              <p className="text-xs font-bold text-white group-hover:text-[#a78bfa] transition-colors">
                Blank A4 Document
              </p>
              <p className="text-[11px] text-neutral-400">Start clean typing like Word</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
