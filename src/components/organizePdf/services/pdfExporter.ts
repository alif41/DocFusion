import { PDFDocument } from 'pdf-lib';
import { OrganizeResultData } from '../types';

export interface ExportOrganizePdfOptions {
  file: File;
  pageOrder: number[];
  filename?: string;
  onProgress?: (step: string, percent: number) => void;
}

export async function exportOrganizedPdf({
  file,
  pageOrder,
  filename,
  onProgress,
}: ExportOrganizePdfOptions): Promise<OrganizeResultData> {
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalFilename = (filename || `${baseName}-organized.pdf`).trim();
  const safeFilename = finalFilename.toLowerCase().endsWith('.pdf')
    ? finalFilename
    : `${finalFilename}.pdf`;

  onProgress?.('Preparing PDF', 15);

  try {
    // Attempt backend processing first
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pageOrder', JSON.stringify(pageOrder));
    formData.append('filename', safeFilename);

    onProgress?.('Applying New Page Order', 45);

    const response = await fetch('/api/organize-pdf/reorder?binary=true', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      onProgress?.('Rebuilding PDF', 80);
      const blob = await response.blob();
      onProgress?.('Finalizing Document', 95);

      const downloadUrl = URL.createObjectURL(blob);

      return {
        blob,
        downloadUrl,
        filename: safeFilename,
        fileSize: blob.size,
        originalPageCount: pageOrder.length,
        newPageCount: pageOrder.length,
        pageOrder,
        createdAt: new Date(),
        isCustomOrder: true,
      };
    }

    // If backend returned error, read message or fallback
    const errorJson = await response.json().catch(() => null);
    if (errorJson?.error) {
      console.warn('Backend reorder failed, trying client-side engine:', errorJson.error);
    }
  } catch (err) {
    console.warn('Backend request failed, falling back to client-side pdf-lib:', err);
  }

  // Client-side fallback using pdf-lib
  onProgress?.('Applying New Page Order (Client Engine)', 50);
  const fileArrayBuffer = await file.arrayBuffer();
  const originalDoc = await PDFDocument.load(fileArrayBuffer, { ignoreEncryption: false });

  onProgress?.('Rebuilding PDF', 75);
  const newDoc = await PDFDocument.create();
  const zeroBasedIndices = pageOrder.map((p) => p - 1);

  const copiedPages = await newDoc.copyPages(originalDoc, zeroBasedIndices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  onProgress?.('Finalizing Document', 90);
  const newPdfBytes = await newDoc.save();
  const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    blob,
    downloadUrl,
    filename: safeFilename,
    fileSize: blob.size,
    originalPageCount: pageOrder.length,
    newPageCount: copiedPages.length,
    pageOrder,
    createdAt: new Date(),
    isCustomOrder: true,
  };
}
