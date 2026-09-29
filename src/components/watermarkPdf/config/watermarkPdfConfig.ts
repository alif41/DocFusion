import { WatermarkItem, PositionGridType } from '../types';

export const WATERMARK_PDF_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedImageFormats: ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
  defaultZoom: 100,
  minZoom: 50,
  maxZoom: 200,
  availableFonts: [
    { label: 'Helvetica / Arial', value: 'Helvetica' },
    { label: 'Times New Roman', value: 'Times-Roman' },
    { label: 'Courier New', value: 'Courier' },
  ],
  fontSizePresets: [
    { label: 'Small', size: 28 },
    { label: 'Medium', size: 48 },
    { label: 'Large', size: 72 },
  ],
  quickRotations: [
    { label: '0°', angle: 0 },
    { label: '45°', angle: 45 },
    { label: '90°', angle: 90 },
    { label: '-45°', angle: -45 },
    { label: '-90°', angle: -90 },
  ],
  colorPalette: [
    '#666666',
    '#000000',
    '#dc2626', // Red
    '#ea580c', // Orange
    '#d97706', // Amber
    '#16a34a', // Green
    '#2563eb', // Blue
    '#7c3aed', // Purple
    '#db2777', // Pink
    '#ffffff', // White
  ],
  gridPositions: [
    { id: 'top-left' as PositionGridType, label: 'Top Left', x: 15, y: 15 },
    { id: 'top-center' as PositionGridType, label: 'Top Center', x: 50, y: 15 },
    { id: 'top-right' as PositionGridType, label: 'Top Right', x: 85, y: 15 },
    { id: 'center-left' as PositionGridType, label: 'Mid Left', x: 15, y: 50 },
    { id: 'center' as PositionGridType, label: 'Center', x: 50, y: 50 },
    { id: 'center-right' as PositionGridType, label: 'Mid Right', x: 85, y: 50 },
    { id: 'bottom-left' as PositionGridType, label: 'Bot. Left', x: 15, y: 85 },
    { id: 'bottom-center' as PositionGridType, label: 'Bot. Center', x: 50, y: 85 },
    { id: 'bottom-right' as PositionGridType, label: 'Bot. Right', x: 85, y: 85 },
  ],
};

export function createDefaultWatermark(index: number = 1): WatermarkItem {
  return {
    id: `wm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `Watermark ${index}`,
    type: 'text',
    visible: true,

    // Text defaults
    text: 'CONFIDENTIAL',
    fontFamily: 'Helvetica',
    fontSize: 48,
    fontWeight: 'bold',
    fontStyle: 'normal',
    color: '#666666',

    // Image defaults
    imageWidth: 200,
    imageHeight: 120,

    // Placement
    positionType: 'center',
    xPercent: 50,
    yPercent: 50,
    rotation: -45,
    opacity: 0.3,

    // Tiling
    isTiled: false,
    tileSpacingX: 180,
    tileSpacingY: 150,
    tileRotation: -45,
    tileOpacity: 0.2,

    // Layer & Pages
    layer: 'behind',
    pageSelection: {
      type: 'all',
      customRange: '',
    },
  };
}
