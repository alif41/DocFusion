import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  RefreshCw,
  FileText,
  Stamp,
  HardDrive,
} from 'lucide-react';
import { WatermarkResultData } from '../types';
import { Button } from '../../common/Button';
import { formatFileSize } from '../../../utils';
import { PDFViewerModal } from '../../merge/PDFViewerModal';

interface ResultViewProps {
  result: WatermarkResultData;
  onReset: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ result, onReset }) => {
  const [downloadFilename, setDownloadFilename] = useState(result.filename);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleDownload = () => {
    const finalName = downloadFilename.toLowerCase().endsWith('.pdf')
      ? downloadFilename
      : `${downloadFilename}.pdf`;

    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="rounded-3xl border border-[#24243a] bg-[#0c0c16] p-8 sm:p-12 relative overflow-hidden shadow-2xl space-y-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3 relative z-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/25">
            Watermark Added Successfully
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Protected PDF is Ready
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Your watermark layer was embedded at native resolution while fully preserving existing selectable text, fonts, and vector graphics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          <div className="bg-[#121220] border border-[#222234] rounded-2xl p-4 text-center space-y-1">
            <div className="text-neutral-400 flex items-center justify-center gap-1.5 text-xs font-medium">
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              <span>Total Pages</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {result.originalPageCount}
            </div>
          </div>

          <div className="bg-[#121220] border border-[#222234] rounded-2xl p-4 text-center space-y-1">
            <div className="text-[#c084fc] flex items-center justify-center gap-1.5 text-xs font-medium">
              <Stamp className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Watermarked Pages</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {result.watermarkedPageCount}
            </div>
          </div>

          <div className="bg-[#121220] border border-[#222234] rounded-2xl p-4 text-center space-y-1">
            <div className="text-neutral-400 flex items-center justify-center gap-1.5 text-xs font-medium">
              <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
              <span>File Size</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {formatFileSize(result.fileSize)}
            </div>
          </div>
        </div>

        {/* Editable Filename */}
        <div className="bg-[#121220] border border-[#222234] rounded-2xl p-4 space-y-2 relative z-10">
          <label className="block text-xs font-medium text-neutral-400">
            Download File Name
          </label>
          <input
            type="text"
            value={downloadFilename}
            onChange={(e) => setDownloadFilename(e.target.value)}
            className="w-full bg-[#1a1a2e] border border-[#2e2e48] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#7c3aed] font-mono transition-colors"
          />
          <p className="text-[11px] text-neutral-500">
            You can customize the filename before downloading.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleDownload}
            leftIcon={<Download className="w-5 h-5" />}
            className="w-full sm:w-auto shadow-xl shadow-[#7c3aed]/25"
          >
            Download PDF
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setShowPreviewModal(true)}
            leftIcon={<Eye className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Preview PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onReset}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="w-full sm:w-auto text-neutral-300"
          >
            Watermark Another PDF
          </Button>
        </div>
      </div>

      {showPreviewModal && (
        <PDFViewerModal
          blob={result.blob}
          filename={downloadFilename}
          fileSize={result.fileSize}
          totalPageCount={result.originalPageCount}
          onClose={() => setShowPreviewModal(false)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};
