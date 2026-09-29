import { useState, useCallback, useEffect } from 'react';
import { WatermarkItem } from '../types';

export interface UseWatermarkHistoryResult {
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: (state: WatermarkItem[]) => void;
  undo: () => WatermarkItem[] | null;
  redo: () => WatermarkItem[] | null;
  initialize: (initialState: WatermarkItem[]) => void;
}

export function useWatermarkHistory(
  onApplyState?: (state: WatermarkItem[]) => void
): UseWatermarkHistoryResult {
  const [history, setHistory] = useState<WatermarkItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const initialize = useCallback((initialState: WatermarkItem[]) => {
    // Deep clone to isolate state
    const clone = JSON.parse(JSON.stringify(initialState));
    setHistory([clone]);
    setHistoryIndex(0);
  }, []);

  const pushHistory = useCallback(
    (newState: WatermarkItem[]) => {
      const clone = JSON.parse(JSON.stringify(newState));
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const next = [...sliced, clone];
        setHistoryIndex(next.length - 1);
        return next;
      });
    },
    [historyIndex]
  );

  const undo = useCallback((): WatermarkItem[] | null => {
    if (historyIndex <= 0) return null;
    const targetIdx = historyIndex - 1;
    const targetState = history[targetIdx];
    setHistoryIndex(targetIdx);
    if (onApplyState && targetState) {
      onApplyState(JSON.parse(JSON.stringify(targetState)));
    }
    return targetState;
  }, [historyIndex, history, onApplyState]);

  const redo = useCallback((): WatermarkItem[] | null => {
    if (historyIndex >= history.length - 1) return null;
    const targetIdx = historyIndex + 1;
    const targetState = history[targetIdx];
    setHistoryIndex(targetIdx);
    if (onApplyState && targetState) {
      onApplyState(JSON.parse(JSON.stringify(targetState)));
    }
    return targetState;
  }, [historyIndex, history, onApplyState]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          e.preventDefault();
          if (canRedo) redo();
        } else {
          e.preventDefault();
          if (canUndo) undo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
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
    pushHistory,
    undo,
    redo,
    initialize,
  };
}
