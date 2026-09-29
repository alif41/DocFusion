import React from 'react';
import {
  Sliders,
  FileText,
  Palette,
  Sparkles,
  ShieldAlert,
  Globe,
  Layers,
  Settings2,
} from 'lucide-react';
import { HtmlToPdfConfig, MarginType, PageOrientation, PageSize, QualityLevel } from './types';
import { MARGIN_PRESETS } from './config';

interface PdfSettingsProps {
  config: HtmlToPdfConfig;
  onChange: (cfg: HtmlToPdfConfig) => void;
  disabled?: boolean;
}

export const PdfSettings: React.FC<PdfSettingsProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  const update = (patch: Partial<HtmlToPdfConfig>) => {
    onChange({ ...config, ...patch });
  };

  const handleMarginTypeChange = (type: MarginType) => {
    if (type === 'custom') {
      update({
        margins: {
          ...config.margins,
          type: 'custom',
        },
      });
    } else {
      const preset = MARGIN_PRESETS[type] || MARGIN_PRESETS.default;
      update({
        margins: {
          ...config.margins,
          type,
          top: preset.top,
          bottom: preset.bottom,
          left: preset.left,
          right: preset.right,
          unit: 'mm',
        },
      });
    }
  };

  return (
    <div className="bg-[#121220] border border-[#24243a] rounded-3xl p-5 sm:p-6 space-y-6">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#a78bfa]">
        <Settings2 className="w-3.5 h-3.5" />
        <span>PDF Page &amp; Layout Settings</span>
      </div>

      {/* 1. Page Size */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white uppercase tracking-wider block">
          Paper Size
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['A4', 'A3', 'A5', 'Letter', 'Legal', 'Custom'] as PageSize[]).map((size) => (
            <button
              key={size}
              type="button"
              disabled={disabled}
              onClick={() => update({ pageSize: size })}
              className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                config.pageSize === size
                  ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-md shadow-[#7c3aed]/20'
                  : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white hover:bg-[#1e1e34]'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {config.pageSize === 'Custom' && (
          <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-neutral-500 block mb-1">Width</span>
              <input
                type="number"
                value={config.customPageSize?.width || 210}
                onChange={(e) =>
                  update({
                    customPageSize: {
                      width: parseFloat(e.target.value) || 210,
                      height: config.customPageSize?.height || 297,
                      unit: config.customPageSize?.unit || 'mm',
                    },
                  })
                }
                disabled={disabled}
                className="w-full bg-[#18182a] border border-[#2b2b42] rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block mb-1">Height</span>
              <input
                type="number"
                value={config.customPageSize?.height || 297}
                onChange={(e) =>
                  update({
                    customPageSize: {
                      width: config.customPageSize?.width || 210,
                      height: parseFloat(e.target.value) || 297,
                      unit: config.customPageSize?.unit || 'mm',
                    },
                  })
                }
                disabled={disabled}
                className="w-full bg-[#18182a] border border-[#2b2b42] rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block mb-1">Unit</span>
              <select
                value={config.customPageSize?.unit || 'mm'}
                onChange={(e) =>
                  update({
                    customPageSize: {
                      width: config.customPageSize?.width || 210,
                      height: config.customPageSize?.height || 297,
                      unit: e.target.value as any,
                    },
                  })
                }
                disabled={disabled}
                className="w-full bg-[#18182a] border border-[#2b2b42] rounded-lg px-2 py-1.5 text-white"
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="inch">inch</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 2. Orientation */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white uppercase tracking-wider block">
          Orientation
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['portrait', 'landscape'] as PageOrientation[]).map((ori) => (
            <button
              key={ori}
              type="button"
              disabled={disabled}
              onClick={() => update({ orientation: ori })}
              className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                config.orientation === ori
                  ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-md shadow-[#7c3aed]/20'
                  : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
              }`}
            >
              {ori}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Margins */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white uppercase tracking-wider block">
          Margins
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['default', 'none', 'small', 'medium', 'large', 'custom'] as MarginType[]).map((m) => (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => handleMarginTypeChange(m)}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                config.margins.type === m
                  ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                  : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {config.margins.type === 'custom' && (
          <div className="grid grid-cols-4 gap-1.5 pt-2 text-xs font-mono">
            {['top', 'bottom', 'left', 'right'].map((side) => (
              <div key={side}>
                <span className="text-[10px] text-neutral-500 block mb-1 capitalize">{side}</span>
                <input
                  type="number"
                  value={(config.margins as any)[side]}
                  onChange={(e) =>
                    update({
                      margins: {
                        ...config.margins,
                        [side]: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  disabled={disabled}
                  className="w-full bg-[#18182a] border border-[#2b2b42] rounded-lg px-2 py-1 text-white"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Rendering & Quality */}
      <div className="space-y-3 pt-2 border-t border-[#222234]">
        <label className="text-xs font-bold text-white uppercase tracking-wider block">
          Render Quality
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['standard', 'high', 'maximum'] as QualityLevel[]).map((q) => (
            <button
              key={q}
              type="button"
              disabled={disabled}
              onClick={() => update({ quality: q })}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                config.quality === q
                  ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                  : 'bg-[#18182a] text-neutral-400 border-[#2a2a40] hover:text-white'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Toggles: Print Backgrounds, Links, JS Sandbox, External Assets */}
      <div className="space-y-2.5 pt-2 border-t border-[#222234]">
        {/* Print Backgrounds */}
        <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
          <div className="space-y-0.5">
            <span className="font-semibold text-white">Print Backgrounds &amp; Colors</span>
            <p className="text-[11px] text-neutral-500">Render CSS background graphics &amp; colors</p>
          </div>
          <input
            type="checkbox"
            checked={config.printBackground}
            onChange={(e) => update({ printBackground: e.target.checked })}
            disabled={disabled}
            className="w-4 h-4 accent-[#7c3aed] rounded cursor-pointer"
          />
        </label>

        {/* Enable Clickable Links */}
        <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
          <div className="space-y-0.5">
            <span className="font-semibold text-white">Preserve Clickable Hyperlinks</span>
            <p className="text-[11px] text-neutral-500">Keep standard &lt;a href&gt; web links active in PDF</p>
          </div>
          <input
            type="checkbox"
            checked={config.enableLinks}
            onChange={(e) => update({ enableLinks: e.target.checked })}
            disabled={disabled}
            className="w-4 h-4 accent-[#7c3aed] rounded cursor-pointer"
          />
        </label>

        {/* Execute JavaScript */}
        <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
          <div className="space-y-0.5">
            <span className="font-semibold text-white">Execute JavaScript (Sandboxed)</span>
            <p className="text-[11px] text-neutral-500">Allows dynamic DOM scripts (Default: OFF)</p>
          </div>
          <input
            type="checkbox"
            checked={config.executeJavaScript}
            onChange={(e) => update({ executeJavaScript: e.target.checked })}
            disabled={disabled}
            className="w-4 h-4 accent-[#7c3aed] rounded cursor-pointer"
          />
        </label>

        {/* External Resources */}
        <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
          <div className="space-y-0.5">
            <span className="font-semibold text-white">Allow Safe Remote Resources</span>
            <p className="text-[11px] text-neutral-500">Loads remote web fonts &amp; CDN stylesheets</p>
          </div>
          <input
            type="checkbox"
            checked={config.allowExternalResources}
            onChange={(e) => update({ allowExternalResources: e.target.checked })}
            disabled={disabled}
            className="w-4 h-4 accent-[#7c3aed] rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
