import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  RotateCcw,
  ArrowLeft,
  Eye,
  Info,
  Layers,
  Archive,
  Camera,
  Sparkles,
} from 'lucide-react';
import { PhotoConversionOutput, PhotoFileInfo, PhotoFormat } from './types';

interface ConversionResultProps {
  originalFiles: PhotoFileInfo[];
  output: PhotoConversionOutput;
  sourceFormat: PhotoFormat;
  targetFormat: PhotoFormat;
  onConvertMore: () => void;
  onBackToDashboard: () => void;
}

export const ConversionResult: React.FC<ConversionResultProps> = ({
  originalFiles,
  output,
  sourceFormat,
  targetFormat,
  onConvertMore,
  onBackToDashboard,
}) => {
  const [showPreview, setShowPreview] = useState(true);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalOriginalSize = originalFiles.reduce((acc, f) => acc + f.size, 0);
  const isPdfOutput = targetFormat === 'PDF';
  const isImageOutput = targetFormat !== 'PDF' && !output.isZip;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Celebration Header */}
      <div className="bg-[#121222] border border-[#2a2a44] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Conversion Complete
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Your photos have been successfully processed and structured into {targetFormat} format.
          </p>
        </div>

        {/* Comparison Summary Card */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          {/* Source Document */}
          <div className="p-4 rounded-2xl bg-[#161628] border border-[#26263e] space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-neutral-500">
              Source {originalFiles.length > 1 ? `(${originalFiles.length} files)` : 'Photo'}
            </span>
            <p className="text-sm font-bold text-white truncate">
              {originalFiles.length === 1 ? originalFiles[0].name : `${originalFiles.length} photos combined`}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 pt-0.5">
              <span className="px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 font-mono text-[10px]">
                {sourceFormat}
              </span>
              <span>•</span>
              <span>{formatBytes(totalOriginalSize)}</span>
              {originalFiles.length === 1 && originalFiles[0].width && (
                <>
                  <span>•</span>
                  <span>{originalFiles[0].width} × {originalFiles[0].height} px</span>
                </>
              )}
            </div>
          </div>

          {/* Converted Output */}
          <div className="p-4 rounded-2xl bg-[#19192e] border border-[#7c3aed]/40 space-y-1.5 shadow-lg shadow-[#7c3aed]/5">
            <span className="text-[10px] font-mono uppercase text-[#a78bfa]">
              Converted Output
            </span>
            <p className="text-sm font-bold text-white truncate">{output.filename}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 pt-0.5">
              <span className="px-2 py-0.5 rounded bg-[#7c3aed]/20 text-[#c084fc] font-mono text-[10px] font-semibold border border-[#7c3aed]/30">
                {targetFormat}
              </span>
              <span>•</span>
              <span className="text-white font-medium">{formatBytes(output.size)}</span>
              {output.width && output.height && (
                <>
                  <span>•</span>
                  <span>{output.width} × {output.height} px</span>
                </>
              )}
              {output.pagesCount && output.pagesCount > 1 && (
                <>
                  <span>•</span>
                  <span>{output.pagesCount} pages</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Camera Info if detected (for RAW) */}
        {output.detectedCamera && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-xs text-emerald-300 max-w-lg mx-auto">
            <Camera className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Detected Camera: <strong>{output.detectedCamera}</strong></span>
          </div>
        )}

        {/* Warning if any */}
        {output.warning && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2 text-xs text-amber-300 max-w-lg mx-auto">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{output.warning}</span>
          </div>
        )}

        {/* Actions Button Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={output.downloadUrl}
            download={output.filename}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-sm shadow-xl shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 hover:scale-[1.02] transition-all cursor-pointer"
          >
            {output.isZip ? (
              <>
                <Archive className="w-4 h-4" />
                <span>Download All as ZIP</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {targetFormat}</span>
              </>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
              {formatBytes(output.size)}
            </span>
          </a>

          <button
            type="button"
            onClick={onConvertMore}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#1a1a2e] hover:bg-[#23233c] text-white text-xs sm:text-sm font-semibold border border-[#31314e] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#a78bfa]" />
            <span>Convert More Photos</span>
          </button>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-transparent hover:bg-white/[0.04] text-neutral-400 hover:text-white text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Universal Photo Converter</span>
          </button>
        </div>
      </div>

      {/* Output Preview */}
      {showPreview && (
        <div className="bg-[#121222] border border-[#26263e] rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Eye className="w-4 h-4 text-[#a78bfa]" />
              <span>Converted Output Preview</span>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-[#a78bfa] hover:text-white transition-colors cursor-pointer"
            >
              Hide Preview
            </button>
          </div>

          <div className="w-full rounded-2xl overflow-hidden border border-[#2b2b42] bg-[#0c0c16] flex items-center justify-center p-3">
            {isPdfOutput ? (
              <iframe
                src={`${output.downloadUrl}#toolbar=0`}
                className="w-full h-[520px] border-none rounded-xl"
                title="Converted PDF Preview"
              />
            ) : isImageOutput ? (
              <img
                src={output.downloadUrl}
                alt={output.filename}
                className="max-h-[500px] object-contain rounded-xl shadow-lg"
              />
            ) : (
              <div className="p-8 text-center space-y-2">
                <Archive className="w-12 h-12 text-[#a78bfa] mx-auto" />
                <p className="text-sm font-bold text-white">{output.filename}</p>
                <p className="text-xs text-neutral-400">
                  Multiple converted photos bundled inside a clean ZIP archive.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
