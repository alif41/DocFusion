import React from 'react';
import { Bold, Italic, Palette } from 'lucide-react';
import { WatermarkItem } from '../types';
import { WATERMARK_PDF_CONFIG } from '../config/watermarkPdfConfig';

interface TextWatermarkSettingsProps {
  watermark: WatermarkItem;
  onChange: (updates: Partial<WatermarkItem>) => void;
}

export const TextWatermarkSettings: React.FC<TextWatermarkSettingsProps> = ({
  watermark,
  onChange,
}) => {
  const { availableFonts, fontSizePresets, colorPalette } = WATERMARK_PDF_CONFIG;

  return (
    <div className="space-y-4">
      {/* 1. Text Input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-neutral-300">
          Watermark Text
        </label>
        <input
          type="text"
          value={watermark.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="e.g. CONFIDENTIAL, DRAFT, © 2026..."
          className="w-full bg-[#121220] border border-[#222234] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#7c3aed] transition-colors"
        />
      </div>

      {/* 2. Font & Style Controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* Font Family */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-300">Font</label>
          <select
            value={watermark.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value as any })}
            className="w-full bg-[#121220] border border-[#222234] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#7c3aed] cursor-pointer"
          >
            {availableFonts.map((f) => (
              <option key={f.value} value={f.value} className="bg-[#121220] text-white">
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Weight & Italic Toggles */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-300">Style</label>
          <div className="flex items-center gap-1.5 bg-[#121220] p-1 rounded-xl border border-[#222234] h-[38px]">
            <button
              type="button"
              onClick={() =>
                onChange({ fontWeight: watermark.fontWeight === 'bold' ? 'normal' : 'bold' })
              }
              className={`flex-1 flex items-center justify-center py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                watermark.fontWeight === 'bold'
                  ? 'bg-[#7c3aed] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() =>
                onChange({ fontStyle: watermark.fontStyle === 'italic' ? 'normal' : 'italic' })
              }
              className={`flex-1 flex items-center justify-center py-1 rounded-lg text-xs italic transition-colors cursor-pointer ${
                watermark.fontStyle === 'italic'
                  ? 'bg-[#7c3aed] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Font Size: Presets + Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-300">Font Size</span>
          <span className="font-mono text-[#a78bfa] font-bold">{watermark.fontSize} px</span>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-3 gap-1.5">
          {fontSizePresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange({ fontSize: preset.size })}
              className={`py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                watermark.fontSize === preset.size
                  ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white font-bold'
                  : 'bg-[#121220] border-[#222234] text-neutral-400 hover:text-white hover:border-[#38384f]'
              }`}
            >
              {preset.label} ({preset.size})
            </button>
          ))}
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="12"
          max="120"
          step="2"
          value={watermark.fontSize}
          onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) })}
          className="w-full accent-[#7c3aed] bg-[#222234] rounded-lg h-1.5 cursor-pointer"
        />
      </div>

      {/* 4. Text Color */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-300">Text Color</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block"
              style={{ backgroundColor: watermark.color }}
            />
            <span>{watermark.color.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Swatches */}
          <div className="flex-1 flex items-center justify-between gap-1 bg-[#121220] p-1.5 rounded-xl border border-[#222234]">
            {colorPalette.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => onChange({ color: col })}
                className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                  watermark.color.toLowerCase() === col.toLowerCase()
                    ? 'scale-125 border-white shadow-md'
                    : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: col }}
                title={col}
              />
            ))}
          </div>

          {/* Custom Color Input */}
          <label
            className="w-8 h-8 rounded-xl border border-[#222234] bg-[#121220] hover:border-[#7c3aed] flex items-center justify-center cursor-pointer transition-colors relative"
            title="Custom Color"
          >
            <Palette className="w-4 h-4 text-neutral-400" />
            <input
              type="color"
              value={watermark.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
