import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  RotateCcw,
  Eye,
  Archive,
  Edit2,
  Check,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { HtmlConversionResult } from './types';
import { ConvertedPdfViewer } from './ConvertedPdfViewer';

interface ConversionResultProps {
  result: HtmlConversionResult;
  onConvertAnother: () => void;
  onStartOver: () => void;
}

export const ConversionResult: React.FC<ConversionResultProps> = ({
  result,
  onConvertAnother,
  onStartOver,
}) => {
  const [filename, setFilename] = useState(result.filename);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(result.filename);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSaveFilename = () => {
    let clean = tempName.trim();
    if (!clean) clean = 'document';
    if (!clean.toLowerCase().endsWith('.pdf') && !result.isZip) {
      clean += '.pdf';
    }
    setFilename(clean);
    setIsEditingName(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Celebration Header */}
      <div className="bg-[#121222] border border-[#2a2a44] rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Conversion Complete
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Your HTML document has been successfully compiled into a professional PDF file.
          </p>
        </div>

        {/* Output Document Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#17172b] border border-[#2f2f4a] max-w-lg mx-auto text-left space-y-3 shadow-md">
          {/* Editable Filename */}
          <div className="flex items-center justify-between gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="flex-1 bg-[#10101e] border border-[#7c3aed] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveFilename}
                  className="p-1 rounded bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#a78bfa] shrink-0" />
                <span className="text-sm font-bold text-white truncate">{filename}</span>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-neutral-500 hover:text-white transition-colors"
                  title="Rename output file"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#7c3aed]/20 text-[#c084fc] font-bold border border-[#7c3aed]/30 shrink-0">
              {result.isZip ? 'ZIP' : 'PDF'}
            </span>
          </div>

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono border-t border-[#25253c] pt-2.5">
            <span>Size: <strong className="text-white">{formatBytes(result.size)}</strong></span>
            {result.pages > 0 && (
              <>
                <span>•</span>
                <span>Pages: <strong className="text-white">{result.pages}</strong></span>
              </>
            )}
            <span>•</span>
            <span className="text-emerald-400">100% Vector Quality</span>
          </div>
        </div>

        {/* Warnings if any */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2 text-xs text-amber-300 max-w-lg mx-auto">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{result.warnings[0]}</span>
          </div>
        )}

        {/* Action Button Strip */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={result.downloadUrl}
            download={filename}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-sm shadow-xl shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 hover:scale-[1.02] transition-all cursor-pointer"
          >
            {result.isZip ? (
              <>
                <Archive className="w-4 h-4" />
                <span>Download All as ZIP</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </a>

          {!result.isZip && (
            <a
              href={result.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#1b1b2e] hover:bg-[#25253e] text-white text-xs sm:text-sm font-semibold border border-[#2f2f48] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-[#a78bfa]" />
              <span>Open in New Tab</span>
            </a>
          )}

          <button
            type="button"
            onClick={onConvertAnother}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#161626] hover:bg-[#202034] text-neutral-300 hover:text-white text-xs sm:text-sm font-semibold border border-[#27273c] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#a78bfa]" />
            <span>Convert Another</span>
          </button>
        </div>
      </div>

      {/* Embedded Live PDF Result Viewport */}
      {!result.isZip && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-white px-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#a78bfa]" />
              <span>Converted PDF Preview</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              Interactive Canvas Viewer • Full Vector Quality
            </span>
          </div>

          <ConvertedPdfViewer
            blob={result.blob}
            downloadUrl={result.downloadUrl}
            filename={filename}
          />
        </div>
      )}
    </div>
  );
};
