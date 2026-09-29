import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Combine,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { PDFFileItem, MergeResultData, MergeProcessingStep } from '../types/pdf';
import { PDFUploader } from '../components/merge/PDFUploader';
import { PDFReorderList } from '../components/merge/PDFReorderList';
import { MergeProcessingState } from '../components/merge/MergeProcessingState';
import { MergeResultView } from '../components/merge/MergeResultView';
import { getPDFMetadata } from '../utils/pdfThumbnail';
import { mergePDFs } from '../services/pdfService';
import { Button } from '../components/common/Button';
import { PDFViewerModal } from '../components/merge/PDFViewerModal';
import { useAuth } from '../contexts/AuthContext';
import { recordDocumentOperation } from '../services/firestoreService';

export const MergePDFPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<PDFFileItem[]>([]);
  const [step, setStep] = useState<MergeProcessingStep>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [customFilename, setCustomFilename] = useState('docfusion-merged.pdf');
  const [result, setResult] = useState<MergeResultData | null>(null);
  const [previewingItem, setPreviewingItem] = useState<PDFFileItem | null>(null);

  // Handle new incoming files from uploader
  const handleFilesSelected = async (newFiles: File[]) => {
    setErrorMessage(null);
    setWarningMessage(null);

    const duplicateNames: string[] = [];
    const filesToProcess: File[] = [];

    // Check duplicates against currently loaded items
    for (const file of newFiles) {
      const isDuplicate = items.some(
        (existing) => existing.name === file.name && existing.size === file.size
      );
      if (isDuplicate) {
        duplicateNames.push(file.name);
      } else {
        filesToProcess.push(file);
      }
    }

    if (duplicateNames.length > 0) {
      setWarningMessage(
        `Identical file already in list: ${duplicateNames.join(', ')}. Duplicate skipped to prevent accidental repetition.`
      );
    }

    if (filesToProcess.length === 0) return;

    // Build temporary items and load metadata
    const newItems: PDFFileItem[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      try {
        const meta = await getPDFMetadata(file);
        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          pageCount: meta.pageCount || 1,
          thumbnailUrl: meta.thumbnailUrl,
          isLoading: false,
          error: meta.error,
        });
      } catch (err: any) {
        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          pageCount: 1,
          thumbnailUrl: null,
          isLoading: false,
          error: 'Could not inspect PDF metadata',
        });
      }
    }

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
    setErrorMessage(null);
    setWarningMessage(null);
  };

  const handleReorder = (newItems: PDFFileItem[]) => {
    setItems(newItems);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setErrorMessage('Please select at least 2 PDF files to merge.');
      return;
    }

    setErrorMessage(null);
    setWarningMessage(null);
    setStep('merging');
    setProgressPercent(10);
    setStatusText('Validating and preparing documents for merge pipeline...');

    try {
      const mergeResult = await mergePDFs(items, {
        filename: customFilename,
        onProgress: (stage, percent) => {
          setStatusText(stage);
          setProgressPercent(percent);
        },
      });

      setResult(mergeResult);
      setStep('completed');

      if (user) {
        recordDocumentOperation(user.uid, {
          title: customFilename || mergeResult.filename,
          toolType: 'merge',
          pageCount: mergeResult.pageCount,
          finalSize: mergeResult.fileSize,
        }).catch((e) => console.warn('Could not record merge to Firestore:', e));
      }
    } catch (err: any) {
      console.error('Merge execution error:', err);
      setErrorMessage(err.message || 'An error occurred during PDF merging.');
      setStep('idle');
    }
  };

  const handleReset = () => {
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    setItems([]);
    setResult(null);
    setStep('idle');
    setProgressPercent(0);
    setStatusText('');
    setErrorMessage(null);
    setWarningMessage(null);
  };

  return (
    <div className="min-h-[85vh] py-6 sm:py-10 px-4 sm:px-6 lg:px-8 2xl:px-12 max-w-7xl 2xl:max-w-[1560px] mx-auto space-y-8 w-full">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#a78bfa]" />
          <span>Back to Tools Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Engine v1.0
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30 flex items-center justify-center shadow-inner">
            <Combine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Merge PDF Documents
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Combine multiple PDF files into a single, organized master document in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {warningMessage && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{warningMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setWarningMessage(null)}
            className="text-amber-400 hover:text-amber-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Feature Viewports based on current step */}
      {step === 'merging' ? (
        <MergeProcessingState
          progressPercent={progressPercent}
          statusText={statusText}
          filesCount={items.length}
        />
      ) : step === 'completed' && result ? (
        <MergeResultView result={result} onReset={handleReset} />
      ) : items.length === 0 ? (
        <div className="space-y-12">
          {/* Empty Upload Zone */}
          <PDFUploader onFilesSelected={handleFilesSelected} />

          {/* Value Props & Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="rounded-2xl border border-[#202030] bg-[#0c0c14] p-6 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#7c3aed]/15 text-[#a78bfa] flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Visual Drag & Drop</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Effortlessly arrange cards to configure your desired merge sequence with instant page count calculation.
              </p>
            </div>

            <div className="rounded-2xl border border-[#202030] bg-[#0c0c14] p-6 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Ephemeral Sandbox</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Zero permanent disk retention. Documents are processed in isolated memory and discarded immediately.
              </p>
            </div>

            <div className="rounded-2xl border border-[#202030] bg-[#0c0c14] p-6 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Lossless Vector Stitching</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                All fonts, embedded vectors, bookmarks, and image DPI values remain untouched and uncompressed.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Reorder and Merge Grid */
        <PDFReorderList
          items={items}
          onReorder={handleReorder}
          onRemove={handleRemove}
          onClearAll={handleClearAll}
          onAddMoreFiles={handleFilesSelected}
          onMerge={handleMerge}
          customFilename={customFilename}
          onFilenameChange={setCustomFilename}
          onPreviewThumbnail={(item) => setPreviewingItem(item)}
        />
      )}

      {/* Individual Document Inspection Canvas Modal */}
      {previewingItem && (
        <PDFViewerModal
          blob={previewingItem.file}
          filename={previewingItem.name}
          fileSize={previewingItem.size}
          totalPageCount={previewingItem.pageCount}
          onClose={() => setPreviewingItem(null)}
          onDownload={() => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(previewingItem.file);
            link.download = previewingItem.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        />
      )}
    </div>
  );
};
