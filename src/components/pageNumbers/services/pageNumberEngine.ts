import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { PageNumberOptions, PageNumberResult } from '../types';

/**
 * Converts integer to Roman numerals (e.g. 1 -> I, 4 -> IV, 9 -> IX)
 */
export function toRoman(num: number, uppercase: boolean = false): string {
  if (num <= 0) return num.toString();
  const lookup: [number, string][] = [
    [1000, 'm'],
    [900, 'cm'],
    [500, 'd'],
    [400, 'cd'],
    [100, 'c'],
    [90, 'xc'],
    [50, 'l'],
    [40, 'xl'],
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ];
  let roman = '';
  let n = num;
  for (const [val, str] of lookup) {
    while (n >= val) {
      roman += str;
      n -= val;
    }
  }
  return uppercase ? roman.toUpperCase() : roman;
}

/**
 * Parses user input page ranges like "1-5, 8, 10-12" into a Set of 1-based page numbers
 */
export function parseCustomPageRange(rangeStr: string, totalPages: number): Set<number> {
  const result = new Set<number>();
  if (!rangeStr.trim()) {
    for (let i = 1; i <= totalPages; i++) result.add(i);
    return result;
  }

  const parts = rangeStr.split(/[,;\s]+/).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [startRaw, endRaw] = part.split('-');
      const start = parseInt(startRaw.trim(), 10);
      const end = parseInt(endRaw.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          result.add(i);
        }
      }
    } else {
      const page = parseInt(part.trim(), 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        result.add(page);
      }
    }
  }
  return result;
}

/**
 * Formats the page number string based on the selected format and current/total page values
 */
export function formatPageNumber(
  format: PageNumberOptions['format'],
  currentNumber: number,
  totalNumberedPages: number,
  customFormat: string
): string {
  switch (format) {
    case 'number':
      return `${currentNumber}`;
    case 'page-n':
      return `Page ${currentNumber}`;
    case 'page-n-of-total':
      return `Page ${currentNumber} of ${totalNumberedPages}`;
    case 'n-of-total':
      return `${currentNumber} / ${totalNumberedPages}`;
    case 'dash-n-dash':
      return `- ${currentNumber} -`;
    case 'bracket-n':
      return `[ ${currentNumber} ]`;
    case 'roman-lower':
      return toRoman(currentNumber, false);
    case 'roman-upper':
      return toRoman(currentNumber, true);
    case 'custom': {
      const tpl = customFormat || 'Page {n} of {total}';
      return tpl
        .replace(/\{n\}/gi, currentNumber.toString())
        .replace(/\{total\}/gi, totalNumberedPages.toString());
    }
    default:
      return `${currentNumber}`;
  }
}

/**
 * Helper to convert hex string to PDF rgb(0-1, 0-1, 0-1)
 */
export function hexToPdfRgb(hex: string) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) {
    return rgb(0.2, 0.2, 0.2);
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0.2 : r, isNaN(g) ? 0.2 : g, isNaN(b) ? 0.2 : b);
}

/**
 * Resolves standard font for pdf-lib
 */
function getStandardFontName(fontFamily: PageNumberOptions['fontFamily']): StandardFonts {
  switch (fontFamily) {
    case 'Helvetica-Bold':
      return StandardFonts.HelveticaBold;
    case 'Times-Roman':
      return StandardFonts.TimesRoman;
    case 'Courier':
      return StandardFonts.Courier;
    case 'Helvetica':
    default:
      return StandardFonts.Helvetica;
  }
}

/**
 * Client-side engine: stamps page numbers onto a PDF using pdf-lib
 */
export async function applyPageNumbersToPdf(
  file: File,
  options: PageNumberOptions,
  onProgress?: (step: string, percent: number) => void
): Promise<PageNumberResult> {
  onProgress?.('Reading PDF Document', 10);
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.('Parsing Document Structure', 25);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  if (totalPages === 0) {
    throw new Error('This PDF contains zero pages.');
  }

  onProgress?.('Embedding Typography', 45);
  const fontKey = getStandardFontName(options.fontFamily);
  const font: PDFFont = await pdfDoc.embedFont(fontKey);

  // Determine which physical pages (1-indexed) will receive numbers
  let targetPagesSet: Set<number>;
  if (options.pageRangeType === 'custom') {
    targetPagesSet = parseCustomPageRange(options.customPageRange, totalPages);
  } else {
    targetPagesSet = new Set<number>();
    for (let p = 1; p <= totalPages; p++) {
      targetPagesSet.add(p);
    }
  }

  // Handle skip rules
  if (options.skipFirstPage) {
    targetPagesSet.delete(1);
  }
  if (options.skipLastPage && totalPages > 1) {
    targetPagesSet.delete(totalPages);
  }

  // Handle startFromPage offset
  if (options.startFromPage > 1) {
    for (let p = 1; p < options.startFromPage; p++) {
      targetPagesSet.delete(p);
    }
  }

  // Sorted list of 1-based page indices that will receive numbers
  const targetPages = Array.from(targetPagesSet).sort((a, b) => a - b);
  const totalNumberedPages = targetPages.length;

  if (totalNumberedPages === 0) {
    throw new Error('No pages matched your numbering range criteria. Please check your page range settings.');
  }

  onProgress?.('Calculating Coordinates & Stamping Numbers', 60);

  const textColor = hexToPdfRgb(options.textColor);
  const fontSize = options.fontSize || 10;
  const opacity = typeof options.opacity === 'number' ? Math.max(0.1, Math.min(1.0, options.opacity)) : 1.0;
  const marginH = options.marginHorizontal ?? 36;
  const marginV = options.marginVertical ?? 36;

  // Track the incremental number
  let currentNumberCounter = options.startingNumber || 1;

  for (let i = 0; i < targetPages.length; i++) {
    const pageNum = targetPages[i];
    const pageIndex = pageNum - 1;
    const page = pages[pageIndex];
    if (!page) continue;

    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Generate formatted text
    const text = formatPageNumber(
      options.format,
      currentNumberCounter,
      totalNumberedPages,
      options.customFormat
    );

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    // Compute X coordinate
    let x = marginH;
    if (options.position.includes('center')) {
      x = (pageWidth - textWidth) / 2;
    } else if (options.position.includes('right')) {
      x = pageWidth - marginH - textWidth;
    } else {
      // left
      x = marginH;
    }

    // Compute Y coordinate
    // Note: PDF coordinate system (0,0) is at the bottom-left corner
    let y = marginV;
    if (options.position.startsWith('top')) {
      y = pageHeight - marginV - textHeight;
    } else {
      // bottom
      y = marginV;
    }

    // Optional background pill for readability over dark or complex content
    if (options.showBackgroundBadge) {
      const paddingX = 7;
      const paddingY = 3.5;
      const badgeWidth = textWidth + paddingX * 2;
      const badgeHeight = textHeight + paddingY * 2;
      const badgeX = x - paddingX;
      const badgeY = y - paddingY / 2;

      let badgeFill = rgb(1, 1, 1);
      let badgeOpacity = 0.92;

      if (options.badgeStyle === 'dark') {
        badgeFill = rgb(0.08, 0.08, 0.12);
        badgeOpacity = 0.88;
      } else if (options.badgeStyle === 'glass') {
        badgeFill = rgb(0.95, 0.95, 0.98);
        badgeOpacity = 0.75;
      }

      page.drawRectangle({
        x: badgeX,
        y: badgeY,
        width: badgeWidth,
        height: badgeHeight,
        color: badgeFill,
        opacity: badgeOpacity,
        borderColor: options.badgeStyle === 'dark' ? rgb(0.2, 0.2, 0.25) : rgb(0.85, 0.85, 0.9),
        borderWidth: 0.5,
      });
    }

    // Draw the page number text
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: textColor,
      opacity,
    });

    currentNumberCounter++;

    if (i % 5 === 0 || i === targetPages.length - 1) {
      const pct = 60 + Math.round(((i + 1) / targetPages.length) * 30);
      onProgress?.(`Stamping Page ${pageNum} of ${totalPages}`, pct);
    }
  }

  onProgress?.('Finalizing PDF Stream', 95);
  const pdfBytes = await pdfDoc.save();

  onProgress?.('Generating Download Artifact', 100);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);

  const baseName = file.name.replace(/\.pdf$/i, '');
  const outFilename = `${baseName}-numbered.pdf`;

  return {
    downloadUrl,
    blob,
    filename: outFilename,
    originalSize: file.size,
    newSize: blob.size,
    totalPages,
    pagesNumberedCount: totalNumberedPages,
  };
}
