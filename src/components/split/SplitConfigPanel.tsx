import React, { useState } from 'react';
import {
  Scissors,
  CheckSquare,
  Layers,
  Sparkles,
  HelpCircle,
  FileCheck,
  Check,
  RotateCcw,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { SplitMode } from '../../types/pdf';
import { Button } from '../common/Button';

interface SplitConfigPanelProps {
  totalPageCount: number;
  mode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  selectedPages: number[];
  onSelectPages: (pages: number[]) => void;
  mergeExtracted: boolean;
  onMergeExtractedChange: (val: boolean) => void;
  rangeInput: string;
  onRangeInputChange: (str: string) => void;
  splitInterval: number;
  onSplitIntervalChange: (val: number) => void;
  customRangesText: string;
  onCustomRangesTextChange: (text: string) => void;
  rangeType: 'interval' | 'custom';
  onRangeTypeChange: (type: 'interval' | 'custom') => void;
  onExecuteSplit: () => void;
  isProcessing: boolean;
}

export const SplitConfigPanel: React.FC<SplitConfigPanelProps> = ({
  totalPageCount,
  mode,
  onModeChange,
  selectedPages,
  onSelectPages,
  mergeExtracted,
  onMergeExtractedChange,
  rangeInput,
  onRangeInputChange,
  splitInterval,
  onSplitIntervalChange,
  customRangesText,
  onCustomRangesTextChange,
  rangeType,
  onRangeTypeChange,
  onExecuteSplit,
  isProcessing,
}) => {
  // Quick selection helpers for extract mode
  const handleSelectAll = () => {
    const all = Array.from({ length: totalPageCount }, (_, i) => i + 1);
    onSelectPages(all);
  };

  const handleDeselectAll = () => {
    onSelectPages([]);
  };

  const handleSelectOdd = () => {
    const odd = Array.from({ length: totalPageCount }, (_, i) => i + 1).filter(
      (p) => p % 2 !== 0
    );
    onSelectPages(odd);
  };

  const handleSelectEven = () => {
    const even = Array.from({ length: totalPageCount }, (_, i) => i + 1).filter(
      (p) => p % 2 === 0
    );
    onSelectPages(even);
  };

  const handleInvert = () => {
    const inverted = Array.from({ length: totalPageCount }, (_, i) => i + 1).filter(
      (p) => !selectedPages.includes(p)
    );
    onSelectPages(inverted);
  };

  // Calculate estimated output count
  const getEstimatedOutputCount = () => {
    if (mode === 'burst') return totalPageCount;
    if (mode === 'extract') {
      return mergeExtracted ? 1 : selectedPages.length;
    }
    if (mode === 'range') {
      if (rangeType === 'interval') {
        return Math.ceil(totalPageCount / (splitInterval || 1));
      }
      return customRangesText
        .split(/[,;\n]+/)
        .filter((s) => s.trim().length > 0).length || 1;
    }
    return 1;
  };

  const estimatedFiles = getEstimatedOutputCount();

  return (
    <div className="rounded-3xl border border-[#222238] bg-[#0c0c14] p-5 sm:p-7 space-y-6 shadow-2xl">
      {/* Mode Navigation Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block">
          Select Splitting Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onModeChange('extract')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              mode === 'extract'
                ? 'border-[#7c3aed] bg-[#7c3aed]/15 shadow-lg shadow-[#7c3aed]/20'
                : 'border-[#202030] bg-[#12121d] hover:border-[#2f2f45] hover:bg-[#161624]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`p-2 rounded-xl ${mode === 'extract' ? 'bg-[#7c3aed] text-white' : 'bg-[#1a1a28] text-neutral-400'}`}>
                <CheckSquare className="w-4 h-4" />
              </span>
              {mode === 'extract' && (
                <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Extract Pages</h4>
              <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                Pick specific pages or ranges to save
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onModeChange('burst')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              mode === 'burst'
                ? 'border-[#7c3aed] bg-[#7c3aed]/15 shadow-lg shadow-[#7c3aed]/20'
                : 'border-[#202030] bg-[#12121d] hover:border-[#2f2f45] hover:bg-[#161624]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`p-2 rounded-xl ${mode === 'burst' ? 'bg-[#7c3aed] text-white' : 'bg-[#1a1a28] text-neutral-400'}`}>
                <Scissors className="w-4 h-4" />
              </span>
              {mode === 'burst' && (
                <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Split Every Page</h4>
              <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                Decompose into {totalPageCount} individual PDFs
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onModeChange('range')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              mode === 'range'
                ? 'border-[#7c3aed] bg-[#7c3aed]/15 shadow-lg shadow-[#7c3aed]/20'
                : 'border-[#202030] bg-[#12121d] hover:border-[#2f2f45] hover:bg-[#161624]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`p-2 rounded-xl ${mode === 'range' ? 'bg-[#7c3aed] text-white' : 'bg-[#1a1a28] text-neutral-400'}`}>
                <Layers className="w-4 h-4" />
              </span>
              {mode === 'range' && (
                <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Split by Range</h4>
              <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                Group pages by custom intervals or ranges
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Mode-Specific Settings */}
      {mode === 'extract' && (
        <div className="space-y-4 pt-2 border-t border-[#1a1a28]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 block mb-1">
                Pages to Extract
              </label>
              <p className="text-[11px] text-neutral-400">
                Type page numbers or click on the cards below to select
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded-lg bg-[#181826] border border-[#2b2b3f] text-neutral-300 hover:text-white hover:border-[#7c3aed] transition-colors cursor-pointer"
              >
                All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1 rounded-lg bg-[#181826] border border-[#2b2b3f] text-neutral-300 hover:text-white hover:border-[#7c3aed] transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSelectOdd}
                className="px-2.5 py-1 rounded-lg bg-[#181826] border border-[#2b2b3f] text-neutral-300 hover:text-white hover:border-[#7c3aed] transition-colors cursor-pointer"
              >
                Odd
              </button>
              <button
                type="button"
                onClick={handleSelectEven}
                className="px-2.5 py-1 rounded-lg bg-[#181826] border border-[#2b2b3f] text-neutral-300 hover:text-white hover:border-[#7c3aed] transition-colors cursor-pointer"
              >
                Even
              </button>
              <button
                type="button"
                onClick={handleInvert}
                className="px-2.5 py-1 rounded-lg bg-[#181826] border border-[#2b2b3f] text-neutral-300 hover:text-white hover:border-[#7c3aed] transition-colors cursor-pointer"
              >
                Invert
              </button>
            </div>
          </div>

          {/* Interactive Range Input Field */}
          <div className="relative">
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => onRangeInputChange(e.target.value)}
              placeholder="e.g. 1-3, 5, 8-10"
              className="w-full bg-[#12121d] border border-[#26263a] focus:border-[#7c3aed] rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400">
              {selectedPages.length} of {totalPageCount} selected
            </span>
          </div>

          {/* Merge vs Separate Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#12121d] border border-[#232336]">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white block">
                Merge extracted pages into 1 single PDF
              </span>
              <p className="text-[11px] text-neutral-400">
                When checked, all selected pages become one unified document instead of individual files
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
              <input
                type="checkbox"
                checked={mergeExtracted}
                onChange={(e) => onMergeExtractedChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#202030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7c3aed]" />
            </label>
          </div>
        </div>
      )}

      {mode === 'burst' && (
        <div className="p-4 rounded-2xl bg-[#12121d] border border-[#202030] space-y-2 text-xs text-neutral-300">
          <div className="flex items-center gap-2 text-[#a78bfa] font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Automatic Document Decomposition</span>
          </div>
          <p className="leading-relaxed text-neutral-400">
            Every page in your {totalPageCount}-page document will be extracted into an individual, single-page PDF. All {totalPageCount} files will be packaged into a compressed ZIP file with instant one-click download.
          </p>
        </div>
      )}

      {mode === 'range' && (
        <div className="space-y-4 pt-2 border-t border-[#1a1a28]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRangeTypeChange('interval')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                rangeType === 'interval'
                  ? 'bg-[#7c3aed] text-white font-semibold'
                  : 'bg-[#161624] text-neutral-400 hover:text-white'
              }`}
            >
              Fixed Page Interval
            </button>
            <button
              type="button"
              onClick={() => onRangeTypeChange('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                rangeType === 'custom'
                  ? 'bg-[#7c3aed] text-white font-semibold'
                  : 'bg-[#161624] text-neutral-400 hover:text-white'
              }`}
            >
              Custom Defined Ranges
            </button>
          </div>

          {rangeType === 'interval' ? (
            <div className="space-y-2">
              <label className="text-xs font-mono text-neutral-300 block">
                Split every N pages:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={totalPageCount}
                  value={splitInterval}
                  onChange={(e) =>
                    onSplitIntervalChange(Math.max(1, Math.min(totalPageCount, parseInt(e.target.value) || 1)))
                  }
                  className="w-28 bg-[#12121d] border border-[#26263a] rounded-xl px-3 py-2 text-sm font-mono text-white text-center focus:outline-none focus:border-[#7c3aed]"
                />
                <span className="text-xs text-neutral-400 font-mono">
                  Generates {Math.ceil(totalPageCount / (splitInterval || 1))} document parts
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-mono text-neutral-300 block">
                Specify comma-separated ranges (e.g. 1-2, 3-5, 6-10):
              </label>
              <input
                type="text"
                value={customRangesText}
                onChange={(e) => onCustomRangesTextChange(e.target.value)}
                placeholder="1-2, 3-5, 6-10"
                className="w-full bg-[#12121d] border border-[#26263a] focus:border-[#7c3aed] rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Execution Footer Bar */}
      <div className="pt-3 border-t border-[#1a1a28] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono text-neutral-400">
          <span>Output: </span>
          <span className="text-white font-bold">
            {estimatedFiles} {estimatedFiles === 1 ? 'PDF Document' : 'PDFs in ZIP Archive'}
          </span>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onExecuteSplit}
          isLoading={isProcessing}
          disabled={isProcessing || (mode === 'extract' && selectedPages.length === 0)}
          leftIcon={<Scissors className="w-5 h-5 text-white" />}
          className="w-full sm:w-auto shadow-xl shadow-[#7c3aed]/25 px-8 font-semibold"
        >
          {isProcessing ? 'Processing Split...' : 'Split PDF'}
        </Button>
      </div>
    </div>
  );
};
