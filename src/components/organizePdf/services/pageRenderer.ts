import { ORGANIZE_PDF_CONFIG } from '../config/organizePdfConfig';

export interface PageThumbnailResult {
  thumbnailUrl: string;
  aspectRatio: number;
}

// In-memory cache for rendered thumbnails: key = `${fileKey}_p_${pageNum}`
const thumbnailCache = new Map<string, PageThumbnailResult>();

export function clearThumbnailCache() {
  thumbnailCache.clear();
}

/**
 * Renders a crisp thumbnail of a specific page
 */
export async function renderPageThumbnail(
  pdfDoc: any,
  pageNum: number,
  fileKey: string
): Promise<PageThumbnailResult> {
  const cacheKey = `${fileKey}_p_${pageNum}`;
  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }

  try {
    const page = await pdfDoc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const aspectRatio = unscaledViewport.width / unscaledViewport.height;

    // Calculate canvas size targeting ~300px width for sharp Retina display
    const targetWidth = 320;
    const computedScale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale: computedScale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Free canvas memory
    canvas.width = 0;
    canvas.height = 0;

    const result: PageThumbnailResult = {
      thumbnailUrl: dataUrl,
      aspectRatio,
    };

    thumbnailCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    console.warn(`Failed to render thumbnail for page ${pageNum}:`, error);
    return {
      thumbnailUrl: '',
      aspectRatio: 0.707, // Standard A4 aspect ratio fallback
    };
  }
}
