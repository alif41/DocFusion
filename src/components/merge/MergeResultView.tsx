import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  RefreshCw,
  FileCheck,
  Layers,
  HardDrive,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { MergeResultData } from '../../types/pdf';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils';
import { PDFViewerModal } from './PDFViewerModal';

interface MergeResultViewProps {
  result: MergeResultData;
  onReset: () => void;
}

export const MergeResultView: React.FC<MergeResultViewProps> = ({ result, onReset }) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(result.downloadUrl, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Success Card */}
      <div className="rounded-3xl border border-[#222238] bg-[#0c0c14] p-8 sm:p-12 relative overflow-hidden shadow-2xl space-y-8">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header with success checkmark */}
        <div className="text-center space-y-3 relative z-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/25">
            Merge Completed Successfully
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Documents Have Been Merged
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Successfully compiled {result.filesCount} source documents into a unified, high-fidelity master PDF.
          </p>
        </div>

        {/* Merged Document Info Box */}
        <div className="rounded-2xl border border-[#222234] bg-[#12121e] p-6 space-y-4 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white break-all">
                  {result.filename}
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  Ready for instant download and secure distribution
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30">
              PDF/A Compatible
            </span>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#1e1e2d] text-center">
            <div className="p-3 rounded-xl bg-[#161626] border border-[#252538]">
              <span className="text-[11px] font-mono text-neutral-400 block mb-1">Total Pages</span>
              <span className="text-base sm:text-lg font-bold text-white flex items-center justify-center gap-1.5">
                <Layers className="w-4 h-4 text-[#a78bfa]" />
                {result.pageCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#161626] border border-[#252538]">
              <span className="text-[11px] font-mono text-neutral-400 block mb-1">Merged File Size</span>
              <span className="text-base sm:text-lg font-bold text-white flex items-center justify-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                {formatFileSize(result.fileSize)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#161626] border border-[#252538]">
              <span className="text-[11px] font-mono text-neutral-400 block mb-1">Combined Files</span>
              <span className="text-base sm:text-lg font-bold text-white flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {result.filesCount}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownload}
              leftIcon={<Download className="w-5 h-5 text-white" />}
              className="w-full sm:w-auto shadow-xl shadow-[#7c3aed]/30 px-8 py-3.5 text-base font-semibold"
            >
              Download Merged PDF
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowPreviewModal(true)}
              leftIcon={<Eye className="w-4 h-4 text-[#a78bfa]" />}
              className="w-full sm:w-auto border-[#2b2b3f] hover:border-[#7c3aed]/50"
            >
              Preview Document
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-white/[0.04]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Merge More PDFs</span>
            </button>

            <span className="text-neutral-700">•</span>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-white/[0.04]"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>Open in New Tab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive High-Fidelity Canvas PDF Preview Modal */}
      {showPreviewModal && (
        <PDFViewerModal
          blob={result.blob}
          filename={result.filename}
          fileSize={result.fileSize}
          totalPageCount={result.pageCount}
          onClose={() => setShowPreviewModal(false)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};
