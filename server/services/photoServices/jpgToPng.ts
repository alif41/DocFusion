import path from 'path';
import sharp from 'sharp';
import { PhotoConversionOptions, PhotoConversionResult } from './types';

export async function convertJpgToPng(
  buffer: Buffer,
  originalFilename: string,
  options: PhotoConversionOptions = {}
): Promise<PhotoConversionResult> {
  const baseName = path.parse(originalFilename).name;
  let pipeline = sharp(buffer).rotate();

  const metadata = await sharp(buffer).metadata();
  const origW = metadata.width || 800;
  const origH = metadata.height || 600;

  // Handle resolution scaling if requested
  if (options.scale && options.scale !== 1) {
    const targetW = Math.round(origW * options.scale);
    const targetH = Math.round(origH * options.scale);
    pipeline = pipeline.resize(targetW, targetH, { fit: 'inside' });
  } else if (options.resolution === 'small') {
    pipeline = pipeline.resize(Math.round(origW * 0.5), Math.round(origH * 0.5), { fit: 'inside' });
  } else if (options.resolution === 'medium') {
    pipeline = pipeline.resize(Math.round(origW * 0.75), Math.round(origH * 0.75), { fit: 'inside' });
  } else if (options.resolution === 'large') {
    pipeline = pipeline.resize(Math.round(origW * 1.25), Math.round(origH * 1.25), { fit: 'inside' });
  }

  const pngBuffer = await pipeline
    .png({
      compressionLevel: 8,
      adaptiveFiltering: true,
      palette: false,
    })
    .toBuffer();

  const outMeta = await sharp(pngBuffer).metadata();
  const filename = `${baseName}.png`;

  return {
    buffer: pngBuffer,
    filename,
    mimeType: 'image/png',
    size: pngBuffer.length,
    width: outMeta.width || origW,
    height: outMeta.height || origH,
  };
}
