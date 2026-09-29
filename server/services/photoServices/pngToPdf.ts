import { PDFDocument } from 'pdf-lib';
import path from 'path';
import sharp from 'sharp';
import { PhotoConversionOptions, PhotoConversionResult, PhotoFileItem } from './types';

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.0, height: 792.0 },
};

export async function convertPngToPdf(
  files: PhotoFileItem[],
  options: PhotoConversionOptions = {}
): Promise<PhotoConversionResult> {
  if (!files || files.length === 0) {
    throw new Error('No PNG files provided for PDF conversion.');
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Converted with DocFusion Photo Converter');
  pdfDoc.setCreator('DocFusion Universal Photo Converter');

  const pageSizeOpt = options.pageSize || 'a4';
  const orientationOpt = options.orientation || 'auto';
  const marginOpt = options.margin || 'small';
  const fitOpt = options.imageFit || 'fit';

  let marginPts = 20;
  if (marginOpt === 'none') marginPts = 0;
  else if (marginOpt === 'small') marginPts = 18;
  else if (marginOpt === 'normal') marginPts = 36;
  else if (marginOpt === 'large') marginPts = 54;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Ensure valid PNG and read metadata
    let imgBuffer = file.buffer;
    let metadata;
    try {
      metadata = await sharp(imgBuffer).metadata();
      // Ensure PNG format
      imgBuffer = await sharp(imgBuffer).rotate().png({ compressionLevel: 8 }).toBuffer();
      metadata = await sharp(imgBuffer).metadata();
    } catch {
      // Use as-is if sharp fails
    }

    const imgWidth = metadata?.width || 800;
    const imgHeight = metadata?.height || 600;

    const embeddedImage = await pdfDoc.embedPng(imgBuffer);

    let pageW: number;
    let pageH: number;

    if (pageSizeOpt === 'fit') {
      pageW = imgWidth;
      pageH = imgHeight;
    } else {
      const base = PAGE_SIZES[pageSizeOpt] || PAGE_SIZES.a4;
      const isLandscapeImage = imgWidth > imgHeight;

      if (orientationOpt === 'landscape' || (orientationOpt === 'auto' && isLandscapeImage)) {
        pageW = Math.max(base.width, base.height);
        pageH = Math.min(base.width, base.height);
      } else {
        pageW = Math.min(base.width, base.height);
        pageH = Math.max(base.width, base.height);
      }
    }

    const page = pdfDoc.addPage([pageW, pageH]);

    if (pageSizeOpt === 'fit' && marginPts === 0) {
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: pageW,
        height: pageH,
      });
    } else {
      const availW = Math.max(10, pageW - marginPts * 2);
      const availH = Math.max(10, pageH - marginPts * 2);

      let drawW: number;
      let drawH: number;

      if (fitOpt === 'fill') {
        drawW = availW;
        drawH = availH;
      } else if (fitOpt === 'original') {
        drawW = Math.min(imgWidth, availW);
        drawH = Math.min(imgHeight, availH);
      } else {
        const scale = Math.min(availW / imgWidth, availH / imgHeight);
        drawW = imgWidth * scale;
        drawH = imgHeight * scale;
      }

      const drawX = marginPts + (availW - drawW) / 2;
      const drawY = marginPts + (availH - drawH) / 2;

      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  const baseName =
    files.length === 1
      ? path.parse(files[0].originalname).name
      : `png_converted_${files.length}_pages`;
  const filename = `${baseName}.pdf`;

  return {
    buffer,
    filename,
    mimeType: 'application/pdf',
    size: buffer.length,
    pagesCount: files.length,
  };
}
