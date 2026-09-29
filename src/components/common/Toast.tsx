import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const borderColors = {
    success: 'border-[#6E9B63] bg-[#F7FAF6]',
    error: 'border-[#B65D5D] bg-[#FDF7F7]',
    warning: 'border-[#C59B45] bg-[#FCF9F3]',
    info: 'border-[#20221F] bg-[#FFFFFF]',
  };

  const tagLabels = {
    success: 'SUCCESS',
    error: 'NOTICE',
    warning: 'WARNING',
    info: 'INFO',
  };

  const tagColors = {
    success: 'text-[#4D7543] bg-[#EAF3E8]',
    error: 'text-[#A04545] bg-[#F9ECEC]',
    warning: 'text-[#9A742A] bg-[#F7EEDC]',
    info: 'text-[#20221F] bg-[#EEEEEC]',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between gap-4 p-4 rounded-xl border shadow-lg ${borderColors[toast.type]} transition-all duration-200`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${tagColors[toast.type]}`}
          >
            {tagLabels[toast.type]}
          </span>
          <h4 className="text-sm font-bold text-[#171717]">{toast.title}</h4>
        </div>
        <p className="text-xs text-[#555555] leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="px-2 py-0.5 text-[11px] font-mono font-semibold text-[#888888] hover:text-[#171717] hover:bg-[#000000]/5 rounded transition-colors shrink-0 cursor-pointer"
      >
        DISMISS
      </button>
    </div>
  );
};
