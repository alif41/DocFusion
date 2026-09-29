import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  User,
  Sparkles,
  Paperclip,
  Send,
  X,
  FileText,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  Zap,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  Upload,
} from 'lucide-react';
import {
  DocumentAnalysisData,
  ChatMessage,
  QuickActionType,
  DocumentPageSummary,
  MarkdownMessage,
  CitationModal,
} from '../components/aiDocumentAssistant';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const AiDocumentAssistantPage: React.FC = () => {
  useDocumentTitle('DocFusion AI Chat - Chat & Query Documents with Gemini');

  const [document, setDocument] = useState<DocumentAnalysisData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Citation modal
  const [activeCitationPage, setActiveCitationPage] = useState<DocumentPageSummary | null>(null);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isUploading]);

  // Dynamic textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  // 1. Upload & parse document
  const handleUploadFile = async (file: File) => {
    setErrorMessage(null);
    setIsUploading(true);
    setUploadStatus(`Indexing ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai-document-assistant/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data: DocumentAnalysisData = await response.json();
      setDocument(data);

      // Post greeting message in chat
      const confirmMsg: ChatMessage = {
        id: `msg_doc_ready_${Date.now()}`,
        role: 'assistant',
        content: `📄 **"${data.filename}"** is now attached (${data.totalPages} pages, ${data.totalWords.toLocaleString()} words).\n\n**Synopsis:** ${data.synopsis}\n\nYou can ask any specific question about this document, or choose one of the quick actions below!`,
        timestamp: Date.now(),
        suggestedFollowUps: data.suggestedQuestions.slice(0, 3),
      };

      setMessages((prev) => [...prev, confirmMsg]);
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMessage(err.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 2. Load Sample Document
  const handleLoadSample = async () => {
    setErrorMessage(null);
    setIsUploading(true);
    setUploadStatus('Loading sample Enterprise SLA document...');

    try {
      const response = await fetch('/api/ai-document-assistant/sample');
      if (!response.ok) {
        throw new Error('Failed to load sample document.');
      }

      const data: DocumentAnalysisData = await response.json();
      setDocument(data);

      const confirmMsg: ChatMessage = {
        id: `msg_sample_ready_${Date.now()}`,
        role: 'assistant',
        content: `📄 Attached sample document: **"${data.filename}"** (${data.totalPages} pages, ${data.totalWords.toLocaleString()} words).\n\n**Synopsis:** ${data.synopsis}\n\nWhat would you like to know about this agreement?`,
        timestamp: Date.now(),
        suggestedFollowUps: data.suggestedQuestions.slice(0, 3),
      };

      setMessages((prev) => [...prev, confirmMsg]);
    } catch (err: any) {
      console.error('Sample loading error:', err);
      setErrorMessage(err.message || 'Could not load sample document.');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  // 3. Remove / Detach current document
  const handleDetachDocument = () => {
    if (document) {
      fetch(`/api/ai-document-assistant/session/${document.sessionId}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
    setDocument(null);
  };

  // 4. Send Message (Grounded if doc attached, general if not)
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading || isUploading) return;

    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setLoadingStatus(document ? 'Reading document context via Gemini...' : 'Thinking...');

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        text: m.content,
      }));

      const response = await fetch('/api/ai-document-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: document?.sessionId || null,
          message: text,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gemini was unable to respond.');
      }

      const result = await response.json();

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        timestamp: Date.now(),
        references: result.references,
        suggestedFollowUps: result.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${err.message || 'An error occurred while communicating with Google Gemini. Please try again.'}`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // 5. Quick Actions
  const handleQuickAction = async (action: QuickActionType) => {
    if (!document || isLoading || isUploading) return;

    let userLabel = '';
    switch (action) {
      case 'summarize':
        userLabel = '📋 Please provide a high-impact executive summary with key takeaways.';
        break;
      case 'explain':
        userLabel = '💡 Please explain difficult sections, complex clauses, and jargon in plain English.';
        break;
      case 'extract':
        userLabel = '📊 Please extract key dates, tables, monetary figures, and deliverables.';
        break;
      case 'faqs':
        userLabel = '❓ Please generate the most critical FAQs and cited answers from this document.';
        break;
    }

    const userMsg: ChatMessage = {
      id: `msg_action_${Date.now()}`,
      role: 'user',
      content: userLabel,
      timestamp: Date.now(),
      actionType: action,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setLoadingStatus(`Executing "${action}" analysis...`);

    try {
      const response = await fetch('/api/ai-document-assistant/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: document.sessionId,
          action,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to execute ${action}.`);
      }

      const result = await response.json();

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        timestamp: Date.now(),
        references: result.references,
        suggestedFollowUps: result.suggestedFollowUps,
        actionType: action,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Quick action error:', err);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${err.message || 'Unable to complete quick action.'}`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // 6. Citation Inspection
  const handleCitationClick = (pageNumber: number) => {
    if (!document) return;
    const page = document.pages.find((p) => p.pageNumber === pageNumber);
    if (page) {
      setActiveCitationPage(page);
      setIsCitationModalOpen(true);
    }
  };

  // 7. Clear chat
  const handleNewChat = () => {
    setMessages([]);
    setErrorMessage(null);
  };

  // 8. Copy answer text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Drag & drop file anywhere on chat
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-[calc(100vh-64px)] py-4 sm:py-6 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col relative"
    >
      {/* Hidden file input for attachment */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadFile(e.target.files[0]);
          }
        }}
      />

      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 rounded-3xl bg-[#7c3aed]/20 border-2 border-dashed border-[#a78bfa] backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center mb-3 shadow-xl shadow-[#7c3aed]/30 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Drop file to attach & chat</h3>
          <p className="text-sm text-neutral-300">Supports PDF, Word (.docx), TXT, and Markdown</p>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#202032] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white">AI Document Chat</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#7c3aed]/20 text-[#c084fc] border border-[#7c3aed]/30">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              {document ? `Active: ${document.filename}` : 'Chat freely or attach a document for cited answers'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Start new conversation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Error banner if any */}
      {errorMessage && (
        <div className="my-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 text-rose-400 hover:text-rose-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Chat Stream Container */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 space-y-4 sm:space-y-6 scrollbar-thin">
        {/* Welcome Empty State */}
        {messages.length === 0 && (
          <div className="py-8 sm:py-14 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shadow-xl shadow-[#7c3aed]/25">
              <Bot className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                How can I help you today?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                Ask any question, or attach a PDF or Word document to get grounded answers with verified page citations.
              </p>
            </div>

            {/* Quick action trigger cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-2xl bg-[#0f0f1c] hover:bg-[#151528] border border-[#232338] hover:border-[#7c3aed]/50 text-left transition-all cursor-pointer group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/15 text-[#a78bfa] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-[#c084fc] transition-colors">
                    Attach a Document
                  </div>
                  <div className="text-[11px] text-neutral-400">PDF, DOCX, TXT, or MD</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                className="p-3.5 rounded-2xl bg-[#0f0f1c] hover:bg-[#151528] border border-[#232338] hover:border-[#7c3aed]/50 text-left transition-all cursor-pointer group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                    Try Sample SLA Doc
                  </div>
                  <div className="text-[11px] text-neutral-400">Test with preloaded 3-page contract</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage('What file formats and conversions does DocFusion support?')}
                className="p-3.5 rounded-2xl bg-[#0f0f1c] hover:bg-[#151528] border border-[#232338] hover:border-[#7c3aed]/50 text-left transition-all cursor-pointer group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    DocFusion Capabilities
                  </div>
                  <div className="text-[11px] text-neutral-400">Supported formats & workflows</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage('How can I convert a PDF into Markdown while preserving tables and formatting?')}
                className="p-3.5 rounded-2xl bg-[#0f0f1c] hover:bg-[#151528] border border-[#232338] hover:border-[#7c3aed]/50 text-left transition-all cursor-pointer group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    PDF to Markdown Guide
                  </div>
                  <div className="text-[11px] text-neutral-400">Preserve tables & equations</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Message Turns */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isLatestAssistant = !isUser && idx === messages.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
            >
              {!isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-[#7c3aed]/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4.5 ${
                  isUser
                    ? 'bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-tr-xs shadow-md'
                    : 'bg-[#111120] border border-[#232336] text-neutral-200 rounded-tl-xs shadow-lg'
                }`}
              >
                {isUser ? (
                  <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap select-text">
                    {msg.content}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <MarkdownMessage
                      content={msg.content}
                      onCitationClick={handleCitationClick}
                    />

                    {/* Citations Bar if references exist */}
                    {msg.references && msg.references.length > 0 && (
                      <div className="pt-2.5 border-t border-[#1f1f30] space-y-1">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                          Verified Sources
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.references.map((ref, rIdx) => (
                            <button
                              key={rIdx}
                              type="button"
                              onClick={() => ref.pageNumber && handleCitationClick(ref.pageNumber)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#7c3aed]/15 hover:bg-[#7c3aed]/30 border border-[#7c3aed]/30 text-[#c084fc] hover:text-white transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{ref.section || `Page ${ref.pageNumber}`}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer: Timestamp & Copy */}
                    <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                        title="Copy answer"
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
                      <div className="pt-2 border-t border-[#1f1f30] space-y-1.5">
                        <span className="text-[10px] font-mono text-[#a78bfa] block uppercase tracking-wider">
                          Follow-up suggestions
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((fu, fuIdx) => (
                            <button
                              key={fuIdx}
                              type="button"
                              onClick={() => handleSendMessage(fu)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.03] hover:bg-[#7c3aed]/20 border border-white/[0.06] hover:border-[#7c3aed]/40 text-xs text-neutral-300 hover:text-white transition-all text-left cursor-pointer"
                            >
                              <ArrowRight className="w-3 h-3 text-[#a78bfa]" />
                              <span>{fu}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#232338] border border-[#33334d] flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Uploading indicator */}
        {isUploading && (
          <div className="flex gap-3 justify-start animate-in fade-in">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shrink-0 shadow-md">
              <Upload className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-[#111120] border border-[#232336] rounded-2xl rounded-tl-xs p-3 text-xs text-neutral-300 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-ping" />
              <span>{uploadStatus || 'Processing file...'}</span>
            </div>
          </div>
        )}

        {/* Thinking indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start animate-in fade-in">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shrink-0 shadow-md">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#111120] border border-[#232336] rounded-2xl rounded-tl-xs p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#c084fc]">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{loadingStatus}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area with Integrated File Upload */}
      <div className="pt-2 sm:pt-3 border-t border-[#202032] shrink-0 space-y-2">
        {/* Attached Document Pill (if active) & Quick Actions */}
        {document && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between bg-[#131324] border border-[#292942] rounded-xl px-3 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#a78bfa] shrink-0" />
                <span className="text-xs font-bold text-white truncate max-w-[220px] sm:max-w-md">
                  {document.filename}
                </span>
                <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline">
                  • {document.totalPages} pages • {document.totalWords.toLocaleString()} words
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-[#a78bfa] hover:text-white transition-colors cursor-pointer font-medium"
                >
                  Switch
                </button>
                <button
                  type="button"
                  onClick={handleDetachDocument}
                  className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Remove document"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Action Chips when document is attached */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                disabled={isLoading || isUploading}
                onClick={() => handleQuickAction('summarize')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141426] hover:bg-[#7c3aed] text-[11px] font-medium text-neutral-300 hover:text-white border border-[#25253c] hover:border-[#7c3aed] transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <BookOpen className="w-3 h-3 text-[#c084fc]" />
                <span>Summarize</span>
              </button>

              <button
                type="button"
                disabled={isLoading || isUploading}
                onClick={() => handleQuickAction('explain')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141426] hover:bg-[#7c3aed] text-[11px] font-medium text-neutral-300 hover:text-white border border-[#25253c] hover:border-[#7c3aed] transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Explain Clauses</span>
              </button>

              <button
                type="button"
                disabled={isLoading || isUploading}
                onClick={() => handleQuickAction('extract')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141426] hover:bg-[#7c3aed] text-[11px] font-medium text-neutral-300 hover:text-white border border-[#25253c] hover:border-[#7c3aed] transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3 h-3 text-blue-400" />
                <span>Extract Tables</span>
              </button>

              <button
                type="button"
                disabled={isLoading || isUploading}
                onClick={() => handleQuickAction('faqs')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141426] hover:bg-[#7c3aed] text-[11px] font-medium text-neutral-300 hover:text-white border border-[#25253c] hover:border-[#7c3aed] transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <HelpCircle className="w-3 h-3 text-emerald-400" />
                <span>FAQs</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Bar Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center bg-[#0f0f1c] border border-[#27273e] focus-within:border-[#7c3aed] rounded-2xl p-1.5 transition-colors shadow-lg"
        >
          {/* File Upload Paperclip Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 rounded-xl text-neutral-400 hover:text-[#c084fc] hover:bg-white/[0.05] transition-colors cursor-pointer shrink-0"
            title="Attach a document (PDF, Word, TXT, Markdown)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Chat Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              document
                ? `Ask anything about "${document.filename}"...`
                : 'Ask a question or click 📎 to attach a document...'
            }
            disabled={isLoading || isUploading}
            className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none resize-none max-h-36 scrollbar-thin"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || isUploading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md shadow-[#7c3aed]/20 cursor-pointer shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-neutral-500 px-1">
          <span>Click 📎 to upload PDF, Word (.docx), TXT, or MD</span>
          <span className="hidden sm:inline">Strict Grounding • Zero Disk Retention</span>
        </div>
      </div>

      {/* Citation Inspector Modal */}
      <CitationModal
        isOpen={isCitationModalOpen}
        onClose={() => setIsCitationModalOpen(false)}
        pageSummary={activeCitationPage}
        filename={document?.filename || 'Document'}
      />
    </div>
  );
};
