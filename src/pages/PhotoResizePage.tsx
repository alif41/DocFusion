import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Scaling,
  Image as ImageIcon,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sliders,
  AlertCircle,
  HelpCircle,
  Archive,
  Download,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  PhotoItem,
  ResizeConfig,
  PhotoResizeResultItem,
  PhotoResizeUploader,
  PhotoResizeItemCard,
  PhotoResizeControls,
  PhotoResizeBatchSummary,
  PhotoAdjustModal,
  ImageAdjustments,
} from '../components/photoResize';

export const PhotoResizePage: React.FC = () => {
  useDocumentTitle('Photo Resize - Batch Image Resizer & Optimizer');

  const [items, setItems] = useState<PhotoItem[]>([]);
  const [config, setConfig] = useState<ResizeConfig>({
    mode: 'dimensions',
    width: 1920,
    height: 1080,
    percentage: 75,
    maintainAspectRatio: true,
    aspectRatio: 'original',
    customRatioW: 16,
    customRatioH: 9,
    fit: 'cover',
    paddingColor: 'white',
    outputFormat: 'original',
    quality: 85,
    enableTargetSize: false,
    targetSizeKb: 200,
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<PhotoItem | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleSaveAdjustments = (
    itemId: string,
    adjustments: ImageAdjustments,
    applyToAll = false
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (applyToAll || i.id === itemId) {
          return { ...i, adjustments };
        }
        return i;
      })
    );
    setAdjustingItem(null);
  };

  // Reference aspect ratio of the first ready item
  const firstReadyItem = items.find((i) => i.originalWidth && i.originalHeight);
  const referenceAspectRatio =
    firstReadyItem && firstReadyItem.originalWidth && firstReadyItem.originalHeight
      ? firstReadyItem.originalWidth / firstReadyItem.originalHeight
      : 1;

  // Inspect new files on upload to extract dimensions & thumbnails
  const handleFilesSelected = async (newFiles: File[]) => {
    setGlobalError(null);

    // Create preliminary items
    const newItems: PhotoItem[] = newFiles.map((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      let localUrl: string | undefined;

      // For standard browser-renderable images, create a full-resolution object URL immediately
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
        localUrl = URL.createObjectURL(file);
      }

      return {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        file,
        name: file.name,
        size: file.size,
        format: ext,
        previewUrl: localUrl,
        fullPreviewUrl: localUrl,
        thumbnailUrl: localUrl,
        status: 'inspecting',
      };
    });

    setItems((prev) => [...prev, ...newItems]);

    // Inspect files via server API to get authoritative dimensions and HEIC thumbnails
    try {
      const formData = new FormData();
      newFiles.forEach((file) => formData.append('images', file));

      const res = await fetch('/api/photo-resize/inspect', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Server could not inspect images.');
      }

      const data = await res.json();
      if (data.images && Array.isArray(data.images)) {
        setItems((prev) =>
          prev.map((item) => {
            const inspected = data.images.find(
              (img: any) => img.filename === item.name
            );
            if (inspected && !inspected.error) {
              // High-resolution URL for preview & adjust: prefer local full file URL, or high-res server preview
              const highResUrl =
                item.fullPreviewUrl ||
                inspected.fullPreviewDataUrl ||
                inspected.thumbnailDataUrl;
              const thumbUrl = inspected.thumbnailDataUrl || highResUrl;

              return {
                ...item,
                originalWidth: inspected.width,
                originalHeight: inspected.height,
                aspectRatio: inspected.aspectRatio,
                previewUrl: highResUrl,
                fullPreviewUrl: highResUrl,
                thumbnailUrl: thumbUrl,
                format: inspected.format || item.format,
                status: 'ready',
              };
            } else if (inspected?.error) {
              return {
                ...item,
                status: 'error',
                error: inspected.error,
              };
            }
            return item;
          })
        );

        // If config was still on default 1920x1080 and this is the first batch, adapt config to first image
        const firstValid = data.images.find((img: any) => !img.error && img.width);
        if (firstValid && items.length === 0) {
          setConfig((prev) => ({
            ...prev,
            width: firstValid.width,
            height: firstValid.height,
          }));
        }
      }
    } catch (err: any) {
      console.warn('Inspect API fallback to basic readiness:', err);
      // Fallback: set items to ready
      setItems((prev) =>
        prev.map((i) => (i.status === 'inspecting' ? { ...i, status: 'ready' } : i))
      );
    }
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  // Clear all
  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setItems([]);
    setGlobalError(null);
  };

  // Resize All
  const handleResizeAll = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setGlobalError(null);

    // Set all ready items to processing
    setItems((prev) =>
      prev.map((i) => ({ ...i, status: 'processing', error: undefined }))
    );

    try {
      const formData = new FormData();
      items.forEach((item) => {
        formData.append('images', item.file);
      });

      const appliedRatio =
        config.aspectRatio === 'custom'
          ? `${config.customRatioW}:${config.customRatioH}`
          : config.aspectRatio;

      formData.append(
        'options',
        JSON.stringify({
          mode: config.mode,
          width: config.width,
          height: config.height,
          percentage: config.percentage,
          maintainAspectRatio: config.maintainAspectRatio,
          aspectRatio: appliedRatio,
          fit: config.aspectRatio !== 'original' ? config.fit : (config.maintainAspectRatio ? 'inside' : 'fill'),
          paddingColor: config.paddingColor,
          outputFormat: config.outputFormat,
          quality: config.quality,
          targetSizeKb: config.enableTargetSize ? config.targetSizeKb : undefined,
        })
      );

      // Pass per-file adjustments (crop offsets, rotation, flips, color)
      const fileOptions = items.map((item) => ({
        filename: item.file.name,
        adjustments: item.adjustments,
      }));
      formData.append('fileOptions', JSON.stringify(fileOptions));

      const res = await fetch('/api/photo-resize/resize', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resize photos.');
      }

      if (data.results && Array.isArray(data.results)) {
        // Map returned results by index or filename
        setItems((prev) =>
          prev.map((item, idx) => {
            const resultItem: PhotoResizeResultItem | undefined = data.results[idx];
            if (resultItem) {
              return {
                ...item,
                status: 'completed',
                result: resultItem,
              };
            }
            return {
              ...item,
              status: 'error',
              error: 'No result returned for this file.',
            };
          })
        );
      }
    } catch (err: any) {
      console.error('Resize execution error:', err);
      setGlobalError(err.message || 'An error occurred while resizing your images.');
      setItems((prev) =>
        prev.map((i) =>
          i.status === 'processing'
            ? { ...i, status: 'error', error: err.message || 'Resize failed' }
            : i
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Download individual photo
  const handleDownloadSingle = (item: PhotoItem) => {
    if (!item.result) return;
    const a = document.createElement('a');
    a.href = item.result.dataUrl;
    a.download = item.result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    const completedItems = items.filter((i) => i.status === 'completed' && i.result);
    if (completedItems.length === 0) return;

    try {
      const ids = completedItems.map((i) => i.result!.id);
      const res = await fetch('/api/photo-resize/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        throw new Error('Failed to create ZIP file.');
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'docfusion-resized-photos.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('ZIP download error:', err);
      setGlobalError(err.message || 'Failed to download ZIP archive.');
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8 2xl:px-12 max-w-7xl 2xl:max-w-[1560px] mx-auto space-y-8 w-full">
      {/* Hidden File Input for "Add More" */}
      <input
        ref={hiddenInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(Array.from(e.target.files));
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tools Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#7c3aed]/10 text-[#7c3aed] dark:text-[#c084fc] border border-[#7c3aed]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Speed Sharp Engine</span>
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7c3aed]/20 via-[#6366f1]/20 to-[#38bdf8]/20 border border-[#7c3aed]/30 text-[#7c3aed] dark:text-[#a78bfa] mb-1">
          <Scaling className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Photo Resize
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Quickly resize single or batch images. Set exact pixel dimensions, lock aspect ratio, scale by percentage, or choose presets for social media, profiles, documents, and web displays.
        </p>
      </div>

      {/* Global Error Notice */}
      {globalError && (
        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGlobalError(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace */}
      {items.length === 0 ? (
        <div className="max-w-3xl mx-auto">
          <PhotoResizeUploader onFilesSelected={handleFilesSelected} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Batch Summary Bar */}
          <PhotoResizeBatchSummary
            items={items}
            isProcessing={isProcessing}
            onResizeAll={handleResizeAll}
            onDownloadZip={handleDownloadZip}
            onClearAll={handleClearAll}
            onAddMoreClick={() => hiddenInputRef.current?.click()}
            onOpenPreviewFirst={() => setAdjustingItem(items[0])}
          />

          {/* Two-Column Grid: Queue on Left, Controls on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Image Queue Cards (Cols 1-7) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-semibold">
                  Uploaded Images ({items.length})
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Click 'Download' on any finished item
                </span>
              </div>

              <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <PhotoResizeItemCard
                    key={item.id}
                    item={item}
                    onRemove={handleRemoveItem}
                    onDownloadSingle={handleDownloadSingle}
                    onOpenAdjust={(it) => setAdjustingItem(it)}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Resize Settings & Controls (Cols 8-12) */}
            <div className="lg:col-span-5">
              <PhotoResizeControls
                config={config}
                onChange={(updated) => setConfig((prev) => ({ ...prev, ...updated }))}
                referenceAspectRatio={referenceAspectRatio}
              />
            </div>
          </div>
        </div>
      )}

      {/* Feature Guide & Specifications */}
      <div className="pt-8 border-t border-slate-200 dark:border-[#1a1a26] space-y-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-slate-900 dark:text-white font-bold text-center">
          Professional Photo Resizing Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#101018] border border-slate-200 dark:border-[#1e1e2d] space-y-2">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Multi-Format &amp; HEIC Engine</span>
            </h5>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Native decoders for iPhone HEIC/HEIF images, high-res JPEGs, transparent PNGs, and modern WebP formats.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#101018] border border-slate-200 dark:border-[#1e1e2d] space-y-2">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
              <span>Social &amp; Document Presets</span>
            </h5>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              One-click standard dimensions for Instagram, Facebook, X, LinkedIn banners, YouTube thumbnails, and official biometric passport prints.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#101018] border border-slate-200 dark:border-[#1e1e2d] space-y-2">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Target File-Size Compression</span>
            </h5>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Set exact maximum KB caps (e.g. 100KB or 200KB) to satisfy strict upload limits for government, bank, and university portals.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Preview & Adjust Modal */}
      {adjustingItem && (
        <PhotoAdjustModal
          item={adjustingItem}
          isOpen={Boolean(adjustingItem)}
          onClose={() => setAdjustingItem(null)}
          onSave={handleSaveAdjustments}
          aspectRatio={config.aspectRatio}
          fit={config.fit}
          customRatioW={config.customRatioW}
          customRatioH={config.customRatioH}
        />
      )}
    </div>
  );
};
