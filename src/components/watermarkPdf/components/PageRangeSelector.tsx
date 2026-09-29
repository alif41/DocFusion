import React from 'react';
import { Files, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageSelectionConfig, PageSelectionType } from '../types';
import { countWatermarkedPages } from '../services/watermarkEngine';

interface PageRangeSelectorProps {
  pageSelection: PageSelectionConfig;
  currentPage: number;
  totalPages: number;
  onChange: (selection: PageSelectionConfig) => void;
}

export const PageRangeSelector: React.FC<PageRangeSelectorProps> = ({
  pageSelection,
  currentPage,
  totalPages,
  onChange,
}) => {
  const selectedCount = countWatermarkedPages(pageSelection, currentPage, totalPages);

  const handleTypeChange = (type: PageSelectionType) => {
    onChange({
      ...pageSelection,
      type,
    });
  };

  const handleCustomRangeChange = (value: string) => {
    onChange({
      ...pageSelection,
      customRange: value,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
          <Files className="w-3.5 h-3.5 text-neutral-400" />
          <span>Page Application</span>
        </div>
        <span className="font-mono text-[#a78bfa] text-[11px] font-semibold">
          {selectedCount} of {totalPages} {totalPages === 1 ? 'page' : 'pages'}
        </span>
      </div>

      {/* 3 Radio Options */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#121220] p-1.5 rounded-2xl border border-[#222234]">
        <button
          type="button"
          onClick={() => handleTypeChange('all')}
          className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            pageSelection.type === 'all'
              ? 'bg-[#7c3aed] text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          All Pages
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('current')}
          className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            pageSelection.type === 'current'
              ? 'bg-[#7c3aed] text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Page {currentPage} Only
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('custom')}
          className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            pageSelection.type === 'custom'
              ? 'bg-[#7c3aed] text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Custom Range
        </button>
      </div>

      {/* Custom Range Text Input */}
      {pageSelection.type === 'custom' && (
        <div className="space-y-1.5 pt-1 animate-fadeIn">
          <input
            type="text"
            value={pageSelection.customRange}
            onChange={(e) => handleCustomRangeChange(e.target.value)}
            placeholder="e.g. 1, 3, 5-8, 12"
            className="w-full bg-[#121220] border border-[#222234] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c3aed] font-mono transition-colors"
          />
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Comma-separated numbers &amp; ranges</span>
            {selectedCount > 0 ? (
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" />
                {selectedCount} pages target
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3 h-3" />
                No pages matched
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
