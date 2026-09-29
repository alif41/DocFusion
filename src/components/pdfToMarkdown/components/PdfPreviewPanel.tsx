import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Loader2,
  FileText,
  ScanText,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PageAnalysis } from '../types';

interface PdfPreviewPanelProps {
  pdfDoc: any;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  pagesAnalysis?: PageAnalysis[];
  isProcessing?: boolean;
}

export const PdfPreviewPanel: React.FC<PdfPreviewPanelProps> = ({
  pdfDoc,
  totalPages,
  currentPage,
  onPageChange,
  pagesAnalysis,
  isProcessing = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderCounter, setRenderCounter] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageCacheRef = useRef<Map<string, string>>(new Map());

  const computedScale = (zoomLevel / 100) * 1.25;

  const currentPageAnalysis = pagesAnalysis?.find((p) => p.pageNumber === currentPage);

  // Render current page via isolated offscreen canvas to avoid canvas reuse conflicts
  useEffect(() => {
    if (!pdfDoc || totalPages < 1) return;

    let isCancelled = false;
    const cacheKey = `p${currentPage}_s${computedScale.toFixed(2)}`;

    if (pageCacheRef.current.has(cacheKey)) {
      setPageImageUrl(pageCacheRef.current.get(cacheKey)!);
      setIsRendering(false);
      setRenderError(null);
      return;
    }

    setIsRendering(true);
    setRenderError(null);

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: computedScale });
        const offscreen = document.createElement('canvas');
        const ctx = offscreen.getContext('2d');
        if (!ctx) throw new Error('Could not create offscreen canvas context.');

        const pixelRatio = window.devicePixelRatio || 1;
        offscreen.width = Math.floor(viewport.width * pixelRatio);
        offscreen.height = Math.floor(viewport.height * pixelRatio);
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        if (isCancelled) return;

        const dataUrl = offscreen.toDataURL('image/png');
        offscreen.width = 0;
        offscreen.height = 0;

        pageCacheRef.current.set(cacheKey, dataUrl);
        setPageImageUrl(dataUrl);
        setRenderError(null);
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('PDF Preview Panel render error:', err);
          setRenderError(err?.message || 'Failed to render PDF page preview.');
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, computedScale, totalPages, renderCounter]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 15));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 15));
  const handleZoomReset = () => setZoomLevel(100);
  const handleFitWidth = () => setZoomLevel(115);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0d0d12] border-r border-slate-200 dark:border-[#1f1f2e] select-none transition-colors">
      {/* Top Header / Navigation Toolbar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-[#14141e] border-b border-slate-200 dark:border-[#222233] text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || isProcessing}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1c2b] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white dark:hover:bg-[#28283d] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-slate-700 dark:text-neutral-300 px-1.5 min-w-[65px] text-center font-medium">
              {currentPage} / {totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages || isProcessing}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1c2b] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white dark:hover:bg-[#28283d] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scanned / OCR Badge */}
          {currentPageAnalysis?.ocrApplied ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              OCR
            </span>
          ) : currentPageAnalysis?.isScanned ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <ScanText className="w-2.5 h-2.5" />
              Scanned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <FileText className="w-2.5 h-2.5" />
              Vector Text
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            className="p-1 rounded-md text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222233] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-slate-600 dark:text-neutral-400 w-9 text-center">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
            className="p-1 rounded-md text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222233] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFitWidth}
            className="p-1 rounded-md text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222233] transition-colors cursor-pointer"
            title="Fit Width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className="p-1 rounded-md text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222233] transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Page Canvas / Image Surface */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex items-center justify-center relative scrollbar-thin bg-slate-100/70 dark:bg-[#09090e]"
      >
        {isRendering && !pageImageUrl && (
          <div className="absolute inset-0 bg-white/70 dark:bg-[#09090e]/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#7c3aed] dark:text-[#a78bfa]" />
            <span className="text-xs font-mono text-slate-600 dark:text-neutral-400">Rendering page {currentPage}...</span>
          </div>
        )}

        {renderError && !pageImageUrl ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-rose-500 max-w-xs space-y-3">
            <AlertCircle className="w-8 h-8" />
            <div className="space-y-1">
              <p className="text-xs font-semibold">Page Preview Unavailable</p>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">{renderError}</p>
            </div>
            <button
              type="button"
              onClick={() => setRenderCounter((c) => c + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200 text-xs border border-rose-200 dark:border-rose-700/50 hover:bg-rose-100 dark:hover:bg-rose-800/40 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        ) : pageImageUrl ? (
          <div className="shadow-xl rounded border border-slate-300 dark:border-neutral-700/60 bg-white overflow-hidden transition-all duration-100">
            <img
              src={pageImageUrl}
              alt={`Page ${currentPage}`}
              className="block object-contain"
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-slate-400 dark:text-neutral-500 text-xs flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 opacity-40" />
            <span>No document loaded</span>
          </div>
        )}
      </div>

      {/* Bottom Page Stats Bar */}
      {currentPageAnalysis && (
        <div className="px-3 py-1.5 bg-white dark:bg-[#12121a] border-t border-slate-200 dark:border-[#1f1f2e] text-[11px] text-slate-600 dark:text-neutral-400 flex items-center justify-between font-mono">
          <span>Words: {currentPageAnalysis.wordCount}</span>
          <span>Chars: {currentPageAnalysis.charCount}</span>
          <span>Tables: {currentPageAnalysis.tableCount}</span>
          <span>Images: {currentPageAnalysis.imagesFound}</span>
        </div>
      )}
    </div>
  );
};
