import React, { useState, useCallback } from 'react';
import {
  Stamp,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Undo2,
  Redo2,
  Trash2,
  AlertTriangle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Button } from '../components/common/Button';
import { formatFileSize } from '../utils';
import {
  WatermarkProcessingStep,
  WatermarkResultData,
  PdfPageMeta,
  PdfUploader,
  PdfPreview,
  WatermarkTypeSelector,
  TextWatermarkSettings,
  ImageWatermarkSettings,
  PositionControl,
  OpacityControl,
  RotationControl,
  PageRangeSelector,
  WatermarkLayers,
  PreviewControls,
  WatermarkListManager,
  ProcessingState,
  ResultView,
  useWatermark,
  parsePdfForWatermark,
  exportWatermarkedPdf,
} from '../components/watermarkPdf';

export const WatermarkPdfPage: React.FC = () => {
  useDocumentTitle('Add Watermark to PDF - Protect & Brand Documents');

  // File & Document State
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pagesMeta, setPagesMeta] = useState<PdfPageMeta[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Processing & Export State
  const [processingStep, setProcessingStep] = useState<WatermarkProcessingStep>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [result, setResult] = useState<WatermarkResultData | null>(null);

  // Watermark management hook
  const {
    watermarks,
    activeWatermark,
    activeWatermarkId,
    setActiveWatermarkId,
    updateActiveWatermark,
    addNewWatermark,
    duplicateWatermark,
    toggleVisibility,
    removeWatermark,
    resetActiveWatermark,
    resetAllWatermarks,
    canUndo,
    canRedo,
    undo,
    redo,
    initializeHistory,
  } = useWatermark();

  // Load PDF file
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setIsLoadingDoc(true);
    setDocError(null);
    try {
      const parsed = await parsePdfForWatermark(selectedFile);
      setFile(selectedFile);
      setPdfDoc(parsed.pdfDoc);
      setPageCount(parsed.pageCount);
      setPagesMeta(parsed.pagesMeta);
      setCurrentPage(1);
      setIsLoadingDoc(false);
    } catch (err: any) {
      setIsLoadingDoc(false);
      setDocError(err.message || 'Failed to read PDF file.');
    }
  }, []);

  // Handle Apply Watermark action
  const handleApplyWatermark = async () => {
    if (!file || watermarks.length === 0) return;

    setProcessingError(null);
    setProcessingStep('preparing');
    setProgressPercent(15);

    try {
      const generated = await exportWatermarkedPdf({
        file,
        watermarks,
        currentPage,
        onProgress: (stepName, pct) => {
          if (pct <= 20) setProcessingStep('preparing');
          else if (pct <= 40) setProcessingStep('loading_pages');
          else if (pct <= 65) setProcessingStep('applying');
          else if (pct <= 85) setProcessingStep('rendering');
          else setProcessingStep('finalizing');
          setProgressPercent(pct);
        },
      });

      setProcessingStep('completed');
      setProgressPercent(100);

      setTimeout(() => {
        setResult(generated);
        setProcessingStep('idle');
      }, 500);
    } catch (err: any) {
      console.error('Watermark application failed:', err);
      setProcessingStep('error');
      setProcessingError(err.message || 'Failed to apply watermark to PDF.');
    }
  };

  // Start Over handler
  const handleStartOver = () => {
    setFile(null);
    setPdfDoc(null);
    setPageCount(0);
    setPagesMeta([]);
    setCurrentPage(1);
    setResult(null);
    setProcessingStep('idle');
    setProcessingError(null);
    setProgressPercent(0);
    resetAllWatermarks();
  };

  return (
    <div className="min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-[#a78bfa] text-xs font-mono font-medium">
          <Stamp className="w-3.5 h-3.5" />
          <span>Vector PDF Watermark &amp; Branding Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Add Watermark to PDF
        </h1>

        <p className="text-sm sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Protect and brand your PDF with a customizable text or image watermark.
        </p>
      </div>

      {/* 2. Workspace View States */}
      {result ? (
        // RESULT VIEW
        <ResultView result={result} onReset={handleStartOver} />
      ) : processingStep !== 'idle' ? (
        // PROCESSING ANIMATION VIEW
        <div className="space-y-4">
          <ProcessingState
            currentStep={processingStep}
            progressPercent={progressPercent}
            filename={file?.name || 'document.pdf'}
            pageCount={pageCount}
          />
          {processingError && (
            <div className="max-w-xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{processingError}</span>
              </div>
              <button
                type="button"
                onClick={() => setProcessingStep('idle')}
                className="px-3 py-1 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      ) : !file ? (
        // INITIAL UPLOAD VIEW
        <PdfUploader
          onFileSelect={handleFileSelect}
          isLoading={isLoadingDoc}
          errorMessage={docError}
        />
      ) : (
        // MAIN ACTIVE EDITING WORKSPACE
        <div className="space-y-6 animate-fadeIn">
          {/* Top Document Summary Bar */}
          <div className="bg-[#0e0e1a] border border-[#222236] rounded-2xl p-3 sm:px-4 sm:py-3 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 max-w-sm truncate text-white font-semibold">
              <FileText className="w-4 h-4 text-[#a78bfa] shrink-0" />
              <span className="truncate" title={file.name}>
                {file.name}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono shrink-0">
                ({formatFileSize(file.size)} • {pageCount} pages)
              </span>
            </div>

            {/* Undo / Redo & Global Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#151524] border border-[#26263c] rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  title="Undo change (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  title="Redo change (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>

              {/* Reset selected watermark */}
              <button
                type="button"
                onClick={resetActiveWatermark}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#2d2d44] bg-[#141422] text-xs font-medium text-neutral-300 hover:text-white hover:bg-[#1a1a2e] transition-colors cursor-pointer"
                title="Reset selected watermark to default"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              {/* Remove all watermarks confirmation */}
              {showResetConfirm ? (
                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-xl text-xs text-rose-300 animate-fadeIn">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Remove all?</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetAllWatermarks();
                      setShowResetConfirm(false);
                    }}
                    className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold text-[11px] hover:bg-rose-600"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-1 text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs font-medium text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer"
                  title="Remove all watermarks"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Main Split Workspace (Settings on Left, PDF Canvas Preview on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Watermark Settings Panel */}
            <div className="lg:col-span-5 space-y-5 bg-[#0c0c16] border border-[#222234] rounded-3xl p-5 shadow-2xl">
              {/* 1. Watermark Objects Manager (Multiple Watermarks support) */}
              <WatermarkListManager
                watermarks={watermarks}
                activeWatermarkId={activeWatermarkId}
                onSelect={setActiveWatermarkId}
                onAdd={addNewWatermark}
                onDuplicate={duplicateWatermark}
                onToggleVisibility={toggleVisibility}
                onDelete={removeWatermark}
              />

              {activeWatermark && (
                <div className="space-y-4 pt-3 border-t border-[#1e1e30]">
                  {/* 2. Watermark Type Selector (Text vs Image) */}
                  <WatermarkTypeSelector
                    selectedType={activeWatermark.type}
                    onChange={(type) => updateActiveWatermark({ type })}
                  />

                  {/* 3. Type-Specific Settings */}
                  {activeWatermark.type === 'text' ? (
                    <TextWatermarkSettings
                      watermark={activeWatermark}
                      onChange={updateActiveWatermark}
                    />
                  ) : (
                    <ImageWatermarkSettings
                      watermark={activeWatermark}
                      onChange={updateActiveWatermark}
                    />
                  )}

                  {/* 4. Position Placement (9-grid + custom) */}
                  <div className="pt-2 border-t border-[#1e1e30]">
                    <PositionControl
                      watermark={activeWatermark}
                      onChange={updateActiveWatermark}
                    />
                  </div>

                  {/* 5. Opacity & Rotation Controls */}
                  <div className="pt-2 border-t border-[#1e1e30] space-y-4">
                    <OpacityControl
                      watermark={activeWatermark}
                      onChange={updateActiveWatermark}
                    />
                    <RotationControl
                      watermark={activeWatermark}
                      onChange={updateActiveWatermark}
                    />
                  </div>

                  {/* 6. Page Range Selector */}
                  <div className="pt-2 border-t border-[#1e1e30]">
                    <PageRangeSelector
                      pageSelection={activeWatermark.pageSelection}
                      currentPage={currentPage}
                      totalPages={pageCount}
                      onChange={(sel) => updateActiveWatermark({ pageSelection: sel })}
                    />
                  </div>

                  {/* 7. Layer Order & Tiling */}
                  <WatermarkLayers
                    watermark={activeWatermark}
                    onChange={updateActiveWatermark}
                  />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: PDF Preview Workspace */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              {/* Preview Controls Bar */}
              <PreviewControls
                currentPage={currentPage}
                totalPages={pageCount}
                zoomLevel={zoomLevel}
                onPageChange={setCurrentPage}
                onZoomChange={setZoomLevel}
                onFitWidth={() => setZoomLevel(100)}
              />

              {/* PDF Preview Canvas Area */}
              <div className="bg-[#08080f]/90 border border-[#1b1b2a] rounded-3xl min-h-[520px] shadow-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden">
                <PdfPreview
                  pdfDoc={pdfDoc}
                  currentPage={currentPage}
                  totalPages={pageCount}
                  pageMeta={pagesMeta[currentPage - 1]}
                  watermarks={watermarks}
                  activeWatermarkId={activeWatermarkId}
                  zoomLevel={zoomLevel}
                  onUpdateActiveWatermark={updateActiveWatermark}
                  onSelectActiveWatermark={setActiveWatermarkId}
                />
              </div>
            </div>
          </div>

          {/* 4. Sticky Bottom Action Bar */}
          <div className="sticky bottom-4 z-30 bg-[#0c0c16]/95 backdrop-blur-md border border-[#24243a] rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-0.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <span>Ready to generate watermarked document</span>
                <span className="text-[11px] font-mono text-[#a78bfa] font-normal">
                  ({watermarks.filter((w) => w.visible).length} active watermarks)
                </span>
              </h4>
              <p className="text-xs text-neutral-400">
                A pristine new PDF will be generated preserving all selectable text and original quality.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleStartOver}
                className="w-1/3 sm:w-auto text-neutral-400 hover:text-white"
              >
                Change PDF
              </Button>

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleApplyWatermark}
                leftIcon={<Sparkles className="w-4 h-4 text-white" />}
                rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                className="flex-1 sm:flex-initial shadow-xl shadow-[#7c3aed]/30 px-6 sm:px-8 font-bold"
              >
                Apply Watermark
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
