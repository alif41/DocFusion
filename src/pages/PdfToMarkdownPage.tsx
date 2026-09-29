import React, { useState, useCallback, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Sliders,
  Download,
  RefreshCw,
  AlertCircle,
  Columns,
  Eye,
  Edit3,
  Layers,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Link } from 'react-router-dom';
import {
  PdfToMarkdownOptions,
  ConversionResult,
  ViewLayoutMode,
} from '../components/pdfToMarkdown/types';
import {
  convertPdfDocument,
  downloadMarkdownFile,
  downloadZipBundle,
} from '../components/pdfToMarkdown/services/pdfToMarkdownClient';
import { PdfPreviewPanel } from '../components/pdfToMarkdown/components/PdfPreviewPanel';
import { MarkdownEditor } from '../components/pdfToMarkdown/components/MarkdownEditor';
import { MarkdownPreviewPanel } from '../components/pdfToMarkdown/components/MarkdownPreviewPanel';
import { ConversionSettingsModal } from '../components/pdfToMarkdown/components/ConversionSettingsModal';
import { ExportModal } from '../components/pdfToMarkdown/components/ExportModal';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

const DEFAULT_OPTIONS: PdfToMarkdownOptions = {
  pageRange: 'all',
  ocrStrategy: 'auto',
  ocrLanguage: 'eng',
  imageMode: 'extract_folder',
  includeFrontmatter: true,
  detectTables: true,
  detectCodeBlocks: true,
  cleanPageArtifacts: true,
};

type MobileActiveTab = 'pdf' | 'editor' | 'preview';

export const PdfToMarkdownPage: React.FC = () => {
  // File & Document State
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Conversion & Markdown State
  const [options, setOptions] = useState<PdfToMarkdownOptions>(DEFAULT_OPTIONS);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionStep, setConversionStep] = useState<string>('');
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  // Editable Markdown text with Undo/Redo stack
  const [markdown, setMarkdown] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // UI & Viewport Layout
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>('split_all');
  const [mobileTab, setMobileTab] = useState<MobileActiveTab>('editor');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Drag & drop state
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize history
  const updateMarkdownWithHistory = (newVal: string) => {
    setMarkdown(newVal);
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(newVal);
      return next.slice(-40); // keep last 40 states
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 39));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      setMarkdown(history[targetIndex]);
      setHistoryIndex(targetIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      setMarkdown(history[targetIndex]);
      setHistoryIndex(targetIndex);
    }
  };

  // Convert File Process
  const processConversion = useCallback(
    async (targetFile: File, targetOptions: PdfToMarkdownOptions) => {
      setIsConverting(true);
      setConversionError(null);
      setConversionStep('Analyzing PDF document structure...');

      try {
        // Step 1: Client load for preview
        const arrayBuf = await targetFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuf.slice(0)),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@6.3.289/cmaps/',
          cMapPacked: true,
        });
        const docProxy = await loadingTask.promise;
        setPdfDoc(docProxy);
        setTotalPages(docProxy.numPages);
        setCurrentPage(1);

        // Step 2: Trigger backend conversion pipeline
        setConversionStep('Extracting text, layout, and tables...');
        const result = await convertPdfDocument(targetFile, targetOptions);

        setConversionStep('Finalizing Markdown output...');
        setConversionResult(result);
        setMarkdown(result.markdown);
        setHistory([result.markdown]);
        setHistoryIndex(0);
        setIsConverting(false);
      } catch (err: any) {
        console.error('Conversion failed:', err);
        setConversionError(err?.message || 'Failed to convert PDF document.');
        setIsConverting(false);
      }
    },
    []
  );

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setConversionError('Please select a valid PDF (.pdf) file.');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setConversionError('File size exceeds 50MB limit.');
      return;
    }

    setFile(selectedFile);
    processConversion(selectedFile, options);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInsertFrontmatter = () => {
    if (!conversionResult?.metadata) return;
    const meta = conversionResult.metadata;
    const frontmatterBlock = `---\ntitle: "${meta.title || file?.name.replace(/\.pdf$/i, '')}"\nauthor: "${meta.author || ''}"\npages: ${totalPages}\ndate: "${new Date().toISOString().split('T')[0]}"\ngenerator: "DocFusion PDF to Markdown"\n---\n\n`;
    if (!markdown.startsWith('---')) {
      updateMarkdownWithHistory(frontmatterBlock + markdown);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] sm:h-[calc(100vh-65px)] bg-slate-50 dark:bg-[#08080c] text-slate-900 dark:text-white overflow-hidden transition-colors">
      {/* Top Application Workspace Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-[#101018] border-b border-slate-200 dark:border-[#1f1f2e] shrink-0 z-20">
        {/* Left branding & back button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#161622] dark:hover:bg-[#202030] text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center font-bold text-xs">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide">PDF to Markdown</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#a78bfa] border border-[#7c3aed]/30 font-medium">
                  GFM + OCR
                </span>
              </div>
              {file && (
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate max-w-[140px] sm:max-w-xs font-mono">
                  {file.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Desktop View Layout Switcher (lg and above) */}
        {file && (
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-[#161624] p-0.5 rounded-xl border border-slate-200 dark:border-[#242438] text-xs">
            <button
              type="button"
              onClick={() => setLayoutMode('split_all')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                layoutMode === 'split_all'
                  ? 'bg-[#7c3aed] text-white shadow-xs font-medium'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="3-Pane Workspace (PDF + Editor + Preview)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>3-Pane</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('pdf_editor')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                layoutMode === 'pdf_editor'
                  ? 'bg-[#7c3aed] text-white shadow-xs font-medium'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="PDF Preview + Markdown Editor"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>PDF &amp; Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('editor_preview')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                layoutMode === 'editor_preview'
                  ? 'bg-[#7c3aed] text-white shadow-xs font-medium'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Editor + Live Preview"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Editor &amp; Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('editor_only')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                layoutMode === 'editor_only'
                  ? 'bg-[#7c3aed] text-white shadow-xs font-medium'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Full-Width Markdown Editor"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Editor Only</span>
            </button>
          </div>
        )}

        {/* Mobile segmented tab controller (below lg) */}
        {file && (
          <div className="flex lg:hidden items-center bg-slate-100 dark:bg-[#161624] p-0.5 rounded-lg border border-slate-200 dark:border-[#242438] text-[11px]">
            <button
              type="button"
              onClick={() => setMobileTab('pdf')}
              className={`px-2 py-1 rounded-md transition-colors ${
                mobileTab === 'pdf'
                  ? 'bg-[#7c3aed] text-white font-medium shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400'
              }`}
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('editor')}
              className={`px-2 py-1 rounded-md transition-colors ${
                mobileTab === 'editor'
                  ? 'bg-[#7c3aed] text-white font-medium shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400'
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`px-2 py-1 rounded-md transition-colors ${
                mobileTab === 'preview'
                  ? 'bg-[#7c3aed] text-white font-medium shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400'
              }`}
            >
              Preview
            </button>
          </div>
        )}

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {file && (
            <>
              {/* Settings modal button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161624] dark:hover:bg-[#222236] border border-slate-300 dark:border-[#26263b] text-xs text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Conversion Settings & OCR"
              >
                <Sliders className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
                <span className="hidden md:inline">Settings</span>
              </button>

              {/* Re-convert button */}
              <button
                type="button"
                onClick={() => processConversion(file, options)}
                disabled={isConverting}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161624] dark:hover:bg-[#222236] border border-slate-300 dark:border-[#26263b] text-xs text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                title="Re-run conversion pipeline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConverting ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Re-run</span>
              </button>

              {/* Upload another button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161624] dark:hover:bg-[#222236] border border-slate-300 dark:border-[#26263b] text-xs text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Upload another PDF"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                <span>New PDF</span>
              </button>

              {/* Export Modal Button */}
              <button
                type="button"
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] text-xs font-semibold shadow-md shadow-[#7c3aed]/25 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Upload Dropzone View if no document loaded */}
        {!file && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={handleDrop}
            className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <div className="w-full max-w-xl text-center space-y-6">
              {/* Hero Banner Header */}
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#7c3aed]/10 text-[#7c3aed] dark:text-[#a78bfa] border border-[#7c3aed]/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  PDF to Structured Markdown
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  Convert PDF to Clean, Editable Markdown
                </h2>
                <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-lg mx-auto">
                  Extract headings, paragraphs, bullet lists, GFM tables, blockquotes, code blocks,
                  and metadata while preserving layout and reading order. Supports scanned PDFs with OCR.
                </p>
              </div>

              {/* Upload Card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                  isDraggingFile
                    ? 'border-[#7c3aed] bg-[#7c3aed]/10 scale-[1.01]'
                    : 'border-slate-300 dark:border-[#26263a] bg-white dark:bg-[#12121c] hover:border-[#7c3aed] dark:hover:border-[#383852] hover:bg-slate-50 dark:hover:bg-[#151522] shadow-xs'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#7c3aed]/10">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Drop your PDF here or <span className="text-[#7c3aed] dark:text-[#a78bfa] underline">browse file</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 font-mono">
                    Supports text-based &amp; scanned PDFs up to 50MB
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {conversionError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{conversionError}</span>
                </div>
              )}

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {[
                  { title: 'GFM Tables', desc: 'Auto-detects and formats aligned Markdown tables' },
                  { title: 'OCR Intelligence', desc: 'Converts scanned pages into clean text' },
                  { title: 'Image Extraction', desc: 'Exports figures to images/ ZIP folder' },
                  { title: 'YAML Frontmatter', desc: 'Preserves PDF title, author and page count' },
                ].map((feat, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white dark:bg-[#101018] border border-slate-200 dark:border-[#1f1f2e] shadow-xs">
                    <span className="text-xs font-semibold text-slate-900 dark:text-neutral-200 block mb-0.5">
                      {feat.title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-500 leading-tight block">
                      {feat.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Processing Modal / Overlay */}
        {isConverting && (
          <div className="absolute inset-0 bg-white/80 dark:bg-[#08080c]/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center text-[#7c3aed] dark:text-[#a78bfa]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <div className="text-center space-y-1.5 max-w-sm">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Converting Document</h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 font-mono">{conversionStep}</p>
            </div>
            <div className="w-64 h-1.5 bg-slate-200 dark:bg-[#1f1f2e] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#7c3aed] to-emerald-400 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* 3-Column Split Workspace (when file is loaded) */}
        {file && !isConverting && (
          <>
            {/* Desktop View (lg and above): Responsive Split Columns */}
            <div className="hidden lg:flex flex-1 flex-row h-full overflow-hidden">
              {/* Left Column: PDF Source Preview */}
              {(layoutMode === 'split_all' || layoutMode === 'pdf_editor') && (
                <div className="w-[30%] xl:w-[28%] h-full shrink-0">
                  <PdfPreviewPanel
                    pdfDoc={pdfDoc}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    pagesAnalysis={conversionResult?.pages}
                    isProcessing={isConverting}
                  />
                </div>
              )}

              {/* Center Column: Editable Markdown Editor */}
              <div
                className={`flex-1 h-full shrink-0 ${
                  layoutMode === 'split_all'
                    ? 'w-[38%] xl:w-[40%]'
                    : layoutMode === 'editor_only'
                    ? 'w-full'
                    : 'w-[50%]'
                }`}
              >
                <MarkdownEditor
                  value={markdown}
                  onChange={updateMarkdownWithHistory}
                  canUndo={historyIndex > 0}
                  canRedo={historyIndex < history.length - 1}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onInsertFrontmatter={handleInsertFrontmatter}
                />
              </div>

              {/* Right Column: Live Rendered Preview */}
              {(layoutMode === 'split_all' || layoutMode === 'editor_preview') && (
                <div className="w-[32%] xl:w-[32%] h-full shrink-0 border-l border-slate-200 dark:border-[#1f1f2e]">
                  <MarkdownPreviewPanel
                    markdown={markdown}
                    images={conversionResult?.images || []}
                    originalFilename={file.name}
                    onDownloadMd={() => downloadMarkdownFile(markdown, file.name)}
                    onDownloadZip={() =>
                      downloadZipBundle(
                        markdown,
                        conversionResult?.images || [],
                        file.name
                      )
                    }
                  />
                </div>
              )}
            </div>

            {/* Mobile / Tablet View (< lg): Segmented Tab View with Full Screen Focus */}
            <div className="flex lg:hidden flex-1 h-full overflow-hidden">
              {mobileTab === 'pdf' && (
                <div className="w-full h-full">
                  <PdfPreviewPanel
                    pdfDoc={pdfDoc}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    pagesAnalysis={conversionResult?.pages}
                    isProcessing={isConverting}
                  />
                </div>
              )}

              {mobileTab === 'editor' && (
                <div className="w-full h-full">
                  <MarkdownEditor
                    value={markdown}
                    onChange={updateMarkdownWithHistory}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onInsertFrontmatter={handleInsertFrontmatter}
                  />
                </div>
              )}

              {mobileTab === 'preview' && (
                <div className="w-full h-full">
                  <MarkdownPreviewPanel
                    markdown={markdown}
                    images={conversionResult?.images || []}
                    originalFilename={file.name}
                    onDownloadMd={() => downloadMarkdownFile(markdown, file.name)}
                    onDownloadZip={() =>
                      downloadZipBundle(
                        markdown,
                        conversionResult?.images || [],
                        file.name
                      )
                    }
                  />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Settings Modal */}
      <ConversionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        totalPages={totalPages}
        onApply={(newOpts) => {
          setOptions(newOpts);
          if (file) {
            processConversion(file, newOpts);
          }
        }}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        markdown={markdown}
        images={conversionResult?.images || []}
        stats={conversionResult?.stats}
        originalFilename={file?.name || 'document.pdf'}
        onDownloadMd={(customName) => downloadMarkdownFile(markdown, customName)}
        onDownloadZip={(customName) =>
          downloadZipBundle(markdown, conversionResult?.images || [], customName)
        }
      />
    </div>
  );
};
export default PdfToMarkdownPage;
