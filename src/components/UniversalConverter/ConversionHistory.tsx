import React, { useState, useEffect } from 'react';
import { Clock, Trash2, ArrowRight, FileCheck, CheckCircle2 } from 'lucide-react';
import { ConversionHistoryItem } from './types';

interface ConversionHistoryProps {
  onSelectConversion?: (type: string) => void;
}

const STORAGE_KEY = 'docfusion_conversion_history';

export const getStoredHistory = (): ConversionHistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveHistoryItem = (item: ConversionHistoryItem) => {
  try {
    const current = getStoredHistory();
    // Keep max 20 recent items
    const updated = [item, ...current.filter((x) => x.id !== item.id)].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
};

export const ConversionHistory: React.FC<ConversionHistoryProps> = ({ onSelectConversion }) => {
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getStoredHistory());
  }, []);

  const handleClear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
    } catch {
      // ignore
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#10101c] border border-[#222236] rounded-3xl p-6 sm:p-7 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#a78bfa]" />
          <h3 className="text-sm font-bold text-white">Recent Conversions</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-400">
            {history.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-neutral-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="divide-y divide-[#1e1e30] max-h-72 overflow-y-auto scrollbar-thin">
        {history.map((item) => (
          <div
            key={item.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {item.originalFilename}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="text-xs text-[#a78bfa] truncate max-w-xs sm:max-w-md">
                  {item.convertedFilename}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                <span>{new Date(item.timestamp).toLocaleString()}</span>
                {item.fileSize > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatBytes(item.fileSize)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
