import { createCanvas } from '@napi-rs/canvas';
import { GoogleGenAI } from '@google/genai';
import { createWorker } from 'tesseract.js';

/**
 * Renders a PDF page to a PNG image buffer using @napi-rs/canvas
 */
export async function renderPageToImageBuffer(
  pdfPage: any,
  scale: number = 1.5
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const viewport = pdfPage.getViewport({ scale });
  const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
  const ctx = canvas.getContext('2d');

  await pdfPage.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  const buffer = canvas.toBuffer('image/png');
  return {
    buffer,
    width: Math.floor(viewport.width),
    height: Math.floor(viewport.height),
  };
}

/**
 * Runs OCR on a page image buffer using Gemini API (if available) or Tesseract.js fallback
 */
export async function performPageOcr(
  imageBuffer: Buffer,
  pageNumber: number,
  language: string = 'eng'
): Promise<{
  markdown: string;
  charCount: number;
  wordCount: number;
  engineUsed: 'gemini' | 'tesseract';
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Try Gemini Vision OCR if API key is present
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a high-accuracy document OCR and layout preservation engine. 
Transcribe this scanned document page (Page ${pageNumber}) into clean, readable GitHub-Flavored Markdown (GFM).
Rules:
- Preserve headings with proper Markdown level (#, ##, ###).
- Preserve tables as clean Markdown tables with header separators (| --- |).
- Preserve bulleted lists (-) and numbered lists (1.).
- Preserve paragraphs, blockquotes (>), and code blocks (\`\`\`).
- Fix OCR typos and restore reading order (multi-column or single-column).
- Output ONLY the Markdown text for this page. Do not include introductory notes, explanations, or enclosing code fence blocks unless the document content itself contains code.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBuffer.toString('base64'),
            },
          },
          prompt,
        ],
      });

      const rawText = (response.text || '').trim();
      if (rawText) {
        // Strip unnecessary top-level markdown code fence if wrapped
        let cleaned = rawText;
        if (cleaned.startsWith('```markdown') && cleaned.endsWith('```')) {
          cleaned = cleaned.slice(11, -3).trim();
        } else if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
          cleaned = cleaned.slice(3, -3).trim();
        }

        const words = cleaned.split(/\s+/).filter(Boolean).length;
        return {
          markdown: cleaned,
          charCount: cleaned.length,
          wordCount: words,
          engineUsed: 'gemini',
        };
      }
    } catch (geminiError: any) {
      console.warn(`Gemini OCR for page ${pageNumber} failed or timed out. Falling back to Tesseract:`, geminiError?.message || geminiError);
    }
  }

  // 2. Fallback to Tesseract.js
  let worker: any = null;
  try {
    const tessLang = language === 'spa' ? 'spa' : language === 'fra' ? 'fra' : language === 'deu' ? 'deu' : 'eng';
    worker = await createWorker(tessLang);
    const { data } = await worker.recognize(imageBuffer);
    const recognizedText = data.text || '';

    // Convert raw OCR lines into Markdown structure
    const lines = recognizedText.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const mdLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect list
      if (/^[•\-\*▪▫]\s+/.test(line)) {
        mdLines.push(`- ${line.replace(/^[•\-\*▪▫]\s+/, '')}`);
      } else if (/^\d+[\.\)]\s+/.test(line)) {
        mdLines.push(line);
      } else if (line.length < 50 && (line.toUpperCase() === line || !/[.!?]$/.test(line)) && i === 0) {
        // Probable heading
        mdLines.push(`## ${line}`);
      } else {
        mdLines.push(line);
      }
    }

    const markdown = mdLines.join('\n\n');
    const words = markdown.split(/\s+/).filter(Boolean).length;

    return {
      markdown,
      charCount: markdown.length,
      wordCount: words,
      engineUsed: 'tesseract',
    };
  } catch (tessError: any) {
    console.error(`Tesseract OCR failed for page ${pageNumber}:`, tessError);
    return {
      markdown: `*(OCR could not recognize text on page ${pageNumber})*`,
      charCount: 0,
      wordCount: 0,
      engineUsed: 'tesseract',
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore terminate error
      }
    }
  }
}
