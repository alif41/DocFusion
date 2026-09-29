import { EditablePage } from './types';

export interface HistorySnapshot {
  pages: EditablePage[];
  currentPageIndex: number;
  description?: string;
  timestamp: number;
}

export class HistoryManager {
  private undoStack: HistorySnapshot[] = [];
  private redoStack: HistorySnapshot[] = [];
  private maxDepth: number;

  constructor(maxDepth: number = 40) {
    this.maxDepth = maxDepth;
  }

  public record(pages: EditablePage[], currentPageIndex: number, description?: string): void {
    // Deep clone pages to prevent mutation leaking
    const snapshot: HistorySnapshot = {
      pages: JSON.parse(JSON.stringify(pages)),
      currentPageIndex,
      description,
      timestamp: Date.now(),
    };

    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    // Clear redo on new action
    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(currentPages: EditablePage[], currentPageIndex: number): HistorySnapshot | null {
    if (!this.canUndo()) return null;

    // Push current state onto redo stack
    this.redoStack.push({
      pages: JSON.parse(JSON.stringify(currentPages)),
      currentPageIndex,
      timestamp: Date.now(),
    });

    const previous = this.undoStack.pop()!;
    return previous;
  }

  public redo(currentPages: EditablePage[], currentPageIndex: number): HistorySnapshot | null {
    if (!this.canRedo()) return null;

    // Push current state onto undo stack
    this.undoStack.push({
      pages: JSON.parse(JSON.stringify(currentPages)),
      currentPageIndex,
      timestamp: Date.now(),
    });

    const next = this.redoStack.pop()!;
    return next;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
