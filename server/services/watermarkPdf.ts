import { PDFDocument, rgb, degrees, StandardFonts, PDFFont, PDFImage } from 'pdf-lib';

export interface WatermarkPageSelection {
  type: 'all' | 'current' | 'custom';
  currentPage?: number;
  customRange?: string; // e.g. "1, 3, 5-8, 12"
}

export interface BackendWatermarkItem {
  id: string;
  name: string;
  type: 'text' | 'image';
  visible: boolean;

  // Text options
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string; // hex #rrggbb

  // Image options
  imageBase64?: string; // data:image/png;base64,... or raw base64
  imageMimeType?: string;
  imageWidth?: number;
  imageHeight?: number;

  // Position & Transform
  positionType?: string;
  xPercent?: number; // 0 to 100
  yPercent?: number; // 0 to 100
  rotation?: number; // -180 to 180
  opacity?: number; // 0.0 to 1.0

  // Tiled options
  isTiled?: boolean;
  tileSpacingX?: number;
  tileSpacingY?: number;
  tileRotation?: number;
  tileOpacity?: number;

  // Layer & Pages
  layer?: 'behind' | 'front';
  pageSelection: WatermarkPageSelection;
}

export interface ApplyWatermarkOptions {
  buffer: Buffer;
  watermarks: BackendWatermarkItem[];
  currentPage?: number;
}

export interface WatermarkResult {
  buffer: Buffer;
  pageCount: number;
  watermarkedPageCount: number;
  fileSize: number;
}

/**
 * Validates PDF magic bytes (%PDF-)
 */
export function validatePdfMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

/**
 * Parse page range string (e.g. "1, 3, 5-8, 12") into a Set of 1-based page numbers
 */
export function parsePageRangeString(rangeStr: string, totalPages: number): Set<number> {
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
 * Resolves which pages a watermark should be applied to (1-based index)
 */
export function resolveTargetPages(
  selection: WatermarkPageSelection,
  totalPages: number,
  currentPage: number = 1
): Set<number> {
  const targetPages = new Set<number>();

  if (selection.type === 'all') {
    for (let i = 1; i <= totalPages; i++) {
      targetPages.add(i);
    }
  } else if (selection.type === 'current') {
    const page = selection.currentPage || currentPage;
    if (page >= 1 && page <= totalPages) {
      targetPages.add(page);
    }
  } else if (selection.type === 'custom') {
    const parsed = parsePageRangeString(selection.customRange || '', totalPages);
    parsed.forEach((p) => targetPages.add(p));
  }

  return targetPages;
}

/**
 * Parse Hex color to pdf-lib rgb(r, g, b)
 */
export function hexToRgb(hex: string = '#666666') {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) {
    return rgb(0.4, 0.4, 0.4);
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(
    isNaN(r) ? 0.4 : r,
    isNaN(g) ? 0.4 : g,
    isNaN(b) ? 0.4 : b
  );
}

/**
 * Applies all configured watermarks to the given PDF buffer
 */
export async function applyWatermarksToPdf({
  buffer,
  watermarks,
  currentPage = 1,
}: ApplyWatermarkOptions): Promise<WatermarkResult> {
  if (!validatePdfMagicBytes(buffer)) {
    throw new Error('Invalid file format. The file is not a valid PDF document.');
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || '';
    if (errorMsg.includes('encrypted') || errorMsg.includes('password') || errorMsg.includes('decrypt')) {
      throw new Error('This PDF is password-protected. Please unlock encryption before applying watermarks.');
    }
    throw new Error(`Corrupted PDF: ${error.message || 'Cannot load document'}`);
  }

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  if (totalPages === 0) {
    throw new Error('Document contains no pages.');
  }

  // Track set of pages that received at least one watermark
  const modifiedPages = new Set<number>();

  // Cache embedded fonts and images to avoid re-embedding
  const embeddedFonts = new Map<string, PDFFont>();
  const embeddedImages = new Map<string, PDFImage>();

  const getFont = async (family: string = 'Helvetica', weight: string = 'normal'): Promise<PDFFont> => {
    let fontKey = StandardFonts.Helvetica;
    const isBold = weight === 'bold';

    if (family.toLowerCase().includes('times')) {
      fontKey = isBold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
    } else if (family.toLowerCase().includes('courier')) {
      fontKey = isBold ? StandardFonts.CourierBold : StandardFonts.Courier;
    } else {
      fontKey = isBold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
    }

    if (embeddedFonts.has(fontKey)) {
      return embeddedFonts.get(fontKey)!;
    }

    const font = await pdfDoc.embedFont(fontKey);
    embeddedFonts.set(fontKey, font);
    return font;
  };

  const getImage = async (wm: BackendWatermarkItem): Promise<PDFImage | null> => {
    if (!wm.imageBase64) return null;
    const cacheKey = wm.id || wm.imageBase64.substring(0, 40);
    if (embeddedImages.has(cacheKey)) {
      return embeddedImages.get(cacheKey)!;
    }

    let rawBase64 = wm.imageBase64;
    let isJpg = false;

    if (rawBase64.includes(';base64,')) {
      isJpg = rawBase64.includes('image/jpeg') || rawBase64.includes('image/jpg');
      rawBase64 = rawBase64.split(';base64,')[1];
    } else if (wm.imageMimeType) {
      isJpg = wm.imageMimeType === 'image/jpeg' || wm.imageMimeType === 'image/jpg';
    }

    const imageBytes = Buffer.from(rawBase64, 'base64');
    let embeddedImg: PDFImage;

    try {
      if (isJpg) {
        embeddedImg = await pdfDoc.embedJpg(imageBytes);
      } else {
        embeddedImg = await pdfDoc.embedPng(imageBytes);
      }
    } catch {
      // Try alternate format if primary failed
      try {
        embeddedImg = await pdfDoc.embedPng(imageBytes);
      } catch {
        embeddedImg = await pdfDoc.embedJpg(imageBytes);
      }
    }

    embeddedImages.set(cacheKey, embeddedImg);
    return embeddedImg;
  };

  // Process visible watermarks
  for (const wm of watermarks) {
    if (!wm.visible) continue;

    const targetPages = resolveTargetPages(wm.pageSelection, totalPages, currentPage);
    if (targetPages.size === 0) continue;

    // Font or Image preloading
    let font: PDFFont | null = null;
    let image: PDFImage | null = null;

    if (wm.type === 'text') {
      font = await getFont(wm.fontFamily, wm.fontWeight);
    } else if (wm.type === 'image') {
      image = await getImage(wm);
      if (!image) continue;
    }

    // Apply to target pages
    for (const pageNum of targetPages) {
      const pageIndex = pageNum - 1;
      const page = pages[pageIndex];
      if (!page) continue;

      modifiedPages.add(pageNum);
      const { width: pageWidth, height: pageHeight } = page.getSize();

      const opacity = typeof wm.opacity === 'number' ? Math.max(0, Math.min(1, wm.opacity)) : 0.3;
      const rotationAngle = wm.rotation ?? 0;

      if (wm.isTiled) {
        // Tiled repeating watermark
        const tileSpacingX = wm.tileSpacingX || 140;
        const tileSpacingY = wm.tileSpacingY || 120;
        const tileRot = wm.tileRotation ?? rotationAngle;
        const tileOp = wm.tileOpacity ?? opacity;

        const cols = Math.ceil(pageWidth / tileSpacingX) + 1;
        const rows = Math.ceil(pageHeight / tileSpacingY) + 1;

        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const x = c * tileSpacingX + (r % 2 === 1 ? tileSpacingX / 2 : 0) - 20;
            const y = r * tileSpacingY - 20;

            if (wm.type === 'text' && font) {
              const textContent = wm.text || 'CONFIDENTIAL';
              const fontSize = (wm.fontSize || 32) * 0.7; // slightly smaller in tiled
              page.drawText(textContent, {
                x,
                y,
                size: fontSize,
                font,
                color: hexToRgb(wm.color),
                opacity: tileOp,
                rotate: degrees(tileRot),
              });
            } else if (wm.type === 'image' && image) {
              const targetW = (wm.imageWidth || 100) * 0.7;
              const targetH = (wm.imageHeight || 60) * 0.7;
              page.drawImage(image, {
                x,
                y,
                width: targetW,
                height: targetH,
                opacity: tileOp,
                rotate: degrees(tileRot),
              });
            }
          }
        }
      } else {
        // Single positioned watermark
        let targetX = 0;
        let targetY = 0;

        if (wm.type === 'text' && font) {
          const textContent = wm.text || 'CONFIDENTIAL';
          const fontSize = wm.fontSize || 48;
          const textWidth = font.widthOfTextAtSize(textContent, fontSize);
          const textHeight = font.heightAtSize(fontSize);

          // Position calculation
          const posType = wm.positionType || 'center';
          if (posType === 'custom' && typeof wm.xPercent === 'number' && typeof wm.yPercent === 'number') {
            targetX = (wm.xPercent / 100) * pageWidth - textWidth / 2;
            targetY = pageHeight - (wm.yPercent / 100) * pageHeight - textHeight / 2;
          } else {
            switch (posType) {
              case 'top-left':
                targetX = 40;
                targetY = pageHeight - textHeight - 40;
                break;
              case 'top-center':
                targetX = (pageWidth - textWidth) / 2;
                targetY = pageHeight - textHeight - 40;
                break;
              case 'top-right':
                targetX = pageWidth - textWidth - 40;
                targetY = pageHeight - textHeight - 40;
                break;
              case 'center-left':
                targetX = 40;
                targetY = (pageHeight - textHeight) / 2;
                break;
              case 'center-right':
                targetX = pageWidth - textWidth - 40;
                targetY = (pageHeight - textHeight) / 2;
                break;
              case 'bottom-left':
                targetX = 40;
                targetY = 40;
                break;
              case 'bottom-center':
                targetX = (pageWidth - textWidth) / 2;
                targetY = 40;
                break;
              case 'bottom-right':
                targetX = pageWidth - textWidth - 40;
                targetY = 40;
                break;
              case 'center':
              default:
                targetX = (pageWidth - textWidth) / 2;
                targetY = (pageHeight - textHeight) / 2;
                break;
            }
          }

          page.drawText(textContent, {
            x: Math.max(10, Math.min(pageWidth - 20, targetX)),
            y: Math.max(10, Math.min(pageHeight - 20, targetY)),
            size: fontSize,
            font,
            color: hexToRgb(wm.color),
            opacity,
            rotate: degrees(rotationAngle),
          });
        } else if (wm.type === 'image' && image) {
          const imgWidth = wm.imageWidth || 180;
          const imgHeight = wm.imageHeight || 120;

          const posType = wm.positionType || 'center';
          if (posType === 'custom' && typeof wm.xPercent === 'number' && typeof wm.yPercent === 'number') {
            targetX = (wm.xPercent / 100) * pageWidth - imgWidth / 2;
            targetY = pageHeight - (wm.yPercent / 100) * pageHeight - imgHeight / 2;
          } else {
            switch (posType) {
              case 'top-left':
                targetX = 40;
                targetY = pageHeight - imgHeight - 40;
                break;
              case 'top-center':
                targetX = (pageWidth - imgWidth) / 2;
                targetY = pageHeight - imgHeight - 40;
                break;
              case 'top-right':
                targetX = pageWidth - imgWidth - 40;
                targetY = pageHeight - imgHeight - 40;
                break;
              case 'center-left':
                targetX = 40;
                targetY = (pageHeight - imgHeight) / 2;
                break;
              case 'center-right':
                targetX = pageWidth - imgWidth - 40;
                targetY = (pageHeight - imgHeight) / 2;
                break;
              case 'bottom-left':
                targetX = 40;
                targetY = 40;
                break;
              case 'bottom-center':
                targetX = (pageWidth - imgWidth) / 2;
                targetY = 40;
                break;
              case 'bottom-right':
                targetX = pageWidth - imgWidth - 40;
                targetY = 40;
                break;
              case 'center':
              default:
                targetX = (pageWidth - imgWidth) / 2;
                targetY = (pageHeight - imgHeight) / 2;
                break;
            }
          }

          page.drawImage(image, {
            x: Math.max(10, Math.min(pageWidth - 20, targetX)),
            y: Math.max(10, Math.min(pageHeight - 20, targetY)),
            width: imgWidth,
            height: imgHeight,
            opacity,
            rotate: degrees(rotationAngle),
          });
        }
      }
    }
  }

  const outputBytes = await pdfDoc.save();
  const outputBuffer = Buffer.from(outputBytes);

  return {
    buffer: outputBuffer,
    pageCount: totalPages,
    watermarkedPageCount: modifiedPages.size,
    fileSize: outputBuffer.length,
  };
}
