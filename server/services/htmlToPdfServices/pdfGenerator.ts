import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { HtmlToPdfConfig } from './types';

// Standard paper dimensions in points (72 points = 1 inch)
export const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  A5: [419.53, 595.28],
  Letter: [612.0, 792.0],
  Legal: [612.0, 1008.0],
};

function getDimensions(config: HtmlToPdfConfig): [number, number] {
  let [width, height] = PAGE_SIZES[config.pageSize] || PAGE_SIZES.A4;

  if (config.pageSize === 'Custom' && config.customPageSize) {
    const { width: w, height: h, unit } = config.customPageSize;
    let factor = 72 / 25.4; // default mm to pt
    if (unit === 'cm') factor = 72 / 2.54;
    if (unit === 'inch') factor = 72;
    if (unit === 'pt') factor = 1;
    width = w * factor;
    height = h * factor;
  }

  if (config.orientation === 'landscape') {
    return [Math.max(width, height), Math.min(width, height)];
  }
  return [Math.min(width, height), Math.max(width, height)];
}

function getMarginPoints(marginVal: number, unit: 'mm' | 'cm' | 'inch'): number {
  if (unit === 'cm') return (marginVal * 72) / 2.54;
  if (unit === 'inch') return marginVal * 72;
  return (marginVal * 72) / 25.4; // mm
}

export interface PageImageInput {
  imageBuffer: Buffer;
  mimeType: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
}

export async function createPdfFromPageImages(
  pages: PageImageInput[],
  config: HtmlToPdfConfig,
  metadata?: { title?: string; author?: string; filename?: string }
): Promise<{ buffer: Buffer; pagesCount: number }> {
  const pdfDoc = await PDFDocument.create();

  if (metadata?.title) pdfDoc.setTitle(metadata.title);
  pdfDoc.setAuthor('DocFusion HTML to PDF');
  pdfDoc.setProducer('DocFusion Universal Engine');
  pdfDoc.setCreationDate(new Date());

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const [pageWidth, pageHeight] = getDimensions(config);

  // Compute margins
  let marginTop = 28.35; // 10mm in pt
  let marginBottom = 28.35;
  let marginLeft = 28.35;
  let marginRight = 28.35;

  if (config.margins.type === 'none') {
    marginTop = marginBottom = marginLeft = marginRight = 0;
  } else if (config.margins.type === 'small') {
    marginTop = marginBottom = marginLeft = marginRight = 14.17; // 5mm
  } else if (config.margins.type === 'medium') {
    marginTop = marginBottom = marginLeft = marginRight = 42.52; // 15mm
  } else if (config.margins.type === 'large') {
    marginTop = marginBottom = marginLeft = marginRight = 70.87; // 25mm
  } else if (config.margins.type === 'custom') {
    const u = config.margins.unit;
    marginTop = getMarginPoints(config.margins.top, u);
    marginBottom = getMarginPoints(config.margins.bottom, u);
    marginLeft = getMarginPoints(config.margins.left, u);
    marginRight = getMarginPoints(config.margins.right, u);
  }

  // Adjust for header/footer if enabled
  const headerHeight = config.headerFooter.enabled ? 30 : 0;
  const footerHeight = config.headerFooter.enabled ? 30 : 0;

  const contentWidth = pageWidth - marginLeft - marginRight;
  const contentHeight = pageHeight - marginTop - marginBottom - headerHeight - footerHeight;

  const totalPages = pages.length;

  for (let i = 0; i < pages.length; i++) {
    const pageItem = pages[i];
    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);

    // Embed page image
    const embeddedImg =
      pageItem.mimeType === 'image/jpeg'
        ? await pdfDoc.embedJpg(pageItem.imageBuffer)
        : await pdfDoc.embedPng(pageItem.imageBuffer);

    // Calculate aspect ratio fit within printable content box
    const imgAspect = pageItem.width / pageItem.height;
    const boxAspect = contentWidth / contentHeight;

    let drawW = contentWidth;
    let drawH = contentHeight;

    if (imgAspect > boxAspect) {
      drawW = contentWidth;
      drawH = contentWidth / imgAspect;
    } else {
      drawH = contentHeight;
      drawW = contentHeight * imgAspect;
    }

    const x = marginLeft + (contentWidth - drawW) / 2;
    const y = marginBottom + footerHeight + (contentHeight - drawH) / 2;

    pdfPage.drawImage(embeddedImg, {
      x,
      y,
      width: drawW,
      height: drawH,
    });

    // Render Headers & Footers if enabled
    if (config.headerFooter.enabled) {
      const headerY = pageHeight - marginTop - 14;
      const footerY = marginBottom + 14;
      const hCfg = config.headerFooter.header;
      const fCfg = config.headerFooter.footer;

      // Header line
      pdfPage.drawLine({
        start: { x: marginLeft, y: pageHeight - marginTop - 22 },
        end: { x: pageWidth - marginRight, y: pageHeight - marginTop - 22 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Header Text Left
      if (hCfg.leftText) {
        pdfPage.drawText(hCfg.leftText, {
          x: marginLeft,
          y: headerY,
          size: hCfg.fontSize || 9,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }

      // Header Title / Center
      const headerCenter = hCfg.showTitle ? metadata?.title || hCfg.centerText || '' : hCfg.centerText || '';
      if (headerCenter) {
        const textW = font.widthOfTextAtSize(headerCenter, hCfg.fontSize || 9);
        pdfPage.drawText(headerCenter, {
          x: (pageWidth - textW) / 2,
          y: headerY,
          size: hCfg.fontSize || 9,
          font: fontBold,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      // Header Right / Date
      const headerRight = hCfg.showDate
        ? new Date().toLocaleDateString()
        : hCfg.rightText || '';
      if (headerRight) {
        const textW = font.widthOfTextAtSize(headerRight, hCfg.fontSize || 9);
        pdfPage.drawText(headerRight, {
          x: pageWidth - marginRight - textW,
          y: headerY,
          size: hCfg.fontSize || 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      // Footer line
      pdfPage.drawLine({
        start: { x: marginLeft, y: marginBottom + 24 },
        end: { x: pageWidth - marginRight, y: marginBottom + 24 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Footer Text Left
      if (fCfg.leftText) {
        pdfPage.drawText(fCfg.leftText, {
          x: marginLeft,
          y: footerY,
          size: fCfg.fontSize || 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      // Footer Center
      if (fCfg.centerText) {
        const textW = font.widthOfTextAtSize(fCfg.centerText, fCfg.fontSize || 9);
        pdfPage.drawText(fCfg.centerText, {
          x: (pageWidth - textW) / 2,
          y: footerY,
          size: fCfg.fontSize || 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      // Footer Right: Page Numbers (e.g. Page 1 of 5)
      let pageStr = fCfg.rightText || '';
      if (fCfg.showPageNumber && fCfg.showTotalPages) {
        pageStr = `Page ${i + 1} of ${totalPages}`;
      } else if (fCfg.showPageNumber) {
        pageStr = `Page ${i + 1}`;
      }
      if (pageStr) {
        const textW = font.widthOfTextAtSize(pageStr, fCfg.fontSize || 9);
        pdfPage.drawText(pageStr, {
          x: pageWidth - marginRight - textW,
          y: footerY,
          size: fCfg.fontSize || 9,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    pagesCount: totalPages,
  };
}
