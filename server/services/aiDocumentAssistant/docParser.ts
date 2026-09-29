import mammoth from 'mammoth';
import { DocumentPage } from './types';

// Dynamic import for pdfjs in Node.js
async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjs;
}

/**
 * Extracts structured pages and text from an uploaded file buffer
 */
export async function parseDocumentBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<{
  pages: DocumentPage[];
  fileType: string;
  totalWords: number;
  totalChars: number;
}> {
  const lowerName = filename.toLowerCase();

  // 1. PDF Documents
  if (mimetype === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const pdfjs = await getPdfJs();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      verbosity: 0,
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const pages: DocumentPage[] = [];

    let totalChars = 0;
    let totalWords = 0;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Collect strings with appropriate spacing
      const strings: string[] = [];
      let lastY: number | null = null;

      for (const item of textContent.items as any[]) {
        if (!item.str) continue;
        const currentY = item.transform ? item.transform[5] : null;

        // If vertical position jumped significantly, add a newline
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 8) {
          strings.push('\n');
        } else if (strings.length > 0 && !strings[strings.length - 1].endsWith(' ') && !item.str.startsWith(' ')) {
          strings.push(' ');
        }

        strings.push(item.str);
        lastY = currentY;
      }

      const pageText = strings.join('').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
      const pageChars = pageText.length;
      const pageWords = pageText ? pageText.split(/\s+/).filter(Boolean).length : 0;

      totalChars += pageChars;
      totalWords += pageWords;

      pages.push({
        pageNumber: pageNum,
        text: pageText || `[Page ${pageNum} contains primarily visual or graphical content]`,
        charCount: pageChars,
        wordCount: pageWords,
      });
    }

    return {
      pages,
      fileType: 'pdf',
      totalWords,
      totalChars,
    };
  }

  // 2. Word Documents (.docx)
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const fullText = result.value.trim();
      
      // Split into logical sections or simulated pages (around 450 words per page)
      const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const pages: DocumentPage[] = [];
      
      let currentPageText: string[] = [];
      let currentWordCount = 0;
      let pageNum = 1;

      for (const para of paragraphs) {
        const words = para.split(/\s+/).filter(Boolean).length;
        if (currentWordCount + words > 450 && currentPageText.length > 0) {
          const text = currentPageText.join('\n\n').trim();
          pages.push({
            pageNumber: pageNum++,
            text,
            charCount: text.length,
            wordCount: currentWordCount,
          });
          currentPageText = [para];
          currentWordCount = words;
        } else {
          currentPageText.push(para);
          currentWordCount += words;
        }
      }

      if (currentPageText.length > 0) {
        const text = currentPageText.join('\n\n').trim();
        pages.push({
          pageNumber: pageNum,
          text,
          charCount: text.length,
          wordCount: currentWordCount,
        });
      }

      if (pages.length === 0) {
        pages.push({
          pageNumber: 1,
          text: fullText || '[Document contains no readable text]',
          charCount: fullText.length,
          wordCount: fullText.split(/\s+/).filter(Boolean).length,
        });
      }

      const totalChars = fullText.length;
      const totalWords = fullText.split(/\s+/).filter(Boolean).length;

      return {
        pages,
        fileType: 'docx',
        totalWords,
        totalChars,
      };
    } catch (err: any) {
      throw new Error(`Could not parse Word document: ${err.message}`);
    }
  }

  // 3. Plain Text / Markdown (.txt, .md, .csv)
  const fullText = buffer.toString('utf-8').trim();
  const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const pages: DocumentPage[] = [];

  let currentPageText: string[] = [];
  let currentWordCount = 0;
  let pageNum = 1;

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean).length;
    if (currentWordCount + words > 450 && currentPageText.length > 0) {
      const text = currentPageText.join('\n\n').trim();
      pages.push({
        pageNumber: pageNum++,
        text,
        charCount: text.length,
        wordCount: currentWordCount,
      });
      currentPageText = [para];
      currentWordCount = words;
    } else {
      currentPageText.push(para);
      currentWordCount += words;
    }
  }

  if (currentPageText.length > 0) {
    const text = currentPageText.join('\n\n').trim();
    pages.push({
      pageNumber: pageNum,
      text,
      charCount: text.length,
      wordCount: currentWordCount,
    });
  }

  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      text: fullText || '[Document is empty]',
      charCount: fullText.length,
      wordCount: fullText.split(/\s+/).filter(Boolean).length,
    });
  }

  const totalChars = fullText.length;
  const totalWords = fullText.split(/\s+/).filter(Boolean).length;

  return {
    pages,
    fileType: lowerName.endsWith('.md') ? 'markdown' : 'text',
    totalWords,
    totalChars,
  };
}
