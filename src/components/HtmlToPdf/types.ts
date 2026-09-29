export type PageSize = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Custom';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginType = 'default' | 'none' | 'small' | 'medium' | 'large' | 'custom';
export type UnitType = 'mm' | 'cm' | 'inch';
export type QualityLevel = 'standard' | 'high' | 'maximum';

export interface CustomMargin {
  top: number;
  bottom: number;
  left: number;
  right: number;
  unit: UnitType;
}

export interface HeaderFooterConfig {
  enabled: boolean;
  header: {
    leftText: string;
    centerText: string;
    rightText: string;
    showDate: boolean;
    showTitle: boolean;
    fontSize: number;
  };
  footer: {
    leftText: string;
    centerText: string;
    rightText: string;
    showPageNumber: boolean;
    showTotalPages: boolean;
    showDate: boolean;
    fontSize: number;
  };
}

export interface HtmlToPdfConfig {
  pageSize: PageSize;
  customPageSize?: {
    width: number;
    height: number;
    unit: UnitType | 'pt';
  };
  orientation: PageOrientation;
  margins: {
    type: MarginType;
    top: number;
    bottom: number;
    left: number;
    right: number;
    unit: UnitType;
  };
  printBackground: boolean;
  quality: QualityLevel;
  scale: number;
  enableLinks: boolean;
  executeJavaScript: boolean;
  allowExternalResources: boolean;
  headerFooter: HeaderFooterConfig;
}

export interface UploadedHtmlFile {
  id: string;
  file: File;
  name: string;
  size: number;
  htmlContent: string;
  status: 'ready' | 'processing' | 'completed' | 'failed';
  error?: string;
  pages?: number;
  pdfBlob?: Blob;
  pdfUrl?: string;
  isPackage?: boolean;
}

export type ConversionStage =
  | 'idle'
  | 'preparing'
  | 'loading_css'
  | 'loading_assets'
  | 'rendering'
  | 'generating_pdf'
  | 'finalizing'
  | 'complete'
  | 'error';

export interface HtmlConversionResult {
  blob: Blob;
  downloadUrl: string;
  filename: string;
  pages: number;
  size: number;
  warnings?: string[];
  isZip?: boolean;
}

export type InputMode = 'editor' | 'upload' | 'package';

export interface HtmlTemplate {
  id: string;
  title: string;
  description: string;
  category: 'business' | 'creative' | 'technical' | 'certificate';
  html: string;
}
