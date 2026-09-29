export type WatermarkType = 'text' | 'image';

export type PositionGridType =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom';

export type WatermarkLayer = 'behind' | 'front';

export type PageSelectionType = 'all' | 'current' | 'custom';

export interface PageSelectionConfig {
  type: PageSelectionType;
  customRange: string; // e.g. "1, 3, 5-8, 12"
}

export interface WatermarkItem {
  id: string;
  name: string;
  type: WatermarkType;
  visible: boolean;

  // Text specific
  text: string;
  fontFamily: 'Helvetica' | 'Times-Roman' | 'Courier' | 'Arial' | 'Georgia' | 'Verdana';
  fontSize: number; // e.g. 48
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string; // hex code e.g. #666666

  // Image specific
  imageDataUrl?: string; // data:image/png;base64,...
  imageFile?: File;
  imageNaturalWidth?: number;
  imageNaturalHeight?: number;
  imageWidth: number; // in pt/px
  imageHeight: number;

  // Placement & Transform
  positionType: PositionGridType;
  xPercent: number; // 0 to 100%
  yPercent: number; // 0 to 100%
  rotation: number; // -180 to +180
  opacity: number; // 0.0 to 1.0 (default 0.3)

  // Tiled options
  isTiled: boolean;
  tileSpacingX: number;
  tileSpacingY: number;
  tileRotation: number;
  tileOpacity: number;

  // Layer & Pages
  layer: WatermarkLayer;
  pageSelection: PageSelectionConfig;
}

export type WatermarkProcessingStep =
  | 'idle'
  | 'preparing'
  | 'loading_pages'
  | 'applying'
  | 'rendering'
  | 'finalizing'
  | 'completed'
  | 'error';

export interface WatermarkResultData {
  blob: Blob;
  downloadUrl: string;
  filename: string;
  fileSize: number;
  originalPageCount: number;
  watermarkedPageCount: number;
  createdAt: Date;
}

export interface PdfPageMeta {
  pageNumber: number;
  width: number;
  height: number;
  aspectRatio: number;
  thumbnailUrl: string | null;
}
