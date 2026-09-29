import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Sparkles,
  AlertCircle,
  RotateCcw,
  FileText,
  Clock,
  Check,
} from 'lucide-react';
import {
  PDFUploader,
  PDFAnalyzer,
  DocumentEditor,
  EditablePage,
  AnalysisProgress,
  parsePDFDocument,
} from '../components/EditPDF';
import { Button } from '../components/common/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const EditPDFPage: React.FC = () => {
  useDocumentTitle('PDF Editor - DocFusion');
  const [searchParams] = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<ArrayBuffer | null>(null);

  // Status: 'idle' | 'analyzing' | 'editing' | 'error'
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'editing' | 'error'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    stage: 'uploading',
    percent: 10,
    message: 'Starting PDF analysis engine...',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed pages for the editor
  const [parsedPages, setParsedPages] = useState<EditablePage[]>([]);
  const [documentName, setDocumentName] = useState<string>('Document');
  const [isOCRApplied, setIsOCRApplied] = useState<boolean>(false);
  const [ocrStats, setOcrStats] = useState<{
    pagesScanned: number;
    wordsRecognized: number;
    avgConfidence: number;
  } | undefined>(undefined);

  // Saved Draft detection
  const [savedDraft, setSavedDraft] = useState<{ title: string; pages: EditablePage[]; updatedAt: number } | null>(null);

  // Check for local drafts on mount
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('docfusion_draft_'));
      if (keys.length > 0) {
        // Find most recent
        let latest: any = null;
        for (const k of keys) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k) || '{}');
            if (!latest || (parsed.updatedAt && parsed.updatedAt > latest.updatedAt)) {
              latest = parsed;
            }
          } catch (e) {}
        }
        if (latest && latest.pages && latest.pages.length > 0) {
          setSavedDraft(latest);
        }
      }
    } catch (e) {
      console.warn('Draft detection failed:', e);
    }
  }, []);

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setDocumentName(file.name);
    setErrorMessage(null);
    setStatus('analyzing');

    try {
      const bytes = await file.arrayBuffer();
      setFileBytes(bytes);

      const result = await parsePDFDocument(bytes, (stage, percent, message) => {
        setAnalysisProgress({
          stage,
          percent,
          message,
        });
      });

      setParsedPages(result.pages);
      setIsOCRApplied(result.isOCRUsed);
      setOcrStats(result.ocrStats);
      setStatus('editing');
    } catch (err: any) {
      console.error('PDF parsing error:', err);
      setStatus('error');
      setErrorMessage(
        err?.message ||
          'This PDF contains elements that cannot be fully reconstructed for editing. Please try another document.'
      );
    }
  };

  const handleResumeDraft = () => {
    if (!savedDraft) return;
    setDocumentName(savedDraft.title || 'Resumed_Document');
    setParsedPages(savedDraft.pages);
    setStatus('editing');
  };

  const handleStartNew = () => {
    setSelectedFile(null);
    setFileBytes(null);
    setParsedPages([]);
    setStatus('idle');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-[#0a0a14]">
      {/* If editing, render the complete full-screen document editor */}
      {status === 'editing' && (
        <DocumentEditor
          initialPages={parsedPages}
          initialFileName={documentName}
          originalBytes={fileBytes}
          isOCRUsed={isOCRApplied}
          ocrStats={ocrStats}
          onStartNewDocument={handleStartNew}
        />
      )}

      {/* Uploading & Idle State */}
      {status === 'idle' && (
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col justify-center space-y-6">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </Link>
          </div>

          {/* Saved Draft Banner if available */}
          {savedDraft && (
            <div className="p-4 rounded-2xl bg-[#141424] border border-[#2e2e48] flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#a78bfa] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    Unsaved Draft Available: <span className="text-[#a78bfa]">{savedDraft.title}</span>
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Last modified {new Date(savedDraft.updatedAt).toLocaleTimeString()} ({savedDraft.pages.length} pages)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleResumeDraft}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Resume Draft
                </Button>
                <button
                  onClick={() => setSavedDraft(null)}
                  className="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Professional PDF Uploader */}
          <PDFUploader onFileSelected={handleFileSelected} />
        </div>
      )}

      {/* Analyzing / Scanning State */}
      {status === 'analyzing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <PDFAnalyzer progress={analysisProgress} fileName={selectedFile?.name} />
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="flex-1 max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-400 flex items-center justify-center shadow-lg">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Document Processing Notice</h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {errorMessage || 'This PDF could not be reconstructed into an editable format.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" onClick={handleStartNew} leftIcon={<RotateCcw className="w-4 h-4" />}>
              Try Another PDF
            </Button>
            <Link to="/">
              <Button variant="secondary" size="md">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
