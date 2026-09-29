export type DocumentStatus =
  | 'idle'
  | 'uploading'
  | 'scanning'
  | 'ocr'
  | 'reconstructing'
  | 'ready'
  | 'error';

export type ActiveTool =
  | 'select'
  | 'text'
  | 'heading'
  | 'image'
  | 'table'
  | 'shape'
  | 'search';

export type FontName =
  | 'Inter'
  | 'Arial'
  | 'Helvetica'
  | 'Times New Roman'
  | 'Georgia'
  | 'Courier New'
  | 'Trebuchet MS'
  | 'Verdana';

export interface BaseElement {
  id: string;
  x: number; // in points (pt)
  y: number; // in points (pt)
  width: number; // in points (pt)
  height: number; // in points (pt)
  zIndex?: number;
}

export interface TextElement extends BaseElement {
  type: 'text' | 'heading' | 'paragraph' | 'list_item';
  text: string;
  fontFamily: FontName | string;
  fontSize: number; // in pt
  fontWeight: 'normal' | 'bold' | '600' | '700' | number;
  fontStyle: 'normal' | 'italic';
  underline: boolean;
  strikethrough: boolean;
  color: string;
  backgroundColor?: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number; // multiplier e.g. 1.2, 1.5
  letterSpacing?: number;
  listType?: 'bullet' | 'number' | 'none';
  indent?: number; // indent level 0, 1, 2, ...
  link?: string;
  isOCRText?: boolean;
  ocrConfidence?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string; // data URL or blob URL
  alt?: string;
  opacity?: number;
  rotation?: number;
}

export interface TableCell {
  id: string;
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  colSpan?: number;
  rowSpan?: number;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  cells: TableCell[][]; // [row][col]
  borderColor: string;
  borderWidth: number;
  headerRow?: boolean;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'line' | 'redact_black' | 'redact_white';
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  opacity?: number;
}

export type DocumentElement = TextElement | ImageElement | TableElement | ShapeElement;

export interface EditablePage {
  id: string;
  pageNumber: number; // 1-indexed
  width: number; // points (e.g. 595.28 for A4)
  height: number; // points (e.g. 841.89 for A4)
  rotation: number; // 0, 90, 180, 270
  elements: DocumentElement[];
  backgroundUrl?: string; // High-fidelity raster render of original vector/background
  thumbnailUrl?: string;
  isScanned?: boolean;
  ocrApplied?: boolean;
  ocrConfidence?: number;
}

export interface DocumentState {
  id: string;
  name: string;
  fileSize: number;
  originalFile: File | null;
  originalBytes: ArrayBuffer | null;
  pages: EditablePage[];
  pageCount: number;
  currentPageIndex: number; // 0-indexed
  zoom: number; // 0.5 to 2.0
  selectedElementId: string | null;
  selectedElementIds: string[];
  status: DocumentStatus;
  statusMessage: string;
  progress: number;
  isOCRUsed: boolean;
  ocrStats?: {
    pagesScanned: number;
    wordsRecognized: number;
    avgConfidence: number;
  };
  autosaveStatus: 'saved' | 'saving' | 'error';
  lastSavedAt: Date | null;
  errorMessage: string | null;
  searchQuery: string;
  replaceQuery: string;
  searchResults: SearchMatch[];
  currentSearchIndex: number;
}

export interface SearchMatch {
  pageIndex: number;
  elementId: string;
  textSnippet: string;
  startIndex: number;
  endIndex: number;
}

export interface AnalysisProgress {
  stage: 'uploading' | 'scanning' | 'ocr' | 'reconstructing' | 'ready';
  percent: number;
  message: string;
  details?: {
    currentPage?: number;
    totalPages?: number;
    textBlocksFound?: number;
    imagesFound?: number;
    isScanned?: boolean;
  };
}
