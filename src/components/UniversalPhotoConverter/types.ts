export type PhotoFormat = 'JPG' | 'PNG' | 'HEIC' | 'WEBP' | 'RAW' | 'PDF';

export type PhotoConversionType =
  | 'jpg-to-pdf'
  | 'pdf-to-jpg'
  | 'jpg-to-png'
  | 'png-to-jpg'
  | 'heic-to-jpg'
  | 'webp-to-jpg'
  | 'jpg-to-webp'
  | 'png-to-webp'
  | 'png-to-pdf'
  | 'raw-to-jpg';

export interface PhotoConversionConfig {
  id: PhotoConversionType;
  title: string;
  sourceFormat: PhotoFormat;
  targetFormat: PhotoFormat;
  sourceExts: string[];
  targetExt: string;
  acceptMime: string[];
  description: string;
  badgeColor: string;
  accentGradient: string;
  iconName: string;
  allowsMultiple: boolean;
  hasPageOrder?: boolean;
  supportedFeatures: string[];
  fidelityDetails: string[];
  disclaimer?: string;
}

export interface PhotoFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  extension: string;
  previewUrl: string;
  width?: number;
  height?: number;
  status: 'ready' | 'processing' | 'completed' | 'failed';
  error?: string;
  detectedCamera?: string;
}

export type ConversionStage =
  | 'idle'
  | 'uploading'
  | 'reading'
  | 'processing'
  | 'optimizing'
  | 'finalizing'
  | 'complete'
  | 'error';

export interface PhotoOptions {
  quality: number; // 10 to 100
  resolution: 'original' | 'small' | 'medium' | 'large' | 'custom';
  scale: number; // 0.5, 0.75, 1, 1.25
  backgroundColor: string; // for PNG -> JPG transparency flattening
  pageSize: 'a4' | 'letter' | 'fit';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 'none' | 'small' | 'normal' | 'large';
  imageFit: 'fit' | 'fill' | 'original';
  pdfPages: string; // 'all' or '1, 2-3'
  dpi: number; // 150, 300
}

export interface PhotoConversionOutput {
  blob: Blob;
  downloadUrl: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
  pagesCount?: number;
  isZip?: boolean;
  warning?: string;
  detectedCamera?: string;
}

export interface PhotoConversionHistoryItem {
  id: string;
  conversionType: string;
  originalFilename: string;
  convertedFilename: string;
  sourceFormat: string;
  targetFormat: string;
  timestamp: number;
  fileSize: number;
  fileCount: number;
}
