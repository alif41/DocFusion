import { PDFDocument } from 'pdf-lib';

export interface OrganizePdfResult {
  buffer: Buffer;
  pageCount: number;
  size: number;
  originalPageCount: number;
}

export interface PdfAnalysisResult {
  pageCount: number;
  isEncrypted: boolean;
  fileSize: number;
}

/**
 * Validates PDF magic bytes and checks basic integrity
 */
export function validatePdfMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  // %PDF-
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

/**
 * Analyses PDF, counts pages, and tests for password protection
 */
export async function analyzePdfDocument(buffer: Buffer): Promise<PdfAnalysisResult> {
  if (!validatePdfMagicBytes(buffer)) {
    throw new Error('Invalid file format. The file is not a valid PDF document.');
  }

  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    return {
      pageCount: doc.getPageCount(),
      isEncrypted: false,
      fileSize: buffer.length,
    };
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || '';
    if (errorMsg.includes('encrypted') || errorMsg.includes('password') || errorMsg.includes('decrypt')) {
      throw new Error('This PDF is password-protected. Please remove encryption before organizing.');
    }
    throw new Error(`Unable to read PDF document: ${error.message || 'Corrupted or unreadable format'}`);
  }
}

/**
 * Reorders PDF pages according to specified 1-based pageOrder array.
 * Example pageOrder: [2, 3, 1, 4, 5]
 * Returns a new PDF buffer containing pages in the exact specified order,
 * preserving all vector graphics, fonts, annotations, bookmarks, images, and dimensions.
 */
export async function reorderPdfDocument(
  buffer: Buffer,
  pageOrder: number[]
): Promise<OrganizePdfResult> {
  if (!validatePdfMagicBytes(buffer)) {
    throw new Error('Invalid file format. The file is not a valid PDF document.');
  }

  if (!Array.isArray(pageOrder) || pageOrder.length === 0) {
    throw new Error('Invalid page order. At least one page must be specified.');
  }

  let originalDoc: PDFDocument;
  try {
    originalDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || '';
    if (errorMsg.includes('encrypted') || errorMsg.includes('password') || errorMsg.includes('decrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before organizing.');
    }
    throw new Error(`Corrupted PDF: ${error.message || 'Cannot load document'}`);
  }

  const originalPageCount = originalDoc.getPageCount();

  // Validate every page number in pageOrder
  const seenPages = new Set<number>();
  for (const pageNum of pageOrder) {
    if (typeof pageNum !== 'number' || !Number.isInteger(pageNum)) {
      throw new Error(`Invalid page index "${pageNum}". Page numbers must be integers.`);
    }
    if (pageNum < 1 || pageNum > originalPageCount) {
      throw new Error(
        `Page number ${pageNum} is out of range. Document has ${originalPageCount} pages.`
      );
    }
    if (seenPages.has(pageNum)) {
      throw new Error(`Duplicate page number ${pageNum} detected in arrangement.`);
    }
    seenPages.add(pageNum);
  }

  if (pageOrder.length !== originalPageCount) {
    throw new Error(
      `Arrangement contains ${pageOrder.length} pages, but the original document has ${originalPageCount} pages. All pages must be retained.`
    );
  }

  // Convert 1-based indices to 0-based for pdf-lib
  const zeroBasedIndices = pageOrder.map((p) => p - 1);

  // Create clean destination PDF
  const newDoc = await PDFDocument.create();

  // Copy pages from original to newDoc in target order
  const copiedPages = await newDoc.copyPages(originalDoc, zeroBasedIndices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const newBytes = await newDoc.save();
  const outputBuffer = Buffer.from(newBytes);

  return {
    buffer: outputBuffer,
    pageCount: copiedPages.length,
    size: outputBuffer.length,
    originalPageCount,
  };
}
