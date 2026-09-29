import { analyzePdfDocument } from './pdfAnalyzer';
import { extractPageLayout } from './layoutExtractor';
import { detectPageStructure, StructuredBlock } from './structureDetector';
import { renderPageToImageBuffer, performPageOcr } from './ocrEngine';
import { extractPageImages } from './imageExtractor';
import { assembleMarkdownDocument } from './markdownGenerator';
import {
  PdfToMarkdownOptions,
  PdfToMarkdownResult,
  PageAnalysis,
  ExtractedImageItem,
  ConversionStats,
} from './types';

export * from './types';

/**
 * Executes the complete modular PDF-to-Markdown processing pipeline:
 * PDF analysis → text/layout extraction → OCR when needed → structure detection → Markdown generation → validation
 */
export async function convertPdfToMarkdown(
  pdfBuffer: Buffer,
  originalFilename: string,
  options: PdfToMarkdownOptions = {}
): Promise<PdfToMarkdownResult> {
  const ocrStrategy = options.ocrStrategy || 'auto';
  const ocrLanguage = options.ocrLanguage || 'eng';
  const imageMode = options.imageMode || 'extract_folder';

  // 1. PDF Analysis & Metadata
  const {
    pdfDoc,
    metadata,
    selectedPages,
    initialPageAnalysis,
  } = await analyzePdfDocument(pdfBuffer, originalFilename, options.pageRange);

  const pageResults: {
    pageNumber: number;
    blocks: StructuredBlock[];
    ocrMarkdown?: string;
    images: ExtractedImageItem[];
  }[] = [];

  const finalPageAnalysis: PageAnalysis[] = [];
  const allImages: ExtractedImageItem[] = [];

  let totalHeadingCount = 0;
  let totalTableCount = 0;
  let totalListCount = 0;
  let totalCodeCount = 0;
  let scannedPagesCount = 0;
  let ocrAppliedCount = 0;

  // 2. Iterate through each selected page
  for (const pageNum of selectedPages) {
    const page = await pdfDoc.getPage(pageNum);
    const initialMeta = initialPageAnalysis.get(pageNum);
    const isScanned = initialMeta ? initialMeta.isScanned : false;
    if (isScanned) scannedPagesCount++;

    const shouldRunOcr =
      ocrStrategy === 'always' || (ocrStrategy === 'auto' && isScanned);

    let ocrMarkdown: string | undefined = undefined;
    let pageBlocks: StructuredBlock[] = [];
    let pageCharCount = initialMeta?.charCount || 0;
    let pageWordCount = initialMeta?.wordCount || 0;
    let tableCountOnPage = 0;

    // OCR Branch
    if (shouldRunOcr) {
      try {
        const { buffer: imgBuf } = await renderPageToImageBuffer(page, 1.5);
        const ocrResult = await performPageOcr(imgBuf, pageNum, ocrLanguage);
        ocrMarkdown = ocrResult.markdown;
        pageCharCount = ocrResult.charCount;
        pageWordCount = ocrResult.wordCount;
        ocrAppliedCount++;
      } catch (ocrErr) {
        console.warn(`OCR execution failed on page ${pageNum}, falling back to standard text layout:`, ocrErr);
      }
    }

    // Standard Layout & Structure Detection Branch (if OCR was not run or fallback)
    if (!ocrMarkdown) {
      const layout = await extractPageLayout(page, pageNum);
      pageBlocks = detectPageStructure(layout, {
        detectTables: options.detectTables !== false,
        detectCodeBlocks: options.detectCodeBlocks !== false,
        cleanPageArtifacts: options.cleanPageArtifacts !== false,
      });

      for (const block of pageBlocks) {
        if (block.type === 'heading') totalHeadingCount++;
        else if (block.type === 'table') {
          totalTableCount++;
          tableCountOnPage++;
        } else if (block.type === 'list') totalListCount++;
        else if (block.type === 'code') totalCodeCount++;
      }
    }

    // Extract images if enabled
    let pageImages: ExtractedImageItem[] = [];
    if (imageMode !== 'skip') {
      try {
        pageImages = await extractPageImages(page, pageNum, imageMode);
        allImages.push(...pageImages);
      } catch (imgErr) {
        console.warn(`Image extraction failed on page ${pageNum}:`, imgErr);
      }
    }

    pageResults.push({
      pageNumber: pageNum,
      blocks: pageBlocks,
      ocrMarkdown,
      images: pageImages,
    });

    finalPageAnalysis.push({
      pageNumber: pageNum,
      width: initialMeta?.width || 595,
      height: initialMeta?.height || 842,
      charCount: pageCharCount,
      wordCount: pageWordCount,
      isScanned,
      ocrApplied: !!ocrMarkdown,
      imagesFound: pageImages.length,
      tableCount: tableCountOnPage,
    });
  }

  // 3. Assemble Markdown Document
  const { markdown, rawMarkdownWithoutFrontmatter, frontmatter } = assembleMarkdownDocument(
    pageResults,
    metadata,
    options
  );

  // 4. Calculate Final Document Statistics
  const totalWords = markdown.split(/\s+/).filter(Boolean).length;
  const totalChars = markdown.length;

  const stats: ConversionStats = {
    totalPages: metadata.pageCount,
    convertedPages: selectedPages.length,
    scannedPagesCount,
    ocrAppliedCount,
    headingCount: totalHeadingCount,
    tableCount: totalTableCount,
    listCount: totalListCount,
    codeBlockCount: totalCodeCount,
    imageCount: allImages.length,
    wordCount: totalWords,
    charCount: totalChars,
  };

  return {
    success: true,
    markdown,
    rawMarkdownWithoutFrontmatter,
    frontmatter,
    metadata,
    pages: finalPageAnalysis,
    images: allImages,
    stats,
  };
}
