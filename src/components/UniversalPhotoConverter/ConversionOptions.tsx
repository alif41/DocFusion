import React from 'react';
import {
  Sliders,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Palette,
  Maximize2,
} from 'lucide-react';
import { PhotoConversionConfig, PhotoOptions } from './types';

interface ConversionOptionsProps {
  config: PhotoConversionConfig;
  options: PhotoOptions;
  onChange: (options: PhotoOptions) => void;
  disabled?: boolean;
}

export const ConversionOptions: React.FC<ConversionOptionsProps> = ({
  config,
  options,
  onChange,
  disabled = false,
}) => {
  const isTargetJpg = config.targetFormat === 'JPG';
  const isTargetWebp = config.targetFormat === 'WEBP';
  const isTargetPdf = config.targetFormat === 'PDF';
  const isSourcePdf = config.sourceFormat === 'PDF';
  const isPngToJpg = config.id === 'png-to-jpg' || config.id === 'webp-to-jpg';

  const update = (patch: Partial<PhotoOptions>) => {
    onChange({ ...options, ...patch });
  };

  return (
    <div className="bg-[#121220] border border-[#24243a] rounded-3xl p-6 space-y-6">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#a78bfa]">
        <Sliders className="w-3.5 h-3.5" />
        <span>Conversion Options</span>
      </div>

      {/* 1. PDF Options (for JPG -> PDF & PNG -> PDF) */}
      {isTargetPdf && (
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Page Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'a4', label: 'A4' },
                { id: 'letter', label: 'US Letter' },
                { id: 'fit', label: 'Fit to Image' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => update({ pageSize: p.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    options.pageSize === p.id
                      ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-md shadow-[#7c3aed]/20'
                      : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white hover:bg-[#1e1e34]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Orientation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto', label: 'Auto' },
                { id: 'portrait', label: 'Portrait' },
                { id: 'landscape', label: 'Landscape' },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => update({ orientation: o.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    options.orientation === o.id
                      ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-md shadow-[#7c3aed]/20'
                      : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white hover:bg-[#1e1e34]'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Page Margins
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'none', label: 'None' },
                { id: 'small', label: 'Small' },
                { id: 'normal', label: 'Normal' },
                { id: 'large', label: 'Large' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => update({ margin: m.id as any })}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                    options.margin === m.id
                      ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                      : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Image Fit
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'fit', label: 'Fit Margin' },
                { id: 'fill', label: 'Fill Page' },
                { id: 'original', label: 'Original' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => update({ imageFit: f.id as any })}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    options.imageFit === f.id
                      ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                      : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. PDF to JPG Options (Page Selection & DPI) */}
      {isSourcePdf && (
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Pages to Convert
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => update({ pdfPages: 'all' })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  options.pdfPages === 'all'
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
                }`}
              >
                All Pages
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => update({ pdfPages: options.pdfPages === 'all' ? '1' : options.pdfPages })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  options.pdfPages !== 'all'
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
                }`}
              >
                Select Range
              </button>
            </div>

            {options.pdfPages !== 'all' && (
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="e.g. 1-3, 5, 8"
                  value={options.pdfPages}
                  onChange={(e) => update({ pdfPages: e.target.value })}
                  disabled={disabled}
                  className="w-full px-3 py-2 rounded-xl bg-[#161626] border border-[#2e2e46] text-white text-xs font-mono focus:border-[#7c3aed] focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500 block mt-1">
                  Specify page numbers and ranges separated by commas.
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Rendering Resolution
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => update({ dpi: 150 })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  options.dpi === 150
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
                }`}
              >
                150 DPI (Standard)
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => update({ dpi: 300 })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  options.dpi === 300
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
                }`}
              >
                300 DPI (High-Res)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Image Quality (for JPG & WEBP output) */}
      {(isTargetJpg || isTargetWebp) && (
        <div className="space-y-3 pt-1 border-t border-[#222234]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Output Quality
            </label>
            <span className="text-xs font-mono font-bold text-[#c084fc]">
              {options.quality}%
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Low', val: 60 },
              { label: 'Medium', val: 80 },
              { label: 'High', val: 92 },
              { label: 'Max', val: 100 },
            ].map((q) => (
              <button
                key={q.val}
                type="button"
                disabled={disabled}
                onClick={() => update({ quality: q.val })}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                  options.quality === q.val
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          <input
            type="range"
            min={10}
            max={100}
            value={options.quality}
            onChange={(e) => update({ quality: parseInt(e.target.value, 10) })}
            disabled={disabled}
            className="w-full accent-[#7c3aed] cursor-pointer"
          />
        </div>
      )}

      {/* 4. Output Resolution Scaling */}
      {!isTargetPdf && (
        <div className="space-y-2.5 pt-1 border-t border-[#222234]">
          <label className="text-xs font-bold text-white uppercase tracking-wider block">
            Resolution Scaling
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'original', label: '100%', scale: 1 },
              { id: 'small', label: '50%', scale: 0.5 },
              { id: 'medium', label: '75%', scale: 0.75 },
              { id: 'large', label: '125%', scale: 1.25 },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={disabled}
                onClick={() => update({ resolution: r.id as any, scale: r.scale })}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                  options.scale === r.scale
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Transparency Flattening Warning & Background Color (for PNG -> JPG) */}
      {isPngToJpg && (
        <div className="space-y-3 pt-1 border-t border-[#222234]">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Transparency Notice</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              JPG does not support transparency. Transparent areas will use the selected background color.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Background Color Fill
            </label>
            <div className="flex items-center gap-3">
              {[
                { label: 'White', color: '#ffffff' },
                { label: 'Black', color: '#000000' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  disabled={disabled}
                  onClick={() => update({ backgroundColor: c.color })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    options.backgroundColor === c.color
                      ? 'bg-[#1e1e32] text-white border-[#7c3aed] ring-1 ring-[#7c3aed]'
                      : 'bg-[#161626] text-neutral-400 border-[#2a2a40]'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-neutral-600"
                    style={{ backgroundColor: c.color }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}

              {/* Custom Color Input */}
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={options.backgroundColor}
                  onChange={(e) => update({ backgroundColor: e.target.value })}
                  disabled={disabled}
                  className="w-7 h-7 rounded-lg border border-neutral-600 bg-transparent cursor-pointer p-0"
                  title="Choose custom background color"
                />
                <span className="text-[10px] font-mono text-neutral-400">
                  {options.backgroundColor}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature & Privacy Guarantees */}
      <div className="space-y-2 pt-2 border-t border-[#222234]">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Preservation Guarantee
        </h4>
        <div className="space-y-1.5">
          {config.supportedFeatures.slice(0, 3).map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
