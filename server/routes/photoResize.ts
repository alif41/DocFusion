import express from 'express';
import multer from 'multer';
import {
  inspectImage,
  resizeSingleImage,
  createZipFromResizedItems,
  PhotoResizeOptions,
  PhotoResizeResultItem,
} from '../services/photoResizeService';

const router = express.Router();

// Multer memory storage (up to 50MB per image, up to 50 images)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 50,
  },
  fileFilter: (_req, file, cb) => {
    const isImage =
      file.mimetype.startsWith('image/') ||
      /\.(jpe?g|png|webp|heic|heif)$/i.test(file.originalname);
    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error(`File "${file.originalname}" is not a supported image format (JPG, PNG, WEBP, HEIC).`));
    }
  },
});

// Ephemeral download cache (expires in 30 minutes)
interface CachedResult {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  createdAt: number;
}
const downloadCache = new Map<string, CachedResult>();

function pruneCache() {
  const now = Date.now();
  for (const [id, item] of downloadCache.entries()) {
    if (now - item.createdAt > 30 * 60 * 1000) {
      downloadCache.delete(id);
    }
  }
}
setInterval(pruneCache, 5 * 60 * 1000);

/**
 * Inspect uploaded image(s) to retrieve dimensions, size, and thumbnails
 */
router.post('/inspect', upload.array('images', 50), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one image to inspect.' });
    }

    const inspected = await Promise.all(
      files.map(async (file) => {
        try {
          const info = await inspectImage(file.buffer, file.originalname);
          return {
            filename: file.originalname,
            width: info.width,
            height: info.height,
            format: info.format,
            size: info.size,
            aspectRatio: info.aspectRatio,
            thumbnailDataUrl: info.thumbnailDataUrl,
          };
        } catch (err: any) {
          return {
            filename: file.originalname,
            error: err.message || 'Failed to inspect image.',
          };
        }
      })
    );

    res.json({ success: true, count: inspected.length, images: inspected });
  } catch (err: any) {
    console.error('Inspect error:', err);
    res.status(500).json({ error: err.message || 'Failed to inspect image.' });
  }
});

/**
 * Resize uploaded images according to provided options
 */
router.post('/resize', upload.array('images', 50), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images were provided for resizing.' });
    }

    let options: PhotoResizeOptions = {};
    if (req.body.options) {
      try {
        options = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
      } catch {
        options = {};
      }
    }

    let fileOptionsMap: Record<string, Partial<PhotoResizeOptions>> = {};
    if (req.body.fileOptions) {
      try {
        const parsed = typeof req.body.fileOptions === 'string' ? JSON.parse(req.body.fileOptions) : req.body.fileOptions;
        if (Array.isArray(parsed)) {
          parsed.forEach((fo: any) => {
            if (fo.filename) fileOptionsMap[fo.filename] = fo;
          });
        } else if (typeof parsed === 'object') {
          fileOptionsMap = parsed;
        }
      } catch {
        fileOptionsMap = {};
      }
    }

    const results: PhotoResizeResultItem[] = [];

    for (const file of files) {
      try {
        const specific = fileOptionsMap[file.originalname] || {};
        const mergedOptions: PhotoResizeOptions = {
          ...options,
          ...specific,
          adjustments: {
            ...(options.adjustments || {}),
            ...(specific.adjustments || {}),
          },
        };

        const item = await resizeSingleImage(file.buffer, file.originalname, mergedOptions);
        // Cache for download
        downloadCache.set(item.id, {
          filename: item.filename,
          buffer: item.buffer,
          mimeType: item.mimeType,
          createdAt: Date.now(),
        });
        results.push(item);
      } catch (err: any) {
        console.error(`Failed to resize ${file.originalname}:`, err);
        return res.status(500).json({
          error: `Error processing "${file.originalname}": ${err.message}`,
        });
      }
    }

    // Return serializable results (exclude raw Buffer to avoid huge JSON bloat if dataUrl is enough)
    const responsePayload = results.map((r) => ({
      id: r.id,
      filename: r.filename,
      originalWidth: r.originalWidth,
      originalHeight: r.originalHeight,
      originalSize: r.originalSize,
      newWidth: r.newWidth,
      newHeight: r.newHeight,
      newSize: r.newSize,
      format: r.format,
      mimeType: r.mimeType,
      dataUrl: r.dataUrl,
    }));

    res.json({
      success: true,
      count: responsePayload.length,
      results: responsePayload,
    });
  } catch (err: any) {
    console.error('Resize error:', err);
    res.status(500).json({ error: err.message || 'An error occurred during resizing.' });
  }
});

/**
 * Download a single resized image by ID
 */
router.get('/download/:id', (req, res) => {
  const { id } = req.params;
  const cached = downloadCache.get(id);

  if (!cached) {
    return res.status(404).json({ error: 'Download link expired or not found. Please re-run resizing.' });
  }

  res.setHeader('Content-Type', cached.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cached.filename)}"`);
  res.setHeader('Content-Length', cached.buffer.length);
  res.send(cached.buffer);
});

/**
 * Download multiple resized images as a single ZIP archive
 */
router.post('/download-zip', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Please provide valid image IDs to bundle into a ZIP.' });
    }

    const itemsToZip: Array<{ filename: string; buffer: Buffer }> = [];
    for (const id of ids) {
      const cached = downloadCache.get(id);
      if (cached) {
        itemsToZip.push({ filename: cached.filename, buffer: cached.buffer });
      }
    }

    if (itemsToZip.length === 0) {
      return res.status(404).json({ error: 'No cached images found for ZIP generation. Please re-run resizing.' });
    }

    const zipBuffer = await createZipFromResizedItems(itemsToZip);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="docfusion-resized-photos.zip"');
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('ZIP error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate ZIP archive.' });
  }
});

export default router;
