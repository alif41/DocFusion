import path from 'path';
import sharp from 'sharp';
import { PhotoConversionOptions, PhotoConversionResult } from './types';

export async function convertWebpToJpg(
  buffer: Buffer,
  originalFilename: string,
  options: PhotoConversionOptions = {}
): Promise<PhotoConversionResult> {
  const baseName = path.parse(originalFilename).name;
  const metadata = await sharp(buffer).metadata();

  const origW = metadata.width || 800;
  const origH = metadata.height || 600;
  const hasAlpha = metadata.hasAlpha || false;

  let warning: string | undefined;
  if (hasAlpha) {
    warning =
      'JPG format does not support transparency. Transparent areas were rendered using the specified background.';
  }

  const bgColor = options.backgroundColor || '#ffffff';
  let pipeline = sharp(buffer)
    .rotate()
    .flatten({ background: bgColor });

  if (options.scale && options.scale !== 1) {
    const targetW = Math.round(origW * options.scale);
    const targetH = Math.round(origH * options.scale);
    pipeline = pipeline.resize(targetW, targetH, { fit: 'inside' });
  } else if (options.resolution === 'small') {
    pipeline = pipeline.resize(Math.round(origW * 0.5), Math.round(origH * 0.5), { fit: 'inside' });
  } else if (options.resolution === 'medium') {
    pipeline = pipeline.resize(Math.round(origW * 0.75), Math.round(origH * 0.75), { fit: 'inside' });
  }

  const quality = Math.max(10, Math.min(100, options.quality || 92));

  const jpgBuffer = await pipeline
    .jpeg({
      quality,
      mozjpeg: true,
    })
    .toBuffer();

  const outMeta = await sharp(jpgBuffer).metadata();
  const filename = `${baseName}.jpg`;

  return {
    buffer: jpgBuffer,
    filename,
    mimeType: 'image/jpeg',
    size: jpgBuffer.length,
    width: outMeta.width || origW,
    height: outMeta.height || origH,
    warning,
  };
}
