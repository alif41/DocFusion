import React, { useState } from 'react';
import {
  FileCode,
  UploadCloud,
  Code,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Layout,
  RefreshCw,
} from 'lucide-react';
import {
  DEFAULT_HTML_TO_PDF_CONFIG,
  HtmlEditor,
  HtmlPreview,
  FileUploader,
  PdfSettings,
  HeaderFooterSettings,
  BatchManager,
  ConversionProgress,
  ConversionResult,
  ErrorState,
  HtmlToPdfConfig,
  InputMode,
  UploadedHtmlFile,
} from '../components/HtmlToPdf';
import { useHtmlConversion } from '../hooks/useHtmlConversion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const HtmlToPdfPage: React.FC = () => {
  useDocumentTitle('HTML to PDF Converter - Convert HTML & CSS to PDF Documents');

  const [inputMode, setInputMode] = useState<InputMode>('editor');
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedHtmlFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(undefined);
  const [config, setConfig] = useState<HtmlToPdfConfig>(DEFAULT_HTML_TO_PDF_CONFIG);

  const {
    stage,
    progressPercent,
    currentDocumentName,
    filesCompleted,
    result,
    errorMessage,
    setErrorMessage,
    setStage,
    convertSingle,
    convertBatch,
    cancel,
    reset,
  } = useHtmlConversion();

  const isConverting =
    stage !== 'idle' && stage !== 'complete' && stage !== 'error';

  const handleFilesAdded = (newFiles: UploadedHtmlFile[]) => {
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    if (newFiles.length > 0) {
      setSelectedFileId(newFiles[0].id);
      setHtmlCode(newFiles[0].htmlContent);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => {
      const filtered = prev.filter((f) => f.id !== id);
      if (selectedFileId === id) {
        if (filtered.length > 0) {
          setSelectedFileId(filtered[0].id);
          setHtmlCode(filtered[0].htmlContent);
        } else {
          setSelectedFileId(undefined);
        }
      }
      return filtered;
    });
  };

  const handleSelectActiveFile = (file: UploadedHtmlFile) => {
    setSelectedFileId(file.id);
    setHtmlCode(file.htmlContent);
  };

  const handleConvert = async () => {
    if (inputMode === 'upload' && uploadedFiles.length > 1) {
      // Batch conversion
      try {
        await convertBatch(uploadedFiles, config);
      } catch (err: any) {
        setStage('error');
        setErrorMessage(err.message || 'Batch conversion interrupted.');
      }
    } else {
      // Single conversion
      const filename =
        inputMode === 'upload' && selectedFileId
          ? uploadedFiles.find((f) => f.id === selectedFileId)?.name || 'document.pdf'
          : 'document.pdf';

      try {
        await convertSingle(htmlCode, filename, config);
      } catch (err: any) {
        setStage('error');
        setErrorMessage(err.message || 'HTML conversion interrupted.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Result View */}
      {stage === 'complete' && result ? (
        <ConversionResult
          result={result}
          onConvertAnother={() => {
            reset();
          }}
          onStartOver={() => {
            reset();
            setUploadedFiles([]);
            setSelectedFileId(undefined);
          }}
        />
      ) : stage === 'error' ? (
        <ErrorState
          message={errorMessage || 'An unexpected conversion error occurred.'}
          onRetry={() => {
            setStage('idle');
            setErrorMessage(null);
          }}
          onBack={() => reset()}
        />
      ) : isConverting ? (
        <div className="max-w-2xl mx-auto pt-8">
          <ConversionProgress
            stage={stage}
            progressPercent={progressPercent}
            currentDocumentName={currentDocumentName}
            filesCompleted={filesCompleted}
            totalFiles={uploadedFiles.length > 1 ? uploadedFiles.length : 1}
            onCancel={cancel}
          />
        </div>
      ) : (
        /* Main Workspace */
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-xs font-semibold text-[#a78bfa]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DocFusion HTML Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              HTML to PDF
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed font-normal">
              Convert HTML files or HTML code into professional PDF documents.
            </p>

            <div className="pt-1 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                CSS Flexbox &amp; Grid Supported
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Preserves High-DPI Vector Fonts
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                SSRF-Protected Sandbox
              </span>
            </div>
          </div>

          {/* Mode Tabs: Option A (Upload File) vs Option B (Code Editor) */}
          <div className="flex items-center justify-center">
            <div className="bg-[#121222] border border-[#24243a] p-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => setInputMode('editor')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  inputMode === 'editor'
                    ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>HTML Code Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload HTML / ZIP Files</span>
              </button>
            </div>
          </div>

          {/* If Upload Mode: Show File Uploader & Batch Queue */}
          {inputMode === 'upload' && (
            <div className="space-y-6">
              <FileUploader
                files={uploadedFiles}
                onFilesAdded={handleFilesAdded}
                onRemoveFile={handleRemoveFile}
                onClearAll={() => {
                  setUploadedFiles([]);
                  setSelectedFileId(undefined);
                }}
                onSelectActiveFile={handleSelectActiveFile}
                selectedFileId={selectedFileId}
                disabled={isConverting}
              />

              {uploadedFiles.length > 1 && (
                <BatchManager
                  files={uploadedFiles}
                  isConverting={isConverting}
                />
              )}
            </div>
          )}

          {/* 50/50 Desktop Split Layout: Editor on Left, Live Preview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: HTML Code Editor */}
            <div className="space-y-4">
              <HtmlEditor
                value={htmlCode}
                onChange={setHtmlCode}
                disabled={isConverting}
              />
            </div>

            {/* Right: Live PDF Preview */}
            <div className="space-y-4">
              <HtmlPreview
                html={htmlCode}
                config={config}
              />
            </div>
          </div>

          {/* Configuration Settings Panels: PDF Page & Header/Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <PdfSettings
              config={config}
              onChange={setConfig}
              disabled={isConverting}
            />

            <div className="space-y-6">
              <HeaderFooterSettings
                config={config.headerFooter}
                onChange={(headerFooter) => setConfig({ ...config, headerFooter })}
                disabled={isConverting}
              />

              {/* Primary Action Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={!htmlCode.trim() || isConverting}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-base font-bold shadow-xl shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
                >
                  <span>
                    {inputMode === 'upload' && uploadedFiles.length > 1
                      ? `Convert Batch (${uploadedFiles.length} HTML Files) to PDF`
                      : 'Convert to PDF'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-center text-xs text-neutral-500">
                  Your files are processed securely and temporary files are automatically removed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
