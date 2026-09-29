export interface RenderPageImageResult {
  dataUrl: string;
  width: number; // CSS display width
  height: number; // CSS display height
}

// In-memory cache for rendered preview images: key = `${pageNum}_${scale}`
const pageRenderCache = new Map<string, RenderPageImageResult>();

export function clearPageRenderCache() {
  pageRenderCache.clear();
}

/**
 * Safely renders a PDF page into a crisp data URL using an isolated offscreen canvas.
 * This completely prevents any "Cannot use the same canvas during multiple render() operations"
 * or concurrent React StrictMode render conflicts.
 */
export async function renderPdfPageToImage(
  pdfDoc: any,
  pageNumber: number,
  scale: number = 1.0,
  cacheKeyPrefix: string = ''
): Promise<RenderPageImageResult> {
  if (!pdfDoc) {
    throw new Error('PDF document is not loaded.');
  }

  const cacheKey = `${cacheKeyPrefix}_p${pageNumber}_s${scale.toFixed(2)}`;
  if (pageRenderCache.has(cacheKey)) {
    return pageRenderCache.get(cacheKey)!;
  }

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  // Use isolated offscreen canvas to avoid canvas reuse conflicts
  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to acquire 2D canvas context for rendering.');
  }

  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const renderWidth = Math.floor(viewport.width * pixelRatio);
  const renderHeight = Math.floor(viewport.height * pixelRatio);

  offscreen.width = renderWidth;
  offscreen.height = renderHeight;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const renderContext = {
    canvasContext: ctx,
    viewport,
  };

  await page.render(renderContext).promise;

  const dataUrl = offscreen.toDataURL('image/png');

  // Immediately release canvas memory
  offscreen.width = 0;
  offscreen.height = 0;

  const result: RenderPageImageResult = {
    dataUrl,
    width: Math.floor(viewport.width),
    height: Math.floor(viewport.height),
  };

  pageRenderCache.set(cacheKey, result);
  return result;
}

/**
 * Legacy compatibility wrapper for renderPdfPageToCanvas
 */
export async function renderPdfPageToCanvas({
  pdfDoc,
  pageNumber,
  canvas,
  scale = 1.0,
}: {
  pdfDoc: any;
  pageNumber: number;
  canvas: HTMLCanvasElement;
  scale?: number;
  activeRenderTaskRef?: any;
}): Promise<{ width: number; height: number; viewportWidth: number; viewportHeight: number }> {
  const imageResult = await renderPdfPageToImage(pdfDoc, pageNumber, scale);

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => {
        canvas.width = imageResult.width;
        canvas.height = imageResult.height;
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.src = imageResult.dataUrl;
    });
  }

  return {
    width: imageResult.width,
    height: imageResult.height,
    viewportWidth: imageResult.width,
    viewportHeight: imageResult.height,
  };
}
