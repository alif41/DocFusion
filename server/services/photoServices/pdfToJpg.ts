import path from 'path';
import JSZip from 'jszip';
import { createCanvas } from '@napi-rs/canvas';
import { PhotoConversionOptions, PhotoConversionResult, ConvertedOutputItem } from './types';

// Helper to parse page range (e.g. "all", "1, 3-5")
function parsePageSelection(selection: string | undefined, totalPages: number): number[] {
  if (!selection || selection.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pagesSet = new Set<number>();
  const parts = selection.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pagesSet.add(p);
      }
    }
  }

  const result = Array.from(pagesSet).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
}

export async function convertPdfToJpg(
  pdfBuffer: Buffer,
  originalFilename: string,
  options: PhotoConversionOptions = {}
): Promise<PhotoConversionResult> {
  // Dynamically import pdfjs legacy build for Node.js
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: false,
  });

  const doc = await loadingTask.promise;
  const totalPages = doc.numPages;

  if (totalPages === 0) {
    throw new Error('The uploaded PDF does not contain any readable pages.');
  }

  const selectedPages = parsePageSelection(options.pdfPages, totalPages);

  // Quality multiplier: default 150 DPI is scale 2.08 (150/72), 300 DPI is scale 4.16
  let scale = 2.0;
  if (options.dpi === 300 || options.resolution === 'large') {
    scale = 3.5;
  } else if (options.resolution === 'small') {
    scale = 1.2;
  } else if (options.scale && options.scale > 0) {
    scale = options.scale * 2.0;
  }

  const quality = Math.max(0.4, Math.min(1.0, (options.quality || 92) / 100));

  const items: ConvertedOutputItem[] = [];
  const baseName = path.parse(originalFilename).name;

  for (const pageNum of selectedPages) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const ctx = canvas.getContext('2d');

    // White background for page canvas before rendering
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await (page.render as any)({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const pageJpgBuffer = canvas.toBuffer('image/jpeg', Math.round(quality * 100));
    const pageFilename = `${baseName}_page_${String(pageNum).padStart(2, '0')}.jpg`;

    items.push({
      filename: pageFilename,
      buffer: pageJpgBuffer,
      mimeType: 'image/jpeg',
      size: pageJpgBuffer.length,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
    });
  }

  // If only 1 page was converted, return that single JPG directly
  if (items.length === 1) {
    const single = items[0];
    return {
      buffer: single.buffer,
      filename: single.filename,
      mimeType: 'image/jpeg',
      size: single.size,
      width: single.width,
      height: single.height,
      pagesCount: 1,
      isZip: false,
      individualItems: items,
    };
  }

  // If multiple pages, package into a convenient ZIP archive
  const zip = new JSZip();
  for (const item of items) {
    zip.file(item.filename, item.buffer);
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFilename = `${baseName}_jpg_pages.zip`;

  return {
    buffer: zipBuffer,
    filename: zipFilename,
    mimeType: 'application/zip',
    size: zipBuffer.length,
    pagesCount: items.length,
    isZip: true,
    individualItems: items,
    width: items[0]?.width,
    height: items[0]?.height,
  };
}
