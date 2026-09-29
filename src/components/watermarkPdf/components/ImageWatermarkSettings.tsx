import React, { useRef, useState } from 'react';
import { Upload, Trash2, RefreshCw, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { WatermarkItem } from '../types';
import { loadImageAsDataUrl } from '../services/watermarkEngine';

interface ImageWatermarkSettingsProps {
  watermark: WatermarkItem;
  onChange: (updates: Partial<WatermarkItem>) => void;
}

export const ImageWatermarkSettings: React.FC<ImageWatermarkSettingsProps> = ({
  watermark,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const { dataUrl, width, height } = await loadImageAsDataUrl(file);
      // Scale to initial preview size ~200px width
      const initialWidth = 200;
      const initialHeight = Math.round((height / width) * initialWidth) || 120;

      onChange({
        imageDataUrl: dataUrl,
        imageFile: file,
        imageNaturalWidth: width,
        imageNaturalHeight: height,
        imageWidth: initialWidth,
        imageHeight: initialHeight,
        name: file.name.substring(0, 18),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process image file.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleWidthChange = (newWidth: number) => {
    if (!watermark.imageNaturalWidth || !watermark.imageNaturalHeight) {
      onChange({ imageWidth: newWidth });
      return;
    }
    const ratio = watermark.imageNaturalHeight / watermark.imageNaturalWidth;
    const newHeight = Math.round(newWidth * ratio);
    onChange({ imageWidth: newWidth, imageHeight: newHeight });
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleInputChange}
        className="hidden"
      />

      {!watermark.imageDataUrl ? (
        // Upload Logo Card
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#2b2b40] hover:border-[#7c3aed] bg-[#121220] p-6 rounded-2xl text-center cursor-pointer transition-colors group space-y-2"
        >
          <div className="w-12 h-12 rounded-xl bg-[#1b1b2e] border border-[#2d2d46] text-[#a78bfa] flex items-center justify-center mx-auto group-hover:scale-105 group-hover:bg-[#7c3aed] group-hover:text-white transition-all">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Upload Logo or Image Stamp</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">PNG, JPG, WEBP, or SVG</p>
          </div>
        </div>
      ) : (
        // Preview & Image Size Controls
        <div className="space-y-3">
          {/* Mini Thumbnail & Actions */}
          <div className="bg-[#121220] border border-[#222234] rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={watermark.imageDataUrl}
                  alt="Watermark preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{watermark.name}</p>
                <p className="text-[10px] text-neutral-400 font-mono">
                  {watermark.imageWidth} × {watermark.imageHeight} px
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                title="Replace Image"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    imageDataUrl: undefined,
                    imageFile: undefined,
                  })
                }
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Remove Image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Width Size Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300">Image Width</span>
              <span className="font-mono text-[#a78bfa] font-bold">{watermark.imageWidth} px</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="5"
              value={watermark.imageWidth}
              onChange={(e) => handleWidthChange(parseInt(e.target.value, 10))}
              className="w-full accent-[#7c3aed] bg-[#222234] rounded-lg h-1.5 cursor-pointer"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
