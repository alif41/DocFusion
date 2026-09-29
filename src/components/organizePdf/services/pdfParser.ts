import * as pdfjsLib from 'pdfjs-dist';
import { ORGANIZE_PDF_CONFIG } from '../config/organizePdfConfig';

// Polyfill Promise.try if not supported
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

// Point to local worker in public folder
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface ClientPdfParseResult {
  pageCount: number;
  pdfDoc: any;
  arrayBuffer: ArrayBuffer;
}

export async function validateAndParseClientPdf(file: File): Promise<ClientPdfParseResult> {
  // Validate extension and MIME
  const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf' || file.type === '';
  if (!isPdfExt && !isPdfMime) {
    throw new Error('Unsupported file format. Please upload a valid .pdf file.');
  }

  // Validate size
  if (file.size > ORGANIZE_PDF_CONFIG.maxFileSize) {
    throw new Error(
      `File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller PDF.`
    );
  }

  if (file.size === 0) {
    throw new Error('Uploaded PDF file is empty (0 bytes).');
  }

  // Read array buffer
  const arrayBuffer = await file.arrayBuffer();

  // Validate magic bytes: %PDF-
  const header = new Uint8Array(arrayBuffer.slice(0, 5));
  const isMagicValid =
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46 &&
    header[4] === 0x2d;

  if (!isMagicValid) {
    throw new Error('Corrupted or invalid PDF file. Missing standard %PDF- signature.');
  }

  // Load document using pdfjs
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://unpkg.com/pdfjs-dist@6.3.289/cmaps/',
      cMapPacked: true,
    });

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    if (pageCount < 1) {
      throw new Error('Document contains no pages.');
    }

    return {
      pageCount,
      pdfDoc,
      arrayBuffer,
    };
  } catch (error: any) {
    const errText = error?.message?.toLowerCase() || '';
    if (
      errText.includes('password') ||
      errText.includes('encrypt') ||
      error?.name === 'PasswordException'
    ) {
      throw new Error(
        'This PDF document is password-protected. Please remove or unlock the password before organizing.'
      );
    }
    throw new Error(`Failed to read PDF document: ${error.message || 'Corrupted file structure'}`);
  }
}
