export type PageNumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type PageNumberFormat =
  | 'number'
  | 'page-n'
  | 'page-n-of-total'
  | 'n-of-total'
  | 'dash-n-dash'
  | 'bracket-n'
  | 'roman-lower'
  | 'roman-upper'
  | 'custom';

export type PageNumberFont =
  | 'Helvetica'
  | 'Helvetica-Bold'
  | 'Times-Roman'
  | 'Courier';

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  customFormat: string;
  fontFamily: PageNumberFont;
  fontSize: number;
  textColor: string;
  opacity: number;
  marginHorizontal: number; // in points (1/72 inch)
  marginVertical: number;   // in points
  startFromPage: number;    // which page in the PDF to begin numbering (1-based)
  startingNumber: number;   // the integer number assigned to the first numbered page
  skipFirstPage: boolean;   // convenient toggle for cover page
  skipLastPage: boolean;
  pageRangeType: 'all' | 'custom';
  customPageRange: string;  // e.g. "2-10, 12, 14-20"
  showBackgroundBadge: boolean;
  badgeStyle: 'white' | 'dark' | 'glass';
}

export type ProcessingStep =
  | 'idle'
  | 'parsing'
  | 'processing'
  | 'completed'
  | 'error';

export interface PageNumberResult {
  downloadUrl: string;
  blob: Blob;
  filename: string;
  originalSize: number;
  newSize: number;
  totalPages: number;
  pagesNumberedCount: number;
}
