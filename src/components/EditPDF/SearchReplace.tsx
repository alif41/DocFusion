import React, { useState, useEffect } from 'react';
import {
  Search,
  Replace,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SearchMatch } from './types';

interface SearchReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  replaceQuery: string;
  onReplaceQueryChange: (q: string) => void;
  matches: SearchMatch[];
  currentMatchIndex: number;
  onNavigateMatch: (direction: 'next' | 'prev') => void;
  onReplaceCurrent: () => void;
  onReplaceAll: () => void;
}

export const SearchReplace: React.FC<SearchReplaceProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchQueryChange,
  replaceQuery,
  onReplaceQueryChange,
  matches,
  currentMatchIndex,
  onNavigateMatch,
  onReplaceCurrent,
  onReplaceAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-6 z-40 w-80 sm:w-96 rounded-2xl bg-[#141424] border border-[#2d2d48] shadow-2xl p-4 text-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#222238] pb-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#a78bfa]" />
          <span className="font-bold text-white text-sm">Find & Replace</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1f1f33] cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Find Input */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-neutral-300">Search text</label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="e.g. Dhaka, Invoice, Agreement..."
            className="w-full bg-[#0c0c16] border border-[#2d2d44] focus:border-[#7c3aed] text-white rounded-xl px-3 py-1.5 text-xs outline-none pr-20"
            autoFocus
          />
          <div className="absolute right-2 flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
            {matches.length > 0 ? (
              <span>
                {currentMatchIndex + 1}/{matches.length}
              </span>
            ) : searchQuery ? (
              <span className="text-neutral-500">0 found</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between text-neutral-400">
        <span className="text-[11px]">
          {matches.length > 0
            ? `Match on Page ${matches[currentMatchIndex]?.pageIndex + 1 || 1}`
            : 'Enter text to find'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigateMatch('prev')}
            disabled={matches.length === 0}
            className="p-1 rounded bg-[#1c1c2e] hover:bg-[#25253e] text-neutral-200 disabled:opacity-30 cursor-pointer"
            title="Previous match"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateMatch('next')}
            disabled={matches.length === 0}
            className="p-1 rounded bg-[#1c1c2e] hover:bg-[#25253e] text-neutral-200 disabled:opacity-30 cursor-pointer"
            title="Next match"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Replace Input */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-neutral-300">Replace with</label>
        <input
          type="text"
          value={replaceQuery}
          onChange={(e) => onReplaceQueryChange(e.target.value)}
          placeholder="e.g. Chattogram, Receipt..."
          className="w-full bg-[#0c0c16] border border-[#2d2d44] focus:border-[#7c3aed] text-white rounded-xl px-3 py-1.5 text-xs outline-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#222238]">
        <button
          onClick={onReplaceCurrent}
          disabled={matches.length === 0}
          className="px-3 py-1.5 rounded-xl bg-[#1c1c2e] hover:bg-[#282842] text-neutral-200 border border-[#2d2d44] font-semibold disabled:opacity-30 cursor-pointer transition-colors"
        >
          Replace
        </button>

        <button
          onClick={onReplaceAll}
          disabled={matches.length === 0}
          className="px-3.5 py-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold disabled:opacity-30 cursor-pointer transition-colors shadow-sm"
        >
          Replace All ({matches.length})
        </button>
      </div>
    </div>
  );
};
