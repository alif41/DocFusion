import path from 'path';
import sharp, { Sharp } from 'sharp';
import JSZip from 'jszip';

export interface ImageAdjustmentsData {
  cropX?: number; // -50 to 50
  cropY?: number; // -50 to 50
  zoom?: number; // 1 to 3
  rotation?: number; // 0, 90, 180, 270
  flipH?: boolean;
  flipV?: boolean;
  brightness?: number; // 50 to 150
  contrast?: number; // 50 to 150
  saturation?: number; // 0 to 200
}

export interface PhotoResizeOptions {
  mode?: 'dimensions' | 'percentage' | 'preset';
  width?: number;
  height?: number;
  percentage?: number;
  maintainAspectRatio?: boolean;
  aspectRatio?: string; // 'original', '1:1', '4:3', '16:9', '9:16', '3:2', '2:3', '4:5', '21:9', or custom 'W:H'
  fit?: 'inside' | 'cover' | 'contain' | 'fill';
  paddingColor?: 'white' | 'black' | 'transparent';
  outputFormat?: 'original' | 'jpg' | 'jpeg' | 'png' | 'webp';
  quality?: number; // 10 to 100
  targetSizeKb?: number; // optional target file size cap in KB
  adjustments?: ImageAdjustmentsData;
}

export interface PhotoInspectResult {
  filename: string;
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
  thumbnailDataUrl?: string;
  fullPreviewDataUrl?: string;
}

export interface PhotoResizeResultItem {
  id: string;
  filename: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  newWidth: number;
  newHeight: number;
  newSize: number;
  format: string;
  mimeType: string;
  buffer: Buffer;
  dataUrl: string;
}

/**
 * Loads an image into a sharp instance, gracefully handling HEIC / HEIF with fallback
 */
export async function createSharpPipeline(
  buffer: Buffer,
  filename: string
): Promise<{ instance: Sharp; width: number; height: number; format: string }> {
  const ext = path.extname(filename).toLowerCase();
  const isHeic = ext === '.heic' || ext === '.heif';

  if (isHeic) {
    try {
      const instance = sharp(buffer).rotate();
      const meta = await instance.metadata();
      if (meta.width && meta.height) {
        return {
          instance,
          width: meta.width,
          height: meta.height,
          format: 'heic',
        };
      }
    } catch {
      // Fallback to heic-decode
    }

    try {
      const decode = (await import('heic-decode')).default;
      const { data, width, height } = await decode({ buffer });
      const instance = sharp(Buffer.from(data), {
        raw: { width, height, channels: 4 },
      });
      return {
        instance,
        width,
        height,
        format: 'heic',
      };
    } catch (err: any) {
      throw new Error(`Failed to decode HEIC image "${filename}": ${err.message}`);
    }
  }

  const instance = sharp(buffer).rotate();
  const meta = await instance.metadata();

  if (!meta.width || !meta.height) {
    throw new Error(`Failed to read dimensions of image "${filename}". The file may be corrupted.`);
  }

  return {
    instance,
    width: meta.width,
    height: meta.height,
    format: meta.format || ext.replace('.', ''),
  };
}

/**
 * Inspect an uploaded image to extract metadata and a preview thumbnail
 */
export async function inspectImage(
  buffer: Buffer,
  filename: string
): Promise<PhotoInspectResult> {
  const { instance, width, height, format } = await createSharpPipeline(buffer, filename);

  const ext = path.extname(filename).toLowerCase();
  const isHeic = ext === '.heic' || ext === '.heif' || format === 'heic' || format === 'heif';

  // Generate lightweight thumbnail (300px) for list card
  let thumbnailDataUrl: string | undefined;
  let fullPreviewDataUrl: string | undefined;

  try {
    const thumbBuffer = await instance
      .clone()
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    thumbnailDataUrl = `data:image/webp;base64,${thumbBuffer.toString('base64')}`;

    // For HEIC/HEIF files (which web browsers can't render natively), generate high-res preview (up to 2048px)
    if (isHeic) {
      const fullBuffer = await instance
        .clone()
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toBuffer();
      fullPreviewDataUrl = `data:image/webp;base64,${fullBuffer.toString('base64')}`;
    }
  } catch {
    // If generation fails, omit it
  }

  return {
    filename,
    width,
    height,
    format,
    size: buffer.length,
    aspectRatio: width / height,
    thumbnailDataUrl,
    fullPreviewDataUrl,
  };
}

/**
 * Resize a single image buffer based on options
 */
export async function resizeSingleImage(
  buffer: Buffer,
  originalFilename: string,
  options: PhotoResizeOptions = {}
): Promise<PhotoResizeResultItem> {
  const { instance, width: origW, height: origH, format: detectedFormat } = await createSharpPipeline(
    buffer,
    originalFilename
  );

  const mode = options.mode || 'dimensions';
  const maintainAspect = options.maintainAspectRatio !== false;
  let fitMode = options.fit || (maintainAspect ? 'inside' : 'fill');
  let userQuality = Math.max(10, Math.min(100, options.quality || 85));

  // Parse target aspect ratio if provided
  let targetRatio: number | null = null;
  if (options.aspectRatio && options.aspectRatio !== 'original') {
    const parts = options.aspectRatio.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] > 0) {
      targetRatio = parts[0] / parts[1];
    }
  }

  // Determine target dimensions
  let targetW: number = origW;
  let targetH: number = origH;

  if (mode === 'percentage') {
    const pct = Math.max(5, Math.min(500, options.percentage || 100)) / 100;
    targetW = Math.max(1, Math.round(origW * pct));
    targetH = Math.max(1, Math.round(origH * pct));
    if (targetRatio) {
      targetH = Math.max(1, Math.round(targetW / targetRatio));
    }
  } else {
    // dimensions, aspect ratio, or preset
    if (options.width && options.height) {
      if (targetRatio) {
        targetW = options.width;
        targetH = Math.max(1, Math.round(options.width / targetRatio));
      } else if (maintainAspect && !options.fit) {
        // preserve aspect ratio within the bounding box
        const aspect = origW / origH;
        const targetAspect = options.width / options.height;
        if (aspect > targetAspect) {
          targetW = options.width;
          targetH = Math.max(1, Math.round(options.width / aspect));
        } else {
          targetH = options.height;
          targetW = Math.max(1, Math.round(options.height * aspect));
        }
      } else {
        targetW = options.width;
        targetH = options.height;
      }
    } else if (options.width && !options.height) {
      targetW = options.width;
      if (targetRatio) {
        targetH = Math.max(1, Math.round(options.width / targetRatio));
      } else {
        targetH = maintainAspect
          ? Math.max(1, Math.round(options.width / (origW / origH)))
          : origH;
      }
    } else if (!options.width && options.height) {
      targetH = options.height;
      if (targetRatio) {
        targetW = Math.max(1, Math.round(options.height * targetRatio));
      } else {
        targetW = maintainAspect
          ? Math.max(1, Math.round(options.height * (origW / origH)))
          : origW;
      }
    } else if (targetRatio) {
      targetW = origW;
      targetH = Math.max(1, Math.round(origW / targetRatio));
    }
  }

  // Determine output format
  let requestedFmt = (options.outputFormat || 'original').toLowerCase();
  if (requestedFmt === 'original') {
    if (detectedFormat === 'heic' || detectedFormat === 'heif') {
      requestedFmt = 'jpg'; // web browsers can't display heic natively
    } else if (detectedFormat === 'png') {
      requestedFmt = 'png';
    } else if (detectedFormat === 'webp') {
      requestedFmt = 'webp';
    } else {
      requestedFmt = 'jpg';
    }
  }

  if (requestedFmt === 'jpeg') requestedFmt = 'jpg';

  const baseName = path.parse(originalFilename).name;
  const outExtension = requestedFmt === 'png' ? '.png' : requestedFmt === 'webp' ? '.webp' : '.jpg';
  const outFilename = `${baseName}-resized${outExtension}`;

  // Prepare background padding for contain mode
  const paddingColor = options.paddingColor || 'white';
  const background =
    paddingColor === 'black'
      ? { r: 0, g: 0, b: 0, alpha: 1 }
      : paddingColor === 'transparent'
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : { r: 255, g: 255, b: 255, alpha: 1 };

  // Helper to build formatted pipeline at specific quality and dimensions
  const buildBuffer = async (w: number, h: number, q: number): Promise<Buffer> => {
    let pipeline = instance.clone();

    if (options.adjustments) {
      const adj = options.adjustments;
      if (adj.rotation) {
        pipeline = pipeline.rotate(adj.rotation);
      }
      if (adj.flipH) {
        pipeline = pipeline.flop();
      }
      if (adj.flipV) {
        pipeline = pipeline.flip();
      }
      const b = adj.brightness ? adj.brightness / 100 : 1;
      const s = adj.saturation ? adj.saturation / 100 : 1;
      if (b !== 1 || s !== 1) {
        pipeline = pipeline.modulate({ brightness: b, saturation: s });
      }
    }

    pipeline = pipeline.resize(w, h, {
      fit: fitMode,
      position: 'center',
      background,
    });

    if (requestedFmt === 'png') {
      return pipeline
        .png({
          quality: q,
          compressionLevel: 9,
          palette: q < 90,
        })
        .toBuffer();
    } else if (requestedFmt === 'webp') {
      return pipeline
        .webp({
          quality: q,
          effort: 4,
        })
        .toBuffer();
    } else {
      return pipeline
        .jpeg({
          quality: q,
          mozjpeg: true,
        })
        .toBuffer();
    }
  };

  let finalBuffer = await buildBuffer(targetW, targetH, userQuality);

  // Optional target file size cap (e.g. targetSizeKb = 200KB)
  if (options.targetSizeKb && options.targetSizeKb > 0) {
    const maxBytes = options.targetSizeKb * 1024;
    if (finalBuffer.length > maxBytes) {
      // Iteratively reduce quality
      const qualitySteps = [75, 60, 48, 36, 25, 18];
      for (const q of qualitySteps) {
        if (q >= userQuality) continue;
        const testBuf = await buildBuffer(targetW, targetH, q);
        finalBuffer = testBuf;
        if (finalBuffer.length <= maxBytes) {
          break;
        }
      }

      // If still exceeding target size, downscale dimensions in 15% decrements
      if (finalBuffer.length > maxBytes) {
        let scaleFactor = 0.85;
        for (let attempt = 0; attempt < 3; attempt++) {
          const scaledW = Math.max(1, Math.round(targetW * scaleFactor));
          const scaledH = Math.max(1, Math.round(targetH * scaleFactor));
          const testBuf = await buildBuffer(scaledW, scaledH, 30);
          finalBuffer = testBuf;
          if (finalBuffer.length <= maxBytes) break;
          scaleFactor *= 0.85;
        }
      }
    }
  }

  // Read actual output metadata
  const outMeta = await sharp(finalBuffer).metadata();
  const actualW = outMeta.width || targetW;
  const actualH = outMeta.height || targetH;

  const mimeType =
    requestedFmt === 'png'
      ? 'image/png'
      : requestedFmt === 'webp'
      ? 'image/webp'
      : 'image/jpeg';

  const dataUrl = `data:${mimeType};base64,${finalBuffer.toString('base64')}`;
  const id = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    id,
    filename: outFilename,
    originalWidth: origW,
    originalHeight: origH,
    originalSize: buffer.length,
    newWidth: actualW,
    newHeight: actualH,
    newSize: finalBuffer.length,
    format: requestedFmt,
    mimeType,
    buffer: finalBuffer,
    dataUrl,
  };
}

/**
 * Creates a ZIP archive containing all resized images
 */
export async function createZipFromResizedItems(
  items: Array<{ filename: string; buffer: Buffer }>
): Promise<Buffer> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const item of items) {
    let filename = item.filename;
    let counter = 1;
    while (usedNames.has(filename)) {
      const parsed = path.parse(item.filename);
      filename = `${parsed.name}_${counter}${parsed.ext}`;
      counter++;
    }
    usedNames.add(filename);
    zip.file(filename, item.buffer);
  }

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
