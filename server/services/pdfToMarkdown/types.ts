export interface PdfToMarkdownOptions {
  pageRange?: string; // "all" | "1" | "1-5" | "1,3,5-8"
  ocrStrategy?: 'auto' | 'always' | 'never';
  ocrLanguage?: string; // 'eng', 'spa', 'fra', 'deu', etc.
  imageMode?: 'extract_folder' | 'inline_base64' | 'skip';
  includeFrontmatter?: boolean;
  detectTables?: boolean;
  detectCodeBlocks?: boolean;
  cleanPageArtifacts?: boolean; // remove standalone page numbers, header/footer repetition
}

export interface ExtractedImageItem {
  id: string;
  name: string; // e.g. "page_1_img_1.png"
  relativePath: string; // "images/page_1_img_1.png"
  pageNumber: number;
  dataUrl: string; // base64 data url
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
  isScanned: boolean; // charCount < 30 and no vector text
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

export interface PdfToMarkdownResult {
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
