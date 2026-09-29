import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { EditablePage, TextElement, ImageElement, TableElement, ShapeElement } from './types';

export interface ExportPDFOptions {
  pages: EditablePage[];
  fileName?: string;
  includeBackground?: boolean;
  onProgress?: (progress: number, stage: string) => void;
}

function hexToRgb(hex: string) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return rgb(0, 0, 0);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

export async function exportDocumentToPDF(
  options: ExportPDFOptions
): Promise<{ blob: Blob; url: string; size: number }> {
  const { pages, onProgress, includeBackground = false } = options;
  onProgress?.(10, 'Initializing PDF document layout...');

  const pdfDoc = await PDFDocument.create();

  // Embed standard typefaces
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  const getFont = (family?: string, isBold?: boolean, isItalic?: boolean) => {
    const fam = (family || '').toLowerCase();
    if (fam.includes('times') || fam.includes('serif')) {
      return isBold ? timesBold : timesRoman;
    }
    if (fam.includes('courier') || fam.includes('mono')) {
      return courier;
    }
    if (isBold) return helveticaBold;
    if (isItalic) return helveticaOblique;
    return helvetica;
  };

  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    const pageData = pages[i];
    const pct = 15 + Math.round(((i + 1) / totalPages) * 75);
    onProgress?.(pct, `Re-rendering page ${i + 1} of ${totalPages}...`);

    const page = pdfDoc.addPage([pageData.width, pageData.height]);

    if (pageData.rotation && pageData.rotation !== 0) {
      page.setRotation(degrees(pageData.rotation));
    }

    // 1. Draw real document structure & background layer (logos, borders, lines, tables, vectors)
    if (pageData.backgroundUrl && pageData.backgroundUrl.startsWith('data:image/')) {
      try {
        const isPng = pageData.backgroundUrl.startsWith('data:image/png');
        const imgBytes = await fetch(pageData.backgroundUrl).then((r) => r.arrayBuffer());
        const embeddedBg = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
        page.drawImage(embeddedBg, {
          x: 0,
          y: 0,
          width: pageData.width,
          height: pageData.height,
        });
      } catch (e) {
        console.warn('Background image could not be embedded, rendering white canvas:', e);
      }
    }

    // 2. Render elements
    for (const el of pageData.elements) {
      if (el.type === 'shape') {
        const shape = el as ShapeElement;
        const pdfY = pageData.height - shape.y - shape.height;
        const fill = shape.fillColor ? hexToRgb(shape.fillColor) : undefined;
        const border = shape.borderColor ? hexToRgb(shape.borderColor) : undefined;

        if (shape.shapeType === 'circle') {
          page.drawEllipse({
            x: shape.x + shape.width / 2,
            y: pdfY + shape.height / 2,
            xScale: shape.width / 2,
            yScale: shape.height / 2,
            color: fill,
            borderColor: border,
            borderWidth: shape.borderWidth || 1,
            opacity: shape.opacity ?? 1,
          });
        } else {
          page.drawRectangle({
            x: shape.x,
            y: pdfY,
            width: shape.width,
            height: shape.height,
            color: fill,
            borderColor: border,
            borderWidth: shape.borderWidth || 0,
            opacity: shape.opacity ?? 1,
          });
        }
      } else if (el.type === 'image') {
        const img = el as ImageElement;
        if (img.src && img.src.startsWith('data:image/')) {
          try {
            const isPng = img.src.startsWith('data:image/png');
            const imgBytes = await fetch(img.src).then((r) => r.arrayBuffer());
            const embedded = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
            const pdfY = pageData.height - img.y - img.height;
            page.drawImage(embedded, {
              x: img.x,
              y: pdfY,
              width: img.width,
              height: img.height,
              opacity: img.opacity ?? 1,
            });
          } catch (e) {
            console.warn('Failed embedding user image:', e);
          }
        }
      } else if (el.type === 'table') {
        const tbl = el as TableElement;
        const rowHeight = tbl.height / Math.max(tbl.rows, 1);
        const colWidth = tbl.width / Math.max(tbl.cols, 1);
        const borderColor = hexToRgb(tbl.borderColor || '#cbd5e1');

        for (let r = 0; r < tbl.rows; r++) {
          for (let c = 0; c < tbl.cols; c++) {
            const cell = tbl.cells[r]?.[c];
            const cellX = tbl.x + c * colWidth;
            const cellTopY = tbl.y + r * rowHeight;
            const cellPdfY = pageData.height - cellTopY - rowHeight;

            // Background
            if (cell?.backgroundColor && cell.backgroundColor !== 'transparent') {
              page.drawRectangle({
                x: cellX,
                y: cellPdfY,
                width: colWidth,
                height: rowHeight,
                color: hexToRgb(cell.backgroundColor),
              });
            }

            // Cell border
            page.drawRectangle({
              x: cellX,
              y: cellPdfY,
              width: colWidth,
              height: rowHeight,
              borderColor,
              borderWidth: tbl.borderWidth || 1,
            });

            // Cell Text
            if (cell?.text) {
              const font = cell.fontWeight === 'bold' ? helveticaBold : helvetica;
              const fSize = cell.fontSize || 10;
              const textY = cellPdfY + (rowHeight - fSize) / 2;
              page.drawText(cell.text, {
                x: cellX + 4,
                y: textY,
                size: fSize,
                font,
                color: cell.color ? hexToRgb(cell.color) : rgb(0, 0, 0),
              });
            }
          }
        }
      } else {
        // Text element: text / heading / paragraph / list_item
        const txt = el as TextElement;
        if (!txt.text) continue;

        const isBold = txt.fontWeight === 'bold' || txt.fontWeight === '700' || (typeof txt.fontWeight === 'number' && txt.fontWeight >= 600);
        const isItalic = txt.fontStyle === 'italic';
        const font = getFont(txt.fontFamily, isBold, isItalic);
        const fontSize = Math.max(7, txt.fontSize || 12);
        const textColor = hexToRgb(txt.color || '#000000');

        // Draw background highlight only if explicitly provided (e.g. text highlight color)
        if (txt.backgroundColor && txt.backgroundColor !== 'transparent') {
          const pdfY = pageData.height - txt.y - txt.height;
          page.drawRectangle({
            x: txt.x - 2,
            y: pdfY - 2,
            width: txt.width + 4,
            height: txt.height + 4,
            color: hexToRgb(txt.backgroundColor),
          });
        }

        // Draw text lines
        const lines = txt.text.split('\n');
        const lineSpacing = fontSize * (txt.lineHeight || 1.3);

        for (let lIdx = 0; lIdx < lines.length; lIdx++) {
          const lineStr = lines[lIdx];
          if (!lineStr) continue;

          // Compute y position
          const lineY = pageData.height - txt.y - fontSize * 0.9 - lIdx * lineSpacing;

          // Safe drawing (replace unsupported characters with space)
          const sanitized = lineStr.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');

          page.drawText(sanitized, {
            x: txt.x + (txt.indent ? txt.indent * 18 : 0),
            y: lineY,
            size: fontSize,
            font,
            color: textColor,
          });

          // Underline
          if (txt.underline) {
            const textWidth = font.widthOfTextAtSize(sanitized, fontSize);
            page.drawLine({
              start: { x: txt.x, y: lineY - 2 },
              end: { x: txt.x + textWidth, y: lineY - 2 },
              thickness: 1,
              color: textColor,
            });
          }

          // Strikethrough
          if (txt.strikethrough) {
            const textWidth = font.widthOfTextAtSize(sanitized, fontSize);
            page.drawLine({
              start: { x: txt.x, y: lineY + fontSize * 0.35 },
              end: { x: txt.x + textWidth, y: lineY + fontSize * 0.35 },
              thickness: 1,
              color: textColor,
            });
          }
        }
      }
    }
  }

  onProgress?.(95, 'Finalizing PDF file...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  onProgress?.(100, 'Export complete!');
  return {
    blob,
    url,
    size: blob.size,
  };
}
