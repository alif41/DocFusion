import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import {
  TextAnnotation,
  DrawingPath,
  SignatureAnnotation,
  ShapeAnnotation,
  StampAnnotation,
} from '../types/pdf';

export interface SavePDFEditorOptions {
  texts: TextAnnotation[];
  drawings: DrawingPath[];
  signatures: SignatureAnnotation[];
  shapes: ShapeAnnotation[];
  stamps: StampAnnotation[];
  pageRotations: Record<number, number>; // pageNum (1-indexed) -> degrees (0, 90, 180, 270)
  deletedPages: number[]; // 1-indexed page numbers to delete
  onProgress?: (stage: string, percent: number) => void;
}

/**
 * Parses hex color '#RRGGBB' into pdf-lib rgb() format
 */
function hexToRgbColor(hex: string) {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return rgb(0, 0, 0);

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return rgb(r, g, b);
}

/**
 * Bakes all visual annotations, texts, shapes, freehand paths, and page operations
 * into a standard, pristine PDF document using pdf-lib.
 */
export async function exportEditedPDF(
  sourceBytes: ArrayBuffer,
  options: SavePDFEditorOptions
): Promise<{ blob: Blob; url: string; size: number }> {
  options.onProgress?.('Loading base document structure...', 10);

  const pdfDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });

  // 1. Embed standard typefaces
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  const fontMap: Record<string, any> = {
    Helvetica: helvetica,
    HelveticaBold: helveticaBold,
    TimesRoman: timesRoman,
    Courier: courier,
  };

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  options.onProgress?.('Applying page modifications and annotations...', 25);

  // 2. Process annotations per page
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    // If page is marked for deletion, skip applying content
    if (options.deletedPages.includes(pageNum)) continue;

    const pageIndex = pageNum - 1;
    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // A. Apply Page Rotation if any
    const rot = options.pageRotations[pageNum];
    if (rot && rot !== 0) {
      const currentRot = page.getRotation().angle;
      page.setRotation(degrees((currentRot + rot) % 360));
    }

    // B. Draw Shapes & Redactions (drawn first, underneath text)
    const pageShapes = options.shapes.filter((s) => s.page === pageNum);
    for (const shape of pageShapes) {
      // Shape x, y are percentages (0..100) of page
      const xPt = (shape.x / 100) * pageWidth;
      const widthPt = (shape.width / 100) * pageWidth;
      const heightPt = (shape.height / 100) * pageHeight;
      // In PDF coordinate system, Y=0 is at bottom
      const yPt = pageHeight - (shape.y / 100) * pageHeight - heightPt;

      if (shape.shapeType === 'blackout') {
        page.drawRectangle({
          x: xPt,
          y: yPt,
          width: widthPt,
          height: heightPt,
          color: rgb(0, 0, 0),
          borderWidth: 0,
        });
      } else if (shape.shapeType === 'whiteout') {
        page.drawRectangle({
          x: xPt,
          y: yPt,
          width: widthPt,
          height: heightPt,
          color: rgb(1, 1, 1),
          borderWidth: 0,
        });
      } else if (shape.shapeType === 'highlight') {
        page.drawRectangle({
          x: xPt,
          y: yPt,
          width: widthPt,
          height: heightPt,
          color: shape.color ? hexToRgbColor(shape.color) : rgb(1, 0.95, 0.2),
          opacity: shape.opacity ?? 0.35,
          borderWidth: 0,
        });
      } else if (shape.shapeType === 'border') {
        page.drawRectangle({
          x: xPt,
          y: yPt,
          width: widthPt,
          height: heightPt,
          borderColor: shape.borderColor ? hexToRgbColor(shape.borderColor) : rgb(0.2, 0.4, 0.9),
          borderWidth: 2,
        });
      }
    }

    // C. Draw Freehand Drawings & Highlighters via offscreen canvas
    const pageDrawings = options.drawings.filter((d) => d.page === pageNum);
    if (pageDrawings.length > 0) {
      const renderScale = 2; // high resolution for crisp drawing
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = Math.round(pageWidth * renderScale);
      offscreenCanvas.height = Math.round(pageHeight * renderScale);
      const ctx = offscreenCanvas.getContext('2d');

      if (ctx) {
        ctx.scale(renderScale, renderScale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const draw of pageDrawings) {
          if (!draw.points || draw.points.length < 2) continue;

          ctx.beginPath();
          ctx.strokeStyle = draw.color;
          ctx.lineWidth = draw.strokeWidth;
          ctx.globalAlpha = draw.isHighlighter ? 0.35 : 1.0;

          // Points are in percentage (0..100) of page dimensions
          const p0 = draw.points[0];
          ctx.moveTo((p0.x / 100) * pageWidth, (p0.y / 100) * pageHeight);

          for (let i = 1; i < draw.points.length; i++) {
            const p = draw.points[i];
            ctx.lineTo((p.x / 100) * pageWidth, (p.y / 100) * pageHeight);
          }
          ctx.stroke();
        }

        // Export as PNG and embed into pdf-lib
        const pngDataUrl = offscreenCanvas.toDataURL('image/png');
        const pngImageBytes = await fetch(pngDataUrl).then((r) => r.arrayBuffer());
        const embeddedDrawing = await pdfDoc.embedPng(pngImageBytes);

        page.drawImage(embeddedDrawing, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      }
    }

    // D. Embed Signatures
    const pageSignatures = options.signatures.filter((s) => s.page === pageNum);
    for (const sig of pageSignatures) {
      try {
        const sigBytes = await fetch(sig.dataUrl).then((r) => r.arrayBuffer());
        const embeddedSig = await pdfDoc.embedPng(sigBytes);

        const widthPt = (sig.width / 100) * pageWidth;
        const heightPt = (sig.height / 100) * pageHeight;
        const xPt = (sig.x / 100) * pageWidth;
        const yPt = pageHeight - (sig.y / 100) * pageHeight - heightPt;

        page.drawImage(embeddedSig, {
          x: xPt,
          y: yPt,
          width: widthPt,
          height: heightPt,
        });
      } catch (sigErr) {
        console.warn('Could not embed signature:', sigErr);
      }
    }

    // E. Draw Text Annotations
    const pageTexts = options.texts.filter((t) => t.page === pageNum && t.text.trim().length > 0);
    for (const item of pageTexts) {
      const selectedFont =
        item.isBold && item.fontFamily === 'Helvetica'
          ? helveticaBold
          : fontMap[item.fontFamily] || helvetica;

      const fontSize = item.fontSize || 14;
      const xPt = (item.x / 100) * pageWidth;
      const yPt = pageHeight - (item.y / 100) * pageHeight - fontSize;

      const lines = item.text.split('\n');
      const lineHeight = fontSize * 1.25;

      // Draw background highlight box if selected
      if (item.bgColor && item.bgColor !== 'transparent') {
        const maxLineWidth = Math.max(
          ...lines.map((l) => selectedFont.widthOfTextAtSize(l, fontSize))
        );
        page.drawRectangle({
          x: xPt - 4,
          y: yPt - (lines.length - 1) * lineHeight - 4,
          width: maxLineWidth + 8,
          height: lines.length * lineHeight + 8,
          color: hexToRgbColor(item.bgColor),
          opacity: 0.4,
        });
      }

      // Draw text line by line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        page.drawText(line, {
          x: xPt,
          y: yPt - i * lineHeight,
          size: fontSize,
          font: selectedFont,
          color: hexToRgbColor(item.color || '#000000'),
        });
      }
    }

    // F. Draw Stamp Annotations
    const pageStamps = options.stamps.filter((s) => s.page === pageNum);
    for (const stamp of pageStamps) {
      const stampFont = helveticaBold;
      const fontSize = 16;
      const textWidth = stampFont.widthOfTextAtSize(stamp.label, fontSize);
      const paddingX = 14;
      const paddingY = 8;
      const boxWidth = textWidth + paddingX * 2;
      const boxHeight = fontSize + paddingY * 2;

      const xPt = (stamp.x / 100) * pageWidth;
      const yPt = pageHeight - (stamp.y / 100) * pageHeight - boxHeight;

      // Stamp background with rounded appearance
      page.drawRectangle({
        x: xPt,
        y: yPt,
        width: boxWidth,
        height: boxHeight,
        color: hexToRgbColor(stamp.bgColor),
        borderColor: hexToRgbColor(stamp.color),
        borderWidth: 2,
        opacity: 0.9,
      });

      // Stamp text
      page.drawText(stamp.label, {
        x: xPt + paddingX,
        y: yPt + paddingY + 2,
        size: fontSize,
        font: stampFont,
        color: hexToRgbColor(stamp.color),
      });
    }
  }

  // 3. Delete requested pages in reverse order (to maintain index stability)
  if (options.deletedPages.length > 0) {
    options.onProgress?.('Pruning deleted pages...', 75);
    const sortedDeleteIndices = [...options.deletedPages]
      .map((p) => p - 1)
      .sort((a, b) => b - a);

    for (const idx of sortedDeleteIndices) {
      if (idx >= 0 && idx < pdfDoc.getPageCount()) {
        pdfDoc.removePage(idx);
      }
    }
  }

  options.onProgress?.('Finalizing and encoding edited PDF...', 90);

  const finalBytes = await pdfDoc.save({
    useObjectStreams: true,
  });

  const blob = new Blob([finalBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  options.onProgress?.('Done!', 100);

  return {
    blob,
    url,
    size: blob.size,
  };
}
