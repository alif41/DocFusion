import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import {
  analyzePdfDocument,
  reorderPdfDocument,
} from '../services/organizePdf';

interface OrganizeJob {
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
  pageOrder?: number[];
  error?: string;
}

const router = express.Router();

// Multer memory storage (50MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error(`File "${file.originalname}" is not a valid PDF.`));
    }
  },
});

// Ephemeral in-memory job cache (cleared after 30 minutes)
const jobsMap = new Map<string, OrganizeJob>();

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
 * POST /api/organize-pdf/upload
 * Upload and analyze single PDF document
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

    const analysis = await analyzePdfDocument(file.buffer);

    const jobId = 'org_' + crypto.randomBytes(8).toString('hex');
    const job: OrganizeJob = {
      id: jobId,
      createdAt: Date.now(),
      originalName: file.originalname,
      originalSize: file.size,
      originalBuffer: file.buffer,
      originalPageCount: analysis.pageCount,
      status: 'idle',
      progress: 0,
    };

    jobsMap.set(jobId, job);

    return res.status(200).json({
      jobId,
      originalName: file.originalname,
      pageCount: analysis.pageCount,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Organize PDF upload error:', error);
    return res.status(400).json({
      error: error.message || 'Failed to process PDF. File may be damaged or encrypted.',
    });
  }
});

/**
 * POST /api/organize-pdf/reorder
 * Accepts either:
 *  - JSON body { jobId, pageOrder, filename }
 *  - OR multipart form with 'file' + 'pageOrder' JSON string + 'filename'
 */
router.post('/reorder', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
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
    let job: OrganizeJob | undefined;

    // Check if uploaded file was provided
    if (req.file) {
      sourceBuffer = req.file.buffer;
      originalName = req.file.originalname;
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

    // Parse pageOrder
    let pageOrder: number[];
    if (typeof req.body.pageOrder === 'string') {
      try {
        pageOrder = JSON.parse(req.body.pageOrder);
      } catch {
        return res.status(400).json({ error: 'Invalid pageOrder JSON format.' });
      }
    } else if (Array.isArray(req.body.pageOrder)) {
      pageOrder = req.body.pageOrder;
    } else {
      return res.status(400).json({ error: 'Missing or invalid pageOrder array.' });
    }

    // Compute safe output filename
    const baseName = originalName.replace(/\.pdf$/i, '');
    let outputFilename = (req.body.filename as string)?.trim() || `${baseName}-organized.pdf`;
    if (!outputFilename.toLowerCase().endsWith('.pdf')) {
      outputFilename = `${outputFilename}.pdf`;
    }

    if (job) {
      job.status = 'processing';
      job.progress = 50;
      job.currentStep = 'Rebuilding PDF';
    }

    // Perform reordering using pdf-lib
    const result = await reorderPdfDocument(sourceBuffer, pageOrder);

    // If job exists, update state
    if (!jobId) {
      jobId = 'org_' + crypto.randomBytes(8).toString('hex');
      job = {
        id: jobId,
        createdAt: Date.now(),
        originalName,
        originalSize: sourceBuffer.length,
        originalBuffer: sourceBuffer,
        originalPageCount: result.originalPageCount,
        status: 'completed',
        progress: 100,
        resultBuffer: result.buffer,
        outputName: outputFilename,
        outputSize: result.size,
        pageOrder,
      };
      jobsMap.set(jobId, job);
    } else if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.resultBuffer = result.buffer;
      job.outputName = outputFilename;
      job.outputSize = result.size;
      job.pageOrder = pageOrder;
    }

    // Check if client requested direct binary stream or JSON metadata
    const acceptHeader = req.headers.accept || '';
    const wantsBinary = req.query.binary === 'true' || acceptHeader.includes('application/pdf');

    if (wantsBinary) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(outputFilename)}"`);
      res.setHeader('Content-Length', result.buffer.length.toString());
      res.setHeader('X-Original-Pages', result.originalPageCount.toString());
      res.setHeader('X-Output-Pages', result.pageCount.toString());
      res.setHeader('X-File-Size', result.size.toString());
      return res.status(200).send(result.buffer);
    }

    return res.status(200).json({
      success: true,
      jobId,
      filename: outputFilename,
      downloadUrl: `/api/organize-pdf/download/${jobId}?filename=${encodeURIComponent(outputFilename)}`,
      fileSize: result.size,
      originalPageCount: result.originalPageCount,
      newPageCount: result.pageCount,
      pageOrder,
    });
  } catch (error: any) {
    console.error('Organize PDF reorder error:', error);
    return res.status(400).json({
      error: error.message || 'Failed to reorder PDF pages.',
    });
  }
});

/**
 * GET /api/organize-pdf/status/:jobId
 * Status of current job
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
    error: job.error,
  });
});

/**
 * GET /api/organize-pdf/download/:jobId
 * Download generated organized PDF
 */
router.get('/download/:jobId', (req, res) => {
  const job = jobsMap.get(req.params.jobId);
  if (!job || !job.resultBuffer) {
    return res.status(404).json({ error: 'Organized PDF document not found or expired.' });
  }

  const customFilename =
    (req.query.filename as string)?.trim() || job.outputName || 'organized-document.pdf';
  const safeFilename = customFilename.toLowerCase().endsWith('.pdf')
    ? customFilename
    : `${customFilename}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
  res.setHeader('Content-Length', job.resultBuffer.length.toString());
  res.setHeader('X-Original-Pages', job.originalPageCount.toString());
  res.setHeader('X-Output-Pages', (job.pageOrder?.length || job.originalPageCount).toString());
  res.setHeader('X-File-Size', job.resultBuffer.length.toString());

  return res.status(200).send(job.resultBuffer);
});

/**
 * DELETE /api/organize-pdf/job/:jobId
 * Explicit session cleanup
 */
router.delete('/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const existed = jobsMap.delete(jobId);
  return res.status(200).json({ success: existed, message: 'Job cleared.' });
});

export default router;
