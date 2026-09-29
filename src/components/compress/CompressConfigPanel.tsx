import React, { useState } from 'react';
import {
  Shrink,
  Zap,
  ShieldCheck,
  Check,
  Sliders,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CompressionPreset } from '../../types/pdf';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils';

interface CompressConfigPanelProps {
  originalSize: number;
  preset: CompressionPreset;
  onPresetChange: (preset: CompressionPreset) => void;
  dpi: number;
  onDpiChange: (dpi: number) => void;
  quality: number;
  onQualityChange: (quality: number) => void;
  removeMetadata: boolean;
  onRemoveMetadataChange: (val: boolean) => void;
  onExecuteCompress: () => void;
  isProcessing: boolean;
}

export const CompressConfigPanel: React.FC<CompressConfigPanelProps> = ({
  originalSize,
  preset,
  onPresetChange,
  dpi,
  onDpiChange,
  quality,
  onQualityChange,
  removeMetadata,
  onRemoveMetadataChange,
  onExecuteCompress,
  isProcessing,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(preset === 'custom');

  // Calculate estimated size for preview
  const getEstimatedSavings = () => {
    switch (preset) {
      case 'extreme':
        return 0.75;
      case 'recommended':
        return 0.52;
      case 'less':
        return 0.28;
      case 'structural':
        return 0.15;
      case 'custom':
        return Math.max(0.1, Math.min(0.85, 1 - (quality * (dpi / 150))));
      default:
        return 0.5;
    }
  };

  const estimatedFactor = getEstimatedSavings();
  const estimatedNewSize = Math.max(1024, Math.round(originalSize * (1 - estimatedFactor)));
  const estimatedSavingsPercent = Math.round(estimatedFactor * 100);

  return (
    <div className="rounded-3xl border border-[#222238] bg-[#0c0c14] p-5 sm:p-7 space-y-6 shadow-2xl">
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block">
          Choose Compression Level
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Recommended */}
          <button
            type="button"
            onClick={() => onPresetChange('recommended')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              preset === 'recommended'
                ? 'border-[#7c3aed] bg-[#7c3aed]/15 shadow-lg shadow-[#7c3aed]/20 ring-1 ring-[#7c3aed]'
                : 'border-[#202030] bg-[#12121d] hover:border-[#2f2f45] hover:bg-[#161624]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  Best Balance
                </span>
                {preset === 'recommended' && (
                  <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
                )}
              </div>
              <h4 className="text-sm font-bold text-white">Recommended</h4>
              <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                Ideal balance of sharp visual quality and high file size reduction (~50%).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/[0.06] text-[11px] font-mono text-[#a78bfa]">
              Target: ~50% savings
            </div>
          </button>

          {/* Extreme */}
          <button
            type="button"
            onClick={() => onPresetChange('extreme')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              preset === 'extreme'
                ? 'border-[#7c3aed] bg-[#7c3aed]/15 shadow-lg shadow-[#7c3aed]/20 ring-1 ring-[#7c3aed]'
                : 'border-[#202030] bg-[#12121d] hover:border-[#2f2f45] hover:bg-[#161624]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/25">
                  Maximum
                </span>
                {preset === 'extreme' && (
                  <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
                )}
              </div>
              <h4 className="text-sm font-bold text-white">Extreme Reduction</h4>
              <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                Smallest file size. Perfect for strict 5MB email attachment limits (~75%).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/[0.06] text-[11px] font-mono text-[#a78bfa]">
              Target: ~75% savings
            </div>
          </button>

          {/* Less / High Quality */}
          <button
            type="button"
            onClick={() => onPresetChange('less')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              preset === 'less'
                ? 'border-[#7c3aed] bg-[#7c3aed]/15 shadow-lg shadow-[#7c3aed]/20 ring-1 ring-[#7c3aed]'
                : 'border-[#202030] bg-[#12121d] hover:border-[#2f2f45] hover:bg-[#161624]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/25">
                  High Fidelity
                </span>
                {preset === 'less' && (
                  <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
                )}
              </div>
              <h4 className="text-sm font-bold text-white">Mild Compression</h4>
              <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                High resolution preservation for client presentations and print docs (~25%).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/[0.06] text-[11px] font-mono text-[#a78bfa]">
              Target: ~25% savings
            </div>
          </button>

          {/* Structural Vector Only */}
          <button
            type="button"
            onClick={() => onPresetChange('structural')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              preset === 'structural'
                ? 'border-[#7c3aed] bg-[#7c3aed]/15 shadow-lg shadow-[#7c3aed]/20 ring-1 ring-[#7c3aed]'
                : 'border-[#202030] bg-[#12121d] hover:border-[#2f2f45] hover:bg-[#161624]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25">
                  Vector Only
                </span>
                {preset === 'structural' && (
                  <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
                )}
              </div>
              <h4 className="text-sm font-bold text-white">Structural Optimizer</h4>
              <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                100% vector retention with zero rasterization. Strips metadata & compresses streams.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/[0.06] text-[11px] font-mono text-[#a78bfa]">
              No image alteration
            </div>
          </button>
        </div>
      </div>

      {/* Advanced Custom Mode Toggle */}
      <div className="pt-2 border-t border-[#1a1a28]">
        <button
          type="button"
          onClick={() => {
            setShowAdvanced(!showAdvanced);
            if (!showAdvanced) onPresetChange('custom');
          }}
          className="flex items-center justify-between w-full text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer py-1"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>Custom Parameters (DPI & Quality Sliders)</span>
            {preset === 'custom' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7c3aed]/20 text-[#c084fc] border border-[#7c3aed]/30">
                Active
              </span>
            )}
          </span>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 rounded-2xl bg-[#12121d] border border-[#202030] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target DPI */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-300">Rendering Resolution:</span>
                  <span className="text-[#a78bfa] font-bold">{dpi} DPI</span>
                </div>
                <input
                  type="range"
                  min={72}
                  max={300}
                  step={10}
                  value={dpi}
                  onChange={(e) => {
                    onPresetChange('custom');
                    onDpiChange(parseInt(e.target.value, 10));
                  }}
                  className="w-full accent-[#7c3aed] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>72 (Screen)</span>
                  <span>150 (Web Standard)</span>
                  <span>300 (Print)</span>
                </div>
              </div>

              {/* JPEG Quality */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-300">Encoding Quality:</span>
                  <span className="text-[#a78bfa] font-bold">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={95}
                  step={5}
                  value={Math.round(quality * 100)}
                  onChange={(e) => {
                    onPresetChange('custom');
                    onQualityChange(parseInt(e.target.value, 10) / 100);
                  }}
                  className="w-full accent-[#7c3aed] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>20% (Compact)</span>
                  <span>65% (Balanced)</span>
                  <span>95% (Near-Lossless)</span>
                </div>
              </div>
            </div>

            {/* Strip metadata */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1a1a28]">
              <span className="text-xs text-neutral-300">
                Strip XML metadata, document tags, and unreferenced objects
              </span>
              <input
                type="checkbox"
                checked={removeMetadata}
                onChange={(e) => onRemoveMetadataChange(e.target.checked)}
                className="w-4 h-4 accent-[#7c3aed] rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Execution Footer Bar */}
      <div className="pt-3 border-t border-[#1a1a28] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-xs font-mono">
          <div className="text-neutral-400">
            Estimated Target Size:{' '}
            <span className="text-emerald-400 font-bold">
              ~{formatFileSize(estimatedNewSize)}
            </span>{' '}
            <span className="text-neutral-500">
              (approx. -{estimatedSavingsPercent}%)
            </span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Actual savings depend on document composition (images vs vector text)
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onExecuteCompress}
          isLoading={isProcessing}
          disabled={isProcessing}
          leftIcon={<Shrink className="w-5 h-5 text-white" />}
          className="w-full sm:w-auto shadow-xl shadow-[#7c3aed]/25 px-8 font-semibold"
        >
          {isProcessing ? 'Compressing PDF...' : 'Compress PDF'}
        </Button>
      </div>
    </div>
  );
};
