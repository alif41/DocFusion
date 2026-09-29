import path from 'path';
import sharp from 'sharp';
import { PhotoConversionOptions, PhotoConversionResult } from './types';

export async function convertJpgToWebp(
  buffer: Buffer,
  originalFilename: string,
  options: PhotoConversionOptions = {}
): Promise<PhotoConversionResult> {
  const baseName = path.parse(originalFilename).name;
  let pipeline = sharp(buffer).rotate();

  const metadata = await sharp(buffer).metadata();
  const origW = metadata.width || 800;
  const origH = metadata.height || 600;

  if (options.scale && options.scale !== 1) {
    const targetW = Math.round(origW * options.scale);
    const targetH = Math.round(origH * options.scale);
    pipeline = pipeline.resize(targetW, targetH, { fit: 'inside' });
  } else if (options.resolution === 'small') {
    pipeline = pipeline.resize(Math.round(origW * 0.5), Math.round(origH * 0.5), { fit: 'inside' });
  } else if (options.resolution === 'medium') {
    pipeline = pipeline.resize(Math.round(origW * 0.75), Math.round(origH * 0.75), { fit: 'inside' });
  }

  const quality = Math.max(10, Math.min(100, options.quality || 85));

  const webpBuffer = await pipeline
    .webp({
      quality,
      effort: 6,
    })
    .toBuffer();

  const outMeta = await sharp(webpBuffer).metadata();
  const filename = `${baseName}.webp`;

  return {
    buffer: webpBuffer,
    filename,
    mimeType: 'image/webp',
    size: webpBuffer.length,
    width: outMeta.width || origW,
    height: outMeta.height || origH,
  };
}
