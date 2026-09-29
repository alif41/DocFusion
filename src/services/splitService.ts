import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { SplitMode, SplitResultData, SplitResultFile } from '../types/pdf';

export interface SplitOptions {
  mode: SplitMode;
  selectedPages?: number[]; // 1-indexed page numbers for extract mode
  mergeExtracted?: boolean;  // if true in extract mode, combine selected pages into one PDF
  rangeChunks?: number[][];  // arrays of 1-indexed page numbers for range mode
  customFilename?: string;
  onProgress?: (stage: string, percent: number) => void;
}

/**
 * Parses user range strings such as "1-3, 5, 8-10" into a deduplicated, sorted array of 1-indexed page numbers.
 */
export function parsePageRangeString(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr.trim()) return [];

  const pagesSet = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pagesSet.add(page);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

/**
 * Converts an array of sorted page numbers into a compact human-readable range string (e.g. "1-3, 5, 7-9").
 */
export function formatPagesToRangeString(pages: number[]): string {
  if (!pages.length) return '';
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  const ranges: string[] = [];

  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = current;
      prev = current;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);

  return ranges.join(', ');
}

/**
 * Splits a PDF document based on selected mode and page configuration.
 */
export async function splitPDF(
  file: File,
  options: SplitOptions
): Promise<SplitResultData> {
  options.onProgress?.('Loading source PDF document...', 10);

  const arrayBuffer = await file.arrayBuffer();
  const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalOriginalPages = sourceDoc.getPageCount();

  if (totalOriginalPages === 0) {
    throw new Error('The selected PDF contains no readable pages.');
  }

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const resultFiles: SplitResultFile[] = [];

  if (options.mode === 'burst') {
    // Burst mode: Every single page is split into an individual PDF
    for (let pageNum = 1; pageNum <= totalOriginalPages; pageNum++) {
      const percent = Math.round(15 + (pageNum / totalOriginalPages) * 65);
      options.onProgress?.(`Extracting page ${pageNum} of ${totalOriginalPages}...`, percent);

      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(sourceDoc, [pageNum - 1]);
      newDoc.addPage(copiedPage);

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const filename = `${baseName}_page_${pageNum}.pdf`;

      resultFiles.push({
        filename,
        blob,
        downloadUrl: URL.createObjectURL(blob),
        fileSize: blob.size,
        pageCount: 1,
        pagesIncluded: [pageNum],
      });
    }
  } else if (options.mode === 'extract') {
    const selected = (options.selectedPages || [])
      .filter((p) => p >= 1 && p <= totalOriginalPages)
      .sort((a, b) => a - b);

    if (selected.length === 0) {
      throw new Error('Please select at least 1 page to extract.');
    }

    if (options.mergeExtracted) {
      // Merge all extracted pages into a single output PDF
      options.onProgress?.(`Compiling ${selected.length} extracted pages into master file...`, 40);

      const newDoc = await PDFDocument.create();
      const pageIndicesToCopy = selected.map((p) => p - 1);
      const copiedPages = await newDoc.copyPages(sourceDoc, pageIndicesToCopy);

      copiedPages.forEach((page) => newDoc.addPage(page));

      options.onProgress?.('Generating PDF bytes...', 75);
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const rangeLabel = formatPagesToRangeString(selected).replace(/[, ]+/g, '_');
      const filename = options.customFilename?.trim()
        ? (options.customFilename.endsWith('.pdf') ? options.customFilename : `${options.customFilename}.pdf`)
        : `${baseName}_extracted_${rangeLabel}.pdf`;

      resultFiles.push({
        filename,
        blob,
        downloadUrl: URL.createObjectURL(blob),
        fileSize: blob.size,
        pageCount: selected.length,
        pagesIncluded: selected,
      });
    } else {
      // Separate files for each extracted page
      for (let i = 0; i < selected.length; i++) {
        const pageNum = selected[i];
        const percent = Math.round(20 + ((i + 1) / selected.length) * 60);
        options.onProgress?.(`Extracting page ${pageNum} (${i + 1}/${selected.length})...`, percent);

        const newDoc = await PDFDocument.create();
        const [copiedPage] = await newDoc.copyPages(sourceDoc, [pageNum - 1]);
        newDoc.addPage(copiedPage);

        const pdfBytes = await newDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const filename = `${baseName}_page_${pageNum}.pdf`;

        resultFiles.push({
          filename,
          blob,
          downloadUrl: URL.createObjectURL(blob),
          fileSize: blob.size,
          pageCount: 1,
          pagesIncluded: [pageNum],
        });
      }
    }
  } else if (options.mode === 'range') {
    // Range chunks mode (e.g. [[1,2,3], [4,5], ...])
    const chunks = (options.rangeChunks || []).filter((chunk) => chunk.length > 0);

    if (chunks.length === 0) {
      throw new Error('Please configure at least one valid page range.');
    }

    for (let c = 0; c < chunks.length; c++) {
      const chunk = chunks[c];
      const validPages = chunk
        .filter((p) => p >= 1 && p <= totalOriginalPages)
        .sort((a, b) => a - b);

      if (validPages.length === 0) continue;

      const percent = Math.round(20 + ((c + 1) / chunks.length) * 60);
      options.onProgress?.(`Extracting range chunk ${c + 1} of ${chunks.length}...`, percent);

      const newDoc = await PDFDocument.create();
      const pageIndices = validPages.map((p) => p - 1);
      const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const rangeTag = validPages[0] === validPages[validPages.length - 1]
        ? `page_${validPages[0]}`
        : `pages_${validPages[0]}_to_${validPages[validPages.length - 1]}`;
      const filename = `${baseName}_part_${c + 1}_${rangeTag}.pdf`;

      resultFiles.push({
        filename,
        blob,
        downloadUrl: URL.createObjectURL(blob),
        fileSize: blob.size,
        pageCount: validPages.length,
        pagesIncluded: validPages,
      });
    }
  }

  if (resultFiles.length === 0) {
    throw new Error('No files were generated from the split parameters.');
  }

  // If more than 1 file is produced, package them into a convenient ZIP archive
  let zipBlob: Blob | undefined;
  let zipDownloadUrl: string | undefined;
  let zipFilename: string | undefined;
  let zipSize: number | undefined;

  if (resultFiles.length > 1) {
    options.onProgress?.('Bundling files into ZIP archive...', 88);
    const zip = new JSZip();

    for (const fileItem of resultFiles) {
      const fileBuffer = await fileItem.blob.arrayBuffer();
      zip.file(fileItem.filename, fileBuffer);
    }

    const zipContent = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    zipBlob = zipContent;
    zipDownloadUrl = URL.createObjectURL(zipContent);
    zipFilename = `${baseName}_split_collection.zip`;
    zipSize = zipContent.size;
  }

  options.onProgress?.('Splitting complete!', 100);

  return {
    originalFilename: file.name,
    totalOriginalPages,
    splitMode: options.mode,
    files: resultFiles,
    zipBlob,
    zipDownloadUrl,
    zipFilename,
    zipSize,
    createdAt: new Date(),
  };
}
