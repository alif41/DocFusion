export type ResizeMode = 'dimensions' | 'percentage' | 'preset';

export type PresetCategory = 'social' | 'profile' | 'document' | 'web';

export type OutputFormat = 'original' | 'jpg' | 'png' | 'webp';

export type AspectRatioOption =
  | 'original'
  | '1:1'
  | '4:3'
  | '3:2'
  | '16:9'
  | '9:16'
  | '4:5'
  | '2:3'
  | '21:9'
  | 'custom';

export type FitMode = 'cover' | 'contain' | 'fill' | 'inside';

export type PaddingColor = 'white' | 'black' | 'transparent';

export interface ImageAdjustments {
  cropX: number; // -50 to 50 (% offset from center)
  cropY: number; // -50 to 50 (% offset from center)
  zoom: number; // 1 to 3
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  brightness: number; // 50 to 150 (100 = default)
  contrast: number; // 50 to 150 (100 = default)
  saturation: number; // 0 to 200 (100 = default)
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  cropX: 0,
  cropY: 0,
  zoom: 1,
  rotation: 0,
  flipH: false,
  flipV: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export interface ResizePreset {
  id: string;
  category: PresetCategory;
  name: string;
  width: number;
  height: number;
  description: string;
  ratio: string;
}

export interface PhotoResizeResultItem {
  id: string;
  filename: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  newWidth: number;
  newHeight: number;
  newSize: number;
  format: string;
  mimeType: string;
  dataUrl: string;
}

export interface PhotoItem {
  id: string;
  file: File;
  name: string;
  size: number;
  format: string;
  originalWidth?: number;
  originalHeight?: number;
  aspectRatio?: number;
  previewUrl?: string;
  thumbnailUrl?: string;
  fullPreviewUrl?: string;
  status: 'inspecting' | 'ready' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: PhotoResizeResultItem;
  adjustments?: ImageAdjustments;
}

export interface ResizeConfig {
  mode: ResizeMode;
  width: number;
  height: number;
  percentage: number;
  maintainAspectRatio: boolean;
  aspectRatio: AspectRatioOption;
  customRatioW: number;
  customRatioH: number;
  fit: FitMode;
  paddingColor: PaddingColor;
  selectedPresetId?: string;
  outputFormat: OutputFormat;
  quality: number; // 10 to 100
  enableTargetSize: boolean;
  targetSizeKb: number; // e.g. 200
  globalAdjustments?: ImageAdjustments;
}
