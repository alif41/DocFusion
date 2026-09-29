import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Trash2,
  FileSignature,
  Activity,
  LogOut,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUserDocuments,
  deleteDocumentRecord,
  getUserSignatures,
  deleteUserSignature,
  getUserActivityLogs,
  DocumentRecord,
  SavedSignatureRecord,
  ActivityLogRecord,
} from '../../services/firestoreService';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils';

interface UserDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserDocumentsModal: React.FC<UserDocumentsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, userProfile, signOutUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'documents' | 'signatures' | 'activity'>('documents');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [signatures, setSignatures] = useState<SavedSignatureRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [docs, sigs, logs] = await Promise.all([
        getUserDocuments(user.uid),
        getUserSignatures(user.uid),
        getUserActivityLogs(user.uid),
      ]);
      setDocuments(docs);
      setSignatures(sigs);
      setActivities(logs);
    } catch (err) {
      console.error('Error fetching user data from Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const handleDeleteDoc = async (id: string) => {
    await deleteDocumentRecord(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDeleteSig = async (id: string) => {
    await deleteUserSignature(id);
    setSignatures((prev) => prev.filter((s) => s.id !== id));
  };

  if (!isOpen || !user) return null;

  const displayName = userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'User';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full max-h-[85vh] flex flex-col bg-white dark:bg-[#0d0d16] border border-slate-200 dark:border-[#242436] rounded-3xl shadow-2xl overflow-hidden cursor-default transition-colors"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[#1c1c2b] flex items-center justify-between bg-slate-50 dark:bg-[#11111c]">
          <div className="flex items-center gap-3.5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-12 h-12 rounded-2xl border border-slate-300 dark:border-[#3b3b55] object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#38bdf8] flex items-center justify-center text-white font-bold text-lg shadow-md">
                {displayName[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{displayName}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#a78bfa] border border-[#7c3aed]/30 uppercase font-semibold">
                  Cloud Synced
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              title="Refresh Firestore Data"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-[#1e1e2d] bg-slate-50/70 dark:bg-[#0f0f18] px-6 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'documents'
                ? 'border-[#7c3aed] text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Processed Documents ({documents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signatures')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'signatures'
                ? 'border-[#7c3aed] text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" />
            <span>Saved Signatures ({signatures.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'border-[#7c3aed] text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity Log ({activities.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3 scrollbar-thin">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-neutral-400 text-xs font-mono">
              <span className="w-5 h-5 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
              <span>Syncing with Cloud Firestore...</span>
            </div>
          ) : activeTab === 'documents' ? (
            documents.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-400 dark:text-neutral-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">No documents processed yet</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                  When you merge, split, compress, convert, or edit documents, your processing history will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#141422] dark:border-[#232338] hover:border-[#7c3aed]/40 dark:hover:border-[#33334d] flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                            {doc.title}
                          </h4>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700">
                            {doc.toolType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                          {doc.pageCount && <span>{doc.pageCount} pages</span>}
                          {doc.finalSize && <span>{formatFileSize(doc.finalSize)}</span>}
                          {doc.savedBytes && doc.savedBytes > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Saved {formatFileSize(doc.savedBytes)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete record from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'signatures' ? (
            signatures.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileSignature className="w-10 h-10 text-slate-400 dark:text-neutral-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">No saved signatures</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                  Create custom drawn or typed signatures inside the PDF Editor to save them securely.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#141422] dark:border-[#232338] space-y-3"
                  >
                    <div className="h-16 flex items-center justify-center bg-white dark:bg-[#0c0c14] rounded-xl p-2 border border-slate-200 dark:border-[#232338]">
                      <img src={sig.dataUrl} alt={sig.label} className="max-h-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">{sig.label}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSig(sig.id)}
                        className="text-slate-400 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            activities.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Activity className="w-10 h-10 text-slate-400 dark:text-neutral-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">No activity logged</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                  Your actions across the DocFusion tools will appear here chronologically.
                </p>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#141422] dark:border-[#232338] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#7c3aed] dark:text-[#a78bfa] font-bold">[{act.toolType}]</span>
                      <span className="text-slate-800 dark:text-neutral-200">{act.action}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                      {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#1c1c2b] bg-slate-50 dark:bg-[#11111c] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              signOutUser();
              onClose();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Window
          </Button>
        </div>
      </div>
    </div>
  );
};
