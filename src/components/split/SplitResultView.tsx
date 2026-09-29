import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  RefreshCw,
  Archive,
  FileCheck,
  Layers,
  HardDrive,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { SplitResultData, SplitResultFile } from '../../types/pdf';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils';
import { PDFViewerModal } from '../merge/PDFViewerModal';

interface SplitResultViewProps {
  result: SplitResultData;
  onReset: () => void;
}

export const SplitResultView: React.FC<SplitResultViewProps> = ({ result, onReset }) => {
  const [previewFile, setPreviewFile] = useState<SplitResultFile | null>(null);

  const handleDownloadFile = (file: SplitResultFile) => {
    const link = document.createElement('a');
    link.href = file.downloadUrl;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadZip = () => {
    if (!result.zipDownloadUrl || !result.zipFilename) return;
    const link = document.createElement('a');
    link.href = result.zipDownloadUrl;
    link.download = result.zipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isMultiFile = result.files.length > 1;

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
            Splitting Completed Successfully
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Document Has Been Split
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Generated {result.files.length} {result.files.length === 1 ? 'document' : 'independent documents'} from "{result.originalFilename}" ({result.totalOriginalPages} pages).
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
          <div className="p-4 rounded-2xl bg-[#12121e] border border-[#202030] text-center">
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Generated Files</span>
            <span className="text-lg sm:text-xl font-bold text-white flex items-center justify-center gap-1.5">
              <Layers className="w-4 h-4 text-[#a78bfa]" />
              {result.files.length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#12121e] border border-[#202030] text-center">
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Source Pages</span>
            <span className="text-lg sm:text-xl font-bold text-white flex items-center justify-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              {result.totalOriginalPages}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#12121e] border border-[#202030] text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Packaging</span>
            <span className="text-lg sm:text-xl font-bold text-white flex items-center justify-center gap-1.5">
              <Archive className="w-4 h-4 text-amber-400" />
              {isMultiFile ? 'ZIP Archive' : 'Standalone PDF'}
            </span>
          </div>
        </div>

        {/* Primary Download CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10 pt-2">
          {isMultiFile && result.zipDownloadUrl ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownloadZip}
              leftIcon={<Archive className="w-5 h-5 text-white" />}
              className="w-full sm:w-auto shadow-xl shadow-[#7c3aed]/30 px-8 py-3.5 text-base font-semibold"
            >
              Download All as ZIP ({formatFileSize(result.zipSize || 0)})
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleDownloadFile(result.files[0])}
              leftIcon={<Download className="w-5 h-5 text-white" />}
              className="w-full sm:w-auto shadow-xl shadow-[#7c3aed]/30 px-8 py-3.5 text-base font-semibold"
            >
              Download Split PDF ({formatFileSize(result.files[0]?.fileSize || 0)})
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            onClick={onReset}
            leftIcon={<RefreshCw className="w-4 h-4 text-neutral-400" />}
            className="w-full sm:w-auto"
          >
            Split Another PDF
          </Button>
        </div>
      </div>

      {/* Generated Documents Listing */}
      <div className="rounded-3xl border border-[#222238] bg-[#0c0c14] p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1c1c2a]">
          <div>
            <h3 className="text-base font-bold text-white">Generated Document Files</h3>
            <p className="text-xs text-neutral-400">
              Download individual documents or preview any file in the canvas viewer
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#181826] text-neutral-300 border border-[#26263a]">
            {result.files.length} items
          </span>
        </div>

        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {result.files.map((file, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#1f1f2e] bg-[#12121e] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#2f2f45] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#a78bfa] flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md font-mono">
                    {file.filename}
                  </h4>
                  <p className="text-xs text-neutral-400 font-mono flex items-center gap-2">
                    <span>{file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}</span>
                    <span>•</span>
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>•</span>
                    <span className="text-[#a78bfa]">
                      p.{file.pagesIncluded.join(', ')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPreviewFile(file)}
                  leftIcon={<Eye className="w-3.5 h-3.5 text-[#a78bfa]" />}
                  className="text-xs"
                >
                  Preview
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadFile(file)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive High-Fidelity Canvas PDF Preview Modal */}
      {previewFile && (
        <PDFViewerModal
          blob={previewFile.blob}
          filename={previewFile.filename}
          fileSize={previewFile.fileSize}
          totalPageCount={previewFile.pageCount}
          onClose={() => setPreviewFile(null)}
          onDownload={() => handleDownloadFile(previewFile)}
        />
      )}
    </div>
  );
};
