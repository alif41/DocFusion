import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Sparkles,
  RotateCcw,
  Upload,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Tag,
  Hash,
  Clock,
  ListFilter,
  FileSpreadsheet,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { DocumentAnalysisData, QuickActionType } from './types';

interface DocumentSidebarProps {
  document: DocumentAnalysisData;
  onQuickAction: (action: QuickActionType) => void;
  onNewChat: () => void;
  onChangeDocument: () => void;
  onSelectPage: (pageNumber: number) => void;
  isActionLoading: boolean;
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  document,
  onQuickAction,
  onNewChat,
  onChangeDocument,
  onSelectPage,
  isActionLoading,
}) => {
  const [showSynopsis, setShowSynopsis] = useState(true);
  const [showPages, setShowPages] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const readingTimeMin = Math.max(1, Math.ceil(document.totalWords / 200));

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex flex-col space-y-4 shrink-0">
      {/* 1. Document Identity Card */}
      <div className="bg-[#0e0e1a] border border-[#202034] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7c3aed]/20 to-[#6366f1]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#c084fc] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate" title={document.filename}>
                {document.filename}
              </h3>
              <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                <span className="uppercase text-[#a78bfa]">{document.fileType}</span>
                <span>•</span>
                <span>{formatFileSize(document.fileSize)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onChangeDocument}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Upload another document"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1a1a2c]">
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">Pages</span>
            <span className="text-sm font-bold text-white flex items-center justify-center gap-1">
              <Layers className="w-3 h-3 text-[#a78bfa]" />
              {document.totalPages}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">Words</span>
            <span className="text-sm font-bold text-white flex items-center justify-center gap-1">
              <Hash className="w-3 h-3 text-[#a78bfa]" />
              {document.totalWords.toLocaleString()}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">Read Time</span>
            <span className="text-sm font-bold text-white flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-[#a78bfa]" />
              {readingTimeMin}m
            </span>
          </div>
        </div>

        {/* Synopsis Accordion */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowSynopsis(!showSynopsis)}
            className="w-full flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
              <span>Document Synopsis</span>
            </span>
            {showSynopsis ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showSynopsis && (
            <div className="mt-2 p-3 rounded-xl bg-black/40 border border-[#1e1e30] text-xs text-neutral-300 leading-relaxed">
              {document.synopsis}
            </div>
          )}
        </div>

        {/* Key Topics Tags */}
        {document.keyTopics && document.keyTopics.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
              Core Topics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {document.keyTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#7c3aed]/10 border border-[#7c3aed]/25 text-[#c084fc]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Quick Action Workflows */}
      <div className="bg-[#0e0e1a] border border-[#202034] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>AI Quick Actions</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Gemini
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => onQuickAction('summarize')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-[#7c3aed]/15 border border-[#252538] hover:border-[#7c3aed]/40 text-left text-xs font-medium text-neutral-200 hover:text-white transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="w-7 h-7 rounded-lg bg-[#7c3aed]/20 text-[#c084fc] flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-[#c084fc] transition-colors">
                Summarize Document
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                Executive summary & key takeaways
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => onQuickAction('explain')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-[#7c3aed]/15 border border-[#252538] hover:border-[#7c3aed]/40 text-left text-xs font-medium text-neutral-200 hover:text-white transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                Explain Difficult Sections
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                Translate jargon & complex clauses
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => onQuickAction('extract')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-[#7c3aed]/15 border border-[#252538] hover:border-[#7c3aed]/40 text-left text-xs font-medium text-neutral-200 hover:text-white transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                Extract Key Data
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                Tables, dates, names & numbers
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => onQuickAction('faqs')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-[#7c3aed]/15 border border-[#252538] hover:border-[#7c3aed]/40 text-left text-xs font-medium text-neutral-200 hover:text-white transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Generate FAQs
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                Crucial questions & cited answers
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Page Excerpt Browser Accordion */}
      <div className="bg-[#0e0e1a] border border-[#202034] rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-xl">
        <button
          type="button"
          onClick={() => setShowPages(!showPages)}
          className="w-full flex items-center justify-between text-xs font-bold text-white tracking-tight py-0.5"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>Document Pages ({document.pages.length})</span>
          </span>
          {showPages ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showPages && (
          <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin pt-2">
            {document.pages.map((p) => (
              <button
                key={p.pageNumber}
                type="button"
                onClick={() => onSelectPage(p.pageNumber)}
                className="w-full text-left p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-[#202032] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-[#a78bfa] mb-0.5">
                  <span className="font-bold">Page {p.pageNumber}</span>
                  <span className="text-neutral-500 text-[10px]">{p.wordCount} words</span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {p.preview || 'Visual or table layout'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Bottom Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewChat}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#141422] hover:bg-[#1a1a2e] border border-[#26263c] text-xs font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#a78bfa]" />
          <span>New Chat</span>
        </button>

        <button
          type="button"
          onClick={onChangeDocument}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#141422] hover:bg-[#1a1a2e] border border-[#26263c] text-xs font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-[#a78bfa]" />
          <span>Switch Doc</span>
        </button>
      </div>
    </aside>
  );
};
