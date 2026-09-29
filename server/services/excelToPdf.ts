import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ConversionResult } from './types';

export async function convertExcelToPdf(excelBuffer: Buffer, originalFilename: string): Promise<ConversionResult> {
  const baseName = originalFilename.replace(/\.(xlsx|xls)$/i, '');
  const outFilename = `${baseName}.pdf`;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(excelBuffer);

  const pdfDoc = await PDFDocument.create();
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Landscape A4 for wide spreadsheet tables
  const PAGE_WIDTH = 841.89;
  const PAGE_HEIGHT = 595.28;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const MARGIN_TOP = 48;
  const MARGIN_BOTTOM = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let totalPagesRendered = 0;

  for (const sheet of workbook.worksheets) {
    if (sheet.rowCount === 0) continue;

    // Collect sheet rows & determine column count
    const rowsData: string[][] = [];
    let maxCols = 0;

    sheet.eachRow({ includeEmpty: false }, (row) => {
      const rowValues: string[] = [];
      const cells = row.values as any[];
      // row.values is 1-indexed in ExcelJS
      for (let c = 1; c < cells.length; c++) {
        const val = cells[c];
        if (val === null || val === undefined) {
          rowValues.push('');
        } else if (typeof val === 'object' && val.text) {
          rowValues.push(String(val.text));
        } else if (typeof val === 'object' && val.result !== undefined) {
          rowValues.push(String(val.result));
        } else {
          rowValues.push(String(val));
        }
      }
      if (rowValues.length > maxCols) maxCols = rowValues.length;
      rowsData.push(rowValues);
    });

    if (rowsData.length === 0) continue;

    // Limit columns to max 12 per page to avoid extreme cramping
    const displayCols = Math.min(12, Math.max(1, maxCols));
    const colWidth = CONTENT_WIDTH / displayCols;
    const rowHeight = 18;

    let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    totalPagesRendered++;
    let currentY = PAGE_HEIGHT - MARGIN_TOP;

    function addNewSheetPage() {
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      totalPagesRendered++;
      currentY = PAGE_HEIGHT - MARGIN_TOP;

      // Header on subsequent pages
      currentPage.drawText(`${sheet.name} (continued)`, {
        x: MARGIN_LEFT,
        y: currentY,
        size: 11,
        font: fontBold,
        color: rgb(0.06, 0.45, 0.28), // Excel emerald theme
      });
      currentY -= 24;
    }

    // Sheet Title Banner
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: currentY - 6,
      width: CONTENT_WIDTH,
      height: 26,
      color: rgb(0.06, 0.45, 0.28),
    });
    currentPage.drawText(`Sheet: ${sheet.name}`, {
      x: MARGIN_LEFT + 10,
      y: currentY + 1,
      size: 13,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    currentPage.drawText(`${rowsData.length} rows, ${displayCols} columns`, {
      x: PAGE_WIDTH - MARGIN_RIGHT - 140,
      y: currentY + 3,
      size: 9.5,
      font: fontNormal,
      color: rgb(0.85, 0.95, 0.9),
    });
    currentY -= 36;

    // Render table rows
    for (let rIdx = 0; rIdx < rowsData.length; rIdx++) {
      const row = rowsData[rIdx];
      const isHeader = rIdx === 0;

      if (currentY < MARGIN_BOTTOM + rowHeight + 10) {
        addNewSheetPage();
      }

      // Background fill
      if (isHeader) {
        currentPage.drawRectangle({
          x: MARGIN_LEFT,
          y: currentY - 3,
          width: CONTENT_WIDTH,
          height: rowHeight,
          color: rgb(0.88, 0.94, 0.91),
        });
      } else if (rIdx % 2 === 1) {
        currentPage.drawRectangle({
          x: MARGIN_LEFT,
          y: currentY - 3,
          width: CONTENT_WIDTH,
          height: rowHeight,
          color: rgb(0.97, 0.98, 0.99),
        });
      }

      // Draw Cells
      for (let c = 0; c < displayCols; c++) {
        const cellX = MARGIN_LEFT + c * colWidth;
        const rawText = row[c] || '';

        // Cell border
        currentPage.drawRectangle({
          x: cellX,
          y: currentY - 3,
          width: colWidth,
          height: rowHeight,
          borderColor: rgb(0.82, 0.86, 0.9),
          borderWidth: 0.5,
        });

        // Text truncated to fit column
        const maxChars = Math.max(6, Math.floor(colWidth / 5.5));
        const displayText = rawText.length > maxChars ? rawText.slice(0, maxChars - 2) + '..' : rawText;

        currentPage.drawText(displayText, {
          x: cellX + 4,
          y: currentY + 3,
          size: isHeader ? 8.5 : 8,
          font: isHeader ? fontBold : fontNormal,
          color: isHeader ? rgb(0.04, 0.3, 0.18) : rgb(0.18, 0.22, 0.28),
        });
      }
      currentY -= rowHeight;
    }
  }

  // Fallback if empty workbook
  if (totalPagesRendered === 0) {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawText('Spreadsheet contained no readable data.', {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT / 2,
      size: 12,
      font: fontNormal,
    });
    totalPagesRendered = 1;
  }

  // Add Page Numbers in footer
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const pageStr = `Page ${i + 1} of ${totalPages} • DocFusion Spreadsheet Engine`;
    const pageStrWidth = fontNormal.widthOfTextAtSize(pageStr, 8);
    page.drawText(pageStr, {
      x: PAGE_WIDTH - MARGIN_RIGHT - pageStrWidth,
      y: 20,
      size: 8,
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
      sheetsConverted: workbook.worksheets.length,
      pagesRendered: totalPages,
    },
  };
}
