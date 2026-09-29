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

export interface PhotoConversionOptions {
  quality?: number; // 1 to 100
  resolution?: 'original' | 'small' | 'medium' | 'large' | 'custom';
  scale?: number; // scale multiplier e.g. 0.5, 0.75, 1, 1.25
  customWidth?: number;
  customHeight?: number;
  backgroundColor?: string; // hex color for alpha flattening (e.g. '#ffffff')
  pageSize?: 'a4' | 'letter' | 'fit';
  orientation?: 'auto' | 'portrait' | 'landscape';
  margin?: 'none' | 'small' | 'normal' | 'large';
  imageFit?: 'fit' | 'fill' | 'original';
  imagesPerPage?: 'one' | 'multiple';
  pdfPages?: string; // 'all' or '1,2-4'
  dpi?: number; // for PDF to JPG (default 150 or 300)
}

export interface PhotoFileItem {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
  size: number;
}

export interface ConvertedOutputItem {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

export interface PhotoConversionResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  pagesCount?: number;
  warning?: string;
  isZip?: boolean;
  individualItems?: ConvertedOutputItem[];
  metadata?: Record<string, any>;
}
