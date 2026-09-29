export interface PDFFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  thumbnailUrl: string | null;
  isLoading: boolean;
  error?: string;
}

export interface MergeResultData {
  blob: Blob;
  downloadUrl: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  filesCount: number;
  createdAt: Date;
}

export type MergeProcessingStep =
  | 'idle'
  | 'uploading'
  | 'validating'
  | 'merging'
  | 'finalizing'
  | 'completed'
  | 'error';

export type SplitMode = 'extract' | 'burst' | 'range';

export interface SplitPageItem {
  pageNumber: number;
  selected: boolean;
  thumbnailUrl?: string | null;
}

export interface SplitResultFile {
  filename: string;
  blob: Blob;
  downloadUrl: string;
  fileSize: number;
  pageCount: number;
  pagesIncluded: number[];
}

export interface SplitResultData {
  originalFilename: string;
  totalOriginalPages: number;
  splitMode: SplitMode;
  files: SplitResultFile[];
  zipBlob?: Blob;
  zipDownloadUrl?: string;
  zipFilename?: string;
  zipSize?: number;
  createdAt: Date;
}

export type SplitProcessingStep =
  | 'idle'
  | 'inspecting'
  | 'splitting'
  | 'generating_zip'
  | 'completed'
  | 'error';

export type CompressionPreset =
  | 'extreme'
  | 'recommended'
  | 'less'
  | 'structural'
  | 'custom';

export interface CompressionOptions {
  preset: CompressionPreset;
  dpi?: number;
  quality?: number;
  removeMetadata?: boolean;
  onProgress?: (stage: string, percent: number, currentPage?: number, totalPages?: number) => void;
}

export interface CompressResultData {
  originalFilename: string;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savingsPercent: number;
  pageCount: number;
  blob: Blob;
  downloadUrl: string;
  preset: CompressionPreset;
  createdAt: Date;
  alreadyOptimized?: boolean;
}

export type CompressProcessingStep =
  | 'idle'
  | 'inspecting'
  | 'compressing'
  | 'completed'
  | 'error';

export type EditorTool =
  | 'select'
  | 'text'
  | 'draw'
  | 'highlight'
  | 'signature'
  | 'shape'
  | 'stamp';

export interface TextAnnotation {
  id: string;
  page: number; // 1-indexed
  x: number; // relative coordinate percentage (0..100) or points
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier';
  isBold?: boolean;
  bgColor?: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  page: number;
  points: DrawingPoint[];
  color: string;
  strokeWidth: number;
  isHighlighter?: boolean;
}

export interface SignatureAnnotation {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

export type ShapeType = 'blackout' | 'whiteout' | 'highlight' | 'border';

export interface ShapeAnnotation {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shapeType: ShapeType;
  color?: string;
  borderColor?: string;
  opacity?: number;
}

export interface StampAnnotation {
  id: string;
  page: number;
  x: number;
  y: number;
  label: string;
  color: string;
  bgColor: string;
}


