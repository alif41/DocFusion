import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Scissors,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  AlertCircle,
  FileCheck,
  CheckCircle,
  Archive,
} from 'lucide-react';
import {
  SplitMode,
  SplitResultData,
  SplitProcessingStep,
} from '../types/pdf';
import { SplitUploader } from '../components/split/SplitUploader';
import { SplitConfigPanel } from '../components/split/SplitConfigPanel';
import { SplitPageGrid } from '../components/split/SplitPageGrid';
import { SplitResultView } from '../components/split/SplitResultView';
import { PDFViewerModal } from '../components/merge/PDFViewerModal';
import { getPDFMetadata } from '../utils/pdfThumbnail';
import {
  splitPDF,
  parsePageRangeString,
  formatPagesToRangeString,
} from '../services/splitService';
import { Button } from '../components/common/Button';

export const SplitPDFPage: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [totalPageCount, setTotalPageCount] = useState<number>(1);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);

  // Configuration state
  const [mode, setMode] = useState<SplitMode>('extract');
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [mergeExtracted, setMergeExtracted] = useState<boolean>(true);
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [splitInterval, setSplitInterval] = useState<number>(2);
  const [rangeType, setRangeType] = useState<'interval' | 'custom'>('interval');
  const [customRangesText, setCustomRangesText] = useState<string>('');

  // Processing & results state
  const [step, setStep] = useState<SplitProcessingStep>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SplitResultData | null>(null);

  // Preview modal for source PDF or page inspection
  const [previewingSource, setPreviewingSource] = useState<boolean>(false);

  // When a file is loaded, inspect total page count
  const handleFileSelect = async (file: File) => {
    setCurrentFile(file);
    setIsLoadingMetadata(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const meta = await getPDFMetadata(file);
      const pages = meta.pageCount || 1;
      setTotalPageCount(pages);
      // Default: select first page
      setSelectedPages([1]);
      setRangeInput('1');
      setCustomRangesText(`1-${Math.min(pages, 2)}, ${Math.min(pages, 3)}-${pages}`);
      setIsLoadingMetadata(false);
    } catch {
      setTotalPageCount(1);
      setSelectedPages([1]);
      setRangeInput('1');
      setIsLoadingMetadata(false);
    }
  };

  // Sync range input when selectedPages changes via clicks
  const handleSelectPages = (newPages: number[]) => {
    setSelectedPages(newPages);
    setRangeInput(formatPagesToRangeString(newPages));
  };

  // Toggle single page from grid card
  const handleTogglePage = (pageNum: number) => {
    const isCurrentlySelected = selectedPages.includes(pageNum);
    const updated = isCurrentlySelected
      ? selectedPages.filter((p) => p !== pageNum)
      : [...selectedPages, pageNum].sort((a, b) => a - b);
    handleSelectPages(updated);
  };

  // Handle typing in range text input
  const handleRangeInputChange = (text: string) => {
    setRangeInput(text);
    const parsed = parsePageRangeString(text, totalPageCount);
    setSelectedPages(parsed);
  };

  // Reset to initial clean state
  const handleReset = () => {
    setCurrentFile(null);
    setTotalPageCount(1);
    setSelectedPages([1]);
    setRangeInput('1');
    setResult(null);
    setErrorMessage(null);
    setStep('idle');
  };

  // Execute the split operation
  const handleExecuteSplit = async () => {
    if (!currentFile) return;

    setErrorMessage(null);
    setStep('splitting');
    setProgressPercent(10);
    setStatusText('Configuring PDF splitting pipeline...');

    try {
      let rangeChunks: number[][] | undefined;

      if (mode === 'range') {
        if (rangeType === 'interval') {
          rangeChunks = [];
          const interval = Math.max(1, splitInterval);
          for (let i = 1; i <= totalPageCount; i += interval) {
            const chunk: number[] = [];
            for (let j = i; j < i + interval && j <= totalPageCount; j++) {
              chunk.push(j);
            }
            rangeChunks.push(chunk);
          }
        } else {
          // Custom comma-separated ranges: e.g. "1-2, 3-5, 6-10"
          const parts = customRangesText.split(/[,;\n]+/).filter(Boolean);
          rangeChunks = parts
            .map((part) => parsePageRangeString(part, totalPageCount))
            .filter((chunk) => chunk.length > 0);

          if (rangeChunks.length === 0) {
            throw new Error('Please enter at least one valid page range (e.g. 1-2, 3-5).');
          }
        }
      }

      const splitResult = await splitPDF(currentFile, {
        mode,
        selectedPages,
        mergeExtracted,
        rangeChunks,
        onProgress: (stage, percent) => {
          setStatusText(stage);
          setProgressPercent(percent);
        },
      });

      setResult(splitResult);
      setStep('completed');
    } catch (err: any) {
      console.error('Split failed:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while splitting the PDF.');
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] py-10 px-4 sm:px-6 lg:px-8 text-neutral-200">
      <div className="max-w-5xl 2xl:max-w-7xl mx-auto space-y-8 w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform text-[#a78bfa]" />
            <span>Back to Tools Overview</span>
          </Link>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#141422] border border-[#232338] text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Client-Side Secure Engine
          </span>
        </div>

        {/* Hero Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/25 text-xs font-mono text-[#c084fc]">
            <Scissors className="w-3.5 h-3.5" />
            <span>Split PDF</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Split & Extract PDF Pages
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
            Extract selected pages into a unified document, decompose entire dossiers into single-page PDFs, or split documents by custom ranges with zero server data retention.
          </p>
        </div>

        {/* Main Content Area */}
        {result ? (
          /* Result View */
          <SplitResultView result={result} onReset={handleReset} />
        ) : (
          /* Configuration and Workspace */
          <div className="space-y-6">
            {/* 1. Uploader */}
            <SplitUploader
              currentFile={currentFile}
              totalPageCount={totalPageCount}
              isLoadingMetadata={isLoadingMetadata}
              onFileSelect={handleFileSelect}
              onReset={handleReset}
            />

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-neutral-400 hover:text-white text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Processing State Overlay */}
            {step === 'splitting' && (
              <div className="rounded-3xl border border-[#2b2b40] bg-[#0d0d16] p-8 text-center space-y-5 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center mx-auto text-[#a78bfa] animate-pulse">
                  <Scissors className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Splitting Document...</h3>
                  <p className="text-xs font-mono text-neutral-400">{statusText}</p>
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <div className="w-full bg-[#181826] h-2.5 rounded-full overflow-hidden border border-[#29293e]">
                    <div
                      className="bg-gradient-to-r from-[#7c3aed] to-[#6366f1] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-neutral-500">
                    <span>Processing vectors & pages</span>
                    <span>{progressPercent}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* If a file is loaded, show config panel and page grid */}
            {currentFile && step !== 'splitting' && (
              <div className="space-y-6">
                <SplitConfigPanel
                  totalPageCount={totalPageCount}
                  mode={mode}
                  onModeChange={setMode}
                  selectedPages={selectedPages}
                  onSelectPages={handleSelectPages}
                  mergeExtracted={mergeExtracted}
                  onMergeExtractedChange={setMergeExtracted}
                  rangeInput={rangeInput}
                  onRangeInputChange={handleRangeInputChange}
                  splitInterval={splitInterval}
                  onSplitIntervalChange={setSplitInterval}
                  customRangesText={customRangesText}
                  onCustomRangesTextChange={setCustomRangesText}
                  rangeType={rangeType}
                  onRangeTypeChange={setRangeType}
                  onExecuteSplit={handleExecuteSplit}
                  isProcessing={step === 'splitting'}
                />

                {/* Visual Page Grid */}
                <div className="rounded-3xl border border-[#222238] bg-[#0c0c14] p-5 sm:p-7 shadow-2xl">
                  <SplitPageGrid
                    totalPageCount={totalPageCount}
                    selectedPages={selectedPages}
                    onTogglePage={handleTogglePage}
                    onPreviewPage={() => setPreviewingSource(true)}
                    mode={mode}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature & Privacy Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[#1a1a26]">
          <div className="p-5 rounded-2xl bg-[#0e0e16] border border-[#1e1e2d] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[#a78bfa] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">Zero Wait Time</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Splitting operations execute natively in your browser using high-speed assembly with zero cloud transfer queue.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e0e16] border border-[#1e1e2d] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">Private & Encrypted</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your files never leave your system memory. No records, telemetry, or server retention.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e0e16] border border-[#1e1e2d] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">Automatic ZIP Packaging</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Multi-file outputs are neatly packaged into an uncorrupted, standard ZIP container for fast batch archiving.
            </p>
          </div>
        </div>
      </div>

      {/* Full Source Document Inspection Modal */}
      {previewingSource && currentFile && (
        <PDFViewerModal
          blob={currentFile}
          filename={currentFile.name}
          fileSize={currentFile.size}
          totalPageCount={totalPageCount}
          onClose={() => setPreviewingSource(false)}
          onDownload={() => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(currentFile);
            link.download = currentFile.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        />
      )}
    </div>
  );
};
