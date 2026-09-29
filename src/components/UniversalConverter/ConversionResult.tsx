import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  RotateCcw,
  ArrowLeft,
  FileCheck,
  Layers,
  Eye,
  Info,
  ExternalLink,
} from 'lucide-react';
import { ConversionOutputInfo, DocumentFormat } from './types';
import { DownloadButton } from './DownloadButton';

interface ConversionResultProps {
  originalFile: { name: string; size: number; format: DocumentFormat };
  output: ConversionOutputInfo;
  onConvertAnother: () => void;
  onBackToDashboard: () => void;
}

export const ConversionResult: React.FC<ConversionResultProps> = ({
  originalFile,
  output,
  onConvertAnother,
  onBackToDashboard,
}) => {
  const [showPreview, setShowPreview] = useState(output.targetFormat === 'PDF');

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isPdfOutput = output.targetFormat === 'PDF';

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
            Your document has been successfully processed and structured into {output.targetFormat} format.
          </p>
        </div>

        {/* Comparison Summary Card */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          {/* Source */}
          <div className="p-4 rounded-2xl bg-[#161628] border border-[#26263e] space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500">Source Document</span>
            <p className="text-sm font-bold text-white truncate">{originalFile.name}</p>
            <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1">
              <span className="px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 font-mono text-[10px]">
                {originalFile.format}
              </span>
              <span>•</span>
              <span>{formatBytes(originalFile.size)}</span>
            </div>
          </div>

          {/* Converted Target */}
          <div className="p-4 rounded-2xl bg-[#19192e] border border-[#7c3aed]/40 space-y-1 shadow-lg shadow-[#7c3aed]/5">
            <span className="text-[10px] font-mono uppercase text-[#a78bfa]">Converted Output</span>
            <p className="text-sm font-bold text-white truncate">{output.filename}</p>
            <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1">
              <span className="px-2 py-0.5 rounded bg-[#7c3aed]/20 text-[#c084fc] font-mono text-[10px] font-semibold border border-[#7c3aed]/30">
                {output.targetFormat}
              </span>
              <span>•</span>
              <span className="text-white font-medium">{formatBytes(output.size)}</span>
              {output.pageCount && (
                <>
                  <span>•</span>
                  <span>{output.pageCount} pages</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Warning if any */}
        {output.warning && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2 text-xs text-amber-300 max-w-lg mx-auto">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{output.warning}</span>
          </div>
        )}

        {/* Actions Button Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <DownloadButton
            downloadUrl={output.downloadUrl}
            filename={output.filename}
            sizeFormatted={formatBytes(output.size)}
            className="w-full sm:w-auto"
          />

          <button
            type="button"
            onClick={onConvertAnother}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#1a1a2e] hover:bg-[#23233c] text-white text-xs sm:text-sm font-semibold border border-[#31314e] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#a78bfa]" />
            <span>Convert Another</span>
          </button>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-transparent hover:bg-white/[0.04] text-neutral-400 hover:text-white text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Universal Doc Converter</span>
          </button>
        </div>
      </div>

      {/* Embedded In-Browser Preview (for PDF target format) */}
      {isPdfOutput && (
        <div className="bg-[#121222] border border-[#26263e] rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Eye className="w-4 h-4 text-[#a78bfa]" />
              <span>In-Browser PDF Output Preview</span>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-[#a78bfa] hover:text-white transition-colors cursor-pointer"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>

          {showPreview && (
            <div className="w-full h-[540px] rounded-2xl overflow-hidden border border-[#2b2b42] bg-[#0c0c16]">
              <iframe
                src={`${output.downloadUrl}#toolbar=0`}
                className="w-full h-full border-none"
                title="Converted PDF Preview"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
