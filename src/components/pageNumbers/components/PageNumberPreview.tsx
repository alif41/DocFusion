import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { PageNumberOptions } from '../types';
import { formatPageNumber } from '../services/pageNumberEngine';

// Ensure worker is configured
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PageNumberPreviewProps {
  file: File;
  options: PageNumberOptions;
  totalPages: number;
}

export const PageNumberPreview: React.FC<PageNumberPreviewProps> = ({
  file,
  options,
  totalPages,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const pdfDocRef = useRef<any>(null);

  // Initialize PDF document for preview
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      setIsLoadingPage(true);
      setRenderError(null);
      try {
        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@6.3.289/cmaps/',
          cMapPacked: true,
        });
        const doc = await loadingTask.promise;
        if (!isCancelled) {
          pdfDocRef.current = doc;
          renderPage(1, doc);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to load PDF preview:', err);
          setRenderError(err.message || 'Unable to render PDF page preview.');
          setIsLoadingPage(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  // Render specific page to canvas
  const renderPage = async (pageNumber: number, docOverride?: any) => {
    const doc = docOverride || pdfDocRef.current;
    if (!doc) return;

    setIsLoadingPage(true);
    setRenderError(null);

    try {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context');

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const dataUrl = canvas.toDataURL('image/png');
      setPageImageUrl(dataUrl);
      setIsLoadingPage(false);
    } catch (err: any) {
      console.error(`Failed to render page ${pageNumber}:`, err);
      setRenderError(err.message || 'Failed to render page preview.');
      setIsLoadingPage(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    renderPage(newPage);
  };

  // Determine if the current preview page is included in the numbering
  const isPageNumbered = (): { numbered: boolean; reason?: string } => {
    if (options.skipFirstPage && currentPage === 1) {
      return { numbered: false, reason: 'Cover page (First page skipped)' };
    }
    if (options.skipLastPage && currentPage === totalPages) {
      return { numbered: false, reason: 'Back cover (Last page skipped)' };
    }
    if (currentPage < options.startFromPage) {
      return { numbered: false, reason: `Before start page (${options.startFromPage})` };
    }
    return { numbered: true };
  };

  const pageStatus = isPageNumbered();

  // Compute what page number this page would display
  const getDisplayNumber = (): string => {
    if (!pageStatus.numbered) {
      return '';
    }
    // Calculate page index offset
    let activeIndex = 0;
    for (let p = 1; p <= totalPages; p++) {
      if (options.skipFirstPage && p === 1) continue;
      if (options.skipLastPage && p === totalPages) continue;
      if (p < options.startFromPage) continue;

      if (p === currentPage) {
        const currentNumber = (options.startingNumber || 1) + activeIndex;
        // Total numbered pages
        let totalCount = 0;
        for (let q = 1; q <= totalPages; q++) {
          if (options.skipFirstPage && q === 1) continue;
          if (options.skipLastPage && q === totalPages) continue;
          if (q < options.startFromPage) continue;
          totalCount++;
        }
        return formatPageNumber(options.format, currentNumber, totalCount, options.customFormat);
      }
      activeIndex++;
    }
    return '';
  };

  const formattedNumber = getDisplayNumber();

  // Position classes for the live overlay
  const getPositionClasses = () => {
    switch (options.position) {
      case 'top-left':
        return 'top-4 left-5 text-left';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2 text-center';
      case 'top-right':
        return 'top-4 right-5 text-right';
      case 'bottom-left':
        return 'bottom-4 left-5 text-left';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2 text-center';
      case 'bottom-right':
      default:
        return 'bottom-4 right-5 text-right';
    }
  };

  // Font family inline style mapping
  const getFontFamilyStyle = () => {
    switch (options.fontFamily) {
      case 'Times-Roman':
        return '"Times New Roman", Times, serif';
      case 'Courier':
        return '"Courier New", Courier, monospace';
      case 'Helvetica-Bold':
        return 'Helvetica, Arial, sans-serif';
      case 'Helvetica':
      default:
        return 'Helvetica, Arial, sans-serif';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0c0c14] rounded-3xl border border-slate-200 dark:border-[#1e1e2d] p-4 sm:p-5 overflow-hidden">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1e1e2d]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
            <span>Interactive Sheet Preview</span>
          </span>
          {pageStatus.numbered ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Numbered
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {pageStatus.reason}
            </span>
          )}
        </div>

        {/* Page Switcher & Zoom */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-xl bg-white dark:bg-[#141420] border border-slate-200 dark:border-[#262638] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[10px] text-slate-700 dark:text-neutral-300 min-w-9 text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page Selector */}
          <div className="flex items-center rounded-xl bg-white dark:bg-[#141420] border border-slate-200 dark:border-[#262638] p-0.5 text-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-xs text-slate-700 dark:text-neutral-300">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-auto min-h-[380px] max-h-[620px]">
        {isLoadingPage ? (
          <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-neutral-400">
            <div className="w-8 h-8 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin" />
            <span className="text-xs font-mono">Rendering high-res page {currentPage}...</span>
          </div>
        ) : renderError ? (
          <div className="flex flex-col items-center gap-2 text-rose-500 max-w-sm text-center">
            <AlertCircle className="w-8 h-8" />
            <p className="text-xs font-mono">{renderError}</p>
          </div>
        ) : pageImageUrl ? (
          <div
            className="relative shadow-2xl rounded-lg bg-white overflow-hidden transition-transform duration-200 border border-slate-300 dark:border-white/10"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              maxWidth: '100%',
            }}
          >
            {/* The rendered PDF page image */}
            <img
              src={pageImageUrl}
              alt={`Page ${currentPage}`}
              className="w-auto max-h-[500px] object-contain select-none pointer-events-none block"
            />

            {/* Simulated Page Number Overlay */}
            {pageStatus.numbered && formattedNumber && (
              <div
                className={`absolute pointer-events-none select-none transition-all duration-200 ${getPositionClasses()}`}
                style={{
                  fontFamily: getFontFamilyStyle(),
                  fontSize: `${Math.max(9, options.fontSize * 1.15)}px`,
                  fontWeight: options.fontFamily === 'Helvetica-Bold' ? 'bold' : 'normal',
                  color: options.textColor,
                  opacity: options.opacity,
                }}
              >
                <span
                  className={
                    options.showBackgroundBadge
                      ? options.badgeStyle === 'dark'
                        ? 'px-2 py-0.5 rounded-sm bg-neutral-900/90 text-white shadow-xs'
                        : options.badgeStyle === 'glass'
                        ? 'px-2 py-0.5 rounded-sm bg-white/80 dark:bg-black/60 backdrop-blur-xs shadow-xs border border-white/20'
                        : 'px-2 py-0.5 rounded-sm bg-white/95 text-slate-900 shadow-sm border border-slate-200/80'
                      : ''
                  }
                >
                  {formattedNumber}
                </span>
              </div>
            )}

            {/* Skip indicator overlay watermark */}
            {!pageStatus.numbered && (
              <div className="absolute inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
                <span className="px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/20 text-white text-xs font-mono font-medium shadow-lg">
                  {pageStatus.reason}
                </span>
                <span className="text-[11px] text-neutral-300 mt-1.5 font-mono">
                  No page number will be stamped on page {currentPage}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 dark:text-neutral-500 text-xs font-mono">
            Preview pending...
          </div>
        )}
      </div>

      {/* Footer Info Ribbon */}
      <div className="pt-3 border-t border-slate-200 dark:border-[#1e1e2d] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Real-time layout simulation</span>
        </div>
        <div>
          <span>Stamping Position: </span>
          <strong className="text-slate-800 dark:text-neutral-200 capitalize">
            {options.position.replace('-', ' ')}
          </strong>
        </div>
      </div>
    </div>
  );
};
