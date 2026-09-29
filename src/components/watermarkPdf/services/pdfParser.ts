import * as pdfjsLib from 'pdfjs-dist';
import { WATERMARK_PDF_CONFIG } from '../config/watermarkPdfConfig';
import { PdfPageMeta } from '../types';

if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface ClientPdfWatermarkParseResult {
  pageCount: number;
  pdfDoc: any;
  pagesMeta: PdfPageMeta[];
  arrayBuffer: ArrayBuffer;
}

export async function parsePdfForWatermark(file: File): Promise<ClientPdfWatermarkParseResult> {
  const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf' || file.type === '';
  if (!isPdfExt && !isPdfMime) {
    throw new Error('Unsupported format. Please upload a valid PDF (.pdf) file.');
  }

  if (file.size > WATERMARK_PDF_CONFIG.maxFileSize) {
    throw new Error(
      `File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller PDF.`
    );
  }

  if (file.size === 0) {
    throw new Error('The uploaded PDF file is empty (0 bytes).');
  }

  const arrayBuffer = await file.arrayBuffer();

  // Validate magic bytes
  const header = new Uint8Array(arrayBuffer.slice(0, 5));
  const isMagicValid =
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46 &&
    header[4] === 0x2d;

  if (!isMagicValid) {
    throw new Error('Invalid or corrupted PDF file. Standard %PDF- header not found.');
  }

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      cMapUrl: 'https://unpkg.com/pdfjs-dist@6.3.289/cmaps/',
      cMapPacked: true,
    });

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    if (pageCount < 1) {
      throw new Error('PDF document contains no pages.');
    }

    const pagesMeta: PdfPageMeta[] = [];
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      pagesMeta.push({
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
        aspectRatio: viewport.width / viewport.height,
        thumbnailUrl: null,
      });
    }

    return {
      pageCount,
      pdfDoc,
      pagesMeta,
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
        'This PDF document is password-protected. Please remove or unlock the password before applying watermarks.'
      );
    }
    throw new Error(`Failed to read PDF document: ${error.message || 'Corrupted file structure'}`);
  }
}
