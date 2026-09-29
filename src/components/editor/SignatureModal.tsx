import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, PenTool, Type, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string) => void;
}

const INK_COLORS = [
  { label: 'Navy Blue', value: '#1e3a8a' },
  { label: 'Black', value: '#0f172a' },
  { label: 'Purple', value: '#6b21a8' },
  { label: 'Emerald', value: '#065f46' },
];

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [selectedColor, setSelectedColor] = useState<string>('#1e3a8a');
  const [typedName, setTypedName] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<string>('cursive');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const hasDrawnRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    // Clear & initialize canvas
    setTimeout(() => {
      clearCanvas();
    }, 50);
  }, [isOpen, activeTab]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
  };

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    hasDrawnRef.current = true;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleApply = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawnRef.current) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSaveSignature(dataUrl);
    } else {
      if (!typedName.trim()) return;
      // Render typed text to offscreen canvas
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 500;
      offCanvas.height = 160;
      const ctx = offCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, offCanvas.width, offCanvas.height);
        ctx.fillStyle = selectedColor;
        ctx.font = `italic 54px ${selectedFont}, "Brush Script MT", "Segoe Script", cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName.trim(), offCanvas.width / 2, offCanvas.height / 2);

        // Draw elegant underline flourish
        ctx.beginPath();
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2.5;
        const textMetrics = ctx.measureText(typedName.trim());
        const startX = Math.max(30, (offCanvas.width - textMetrics.width) / 2);
        const endX = Math.min(offCanvas.width - 30, (offCanvas.width + textMetrics.width) / 2 + 25);
        ctx.moveTo(startX, offCanvas.height / 2 + 35);
        ctx.bezierCurveTo(
          startX + 80,
          offCanvas.height / 2 + 45,
          endX - 50,
          offCanvas.height / 2 + 20,
          endX,
          offCanvas.height / 2 + 35
        );
        ctx.stroke();

        const dataUrl = offCanvas.toDataURL('image/png');
        onSaveSignature(dataUrl);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-[#0f0f18] border border-[#26263d] rounded-3xl p-6 space-y-5 shadow-2xl cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#212133]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center text-[#a78bfa]">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Digital Signature</h3>
              <p className="text-xs text-neutral-400">Sign with mouse, trackpad, or type</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-[#141422] p-1 border border-[#222234]">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'draw'
                ? 'bg-[#7c3aed] text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw Signature</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'type'
                ? 'bg-[#7c3aed] text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Signature</span>
          </button>
        </div>

        {/* Ink Colors */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-neutral-400">Ink Color:</span>
          <div className="flex items-center gap-2">
            {INK_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                className={`w-6 h-6 rounded-full border transition-all ${
                  selectedColor === c.value
                    ? 'scale-125 border-white ring-2 ring-[#7c3aed]'
                    : 'border-white/30 hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Canvas or Type Area */}
        {activeTab === 'draw' ? (
          <div className="space-y-2">
            <div className="relative w-full h-44 rounded-2xl bg-[#ffffff] border-2 border-dashed border-neutral-300 overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={176}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair touch-none"
              />
              <div className="absolute bottom-4 left-6 right-6 border-b border-neutral-300 pointer-events-none flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Sign above this line</span>
                <span>✕</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Signature</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-400">Enter your full name</label>
              <input
                type="text"
                placeholder="e.g. Alexander Vance"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141422] border border-[#28283f] text-white text-sm focus:outline-hidden focus:border-[#7c3aed]"
                maxLength={40}
              />
            </div>

            {/* Live Script Preview */}
            <div className="w-full h-32 rounded-2xl bg-white flex flex-col items-center justify-center p-4 border border-neutral-300 shadow-inner">
              {typedName.trim() ? (
                <div
                  className="text-3xl text-center select-none"
                  style={{
                    color: selectedColor,
                    fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                    fontStyle: 'italic',
                  }}
                >
                  {typedName}
                </div>
              ) : (
                <span className="text-xs text-neutral-400 font-mono">
                  Your styled cursive signature will appear here
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#212133]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Place Signature on Page
          </Button>
        </div>
      </div>
    </div>
  );
};
