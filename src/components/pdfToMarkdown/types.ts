export interface PdfToMarkdownOptions {
  pageRange: string;
  ocrStrategy: 'auto' | 'always' | 'never';
  ocrLanguage: string;
  imageMode: 'extract_folder' | 'inline_base64' | 'skip';
  includeFrontmatter: boolean;
  detectTables: boolean;
  detectCodeBlocks: boolean;
  cleanPageArtifacts: boolean;
}

export interface ExtractedImageItem {
  id: string;
  name: string;
  relativePath: string;
  pageNumber: number;
  dataUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface PageAnalysis {
  pageNumber: number;
  width: number;
  height: number;
  charCount: number;
  wordCount: number;
  isScanned: boolean;
  ocrApplied: boolean;
  imagesFound: number;
  tableCount: number;
}

export interface PdfDocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  creationDate?: string;
  modificationDate?: string;
  pageCount: number;
  selectedPages: number[];
  fileSize: number;
  originalFilename: string;
}

export interface ConversionStats {
  totalPages: number;
  convertedPages: number;
  scannedPagesCount: number;
  ocrAppliedCount: number;
  headingCount: number;
  tableCount: number;
  listCount: number;
  codeBlockCount: number;
  imageCount: number;
  wordCount: number;
  charCount: number;
}

export interface ConversionResult {
  success: boolean;
  markdown: string;
  rawMarkdownWithoutFrontmatter: string;
  frontmatter: string;
  metadata: PdfDocumentMetadata;
  pages: PageAnalysis[];
  images: ExtractedImageItem[];
  stats: ConversionStats;
  warnings?: string[];
}

export type ViewLayoutMode = 'split_all' | 'pdf_editor' | 'editor_preview' | 'editor_only';
