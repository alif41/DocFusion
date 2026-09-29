import { PDFDocument } from 'pdf-lib';
import { PdfDocumentMetadata, PageAnalysis } from './types';

// Dynamic import for pdfjs in Node.js
async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjs;
}

/**
 * Parses user page range string into a sorted array of 1-based page numbers
 */
export function parsePageRange(rangeStr: string | undefined, totalPages: number): number[] {
  if (!rangeStr || rangeStr.trim() === '' || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const selected = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          selected.add(i);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        selected.add(pageNum);
      }
    }
  }

  const result = Array.from(selected).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
}

/**
 * Analyzes PDF buffer and extracts metadata and structural metrics
 */
export async function analyzePdfDocument(
  pdfBuffer: Buffer,
  originalFilename: string,
  pageRangeStr?: string
): Promise<{
  pdfDoc: any; // pdfjs doc proxy
  pdfLibDoc: PDFDocument;
  metadata: PdfDocumentMetadata;
  selectedPages: number[];
  initialPageAnalysis: Map<number, PageAnalysis>;
}> {
  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  let pdfLibDoc: PDFDocument;
  try {
    pdfLibDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  } catch {
    pdfLibDoc = await PDFDocument.create();
  }

  const title = pdfLibDoc.getTitle() || originalFilename.replace(/\.pdf$/i, '');
  const author = pdfLibDoc.getAuthor() || undefined;
  const subject = pdfLibDoc.getSubject() || undefined;
  const creator = pdfLibDoc.getCreator() || undefined;
  const creationDate = pdfLibDoc.getCreationDate() ? pdfLibDoc.getCreationDate()?.toISOString() : undefined;
  const modificationDate = pdfLibDoc.getModificationDate() ? pdfLibDoc.getModificationDate()?.toISOString() : undefined;

  const selectedPages = parsePageRange(pageRangeStr, totalPages);

  const metadata: PdfDocumentMetadata = {
    title,
    author,
    subject,
    creator,
    creationDate,
    modificationDate,
    pageCount: totalPages,
    selectedPages,
    fileSize: pdfBuffer.length,
    originalFilename,
  };

  const initialPageAnalysis = new Map<number, PageAnalysis>();

  for (const pageNum of selectedPages) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    let totalChars = 0;
    for (const item of textContent.items as any[]) {
      if (item.str) totalChars += item.str.trim().length;
    }

    const isScanned = totalChars < 30; // Scanned if almost zero text extracted

    initialPageAnalysis.set(pageNum, {
      pageNumber: pageNum,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      charCount: totalChars,
      wordCount: Math.round(totalChars / 5),
      isScanned,
      ocrApplied: false,
      imagesFound: 0,
      tableCount: 0,
    });
  }

  return {
    pdfDoc,
    pdfLibDoc,
    metadata,
    selectedPages,
    initialPageAnalysis,
  };
}
