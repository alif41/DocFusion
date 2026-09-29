import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  X,
  RotateCcw,
  AlertCircle,
  FileText,
  Layers,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils';

// Polyfill Promise.try if not supported by browser/runtime
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

// Point to local public worker for reliable, sandboxed, same-origin loading
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerModalProps {
  blob: Blob;
  filename: string;
  fileSize: number;
  totalPageCount?: number;
  onClose: () => void;
  onDownload: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  blob,
  filename,
  fileSize,
  totalPageCount = 1,
  onClose,
  onDownload,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(totalPageCount);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPageRendering, setIsPageRendering] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load PDF Document on mount
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    const loadDocument = async () => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@6.3.289/cmaps/',
          cMapPacked: true,
        });

        const loadedDoc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(loadedDoc);
        setNumPages(loadedDoc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err: any) {
        console.error('PDF.js failed to load document:', err);
        if (!isCancelled) {
          setIsLoading(false);
          setErrorMessage(
            err.message ||
              'Could not render PDF preview in the canvas viewer. You can still download the complete document below.'
          );
        }
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancel error
        }
      }
    };
  }, [blob]);

  // Render current page to canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;
    setIsPageRendering(true);

    const renderPage = async () => {
      try {
        // Cancel any active render task before starting a new one
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
        }

        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Support high-DPI (Retina) displays
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;

        await task.promise;
        if (!isCancelled) {
          setIsPageRendering(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Page render error:', err);
        }
        if (!isCancelled) {
          setIsPageRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, +(prev + 0.2).toFixed(1)));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.6, +(prev - 0.2).toFixed(1)));
  };

  const handleResetZoom = () => {
    setScale(1.1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#0c0c14] border border-[#26263a] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#202030] bg-[#12121e] gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/20 text-[#a78bfa] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md font-mono">
                {filename}
              </h4>
              <p className="text-[10px] sm:text-xs font-mono text-neutral-400">
                {numPages} {numPages === 1 ? 'Page' : 'Pages'} • {formatFileSize(fileSize)}
              </p>
            </div>
          </div>

          {/* Controls: Page navigation & Zoom */}
          {!errorMessage && (
            <div className="hidden sm:flex items-center gap-2">
              {/* Page Navigator */}
              <div className="flex items-center bg-[#181826] border border-[#2b2b3f] rounded-xl px-2 py-1 text-xs font-mono text-neutral-300">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={handlePrevPage}
                  aria-label="Previous Page"
                  className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-white">
                  Page {currentPage} of {numPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages || isLoading}
                  onClick={handleNextPage}
                  aria-label="Next Page"
                  className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center bg-[#181826] border border-[#2b2b3f] rounded-xl px-1.5 py-1 text-xs font-mono text-neutral-300">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.6 || isLoading}
                  className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-1.5 py-0.5 rounded text-[11px] text-neutral-300 hover:text-white cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={scale >= 2.5 || isLoading}
                  className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onDownload}
              leftIcon={<Download className="w-4 h-4" />}
              className="shadow-lg shadow-[#7c3aed]/20"
            >
              Download
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile secondary controls */}
        {!errorMessage && (
          <div className="sm:hidden flex items-center justify-between px-4 py-2 border-b border-[#202030] bg-[#10101a] text-xs font-mono">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1 || isLoading}
                onClick={handlePrevPage}
                className="p-1 rounded bg-[#181826] border border-[#2b2b3f] disabled:opacity-30 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-white">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= numPages || isLoading}
                onClick={handleNextPage}
                className="p-1 rounded bg-[#181826] border border-[#2b2b3f] disabled:opacity-30 text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded bg-[#181826] border border-[#2b2b3f] text-neutral-300"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-neutral-400">{Math.round(scale * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded bg-[#181826] border border-[#2b2b3f] text-neutral-300"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Canvas Display Viewport */}
        <div className="flex-1 bg-[#14141e] overflow-auto p-4 flex items-center justify-center relative">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#a78bfa]" />
              <p className="text-xs font-mono">Loading PDF pages into canvas viewer...</p>
            </div>
          ) : errorMessage ? (
            <div className="max-w-md p-6 rounded-2xl bg-[#12121e] border border-rose-500/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Preview Rendering Notice</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  In-browser canvas preview is restricted by your browser sandbox, but your merged document is 100% complete and ready to use.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onDownload}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="w-full"
                >
                  Download Merged Document ({formatFileSize(fileSize)})
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col items-center my-auto">
              {isPageRendering && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
                  <div className="p-2.5 rounded-xl bg-[#0c0c14] border border-[#2b2b42] text-xs font-mono text-[#a78bfa] flex items-center gap-2 shadow-xl">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rendering Page {currentPage}...
                  </div>
                </div>
              )}
              {/* Crisp HTML5 Canvas */}
              <canvas
                ref={canvasRef}
                className="rounded-xl shadow-2xl shadow-black/80 border border-[#2b2b42] bg-white transition-all max-w-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
