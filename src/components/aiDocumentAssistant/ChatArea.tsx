import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Zap,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { ChatMessage, DocumentAnalysisData, QuickActionType } from './types';
import { MarkdownMessage } from './MarkdownMessage';

interface ChatAreaProps {
  document: DocumentAnalysisData;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onQuickAction: (action: QuickActionType) => void;
  onCitationClick: (pageNumber: number) => void;
  isLoading: boolean;
  loadingStatus: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  document,
  messages,
  onSendMessage,
  onQuickAction,
  onCitationClick,
  isLoading,
  loadingStatus,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const text = inputText.trim();
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0b14] border border-[#202034] rounded-3xl overflow-hidden shadow-2xl min-h-[640px] max-h-[82vh]">
      {/* 1. Header Bar */}
      <div className="px-5 py-3.5 bg-[#0e0e1a] border-b border-[#202034] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shadow-md shadow-[#7c3aed]/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">AI Document Assistant</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7c3aed]/20 text-[#c084fc] border border-[#7c3aed]/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 truncate max-w-xs sm:max-w-md">
              Grounded exclusively in {document.filename}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Grounded Mode</span>
        </div>
      </div>

      {/* 2. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        {/* Empty State / Welcome Screen */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-6 max-w-2xl mx-auto my-auto">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7c3aed]/20 to-[#6366f1]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#c084fc] shadow-xl shadow-[#7c3aed]/10">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Ask anything about "{document.filename}"
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md mx-auto">
                DocFusion has indexed all {document.totalPages} pages ({document.totalWords.toLocaleString()} words). Ask specific questions or choose a quick starter below:
              </p>
            </div>

            {/* Document-Specific Suggested Questions */}
            {document.suggestedQuestions && document.suggestedQuestions.length > 0 && (
              <div className="w-full space-y-2 text-left">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 block px-1">
                  Suggested Questions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {document.suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onSendMessage(q)}
                      className="p-3 rounded-2xl bg-white/[0.02] hover:bg-[#7c3aed]/15 border border-[#222236] hover:border-[#7c3aed]/40 text-left text-xs text-neutral-300 hover:text-white transition-all cursor-pointer flex items-start gap-2 group"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-[#a78bfa] shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                      <span className="leading-relaxed">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onQuickAction('summarize')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161628] hover:bg-[#7c3aed] text-xs font-semibold text-neutral-300 hover:text-white border border-[#2c2c42] hover:border-[#7c3aed] transition-all cursor-pointer shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#c084fc]" />
                <span>Executive Summary</span>
              </button>

              <button
                type="button"
                onClick={() => onQuickAction('explain')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161628] hover:bg-[#7c3aed] text-xs font-semibold text-neutral-300 hover:text-white border border-[#2c2c42] hover:border-[#7c3aed] transition-all cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Explain Clauses</span>
              </button>

              <button
                type="button"
                onClick={() => onQuickAction('extract')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161628] hover:bg-[#7c3aed] text-xs font-semibold text-neutral-300 hover:text-white border border-[#2c2c42] hover:border-[#7c3aed] transition-all cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                <span>Extract Tables & Dates</span>
              </button>

              <button
                type="button"
                onClick={() => onQuickAction('faqs')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161628] hover:bg-[#7c3aed] text-xs font-semibold text-neutral-300 hover:text-white border border-[#2c2c42] hover:border-[#7c3aed] transition-all cursor-pointer shadow-xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Generate FAQs</span>
              </button>
            </div>
          </div>
        )}

        {/* Message Turns */}
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isLatestAssistant = !isUser && index === messages.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
            >
              {/* Assistant Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-[#7c3aed]/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble Card */}
              <div
                className={`max-w-2xl sm:max-w-3xl rounded-3xl p-4 sm:p-5 relative group ${
                  isUser
                    ? 'bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white shadow-lg shadow-[#7c3aed]/20 rounded-tr-sm'
                    : 'bg-[#121222] border border-[#24243a] text-neutral-200 shadow-xl rounded-tl-sm'
                }`}
              >
                {/* User Message */}
                {isUser ? (
                  <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap select-text">
                    {msg.content}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Action badge if triggered by quick action */}
                    {msg.actionType && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#c084fc]">
                        <Zap className="w-3 h-3" />
                        <span>Action: {msg.actionType}</span>
                      </div>
                    )}

                    {/* Markdown Body */}
                    <MarkdownMessage
                      content={msg.content}
                      onCitationClick={onCitationClick}
                    />

                    {/* Citation References Bar */}
                    {msg.references && msg.references.length > 0 && (
                      <div className="pt-3 border-t border-[#202034] space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                          Verified Citations & Sources
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.references.map((ref, rIdx) => (
                            <button
                              key={rIdx}
                              type="button"
                              onClick={() => ref.pageNumber && onCitationClick(ref.pageNumber)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#7c3aed]/15 hover:bg-[#7c3aed]/30 border border-[#7c3aed]/30 text-[#c084fc] hover:text-white transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{ref.section || `Page ${ref.pageNumber}`}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Card Actions (Copy & Timestamp) */}
                    <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/[0.06] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy answer to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Suggested Follow-Ups */}
                    {isLatestAssistant && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="pt-3 border-t border-[#202034] space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#a78bfa] block">
                          Suggested Follow-ups
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.suggestedFollowUps.map((followUp, fIdx) => (
                            <button
                              key={fIdx}
                              type="button"
                              onClick={() => onSendMessage(followUp)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-[#7c3aed]/20 border border-white/[0.06] hover:border-[#7c3aed]/40 text-xs text-neutral-300 hover:text-white transition-all cursor-pointer text-left"
                            >
                              <ArrowRight className="w-3 h-3 text-[#a78bfa]" />
                              <span>{followUp}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#2a2a3e] border border-[#3d3d56] flex items-center justify-center text-white shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading / Thinking State */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 justify-start animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-[#7c3aed]/20">
              <Bot className="w-4 h-4 animate-spin" />
            </div>

            <div className="bg-[#121222] border border-[#24243a] rounded-3xl rounded-tl-sm p-4 text-neutral-300 shadow-xl space-y-2 max-w-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#c084fc]">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{loadingStatus || 'Consulting Google Gemini...'}</span>
              </div>
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#c084fc] animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] font-mono text-neutral-400 pl-2">Reading document context...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Input Bar */}
      <div className="p-3 sm:p-4 bg-[#0e0e1a] border-t border-[#202034] shrink-0 space-y-2">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about ${document.filename}... (e.g. "What are the payment terms?")`}
            disabled={isLoading}
            className="w-full bg-[#161628] border border-[#2b2b42] focus:border-[#7c3aed] rounded-2xl pl-4 pr-12 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors resize-none max-h-36 scrollbar-thin"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2.5 p-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md shadow-[#7c3aed]/20 cursor-pointer"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 px-1">
          <span>Press Enter to send • Shift+Enter for new line</span>
          <span className="hidden sm:inline">Strict Document Grounding • No Hallucination</span>
        </div>
      </div>
    </div>
  );
};
