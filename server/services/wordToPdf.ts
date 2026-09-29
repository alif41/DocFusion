import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ConversionResult } from './types';

interface DocBlock {
  type: 'title' | 'heading1' | 'heading2' | 'paragraph' | 'bullet' | 'table';
  text?: string;
  tableData?: string[][];
  bold?: boolean;
}

export async function convertWordToPdf(wordBuffer: Buffer, originalFilename: string): Promise<ConversionResult> {
  const baseName = originalFilename.replace(/\.(docx|doc)$/i, '');
  const outFilename = `${baseName}.pdf`;

  // Extract structured HTML using mammoth
  let rawHtml = '';
  try {
    const res = await mammoth.convertToHtml({ buffer: wordBuffer });
    rawHtml = res.value || '';
  } catch (err) {
    console.warn('Mammoth HTML extraction notice, trying raw text fallback:', err);
    try {
      const textRes = await mammoth.extractRawText({ buffer: wordBuffer });
      rawHtml = (textRes.value || '').split('\n').map((l) => `<p>${l}</p>`).join('');
    } catch {
      rawHtml = '<p>Unable to extract document text.</p>';
    }
  }

  // Parse HTML into blocks
  const blocks: DocBlock[] = [];

  // Match headers, paragraphs, lists, tables
  const tagRegex = /<(h[1-6]|p|li|table)[\s\S]*?>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = tagRegex.exec(rawHtml)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];

    if (tag === 'table') {
      // Parse table rows and cells
      const tableData: string[][] = [];
      const rowRegex = /<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi;
      let rMatch;
      while ((rMatch = rowRegex.exec(content)) !== null) {
        const cellRegex = /<(td|th)[\s\S]*?>([\s\S]*?)<\/\1>/gi;
        const rowCells: string[] = [];
        let cMatch;
        while ((cMatch = cellRegex.exec(rMatch[1])) !== null) {
          const cleanCellText = cMatch[2].replace(/<[^>]+>/g, '').trim();
          rowCells.push(cleanCellText);
        }
        if (rowCells.length > 0) {
          tableData.push(rowCells);
        }
      }
      if (tableData.length > 0) {
        blocks.push({ type: 'table', tableData });
      }
    } else {
      const cleanText = content.replace(/<[^>]+>/g, '').trim();
      if (!cleanText) continue;

      if (tag === 'h1') {
        blocks.push({ type: 'heading1', text: cleanText });
      } else if (tag === 'h2' || tag === 'h3') {
        blocks.push({ type: 'heading2', text: cleanText });
      } else if (tag === 'li') {
        blocks.push({ type: 'bullet', text: cleanText });
      } else {
        blocks.push({ type: 'paragraph', text: cleanText });
      }
    }
  }

  // Fallback if no blocks were matched
  if (blocks.length === 0) {
    blocks.push({
      type: 'paragraph',
      text: originalFilename.replace(/[-_]/g, ' '),
    });
  }

  // Generate PDF document using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_WIDTH = 595.28; // Standard A4 points
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 54;
  const MARGIN_RIGHT = 54;
  const MARGIN_TOP = 64;
  const MARGIN_BOTTOM = 54;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let currentY = PAGE_HEIGHT - MARGIN_TOP;

  function addNewPage() {
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    currentY = PAGE_HEIGHT - MARGIN_TOP;
  }

  // Helper to wrap text into lines
  function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Draw Document Title on Page 1
  currentPage.drawText(baseName.replace(/[-_]/g, ' '), {
    x: MARGIN_LEFT,
    y: currentY,
    size: 20,
    font: fontBold,
    color: rgb(0.08, 0.1, 0.18),
  });
  currentY -= 30;

  // Thin dividing line
  currentPage.drawLine({
    start: { x: MARGIN_LEFT, y: currentY + 12 },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: currentY + 12 },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  // Render each block
  for (const block of blocks) {
    if (block.type === 'heading1') {
      if (currentY < MARGIN_BOTTOM + 50) addNewPage();
      currentY -= 12;
      const lines = wrapText(block.text || '', CONTENT_WIDTH, fontBold, 15);
      for (const line of lines) {
        if (currentY < MARGIN_BOTTOM + 25) addNewPage();
        currentPage.drawText(line, {
          x: MARGIN_LEFT,
          y: currentY,
          size: 15,
          font: fontBold,
          color: rgb(0.12, 0.15, 0.28),
        });
        currentY -= 20;
      }
      currentY -= 4;
    } else if (block.type === 'heading2') {
      if (currentY < MARGIN_BOTTOM + 40) addNewPage();
      currentY -= 8;
      const lines = wrapText(block.text || '', CONTENT_WIDTH, fontBold, 12);
      for (const line of lines) {
        if (currentY < MARGIN_BOTTOM + 20) addNewPage();
        currentPage.drawText(line, {
          x: MARGIN_LEFT,
          y: currentY,
          size: 12,
          font: fontBold,
          color: rgb(0.2, 0.25, 0.35),
        });
        currentY -= 16;
      }
      currentY -= 2;
    } else if (block.type === 'bullet') {
      const lines = wrapText(block.text || '', CONTENT_WIDTH - 20, fontNormal, 10);
      let isFirst = true;
      for (const line of lines) {
        if (currentY < MARGIN_BOTTOM + 20) addNewPage();
        if (isFirst) {
          currentPage.drawText('•', {
            x: MARGIN_LEFT + 4,
            y: currentY,
            size: 11,
            font: fontBold,
            color: rgb(0.45, 0.35, 0.85),
          });
          isFirst = false;
        }
        currentPage.drawText(line, {
          x: MARGIN_LEFT + 18,
          y: currentY,
          size: 10,
          font: fontNormal,
          color: rgb(0.2, 0.25, 0.3),
        });
        currentY -= 14;
      }
      currentY -= 3;
    } else if (block.type === 'paragraph') {
      const lines = wrapText(block.text || '', CONTENT_WIDTH, fontNormal, 10);
      for (const line of lines) {
        if (currentY < MARGIN_BOTTOM + 20) addNewPage();
        currentPage.drawText(line, {
          x: MARGIN_LEFT,
          y: currentY,
          size: 10,
          font: fontNormal,
          color: rgb(0.2, 0.25, 0.3),
        });
        currentY -= 14;
      }
      currentY -= 6;
    } else if (block.type === 'table' && block.tableData && block.tableData.length > 0) {
      const tableData = block.tableData;
      const colCount = Math.max(...tableData.map((r) => r.length));
      const colWidth = CONTENT_WIDTH / colCount;
      const rowHeight = 20;

      for (let rIdx = 0; rIdx < tableData.length; rIdx++) {
        const row = tableData[rIdx];
        const isHeader = rIdx === 0;

        if (currentY < MARGIN_BOTTOM + rowHeight + 10) addNewPage();

        // Row background
        if (isHeader) {
          currentPage.drawRectangle({
            x: MARGIN_LEFT,
            y: currentY - 3,
            width: CONTENT_WIDTH,
            height: rowHeight,
            color: rgb(0.92, 0.94, 0.97),
          });
        } else if (rIdx % 2 === 1) {
          currentPage.drawRectangle({
            x: MARGIN_LEFT,
            y: currentY - 3,
            width: CONTENT_WIDTH,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.99),
          });
        }

        // Cell borders & text
        for (let c = 0; c < colCount; c++) {
          const cellText = row[c] || '';
          const cellX = MARGIN_LEFT + c * colWidth;

          // Draw cell border
          currentPage.drawRectangle({
            x: cellX,
            y: currentY - 3,
            width: colWidth,
            height: rowHeight,
            borderColor: rgb(0.85, 0.88, 0.92),
            borderWidth: 0.5,
          });

          // Draw text clipped to cell width
          const truncated = cellText.length > 35 ? cellText.slice(0, 32) + '...' : cellText;
          currentPage.drawText(truncated, {
            x: cellX + 5,
            y: currentY + 3,
            size: isHeader ? 9 : 8.5,
            font: isHeader ? fontBold : fontNormal,
            color: isHeader ? rgb(0.1, 0.15, 0.25) : rgb(0.25, 0.3, 0.35),
          });
        }
        currentY -= rowHeight;
      }
      currentY -= 12;
    }
  }

  // Add Headers & Footers with page numbering on all pages
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    // Header
    page.drawText('DocFusion Converted Document', {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 32,
      size: 8,
      font: fontItalic,
      color: rgb(0.6, 0.65, 0.7),
    });

    // Footer page number
    const pageStr = `Page ${i + 1} of ${totalPages}`;
    const pageStrWidth = fontNormal.widthOfTextAtSize(pageStr, 8.5);
    page.drawText(pageStr, {
      x: PAGE_WIDTH - MARGIN_RIGHT - pageStrWidth,
      y: 28,
      size: 8.5,
      font: fontNormal,
      color: rgb(0.55, 0.6, 0.65),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return {
    buffer,
    filename: outFilename,
    mimeType: 'application/pdf',
    pageCount: totalPages,
    stats: {
      pagesGenerated: totalPages,
      blocksFormatted: blocks.length,
    },
  };
}
