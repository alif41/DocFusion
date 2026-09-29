import express from 'express';
import path from 'path';
import multer from 'multer';
import {
  executePhotoConversion,
  PhotoConversionOptions,
  PhotoConversionType,
  PhotoFileItem,
} from '../services/photoServices';

const router = express.Router();

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per photo
    files: 50, // allow up to 50 photos in batch mode
  },
});

const VALID_EXTS: Record<PhotoConversionType, string[]> = {
  'jpg-to-pdf': ['.jpg', '.jpeg'],
  'pdf-to-jpg': ['.pdf'],
  'jpg-to-png': ['.jpg', '.jpeg'],
  'png-to-jpg': ['.png'],
  'heic-to-jpg': ['.heic', '.heif'],
  'webp-to-jpg': ['.webp'],
  'jpg-to-webp': ['.jpg', '.jpeg'],
  'png-to-webp': ['.png'],
  'png-to-pdf': ['.png'],
  'raw-to-jpg': ['.cr2', '.cr3', '.nef', '.arw', '.dng', '.raf', '.orf', '.rw2', '.raw'],
};

// Handler for all photo conversion requests
const handlePhotoConversion = async (
  req: express.Request,
  res: express.Response,
  conversionTypeParam?: string
) => {
  try {
    const conversionType = (conversionTypeParam || req.params.conversionType) as PhotoConversionType;

    if (!VALID_EXTS[conversionType]) {
      return res.status(400).json({
        error: `Unsupported photo conversion type: "${conversionType}".`,
      });
    }

    // Extract uploaded files
    let rawFiles: Express.Multer.File[] = [];
    if (req.files) {
      if (Array.isArray(req.files)) {
        rawFiles = req.files;
      } else {
        for (const key of Object.keys(req.files)) {
          rawFiles.push(...req.files[key]);
        }
      }
    } else if (req.file) {
      rawFiles = [req.file];
    }

    if (!rawFiles || rawFiles.length === 0) {
      return res.status(400).json({
        error: 'No image or document file was uploaded. Please select a valid file to convert.',
      });
    }

    // Reorder files if fileOrdering is provided (JSON array of original names or indices)
    let sortedFiles = [...rawFiles];
    if (req.body.fileOrdering) {
      try {
        const orderList: string[] = JSON.parse(req.body.fileOrdering);
        if (Array.isArray(orderList) && orderList.length > 0) {
          const map = new Map<string, Express.Multer.File>();
          sortedFiles.forEach((f) => map.set(f.originalname, f));
          const ordered: Express.Multer.File[] = [];
          for (const name of orderList) {
            const found = map.get(name);
            if (found) {
              ordered.push(found);
              map.delete(name);
            }
          }
          // append any remaining
          map.forEach((f) => ordered.push(f));
          sortedFiles = ordered;
        }
      } catch {
        // fallback to original order
      }
    }

    // Validate extensions
    const acceptedExts = VALID_EXTS[conversionType];
    for (const f of sortedFiles) {
      const ext = path.extname(f.originalname).toLowerCase();
      if (!acceptedExts.includes(ext)) {
        return res.status(400).json({
          error: `File "${f.originalname}" is not supported for this conversion. Please upload a file with one of the accepted extensions: ${acceptedExts.join(', ')}.`,
        });
      }
    }

    // Extract options
    const options: PhotoConversionOptions = {};
    if (req.body.quality) {
      const q = parseInt(req.body.quality, 10);
      if (!isNaN(q) && q >= 1 && q <= 100) options.quality = q;
    }
    if (req.body.resolution) {
      options.resolution = req.body.resolution;
    }
    if (req.body.scale) {
      const s = parseFloat(req.body.scale);
      if (!isNaN(s) && s > 0) options.scale = s;
    }
    if (req.body.backgroundColor) {
      options.backgroundColor = req.body.backgroundColor;
    }
    if (req.body.pageSize) {
      options.pageSize = req.body.pageSize;
    }
    if (req.body.orientation) {
      options.orientation = req.body.orientation;
    }
    if (req.body.margin) {
      options.margin = req.body.margin;
    }
    if (req.body.imageFit) {
      options.imageFit = req.body.imageFit;
    }
    if (req.body.pdfPages) {
      options.pdfPages = req.body.pdfPages;
    }
    if (req.body.dpi) {
      const d = parseInt(req.body.dpi, 10);
      if (!isNaN(d)) options.dpi = d;
    }

    const photoFiles: PhotoFileItem[] = sortedFiles.map((f) => ({
      buffer: f.buffer,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    }));

    const result = await executePhotoConversion(conversionType, photoFiles, options);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(result.filename)}"`
    );
    res.setHeader('X-Converted-Filename', encodeURIComponent(result.filename));
    res.setHeader('X-Original-Filename', encodeURIComponent(sortedFiles[0].originalname));
    res.setHeader('X-Original-Size', sortedFiles.reduce((acc, f) => acc + f.size, 0).toString());
    res.setHeader('X-Output-Size', result.buffer.length.toString());
    res.setHeader('X-Conversion-Type', conversionType);

    if (result.width) res.setHeader('X-Output-Width', result.width.toString());
    if (result.height) res.setHeader('X-Output-Height', result.height.toString());
    if (result.pagesCount) res.setHeader('X-Pages-Count', result.pagesCount.toString());
    if (result.isZip) res.setHeader('X-Is-Zip', 'true');
    if (result.warning) res.setHeader('X-Conversion-Warning', encodeURIComponent(result.warning));
    if (result.metadata?.camera) {
      res.setHeader('X-Detected-Camera', encodeURIComponent(result.metadata.camera));
    }

    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-Converted-Filename, X-Original-Filename, X-Original-Size, X-Output-Size, X-Conversion-Type, X-Output-Width, X-Output-Height, X-Pages-Count, X-Is-Zip, X-Conversion-Warning, X-Detected-Camera, Content-Disposition, Content-Type'
    );

    return res.status(200).send(result.buffer);
  } catch (error: any) {
    console.error('Photo Conversion Error:', error);
    return res.status(500).json({
      error:
        error.message ||
        'We encountered an issue while converting your photo(s). Please verify file integrity and try again.',
    });
  }
};

// Flexible multer middleware for single or multiple files
const uploadMiddleware = photoUpload.any();

// Route mappings
router.post('/jpg-to-pdf', uploadMiddleware, (req, res) => handlePhotoConversion(req, res, 'jpg-to-pdf'));
router.post('/pdf-to-jpg', uploadMiddleware, (req, res) => handlePhotoConversion(req, res, 'pdf-to-jpg'));
router.post('/jpg-to-png', uploadMiddleware, (req, res) => handlePhotoConversion(req, res, 'jpg-to-png'));
router.post('/png-to-jpg', uploadMiddleware, (req, res) => handlePhotoConversion(req, res, 'png-to-jpg'));
router.post('/heic-to-jpg', uploadMiddleware, (req, res) => handlePhotoConversion(req, res, 'heic-to-jpg'));
router.post('/webp-to-jpg', uploadMiddleware, (req, res) => handlePhotoConversion(req, res, 'webp-to-jpg'));
router.post('/jpg-to-webp', uploadMiddleware, (req, res) => handlePhotoConversion(req, res, 'jpg-to-webp'));
router.post('/png-to-webp', uploadMiddleware, (req, res) => handlePhotoConversion(req, res, 'png-to-webp'));
router.post('/png-to-pdf', uploadMiddleware, (req, res) => handlePhotoConversion(req, res, 'png-to-pdf'));
router.post('/raw-to-jpg', uploadMiddleware, (req, res) => handlePhotoConversion(req, res, 'raw-to-jpg'));
router.post('/:conversionType', uploadMiddleware, (req, res) => handlePhotoConversion(req, res));

export default router;
