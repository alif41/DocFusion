import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, Move, AlertCircle, RefreshCw } from 'lucide-react';
import { WatermarkItem, PdfPageMeta } from '../types';
import { renderPdfPageToImage } from '../services/pdfRenderer';
import { isPageSelected } from '../services/watermarkEngine';

interface PdfPreviewProps {
  pdfDoc: any;
  currentPage: number;
  totalPages: number;
  pageMeta?: PdfPageMeta;
  watermarks: WatermarkItem[];
  activeWatermarkId: string;
  zoomLevel: number;
  onUpdateActiveWatermark: (updates: Partial<WatermarkItem>, commit?: boolean) => void;
  onSelectActiveWatermark?: (id: string) => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  pdfDoc,
  currentPage,
  totalPages,
  pageMeta,
  watermarks,
  activeWatermarkId,
  zoomLevel,
  onUpdateActiveWatermark,
  onSelectActiveWatermark,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderVersion, setRenderVersion] = useState<number>(0);

  const computedScale = (zoomLevel / 100) * 1.0;

  // Base dimensions from page metadata or sensible standard page defaults
  const fallbackWidth = pageMeta ? Math.round(pageMeta.width * computedScale) : Math.round(595 * computedScale);
  const fallbackHeight = pageMeta ? Math.round(pageMeta.height * computedScale) : Math.round(842 * computedScale);

  const [displaySize, setDisplaySize] = useState<{ width: number; height: number }>({
    width: fallbackWidth,
    height: fallbackHeight,
  });

  // Keep displaySize aligned when zoomLevel or pageMeta changes
  useEffect(() => {
    if (pageMeta) {
      setDisplaySize({
        width: Math.round(pageMeta.width * computedScale),
        height: Math.round(pageMeta.height * computedScale),
      });
    }
  }, [pageMeta, computedScale]);

  // Dragging state on canvas
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number; initialXPercent: number; initialYPercent: number }>({
    x: 0,
    y: 0,
    initialXPercent: 50,
    initialYPercent: 50,
  });

  // Render PDF page to image safely via isolated offscreen canvas
  useEffect(() => {
    if (!pdfDoc) return;

    let isCancelled = false;
    setIsRendering(true);
    setRenderError(null);

    const renderPage = async () => {
      try {
        const result = await renderPdfPageToImage(
          pdfDoc,
          currentPage,
          computedScale,
          'wm_preview'
        );

        if (!isCancelled && result) {
          setPageImageUrl(result.dataUrl);
          setDisplaySize({
            width: result.width,
            height: result.height,
          });
          setRenderError(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Canvas render error in PdfPreview:', err);
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
  }, [pdfDoc, currentPage, computedScale, renderVersion]);

  // Pointer Drag Handlers for direct interactive repositioning
  const handlePointerDown = (e: React.PointerEvent, wm: WatermarkItem) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (onSelectActiveWatermark && wm.id !== activeWatermarkId) {
      onSelectActiveWatermark(wm.id);
    }

    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialXPercent: wm.xPercent,
      initialYPercent: wm.yPercent,
    };
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      // Convert pixel deltas to container percentage
      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      const nextX = Math.max(5, Math.min(95, dragStartPos.current.initialXPercent + deltaXPercent));
      const nextY = Math.max(5, Math.min(95, dragStartPos.current.initialYPercent + deltaYPercent));

      onUpdateActiveWatermark(
        {
          positionType: 'custom',
          xPercent: Math.round(nextX),
          yPercent: Math.round(nextY),
        },
        false // Do not push to history on every mouse tick
      );
    },
    [isDragging, onUpdateActiveWatermark]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        setIsDragging(false);
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        // Commit final state to history
        onUpdateActiveWatermark({}, true);
      }
    },
    [isDragging, onUpdateActiveWatermark]
  );

  const containerW = displaySize.width || fallbackWidth;
  const containerH = displaySize.height || fallbackHeight;

  return (
    <div
      className="w-full flex-1 flex flex-col items-center justify-center min-h-[460px] p-4 overflow-auto scrollbar-thin select-none relative"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Page Container */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-lg shadow-2xl transition-all duration-150 border border-neutral-300 overflow-hidden"
        style={{
          width: `${containerW}px`,
          height: `${containerH}px`,
          minWidth: '240px',
          minHeight: '340px',
        }}
      >
        {/* Rendered PDF Page Image */}
        {pageImageUrl ? (
          <img
            src={pageImageUrl}
            alt={`PDF Page ${currentPage}`}
            className="block w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-white flex items-center justify-center text-neutral-400 text-xs">
            <span>Loading page...</span>
          </div>
        )}

        {/* Loading Overlay */}
        {isRendering && !pageImageUrl && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center space-y-2 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#7c3aed]" />
            <span className="text-xs font-mono font-medium text-neutral-600">
              Rendering Page {currentPage}...
            </span>
          </div>
        )}

        {/* Retryable Error Overlay if rendering fails completely */}
        {renderError && !pageImageUrl && (
          <div className="absolute inset-0 bg-rose-50/95 flex flex-col items-center justify-center p-6 text-center text-rose-600 z-20 space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Failed to render page preview</p>
              <p className="text-xs text-rose-500/80 max-w-xs">{renderError}</p>
            </div>
            <button
              type="button"
              onClick={() => setRenderVersion((v) => v + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Render</span>
            </button>
          </div>
        )}

        {/* Watermarks Layer Overlay */}
        <div className="absolute inset-0 pointer-events-auto overflow-hidden">
          {watermarks.map((wm) => {
            if (!wm.visible) return null;

            // Check if page selection applies to this page
            const applies = isPageSelected(wm.pageSelection, currentPage, currentPage, totalPages);
            if (!applies) return null;

            const isActive = wm.id === activeWatermarkId;

            if (wm.isTiled) {
              // Tiled Repeating Grid
              const tileRows = Array.from({ length: 8 });
              const tileCols = Array.from({ length: 6 });

              return (
                <div
                  key={wm.id}
                  className="absolute inset-0 flex flex-wrap content-around justify-around pointer-events-none p-4"
                  style={{
                    opacity: wm.tileOpacity ?? wm.opacity,
                    transform: `rotate(${wm.tileRotation ?? wm.rotation}deg)`,
                  }}
                >
                  {tileRows.map((_, rIdx) =>
                    tileCols.map((_, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className="p-3 text-center whitespace-nowrap select-none"
                        style={{
                          transform: `scale(${computedScale})`,
                        }}
                      >
                        {wm.type === 'text' ? (
                          <span
                            className="font-bold uppercase tracking-wider"
                            style={{
                              fontFamily: wm.fontFamily,
                              fontSize: `${wm.fontSize * 0.65}px`,
                              color: wm.color,
                              fontWeight: wm.fontWeight,
                              fontStyle: wm.fontStyle,
                            }}
                          >
                            {wm.text || 'CONFIDENTIAL'}
                          </span>
                        ) : wm.imageDataUrl ? (
                          <img
                            src={wm.imageDataUrl}
                            alt="Watermark"
                            style={{
                              width: `${wm.imageWidth * 0.65}px`,
                              height: 'auto',
                            }}
                          />
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              );
            }

            // Single Positioned & Draggable Watermark
            return (
              <div
                key={wm.id}
                onPointerDown={(e) => handlePointerDown(e, wm)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-shadow cursor-grab active:cursor-grabbing select-none group ${
                  isActive
                    ? 'ring-2 ring-dashed ring-[#7c3aed] ring-offset-2 ring-offset-white/20'
                    : 'hover:ring-1 hover:ring-dashed hover:ring-neutral-400'
                }`}
                style={{
                  left: `${wm.xPercent}%`,
                  top: `${wm.yPercent}%`,
                  opacity: wm.opacity,
                  transform: `translate(-50%, -50%) rotate(${wm.rotation}deg) scale(${computedScale})`,
                  zIndex: wm.layer === 'front' ? 15 : 5,
                }}
                title={isActive ? 'Click & Drag to reposition' : 'Click to select watermark'}
              >
                {/* Visual Drag Indicator badge when hovering/active */}
                {isActive && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#7c3aed] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap">
                    <Move className="w-2.5 h-2.5" />
                    <span>Drag</span>
                  </div>
                )}

                {/* Content */}
                {wm.type === 'text' ? (
                  <div
                    className="whitespace-nowrap px-2 py-1 leading-none transition-colors"
                    style={{
                      fontFamily: wm.fontFamily,
                      fontSize: `${wm.fontSize}px`,
                      fontWeight: wm.fontWeight,
                      fontStyle: wm.fontStyle,
                      color: wm.color,
                    }}
                  >
                    {wm.text || 'CONFIDENTIAL'}
                  </div>
                ) : wm.imageDataUrl ? (
                  <img
                    src={wm.imageDataUrl}
                    alt={wm.name}
                    className="block pointer-events-none"
                    style={{
                      width: `${wm.imageWidth}px`,
                      height: `${wm.imageHeight}px`,
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div className="border border-dashed border-neutral-400 bg-neutral-100/50 p-4 rounded text-xs text-neutral-500 font-mono">
                    [No Image Uploaded]
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
