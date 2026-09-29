import * as pdfjsLib from 'pdfjs-dist';
import { EditablePage, DocumentElement, TextElement, TableElement, FontName } from './types';
import { performPageOCR } from './OCRProcessor';

// Configure pdfjs worker if not already set
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface ParseResult {
  pages: EditablePage[];
  pageCount: number;
  isOCRUsed: boolean;
  ocrStats?: {
    pagesScanned: number;
    wordsRecognized: number;
    avgConfidence: number;
  };
  detectedHeadings: number;
  detectedParagraphs: number;
  detectedImages: number;
  detectedTables: number;
}

export async function parsePDFDocument(
  fileOrBuffer: File | ArrayBuffer,
  onProgress?: (stage: 'uploading' | 'scanning' | 'ocr' | 'reconstructing' | 'ready', percent: number, message: string) => void
): Promise<ParseResult> {
  let arrayBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    onProgress?.('uploading', 15, 'Reading PDF file data...');
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  onProgress?.('scanning', 30, 'Loading PDF document structure...');

  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/cmaps/',
      cMapPacked: true,
    });
    pdfDoc = await loadingTask.promise;
  } catch (err: any) {
    if (err?.name === 'PasswordException' || err?.message?.toLowerCase().includes('password')) {
      throw new Error('This PDF is password-protected or encrypted. Please remove the password before editing.');
    }
    throw new Error(`Failed to parse PDF document: ${err?.message || 'Invalid or corrupted PDF file'}`);
  }

  const numPages = pdfDoc.numPages;
  const pages: EditablePage[] = [];
  let isAnyOCRUsed = false;
  let ocrPagesCount = 0;
  let totalOCRWords = 0;
  let ocrConfidenceSum = 0;
  let totalHeadings = 0;
  let totalParagraphs = 0;
  let totalImages = 0;
  let totalTables = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const progressBase = 30 + Math.round(((pageNum - 1) / numPages) * 50);
    onProgress?.('scanning', progressBase, `Scanning page ${pageNum} of ${numPages}...`);

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    // Render offscreen canvas for background fidelity & thumbnail
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const renderScale = 1.5; // crisp visual background
    const scaledViewport = page.getViewport({ scale: renderScale });
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    let backgroundUrl = '';
    let thumbnailUrl = '';

    if (ctx) {
      await (page.render as any)({
        canvasContext: ctx,
        viewport: scaledViewport,
        canvas: canvas,
      }).promise;
      backgroundUrl = canvas.toDataURL('image/webp', 0.85);

      // Thumbnail (smaller)
      const thumbCanvas = document.createElement('canvas');
      const thumbScale = 180 / pageWidth;
      const thumbViewport = page.getViewport({ scale: thumbScale });
      thumbCanvas.width = thumbViewport.width;
      thumbCanvas.height = thumbViewport.height;
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);
      }
    }

    // Extract text content
    const textContent = await page.getTextContent();
    const textItems = textContent.items.filter((item: any) => 'str' in item && item.str.trim().length > 0) as any[];

    // Extract links
    const annotations = await page.getAnnotations();
    const linkMap = new Map<string, string>();
    for (const annot of annotations) {
      if (annot.subtype === 'Link' && (annot.url || annot.unsafeUrl)) {
        const linkUrl = annot.url || annot.unsafeUrl;
        if (annot.rect && annot.rect.length === 4) {
          const key = `${Math.round(annot.rect[0])}_${Math.round(annot.rect[1])}`;
          linkMap.set(key, linkUrl);
        }
      }
    }

    let elements: DocumentElement[] = [];
    let isScannedPage = false;
    let pageOCRConfidence = 0;

    // Check if page is scanned (sparse or no selectable text items)
    const totalChars = textItems.reduce((acc, item) => acc + item.str.length, 0);

    if (totalChars < 12) {
      // Automatic OCR trigger
      isScannedPage = true;
      isAnyOCRUsed = true;
      ocrPagesCount++;
      onProgress?.('ocr', progressBase + 5, `Running OCR on scanned page ${pageNum}...`);

      const ocrResult = await performPageOCR(canvas, pageWidth, pageHeight, (pct, status) => {
        onProgress?.('ocr', progressBase + Math.round((pct / 100) * 8), `Page ${pageNum}: ${status}`);
      });

      elements = ocrResult.textElements;
      pageOCRConfidence = ocrResult.confidence;
      totalOCRWords += ocrResult.wordCount;
      ocrConfidenceSum += ocrResult.confidence;
    } else {
      // Reconstruct structured editable text from native PDF items
      elements = reconstructStructuredElements(textItems, pageWidth, pageHeight, linkMap);
    }

    // Classify counts
    elements.forEach((el) => {
      if (el.type === 'heading') totalHeadings++;
      else if (el.type === 'paragraph' || el.type === 'text') totalParagraphs++;
      else if (el.type === 'table') totalTables++;
      else if (el.type === 'image') totalImages++;
    });

    pages.push({
      id: `page_${pageNum}_${Date.now()}`,
      pageNumber: pageNum,
      width: Math.round(pageWidth),
      height: Math.round(pageHeight),
      rotation: 0,
      elements,
      backgroundUrl,
      thumbnailUrl,
      isScanned: isScannedPage,
      ocrApplied: isScannedPage,
      ocrConfidence: pageOCRConfidence,
    });
  }

  onProgress?.('reconstructing', 92, 'Building editable document representation...');

  return {
    pages,
    pageCount: numPages,
    isOCRUsed: isAnyOCRUsed,
    ocrStats: isAnyOCRUsed
      ? {
          pagesScanned: ocrPagesCount,
          wordsRecognized: totalOCRWords,
          avgConfidence: ocrPagesCount > 0 ? Math.round(ocrConfidenceSum / ocrPagesCount) : 85,
        }
      : undefined,
    detectedHeadings: totalHeadings,
    detectedParagraphs: totalParagraphs,
    detectedImages: totalImages,
    detectedTables: totalTables,
  };
}

/**
 * Groups raw pdf.js text items into clean, coherent paragraphs, headings, and lines
 * preserving exact font styling, bold/italic detection, colors, and spatial positioning.
 */
/**
 * Reconstructs raw pdf.js text items into precise line-level editable elements,
 * preserving exact original positions (x, y, width, height), font styles, and page structure
 * without merging across columns, tables, or different lines.
 */
function reconstructStructuredElements(
  items: any[],
  pageWidth: number,
  pageHeight: number,
  linkMap: Map<string, string>
): DocumentElement[] {
  if (items.length === 0) return [];

  interface RawBox {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: FontName;
    isBold: boolean;
    isItalic: boolean;
    color: string;
  }

  // 1. Convert raw pdf.js items to point coordinates
  const rawBoxes: RawBox[] = items
    .map((item) => {
      const tx = item.transform[4];
      const ty = item.transform[5];
      const fontHeight = Math.hypot(item.transform[2], item.transform[3]) || item.height || 12;
      const fontSize = Math.max(7, Math.round(fontHeight));
      const width = Math.max(item.width || 8, fontSize * 0.45 * item.str.length);
      // In PDF: ty is baseline measured from bottom
      const yFromTop = Math.max(0, pageHeight - ty - fontSize * 0.88);

      const fontName = (item.fontName || '').toLowerCase();
      const isBold =
        fontName.includes('bold') ||
        fontName.includes('black') ||
        fontName.includes('heavy') ||
        fontName.includes('b0') ||
        fontName.includes('700') ||
        fontName.includes('800') ||
        fontName.includes('900');
      const isItalic = fontName.includes('italic') || fontName.includes('oblique') || fontName.includes('it');

      let normalizedFamily: FontName = 'Inter';
      if (fontName.includes('times') || fontName.includes('roman') || fontName.includes('serif')) {
        normalizedFamily = 'Times New Roman';
      } else if (fontName.includes('courier') || fontName.includes('mono') || fontName.includes('consolas')) {
        normalizedFamily = 'Courier New';
      } else if (fontName.includes('arial') || fontName.includes('helvetica') || fontName.includes('sans')) {
        normalizedFamily = 'Helvetica';
      } else if (fontName.includes('georgia')) {
        normalizedFamily = 'Georgia';
      }

      return {
        text: item.str,
        x: Math.round(tx),
        y: Math.round(yFromTop),
        width: Math.round(width),
        height: Math.round(fontSize * 1.25),
        fontSize,
        fontFamily: normalizedFamily,
        isBold,
        isItalic,
        color: '#111827',
      };
    })
    .filter((b) => b.text && b.text.trim().length > 0);

  // 2. Sort by vertical coordinate (y), then by horizontal coordinate (x)
  rawBoxes.sort((a, b) => {
    if (Math.abs(a.y - b.y) <= 2.5) return a.x - b.x;
    return a.y - b.y;
  });

  // 3. Group fragments strictly on the SAME line that are adjacent words/characters.
  // NEVER merge across different lines or across wide column gaps!
  const lineClusters: RawBox[][] = [];
  let currentLine: RawBox[] = [];

  for (let i = 0; i < rawBoxes.length; i++) {
    const box = rawBoxes[i];
    if (currentLine.length === 0) {
      currentLine.push(box);
      continue;
    }

    const prevBox = currentLine[currentLine.length - 1];
    const isSameHorizontalLine = Math.abs(box.y - prevBox.y) <= Math.max(2.5, prevBox.fontSize * 0.25);
    const horizontalGap = box.x - (prevBox.x + prevBox.width);

    // Only merge if on the exact same line and gap is within normal inter-word distance
    // If gap > fontSize * 0.6, it's a separate column, tab, or metadata field!
    const isDirectWordNeighbor =
      isSameHorizontalLine &&
      horizontalGap >= -4 &&
      horizontalGap <= Math.max(10, prevBox.fontSize * 0.55);

    if (isDirectWordNeighbor) {
      currentLine.push(box);
    } else {
      lineClusters.push(currentLine);
      currentLine = [box];
    }
  }
  if (currentLine.length > 0) {
    lineClusters.push(currentLine);
  }

  // 4. Convert line clusters into precise DocumentElements
  const elements: DocumentElement[] = [];

  lineClusters.forEach((cluster, idx) => {
    if (cluster.length === 0) return;

    let lineText = '';
    let minX = cluster[0].x;
    let minY = cluster[0].y;
    let maxX = cluster[0].x + cluster[0].width;
    let maxY = cluster[0].y + cluster[0].height;

    for (let i = 0; i < cluster.length; i++) {
      const b = cluster[i];
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);

      if (i > 0) {
        if (!lineText.endsWith(' ') && !b.text.startsWith(' ')) {
          lineText += ' ';
        }
      }
      lineText += b.text;
    }

    const cleanText = lineText.trim();
    if (!cleanText) return;

    const baseBox = cluster[0];
    const isBullet = cleanText.startsWith('•') || cleanText.startsWith('-') || cleanText.startsWith('–');
    const isNumbered = /^\d+[\.\)]\s/.test(cleanText);
    const isHeading = baseBox.fontSize >= 17 || (baseBox.fontSize >= 13 && baseBox.isBold && cleanText.length < 80);

    let type: 'text' | 'heading' | 'paragraph' | 'list_item' = 'paragraph';
    if (isHeading) type = 'heading';
    else if (isBullet || isNumbered) type = 'list_item';

    const textEl: TextElement = {
      id: `el_line_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      x: minX,
      y: minY,
      width: Math.max(maxX - minX + 4, 25),
      height: Math.max(maxY - minY + 2, baseBox.height),
      text: cleanText,
      fontFamily: baseBox.fontFamily,
      fontSize: baseBox.fontSize,
      fontWeight: baseBox.isBold ? 'bold' : 'normal',
      fontStyle: baseBox.isItalic ? 'italic' : 'normal',
      underline: false,
      strikethrough: false,
      color: baseBox.color,
      backgroundColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.25,
      listType: isBullet ? 'bullet' : isNumbered ? 'number' : 'none',
      indent: 0,
    };

    elements.push(textEl);
  });

  return elements;
}
