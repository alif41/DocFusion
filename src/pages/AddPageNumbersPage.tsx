import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Hash,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Zap,
  RotateCcw,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Button } from '../components/common/Button';
import { formatFileSize } from '../utils';
import {
  PageNumberOptions,
  PageNumberResult,
  ProcessingStep,
  PageNumberUploader,
  PageNumberPreview,
  PageNumberSettings,
  PageNumberResultView,
  applyPageNumbersToPdf,
} from '../components/pageNumbers';
import { PDFDocument } from 'pdf-lib';

export const AddPageNumbersPage: React.FC = () => {
  useDocumentTitle('Add PDF Page Numbers - Headers, Footers & Numbering');

  // File and metadata state
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Numbering options state with smart defaults
  const [options, setOptions] = useState<PageNumberOptions>({
    position: 'bottom-center',
    format: 'page-n-of-total',
    customFormat: 'Page {n} of {total}',
    fontFamily: 'Helvetica',
    fontSize: 10,
    textColor: '#1f2937',
    opacity: 1.0,
    marginHorizontal: 36,
    marginVertical: 36,
    startFromPage: 1,
    startingNumber: 1,
    skipFirstPage: false,
    skipLastPage: false,
    pageRangeType: 'all',
    customPageRange: '',
    showBackgroundBadge: false,
    badgeStyle: 'white',
  });

  // Processing state
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [result, setResult] = useState<PageNumberResult | null>(null);

  // File selection handler
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setIsLoadingFile(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pagesCount = pdfDoc.getPageCount();

      if (pagesCount === 0) {
        throw new Error('This PDF contains zero pages.');
      }

      setFile(selectedFile);
      setTotalPages(pagesCount);
      setIsLoadingFile(false);
      setStep('idle');
    } catch (err: any) {
      console.error('Failed to parse PDF file:', err);
      setIsLoadingFile(false);
      setErrorMessage(err.message || 'Unable to read this PDF document. Please verify the file is not password-protected.');
    }
  }, []);

  // Update options helper
  const handleUpdateOptions = (updated: Partial<PageNumberOptions>) => {
    setOptions((prev) => ({ ...prev, ...updated }));
  };

  // Execute numbering
  const handleApply = async () => {
    if (!file) return;

    setStep('processing');
    setProgressPercent(10);
    setProgressStatus('Initializing Document Engine...');
    setErrorMessage(null);

    try {
      const res = await applyPageNumbersToPdf(file, options, (status, pct) => {
        setProgressStatus(status);
        setProgressPercent(pct);
      });

      setResult(res);
      setStep('completed');
    } catch (err: any) {
      console.error('Failed to apply page numbers:', err);
      setErrorMessage(err.message || 'Failed to apply page numbers to this document.');
      setStep('error');
    }
  };

  // Full reset
  const handleReset = () => {
    setFile(null);
    setTotalPages(0);
    setResult(null);
    setErrorMessage(null);
    setStep('idle');
    setProgressPercent(0);
  };

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tools Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#7c3aed]/10 text-[#7c3aed] dark:text-[#c084fc] border border-[#7c3aed]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Client-Side Engine</span>
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7c3aed]/20 to-[#38bdf8]/20 border border-[#7c3aed]/30 text-[#7c3aed] dark:text-[#a78bfa] mb-1">
          <Hash className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Add PDF Page Numbers
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Insert professional page numbers, headers, and footers with custom positions, page ranges, cover skips, and vector typography.
        </p>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center justify-between gap-3">
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

      {/* Main Dynamic View Area */}
      {step === 'completed' && result ? (
        <PageNumberResultView result={result} onReset={handleReset} />
      ) : !file ? (
        <PageNumberUploader onFileSelect={handleFileSelect} isLoading={isLoadingFile} />
      ) : (
        <div className="space-y-6">
          {/* Action Bar / Document Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {file.name}
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-neutral-400">
                  <span>{totalPages} {totalPages === 1 ? 'page' : 'pages'}</span>
                  <span>•</span>
                  <span>{formatFileSize(file.size)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Change PDF
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleApply}
                disabled={step === 'processing'}
                leftIcon={<Hash className="w-4 h-4 text-white" />}
                className="shadow-lg shadow-[#7c3aed]/25 font-bold px-6"
              >
                {step === 'processing' ? 'Stamping Numbers...' : 'Apply Page Numbers'}
              </Button>
            </div>
          </div>

          {/* Processing Progress Overlay if active */}
          {step === 'processing' && (
            <div className="p-6 rounded-2xl bg-[#12121e] border border-[#7c3aed]/40 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7c3aed] animate-ping" />
                  <span>{progressStatus || 'Applying Page Numbers...'}</span>
                </span>
                <span className="text-[#a78bfa]">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#38bdf8] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Two-Column Workspace: Left Preview & Right Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Interactive Preview (Cols 1-7) */}
            <div className="lg:col-span-7">
              <PageNumberPreview
                file={file}
                options={options}
                totalPages={totalPages}
              />
            </div>

            {/* Controls Sidebar (Cols 8-12) */}
            <div className="lg:col-span-5">
              <PageNumberSettings
                options={options}
                totalPages={totalPages}
                onChange={handleUpdateOptions}
              />
            </div>
          </div>
        </div>
      )}

      {/* Feature Guide & FAQ */}
      <div className="pt-8 border-t border-slate-200 dark:border-[#1a1a26] space-y-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-slate-900 dark:text-white font-bold text-center">
          Professional PDF Numbering Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#101018] border border-slate-200 dark:border-[#1e1e2d] space-y-2">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Precise 6-Point Placement</span>
            </h5>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Place numbers across top headers or bottom footers with custom margin offsets in points for printing compliance.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#101018] border border-slate-200 dark:border-[#1e1e2d] space-y-2">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
              <span>Smart Cover Page Rules</span>
            </h5>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Omit numbers from title pages and indexes automatically without reordering or extracting pages manually.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#101018] border border-slate-200 dark:border-[#1e1e2d] space-y-2">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Zero-Leak Privacy</span>
            </h5>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              PDFs are processed directly in browser memory via WebAssembly and pdf-lib. Confidential records never hit external servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
