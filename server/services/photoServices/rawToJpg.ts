import path from 'path';
import sharp from 'sharp';
import exifr from 'exifr';
import { PhotoConversionOptions, PhotoConversionResult } from './types';

export async function convertRawToJpg(
  buffer: Buffer,
  originalFilename: string,
  options: PhotoConversionOptions = {}
): Promise<PhotoConversionResult> {
  const baseName = path.parse(originalFilename).name;
  const ext = path.extname(originalFilename).toLowerCase();
  const quality = Math.max(10, Math.min(100, options.quality || 92));

  let extractedCamera: string | undefined;
  let metadataObj: Record<string, any> = {};

  try {
    const parsed = await exifr.parse(buffer, {
      tiff: true,
      exif: true,
      xmp: true,
    });
    if (parsed) {
      if (parsed.Make || parsed.Model) {
        extractedCamera = `${parsed.Make || ''} ${parsed.Model || ''}`.trim();
        metadataObj.camera = extractedCamera;
      }
      if (parsed.ISO) metadataObj.iso = parsed.ISO;
      if (parsed.FNumber) metadataObj.fNumber = `f/${parsed.FNumber}`;
      if (parsed.ExposureTime) {
        metadataObj.exposureTime =
          parsed.ExposureTime < 1
            ? `1/${Math.round(1 / parsed.ExposureTime)}s`
            : `${parsed.ExposureTime}s`;
      }
      if (parsed.FocalLength) metadataObj.focalLength = `${parsed.FocalLength}mm`;
      if (parsed.LensModel) metadataObj.lens = parsed.LensModel;
    }
  } catch {
    // metadata extraction non-fatal
  }

  let finalBuffer: Buffer | null = null;
  let outW: number | undefined;
  let outH: number | undefined;

  // Path 1: If DNG or TIFF based RAW, sharp might directly decode
  if (ext === '.dng' || ext === '.tif' || ext === '.tiff') {
    try {
      let pipeline = sharp(buffer).rotate();
      const meta = await sharp(buffer).metadata();
      if (meta.width && meta.height) {
        if (options.scale && options.scale !== 1) {
          pipeline = pipeline.resize(Math.round(meta.width * options.scale), Math.round(meta.height * options.scale));
        }
        finalBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        const resMeta = await sharp(finalBuffer).metadata();
        outW = resMeta.width;
        outH = resMeta.height;
      }
    } catch {
      // fallback to thumbnail extraction
    }
  }

  // Path 2: Extract embedded high-resolution preview from RAW IFD tags via exifr
  if (!finalBuffer) {
    try {
      const thumbBuffer = await exifr.thumbnail(buffer);
      if (thumbBuffer && thumbBuffer.length > 0) {
        let pipeline = sharp(thumbBuffer).rotate();
        const meta = await sharp(thumbBuffer).metadata();

        if (options.scale && options.scale !== 1 && meta.width && meta.height) {
          pipeline = pipeline.resize(Math.round(meta.width * options.scale), Math.round(meta.height * options.scale));
        } else if (options.resolution === 'small' && meta.width && meta.height) {
          pipeline = pipeline.resize(Math.round(meta.width * 0.5), Math.round(meta.height * 0.5));
        }

        finalBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        const resMeta = await sharp(finalBuffer).metadata();
        outW = resMeta.width;
        outH = resMeta.height;
      }
    } catch (err) {
      console.warn('Exifr thumbnail extraction failed:', err);
    }
  }

  // Path 3: Direct sharp decode attempt for other formats
  if (!finalBuffer) {
    try {
      const pipeline = sharp(buffer).rotate();
      finalBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      const resMeta = await sharp(finalBuffer).metadata();
      outW = resMeta.width;
      outH = resMeta.height;
    } catch {
      // Will throw clear error below
    }
  }

  if (!finalBuffer) {
    throw new Error(
      `This RAW photo (${ext.toUpperCase()}) is not currently supported or does not contain an extractable high-resolution image preview. Supported RAW formats include CR2, CR3, NEF, ARW, DNG, RAF, ORF, and RW2.`
    );
  }

  const filename = `${baseName}.jpg`;

  return {
    buffer: finalBuffer,
    filename,
    mimeType: 'image/jpeg',
    size: finalBuffer.length,
    width: outW,
    height: outH,
    metadata: metadataObj,
  };
}
