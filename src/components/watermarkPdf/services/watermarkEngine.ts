import { WatermarkItem, PositionGridType, PageSelectionConfig } from '../types';
import { WATERMARK_PDF_CONFIG } from '../config/watermarkPdfConfig';

/**
 * Checks if a specific page number is selected under the given page selection rule
 */
export function isPageSelected(
  selection: PageSelectionConfig,
  targetPage: number,
  currentPage: number,
  totalPages: number
): boolean {
  if (selection.type === 'all') {
    return true;
  }

  if (selection.type === 'current') {
    return targetPage === currentPage;
  }

  if (selection.type === 'custom') {
    const pages = parsePageRange(selection.customRange, totalPages);
    return pages.has(targetPage);
  }

  return true;
}

/**
 * Parses user input page range like "1, 3, 5-8, 12"
 */
export function parsePageRange(rangeStr: string, totalPages: number): Set<number> {
  const result = new Set<number>();
  if (!rangeStr || !rangeStr.trim()) return result;

  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr?.trim() || '', 10);
      const end = parseInt(endStr?.trim() || '', 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          result.add(p);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        result.add(pageNum);
      }
    }
  }

  return result;
}

/**
 * Computes how many pages this watermark will be applied to
 */
export function countWatermarkedPages(
  selection: PageSelectionConfig,
  currentPage: number,
  totalPages: number
): number {
  if (totalPages === 0) return 0;
  if (selection.type === 'all') return totalPages;
  if (selection.type === 'current') return 1;
  if (selection.type === 'custom') {
    const set = parsePageRange(selection.customRange, totalPages);
    return set.size;
  }
  return totalPages;
}

/**
 * Maps a 9-position grid type to x/y percentages (0-100)
 */
export function getCoordinatesFromPosition(posType: PositionGridType): { x: number; y: number } {
  const found = WATERMARK_PDF_CONFIG.gridPositions.find((p) => p.id === posType);
  if (found) {
    return { x: found.x, y: found.y };
  }
  return { x: 50, y: 50 };
}

/**
 * Loads an image file and converts to data URL (handling SVG/WebP/PNG/JPG)
 */
export async function loadImageAsDataUrl(
  file: File
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl,
          width: img.naturalWidth || 200,
          height: img.naturalHeight || 120,
        });
      };
      img.onerror = () => {
        reject(new Error('Failed to decode image. Format may be unsupported.'));
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };
    reader.readAsDataURL(file);
  });
}
