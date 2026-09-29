import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shrink,
  ShieldCheck,
  Zap,
  Lock,
  HardDrive,
  AlertCircle,
  FileCheck,
  CheckCircle,
} from 'lucide-react';
import {
  CompressionPreset,
  CompressResultData,
  CompressProcessingStep,
} from '../types/pdf';
import { CompressUploader } from '../components/compress/CompressUploader';
import { CompressConfigPanel } from '../components/compress/CompressConfigPanel';
import { CompressResultView } from '../components/compress/CompressResultView';
import { getPDFMetadata } from '../utils/pdfThumbnail';
import { compressPDF } from '../services/compressService';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { recordDocumentOperation } from '../services/firestoreService';

export const CompressPDFPage: React.FC = () => {
  const { user } = useAuth();
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [totalPageCount, setTotalPageCount] = useState<number>(1);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);

  // Configuration state
  const [preset, setPreset] = useState<CompressionPreset>('recommended');
  const [dpi, setDpi] = useState<number>(135);
  const [quality, setQuality] = useState<number>(0.65);
  const [removeMetadata, setRemoveMetadata] = useState<boolean>(true);

  // Processing & results state
  const [step, setStep] = useState<CompressProcessingStep>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CompressResultData | null>(null);

  const handleFileSelect = async (file: File) => {
    setCurrentFile(file);
    setIsLoadingMetadata(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const meta = await getPDFMetadata(file);
      setTotalPageCount(meta.pageCount || 1);
      setIsLoadingMetadata(false);
    } catch {
      setTotalPageCount(1);
      setIsLoadingMetadata(false);
    }
  };

  const handleReset = () => {
    setCurrentFile(null);
    setTotalPageCount(1);
    setResult(null);
    setErrorMessage(null);
    setStep('idle');
  };

  const handleExecuteCompress = async () => {
    if (!currentFile) return;

    setErrorMessage(null);
    setStep('compressing');
    setProgressPercent(5);
    setStatusText('Initializing PDF compression pipeline...');

    try {
      const compressResult = await compressPDF(currentFile, {
        preset,
        dpi,
        quality,
        removeMetadata,
        onProgress: (stage, percent) => {
          setStatusText(stage);
          setProgressPercent(percent);
        },
      });

      setResult(compressResult);
      setStep('completed');

      if (user) {
        recordDocumentOperation(user.uid, {
          title: compressResult.originalFilename,
          toolType: 'compress',
          pageCount: compressResult.pageCount,
          originalSize: compressResult.originalSize,
          finalSize: compressResult.compressedSize,
          savedBytes: compressResult.savedBytes,
        }).catch((e) => console.warn('Could not record compress operation to Firestore:', e));
      }
    } catch (err: any) {
      console.error('Compression error:', err);
      setErrorMessage(
        err.message || 'An error occurred during PDF compression. Please try again.'
      );
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] py-10 px-4 sm:px-6 lg:px-8 text-neutral-200">
      <div className="max-w-5xl 2xl:max-w-7xl mx-auto space-y-8 w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform text-[#a78bfa]" />
            <span>Back to Tools Overview</span>
          </Link>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#141422] border border-[#232338] text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Zero Server Upload • Local Processing
          </span>
        </div>

        {/* Hero Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/25 text-xs font-mono text-[#c084fc]">
            <Shrink className="w-3.5 h-3.5" />
            <span>Intelligent PDF Compression</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Compress & Shrink PDF Files
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
            Drastically reduce document file sizes for seamless email attachments and fast web rendering while keeping fonts crisp and illustrations clean.
          </p>
        </div>

        {/* Main Content Area */}
        {result ? (
          <CompressResultView result={result} onReset={handleReset} />
        ) : (
          <div className="space-y-6">
            {/* 1. Uploader */}
            <CompressUploader
              currentFile={currentFile}
              totalPageCount={totalPageCount}
              isLoadingMetadata={isLoadingMetadata}
              onFileSelect={handleFileSelect}
              onReset={handleReset}
            />

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-neutral-400 hover:text-white text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Processing State Overlay */}
            {step === 'compressing' && (
              <div className="rounded-3xl border border-[#2b2b40] bg-[#0d0d16] p-8 text-center space-y-5 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center mx-auto text-[#a78bfa] animate-pulse">
                  <Shrink className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Compressing Document...</h3>
                  <p className="text-xs font-mono text-neutral-400">{statusText}</p>
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <div className="w-full bg-[#181826] h-2.5 rounded-full overflow-hidden border border-[#29293e]">
                    <div
                      className="bg-gradient-to-r from-[#7c3aed] to-[#6366f1] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-neutral-500">
                    <span>Optimizing visual blocks & streams</span>
                    <span>{progressPercent}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Configuration Panel */}
            {currentFile && step !== 'compressing' && (
              <CompressConfigPanel
                originalSize={currentFile.size}
                preset={preset}
                onPresetChange={setPreset}
                dpi={dpi}
                onDpiChange={setDpi}
                quality={quality}
                onQualityChange={setQuality}
                removeMetadata={removeMetadata}
                onRemoveMetadataChange={setRemoveMetadata}
                onExecuteCompress={handleExecuteCompress}
                isProcessing={step === 'compressing'}
              />
            )}
          </div>
        )}

        {/* Feature & Privacy Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[#1a1a26]">
          <div className="p-5 rounded-2xl bg-[#0e0e16] border border-[#1e1e2d] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[#a78bfa] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">Instant Browser Processing</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Documents are processed directly in your browser with hardware canvas acceleration. No waiting in server queues.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e0e16] border border-[#1e1e2d] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">100% Client-Side Privacy</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your sensitive documents never leave your local device. No storage, logs, or external data transmission.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e0e16] border border-[#1e1e2d] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">Email Attachment Ready</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Bypass strict 5MB and 10MB limits from Outlook, Gmail, and government portals effortlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
