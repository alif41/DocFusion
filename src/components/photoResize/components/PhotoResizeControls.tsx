import React, { useState } from 'react';
import {
  Sliders,
  Maximize2,
  Percent,
  Layers,
  Lock,
  Unlock,
  Crop,
  FileImage,
  HardDrive,
  RefreshCw,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  ResizeConfig,
  ResizeMode,
  OutputFormat,
  PresetCategory,
  AspectRatioOption,
  FitMode,
  PaddingColor,
} from '../types';
import { RESIZE_PRESETS } from '../presets';

interface PhotoResizeControlsProps {
  config: ResizeConfig;
  onChange: (updated: Partial<ResizeConfig>) => void;
  referenceAspectRatio?: number; // width / height of first image if available
}

interface RatioPreset {
  id: AspectRatioOption;
  label: string;
  name: string;
  ratioNum: number | null; // width / height
}

const ASPECT_RATIO_PRESETS: RatioPreset[] = [
  { id: 'original', label: 'Original', name: 'Keep Native Ratio', ratioNum: null },
  { id: '1:1', label: '1:1', name: 'Square (Instagram, Avatar)', ratioNum: 1 / 1 },
  { id: '4:3', label: '4:3', name: 'Standard (Tablet, Photo)', ratioNum: 4 / 3 },
  { id: '3:2', label: '3:2', name: 'Classic (35mm DSLR, Print)', ratioNum: 3 / 2 },
  { id: '16:9', label: '16:9', name: 'Widescreen (YouTube, HD)', ratioNum: 16 / 9 },
  { id: '9:16', label: '9:16', name: 'Vertical (Story, Reel, TikTok)', ratioNum: 9 / 16 },
  { id: '4:5', label: '4:5', name: 'Social Portrait (IG Post)', ratioNum: 4 / 5 },
  { id: '2:3', label: '2:3', name: 'Tall Portrait (Poster, Wallpaper)', ratioNum: 2 / 3 },
  { id: '21:9', label: '21:9', name: 'Ultrawide (Cinema)', ratioNum: 21 / 9 },
  { id: 'custom', label: 'Custom', name: 'Custom Ratio', ratioNum: null },
];

export const PhotoResizeControls: React.FC<PhotoResizeControlsProps> = ({
  config,
  onChange,
  referenceAspectRatio = 1,
}) => {
  const [presetCategory, setPresetCategory] = useState<PresetCategory | 'all'>('all');

  const filteredPresets = RESIZE_PRESETS.filter(
    (p) => presetCategory === 'all' || p.category === presetCategory
  );

  // Helper to get active ratio decimal
  const getActiveRatioDecimal = (): number => {
    if (config.aspectRatio === 'custom') {
      const w = config.customRatioW || 1;
      const h = config.customRatioH || 1;
      return w / h;
    }
    const preset = ASPECT_RATIO_PRESETS.find((r) => r.id === config.aspectRatio);
    if (preset && preset.ratioNum !== null) {
      return preset.ratioNum;
    }
    return referenceAspectRatio > 0 ? referenceAspectRatio : 1;
  };

  const handleAspectRatioSelect = (ratioId: AspectRatioOption) => {
    if (ratioId === 'original') {
      onChange({
        aspectRatio: 'original',
        fit: 'inside',
      });
      return;
    }

    if (ratioId === 'custom') {
      const ratio = (config.customRatioW || 1) / (config.customRatioH || 1);
      const newHeight = Math.max(1, Math.round(config.width / ratio));
      onChange({
        aspectRatio: 'custom',
        height: newHeight,
      });
      return;
    }

    const preset = ASPECT_RATIO_PRESETS.find((r) => r.id === ratioId);
    if (preset && preset.ratioNum !== null) {
      const newHeight = Math.max(1, Math.round(config.width / preset.ratioNum));
      onChange({
        aspectRatio: ratioId,
        height: newHeight,
      });
    }
  };

  const handleCustomRatioChange = (w: number, h: number) => {
    const validW = Math.max(1, w);
    const validH = Math.max(1, h);
    const ratio = validW / validH;
    const newHeight = Math.max(1, Math.round(config.width / ratio));
    onChange({
      customRatioW: validW,
      customRatioH: validH,
      height: newHeight,
    });
  };

  const handleFlipOrientation = () => {
    // Invert width and height
    const currentW = config.width;
    const currentH = config.height;

    // Invert ratio if standard
    let flippedRatio = config.aspectRatio;
    if (config.aspectRatio === '16:9') flippedRatio = '9:16';
    else if (config.aspectRatio === '9:16') flippedRatio = '16:9';
    else if (config.aspectRatio === '4:3') flippedRatio = 'custom';
    else if (config.aspectRatio === '3:2') flippedRatio = '2:3';
    else if (config.aspectRatio === '2:3') flippedRatio = '3:2';
    else if (config.aspectRatio === 'custom') {
      onChange({
        customRatioW: config.customRatioH,
        customRatioH: config.customRatioW,
        width: currentH,
        height: currentW,
      });
      return;
    }

    onChange({
      aspectRatio: flippedRatio,
      width: currentH,
      height: currentW,
    });
  };

  const handleWidthChange = (val: number) => {
    const width = Math.max(1, val);
    if (config.maintainAspectRatio || config.aspectRatio !== 'original') {
      const ratio = getActiveRatioDecimal();
      const height = Math.max(1, Math.round(width / ratio));
      onChange({ width, height });
    } else {
      onChange({ width });
    }
  };

  const handleHeightChange = (val: number) => {
    const height = Math.max(1, val);
    if (config.maintainAspectRatio || config.aspectRatio !== 'original') {
      const ratio = getActiveRatioDecimal();
      const width = Math.max(1, Math.round(height * ratio));
      onChange({ width, height });
    } else {
      onChange({ height });
    }
  };

  const selectPreset = (presetId: string) => {
    const preset = RESIZE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange({
      selectedPresetId: presetId,
      width: preset.width,
      height: preset.height,
    });
  };

  const getQualityLabel = (q: number) => {
    if (q >= 90) return 'Maximum Quality (Lossless Feel)';
    if (q >= 75) return 'High Quality (Recommended)';
    if (q >= 50) return 'Balanced (Smaller File Size)';
    return 'Compact (Web Compression)';
  };

  return (
    <div className="space-y-6">
      {/* 1. RESIZE METHOD (Dimensions, Percentage, Presets) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1e1e2d]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
              Resize Method
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#7c3aed] dark:text-[#a78bfa] capitalize">
            {config.mode}
          </span>
        </div>

        {/* 3 Main Mode Selectors */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChange({ mode: 'dimensions' })}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
              config.mode === 'dimensions'
                ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-slate-900 dark:text-white ring-1 ring-[#7c3aed]'
                : 'bg-slate-50 dark:bg-[#161624] border-slate-200 dark:border-[#262638] text-slate-600 dark:text-neutral-400 hover:border-slate-300'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-xs font-semibold">Dimensions</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ mode: 'percentage' })}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
              config.mode === 'percentage'
                ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-slate-900 dark:text-white ring-1 ring-[#7c3aed]'
                : 'bg-slate-50 dark:bg-[#161624] border-slate-200 dark:border-[#262638] text-slate-600 dark:text-neutral-400 hover:border-slate-300'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span className="text-xs font-semibold">Percentage</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ mode: 'preset' })}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
              config.mode === 'preset'
                ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-slate-900 dark:text-white ring-1 ring-[#7c3aed]'
                : 'bg-slate-50 dark:bg-[#161624] border-slate-200 dark:border-[#262638] text-slate-600 dark:text-neutral-400 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-xs font-semibold">Presets</span>
          </button>
        </div>

        {/* Mode 1: Exact Dimensions Input */}
        {config.mode === 'dimensions' && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-mono text-slate-600 dark:text-neutral-400 mb-1">
                  Target Width (px)
                </label>
                <input
                  type="number"
                  min={1}
                  max={12000}
                  value={config.width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 dark:bg-[#161624] border border-slate-200 dark:border-[#262638] rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 dark:text-neutral-400 mb-1">
                  Target Height (px)
                </label>
                <input
                  type="number"
                  min={1}
                  max={12000}
                  value={config.height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 dark:bg-[#161624] border border-slate-200 dark:border-[#262638] rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            {/* Lock / Orientation Bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ maintainAspectRatio: !config.maintainAspectRatio })}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  config.maintainAspectRatio
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-[#161624] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-[#262638]'
                }`}
              >
                {config.maintainAspectRatio ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ratio Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Free Transform</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleFlipOrientation}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-[#262638] bg-slate-100 dark:bg-[#161624] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Swap width and height (Flip Landscape ↔ Portrait)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flip</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode 2: Percentage Scaling */}
        {config.mode === 'percentage' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 dark:text-neutral-400">Scale Factor</span>
              <span className="text-sm font-bold text-[#7c3aed] dark:text-[#a78bfa]">
                {config.percentage}%
              </span>
            </div>

            <input
              type="range"
              min={10}
              max={250}
              step={5}
              value={config.percentage}
              onChange={(e) => onChange({ percentage: Number(e.target.value) })}
              className="w-full accent-[#7c3aed] cursor-pointer"
            />

            {/* Quick Percentage Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[25, 50, 75, 100, 125, 150, 200].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onChange({ percentage: pct })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    config.percentage === pct
                      ? 'bg-[#7c3aed] text-white font-bold'
                      : 'bg-slate-100 dark:bg-[#161624] text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-[#202032]'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode 3: Presets Grid */}
        {config.mode === 'preset' && (
          <div className="space-y-3 pt-1">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {[
                { id: 'all', label: 'All Presets' },
                { id: 'social', label: 'Social Media' },
                { id: 'profile', label: 'Profiles' },
                { id: 'document', label: 'Documents' },
                { id: 'web', label: 'Web & Display' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPresetCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium ${
                    presetCategory === cat.id
                      ? 'bg-[#7c3aed] text-white'
                      : 'bg-slate-100 dark:bg-[#161624] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Preset Cards List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredPresets.map((preset) => {
                const isSelected = config.selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectPreset(preset.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-slate-900 dark:text-white ring-1 ring-[#7c3aed]'
                        : 'bg-slate-50 dark:bg-[#161624] border-slate-200 dark:border-[#262638] text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-[#383850]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{preset.name}</span>
                        <span className="text-[10px] font-mono px-1 rounded-sm bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-neutral-400">
                          {preset.ratio}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
                        {preset.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-[#7c3aed] dark:text-[#a78bfa]">
                        {preset.width} × {preset.height}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. ASPECT RATIO CHANGE & FIT CONTROLS */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1e1e2d]">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
              Aspect Ratio
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#7c3aed] dark:text-[#a78bfa] font-bold">
            {config.aspectRatio === 'custom'
              ? `${config.customRatioW}:${config.customRatioH}`
              : config.aspectRatio === 'original'
              ? 'Original Ratio'
              : config.aspectRatio}
          </span>
        </div>

        {/* Aspect Ratio Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ASPECT_RATIO_PRESETS.map((item) => {
            const isSelected = config.aspectRatio === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAspectRatioSelect(item.id)}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-sm font-bold'
                    : 'bg-slate-50 dark:bg-[#161624] border-slate-200 dark:border-[#262638] text-slate-700 dark:text-neutral-300 hover:border-[#7c3aed]/40'
                }`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span
                  className={`text-[9px] truncate max-w-full ${
                    isSelected ? 'text-white/80' : 'text-slate-500 dark:text-neutral-400'
                  }`}
                >
                  {item.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Aspect Ratio Inputs */}
        {config.aspectRatio === 'custom' && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161624] border border-slate-200 dark:border-[#262638] space-y-2">
            <label className="block text-[11px] font-mono text-slate-600 dark:text-neutral-400">
              Custom Ratio (Width : Height)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={config.customRatioW}
                onChange={(e) =>
                  handleCustomRatioChange(parseInt(e.target.value, 10) || 1, config.customRatioH)
                }
                className="w-20 bg-white dark:bg-[#1a1a2c] border border-slate-200 dark:border-[#262638] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#7c3aed]"
                placeholder="Width"
              />
              <span className="text-sm font-bold text-slate-400">:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={config.customRatioH}
                onChange={(e) =>
                  handleCustomRatioChange(config.customRatioW, parseInt(e.target.value, 10) || 1)
                }
                className="w-20 bg-white dark:bg-[#1a1a2c] border border-slate-200 dark:border-[#262638] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#7c3aed]"
                placeholder="Height"
              />
              <span className="text-xs font-mono text-slate-500">
                (
                {(
                  (config.customRatioW || 1) / (config.customRatioH || 1)
                ).toFixed(2)}
                : 1)
              </span>
            </div>
          </div>
        )}

        {/* Fit Mode Selector (Cover / Contain / Fill) */}
        {config.aspectRatio !== 'original' && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-[#1e1e2d]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-slate-600 dark:text-neutral-400">
                Fit &amp; Crop Behavior
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {config.fit === 'cover'
                  ? 'Center Crop (Fills entire ratio)'
                  : config.fit === 'contain'
                  ? 'Letterbox (No image cropped)'
                  : config.fit === 'fill'
                  ? 'Stretch to match'
                  : 'Scale Inside'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChange({ fit: 'cover' })}
                className={`py-2 px-2 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                  config.fit === 'cover'
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-[#161624] border-slate-200 dark:border-[#262638] text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                }`}
              >
                Crop to Fit (Cover)
              </button>

              <button
                type="button"
                onClick={() => onChange({ fit: 'contain' })}
                className={`py-2 px-2 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                  config.fit === 'contain'
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-[#161624] border-slate-200 dark:border-[#262638] text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                }`}
              >
                Letterbox (Contain)
              </button>

              <button
                type="button"
                onClick={() => onChange({ fit: 'fill' })}
                className={`py-2 px-2 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                  config.fit === 'fill'
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-[#161624] border-slate-200 dark:border-[#262638] text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                }`}
              >
                Stretch (Fill)
              </button>
            </div>

            {/* Letterbox Background Padding Selector */}
            {config.fit === 'contain' && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#161624] border border-slate-200 dark:border-[#262638] space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 block">
                  Letterbox Background Color
                </span>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'white', label: 'White', colorHex: '#ffffff' },
                    { id: 'black', label: 'Black', colorHex: '#000000' },
                    { id: 'transparent', label: 'Transparent (PNG/WEBP)', colorHex: 'transparent' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => onChange({ paddingColor: bg.id as PaddingColor })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                        config.paddingColor === bg.id
                          ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-slate-900 dark:text-white font-bold ring-1 ring-[#7c3aed]'
                          : 'border-slate-200 dark:border-[#262638] text-slate-600 dark:text-neutral-400 bg-white dark:bg-[#12121e]'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                        style={{ backgroundColor: bg.colorHex }}
                      />
                      <span>{bg.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. OUTPUT FORMAT & QUALITY */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1e1e2d]">
          <FileImage className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
            Output Format &amp; Quality
          </h3>
        </div>

        {/* Format Selectors */}
        <div>
          <label className="block text-[11px] font-mono text-slate-600 dark:text-neutral-400 mb-1.5">
            Image Format
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'original', label: 'Auto (Original)' },
              { id: 'jpg', label: 'JPG' },
              { id: 'png', label: 'PNG' },
              { id: 'webp', label: 'WEBP' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onChange({ outputFormat: fmt.id as OutputFormat })}
                className={`py-2 px-1 text-center rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                  config.outputFormat === fmt.id
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-slate-50 dark:bg-[#161624] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#262638] hover:border-[#7c3aed]/40'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quality Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 dark:text-neutral-400">Quality Compression</span>
            <span className="font-bold text-slate-900 dark:text-white">{config.quality}%</span>
          </div>

          <input
            type="range"
            min={15}
            max={100}
            step={5}
            value={config.quality}
            onChange={(e) => onChange({ quality: Number(e.target.value) })}
            className="w-full accent-[#7c3aed] cursor-pointer"
          />

          <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 flex items-center justify-between">
            <span>{getQualityLabel(config.quality)}</span>
          </div>
        </div>
      </div>

      {/* 4. OPTIONAL FILE-SIZE TARGET COMPRESSION */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Target File-Size Compression
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">
                Cap maximum file size for web, email, or government portals
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.enableTargetSize}
            onChange={(e) => onChange({ enableTargetSize: e.target.checked })}
            className="w-4 h-4 accent-[#7c3aed] cursor-pointer rounded"
          />
        </label>

        {config.enableTargetSize && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1e1e2d]">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={50000}
                value={config.targetSizeKb}
                onChange={(e) =>
                  onChange({
                    targetSizeKb: Math.max(10, parseInt(e.target.value, 10) || 10),
                  })
                }
                className="w-32 bg-slate-50 dark:bg-[#161624] border border-slate-200 dark:border-[#262638] rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#7c3aed]"
              />
              <span className="text-xs font-mono text-slate-600 dark:text-neutral-400">
                KB max per image
              </span>
            </div>

            {/* Quick target chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[50, 100, 200, 500, 1024, 2048].map((kb) => (
                <button
                  key={kb}
                  type="button"
                  onClick={() => onChange({ targetSizeKb: kb })}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                    config.targetSizeKb === kb
                      ? 'bg-[#7c3aed] text-white font-bold'
                      : 'bg-slate-100 dark:bg-[#161624] text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-[#202032]'
                  }`}
                >
                  {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
