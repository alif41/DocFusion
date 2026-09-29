import path from 'path';
import sharp from 'sharp';
import { PhotoConversionOptions, PhotoConversionResult } from './types';

export async function convertHeicToJpg(
  buffer: Buffer,
  originalFilename: string,
  options: PhotoConversionOptions = {}
): Promise<PhotoConversionResult> {
  const baseName = path.parse(originalFilename).name;
  const quality = Math.max(10, Math.min(100, options.quality || 92));

  let jpgBuffer: Buffer;
  let outWidth: number | undefined;
  let outHeight: number | undefined;

  try {
    // Primary path: Sharp native libheif decoder
    let pipeline = sharp(buffer).rotate();

    const metadata = await sharp(buffer).metadata();
    const origW = metadata.width || 1200;
    const origH = metadata.height || 900;

    if (options.scale && options.scale !== 1) {
      pipeline = pipeline.resize(Math.round(origW * options.scale), Math.round(origH * options.scale), {
        fit: 'inside',
      });
    } else if (options.resolution === 'small') {
      pipeline = pipeline.resize(Math.round(origW * 0.5), Math.round(origH * 0.5), { fit: 'inside' });
    } else if (options.resolution === 'medium') {
      pipeline = pipeline.resize(Math.round(origW * 0.75), Math.round(origH * 0.75), { fit: 'inside' });
    }

    jpgBuffer = await pipeline
      .jpeg({
        quality,
        mozjpeg: true,
      })
      .toBuffer();

    const outMeta = await sharp(jpgBuffer).metadata();
    outWidth = outMeta.width;
    outHeight = outMeta.height;
  } catch (primaryErr) {
    // Secondary fallback: heic-decode
    try {
      const decode = (await import('heic-decode')).default;
      const { data, width, height } = await decode({ buffer });

      let pipeline = sharp(Buffer.from(data), {
        raw: {
          width,
          height,
          channels: 4,
        },
      });

      if (options.scale && options.scale !== 1) {
        pipeline = pipeline.resize(Math.round(width * options.scale), Math.round(height * options.scale));
      }

      jpgBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      outWidth = width;
      outHeight = height;
    } catch (fallbackErr) {
      console.error('HEIC decoding failed:', primaryErr, fallbackErr);
      throw new Error(
        'Unable to decode this HEIC/HEIF photo. Please ensure it is an uncorrupted Apple or standard HEIC file.'
      );
    }
  }

  const filename = `${baseName}.jpg`;

  return {
    buffer: jpgBuffer,
    filename,
    mimeType: 'image/jpeg',
    size: jpgBuffer.length,
    width: outWidth,
    height: outHeight,
  };
}
