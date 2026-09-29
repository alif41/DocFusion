import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  EditablePage,
  DocumentElement,
  TextElement,
  ImageElement,
  TableElement,
  SearchMatch,
  AnalysisProgress,
} from './types';
import { HistoryManager } from './HistoryManager';
import { EditorToolbar } from './EditorToolbar';
import { PageSidebar } from './PageSidebar';
import { PageCanvas } from './PageCanvas';
import { SearchReplace } from './SearchReplace';
import { exportDocumentToPDF } from './DocumentExporter';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RotateCcw,
  Sparkles,
  X,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { recordDocumentOperation } from '../../services/firestoreService';

interface DocumentEditorProps {
  initialPages: EditablePage[];
  initialFileName: string;
  originalBytes?: ArrayBuffer | null;
  isOCRUsed?: boolean;
  ocrStats?: {
    pagesScanned: number;
    wordsRecognized: number;
    avgConfidence: number;
  };
  onStartNewDocument?: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialPages,
  initialFileName,
  originalBytes,
  isOCRUsed = false,
  ocrStats,
  onStartNewDocument,
}) => {
  const { user } = useAuth();

  // Document Pages State
  const [pages, setPages] = useState<EditablePage[]>(initialPages);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Document Title
  const cleanInitName = initialFileName.replace(/\.pdf$/i, '');
  const [docTitle, setDocTitle] = useState<string>(cleanInitName || 'Untitled_Document');

  // History Manager for Undo/Redo
  const historyRef = useRef<HistoryManager>(new HistoryManager(40));
  const [historyChangeCount, setHistoryChangeCount] = useState<number>(0);

  // Autosave status
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const autosaveTimerRef = useRef<any>(null);

  // Search & Replace
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // UI Modals
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [showOCRReviewModal, setShowOCRReviewModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; stage: string }>({
    percent: 0,
    stage: '',
  });
  const [exportResult, setExportResult] = useState<{ url: string; size: number } | null>(null);

  // Initial snapshot copy for "Restore Original"
  const originalPagesBackup = useRef<EditablePage[]>(JSON.parse(JSON.stringify(initialPages)));

  // Current selected page
  const currentPage = pages[currentPageIndex] || pages[0];

  // Currently selected element
  const selectedElement = useMemo(() => {
    if (!selectedElementId || !currentPage) return null;
    return currentPage.elements.find((el) => el.id === selectedElementId) || null;
  }, [selectedElementId, currentPage]);

  // Record undo state before mutations
  const recordHistory = useCallback(
    (description?: string) => {
      historyRef.current.record(pages, currentPageIndex, description);
      setHistoryChangeCount((c) => c + 1);
    },
    [pages, currentPageIndex]
  );

  // Trigger autosave (debounced)
  const triggerAutosave = useCallback(
    (newPages: EditablePage[]) => {
      setAutosaveStatus('saving');
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

      autosaveTimerRef.current = setTimeout(() => {
        try {
          const draftKey = `docfusion_draft_${docTitle}`;
          localStorage.setItem(
            draftKey,
            JSON.stringify({
              title: docTitle,
              pages: newPages,
              updatedAt: Date.now(),
            })
          );
          setAutosaveStatus('saved');
        } catch (e) {
          console.warn('Autosave quota reached or error:', e);
          setAutosaveStatus('saved');
        }
      }, 700);
    },
    [docTitle]
  );

  // 1. Undo & Redo Handlers
  const handleUndo = useCallback(() => {
    const prev = historyRef.current.undo(pages, currentPageIndex);
    if (prev) {
      setPages(prev.pages);
      setCurrentPageIndex(Math.min(prev.currentPageIndex, prev.pages.length - 1));
      setHistoryChangeCount((c) => c + 1);
      triggerAutosave(prev.pages);
    }
  }, [pages, currentPageIndex, triggerAutosave]);

  const handleRedo = useCallback(() => {
    const next = historyRef.current.redo(pages, currentPageIndex);
    if (next) {
      setPages(next.pages);
      setCurrentPageIndex(Math.min(next.currentPageIndex, next.pages.length - 1));
      setHistoryChangeCount((c) => c + 1);
      triggerAutosave(next.pages);
    }
  }, [pages, currentPageIndex, triggerAutosave]);

  // Keyboard Shortcuts (Undo, Redo, Search, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing inside an input/contenteditable
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSelectedElementId(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && selectedElementId) {
        e.preventDefault();
        handleDeleteElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedElementId]);

  // 2. Element Modifications
  const handleUpdateElement = (id: string, updates: Partial<DocumentElement>) => {
    recordHistory('Update element');
    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== currentPageIndex) return page;
      return {
        ...page,
        elements: page.elements.map((el) => {
          if (el.id !== id) return el;
          return { ...el, ...updates } as DocumentElement;
        }),
      };
    });
    setPages(newPages);
    triggerAutosave(newPages);
  };

  const handleUpdateSelectedText = (updates: Partial<TextElement>) => {
    if (!selectedElementId) return;
    handleUpdateElement(selectedElementId, updates);
  };

  const handleDeleteElement = (id: string) => {
    recordHistory('Delete element');
    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== currentPageIndex) return page;
      return {
        ...page,
        elements: page.elements.filter((el) => el.id !== id),
      };
    });
    setPages(newPages);
    if (selectedElementId === id) setSelectedElementId(null);
    triggerAutosave(newPages);
  };

  // 3. Insert Elements
  const handleInsertTextBox = () => {
    recordHistory('Insert text box');
    const newId = `text_user_${Date.now()}`;
    const newTextEl: TextElement = {
      id: newId,
      type: 'paragraph',
      x: 60,
      y: 120,
      width: 250,
      height: 35,
      text: 'Type text here...',
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      strikethrough: false,
      color: '#111827',
      backgroundColor: 'transparent',
      textAlign: 'left',
      lineHeight: 1.35,
    };

    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== currentPageIndex) return page;
      return { ...page, elements: [...page.elements, newTextEl] };
    });
    setPages(newPages);
    setSelectedElementId(newId);
    triggerAutosave(newPages);
  };

  const handleInsertHeading = () => {
    recordHistory('Insert heading');
    const newId = `heading_user_${Date.now()}`;
    const newHeadingEl: TextElement = {
      id: newId,
      type: 'heading',
      x: 60,
      y: 90,
      width: 320,
      height: 45,
      text: 'Heading Title',
      fontFamily: 'Inter',
      fontSize: 22,
      fontWeight: 'bold',
      fontStyle: 'normal',
      underline: false,
      strikethrough: false,
      color: '#111827',
      backgroundColor: 'transparent',
      textAlign: 'left',
    };

    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== currentPageIndex) return page;
      return { ...page, elements: [...page.elements, newHeadingEl] };
    });
    setPages(newPages);
    setSelectedElementId(newId);
    triggerAutosave(newPages);
  };

  const handleInsertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return;

      recordHistory('Insert image');
      const newImgEl: ImageElement = {
        id: `img_user_${Date.now()}`,
        type: 'image',
        x: 80,
        y: 150,
        width: 180,
        height: 120,
        src,
        opacity: 1,
      };

      const newPages = pages.map((page, pIdx) => {
        if (pIdx !== currentPageIndex) return page;
        return { ...page, elements: [...page.elements, newImgEl] };
      });
      setPages(newPages);
      setSelectedElementId(newImgEl.id);
      triggerAutosave(newPages);
    };
    reader.readAsDataURL(file);
  };

  const handleInsertTable = () => {
    recordHistory('Insert table');
    const rows = 3;
    const cols = 3;
    const cells = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        id: `cell_${r}_${c}_${Date.now()}`,
        text: r === 0 ? `Header ${c + 1}` : `Row ${r}, Col ${c + 1}`,
        fontSize: 10,
        fontWeight: r === 0 ? ('bold' as const) : ('normal' as const),
      }))
    );

    const newTableEl: TableElement = {
      id: `table_user_${Date.now()}`,
      type: 'table',
      x: 60,
      y: 180,
      width: 320,
      height: 90,
      rows,
      cols,
      cells,
      borderColor: '#94a3b8',
      borderWidth: 1,
    };

    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== currentPageIndex) return page;
      return { ...page, elements: [...page.elements, newTableEl] };
    });
    setPages(newPages);
    setSelectedElementId(newTableEl.id);
    triggerAutosave(newPages);
  };

  // 4. Page Management Handlers
  const handleAddBlankPage = () => {
    recordHistory('Add blank page');
    const newPageNum = pages.length + 1;
    const newPage: EditablePage = {
      id: `blank_page_${Date.now()}`,
      pageNumber: newPageNum,
      width: 595, // A4 standard pt
      height: 842,
      rotation: 0,
      elements: [],
    };
    const newPages = [...pages, newPage];
    setPages(newPages);
    setCurrentPageIndex(newPages.length - 1);
    triggerAutosave(newPages);
  };

  const handleDuplicatePage = (index: number) => {
    recordHistory('Duplicate page');
    const sourcePage = pages[index];
    const duplicated: EditablePage = {
      ...JSON.parse(JSON.stringify(sourcePage)),
      id: `page_dup_${Date.now()}`,
      pageNumber: pages.length + 1,
    };
    const newPages = [...pages.slice(0, index + 1), duplicated, ...pages.slice(index + 1)];
    setPages(newPages);
    setCurrentPageIndex(index + 1);
    triggerAutosave(newPages);
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    recordHistory('Delete page');
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setCurrentPageIndex(Math.max(0, Math.min(index, newPages.length - 1)));
    triggerAutosave(newPages);
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || toIndex >= pages.length) return;
    recordHistory('Move page');
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    setPages(newPages);
    setCurrentPageIndex(toIndex);
    triggerAutosave(newPages);
  };

  // 5. Document-Wide Search & Replace
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchMatch[] = [];

    pages.forEach((page, pIdx) => {
      page.elements.forEach((el) => {
        if (el.type === 'image' || el.type === 'shape') return;

        if (el.type === 'table') {
          const tbl = el as TableElement;
          tbl.cells.forEach((row) => {
            row.forEach((cell) => {
              if (cell.text && cell.text.toLowerCase().includes(q)) {
                results.push({
                  pageIndex: pIdx,
                  elementId: el.id,
                  textSnippet: cell.text,
                  startIndex: cell.text.toLowerCase().indexOf(q),
                  endIndex: cell.text.toLowerCase().indexOf(q) + q.length,
                });
              }
            });
          });
        } else {
          const txt = el as TextElement;
          if (txt.text && txt.text.toLowerCase().includes(q)) {
            let start = 0;
            const fullLower = txt.text.toLowerCase();
            while ((start = fullLower.indexOf(q, start)) !== -1) {
              results.push({
                pageIndex: pIdx,
                elementId: el.id,
                textSnippet: txt.text.substring(Math.max(0, start - 15), Math.min(txt.text.length, start + q.length + 15)),
                startIndex: start,
                endIndex: start + q.length,
              });
              start += q.length;
            }
          }
        }
      });
    });
    return results;
  }, [pages, searchQuery]);

  const handleNavigateMatch = (direction: 'next' | 'prev') => {
    if (searchMatches.length === 0) return;
    let nextIdx = direction === 'next' ? currentMatchIndex + 1 : currentMatchIndex - 1;
    if (nextIdx >= searchMatches.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = searchMatches.length - 1;
    setCurrentMatchIndex(nextIdx);

    const match = searchMatches[nextIdx];
    if (match) {
      setCurrentPageIndex(match.pageIndex);
      setSelectedElementId(match.elementId);
    }
  };

  const handleReplaceCurrent = () => {
    if (searchMatches.length === 0 || !searchQuery) return;
    const match = searchMatches[currentMatchIndex];
    if (!match) return;

    recordHistory('Replace text match');
    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== match.pageIndex) return page;
      return {
        ...page,
        elements: page.elements.map((el) => {
          if (el.id !== match.elementId) return el;
          if (el.type === 'table') {
            const tbl = el as TableElement;
            return {
              ...tbl,
              cells: tbl.cells.map((row) =>
                row.map((cell) => ({
                  ...cell,
                  text: cell.text.replace(searchQuery, replaceQuery),
                }))
              ),
            };
          }
          const txt = el as TextElement;
          return {
            ...txt,
            text: txt.text.replace(searchQuery, replaceQuery),
          };
        }),
      };
    });
    setPages(newPages);
    triggerAutosave(newPages);
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    recordHistory('Replace all text');
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    const newPages = pages.map((page) => ({
      ...page,
      elements: page.elements.map((el) => {
        if (el.type === 'table') {
          const tbl = el as TableElement;
          return {
            ...tbl,
            cells: tbl.cells.map((row) =>
              row.map((cell) => ({
                ...cell,
                text: cell.text.replace(regex, replaceQuery),
              }))
            ),
          };
        }
        if (el.type === 'image' || el.type === 'shape') return el;
        const txt = el as TextElement;
        return {
          ...txt,
          text: txt.text.replace(regex, replaceQuery),
        };
      }),
    }));

    setPages(newPages);
    triggerAutosave(newPages);
  };

  // 6. Restore Original Handlers
  const handleRestoreOriginalConfirm = () => {
    recordHistory('Restore original PDF');
    const restored = JSON.parse(JSON.stringify(originalPagesBackup.current));
    setPages(restored);
    setCurrentPageIndex(0);
    setSelectedElementId(null);
    setShowRestoreModal(false);
    triggerAutosave(restored);
  };

  // 7. Export PDF
  const handleExportPDF = async (customFilename?: string) => {
    setIsExporting(true);
    setExportProgress({ percent: 10, stage: 'Starting export engine...' });

    try {
      const finalName = customFilename || (docTitle.endsWith('.pdf') ? docTitle : `${docTitle}.pdf`);
      const result = await exportDocumentToPDF({
        pages,
        fileName: finalName,
        onProgress: (pct, stage) => {
          setExportProgress({ percent: pct, stage });
        },
      });

      setExportResult(result);

      // Trigger browser download
      const a = document.createElement('a');
      a.href = result.url;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Record Firestore transaction if signed in
      if (user) {
        recordDocumentOperation(user.uid, {
          title: finalName,
          toolType: 'edit',
          pageCount: pages.length,
          finalSize: result.size,
          metadata: {
            isOCRUsed,
            elementsCount: pages.reduce((sum, p) => sum + p.elements.length, 0),
          },
        }).catch((e) => console.warn('Could not record Firestore op:', e));
      }
    } catch (err: any) {
      console.error('Export PDF error:', err);
      alert('Export failed: ' + (err?.message || 'Unknown error occurred while generating PDF.'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAsNewPDF = () => {
    const newName = prompt('Enter a name for the new PDF copy:', `${docTitle}_edited.pdf`);
    if (newName && newName.trim()) {
      handleExportPDF(newName.trim());
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] w-full overflow-hidden bg-[#0c0c16] text-white">
      {/* 1. Document Top Ribbon Toolbar */}
      <EditorToolbar
        canUndo={historyRef.current.canUndo()}
        canRedo={historyRef.current.canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        selectedElement={selectedElement}
        onUpdateSelectedText={handleUpdateSelectedText}
        onInsertTextBox={handleInsertTextBox}
        onInsertHeading={handleInsertHeading}
        onInsertImage={handleInsertImage}
        onInsertTable={handleInsertTable}
        onDeleteSelected={() => selectedElementId && handleDeleteElement(selectedElementId)}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        onExportPDF={() => handleExportPDF()}
        onSaveAsNewPDF={handleSaveAsNewPDF}
        onRestoreOriginal={() => setShowRestoreModal(true)}
        autosaveStatus={autosaveStatus}
        isOCRUsed={isOCRUsed}
        docTitle={docTitle}
        onDocTitleChange={setDocTitle}
      />

      {/* 2. Main Workspace (Sidebar + Canvas + Properties) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Page Thumbnails & Navigation Sidebar */}
        <PageSidebar
          pages={pages}
          currentPageIndex={currentPageIndex}
          onSelectPage={(idx) => {
            setCurrentPageIndex(idx);
            setSelectedElementId(null);
          }}
          onAddBlankPage={handleAddBlankPage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
          zoom={zoom}
          onZoomChange={setZoom}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Center: Document Canvas (Paper) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <PageCanvas
            page={currentPage}
            scale={zoom}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
          />

          {/* Bottom Floating Bar: Quick Page Jump & OCR Review Notice */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#141424]/90 backdrop-blur border border-[#2d2d48] px-4 py-2 rounded-2xl shadow-xl flex items-center gap-4 text-xs z-20">
            <span className="text-neutral-400">
              Page <strong className="text-white">{currentPageIndex + 1}</strong> of {pages.length}
            </span>

            {isOCRUsed && (
              <>
                <div className="h-3 w-px bg-[#2d2d48]" />
                <button
                  onClick={() => setShowOCRReviewModal(true)}
                  className="flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 font-semibold cursor-pointer underline decoration-cyan-500/50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Review OCR ({ocrStats?.avgConfidence || 85}%)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Floating Search & Replace Window */}
        <SearchReplace
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          searchQuery={searchQuery}
          onSearchQueryChange={(q) => {
            setSearchQuery(q);
            setCurrentMatchIndex(0);
          }}
          replaceQuery={replaceQuery}
          onReplaceQueryChange={setReplaceQuery}
          matches={searchMatches}
          currentMatchIndex={currentMatchIndex}
          onNavigateMatch={handleNavigateMatch}
          onReplaceCurrent={handleReplaceCurrent}
          onReplaceAll={handleReplaceAll}
        />
      </div>

      {/* 3. Restore Original Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141424] border border-[#2d2d44] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Restore Original Document?</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                This will discard all edits, added text, adjusted formatting, and reordered pages, reverting
                the document to the original uploaded PDF. This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 rounded-xl bg-[#1c1c2e] hover:bg-[#25253e] text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreOriginalConfirm}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow cursor-pointer"
              >
                Yes, Restore Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. OCR Review Modal */}
      {showOCRReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141424] border border-[#2d2d44] rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#24243a] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">OCR Recognition Details</h3>
              </div>
              <button
                onClick={() => setShowOCRReviewModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1f1f33] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300">
              <div className="p-3 rounded-xl bg-[#0c0c16] border border-[#262638] flex items-center justify-around text-center">
                <div>
                  <span className="block text-[10px] text-neutral-400 uppercase font-mono">Pages OCR'd</span>
                  <span className="text-base font-bold text-white">{ocrStats?.pagesScanned || 1}</span>
                </div>
                <div className="h-6 w-px bg-[#262638]" />
                <div>
                  <span className="block text-[10px] text-neutral-400 uppercase font-mono">Words Extracted</span>
                  <span className="text-base font-bold text-cyan-300">{ocrStats?.wordsRecognized || 120}</span>
                </div>
                <div className="h-6 w-px bg-[#262638]" />
                <div>
                  <span className="block text-[10px] text-neutral-400 uppercase font-mono">Confidence</span>
                  <span className="text-base font-bold text-emerald-400">{ocrStats?.avgConfidence || 85}%</span>
                </div>
              </div>

              <p className="text-neutral-400 leading-relaxed">
                Scanned raster images were automatically detected and converted into interactive, selectable
                text elements. You can freely click on any recognized text block directly in the document canvas
                to edit spelling, modify typography, or change formatting before exporting.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowOCRReviewModal(false)}
                className="px-5 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Exporting Progress Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141424] border border-[#2d2d44] rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#a78bfa] flex items-center justify-center animate-spin">
              <Download className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Generating PDF</h4>
              <p className="text-xs text-neutral-400">{exportProgress.stage}</p>
            </div>

            <div className="w-full bg-[#1c1c2e] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#7c3aed] to-[#a855f7] h-full transition-all duration-200"
                style={{ width: `${exportProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
