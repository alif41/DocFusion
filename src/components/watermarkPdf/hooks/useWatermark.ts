import { useState, useCallback, useMemo } from 'react';
import { WatermarkItem } from '../types';
import { createDefaultWatermark } from '../config/watermarkPdfConfig';
import { useWatermarkHistory } from './useWatermarkHistory';

export function useWatermark() {
  const initial = useMemo(() => [createDefaultWatermark(1)], []);
  const [watermarks, setWatermarks] = useState<WatermarkItem[]>(initial);
  const [activeWatermarkId, setActiveWatermarkId] = useState<string>(initial[0].id);

  // Undo/Redo integration
  const { canUndo, canRedo, pushHistory, undo, redo, initialize } = useWatermarkHistory(
    (restored) => {
      setWatermarks(restored);
      if (restored.length > 0 && !restored.some((w) => w.id === activeWatermarkId)) {
        setActiveWatermarkId(restored[0].id);
      }
    }
  );

  const activeWatermark = useMemo(() => {
    return watermarks.find((w) => w.id === activeWatermarkId) || watermarks[0] || null;
  }, [watermarks, activeWatermarkId]);

  const updateActiveWatermark = useCallback(
    (updates: Partial<WatermarkItem>, commitToHistory: boolean = true) => {
      setWatermarks((prev) => {
        const next = prev.map((w) => (w.id === activeWatermarkId ? { ...w, ...updates } : w));
        if (commitToHistory) {
          pushHistory(next);
        }
        return next;
      });
    },
    [activeWatermarkId, pushHistory]
  );

  const addNewWatermark = useCallback(
    (type: 'text' | 'image' = 'text') => {
      const nextIndex = watermarks.length + 1;
      const newWm = createDefaultWatermark(nextIndex);
      newWm.type = type;
      if (type === 'image') {
        newWm.name = `Logo Stamp ${nextIndex}`;
        newWm.rotation = 0;
        newWm.opacity = 0.4;
      }

      const next = [...watermarks, newWm];
      setWatermarks(next);
      setActiveWatermarkId(newWm.id);
      pushHistory(next);
    },
    [watermarks, pushHistory]
  );

  const duplicateWatermark = useCallback(
    (id: string) => {
      const target = watermarks.find((w) => w.id === id);
      if (!target) return;

      const dup: WatermarkItem = {
        ...JSON.parse(JSON.stringify(target)),
        id: `wm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${target.name} (Copy)`,
      };

      const next = [...watermarks, dup];
      setWatermarks(next);
      setActiveWatermarkId(dup.id);
      pushHistory(next);
    },
    [watermarks, pushHistory]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      const next = watermarks.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
      setWatermarks(next);
      pushHistory(next);
    },
    [watermarks, pushHistory]
  );

  const removeWatermark = useCallback(
    (id: string) => {
      if (watermarks.length <= 1) {
        // Reset to default rather than 0
        const defaultWm = createDefaultWatermark(1);
        setWatermarks([defaultWm]);
        setActiveWatermarkId(defaultWm.id);
        pushHistory([defaultWm]);
        return;
      }

      const next = watermarks.filter((w) => w.id !== id);
      setWatermarks(next);
      if (activeWatermarkId === id) {
        setActiveWatermarkId(next[0].id);
      }
      pushHistory(next);
    },
    [watermarks, activeWatermarkId, pushHistory]
  );

  const resetActiveWatermark = useCallback(() => {
    if (!activeWatermark) return;
    const defaultWm = createDefaultWatermark(1);
    defaultWm.id = activeWatermark.id;
    defaultWm.name = activeWatermark.name;
    const next = watermarks.map((w) => (w.id === activeWatermark.id ? defaultWm : w));
    setWatermarks(next);
    pushHistory(next);
  }, [activeWatermark, watermarks, pushHistory]);

  const resetAllWatermarks = useCallback(() => {
    const defaultWm = createDefaultWatermark(1);
    setWatermarks([defaultWm]);
    setActiveWatermarkId(defaultWm.id);
    initialize([defaultWm]);
  }, [initialize]);

  return {
    watermarks,
    activeWatermark,
    activeWatermarkId,
    setActiveWatermarkId,
    updateActiveWatermark,
    addNewWatermark,
    duplicateWatermark,
    toggleVisibility,
    removeWatermark,
    resetActiveWatermark,
    resetAllWatermarks,
    canUndo,
    canRedo,
    undo,
    redo,
    initializeHistory: initialize,
  };
}
