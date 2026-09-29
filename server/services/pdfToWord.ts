import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
} from 'docx';
import { extractPdfPages } from './pdfTextExtractor';
import { ConversionResult } from './types';

export async function convertPdfToWord(pdfBuffer: Buffer, originalFilename: string): Promise<ConversionResult> {
  const pages = await extractPdfPages(pdfBuffer);
  const baseName = originalFilename.replace(/\.pdf$/i, '');
  const outFilename = `${baseName}.docx`;

  const docChildren: (Paragraph | Table)[] = [];

  // Title / Document Header banner
  docChildren.push(
    new Paragraph({
      text: baseName.replace(/[-_]/g, ' '),
      heading: HeadingLevel.TITLE,
      spacing: { after: 200, before: 100 },
    })
  );

  let hasContent = false;

  for (let pIndex = 0; pIndex < pages.length; pIndex++) {
    const page = pages[pIndex];

    if (pIndex > 0) {
      docChildren.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    // Process page lines & tables
    let lineIdx = 0;
    while (lineIdx < page.lines.length) {
      const line = page.lines[lineIdx];

      // Check if this line is part of an extracted table
      if (line.isTableCandidate && line.columns && line.columns.length >= 2) {
        // Collect consecutive table candidate lines
        const tableLines: string[][] = [];
        let maxCols = 0;
        while (lineIdx < page.lines.length && page.lines[lineIdx].isTableCandidate && page.lines[lineIdx].columns) {
          const cols = page.lines[lineIdx].columns!;
          tableLines.push(cols);
          if (cols.length > maxCols) maxCols = cols.length;
          lineIdx++;
        }

        if (tableLines.length >= 2 && maxCols >= 2) {
          hasContent = true;
          // Build Word Table
          const tableRows: TableRow[] = tableLines.map((rowCols, rIdx) => {
            const isHeaderRow = rIdx === 0;
            // Pad columns to maxCols
            const cells: TableCell[] = [];
            for (let c = 0; c < maxCols; c++) {
              const cellText = rowCols[c] || '';
              cells.push(
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cellText,
                          bold: isHeaderRow,
                          size: isHeaderRow ? 22 : 20, // half-points
                          color: isHeaderRow ? '1e1b4b' : '334155',
                        }),
                      ],
                    }),
                  ],
                  shading: isHeaderRow
                    ? { fill: 'f1f5f9' }
                    : rIdx % 2 === 1
                    ? { fill: 'f8fafc' }
                    : undefined,
                  margins: {
                    top: 100,
                    bottom: 100,
                    left: 140,
                    right: 140,
                  },
                })
              );
            }
            return new TableRow({ children: cells });
          });

          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );

          docChildren.push(
            new Paragraph({
              text: '',
              spacing: { after: 140 },
            })
          );
          continue;
        }
      }

      // Regular line or heading
      hasContent = true;
      if (line.isHeading) {
        const hl =
          line.headingLevel === 1
            ? HeadingLevel.HEADING_1
            : line.headingLevel === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3;

        docChildren.push(
          new Paragraph({
            text: line.text,
            heading: hl,
            spacing: { before: 240, after: 120 },
          })
        );
      } else {
        // Build formatted paragraph from items
        const textRuns: TextRun[] = [];
        for (const item of line.items) {
          textRuns.push(
            new TextRun({
              text: item.str + ' ',
              bold: item.isBold,
              italics: item.isItalic,
              size: Math.max(18, Math.round(item.fontSize * 1.8)),
            })
          );
        }

        docChildren.push(
          new Paragraph({
            children: textRuns.length > 0 ? textRuns : [new TextRun(line.text)],
            spacing: { after: 100, line: 260 },
          })
        );
      }

      lineIdx++;
    }

    // Fallback if page had no readable text (e.g. scanned image or diagram)
    if (page.lines.length === 0) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[Page ${page.pageNumber}: Non-textual content or scanned image was detected in original PDF.]`,
              italics: true,
              color: '64748b',
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return {
    buffer,
    filename: outFilename,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pageCount: pages.length,
    stats: {
      pagesProcessed: pages.length,
      paragraphsCreated: docChildren.length,
      hasContent,
    },
    warning: !hasContent ? 'Original PDF contains primarily scanned graphics. Visual layout has been preserved.' : undefined,
  };
}
