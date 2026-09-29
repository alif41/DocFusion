import ExcelJS from 'exceljs';
import { extractPdfPages } from './pdfTextExtractor';
import { ConversionResult } from './types';

export async function convertPdfToExcel(pdfBuffer: Buffer, originalFilename: string): Promise<ConversionResult> {
  const pages = await extractPdfPages(pdfBuffer);
  const baseName = originalFilename.replace(/\.pdf$/i, '');
  const outFilename = `${baseName}.xlsx`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DocFusion Universal Doc Converter';
  workbook.lastModifiedBy = 'DocFusion Engine';
  workbook.created = new Date();
  workbook.modified = new Date();

  let totalTablesFound = 0;
  let totalRowsWritten = 0;

  // 1. Process each page
  for (let pIndex = 0; pIndex < pages.length; pIndex++) {
    const page = pages[pIndex];
    const sheetName = `Page ${page.pageNumber}`.slice(0, 31);
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    });

    let currentRow = 1;

    // Add page title banner
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = `${baseName} - Page ${page.pageNumber}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    worksheet.getRow(currentRow).height = 28;
    currentRow += 2;

    // Detect tabular segments and lines
    let lineIdx = 0;
    while (lineIdx < page.lines.length) {
      const line = page.lines[lineIdx];

      // If table candidate
      if (line.isTableCandidate && line.columns && line.columns.length >= 2) {
        const tableLines: string[][] = [];
        let maxCols = 0;
        while (lineIdx < page.lines.length && page.lines[lineIdx].isTableCandidate && page.lines[lineIdx].columns) {
          const cols = page.lines[lineIdx].columns!;
          tableLines.push(cols);
          if (cols.length > maxCols) maxCols = cols.length;
          lineIdx++;
        }

        if (tableLines.length >= 1) {
          totalTablesFound++;
          // Write table header
          const headerRow = worksheet.getRow(currentRow);
          const rawHeaders = tableLines[0];
          for (let c = 0; c < maxCols; c++) {
            const val = rawHeaders[c] || `Col ${c + 1}`;
            const cell = headerRow.getCell(c + 1);
            cell.value = val;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF475569' },
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
              left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            };
          }
          headerRow.height = 22;
          currentRow++;
          totalRowsWritten++;

          // Write table data rows
          for (let r = 1; r < tableLines.length; r++) {
            const dataRow = worksheet.getRow(currentRow);
            const rowValues = tableLines[r];
            const isAlt = r % 2 === 1;

            for (let c = 0; c < maxCols; c++) {
              const rawVal = rowValues[c] || '';
              const cell = dataRow.getCell(c + 1);

              // Check if numeric or currency
              const cleanNum = rawVal.replace(/[$,]/g, '').trim();
              const numVal = Number(cleanNum);
              if (cleanNum && !isNaN(numVal) && !cleanNum.startsWith('0') && cleanNum.length < 15) {
                cell.value = numVal;
                if (rawVal.includes('$')) {
                  cell.numFmt = '$#,##0.00';
                }
              } else {
                cell.value = rawVal;
              }

              cell.fill = isAlt
                ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
                : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              };
            }
            currentRow++;
            totalRowsWritten++;
          }
          currentRow++; // spacing between tables
          continue;
        }
      }

      // If heading or general text line
      const row = worksheet.getRow(currentRow);
      const cell = row.getCell(1);
      cell.value = line.text;

      if (line.isHeading) {
        cell.font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };
      } else {
        cell.font = { size: 10, color: { argb: 'FF334155' } };
      }
      currentRow++;
      lineIdx++;
      totalRowsWritten++;
    }

    // Auto-fit column widths
    worksheet.columns.forEach((column) => {
      let maxLen = 12;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const strVal = cell.value ? String(cell.value) : '';
        if (strVal.length > maxLen) {
          maxLen = Math.min(50, strVal.length);
        }
      });
      column.width = maxLen + 3;
    });
  }

  // If entire PDF had no rows, add a placeholder sheet
  if (workbook.worksheets.length === 0) {
    const ws = workbook.addWorksheet('Data');
    ws.getCell('A1').value = 'No structured tables found in PDF document.';
  }

  const rawBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.isBuffer(rawBuffer) ? rawBuffer : Buffer.from(rawBuffer);

  return {
    buffer,
    filename: outFilename,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pageCount: pages.length,
    stats: {
      sheetsCreated: workbook.worksheets.length,
      tablesFound: totalTablesFound,
      rowsWritten: totalRowsWritten,
    },
    warning: totalTablesFound === 0 ? 'No formal tabular grids detected in PDF; document lines converted into spreadsheet rows.' : undefined,
  };
}
