import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileCode,
  Archive,
  Trash2,
  Plus,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { UploadedHtmlFile } from './types';

interface FileUploaderProps {
  files: UploadedHtmlFile[];
  onFilesAdded: (files: UploadedHtmlFile[]) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onSelectActiveFile: (file: UploadedHtmlFile) => void;
  selectedFileId?: string;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  onFilesAdded,
  onRemoveFile,
  onClearAll,
  onSelectActiveFile,
  selectedFileId,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);

    const added: UploadedHtmlFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!['.html', '.htm', '.zip'].includes(ext)) {
        setErrorMsg(`"${file.name}" is not a supported file. Please upload .html, .htm, or .zip archive.`);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        setErrorMsg(`"${file.name}" exceeds the 50MB maximum size limit.`);
        continue;
      }

      const id = `html_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      if (ext === '.zip') {
        // Upload package to server endpoint for safe extraction & bundling
        setIsProcessingZip(true);
        try {
          const form = new FormData();
          form.append('package', file);

          const res = await fetch('/api/html-to-pdf/upload-package', {
            method: 'POST',
            body: form,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.error || 'Failed to extract HTML ZIP package.');
          }

          const data = await res.json();
          added.push({
            id,
            file,
            name: data.filename || file.name.replace('.zip', '.html'),
            size: file.size,
            htmlContent: data.html,
            status: 'ready',
            isPackage: true,
          });
        } catch (err: any) {
          setErrorMsg(err.message || 'Error processing ZIP package.');
        } finally {
          setIsProcessingZip(false);
        }
      } else {
        // Read raw HTML text
        const text = await file.text();
        added.push({
          id,
          file,
          name: file.name,
          size: file.size,
          htmlContent: text,
          status: 'ready',
          isPackage: false,
        });
      }
    }

    if (added.length > 0) {
      onFilesAdded(added);
      onSelectActiveFile(added[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    await handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[#7c3aed] bg-[#7c3aed]/10 scale-[1.01] shadow-xl'
            : 'border-[#26263c] bg-[#121220]/80 hover:border-[#424264] hover:bg-[#151528]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".html,.htm,.zip"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center text-[#c084fc] shadow-md shadow-[#7c3aed]/10">
            {isProcessingZip ? (
              <Loader2 className="w-7 h-7 animate-spin text-[#a78bfa]" />
            ) : (
              <UploadCloud className={`w-7 h-7 ${isDragging ? 'animate-bounce' : ''}`} />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Upload HTML Files or ZIP Packages
            </h3>
            <p className="text-xs text-neutral-400">
              Drag &amp; drop single or batch documents (<code>.html</code>, <code>.htm</code>, <code>.zip</code>)
            </p>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-md shadow-[#7c3aed]/20 transition-all cursor-pointer"
          >
            Browse Local Files
          </button>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-neutral-400">
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">
              HTML + CSS + Assets
            </span>
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">
              Max 50MB
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Isolated sandbox
            </span>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Uploaded Files Table / List */}
      {files.length > 0 && (
        <div className="bg-[#121220] border border-[#24243a] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
              <FileCheck className="w-4 h-4 text-[#a78bfa]" />
              <span>Uploaded Documents ({files.length})</span>
            </div>

            <button
              type="button"
              onClick={onClearAll}
              disabled={disabled}
              className="text-neutral-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
            {files.map((file) => {
              const isSelected = file.id === selectedFileId;
              return (
                <div
                  key={file.id}
                  onClick={() => onSelectActiveFile(file)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a1a30] border-[#7c3aed] ring-1 ring-[#7c3aed]/40'
                      : 'bg-[#151526] border-[#252538] hover:border-[#3b3b54]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                      {file.isPackage ? (
                        <Archive className="w-4 h-4 text-amber-400" />
                      ) : (
                        <FileCode className="w-4 h-4 text-[#a78bfa]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                        <span>{formatBytes(file.size)}</span>
                        {file.isPackage && (
                          <span className="text-amber-400 font-semibold">• Package</span>
                        )}
                        {file.status === 'completed' && (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(file.id);
                    }}
                    disabled={disabled}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Remove File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
