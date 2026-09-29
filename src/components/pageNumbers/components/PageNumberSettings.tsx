import React from 'react';
import {
  Sliders,
  Type,
  Hash,
  Palette,
  FileCheck,
  Layout,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  PageNumberOptions,
  PageNumberFormat,
  PageNumberFont,
  PageNumberPosition,
} from '../types';
import { PageNumberPositionGrid } from './PageNumberPositionGrid';

interface PageNumberSettingsProps {
  options: PageNumberOptions;
  totalPages: number;
  onChange: (updated: Partial<PageNumberOptions>) => void;
}

export const PageNumberSettings: React.FC<PageNumberSettingsProps> = ({
  options,
  totalPages,
  onChange,
}) => {
  const formatPresets: { id: PageNumberFormat; label: string; sample: string }[] = [
    { id: 'page-n-of-total', label: 'Page 1 of n', sample: `Page 1 of ${totalPages || 10}` },
    { id: 'number', label: '1, 2, 3', sample: '1' },
    { id: 'n-of-total', label: '1 / n', sample: `1 / ${totalPages || 10}` },
    { id: 'dash-n-dash', label: '- 1 -', sample: '- 1 -' },
    { id: 'page-n', label: 'Page 1', sample: 'Page 1' },
    { id: 'bracket-n', label: '[ 1 ]', sample: '[ 1 ]' },
    { id: 'roman-lower', label: 'i, ii, iii', sample: 'i' },
    { id: 'roman-upper', label: 'I, II, III', sample: 'I' },
    { id: 'custom', label: 'Custom', sample: '{n} / {total}' },
  ];

  const colorPresets = [
    { hex: '#111827', name: 'Charcoal Black' },
    { hex: '#475569', name: 'Slate Gray' },
    { hex: '#7c3aed', name: 'DocFusion Purple' },
    { hex: '#2563eb', name: 'Royal Blue' },
    { hex: '#059669', name: 'Emerald' },
    { hex: '#dc2626', name: 'Crimson' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. POSITION SELECTION */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1e1e2d]">
          <Layout className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
            Placement &amp; Position
          </h3>
        </div>

        <PageNumberPositionGrid
          value={options.position}
          onChange={(pos: PageNumberPosition) => onChange({ position: pos })}
        />

        {/* Margins */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono text-slate-600 dark:text-neutral-400">
                Side Margin
              </label>
              <span className="text-[10px] font-mono text-slate-500">{options.marginHorizontal}pt</span>
            </div>
            <input
              type="range"
              min={12}
              max={96}
              step={4}
              value={options.marginHorizontal}
              onChange={(e) => onChange({ marginHorizontal: Number(e.target.value) })}
              className="w-full accent-[#7c3aed] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono text-slate-600 dark:text-neutral-400">
                Edge Margin
              </label>
              <span className="text-[10px] font-mono text-slate-500">{options.marginVertical}pt</span>
            </div>
            <input
              type="range"
              min={12}
              max={96}
              step={4}
              value={options.marginVertical}
              onChange={(e) => onChange({ marginVertical: Number(e.target.value) })}
              className="w-full accent-[#7c3aed] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. NUMBER FORMAT */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1e1e2d]">
          <Hash className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
            Number Format
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {formatPresets.map((preset) => {
            const isSelected = options.format === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange({ format: preset.id })}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-slate-900 dark:text-white ring-1 ring-[#7c3aed]'
                    : 'bg-slate-50 dark:bg-[#161624] border-slate-200 dark:border-[#262638] text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-[#383850]'
                }`}
              >
                <span className="block text-[10px] font-mono text-slate-500 dark:text-neutral-400 uppercase truncate">
                  {preset.label}
                </span>
                <span className="block text-xs font-semibold mt-0.5 truncate font-mono">
                  {preset.sample}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Format Input if 'custom' is active */}
        {options.format === 'custom' && (
          <div className="pt-2">
            <label className="block text-[11px] font-mono text-slate-600 dark:text-neutral-400 mb-1">
              Custom Template (<code className="text-[#7c3aed] dark:text-[#a78bfa]">{'{n}'}</code> = page, <code className="text-[#7c3aed] dark:text-[#a78bfa]">{'{total}'}</code> = total)
            </label>
            <input
              type="text"
              value={options.customFormat}
              onChange={(e) => onChange({ customFormat: e.target.value })}
              placeholder="e.g. DocFusion — Page {n} of {total}"
              className="w-full bg-slate-50 dark:bg-[#181826] border border-slate-200 dark:border-[#2b2b40] rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#7c3aed]"
            />
          </div>
        )}
      </div>

      {/* 3. RANGE & COVER RULES */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1e1e2d]">
          <FileCheck className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
            Page Range &amp; Skip Rules
          </h3>
        </div>

        {/* Quick Toggles */}
        <div className="space-y-2.5">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#161624] border border-slate-200 dark:border-[#262638] cursor-pointer hover:border-slate-300 dark:hover:border-[#383850]">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Skip First Page
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">
                Ideal for documents with a title or cover page
              </span>
            </div>
            <input
              type="checkbox"
              checked={options.skipFirstPage}
              onChange={(e) => onChange({ skipFirstPage: e.target.checked })}
              className="w-4 h-4 accent-[#7c3aed] cursor-pointer rounded"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#161624] border border-slate-200 dark:border-[#262638] cursor-pointer hover:border-slate-300 dark:hover:border-[#383850]">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Skip Last Page
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">
                Omit number from final index or back cover
              </span>
            </div>
            <input
              type="checkbox"
              checked={options.skipLastPage}
              onChange={(e) => onChange({ skipLastPage: e.target.checked })}
              className="w-4 h-4 accent-[#7c3aed] cursor-pointer rounded"
            />
          </label>
        </div>

        {/* Start page and starting integer number */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-mono text-slate-600 dark:text-neutral-400 mb-1">
              Start on Sheet
            </label>
            <input
              type="number"
              min={1}
              max={totalPages || 999}
              value={options.startFromPage}
              onChange={(e) => onChange({ startFromPage: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-full bg-slate-50 dark:bg-[#161624] border border-slate-200 dark:border-[#262638] rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-600 dark:text-neutral-400 mb-1">
              First Number Value
            </label>
            <input
              type="number"
              min={1}
              value={options.startingNumber}
              onChange={(e) => onChange({ startingNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-full bg-slate-50 dark:bg-[#161624] border border-slate-200 dark:border-[#262638] rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#7c3aed]"
            />
          </div>
        </div>
      </div>

      {/* 4. TYPOGRAPHY & STYLING */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#222234] shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1e1e2d]">
          <Type className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
            Typography &amp; Style
          </h3>
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-[11px] font-mono text-slate-600 dark:text-neutral-400 mb-1.5">
            Font Family
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'Helvetica', label: 'Helvetica' },
              { id: 'Helvetica-Bold', label: 'Helvetica Bold' },
              { id: 'Times-Roman', label: 'Times Roman' },
              { id: 'Courier', label: 'Courier Mono' },
            ].map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => onChange({ fontFamily: font.id as PageNumberFont })}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  options.fontFamily === font.id
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-xs font-semibold'
                    : 'bg-slate-50 dark:bg-[#161624] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#262638] hover:border-[#7c3aed]/40'
                }`}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size & Opacity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono text-slate-600 dark:text-neutral-400">
                Font Size
              </label>
              <span className="text-[10px] font-mono text-slate-500">{options.fontSize}pt</span>
            </div>
            <input
              type="range"
              min={8}
              max={22}
              step={1}
              value={options.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              className="w-full accent-[#7c3aed] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono text-slate-600 dark:text-neutral-400">
                Opacity
              </label>
              <span className="text-[10px] font-mono text-slate-500">{Math.round(options.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.05}
              value={options.opacity}
              onChange={(e) => onChange({ opacity: Number(e.target.value) })}
              className="w-full accent-[#7c3aed] cursor-pointer"
            />
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-[11px] font-mono text-slate-600 dark:text-neutral-400 mb-1.5">
            Text Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {colorPresets.map((color) => {
              const isSelected = options.textColor.toLowerCase() === color.hex.toLowerCase();
              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => onChange({ textColor: color.hex })}
                  title={color.name}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    isSelected ? 'border-[#7c3aed] scale-110 shadow-xs' : 'border-slate-300 dark:border-white/20'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              );
            })}
            <div className="relative flex items-center">
              <input
                type="color"
                value={options.textColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="w-7 h-7 rounded-full cursor-pointer opacity-0 absolute inset-0"
              />
              <div
                className="w-7 h-7 rounded-full border border-slate-300 dark:border-white/20 flex items-center justify-center bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-500"
                title="Custom Hex Color"
              />
            </div>
          </div>
        </div>

        {/* Readability Badge */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#1e1e2d] space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Background Readability Badge
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">
                Puts a subtle pill behind numbers so they stand out over dense images
              </span>
            </div>
            <input
              type="checkbox"
              checked={options.showBackgroundBadge}
              onChange={(e) => onChange({ showBackgroundBadge: e.target.checked })}
              className="w-4 h-4 accent-[#7c3aed] cursor-pointer rounded"
            />
          </label>

          {options.showBackgroundBadge && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'white', label: 'White' },
                { id: 'dark', label: 'Dark' },
                { id: 'glass', label: 'Glass' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onChange({ badgeStyle: b.id as any })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                    options.badgeStyle === b.id
                      ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                      : 'bg-slate-50 dark:bg-[#161624] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#262638]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
