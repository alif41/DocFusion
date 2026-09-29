export interface OrganizePageItem {
  id: string; // Unique identifier (e.g. 'orig-page-1')
  originalPageNumber: number; // 1-based original index
  currentPageNumber: number; // 1-based current position in reordered sequence
  thumbnailUrl: string | null;
  isLoadingThumbnail: boolean;
  aspectRatio: number; // width / height
}

export type OrganizeViewMode = 'grid' | 'list';

export type OrganizeProcessingStep =
  | 'idle'
  | 'preparing'
  | 'applying'
  | 'rebuilding'
  | 'finalizing'
  | 'completed'
  | 'error';

export interface OrganizeResultData {
  blob: Blob;
  downloadUrl: string;
  filename: string;
  fileSize: number;
  originalPageCount: number;
  newPageCount: number;
  pageOrder: number[];
  createdAt: Date;
  isCustomOrder: boolean;
}

export interface QuickMoveDirection {
  type: 'first' | 'left' | 'right' | 'last';
}

export interface DragState {
  isDragging: boolean;
  draggedPageId: string | null;
  draggedPageIds: string[]; // for multi-page drag
  dragOverPageId: string | null;
  dropPosition: 'before' | 'after' | null;
}
