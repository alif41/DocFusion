import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  RefreshCw,
  HardDrive,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { CompressResultData } from '../../types/pdf';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils';
import { PDFViewerModal } from '../merge/PDFViewerModal';

interface CompressResultViewProps {
  result: CompressResultData;
  onReset: () => void;
}

export const CompressResultView: React.FC<CompressResultViewProps> = ({ result, onReset }) => {
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    const baseName = result.originalFilename.replace(/\.pdf$/i, '');
    link.download = `${baseName}_compressed.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSavingsPositive = result.savingsPercent > 0;
  const isAlreadyOptimized = result.alreadyOptimized || !isSavingsPositive;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Success Card Header */}
      <div className="rounded-3xl border border-[#222238] bg-[#0c0c14] p-8 sm:p-12 relative overflow-hidden shadow-2xl space-y-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3 relative z-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/25">
            {isAlreadyOptimized ? 'Maximum Density Verified' : 'Compression Successful'}
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isAlreadyOptimized ? 'Document Already at Optimal Size' : 'Your PDF is Optimized & Ready'}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            {isAlreadyOptimized ? (
              <span>
                "{result.originalFilename}" is already stripped of unnecessary streams and metadata. We verified and protected its structure so no extra bytes were added.
              </span>
            ) : (
              <span>
                Successfully compressed "{result.originalFilename}" ({result.pageCount} {result.pageCount === 1 ? 'page' : 'pages'}), saving{' '}
                <strong className="text-emerald-400 font-mono">{formatFileSize(result.savedBytes)}</strong> ({result.savingsPercent}% reduction).
              </span>
            )}
          </p>
        </div>

        {/* Compression Comparison Card */}
        <div className="rounded-2xl border border-[#222238] bg-[#12121e] p-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Original Size */}
            <div className="text-center sm:text-left space-y-1 flex-1">
              <span className="text-[11px] font-mono text-neutral-400 block uppercase tracking-wider">
                Original Size
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-neutral-300 font-mono">
                {formatFileSize(result.originalSize)}
              </span>
            </div>

            {/* Central Badge */}
            <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl bg-[#191929] border border-[#2d2d42] min-w-[170px]">
              {isSavingsPositive ? (
                <>
                  <div className="flex items-center gap-1 text-emerald-400 font-extrabold font-mono text-xl sm:text-2xl">
                    <TrendingDown className="w-6 h-6 stroke-[2.5]" />
                    <span>-{result.savingsPercent}%</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300/80 uppercase tracking-wider">
                    {formatFileSize(result.savedBytes)} Saved
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold font-mono text-base sm:text-lg">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <span>Optimal Density</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                    0 Bytes Inflated
                  </span>
                </>
              )}
            </div>

            {/* Compressed Size */}
            <div className="text-center sm:text-right space-y-1 flex-1">
              <span className="text-[11px] font-mono text-emerald-400 block uppercase tracking-wider font-bold">
                Final Size
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-white font-mono text-emerald-300">
                {formatFileSize(result.compressedSize)}
              </span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownload}
            leftIcon={<Download className="w-5 h-5 text-white" />}
            className="w-full sm:w-auto shadow-xl shadow-[#7c3aed]/30 px-8 py-3.5 text-base font-semibold"
          >
            Download Compressed PDF ({formatFileSize(result.compressedSize)})
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowPreviewModal(true)}
            leftIcon={<Eye className="w-4 h-4 text-[#a78bfa]" />}
            className="w-full sm:w-auto"
          >
            Preview Document
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onReset}
            leftIcon={<RefreshCw className="w-4 h-4 text-neutral-400" />}
            className="w-full sm:w-auto"
          >
            Compress Another
          </Button>
        </div>
      </div>

      {/* Interactive In-App Canvas PDF Viewer */}
      {showPreviewModal && (
        <PDFViewerModal
          blob={result.blob}
          filename={`${result.originalFilename.replace(/\.pdf$/i, '')}_compressed.pdf`}
          fileSize={result.compressedSize}
          totalPageCount={result.pageCount}
          onClose={() => setShowPreviewModal(false)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};
