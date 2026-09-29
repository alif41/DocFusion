import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ConversionConfig,
  ConversionStage,
  UploadedFileInfo,
  ConversionOutputInfo,
  ConversionType,
} from './types';
import { ConverterSelector } from './ConverterSelector';
import { FileUploader } from './FileUploader';
import { UploadedFileCard } from './UploadedFileCard';
import { ConversionInfo } from './ConversionInfo';
import { ConversionProgress } from './ConversionProgress';
import { ConversionResult } from './ConversionResult';
import { ErrorState } from './ErrorState';
import { saveHistoryItem } from './ConversionHistory';

interface ConversionWorkspaceProps {
  config: ConversionConfig;
  onSelectConfig: (config: ConversionConfig) => void;
  onBackToDashboard: () => void;
}

export const ConversionWorkspace: React.FC<ConversionWorkspaceProps> = ({
  config,
  onSelectConfig,
  onBackToDashboard,
}) => {
  const [fileInfo, setFileInfo] = useState<UploadedFileInfo | null>(null);
  const [stage, setStage] = useState<ConversionStage>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [outputInfo, setOutputInfo] = useState<ConversionOutputInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<any>(null);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      if (outputInfo?.downloadUrl) {
        URL.revokeObjectURL(outputInfo.downloadUrl);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [outputInfo]);

  // When config changes, reset file or keep if still matching extension
  const handleConfigChange = (newConfig: ConversionConfig) => {
    if (fileInfo) {
      const ext = '.' + fileInfo.name.split('.').pop()?.toLowerCase();
      if (!newConfig.sourceExts.includes(ext)) {
        setFileInfo(null);
      }
    }
    setOutputInfo(null);
    setErrorMessage(null);
    setStage('idle');
    onSelectConfig(newConfig);
  };

  const handleFileSelected = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    setFileInfo({
      file,
      name: file.name,
      size: file.size,
      extension: ext,
    });
    setOutputInfo(null);
    setErrorMessage(null);
    setStage('idle');
  };

  const handleRemoveFile = () => {
    setFileInfo(null);
    setOutputInfo(null);
    setErrorMessage(null);
    setStage('idle');
  };

  const handleStartConversion = async () => {
    if (!fileInfo) return;

    setStage('uploading');
    setProgressPercent(15);
    setErrorMessage(null);

    abortControllerRef.current = new AbortController();

    // Simulated multi-stage progress pipeline
    let simulatedProgress = 15;
    progressIntervalRef.current = setInterval(() => {
      simulatedProgress += Math.random() * 8;
      if (simulatedProgress < 30) {
        setStage('uploading');
      } else if (simulatedProgress < 55) {
        setStage('analyzing');
      } else if (simulatedProgress < 75) {
        setStage('converting');
      } else if (simulatedProgress < 90) {
        setStage('optimizing');
      } else {
        setStage('finalizing');
        simulatedProgress = Math.min(96, simulatedProgress);
      }
      setProgressPercent(Math.min(96, simulatedProgress));
    }, 400);

    try {
      const formData = new FormData();
      formData.append('file', fileInfo.file);
      formData.append('conversionType', config.id);

      const endpoint = `/api/convert/${config.id}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "We couldn't convert this document. Please verify the file integrity."
        );
      }

      // Read output file
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Extract metadata from response headers
      const rawConvertedName = response.headers.get('X-Converted-Filename');
      const convertedFilename = rawConvertedName
        ? decodeURIComponent(rawConvertedName)
        : `${fileInfo.name.replace(/\.[^/.]+$/, '')}${config.targetExt}`;

      const rawPageCount = response.headers.get('X-Page-Count');
      const pageCount = rawPageCount ? parseInt(rawPageCount, 10) : undefined;

      const rawWarning = response.headers.get('X-Conversion-Warning');
      const warning = rawWarning ? decodeURIComponent(rawWarning) : undefined;

      const output: ConversionOutputInfo = {
        blob,
        downloadUrl,
        filename: convertedFilename,
        size: blob.size,
        sourceFormat: config.sourceFormat,
        targetFormat: config.targetFormat,
        pageCount,
        warning,
      };

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgressPercent(100);
      setStage('complete');
      setOutputInfo(output);

      // Save to conversion history
      saveHistoryItem({
        id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        conversionType: config.id,
        originalFilename: fileInfo.name,
        convertedFilename,
        sourceFormat: config.sourceFormat,
        targetFormat: config.targetFormat,
        timestamp: Date.now(),
        fileSize: blob.size,
      });
    } catch (err: any) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (err.name === 'AbortError') {
        setStage('idle');
        setProgressPercent(0);
        return;
      }
      console.error('Conversion workspace error:', err);
      setStage('error');
      setErrorMessage(
        err.message ||
          "We couldn't convert this document. Please upload a valid, unencrypted file and try again."
      );
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setStage('idle');
    setProgressPercent(0);
  };

  const isConverting =
    stage === 'uploading' ||
    stage === 'analyzing' ||
    stage === 'converting' ||
    stage === 'optimizing' ||
    stage === 'finalizing';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Top Navigation & Fast Conversion Switcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToDashboard}
            disabled={isConverting}
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Converters</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>High-Fidelity Engine Active</span>
          </div>
        </div>

        {/* Quick Format Switcher Tabs */}
        <ConverterSelector
          currentType={config.id}
          onSelect={handleConfigChange}
          disabled={isConverting}
        />
      </div>

      {/* Main Workspace Stage Rendering */}
      {stage === 'complete' && outputInfo && fileInfo ? (
        <ConversionResult
          originalFile={{
            name: fileInfo.name,
            size: fileInfo.size,
            format: config.sourceFormat,
          }}
          output={outputInfo}
          onConvertAnother={() => {
            setFileInfo(null);
            setOutputInfo(null);
            setStage('idle');
          }}
          onBackToDashboard={onBackToDashboard}
        />
      ) : stage === 'error' ? (
        <ErrorState
          message={errorMessage || 'An unexpected conversion error occurred.'}
          onRetry={() => {
            setStage('idle');
            setErrorMessage(null);
          }}
          onBack={onBackToDashboard}
        />
      ) : isConverting ? (
        <div className="max-w-2xl mx-auto">
          <ConversionProgress
            stage={stage}
            progressPercent={progressPercent}
            filename={fileInfo?.name || 'document'}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        /* Workspace Setup: Two-Column Desktop Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload / File Information */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-xs font-medium text-[#a78bfa]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{config.title}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Convert {config.sourceFormat} to {config.targetFormat}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400">
                {config.description}
              </p>
            </div>

            {/* Upload Area or Uploaded File Card */}
            {!fileInfo ? (
              <FileUploader
                config={config}
                onFileSelected={handleFileSelected}
                disabled={isConverting}
              />
            ) : (
              <div className="space-y-4">
                <UploadedFileCard
                  fileInfo={fileInfo}
                  format={config.sourceFormat}
                  onRemove={handleRemoveFile}
                  disabled={isConverting}
                />

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleStartConversion}
                  disabled={isConverting}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm sm:text-base font-bold shadow-xl shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  <span>Convert to {config.targetFormat}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Conversion Specifications & Output Information */}
          <div className="lg:col-span-5">
            <ConversionInfo config={config} />
          </div>
        </div>
      )}
    </div>
  );
};
