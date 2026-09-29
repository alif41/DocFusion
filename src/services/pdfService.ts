import { PDFFileItem, MergeResultData } from '../types/pdf';
import { PDFDocument } from 'pdf-lib';

export interface MergeOptions {
  filename?: string;
  onProgress?: (stage: string, percent: number) => void;
}

/**
 * Merges ordered PDF files using server-side processing with robust client-side fallback
 */
export async function mergePDFs(
  items: PDFFileItem[],
  options: MergeOptions = {}
): Promise<MergeResultData> {
  if (items.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  const requestedFilename = options.filename?.trim() || 'docfusion-merged.pdf';
  const cleanFilename = requestedFilename.toLowerCase().endsWith('.pdf')
    ? requestedFilename
    : `${requestedFilename}.pdf`;

  options.onProgress?.('Preparing documents for upload...', 15);

  // Attempt server-side merge first
  try {
    const formData = new FormData();
    items.forEach((item) => {
      formData.append('files', item.file, item.file.name);
    });
    formData.append('filename', cleanFilename);

    options.onProgress?.('Sending to DocFusion server engine...', 35);

    const response = await fetch('/api/pdf/merge', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    options.onProgress?.('Receiving merged document...', 85);

    const blob = await response.blob();
    const totalPagesHeader = response.headers.get('X-Total-Pages');
    const totalSizeHeader = response.headers.get('X-Total-Size');

    let totalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : 0;
    if (!totalPages || isNaN(totalPages)) {
      totalPages = items.reduce((acc, curr) => acc + (curr.pageCount || 1), 0);
    }

    const fileSize = totalSizeHeader ? parseInt(totalSizeHeader, 10) : blob.size;
    const downloadUrl = URL.createObjectURL(blob);

    options.onProgress?.('Finalizing...', 100);

    return {
      blob,
      downloadUrl,
      filename: cleanFilename,
      fileSize,
      pageCount: totalPages,
      filesCount: items.length,
      createdAt: new Date(),
    };
  } catch (serverErr: any) {
    console.warn('Server-side merge failed or unavailable, falling back to client-side engine:', serverErr);
    options.onProgress?.('Switching to high-performance local engine...', 50);

    // Client-side fallback via pdf-lib
    const mergedPdf = await PDFDocument.create();
    let totalPages = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      options.onProgress?.(
        `Merging document ${i + 1} of ${items.length}: "${item.name}"...`,
        50 + Math.round(((i + 1) / items.length) * 40)
      );

      const buffer = await item.file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());

      copiedPages.forEach((page) => mergedPdf.addPage(page));
      totalPages += copiedPages.length;
    }

    options.onProgress?.('Generating final document bytes...', 95);
    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);

    options.onProgress?.('Complete!', 100);

    return {
      blob,
      downloadUrl,
      filename: cleanFilename,
      fileSize: blob.size,
      pageCount: totalPages,
      filesCount: items.length,
      createdAt: new Date(),
    };
  }
}
