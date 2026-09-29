import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  TextAnnotation,
  DrawingPath,
  SignatureAnnotation,
  ShapeAnnotation,
  StampAnnotation,
  EditorTool,
  ShapeType,
} from '../../types/pdf';
import { Trash2, Move, GripVertical, X } from 'lucide-react';

interface InteractivePageCanvasProps {
  pdfDoc: any;
  currentPage: number;
  scale: number;
  rotation: number;
  currentTool: EditorTool;

  // Annotations
  texts: TextAnnotation[];
  onTextsChange: (texts: TextAnnotation[]) => void;
  drawings: DrawingPath[];
  onDrawingsChange: (drawings: DrawingPath[]) => void;
  signatures: SignatureAnnotation[];
  onSignaturesChange: (signatures: SignatureAnnotation[]) => void;
  shapes: ShapeAnnotation[];
  onShapesChange: (shapes: ShapeAnnotation[]) => void;
  stamps: StampAnnotation[];
  onStampsChange: (stamps: StampAnnotation[]) => void;

  // Active Tool configs
  fontSize: number;
  textColor: string;
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier';
  isBold: boolean;
  textBgColor: string;
  penWidth: number;
  penColor: string;
  highlighterColor: string;
  currentShapeType: ShapeType;
}

export const InteractivePageCanvas: React.FC<InteractivePageCanvasProps> = ({
  pdfDoc,
  currentPage,
  scale,
  rotation,
  currentTool,
  texts,
  onTextsChange,
  drawings,
  onDrawingsChange,
  signatures,
  onSignaturesChange,
  shapes,
  onShapesChange,
  stamps,
  onStampsChange,
  fontSize,
  textColor,
  fontFamily,
  isBold,
  textBgColor,
  penWidth,
  penColor,
  highlighterColor,
  currentShapeType,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: 612,
    height: 792,
  });
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);

  // Live drawing state
  const isDrawingRef = useRef<boolean>(false);
  const currentPathPoints = useRef<{ x: number; y: number }[]>([]);

  // Dragging state
  const [activeDragItem, setActiveDragItem] = useState<{
    id: string;
    type: 'text' | 'signature' | 'shape' | 'stamp';
    startX: number;
    startY: number;
    initialElemX: number;
    initialElemY: number;
  } | null>(null);

  // 1. Render PDF.js page onto pdfCanvasRef
  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current) return;

    let isCancelled = false;
    setIsRenderingPage(true);

    const renderPage = async () => {
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

        // Base unrotated viewport to read native PDF aspect ratio
        const baseViewport = page.getViewport({ scale: 1.0 });
        const finalRotation = (page.rotate + rotation) % 360;
        const viewport = page.getViewport({ scale, rotation: finalRotation });

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);

        setPageSize({
          width: Math.round(viewport.width),
          height: Math.round(viewport.height),
        });

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (!isCancelled) {
          setIsRenderingPage(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('PDF page render error:', err);
        }
        if (!isCancelled) {
          setIsRenderingPage(false);
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
  }, [pdfDoc, currentPage, scale, rotation]);

  // 2. Redraw existing freehand drawings whenever drawings or page changes
  const redrawDrawingCanvas = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageDrawings = drawings.filter((d) => d.page === currentPage);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const draw of pageDrawings) {
      if (!draw.points || draw.points.length < 2) continue;

      ctx.beginPath();
      ctx.strokeStyle = draw.color;
      ctx.lineWidth = draw.strokeWidth * (scale / 1.0);
      ctx.globalAlpha = draw.isHighlighter ? 0.35 : 1.0;

      const p0 = draw.points[0];
      ctx.moveTo((p0.x / 100) * canvas.width, (p0.y / 100) * canvas.height);

      for (let i = 1; i < draw.points.length; i++) {
        const p = draw.points[i];
        ctx.lineTo((p.x / 100) * canvas.width, (p.y / 100) * canvas.height);
      }
      ctx.stroke();
    }
  }, [drawings, currentPage, scale]);

  useEffect(() => {
    redrawDrawingCanvas();
  }, [redrawDrawingCanvas, pageSize]);

  // 3. Freehand draw mouse & touch handlers
  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'draw' && currentTool !== 'highlight') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const xPx = clientX - rect.left;
    const yPx = clientY - rect.top;

    const normX = (xPx / canvas.width) * 100;
    const normY = (yPx / canvas.height) * 100;

    currentPathPoints.current = [{ x: normX, y: normY }];

    ctx.beginPath();
    ctx.moveTo(xPx, yPx);
    ctx.strokeStyle = currentTool === 'highlight' ? highlighterColor : penColor;
    ctx.lineWidth = (currentTool === 'highlight' ? 18 : penWidth) * (scale / 1.0);
    ctx.globalAlpha = currentTool === 'highlight' ? 0.35 : 1.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const xPx = clientX - rect.left;
    const yPx = clientY - rect.top;

    const normX = (xPx / canvas.width) * 100;
    const normY = (yPx / canvas.height) * 100;

    currentPathPoints.current.push({ x: normX, y: normY });

    ctx.lineTo(xPx, yPx);
    ctx.stroke();
  };

  const handleDrawEnd = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPathPoints.current.length > 1) {
      const newPath: DrawingPath = {
        id: `draw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        page: currentPage,
        points: [...currentPathPoints.current],
        color: currentTool === 'highlight' ? highlighterColor : penColor,
        strokeWidth: currentTool === 'highlight' ? 18 : penWidth,
        isHighlighter: currentTool === 'highlight',
      };
      onDrawingsChange([...drawings, newPath]);
    }
    currentPathPoints.current = [];
  };

  // 4. Click on page to create elements (Text or Shape)
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeDragItem || currentTool === 'draw' || currentTool === 'highlight' || currentTool === 'select') {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = Math.max(2, Math.min(85, (clickX / pageSize.width) * 100));
    const normY = Math.max(2, Math.min(92, (clickY / pageSize.height) * 100));

    if (currentTool === 'text') {
      const newText: TextAnnotation = {
        id: `text_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        page: currentPage,
        x: normX,
        y: normY,
        text: 'Type text here...',
        fontSize,
        color: textColor,
        fontFamily,
        isBold,
        bgColor: textBgColor,
      };
      onTextsChange([...texts, newText]);
    } else if (currentTool === 'shape') {
      const isRedact = currentShapeType === 'blackout' || currentShapeType === 'whiteout';
      const newShape: ShapeAnnotation = {
        id: `shape_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        page: currentPage,
        x: normX,
        y: normY,
        width: isRedact ? 25 : 30,
        height: isRedact ? 4 : 8,
        shapeType: currentShapeType,
        color: currentShapeType === 'highlight' ? '#fde047' : undefined,
        borderColor: currentShapeType === 'border' ? '#3b82f6' : undefined,
        opacity: currentShapeType === 'highlight' ? 0.4 : 1,
      };
      onShapesChange([...shapes, newShape]);
    }
  };

  // 5. Dragging handlers for text/signatures/shapes/stamps
  const startDrag = (
    e: React.MouseEvent,
    id: string,
    type: 'text' | 'signature' | 'shape' | 'stamp',
    currentElemX: number,
    currentElemY: number
  ) => {
    e.stopPropagation();
    setActiveDragItem({
      id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialElemX: currentElemX,
      initialElemY: currentElemY,
    });
  };

  useEffect(() => {
    if (!activeDragItem) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaXPx = e.clientX - activeDragItem.startX;
      const deltaYPx = e.clientY - activeDragItem.startY;

      const deltaXPercent = (deltaXPx / pageSize.width) * 100;
      const deltaYPercent = (deltaYPx / pageSize.height) * 100;

      const newX = Math.max(0, Math.min(95, activeDragItem.initialElemX + deltaXPercent));
      const newY = Math.max(0, Math.min(95, activeDragItem.initialElemY + deltaYPercent));

      if (activeDragItem.type === 'text') {
        onTextsChange(
          texts.map((t) => (t.id === activeDragItem.id ? { ...t, x: newX, y: newY } : t))
        );
      } else if (activeDragItem.type === 'signature') {
        onSignaturesChange(
          signatures.map((s) => (s.id === activeDragItem.id ? { ...s, x: newX, y: newY } : s))
        );
      } else if (activeDragItem.type === 'shape') {
        onShapesChange(
          shapes.map((sh) => (sh.id === activeDragItem.id ? { ...sh, x: newX, y: newY } : sh))
        );
      } else if (activeDragItem.type === 'stamp') {
        onStampsChange(
          stamps.map((st) => (st.id === activeDragItem.id ? { ...st, x: newX, y: newY } : st))
        );
      }
    };

    const handleMouseUp = () => {
      setActiveDragItem(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDragItem, pageSize, texts, signatures, shapes, stamps]);

  const pageTexts = texts.filter((t) => t.page === currentPage);
  const pageSignatures = signatures.filter((s) => s.page === currentPage);
  const pageShapes = shapes.filter((sh) => sh.page === currentPage);
  const pageStamps = stamps.filter((st) => st.page === currentPage);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-[#08080d] select-none">
      <div
        ref={containerRef}
        onClick={handlePageClick}
        style={{
          width: pageSize.width,
          height: pageSize.height,
        }}
        className="relative bg-white shadow-2xl shadow-black/80 rounded-sm border border-neutral-700/50 cursor-default"
      >
        {/* Base PDF Canvas */}
        <canvas
          ref={pdfCanvasRef}
          className="absolute inset-0 block pointer-events-none"
        />

        {/* Freehand Drawing Overlay Canvas */}
        <canvas
          ref={drawCanvasRef}
          width={pageSize.width}
          height={pageSize.height}
          onMouseDown={handleDrawStart}
          onMouseMove={handleDrawMove}
          onMouseUp={handleDrawEnd}
          onTouchStart={handleDrawStart}
          onTouchMove={handleDrawMove}
          onTouchEnd={handleDrawEnd}
          className={`absolute inset-0 z-10 touch-none ${
            currentTool === 'draw' || currentTool === 'highlight'
              ? 'cursor-crosshair pointer-events-auto'
              : 'pointer-events-none'
          }`}
        />

        {/* Shapes & Redactions Layer */}
        {pageShapes.map((shape) => (
          <div
            key={shape.id}
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: `${shape.width}%`,
              height: `${shape.height}%`,
            }}
            className="group absolute z-15 flex items-center justify-center cursor-move"
            onMouseDown={(e) => startDrag(e, shape.id, 'shape', shape.x, shape.y)}
          >
            {/* Shape Body */}
            {shape.shapeType === 'blackout' && (
              <div className="w-full h-full bg-black shadow-md rounded-xs border border-neutral-700" />
            )}
            {shape.shapeType === 'whiteout' && (
              <div className="w-full h-full bg-white shadow-md rounded-xs border border-neutral-300" />
            )}
            {shape.shapeType === 'highlight' && (
              <div
                className="w-full h-full rounded-xs shadow-xs"
                style={{
                  backgroundColor: shape.color || '#fde047',
                  opacity: shape.opacity ?? 0.4,
                }}
              />
            )}
            {shape.shapeType === 'border' && (
              <div
                className="w-full h-full rounded-xs border-2 shadow-xs"
                style={{
                  borderColor: shape.borderColor || '#3b82f6',
                }}
              />
            )}

            {/* Quick delete badge on hover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShapesChange(shapes.filter((s) => s.id !== shape.id));
              }}
              className="absolute -top-2.5 -right-2.5 p-1 rounded-full bg-rose-600 text-white shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-20"
              title="Delete shape"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Signatures Layer */}
        {pageSignatures.map((sig) => (
          <div
            key={sig.id}
            style={{
              left: `${sig.x}%`,
              top: `${sig.y}%`,
              width: `${sig.width}%`,
            }}
            className="group absolute z-20 cursor-move border border-dashed border-transparent hover:border-[#7c3aed] p-1 rounded-lg"
            onMouseDown={(e) => startDrag(e, sig.id, 'signature', sig.x, sig.y)}
          >
            <img
              src={sig.dataUrl}
              alt="Digital Signature"
              className="w-full h-auto select-none pointer-events-none drop-shadow-xs"
            />
            {/* Delete button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSignaturesChange(signatures.filter((s) => s.id !== sig.id));
              }}
              className="absolute -top-2.5 -right-2.5 p-1 rounded-full bg-rose-600 text-white shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-20"
              title="Delete signature"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Text Annotations Layer */}
        {pageTexts.map((textItem) => (
          <div
            key={textItem.id}
            style={{
              left: `${textItem.x}%`,
              top: `${textItem.y}%`,
            }}
            className="group absolute z-20 flex items-start gap-1 p-1 rounded-lg border border-dashed border-transparent hover:border-[#7c3aed]"
          >
            {/* Drag Handle */}
            <button
              type="button"
              onMouseDown={(e) => startDrag(e, textItem.id, 'text', textItem.x, textItem.y)}
              className="p-1 text-neutral-400 hover:text-white bg-black/60 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
              title="Drag text box"
            >
              <Move className="w-3 h-3" />
            </button>

            {/* Editable Text Area */}
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = e.currentTarget.innerText;
                onTextsChange(
                  texts.map((t) => (t.id === textItem.id ? { ...t, text: newContent } : t))
                );
              }}
              style={{
                fontSize: `${textItem.fontSize * (scale / 1.0)}px`,
                color: textItem.color,
                fontFamily:
                  textItem.fontFamily === 'Courier'
                    ? 'monospace'
                    : textItem.fontFamily === 'TimesRoman'
                    ? 'serif'
                    : 'sans-serif',
                fontWeight: textItem.isBold ? 'bold' : 'normal',
                backgroundColor:
                  textItem.bgColor && textItem.bgColor !== 'transparent'
                    ? textItem.bgColor
                    : undefined,
              }}
              className="min-w-[40px] px-1.5 py-0.5 rounded outline-none focus:ring-1 focus:ring-[#7c3aed] focus:bg-white/80"
            >
              {textItem.text}
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTextsChange(texts.filter((t) => t.id !== textItem.id));
              }}
              className="p-1 rounded-full bg-rose-600 text-white shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
              title="Delete text"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Stamps Layer */}
        {pageStamps.map((stamp) => (
          <div
            key={stamp.id}
            style={{
              left: `${stamp.x}%`,
              top: `${stamp.y}%`,
            }}
            className="group absolute z-20 cursor-move border border-dashed border-transparent hover:border-[#7c3aed] p-1 rounded-lg"
            onMouseDown={(e) => startDrag(e, stamp.id, 'stamp', stamp.x, stamp.y)}
          >
            <div
              className="px-3.5 py-1.5 rounded-lg text-sm font-extrabold uppercase tracking-wider border-2 shadow-md transition-all select-none"
              style={{
                color: stamp.color,
                backgroundColor: stamp.bgColor,
                borderColor: stamp.color,
              }}
            >
              {stamp.label}
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStampsChange(stamps.filter((s) => s.id !== stamp.id));
              }}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-20"
              title="Delete stamp"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Rendering spinner overlay if page is actively loading */}
        {isRenderingPage && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-2xs flex items-center justify-center pointer-events-none">
            <div className="bg-[#12121e]/90 border border-[#2b2b40] rounded-xl px-4 py-2 flex items-center gap-2 text-white text-xs font-mono shadow-xl">
              <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-ping" />
              <span>Rendering Page {currentPage}...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
