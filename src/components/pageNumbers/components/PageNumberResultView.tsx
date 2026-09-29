import React from 'react';
import {
  Download,
  Eye,
  RotateCcw,
  CheckCircle2,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { PageNumberResult } from '../types';
import { Button } from '../../common/Button';
import { formatFileSize } from '../../../utils';

interface PageNumberResultViewProps {
  result: PageNumberResult;
  onReset: () => void;
}

export const PageNumberResultView: React.FC<PageNumberResultViewProps> = ({
  result,
  onReset,
}) => {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.downloadUrl;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenPreview = () => {
    window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#26263a] shadow-xl text-center space-y-6">
        {/* Animated Success Badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Numbering Complete</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Your PDF is Ready!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
            Page numbers have been stamped into your document with vector typography and zero quality loss.
          </p>
        </div>

        {/* Statistics Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#171726] border border-slate-200 dark:border-[#26263a] grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">
              Pages Numbered
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
              {result.pagesNumberedCount} / {result.totalPages}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">
              Output Size
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
              {formatFileSize(result.newSize)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">
              Privacy
            </span>
            <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              100% In-Memory
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleDownload}
            leftIcon={<Download className="w-5 h-5 text-white" />}
            className="w-full sm:w-auto shadow-xl shadow-[#7c3aed]/25 font-bold px-8"
          >
            Download Numbered PDF
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleOpenPreview}
            leftIcon={<Eye className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Preview Document
          </Button>
        </div>

        {/* Reset / Process Another */}
        <div className="pt-4 border-t border-slate-100 dark:border-[#1e1e2e]">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Process another PDF document</span>
          </button>
        </div>
      </div>
    </div>
  );
};
