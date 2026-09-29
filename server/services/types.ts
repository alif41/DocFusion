export interface ExtractedTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
}

export interface ExtractedLine {
  y: number;
  text: string;
  fontSize: number;
  isHeading: boolean;
  headingLevel: 1 | 2 | 3;
  isBold: boolean;
  items: ExtractedTextItem[];
  isTableCandidate: boolean;
  columns?: string[];
}

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
}

export interface ExtractedPage {
  pageNumber: number;
  width: number;
  height: number;
  lines: ExtractedLine[];
  paragraphs: string[];
  tables: ExtractedTable[];
  headings: string[];
  fullText: string;
}

export interface ConversionResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  pageCount?: number;
  stats?: Record<string, any>;
  warning?: string;
}
