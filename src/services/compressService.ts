import { PDFDocument } from 'pdf-lib';
import { CompressionOptions, CompressResultData } from '../types/pdf';

/**
 * Optimizes a PDF by stripping unneeded metadata, dictionaries, and using object streams.
 */
export async function optimizePDFStructure(sourceBytes: ArrayBuffer): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const cleanDoc = await PDFDocument.create();

  // Strip non-essential document info
  cleanDoc.setTitle('');
  cleanDoc.setAuthor('');
  cleanDoc.setSubject('');
  cleanDoc.setKeywords([]);
  cleanDoc.setProducer('DocFusion Optimizer');
  cleanDoc.setCreator('DocFusion');

  const pageIndices = sourceDoc.getPageIndices();
  const copiedPages = await cleanDoc.copyPages(sourceDoc, pageIndices);
  copiedPages.forEach((p) => cleanDoc.addPage(p));

  return await cleanDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });
}

/**
 * Compresses a PDF file using high-performance server-side Ghostscript engine
 * with automatic fallback to client-side structural stream optimization.
 * 
 * GUARANTEE: The output file size will NEVER exceed the original file size.
 */
export async function compressPDF(
  file: File,
  options: CompressionOptions
): Promise<CompressResultData> {
  const originalSize = file.size;
  const originalFilename = file.name;

  // 1. First attempt: High-performance Ghostscript compression via server API
  try {
    options.onProgress?.('Connecting to compression engine...', 15);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('preset', options.preset);
    if (options.dpi) formData.append('dpi', options.dpi.toString());
    if (options.quality) formData.append('quality', options.quality.toString());

    options.onProgress?.('Optimizing fonts, vector paths, and downsampling images...', 45);

    const response = await fetch('/api/pdf/compress', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      options.onProgress?.('Receiving compressed document...', 85);
      const blob = await response.blob();

      const origHeader = response.headers.get('x-original-size');
      const compHeader = response.headers.get('x-compressed-size');
      const savedHeader = response.headers.get('x-saved-bytes');
      const percentHeader = response.headers.get('x-savings-percent');
      const optHeader = response.headers.get('x-already-optimized');
      const pagesHeader = response.headers.get('x-total-pages');

      const compSize = compHeader ? parseInt(compHeader, 10) : blob.size;
      const origSize = origHeader ? parseInt(origHeader, 10) : originalSize;
      const savedBytes = savedHeader ? parseInt(savedHeader, 10) : Math.max(0, origSize - compSize);
      const savingsPercent = percentHeader
        ? parseInt(percentHeader, 10)
        : origSize > 0
        ? Math.round((savedBytes / origSize) * 100)
        : 0;
      const pageCount = pagesHeader ? parseInt(pagesHeader, 10) : 1;
      const alreadyOptimized = optHeader === 'true' || compSize >= origSize;

      // Strict enforcement: Ensure blob size never exceeds original
      const finalBlob = compSize <= origSize ? blob : file;
      const finalSize = compSize <= origSize ? compSize : origSize;

      options.onProgress?.('Compression complete!', 100);

      return {
        originalFilename,
        originalSize: origSize,
        compressedSize: finalSize,
        savedBytes: Math.max(0, origSize - finalSize),
        savingsPercent: origSize > 0 ? Math.round(((origSize - finalSize) / origSize) * 100) : 0,
        pageCount,
        blob: finalBlob,
        downloadUrl: URL.createObjectURL(finalBlob),
        preset: options.preset,
        createdAt: new Date(),
        alreadyOptimized,
      };
    } else {
      console.warn('Server compression API returned status ' + response.status + ', activating client fallback');
    }
  } catch (netErr) {
    console.warn('Server compression request failed, activating client fallback:', netErr);
  }

  // 2. Client-side fallback engine: Structural object stream & metadata purging
  options.onProgress?.('Processing document locally with client engine...', 30);
  const arrayBuffer = await file.arrayBuffer();

  options.onProgress?.('Optimizing object streams and metadata...', 65);
  let finalBlob: Blob = file;
  let finalSize = originalSize;
  let alreadyOptimized = false;

  try {
    const structBytes = await optimizePDFStructure(arrayBuffer);
    if (structBytes.byteLength < originalSize) {
      finalBlob = new Blob([structBytes], { type: 'application/pdf' });
      finalSize = structBytes.byteLength;
    } else {
      finalBlob = file;
      finalSize = originalSize;
      alreadyOptimized = true;
    }
  } catch (err) {
    console.warn('Local structural compression notice:', err);
    finalBlob = file;
    finalSize = originalSize;
    alreadyOptimized = true;
  }

  let totalPages = 1;
  try {
    const doc = await PDFDocument.load(await finalBlob.arrayBuffer(), { ignoreEncryption: true });
    totalPages = doc.getPageCount();
  } catch {
    // fallback 1
  }

  const savedBytes = Math.max(0, originalSize - finalSize);
  const savingsPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

  options.onProgress?.('Compression complete!', 100);

  return {
    originalFilename,
    originalSize,
    compressedSize: finalSize,
    savedBytes,
    savingsPercent,
    pageCount: totalPages,
    blob: finalBlob,
    downloadUrl: URL.createObjectURL(finalBlob),
    preset: options.preset,
    createdAt: new Date(),
    alreadyOptimized,
  };
}
