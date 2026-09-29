import React, { useState, useCallback, useRef } from 'react';
import { OrganizePageItem, DragState } from '../types';
import { moveSinglePage, moveMultiPages } from '../services/pageReorder';

export interface UseDragReorderProps {
  pages: OrganizePageItem[];
  selectedPageIds: Set<string>;
  onCommitOrder: (newPages: OrganizePageItem[]) => void;
}

export function useDragReorder({
  pages,
  selectedPageIds,
  onCommitOrder,
}: UseDragReorderProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedPageId: null,
    draggedPageIds: [],
    dragOverPageId: null,
    dropPosition: null,
  });

  const draggedItemRef = useRef<OrganizePageItem | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, page: OrganizePageItem) => {
      draggedItemRef.current = page;

      // If the dragged page is in selection, drag all selected pages together
      const isMultiDrag = selectedPageIds.has(page.id) && selectedPageIds.size > 1;
      const idsToDrag = isMultiDrag ? Array.from(selectedPageIds) : [page.id];

      setDragState({
        isDragging: true,
        draggedPageId: page.id,
        draggedPageIds: idsToDrag,
        dragOverPageId: null,
        dropPosition: null,
      });

      // HTML5 Drag data
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', page.id);

      // Add a slight transparency to native drag ghost if available
      try {
        const ghost = document.createElement('div');
        ghost.className =
          'fixed -top-96 left-0 bg-[#7c3aed] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg';
        ghost.innerText = isMultiDrag
          ? `Moving ${idsToDrag.length} pages`
          : `Moving Page ${page.currentPageNumber}`;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 20, 20);
        setTimeout(() => document.body.removeChild(ghost), 0);
      } catch {
        // ignore
      }
    },
    [selectedPageIds]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetPage: OrganizePageItem) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (!dragState.isDragging || targetPage.id === dragState.draggedPageId) {
        return;
      }

      // If multi-dragging and hovering over another item that's also in the selection, skip drop target
      if (dragState.draggedPageIds.includes(targetPage.id)) {
        return;
      }

      // Determine before vs after based on cursor position relative to card center
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;
      const isAfter = e.clientX > midpoint;
      const position = isAfter ? 'after' : 'before';

      if (
        dragState.dragOverPageId !== targetPage.id ||
        dragState.dropPosition !== position
      ) {
        setDragState((prev) => ({
          ...prev,
          dragOverPageId: targetPage.id,
          dropPosition: position,
        }));
      }
    },
    [dragState.isDragging, dragState.draggedPageId, dragState.draggedPageIds, dragState.dragOverPageId, dragState.dropPosition]
  );

  const handleDragLeave = useCallback((_e: React.DragEvent, targetPage: OrganizePageItem) => {
    setDragState((prev) => {
      if (prev.dragOverPageId === targetPage.id) {
        return {
          ...prev,
          dragOverPageId: null,
          dropPosition: null,
        };
      }
      return prev;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetPage: OrganizePageItem) => {
      e.preventDefault();

      if (!dragState.isDragging) return;

      const isMulti = dragState.draggedPageIds.length > 1;
      const targetIndex = pages.findIndex((p) => p.id === targetPage.id);

      if (targetIndex === -1) {
        handleDragEnd();
        return;
      }

      let newPages: OrganizePageItem[];

      if (isMulti) {
        const selectedSet = new Set<string>(dragState.draggedPageIds);
        newPages = moveMultiPages(
          pages,
          selectedSet,
          targetIndex,
          dragState.dropPosition || 'before'
        );
      } else {
        const fromIndex = pages.findIndex((p) => p.id === dragState.draggedPageId);
        if (fromIndex === -1) {
          handleDragEnd();
          return;
        }

        let destinationIndex = targetIndex;
        if (dragState.dropPosition === 'after' && fromIndex < targetIndex) {
          destinationIndex = targetIndex;
        } else if (dragState.dropPosition === 'after' && fromIndex > targetIndex) {
          destinationIndex = targetIndex + 1;
        } else if (dragState.dropPosition === 'before' && fromIndex < targetIndex) {
          destinationIndex = targetIndex - 1;
        }

        newPages = moveSinglePage(pages, fromIndex, destinationIndex);
      }

      setDragState({
        isDragging: false,
        draggedPageId: null,
        draggedPageIds: [],
        dragOverPageId: null,
        dropPosition: null,
      });
      draggedItemRef.current = null;

      onCommitOrder(newPages);
    },
    [dragState, pages, onCommitOrder]
  );

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedPageId: null,
      draggedPageIds: [],
      dragOverPageId: null,
      dropPosition: null,
    });
    draggedItemRef.current = null;
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
