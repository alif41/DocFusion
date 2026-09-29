import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import {
  PhotoConversionConfig,
  ConversionStage,
  PhotoFileInfo,
  PhotoConversionOutput,
  PhotoConversionType,
  PhotoOptions,
} from './types';
import { ConverterSelector } from './ConverterSelector';
import { ImageUploader } from './ImageUploader';
import { ImageGrid } from './ImageGrid';
import { ImagePreview } from './ImagePreview';
import { ConversionOptions } from './ConversionOptions';
import { ConversionProgress } from './ConversionProgress';
import { ConversionResult } from './ConversionResult';
import { ErrorState } from './ErrorState';
import { savePhotoHistoryItem } from './ConversionHistory';

interface ConversionWorkspaceProps {
  config: PhotoConversionConfig;
  onSelectConfig: (config: PhotoConversionConfig) => void;
  onBackToDashboard: () => void;
}

const DEFAULT_OPTIONS: PhotoOptions = {
  quality: 92,
  resolution: 'original',
  scale: 1,
  backgroundColor: '#ffffff',
  pageSize: 'a4',
  orientation: 'auto',
  margin: 'small',
  imageFit: 'fit',
  pdfPages: 'all',
  dpi: 150,
};

export const ConversionWorkspace: React.FC<ConversionWorkspaceProps> = ({
  config,
  onSelectConfig,
  onBackToDashboard,
}) => {
  const [files, setFiles] = useState<PhotoFileInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [options, setOptions] = useState<PhotoOptions>(DEFAULT_OPTIONS);

  const [stage, setStage] = useState<ConversionStage>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [filesCompleted, setFilesCompleted] = useState<number>(0);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [outputInfo, setOutputInfo] = useState<PhotoConversionOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<any>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
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
  }, [files, outputInfo]);

  // When config changes, filter out files that don't match source format
  const handleConfigChange = (newConfig: PhotoConversionConfig) => {
    const valid = files.filter((f) => newConfig.sourceExts.includes(f.extension));
    setFiles(valid);
    if (valid.length > 0) {
      setSelectedId(valid[0].id);
    } else {
      setSelectedId(null);
    }
    setOutputInfo(null);
    setErrorMessage(null);
    setStage('idle');
    onSelectConfig(newConfig);
  };

  const handleFilesAdded = (newFiles: PhotoFileInfo[]) => {
    setFiles((prev) => {
      const merged = config.allowsMultiple ? [...prev, ...newFiles] : newFiles;
      if (!selectedId && merged.length > 0) {
        setSelectedId(merged[0].id);
      }
      return merged;
    });
    setOutputInfo(null);
    setErrorMessage(null);
    setStage('idle');
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      if (selectedId === id) {
        setSelectedId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const handleClearAll = () => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    setSelectedId(null);
    setOutputInfo(null);
    setErrorMessage(null);
    setStage('idle');
  };

  const selectedFile = files.find((f) => f.id === selectedId) || (files.length > 0 ? files[0] : null);

  const handleStartConversion = async () => {
    if (files.length === 0) return;

    setStage('uploading');
    setProgressPercent(10);
    setFilesCompleted(0);
    setCurrentFileName(files[0].name);
    setErrorMessage(null);

    abortControllerRef.current = new AbortController();

    // Multi-stage progress simulation
    let simProgress = 10;
    progressIntervalRef.current = setInterval(() => {
      simProgress += Math.random() * 8;
      if (simProgress < 25) {
        setStage('uploading');
      } else if (simProgress < 50) {
        setStage('reading');
      } else if (simProgress < 75) {
        setStage('processing');
      } else if (simProgress < 90) {
        setStage('optimizing');
      } else {
        setStage('finalizing');
        simProgress = Math.min(96, simProgress);
      }
      setProgressPercent(Math.min(96, simProgress));
    }, 350);

    try {
      const formData = new FormData();

      // Append all files
      files.forEach((fileInfo) => {
        formData.append('files', fileInfo.file);
      });

      // Append ordering JSON if reordered
      formData.append(
        'fileOrdering',
        JSON.stringify(files.map((f) => f.name))
      );

      // Append options
      if (options.quality) formData.append('quality', options.quality.toString());
      if (options.resolution) formData.append('resolution', options.resolution);
      if (options.scale) formData.append('scale', options.scale.toString());
      if (options.backgroundColor) formData.append('backgroundColor', options.backgroundColor);
      if (options.pageSize) formData.append('pageSize', options.pageSize);
      if (options.orientation) formData.append('orientation', options.orientation);
      if (options.margin) formData.append('margin', options.margin);
      if (options.imageFit) formData.append('imageFit', options.imageFit);
      if (options.pdfPages) formData.append('pdfPages', options.pdfPages);
      if (options.dpi) formData.append('dpi', options.dpi.toString());

      const endpoint = `/api/photo-convert/${config.id}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || 'Photo conversion failed. Please verify file integrity and try again.'
        );
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Extract response headers
      const rawConvertedName = response.headers.get('X-Converted-Filename');
      const baseOutName =
        files.length === 1
          ? files[0].name.replace(/\.[^/.]+$/, '')
          : `converted_${files.length}_photos`;
      const convertedFilename = rawConvertedName
        ? decodeURIComponent(rawConvertedName)
        : `${baseOutName}${config.targetExt}`;

      const rawW = response.headers.get('X-Output-Width');
      const outWidth = rawW ? parseInt(rawW, 10) : undefined;

      const rawH = response.headers.get('X-Output-Height');
      const outHeight = rawH ? parseInt(rawH, 10) : undefined;

      const rawPages = response.headers.get('X-Pages-Count');
      const pagesCount = rawPages ? parseInt(rawPages, 10) : undefined;

      const isZip = response.headers.get('X-Is-Zip') === 'true';
      const rawWarning = response.headers.get('X-Conversion-Warning');
      const warning = rawWarning ? decodeURIComponent(rawWarning) : undefined;

      const rawCamera = response.headers.get('X-Detected-Camera');
      const detectedCamera = rawCamera ? decodeURIComponent(rawCamera) : undefined;

      const output: PhotoConversionOutput = {
        blob,
        downloadUrl,
        filename: convertedFilename,
        size: blob.size,
        width: outWidth,
        height: outHeight,
        pagesCount,
        isZip,
        warning,
        detectedCamera,
      };

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgressPercent(100);
      setFilesCompleted(files.length);
      setStage('complete');
      setOutputInfo(output);

      // Save to local history
      savePhotoHistoryItem({
        id: `photo_conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        conversionType: config.id,
        originalFilename: files.length === 1 ? files[0].name : `${files.length} photos`,
        convertedFilename,
        sourceFormat: config.sourceFormat,
        targetFormat: config.targetFormat,
        timestamp: Date.now(),
        fileSize: blob.size,
        fileCount: files.length,
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
      console.error('Photo workspace conversion error:', err);
      setStage('error');
      setErrorMessage(
        err.message ||
          'We encountered an issue while processing your photo. Please try a different image or smaller file.'
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
    stage === 'reading' ||
    stage === 'processing' ||
    stage === 'optimizing' ||
    stage === 'finalizing';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Top Header & Fast Switcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToDashboard}
            disabled={isConverting}
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Photo Converters</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hardware Image Pipeline Ready</span>
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
      {stage === 'complete' && outputInfo ? (
        <ConversionResult
          originalFiles={files}
          output={outputInfo}
          sourceFormat={config.sourceFormat}
          targetFormat={config.targetFormat}
          onConvertMore={() => {
            handleClearAll();
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
            currentFileName={currentFileName}
            filesCompleted={filesCompleted}
            totalFiles={files.length}
            config={config}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        /* Workspace Setup: 3-Column Desktop Layout (Left: Upload/Files, Center: Preview, Right: Options) */
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-xs font-medium text-[#a78bfa]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Convert {config.sourceFormat} to {config.targetFormat}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {config.title} Photo Converter
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              {config.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Upload or File Grid (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-4">
              {files.length === 0 ? (
                <ImageUploader
                  config={config}
                  onFilesSelected={handleFilesAdded}
                  disabled={isConverting}
                />
              ) : (
                <ImageGrid
                  files={files}
                  config={config}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRemove={handleRemoveFile}
                  onReorder={setFiles}
                  onAddMore={handleFilesAdded}
                  onClearAll={handleClearAll}
                  disabled={isConverting}
                />
              )}
            </div>

            {/* Center Column: Live Preview Area (4 cols on lg) */}
            <div className="lg:col-span-4">
              <ImagePreview
                fileInfo={selectedFile}
                format={config.sourceFormat}
              />
            </div>

            {/* Right Column: Options & Convert Action Button (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-4">
              <ConversionOptions
                config={config}
                options={options}
                onChange={setOptions}
                disabled={isConverting || files.length === 0}
              />

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleStartConversion}
                disabled={files.length === 0 || isConverting}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm sm:text-base font-bold shadow-xl shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>
                  Convert {files.length > 1 ? `${files.length} Photos` : ''} to {config.targetFormat}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
