import React, { useState, useCallback, useRef, useEffect } from 'react';
import { OrganizePageItem } from '../types';
import { validateAndParseClientPdf } from '../services/pdfParser';
import { renderPageThumbnail, clearThumbnailCache } from '../services/pageRenderer';
import { ORGANIZE_PDF_CONFIG } from '../config/organizePdfConfig';
import { getPageOrderArray } from '../services/pageReorder';

export interface UsePdfPagesResult {
  file: File | null;
  pageCount: number;
  pages: OrganizePageItem[];
  selectedPageIds: Set<string>;
  isLoadingDoc: boolean;
  docError: string | null;
  loadFile: (selectedFile: File) => Promise<void>;
  setPages: React.Dispatch<React.SetStateAction<OrganizePageItem[]>>;
  toggleSelectPage: (pageId: string, shiftKey?: boolean) => void;
  selectAllPages: () => void;
  clearSelection: () => void;
  resetAll: () => void;
  applyOrderArray: (order: number[]) => void;
}

export function usePdfPages(): UsePdfPagesResult {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pages, setPages] = useState<OrganizePageItem[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);

  const lastSelectedIdRef = useRef<string | null>(null);
  const pdfDocRef = useRef<any>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Clear cache on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      clearThumbnailCache();
    };
  }, []);

  const loadFile = useCallback(async (selectedFile: File) => {
    setIsLoadingDoc(true);
    setDocError(null);
    clearThumbnailCache();
    setSelectedPageIds(new Set());
    lastSelectedIdRef.current = null;
    isCancelledRef.current = false;

    try {
      const parsed = await validateAndParseClientPdf(selectedFile);
      if (isCancelledRef.current) return;

      pdfDocRef.current = parsed.pdfDoc;
      setFile(selectedFile);
      setPageCount(parsed.pageCount);

      // Create skeleton page items
      const initialPages: OrganizePageItem[] = [];
      for (let i = 1; i <= parsed.pageCount; i++) {
        initialPages.push({
          id: `page-orig-${i}`,
          originalPageNumber: i,
          currentPageNumber: i,
          thumbnailUrl: null,
          isLoadingThumbnail: true,
          aspectRatio: 0.707,
        });
      }

      setPages(initialPages);
      setIsLoadingDoc(false);

      // Start asynchronous thumbnail generation queue
      const fileKey = `${selectedFile.name}_${selectedFile.size}_${selectedFile.lastModified}`;
      generateThumbnailsConcurrently(parsed.pdfDoc, parsed.pageCount, fileKey);
    } catch (err: any) {
      if (isCancelledRef.current) return;
      setIsLoadingDoc(false);
      setDocError(err.message || 'Failed to load PDF file.');
    }
  }, []);

  // Thumbnail generation queue with concurrency limiter
  const generateThumbnailsConcurrently = async (
    pdfDoc: any,
    total: number,
    fileKey: string
  ) => {
    const concurrency = ORGANIZE_PDF_CONFIG.maxPageThumbnailRenderConcurrency;
    let nextIndex = 1;

    const worker = async () => {
      while (nextIndex <= total) {
        if (isCancelledRef.current) break;
        const pageNum = nextIndex++;
        try {
          const { thumbnailUrl, aspectRatio } = await renderPageThumbnail(
            pdfDoc,
            pageNum,
            fileKey
          );

          if (isCancelledRef.current) break;

          setPages((prev) =>
            prev.map((item) =>
              item.originalPageNumber === pageNum
                ? {
                    ...item,
                    thumbnailUrl,
                    aspectRatio,
                    isLoadingThumbnail: false,
                  }
                : item
            )
          );
        } catch {
          if (isCancelledRef.current) break;
          setPages((prev) =>
            prev.map((item) =>
              item.originalPageNumber === pageNum
                ? { ...item, isLoadingThumbnail: false }
                : item
            )
          );
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);
  };

  // Selection handlers
  const toggleSelectPage = useCallback(
    (pageId: string, shiftKey: boolean = false) => {
      setSelectedPageIds((prev) => {
        const next = new Set(prev);

        if (shiftKey && lastSelectedIdRef.current && lastSelectedIdRef.current !== pageId) {
          // Range selection
          const lastIdx = pages.findIndex((p) => p.id === lastSelectedIdRef.current);
          const currentIdx = pages.findIndex((p) => p.id === pageId);
          if (lastIdx !== -1 && currentIdx !== -1) {
            const start = Math.min(lastIdx, currentIdx);
            const end = Math.max(lastIdx, currentIdx);
            for (let i = start; i <= end; i++) {
              next.add(pages[i].id);
            }
            return next;
          }
        }

        if (next.has(pageId)) {
          next.delete(pageId);
        } else {
          next.add(pageId);
        }

        lastSelectedIdRef.current = pageId;
        return next;
      });
    },
    [pages]
  );

  const selectAllPages = useCallback(() => {
    setSelectedPageIds(new Set(pages.map((p) => p.id)));
  }, [pages]);

  const clearSelection = useCallback(() => {
    setSelectedPageIds(new Set());
    lastSelectedIdRef.current = null;
  }, []);

  const resetAll = useCallback(() => {
    isCancelledRef.current = true;
    setFile(null);
    setPageCount(0);
    setPages([]);
    setSelectedPageIds(new Set());
    setDocError(null);
    clearThumbnailCache();
  }, []);

  // Applies an order array (e.g. from Undo/Redo)
  const applyOrderArray = useCallback((order: number[]) => {
    setPages((prev) => {
      // Map order back to existing page items to preserve thumbnails
      const map = new Map<number, OrganizePageItem>();
      prev.forEach((p) => map.set(p.originalPageNumber, p));

      const reordered: OrganizePageItem[] = [];
      order.forEach((origNum, idx) => {
        const item = map.get(origNum);
        if (item) {
          reordered.push({
            ...item,
            currentPageNumber: idx + 1,
          });
        }
      });

      return reordered;
    });
  }, []);

  return {
    file,
    pageCount,
    pages,
    selectedPageIds,
    isLoadingDoc,
    docError,
    loadFile,
    setPages,
    toggleSelectPage,
    selectAllPages,
    clearSelection,
    resetAll,
    applyOrderArray,
  };
}
