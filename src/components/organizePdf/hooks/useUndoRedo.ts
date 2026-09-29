import { useState, useCallback, useEffect } from 'react';

export interface UseUndoRedoResult {
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  historyIndex: number;
  pushState: (newOrder: number[]) => void;
  undo: () => number[] | null;
  redo: () => number[] | null;
  resetToInitial: () => number[] | null;
  initialize: (initialOrder: number[]) => void;
}

export function useUndoRedo(onApplyOrder?: (order: number[]) => void): UseUndoRedoResult {
  const [history, setHistory] = useState<number[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const initialize = useCallback((initialOrder: number[]) => {
    setHistory([initialOrder]);
    setHistoryIndex(0);
  }, []);

  const pushState = useCallback(
    (newOrder: number[]) => {
      setHistory((prev) => {
        // Compare with current head to avoid duplicate pushes
        const currentOrder = prev[historyIndex];
        if (
          currentOrder &&
          currentOrder.length === newOrder.length &&
          currentOrder.every((val, idx) => val === newOrder[idx])
        ) {
          return prev;
        }

        const sliced = prev.slice(0, historyIndex + 1);
        const nextHistory = [...sliced, newOrder];
        setHistoryIndex(nextHistory.length - 1);
        return nextHistory;
      });
    },
    [historyIndex]
  );

  const undo = useCallback((): number[] | null => {
    if (historyIndex <= 0) return null;
    const targetIndex = historyIndex - 1;
    const targetOrder = history[targetIndex];
    setHistoryIndex(targetIndex);
    if (onApplyOrder && targetOrder) {
      onApplyOrder(targetOrder);
    }
    return targetOrder || null;
  }, [historyIndex, history, onApplyOrder]);

  const redo = useCallback((): number[] | null => {
    if (historyIndex >= history.length - 1) return null;
    const targetIndex = historyIndex + 1;
    const targetOrder = history[targetIndex];
    setHistoryIndex(targetIndex);
    if (onApplyOrder && targetOrder) {
      onApplyOrder(targetOrder);
    }
    return targetOrder || null;
  }, [historyIndex, history, onApplyOrder]);

  const resetToInitial = useCallback((): number[] | null => {
    if (history.length === 0) return null;
    const initial = history[0];
    if (onApplyOrder && initial) {
      onApplyOrder(initial);
    }
    // Push the reset state as a new entry so user can still undo back!
    setHistory((prev) => [...prev, initial]);
    setHistoryIndex((prev) => prev + 1);
    return initial;
  }, [history, onApplyOrder]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keyboard shortcut listener: Cmd/Ctrl+Z for undo, Cmd/Ctrl+Y or Cmd/Ctrl+Shift+Z for redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input/textarea
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          // Redo
          e.preventDefault();
          if (canRedo) redo();
        } else {
          // Undo
          e.preventDefault();
          if (canUndo) undo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        // Redo
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  return {
    canUndo,
    canRedo,
    historyLength: history.length,
    historyIndex,
    pushState,
    undo,
    redo,
    resetToInitial,
    initialize,
  };
}
