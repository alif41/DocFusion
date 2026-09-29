export type ConversionType =
  | 'pdf-to-word'
  | 'pdf-to-powerpoint'
  | 'pdf-to-excel'
  | 'word-to-pdf'
  | 'powerpoint-to-pdf'
  | 'excel-to-pdf';

export type DocumentFormat = 'PDF' | 'Word' | 'PowerPoint' | 'Excel';

export interface ConversionConfig {
  id: ConversionType;
  title: string;
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  sourceExts: string[];
  targetExt: string;
  acceptMime: string[];
  description: string;
  badgeColor: string; // Tailwind color class or hex
  accentGradient: string;
  iconName: 'FileText' | 'Presentation' | 'Table' | 'FileSpreadsheet' | 'Layers';
  supportedFeatures: string[];
  fidelityDetails: string[];
  disclaimer?: string;
}

export type ConversionStage =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'converting'
  | 'optimizing'
  | 'finalizing'
  | 'complete'
  | 'error';

export interface UploadedFileInfo {
  file: File;
  name: string;
  size: number;
  extension: string;
  pageCount?: number;
  previewUrl?: string;
}

export interface ConversionOutputInfo {
  blob: Blob;
  downloadUrl: string;
  filename: string;
  size: number;
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  pageCount?: number;
  warning?: string;
}

export interface ConversionHistoryItem {
  id: string;
  conversionType: ConversionType;
  originalFilename: string;
  convertedFilename: string;
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  timestamp: number;
  fileSize: number;
  downloadUrl?: string;
}
