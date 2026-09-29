import {
  PhotoConversionOptions,
  PhotoConversionResult,
  PhotoConversionType,
  PhotoFileItem,
} from './types';
import { convertJpgToPdf } from './jpgToPdf';
import { convertPngToPdf } from './pngToPdf';
import { convertPdfToJpg } from './pdfToJpg';
import { convertJpgToPng } from './jpgToPng';
import { convertPngToJpg } from './pngToJpg';
import { convertHeicToJpg } from './heicToJpg';
import { convertWebpToJpg } from './webpToJpg';
import { convertJpgToWebp } from './jpgToWebp';
import { convertPngToWebp } from './pngToWebp';
import { convertRawToJpg } from './rawToJpg';

export * from './types';
export * from './jpgToPdf';
export * from './pngToPdf';
export * from './pdfToJpg';
export * from './jpgToPng';
export * from './pngToJpg';
export * from './heicToJpg';
export * from './webpToJpg';
export * from './jpgToWebp';
export * from './pngToWebp';
export * from './rawToJpg';

export async function executePhotoConversion(
  type: PhotoConversionType,
  files: PhotoFileItem[],
  options: PhotoConversionOptions = {}
): Promise<PhotoConversionResult> {
  if (!files || files.length === 0) {
    throw new Error('No files provided for photo conversion.');
  }

  switch (type) {
    case 'jpg-to-pdf':
      return await convertJpgToPdf(files, options);

    case 'png-to-pdf':
      return await convertPngToPdf(files, options);

    case 'pdf-to-jpg':
      return await convertPdfToJpg(files[0].buffer, files[0].originalname, options);

    case 'jpg-to-png':
      return await convertJpgToPng(files[0].buffer, files[0].originalname, options);

    case 'png-to-jpg':
      return await convertPngToJpg(files[0].buffer, files[0].originalname, options);

    case 'heic-to-jpg':
      return await convertHeicToJpg(files[0].buffer, files[0].originalname, options);

    case 'webp-to-jpg':
      return await convertWebpToJpg(files[0].buffer, files[0].originalname, options);

    case 'jpg-to-webp':
      return await convertJpgToWebp(files[0].buffer, files[0].originalname, options);

    case 'png-to-webp':
      return await convertPngToWebp(files[0].buffer, files[0].originalname, options);

    case 'raw-to-jpg':
      return await convertRawToJpg(files[0].buffer, files[0].originalname, options);

    default:
      throw new Error(`Unsupported photo conversion type: ${type}`);
  }
}
