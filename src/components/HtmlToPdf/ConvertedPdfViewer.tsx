import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  RotateCw,
  Loader2,
  AlertCircle,
  FileText,
  Layers,
  Check,
} from 'lucide-react';

// Polyfill Promise.try if not supported by browser/runtime
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

// Point to local public worker for reliable, sandboxed, same-origin loading
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface ConvertedPdfViewerProps {
  blob: Blob;
  downloadUrl: string;
  filename: string;
}

export const ConvertedPdfViewer: React.FC<ConvertedPdfViewerProps> = ({
  blob,
  downloadUrl,
  filename,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load document with pdfjs
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    const loadPdf = async () => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@6.3.289/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err: any) {
        console.error('PDF.js failed to load converted PDF:', err);
        if (!isCancelled) {
          setIsLoading(false);
          setErrorMessage(
            err.message || 'Could not parse PDF buffer. You can still download the complete file.'
          );
        }
      }
    };

    loadPdf();

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
  }, [blob]);

  // Render current page to canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;
    setIsRendering(true);

    const renderCurrentPage = async () => {
      try {
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

        // Support High-DPI (Retina) displays
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
          setIsRendering(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('PDF canvas render error:', err);
        }
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    renderCurrentPage();

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
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < numPages) setCurrentPage((p) => p + 1);
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(2)));
  };

  const handleResetZoom = () => {
    setScale(1.15);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-[#0d0d18] border border-[#24243a] rounded-3xl overflow-hidden shadow-2xl transition-all flex flex-col ${
        isFullScreen ? 'fixed inset-4 z-50 rounded-2xl shadow-black/90' : 'h-[640px]'
      }`}
    >
      {/* Top Controls Toolbar */}
      <div className="bg-[#141424] border-b border-[#24243a] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Document Title & Pages */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-xs">
            <FileText className="w-4 h-4 text-[#a78bfa] shrink-0" />
            <span className="truncate">{filename}</span>
          </div>

          <span className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 shrink-0">
            {numPages} {numPages === 1 ? 'Page' : 'Pages'}
          </span>
        </div>

        {/* Viewport, Pagination & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Pagination buttons */}
          {numPages > 1 && (
            <div className="flex items-center bg-[#1a1a2e] border border-[#2d2d46] rounded-xl p-0.5">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-[11px] font-mono font-medium text-neutral-300 select-none">
                {currentPage} / {numPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#1a1a2e] border border-[#2d2d46] rounded-xl p-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-neutral-700 mx-0.5" />

          {/* Full Screen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Preview'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Document Scroll Area */}
      <div className="flex-1 bg-[#090912] overflow-auto flex items-center justify-center p-4 sm:p-8 scrollbar-thin relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#a78bfa]" />
            <p className="text-xs font-mono">Rendering PDF preview...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center space-y-3 max-w-md text-center p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-xs">{errorMessage}</p>
            <a
              href={downloadUrl}
              download={filename}
              className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF File Directly</span>
            </a>
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            {/* Subtle rendering indicator */}
            {isRendering && (
              <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-black/60 backdrop-blur border border-white/10 flex items-center gap-1 text-[10px] text-neutral-300">
                <Loader2 className="w-3 h-3 animate-spin text-[#a78bfa]" />
                <span>Updating page...</span>
              </div>
            )}

            {/* High-DPI Rendered Canvas Document Sheet */}
            <div className="rounded-md shadow-2xl border border-neutral-300/40 bg-white overflow-hidden transition-transform">
              <canvas ref={canvasRef} className="block max-w-full" />
            </div>

            {/* Page number pill at bottom */}
            {numPages > 1 && (
              <div className="mt-4 px-3 py-1 rounded-full bg-[#161628]/90 border border-white/10 text-[11px] font-mono text-neutral-400 shadow-md">
                Page {currentPage} of {numPages}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
