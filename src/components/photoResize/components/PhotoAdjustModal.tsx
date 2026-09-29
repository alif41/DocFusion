import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Sliders,
  Crop,
  Sun,
  RefreshCw,
  Check,
  Grid,
  Eye,
  Layers,
  Sparkles,
  Maximize2,
  Scan,
  Move,
} from 'lucide-react';
import {
  PhotoItem,
  ImageAdjustments,
  DEFAULT_ADJUSTMENTS,
  AspectRatioOption,
  FitMode,
} from '../types';
import { Button } from '../../common/Button';

interface PhotoAdjustModalProps {
  item: PhotoItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string, adjustments: ImageAdjustments, applyToAll?: boolean) => void;
  aspectRatio: AspectRatioOption;
  fit: FitMode;
  customRatioW?: number;
  customRatioH?: number;
}

export const PhotoAdjustModal: React.FC<PhotoAdjustModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  aspectRatio,
  fit,
  customRatioW = 16,
  customRatioH = 9,
}) => {
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(
    item.adjustments ? { ...item.adjustments } : { ...DEFAULT_ADJUSTMENTS }
  );

  const [activeTab, setActiveTab] = useState<'framing' | 'color'>('framing');
  const [viewMode, setViewMode] = useState<'full' | 'cropped'>('full');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; cropX: number; cropY: number }>({
    x: 0,
    y: 0,
    cropX: 0,
    cropY: 0,
  });

  // Re-sync adjustments when modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      setAdjustments(item.adjustments ? { ...item.adjustments } : { ...DEFAULT_ADJUSTMENTS });
      setViewMode('full');
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  // Use the highest resolution image URL available (full file blob or 2048px decoded buffer)
  const highResImageUrl = item.fullPreviewUrl || item.previewUrl;

  // Calculate target aspect ratio decimal (Width / Height)
  const getTargetRatio = (): number => {
    if (aspectRatio === '1:1') return 1;
    if (aspectRatio === '4:3') return 4 / 3;
    if (aspectRatio === '3:2') return 3 / 2;
    if (aspectRatio === '16:9') return 16 / 9;
    if (aspectRatio === '9:16') return 9 / 16;
    if (aspectRatio === '4:5') return 4 / 5;
    if (aspectRatio === '2:3') return 2 / 3;
    if (aspectRatio === '21:9') return 21 / 9;
    if (aspectRatio === 'custom') return (customRatioW || 1) / (customRatioH || 1);
    if (item.originalWidth && item.originalHeight) {
      return item.originalWidth / item.originalHeight;
    }
    return 1;
  };

  const targetRatio = getTargetRatio();
  const imageNaturalRatio =
    item.originalWidth && item.originalHeight
      ? item.originalWidth / item.originalHeight
      : 1;

  // Rotation & Flip handlers
  const handleRotate = (degrees: number) => {
    setAdjustments((prev) => {
      const nextRot = (prev.rotation + degrees + 360) % 360;
      return { ...prev, rotation: nextRot };
    });
  };

  const handleFlipH = () => {
    setAdjustments((prev) => ({ ...prev, flipH: !prev.flipH }));
  };

  const handleFlipV = () => {
    setAdjustments((prev) => ({ ...prev, flipV: !prev.flipV }));
  };

  const handleReset = () => {
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
  };

  // Preset Filters
  const applyPresetFilter = (preset: 'natural' | 'vivid' | 'bw' | 'warm' | 'cool') => {
    if (preset === 'natural') {
      setAdjustments((prev) => ({ ...prev, brightness: 100, contrast: 100, saturation: 100 }));
    } else if (preset === 'vivid') {
      setAdjustments((prev) => ({ ...prev, brightness: 105, contrast: 115, saturation: 130 }));
    } else if (preset === 'bw') {
      setAdjustments((prev) => ({ ...prev, brightness: 105, contrast: 120, saturation: 0 }));
    } else if (preset === 'warm') {
      setAdjustments((prev) => ({ ...prev, brightness: 104, contrast: 105, saturation: 115 }));
    } else if (preset === 'cool') {
      setAdjustments((prev) => ({ ...prev, brightness: 102, contrast: 108, saturation: 95 }));
    }
  };

  // Drag handlers to reposition the crop frame
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      cropX: adjustments.cropX,
      cropY: adjustments.cropY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Movement sensitivity relative to container width
    const newCropX = Math.max(-50, Math.min(50, dragStartRef.current.cropX + dx * 0.3));
    const newCropY = Math.max(-50, Math.min(50, dragStartRef.current.cropY + dy * 0.3));

    setAdjustments((prev) => ({ ...prev, cropX: newCropX, cropY: newCropY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Set focal point coordinates
  const setFocalPoint = (posX: number, posY: number) => {
    setAdjustments((prev) => ({ ...prev, cropX: posX, cropY: posY }));
  };

  // Calculate crop window dimensions relative to the full image
  // If target ratio is narrower than image, crop window width is restricted.
  // If target ratio is wider than image, crop window height is restricted.
  const calculateCropBoxStyle = () => {
    let boxWidthPercent = 100;
    let boxHeightPercent = 100;

    if (targetRatio < imageNaturalRatio) {
      // Narrower crop (e.g. 1:1 on 16:9 image)
      boxWidthPercent = (targetRatio / imageNaturalRatio) * 100;
      boxHeightPercent = 100;
    } else {
      // Wider crop (e.g. 16:9 on 1:1 image)
      boxWidthPercent = 100;
      boxHeightPercent = (imageNaturalRatio / targetRatio) * 100;
    }

    // Apply zoom (zoom shrinks the crop window or enlarges the image)
    const zoom = adjustments.zoom || 1;
    boxWidthPercent = Math.max(20, boxWidthPercent / zoom);
    boxHeightPercent = Math.max(20, boxHeightPercent / zoom);

    // Max horizontal / vertical travel available
    const maxShiftX = (100 - boxWidthPercent) / 2;
    const maxShiftY = (100 - boxHeightPercent) / 2;

    // Map cropX/cropY (-50 to 50) to actual offset
    const offsetX = (adjustments.cropX / 50) * maxShiftX;
    const offsetY = (adjustments.cropY / 50) * maxShiftY;

    const left = 50 - boxWidthPercent / 2 + offsetX;
    const top = 50 - boxHeightPercent / 2 + offsetY;

    return {
      left: `${Math.max(0, Math.min(100 - boxWidthPercent, left))}%`,
      top: `${Math.max(0, Math.min(100 - boxHeightPercent, top))}%`,
      width: `${boxWidthPercent}%`,
      height: `${boxHeightPercent}%`,
    };
  };

  const cropBox = calculateCropBoxStyle();

  // CSS transform for image color and orientation
  const getImageFilterStyle = () => {
    if (isComparing) {
      return {};
    }
    const scaleX = adjustments.flipH ? -1 : 1;
    const scaleY = adjustments.flipV ? -1 : 1;
    return {
      transform: `scale(${scaleX}, ${scaleY}) rotate(${adjustments.rotation}deg)`,
      filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`,
      transition: isDragging ? 'none' : 'transform 0.15s ease-out, filter 0.15s ease-out',
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onMouseUp={handleMouseUp}
    >
      <div className="relative w-full max-w-5xl 2xl:max-w-6xl max-h-[95vh] flex flex-col rounded-3xl bg-white dark:bg-[#10101c] border border-slate-200 dark:border-[#222238] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-3.5 sm:px-6 py-3 border-b border-slate-100 dark:border-[#1e1e2e] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Preview &amp; Adjust: {item.name}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                Full Image View: {item.originalWidth || '?'} × {item.originalHeight || '?'} px •{' '}
                Ratio:{' '}
                <span className="font-bold text-[#7c3aed] dark:text-[#a78bfa]">
                  {aspectRatio === 'original' ? 'Original (No Crop)' : aspectRatio}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle (Full Image vs Final Crop) */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#161626] border border-slate-200 dark:border-[#262638]">
              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'full'
                    ? 'bg-white dark:bg-[#25253e] text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400'
                }`}
                title="View entire full image with interactive crop frame overlay"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Image</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cropped')}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'cropped'
                    ? 'bg-white dark:bg-[#25253e] text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400'
                }`}
                title="Preview final cropped framing"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Cropped View</span>
              </button>
            </div>

            {/* Compare Original Button */}
            <button
              type="button"
              onMouseDown={() => setIsComparing(true)}
              onMouseUp={() => setIsComparing(false)}
              onMouseLeave={() => setIsComparing(false)}
              className={`px-3 py-1 rounded-xl text-xs font-mono border transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                isComparing
                  ? 'bg-amber-500 text-white border-amber-500 font-bold'
                  : 'bg-slate-100 dark:bg-[#161626] border-slate-200 dark:border-[#262638] text-slate-700 dark:text-neutral-300 hover:border-slate-300'
              }`}
              title="Hold to see original unadjusted image"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isComparing ? 'Original' : 'Compare'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Area: Left Canvas, Right Controls */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Canvas Viewing Stage (Cols 1-7) */}
          <div
            ref={containerRef}
            className="lg:col-span-7 p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[350px] sm:min-h-[460px] 2xl:min-h-[560px] select-none relative overflow-hidden"
            onMouseMove={handleMouseMove}
          >
            {/* VIEW MODE 1: FULL IMAGE VIEW WITH CROP FRAME OVERLAY */}
            {viewMode === 'full' && (
              <div
                className="relative max-w-full max-h-[420px] 2xl:max-h-[540px] flex items-center justify-center rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 shadow-2xl select-none"
                onMouseDown={handleMouseDown}
              >
                {/* Full Resolution Image (Crystal-Clear) */}
                <img
                  src={highResImageUrl}
                  alt={item.name}
                  style={getImageFilterStyle()}
                  draggable={false}
                  className="max-w-full max-h-[420px] 2xl:max-h-[540px] w-auto h-auto object-contain block select-none"
                />

                {/* Scrim Mask / Dark overlay over cropped areas (only when aspect ratio is not original and not comparing) */}
                {aspectRatio !== 'original' && !isComparing && (
                  <>
                    {/* Darkened Outer Mask */}
                    <div
                      className="absolute inset-0 pointer-events-none bg-black/55 backdrop-blur-[0.5px]"
                      style={{
                        clipPath: `polygon(
                          0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                          ${cropBox.left} ${cropBox.top},
                          calc(${cropBox.left} + ${cropBox.width}) ${cropBox.top},
                          calc(${cropBox.left} + ${cropBox.width}) calc(${cropBox.top} + ${cropBox.height}),
                          ${cropBox.left} calc(${cropBox.top} + ${cropBox.height}),
                          ${cropBox.left} ${cropBox.top}
                        )`,
                      }}
                    />

                    {/* Illuminated Interactive Crop Window */}
                    <div
                      className="absolute pointer-events-none border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_0_20px_rgba(124,58,237,0.3)] transition-all"
                      style={{
                        left: cropBox.left,
                        top: cropBox.top,
                        width: cropBox.width,
                        height: cropBox.height,
                      }}
                    >
                      {/* Rule of Thirds Grid Lines */}
                      {showGrid && (
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/30">
                          <div className="border-r border-b border-white/20" />
                          <div className="border-r border-b border-white/20" />
                          <div className="border-b border-white/20" />
                          <div className="border-r border-b border-white/20" />
                          <div className="border-r border-b border-white/20" />
                          <div className="border-b border-white/20" />
                          <div className="border-r border-white/20" />
                          <div className="border-r border-white/20" />
                          <div />
                        </div>
                      )}

                      {/* Corner Crop Handles */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#a78bfa]" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#a78bfa]" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#a78bfa]" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#a78bfa]" />

                      {/* Center Crosshair */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-40">
                        <div className="w-3 h-0.5 bg-white" />
                        <div className="h-3 w-0.5 bg-white absolute" />
                      </div>
                    </div>
                  </>
                )}

                {/* Comparing Badge */}
                {isComparing && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-amber-500 text-white text-[11px] font-mono font-bold shadow-md">
                    Original Source Image (Full)
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE 2: FINAL CROPPED OUTPUT PREVIEW */}
            {viewMode === 'cropped' && (
              <div
                className="relative max-w-full max-h-[420px] 2xl:max-h-[540px] w-full flex items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl bg-neutral-900"
                style={{
                  aspectRatio: `${targetRatio}`,
                }}
              >
                <img
                  src={highResImageUrl}
                  alt={item.name}
                  style={{
                    ...getImageFilterStyle(),
                    transform: `translate(${adjustments.cropX}px, ${adjustments.cropY}px) scale(${
                      (adjustments.zoom || 1) * (adjustments.flipH ? -1 : 1)
                    }, ${(adjustments.zoom || 1) * (adjustments.flipV ? -1 : 1)}) rotate(${adjustments.rotation}deg)`,
                  }}
                  draggable={false}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </div>
            )}

            {/* Canvas Bottom Legend / Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs font-mono text-white/80 z-10">
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showGrid
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-black/40 border-white/15 text-white/60 hover:text-white'
                }`}
                title="Toggle 3x3 Rule-of-Thirds Grid"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>

              <span className="text-white/40">•</span>

              <span className="text-white/70 text-[11px] flex items-center gap-1">
                <Move className="w-3 h-3 text-[#a78bfa]" />
                <span>Drag to reposition crop frame across full photo</span>
              </span>

              <span className="text-white/40">•</span>

              <span className="text-white/70 text-[11px]">
                Zoom: {(adjustments.zoom || 1).toFixed(1)}x
              </span>
            </div>
          </div>

          {/* Right Controls Panel (Cols 8-12) */}
          <div className="lg:col-span-5 p-4 sm:p-6 bg-slate-50/70 dark:bg-[#131322] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-[#222238] space-y-5">
            {/* Tabs (Framing & Rotation vs Color & Lighting) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-[#1a1a2e] border border-slate-200 dark:border-[#262638]">
              <button
                type="button"
                onClick={() => setActiveTab('framing')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'framing'
                    ? 'bg-white dark:bg-[#25253e] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Framing &amp; Crop</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('color')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'color'
                    ? 'bg-white dark:bg-[#25253e] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Color &amp; Light</span>
              </button>
            </div>

            {/* TAB 1: FRAMING, ROTATION & POSITION */}
            {activeTab === 'framing' && (
              <div className="space-y-4">
                {/* Zoom Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-neutral-400 flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom Scale</span>
                    </span>
                    <span className="font-bold text-[#7c3aed] dark:text-[#a78bfa]">
                      {(adjustments.zoom || 1).toFixed(2)}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustments((p) => ({ ...p, zoom: Math.max(1, (p.zoom || 1) - 0.2) }))
                      }
                      className="p-1 rounded-lg border border-slate-200 dark:border-[#262638] bg-white dark:bg-[#1a1a2e] text-slate-600 dark:text-neutral-400 hover:text-slate-900 cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={adjustments.zoom || 1}
                      onChange={(e) =>
                        setAdjustments((p) => ({ ...p, zoom: parseFloat(e.target.value) }))
                      }
                      className="flex-1 accent-[#7c3aed] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustments((p) => ({ ...p, zoom: Math.min(3, (p.zoom || 1) + 0.2) }))
                      }
                      className="p-1 rounded-lg border border-slate-200 dark:border-[#262638] bg-white dark:bg-[#1a1a2e] text-slate-600 dark:text-neutral-400 hover:text-slate-900 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rotate & Flip Tools */}
                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-mono text-slate-600 dark:text-neutral-400 block">
                    Orientation &amp; Symmetry
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRotate(-90)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-[#262638] bg-white dark:bg-[#1a1a2e] text-slate-700 dark:text-neutral-300 hover:border-[#7c3aed] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Rotate 90° Counter-Clockwise"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span className="text-[10px] font-mono">-90°</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRotate(90)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-[#262638] bg-white dark:bg-[#1a1a2e] text-slate-700 dark:text-neutral-300 hover:border-[#7c3aed] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span className="text-[10px] font-mono">+90°</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFlipH}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                        adjustments.flipH
                          ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-slate-900 dark:text-white font-bold ring-1 ring-[#7c3aed]'
                          : 'border-slate-200 dark:border-[#262638] bg-white dark:bg-[#1a1a2e] text-slate-700 dark:text-neutral-300 hover:border-[#7c3aed]'
                      }`}
                      title="Flip Horizontally"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                      <span className="text-[10px] font-mono">Flip H</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFlipV}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                        adjustments.flipV
                          ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-slate-900 dark:text-white font-bold ring-1 ring-[#7c3aed]'
                          : 'border-slate-200 dark:border-[#262638] bg-white dark:bg-[#1a1a2e] text-slate-700 dark:text-neutral-300 hover:border-[#7c3aed]'
                      }`}
                      title="Flip Vertically"
                    >
                      <FlipVertical className="w-4 h-4" />
                      <span className="text-[10px] font-mono">Flip V</span>
                    </button>
                  </div>
                </div>

                {/* 9-Point Focal Alignment Matrix */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono text-slate-600 dark:text-neutral-400">
                      Crop Position on Full Image
                    </label>
                    <button
                      type="button"
                      onClick={() => setFocalPoint(0, 0)}
                      className="text-[10px] font-mono text-[#7c3aed] dark:text-[#a78bfa] underline cursor-pointer"
                    >
                      Center Align
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 max-w-[200px]">
                    {[
                      { label: 'Top Left', x: -40, y: -40 },
                      { label: 'Top', x: 0, y: -40 },
                      { label: 'Top Right', x: 40, y: -40 },
                      { label: 'Left', x: -40, y: 0 },
                      { label: 'Center', x: 0, y: 0 },
                      { label: 'Right', x: 40, y: 0 },
                      { label: 'Btm Left', x: -40, y: 40 },
                      { label: 'Bottom', x: 0, y: 40 },
                      { label: 'Btm Right', x: 40, y: 40 },
                    ].map((pt) => {
                      const isActive =
                        Math.abs((adjustments.cropX || 0) - pt.x) < 10 &&
                        Math.abs((adjustments.cropY || 0) - pt.y) < 10;
                      return (
                        <button
                          key={pt.label}
                          type="button"
                          onClick={() => setFocalPoint(pt.x, pt.y)}
                          className={`p-1.5 rounded-lg border text-[10px] font-mono transition-colors cursor-pointer text-center ${
                            isActive
                              ? 'bg-[#7c3aed] text-white border-[#7c3aed] font-bold'
                              : 'bg-white dark:bg-[#1a1a2e] border-slate-200 dark:border-[#262638] text-slate-600 dark:text-neutral-400 hover:border-slate-400'
                          }`}
                        >
                          {pt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COLOR & LIGHTING */}
            {activeTab === 'color' && (
              <div className="space-y-4">
                {/* Tone Presets */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-600 dark:text-neutral-400 block">
                    Quick Tone Presets
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'natural', label: 'Natural' },
                      { id: 'vivid', label: 'Vivid' },
                      { id: 'bw', label: 'B&W Monochrome' },
                      { id: 'warm', label: 'Warm' },
                      { id: 'cool', label: 'Cool' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPresetFilter(p.id as any)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#262638] bg-white dark:bg-[#1a1a2e] hover:border-[#7c3aed] text-xs font-mono text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-neutral-400">Brightness</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {adjustments.brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    step={1}
                    value={adjustments.brightness}
                    onChange={(e) =>
                      setAdjustments((p) => ({ ...p, brightness: parseInt(e.target.value, 10) }))
                    }
                    className="w-full accent-[#7c3aed] cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-neutral-400">Contrast</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {adjustments.contrast}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    step={1}
                    value={adjustments.contrast}
                    onChange={(e) =>
                      setAdjustments((p) => ({ ...p, contrast: parseInt(e.target.value, 10) }))
                    }
                    className="w-full accent-[#7c3aed] cursor-pointer"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-neutral-400">Saturation</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {adjustments.saturation}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={2}
                    value={adjustments.saturation}
                    onChange={(e) =>
                      setAdjustments((p) => ({ ...p, saturation: parseInt(e.target.value, 10) }))
                    }
                    className="w-full accent-[#7c3aed] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Reset Button */}
            <div className="pt-2 border-t border-slate-200 dark:border-[#222238] flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-mono text-slate-500 hover:text-rose-500 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <span className="text-[11px] font-mono text-slate-400">
                Rot: {adjustments.rotation}° | Zoom: {(adjustments.zoom || 1).toFixed(1)}x
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:px-6 py-3 border-t border-slate-100 dark:border-[#1e1e2e] bg-slate-50/50 dark:bg-[#111120] flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onSave(item.id, adjustments, true)}
              leftIcon={<Layers className="w-3.5 h-3.5" />}
              className="text-xs font-medium"
              title="Apply these framing and color adjustments across all photos in the queue"
            >
              Apply to All Photos
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onSave(item.id, adjustments, false)}
              leftIcon={<Check className="w-4 h-4 text-white" />}
              className="font-bold text-xs shadow-md shadow-[#7c3aed]/25"
            >
              Save &amp; Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
