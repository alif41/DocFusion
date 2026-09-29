import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Sparkles,
  ArrowRight,
  FileCheck,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  FileText,
  RotateCw,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Button } from '../components/common/Button';
import {
  OrganizePageItem,
  OrganizeViewMode,
  OrganizeProcessingStep,
  OrganizeResultData,
  PdfUploader,
  PdfPageGrid,
  PdfPageList,
  PageToolbar,
  SelectionToolbar,
  OrderHistory,
  ProcessingState,
  ResultView,
  usePdfPages,
  useUndoRedo,
  useDragReorder,
  getPageOrderArray,
  isOrderDefault,
  calculateReorderedCount,
  moveStep,
  exportOrganizedPdf,
} from '../components/organizePdf';

export const OrganizePdfPage: React.FC = () => {
  useDocumentTitle('Organize PDF - Rearrange & Reorder PDF Pages');

  // View & UI controls state
  const [viewMode, setViewMode] = useState<OrganizeViewMode>('grid');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Processing state
  const [processingStep, setProcessingStep] = useState<OrganizeProcessingStep>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [result, setResult] = useState<OrganizeResultData | null>(null);

  // PDF Page Management Hook
  const {
    file,
    pageCount,
    pages,
    selectedPageIds,
    isLoadingDoc,
    docError,
    loadFile,
    setPages,
    toggleSelectPage,
    selectAllPages,
    clearSelection,
    resetAll,
    applyOrderArray,
  } = usePdfPages();

  // Undo / Redo Hook
  const {
    canUndo,
    canRedo,
    pushState,
    undo,
    redo,
    resetToInitial,
    initialize: initUndoRedo,
  } = useUndoRedo((targetOrder) => {
    applyOrderArray(targetOrder);
  });

  // Initialize history when pages are first loaded
  useEffect(() => {
    if (pages.length > 0 && pageCount > 0) {
      const initialOrder = pages.map((p) => p.originalPageNumber);
      initUndoRedo(initialOrder);
    }
  }, [pageCount, initUndoRedo]);

  // Drag & drop hook
  const handleCommitOrder = useCallback(
    (newPages: OrganizePageItem[]) => {
      setPages(newPages);
      const newOrder = getPageOrderArray(newPages);
      pushState(newOrder);
    },
    [setPages, pushState]
  );

  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDragReorder({
    pages,
    selectedPageIds,
    onCommitOrder: handleCommitOrder,
  });

  // Quick move handlers for individual page or selection
  const handleQuickMove = useCallback(
    (pageId: string, direction: 'first' | 'left' | 'right' | 'last') => {
      // If the target page is part of the multi-selection, move the whole selection
      const idsToMove = selectedPageIds.has(pageId)
        ? selectedPageIds
        : new Set([pageId]);

      const newPages = moveStep(pages, idsToMove, direction);
      setPages(newPages);
      const newOrder = getPageOrderArray(newPages);
      pushState(newOrder);
    },
    [pages, selectedPageIds, setPages, pushState]
  );

  // Multi-page movement from selection toolbar
  const handleMoveSelection = useCallback(
    (direction: 'first' | 'left' | 'right' | 'last') => {
      if (selectedPageIds.size === 0) return;
      const newPages = moveStep(pages, selectedPageIds, direction);
      setPages(newPages);
      const newOrder = getPageOrderArray(newPages);
      pushState(newOrder);
    },
    [pages, selectedPageIds, setPages, pushState]
  );

  // Reset Order handler
  const handleResetOrder = useCallback(() => {
    const initialOrder = resetToInitial();
    if (initialOrder) {
      applyOrderArray(initialOrder);
      clearSelection();
    }
  }, [resetToInitial, applyOrderArray, clearSelection]);

  // Main Action: Generate Organized PDF
  const handleGeneratePdf = async () => {
    if (!file || pages.length === 0) return;

    setProcessingError(null);
    setProcessingStep('preparing');
    setProgressPercent(10);

    const pageOrder = getPageOrderArray(pages);

    try {
      // Step: Applying New Page Order
      setProcessingStep('applying');
      setProgressPercent(35);

      const generated = await exportOrganizedPdf({
        file,
        pageOrder,
        onProgress: (stepName, pct) => {
          if (pct <= 25) setProcessingStep('preparing');
          else if (pct <= 50) setProcessingStep('applying');
          else if (pct <= 80) setProcessingStep('rebuilding');
          else setProcessingStep('finalizing');
          setProgressPercent(pct);
        },
      });

      setProcessingStep('completed');
      setProgressPercent(100);

      // Brief visual completion pause
      setTimeout(() => {
        setResult(generated);
        setProcessingStep('idle');
      }, 500);
    } catch (err: any) {
      console.error('PDF Generation failed:', err);
      setProcessingStep('error');
      setProcessingError(err.message || 'Failed to generate organized PDF.');
    }
  };

  // Reset entire workspace to start over
  const handleStartOver = () => {
    resetAll();
    setResult(null);
    setProcessingStep('idle');
    setProcessingError(null);
    setProgressPercent(0);
  };

  const reorderedCount = calculateReorderedCount(pages);
  const hasChanges = reorderedCount > 0;

  return (
    <div className="min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-[#a78bfa] text-xs font-mono font-medium">
          <Layers className="w-3.5 h-3.5" />
          <span>Interactive Page Reorder Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Organize PDF
        </h1>

        <p className="text-sm sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Rearrange, reorder, and organize your PDF pages with simple drag and drop.
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
            pageCount={pages.length}
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
          onFileSelect={loadFile}
          isLoading={isLoadingDoc}
          errorMessage={docError}
        />
      ) : (
        // MAIN ACTIVE WORKSPACE
        <div className="space-y-6">
          {/* Top Actions & Settings Toolbar */}
          <PageToolbar
            filename={file.name}
            fileSize={file.size}
            viewMode={viewMode}
            zoomLevel={zoomLevel}
            canUndo={canUndo}
            canRedo={canRedo}
            hasChanges={hasChanges}
            onUndo={undo}
            onRedo={redo}
            onResetOrder={handleResetOrder}
            onViewModeChange={setViewMode}
            onZoomChange={setZoomLevel}
          />

          {/* Page Order Information Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-2">
            <OrderHistory
              originalPageCount={pageCount}
              currentPageCount={pages.length}
              reorderedCount={reorderedCount}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllPages}
                className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                Select All
              </button>
              {selectedPageIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-neutral-400 hover:text-rose-300 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Interactive Pages Canvas Workspace */}
          <div className="bg-[#08080f]/90 border border-[#1b1b2a] rounded-3xl p-4 sm:p-8 min-h-[460px] shadow-2xl relative">
            {viewMode === 'grid' ? (
              <PdfPageGrid
                pages={pages}
                selectedPageIds={selectedPageIds}
                dragState={dragState}
                zoomLevel={zoomLevel}
                onToggleSelect={toggleSelectPage}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onQuickMove={handleQuickMove}
              />
            ) : (
              <PdfPageList
                pages={pages}
                selectedPageIds={selectedPageIds}
                dragState={dragState}
                onToggleSelect={toggleSelectPage}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onQuickMove={handleQuickMove}
              />
            )}
          </div>

          {/* Bottom Execution Bar */}
          <div className="sticky bottom-4 z-30 bg-[#0c0c16]/95 backdrop-blur-md border border-[#24243a] rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-0.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <span>Ready to generate organized PDF</span>
                {hasChanges ? (
                  <span className="text-[11px] font-mono text-[#a78bfa] font-normal">
                    ({reorderedCount} pages moved)
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-neutral-400 font-normal">
                    (Original sequence)
                  </span>
                )}
              </h4>
              <p className="text-xs text-neutral-400">
                A pristine new PDF will be compiled with your exact page ordering.
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
                onClick={handleGeneratePdf}
                leftIcon={<Sparkles className="w-4 h-4 text-white" />}
                rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                className="flex-1 sm:flex-initial shadow-xl shadow-[#7c3aed]/30 px-6 sm:px-8 font-bold"
              >
                Generate Organized PDF
              </Button>
            </div>
          </div>

          {/* Floating Selection Toolbar for Multi-Page Operations */}
          <SelectionToolbar
            selectedCount={selectedPageIds.size}
            totalCount={pages.length}
            onSelectAll={selectAllPages}
            onClearSelection={clearSelection}
            onMoveSelection={handleMoveSelection}
          />
        </div>
      )}
    </div>
  );
};
