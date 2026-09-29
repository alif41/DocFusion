import pptxgen from 'pptxgenjs';
import { extractPdfPages } from './pdfTextExtractor';
import { ConversionResult } from './types';

export async function convertPdfToPowerPoint(pdfBuffer: Buffer, originalFilename: string): Promise<ConversionResult> {
  const pages = await extractPdfPages(pdfBuffer);
  const baseName = originalFilename.replace(/\.pdf$/i, '');
  const outFilename = `${baseName}.pptx`;

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = baseName;
  pptx.subject = 'Converted from PDF with DocFusion';
  pptx.author = 'DocFusion Universal Doc Converter';

  for (let pIndex = 0; pIndex < pages.length; pIndex++) {
    const page = pages[pIndex];
    const slide = pptx.addSlide();

    // Subtle dark/clean presentation styling
    slide.background = { color: 'F8FAFC' };

    // Header badge
    slide.addText(`DocFusion Slide ${pIndex + 1} of ${pages.length}`, {
      x: 0.8,
      y: 0.35,
      w: 8.4,
      h: 0.3,
      fontSize: 9,
      color: '94A3B8',
      fontFace: 'Calibri',
    });

    // Find main title or first heading
    let title = '';
    const bodyLines: string[] = [];
    const tableCandidates: string[][] = [];

    for (const line of page.lines) {
      if (!title && (line.isHeading || line.fontSize >= 16)) {
        title = line.text;
      } else if (line.isTableCandidate && line.columns && line.columns.length >= 2) {
        tableCandidates.push(line.columns);
      } else {
        bodyLines.push(line.text);
      }
    }

    if (!title && page.lines.length > 0) {
      title = page.lines[0].text;
      bodyLines.shift();
    }

    if (!title) {
      title = `Page ${page.pageNumber}`;
    }

    // Add Slide Title
    slide.addText(title, {
      x: 0.8,
      y: 0.7,
      w: 8.4,
      h: 0.8,
      fontSize: 22,
      bold: true,
      color: '0F172A',
      fontFace: 'Calibri',
      valign: 'top',
    });

    let currentY = 1.6;

    // If there is an extracted table on this slide, render as native PPTX table
    if (tableCandidates.length >= 2) {
      const maxCols = Math.max(...tableCandidates.map((r) => r.length));
      const formattedRows = tableCandidates.slice(0, 10).map((row, rIdx) => {
        const isHeader = rIdx === 0;
        return Array.from({ length: maxCols }, (_, c) => ({
          text: row[c] || '',
          options: {
            bold: isHeader,
            fill: isHeader ? { color: 'E2E8F0' } : rIdx % 2 === 1 ? { color: 'F1F5F9' } : { color: 'FFFFFF' },
            color: isHeader ? '0F172A' : '334155',
            fontSize: isHeader ? 11 : 10,
          },
        }));
      });

      slide.addTable(formattedRows as any, {
        x: 0.8,
        y: currentY,
        w: 8.4,
        colW: Array(maxCols).fill(8.4 / maxCols),
        border: { pt: 0.5, color: 'CBD5E1' },
      });

      currentY += Math.min(2.5, formattedRows.length * 0.35 + 0.3);
    }

    // Add Body Content / Bullet Points
    if (bodyLines.length > 0) {
      const displayLines = bodyLines.slice(0, 14);
      const textObjects = displayLines.map((lineText) => ({
        text: lineText,
        options: {
          fontSize: 13,
          color: '334155',
          fontFace: 'Calibri',
          bullet: displayLines.length > 1,
          breakLine: true,
        },
      }));

      slide.addText(textObjects as any, {
        x: 0.8,
        y: Math.min(currentY, 4.2),
        w: 8.4,
        h: Math.max(1.0, 5.0 - currentY),
        valign: 'top',
      });
    } else if (tableCandidates.length === 0) {
      slide.addText('(Non-text visual elements or graphic content from PDF)', {
        x: 0.8,
        y: 2.2,
        w: 8.4,
        h: 1.0,
        fontSize: 12,
        italic: true,
        color: '94A3B8',
        fontFace: 'Calibri',
      });
    }
  }

  // Export buffer
  const outData = await pptx.write({ outputType: 'nodebuffer' });
  const buffer = Buffer.isBuffer(outData) ? outData : Buffer.from(outData as ArrayBuffer);

  return {
    buffer,
    filename: outFilename,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    pageCount: pages.length,
    stats: {
      slidesCreated: pages.length,
    },
  };
}
