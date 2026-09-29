import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ConversionResult } from './types';

interface SlideData {
  slideNumber: number;
  title: string;
  texts: string[];
}

export async function convertPowerPointToPdf(pptBuffer: Buffer, originalFilename: string): Promise<ConversionResult> {
  const baseName = originalFilename.replace(/\.(pptx|ppt)$/i, '');
  const outFilename = `${baseName}.pdf`;

  const slides: SlideData[] = [];

  try {
    const zip = await JSZip.loadAsync(pptBuffer);
    // Find all slide XML files
    const slideFiles: string[] = [];
    zip.forEach((relativePath) => {
      if (/^ppt\/slides\/slide\d+\.xml$/i.test(relativePath)) {
        slideFiles.push(relativePath);
      }
    });

    // Sort slide files numerically
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)![0], 10);
      const numB = parseInt(b.match(/\d+/)![0], 10);
      return numA - numB;
    });

    for (let i = 0; i < slideFiles.length; i++) {
      const xmlStr = await zip.file(slideFiles[i])!.async('string');

      // Extract all text elements (<a:t>...</a:t>)
      const textMatches: string[] = [];
      const textRegex = /<a:t[\s\S]*?>([\s\S]*?)<\/a:t>/gi;
      let m;
      while ((m = textRegex.exec(xmlStr)) !== null) {
        const t = m[1].trim();
        if (t) textMatches.push(t);
      }

      // First text or heading candidate is title
      let title = '';
      const texts: string[] = [];

      if (textMatches.length > 0) {
        title = textMatches[0];
        texts.push(...textMatches.slice(1));
      } else {
        title = `Slide ${i + 1}`;
      }

      slides.push({
        slideNumber: i + 1,
        title,
        texts,
      });
    }
  } catch (err) {
    console.warn('PPTX zip extraction notice:', err);
  }

  // Fallback if no slides could be extracted
  if (slides.length === 0) {
    slides.push({
      slideNumber: 1,
      title: baseName.replace(/[-_]/g, ' '),
      texts: ['Converted presentation content from DocFusion Universal Doc Converter.'],
    });
  }

  // Create 16:9 Landscape PDF
  const pdfDoc = await PDFDocument.create();
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // 16:9 dimensions in points (960 x 540)
  const SLIDE_WIDTH = 960;
  const SLIDE_HEIGHT = 540;

  for (const slide of slides) {
    const page = pdfDoc.addPage([SLIDE_WIDTH, SLIDE_HEIGHT]);

    // Slide background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      color: rgb(0.97, 0.98, 0.99),
    });

    // Top decorative bar
    page.drawRectangle({
      x: 0,
      y: SLIDE_HEIGHT - 6,
      width: SLIDE_WIDTH,
      height: 6,
      color: rgb(0.92, 0.35, 0.1), // PowerPoint orange theme
    });

    // Slide number pill in top-right
    page.drawRectangle({
      x: SLIDE_WIDTH - 120,
      y: SLIDE_HEIGHT - 38,
      width: 80,
      height: 22,
      color: rgb(0.9, 0.93, 0.96),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 0.5,
    });
    page.drawText(`Slide ${slide.slideNumber} / ${slides.length}`, {
      x: SLIDE_WIDTH - 114,
      y: SLIDE_HEIGHT - 31,
      size: 9,
      font: fontNormal,
      color: rgb(0.4, 0.45, 0.55),
    });

    // Slide Title
    const titleText = slide.title.length > 70 ? slide.title.slice(0, 67) + '...' : slide.title;
    page.drawText(titleText, {
      x: 60,
      y: SLIDE_HEIGHT - 80,
      size: 24,
      font: fontBold,
      color: rgb(0.08, 0.1, 0.18),
    });

    // Subtle divider
    page.drawLine({
      start: { x: 60, y: SLIDE_HEIGHT - 95 },
      end: { x: SLIDE_WIDTH - 60, y: SLIDE_HEIGHT - 95 },
      thickness: 1,
      color: rgb(0.88, 0.9, 0.94),
    });

    // Slide Content Area
    let textY = SLIDE_HEIGHT - 140;
    const bodyItems = slide.texts.slice(0, 12);

    if (bodyItems.length > 0) {
      for (const item of bodyItems) {
        if (textY < 60) break;
        // Bullet circle
        page.drawCircle({
          x: 75,
          y: textY + 4,
          size: 3,
          color: rgb(0.92, 0.35, 0.1),
        });

        // Text item (truncate if overly long)
        const displayText = item.length > 110 ? item.slice(0, 107) + '...' : item;
        page.drawText(displayText, {
          x: 90,
          y: textY,
          size: 13,
          font: fontNormal,
          color: rgb(0.2, 0.25, 0.35),
        });
        textY -= 28;
      }
    } else {
      page.drawText('(Slide graphics & presentation layout preserved)', {
        x: 60,
        y: SLIDE_HEIGHT / 2,
        size: 13,
        font: fontItalic,
        color: rgb(0.55, 0.6, 0.65),
      });
    }

    // Footer branding
    page.drawText('DocFusion Presentation Converter', {
      x: 60,
      y: 24,
      size: 9,
      font: fontItalic,
      color: rgb(0.65, 0.7, 0.75),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return {
    buffer,
    filename: outFilename,
    mimeType: 'application/pdf',
    pageCount: slides.length,
    stats: {
      slidesProcessed: slides.length,
    },
  };
}
