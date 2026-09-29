import { ExtractedPage, ExtractedLine, ExtractedTextItem, ExtractedTable } from './types';

// Dynamic import for pdfjs in Node.js
async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjs;
}

export async function extractPdfPages(pdfBuffer: Buffer): Promise<ExtractedPage[]> {
  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const extractedPages: ExtractedPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const items: ExtractedTextItem[] = [];

    for (const item of textContent.items as any[]) {
      if (!item.str || item.str.trim() === '') continue;

      const transform = item.transform;
      // In PDF coordinate system, Y is 0 at the bottom. Flip Y to top-down.
      const rawX = transform[4];
      const rawY = transform[5];
      const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]) || 12;
      const x = Math.round(rawX * 10) / 10;
      const y = Math.round((viewport.height - rawY) * 10) / 10;

      const fontName = (item.fontName || '').toLowerCase();
      const isBold = fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy') || fontName.includes('700');
      const isItalic = fontName.includes('italic') || fontName.includes('oblique');

      items.push({
        str: item.str,
        x,
        y,
        width: item.width || (item.str.length * fontSize * 0.5),
        height: item.height || fontSize,
        fontSize: Math.round(fontSize * 10) / 10,
        fontName: item.fontName || 'Helvetica',
        isBold,
        isItalic,
      });
    }

    // Sort items by Y (top to bottom), then by X (left to right)
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) <= 3) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    // Group items into lines
    const lineBuckets: ExtractedTextItem[][] = [];
    for (const item of items) {
      let placed = false;
      for (const bucket of lineBuckets) {
        const avgY = bucket.reduce((sum, it) => sum + it.y, 0) / bucket.length;
        if (Math.abs(item.y - avgY) <= Math.max(3.5, item.fontSize * 0.35)) {
          bucket.push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lineBuckets.push([item]);
      }
    }

    // Sort buckets top to bottom
    lineBuckets.sort((a, b) => {
      const aY = a.reduce((sum, it) => sum + it.y, 0) / a.length;
      const bY = b.reduce((sum, it) => sum + it.y, 0) / b.length;
      return aY - bY;
    });

    // Compute average font size of the page
    let totalFontSize = 0;
    let charCount = 0;
    for (const it of items) {
      totalFontSize += it.fontSize * it.str.length;
      charCount += it.str.length;
    }
    const avgFontSize = charCount > 0 ? totalFontSize / charCount : 12;

    const lines: ExtractedLine[] = [];
    const fullTextLines: string[] = [];

    for (const bucket of lineBuckets) {
      bucket.sort((a, b) => a.x - b.x);

      let lineText = '';
      let maxFontSize = 0;
      let hasBold = false;
      const columns: string[] = [];
      let currentCol = '';
      let lastXEnd = -1;

      for (const item of bucket) {
        if (item.fontSize > maxFontSize) maxFontSize = item.fontSize;
        if (item.isBold) hasBold = true;

        const gap = lastXEnd >= 0 ? item.x - lastXEnd : 0;
        if (gap > 22 && currentCol.trim()) {
          // Large column gap detected -> table column candidate
          columns.push(currentCol.trim());
          currentCol = '';
        }

        if (gap > 3 && lineText.length > 0 && !lineText.endsWith(' ')) {
          lineText += ' ';
          currentCol += ' ';
        }

        lineText += item.str;
        currentCol += item.str;
        lastXEnd = item.x + item.width;
      }

      if (currentCol.trim()) {
        columns.push(currentCol.trim());
      }

      const trimmedText = lineText.trim();
      if (!trimmedText) continue;

      const isHeading = maxFontSize >= avgFontSize * 1.25 || (hasBold && maxFontSize >= avgFontSize * 1.1 && trimmedText.length < 80);
      let headingLevel: 1 | 2 | 3 = 3;
      if (maxFontSize >= avgFontSize * 1.6) headingLevel = 1;
      else if (maxFontSize >= avgFontSize * 1.3) headingLevel = 2;

      const isTableCandidate = columns.length >= 2;

      const avgY = bucket.reduce((sum, it) => sum + it.y, 0) / bucket.length;
      lines.push({
        y: Math.round(avgY * 10) / 10,
        text: trimmedText,
        fontSize: maxFontSize || 12,
        isHeading,
        headingLevel,
        isBold: hasBold,
        items: bucket,
        isTableCandidate,
        columns: isTableCandidate ? columns : undefined,
      });

      fullTextLines.push(trimmedText);
    }

    // Paragraph grouping: merge adjacent non-heading lines
    const paragraphs: string[] = [];
    const headings: string[] = [];
    let currentParagraph = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.isHeading) {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
        headings.push(line.text);
        paragraphs.push(line.text);
      } else {
        if (!currentParagraph) {
          currentParagraph = line.text;
        } else {
          // Check if distance between lines is reasonable
          const prevLine = lines[i - 1];
          const lineGap = line.y - prevLine.y;
          if (lineGap > (line.fontSize * 2.2)) {
            // New paragraph
            paragraphs.push(currentParagraph.trim());
            currentParagraph = line.text;
          } else {
            currentParagraph += ' ' + line.text;
          }
        }
      }
    }
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }

    // Extract table candidate sequences
    const tables: ExtractedTable[] = [];
    let currentTableRows: string[][] = [];

    for (const line of lines) {
      if (line.isTableCandidate && line.columns && line.columns.length >= 2) {
        currentTableRows.push(line.columns);
      } else {
        if (currentTableRows.length >= 2) {
          tables.push({
            headers: currentTableRows[0],
            rows: currentTableRows.slice(1),
          });
        }
        currentTableRows = [];
      }
    }
    if (currentTableRows.length >= 2) {
      tables.push({
        headers: currentTableRows[0],
        rows: currentTableRows.slice(1),
      });
    }

    extractedPages.push({
      pageNumber: pageNum,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      lines,
      paragraphs,
      tables,
      headings,
      fullText: fullTextLines.join('\n'),
    });
  }

  return extractedPages;
}
