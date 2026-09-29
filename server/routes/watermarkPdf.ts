import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import {
  applyWatermarksToPdf,
  validatePdfMagicBytes,
  BackendWatermarkItem,
} from '../services/watermarkPdf';
import { PDFDocument } from 'pdf-lib';

interface WatermarkJob {
  id: string;
  createdAt: number;
  originalName: string;
  originalSize: number;
  originalBuffer: Buffer;
  originalPageCount: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  currentStep?: string;
  resultBuffer?: Buffer;
  outputName?: string;
  outputSize?: number;
  watermarkedPagesCount?: number;
  error?: string;
}

const router = express.Router();

// Memory storage up to 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 2, // pdf file + optional watermark image
  },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    const isImage =
      file.mimetype.startsWith('image/') ||
      /\.(png|jpe?g|webp|svg)$/i.test(file.originalname);

    if (isPdf || isImage) {
      cb(null, true);
    } else {
      cb(new Error(`File "${file.originalname}" is not an accepted format.`));
    }
  },
});

// Ephemeral job cache
const jobsMap = new Map<string, WatermarkJob>();

function pruneOldJobs() {
  const now = Date.now();
  for (const [id, job] of jobsMap.entries()) {
    if (now - job.createdAt > 30 * 60 * 1000) {
      jobsMap.delete(id);
    }
  }
}
setInterval(pruneOldJobs, 5 * 60 * 1000);

/**
 * POST /api/watermark-pdf/upload
 * Initial PDF upload & validation
 */
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'The uploaded PDF exceeds the 50MB file size limit.',
          });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Please select a PDF file to upload.' });
    }

    if (!validatePdfMagicBytes(file.buffer)) {
      return res.status(400).json({
        error: 'Invalid file format. The file is not a valid PDF document.',
      });
    }

    let pageCount = 0;
    try {
      const doc = await PDFDocument.load(file.buffer, { ignoreEncryption: false });
      pageCount = doc.getPageCount();
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('password') || msg.includes('encrypt')) {
        return res.status(400).json({
          error: 'This PDF document is password-protected. Please unlock encryption before applying watermarks.',
        });
      }
      return res.status(400).json({
        error: `Unable to parse PDF: ${err.message || 'Corrupted document'}`,
      });
    }

    const jobId = 'wm_' + crypto.randomBytes(8).toString('hex');
    const job: WatermarkJob = {
      id: jobId,
      createdAt: Date.now(),
      originalName: file.originalname,
      originalSize: file.size,
      originalBuffer: file.buffer,
      originalPageCount: pageCount,
      status: 'idle',
      progress: 0,
    };

    jobsMap.set(jobId, job);

    return res.status(200).json({
      jobId,
      originalName: file.originalname,
      pageCount,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Watermark PDF upload error:', error);
    return res.status(400).json({
      error: error.message || 'Failed to process PDF document.',
    });
  }
});

/**
 * POST /api/watermark-pdf/apply
 * Applies watermark configuration and generates final PDF
 */
router.post('/apply', (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload error.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    let sourceBuffer: Buffer | null = null;
    let originalName = 'document.pdf';
    let jobId: string | null = null;
    let job: WatermarkJob | undefined;

    // Check if uploaded file was sent in multipart
    const files = req.files as Express.Multer.File[] | undefined;
    const pdfFile = files?.find(
      (f) =>
        f.fieldname === 'file' ||
        f.mimetype === 'application/pdf' ||
        f.originalname.toLowerCase().endsWith('.pdf')
    );

    if (pdfFile) {
      sourceBuffer = pdfFile.buffer;
      originalName = pdfFile.originalname;
    } else if (req.body.jobId) {
      jobId = req.body.jobId;
      job = jobsMap.get(jobId!);
      if (!job) {
        return res.status(404).json({
          error: 'Session expired or invalid jobId. Please re-upload the document.',
        });
      }
      sourceBuffer = job.originalBuffer;
      originalName = job.originalName;
    } else {
      return res.status(400).json({
        error: 'Missing PDF file or valid jobId.',
      });
    }

    // Parse watermarks array
    let watermarks: BackendWatermarkItem[] = [];
    if (typeof req.body.watermarks === 'string') {
      try {
        watermarks = JSON.parse(req.body.watermarks);
      } catch {
        return res.status(400).json({ error: 'Invalid watermarks JSON format.' });
      }
    } else if (Array.isArray(req.body.watermarks)) {
      watermarks = req.body.watermarks;
    } else {
      return res.status(400).json({ error: 'Missing watermarks configuration.' });
    }

    // Check if any watermark uses an uploaded image from multipart files
    if (files) {
      const imageFiles = files.filter(
        (f) => f.fieldname.startsWith('image_') || f.mimetype.startsWith('image/')
      );
      for (const imgFile of imageFiles) {
        // match watermark by id or fieldname
        const targetWm = watermarks.find(
          (w) => w.id === imgFile.fieldname.replace('image_', '') || w.type === 'image'
        );
        if (targetWm && !targetWm.imageBase64) {
          targetWm.imageBase64 = imgFile.buffer.toString('base64');
          targetWm.imageMimeType = imgFile.mimetype;
        }
      }
    }

    const baseName = originalName.replace(/\.pdf$/i, '');
    let outputFilename =
      (req.body.filename as string)?.trim() || `${baseName}-watermarked.pdf`;
    if (!outputFilename.toLowerCase().endsWith('.pdf')) {
      outputFilename = `${outputFilename}.pdf`;
    }

    const currentPage = parseInt(req.body.currentPage || '1', 10);

    if (job) {
      job.status = 'processing';
      job.progress = 50;
      job.currentStep = 'Rendering PDF';
    }

    const result = await applyWatermarksToPdf({
      buffer: sourceBuffer,
      watermarks,
      currentPage,
    });

    if (!jobId) {
      jobId = 'wm_' + crypto.randomBytes(8).toString('hex');
      job = {
        id: jobId,
        createdAt: Date.now(),
        originalName,
        originalSize: sourceBuffer.length,
        originalBuffer: sourceBuffer,
        originalPageCount: result.pageCount,
        status: 'completed',
        progress: 100,
        resultBuffer: result.buffer,
        outputName: outputFilename,
        outputSize: result.fileSize,
        watermarkedPagesCount: result.watermarkedPageCount,
      };
      jobsMap.set(jobId, job);
    } else if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.resultBuffer = result.buffer;
      job.outputName = outputFilename;
      job.outputSize = result.fileSize;
      job.watermarkedPagesCount = result.watermarkedPageCount;
    }

    const acceptHeader = req.headers.accept || '';
    const wantsBinary =
      req.query.binary === 'true' || acceptHeader.includes('application/pdf');

    if (wantsBinary) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(outputFilename)}"`
      );
      res.setHeader('Content-Length', result.buffer.length.toString());
      res.setHeader('X-Original-Pages', result.pageCount.toString());
      res.setHeader('X-Watermarked-Pages', result.watermarkedPageCount.toString());
      res.setHeader('X-File-Size', result.fileSize.toString());
      return res.status(200).send(result.buffer);
    }

    return res.status(200).json({
      success: true,
      jobId,
      filename: outputFilename,
      downloadUrl: `/api/watermark-pdf/download/${jobId}?filename=${encodeURIComponent(outputFilename)}`,
      fileSize: result.fileSize,
      originalPageCount: result.pageCount,
      watermarkedPageCount: result.watermarkedPageCount,
    });
  } catch (error: any) {
    console.error('Watermark PDF apply error:', error);
    return res.status(400).json({
      error: error.message || 'Failed to apply watermark to PDF.',
    });
  }
});

/**
 * GET /api/watermark-pdf/status/:jobId
 */
router.get('/status/:jobId', (req, res) => {
  const job = jobsMap.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired.' });
  }

  return res.status(200).json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    step: job.currentStep,
    originalName: job.originalName,
    originalPageCount: job.originalPageCount,
    outputName: job.outputName,
    outputSize: job.outputSize,
    watermarkedPagesCount: job.watermarkedPagesCount,
    error: job.error,
  });
});

/**
 * GET /api/watermark-pdf/download/:jobId
 */
router.get('/download/:jobId', (req, res) => {
  const job = jobsMap.get(req.params.jobId);
  if (!job || !job.resultBuffer) {
    return res.status(404).json({ error: 'Watermarked PDF not found or expired.' });
  }

  const customFilename =
    (req.query.filename as string)?.trim() ||
    job.outputName ||
    'watermarked-document.pdf';
  const safeFilename = customFilename.toLowerCase().endsWith('.pdf')
    ? customFilename
    : `${customFilename}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(safeFilename)}"`
  );
  res.setHeader('Content-Length', job.resultBuffer.length.toString());
  res.setHeader('X-Original-Pages', job.originalPageCount.toString());
  res.setHeader(
    'X-Watermarked-Pages',
    (job.watermarkedPagesCount ?? job.originalPageCount).toString()
  );
  res.setHeader('X-File-Size', job.resultBuffer.length.toString());

  return res.status(200).send(job.resultBuffer);
});

/**
 * DELETE /api/watermark-pdf/job/:jobId
 */
router.delete('/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const existed = jobsMap.delete(jobId);
  return res.status(200).json({ success: existed, message: 'Job cleared.' });
});

export default router;
