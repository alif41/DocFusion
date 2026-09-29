import express from 'express';
import multer from 'multer';
import JSZip from 'jszip';
import path from 'path';
import {
  DEFAULT_HTML_TO_PDF_CONFIG,
  HtmlConversionJob,
  HtmlToPdfConfig,
} from '../services/htmlToPdfServices/types';
import { sanitizeFileName, sanitizeHtml } from '../services/htmlToPdfServices/htmlSecurity';
import { extractAndBundleHtmlPackage } from '../services/htmlToPdfServices/packageExtractor';
import { createPdfFromPageImages, PageImageInput } from '../services/htmlToPdfServices/pdfGenerator';

const router = express.Router();

// Memory storage for uploads, up to 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 20,
  },
});

// Temporary in-memory job store (automatically pruned after 30 minutes)
const jobsMap = new Map<string, HtmlConversionJob>();

function pruneOldJobs() {
  const now = Date.now();
  for (const [id, job] of jobsMap.entries()) {
    if (now - job.createdAt > 30 * 60 * 1000) {
      jobsMap.delete(id);
    }
  }
}
setInterval(pruneOldJobs, 5 * 60 * 1000);

// Helper to parse config from request body
function parseConfigFromBody(body: any): HtmlToPdfConfig {
  let parsedConfig: HtmlToPdfConfig = { ...DEFAULT_HTML_TO_PDF_CONFIG };
  if (body.config) {
    try {
      const custom = typeof body.config === 'string' ? JSON.parse(body.config) : body.config;
      parsedConfig = { ...DEFAULT_HTML_TO_PDF_CONFIG, ...custom };
    } catch {
      // fallback
    }
  }
  return parsedConfig;
}

/**
 * POST /api/html-to-pdf/preview
 * Validates and sanitizes raw HTML, returning clean HTML and warnings.
 */
router.post('/preview', express.json({ limit: '10mb' }), (req, res) => {
  try {
    const rawHtml = req.body.html || '';
    if (!rawHtml || typeof rawHtml !== 'string') {
      return res.status(400).json({ error: 'No HTML code provided for preview.' });
    }

    const executeJs = !!req.body.executeJavaScript;
    const allowExternal = req.body.allowExternalResources !== false;

    const { html, warnings, title } = sanitizeHtml(rawHtml, {
      executeJavaScript: executeJs,
      allowExternalResources: allowExternal,
    });

    return res.json({
      success: true,
      html,
      warnings,
      title: title || 'Untitled Document',
    });
  } catch (error: any) {
    console.error('HTML Preview error:', error);
    return res.status(500).json({ error: error.message || 'Failed to preview HTML.' });
  }
});

/**
 * POST /api/html-to-pdf/upload-package
 * Accepts a ZIP package containing HTML, CSS, images, and fonts,
 * extracts safely, inlines assets, and returns bundled HTML.
 */
router.post('/upload-package', upload.single('package'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a valid ZIP archive (.zip).' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.zip') {
      return res.status(400).json({ error: 'Uploaded file must be a .zip package.' });
    }

    const { mainHtml, filename, filesCount, warnings } = await extractAndBundleHtmlPackage(
      req.file.buffer
    );

    const { html: sanitizedHtml, warnings: secWarnings, title } = sanitizeHtml(mainHtml, {
      executeJavaScript: false,
      allowExternalResources: true,
    });

    return res.json({
      success: true,
      html: sanitizedHtml,
      filename,
      title: title || path.basename(filename, '.pdf'),
      filesCount,
      warnings: [...warnings, ...secWarnings],
    });
  } catch (error: any) {
    console.error('Upload package error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process HTML package. Please check archive structure.',
    });
  }
});

/**
 * POST /api/html-to-pdf/convert
 * Converts HTML / page captures to a PDF document with custom headers/footers, margins, metadata.
 */
router.post('/convert', upload.any(), async (req, res) => {
  try {
    const config = parseConfigFromBody(req.body);
    const reqFiles = (req.files as Express.Multer.File[]) || [];
    let customFilename = req.body.filename ? sanitizeFileName(req.body.filename) : 'document.pdf';

    // 1. If pre-rendered page images were supplied by the client
    const pageImageFiles = reqFiles.filter((f) => f.fieldname.startsWith('page_image_') || f.fieldname === 'pageImage');

    if (pageImageFiles.length > 0) {
      // Sort in page order
      pageImageFiles.sort((a, b) => {
        const numA = parseInt(a.fieldname.replace('page_image_', ''), 10) || 0;
        const numB = parseInt(b.fieldname.replace('page_image_', ''), 10) || 0;
        return numA - numB;
      });

      const pagesInput: PageImageInput[] = pageImageFiles.map((f) => ({
        imageBuffer: f.buffer,
        mimeType: f.mimetype === 'image/jpeg' ? 'image/jpeg' : 'image/png',
        width: parseInt(req.body.pageWidth || '1200', 10),
        height: parseInt(req.body.pageHeight || '1600', 10),
      }));

      const { buffer, pagesCount } = await createPdfFromPageImages(pagesInput, config, {
        title: req.body.documentTitle || customFilename.replace('.pdf', ''),
        filename: customFilename,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(customFilename)}"`);
      res.setHeader('X-Converted-Filename', encodeURIComponent(customFilename));
      res.setHeader('X-Pages-Count', pagesCount.toString());
      res.setHeader('X-Output-Size', buffer.length.toString());
      res.setHeader(
        'Access-Control-Expose-Headers',
        'X-Converted-Filename, X-Pages-Count, X-Output-Size, Content-Disposition, Content-Type'
      );

      return res.status(200).send(buffer);
    }

    // 2. If raw HTML file was uploaded
    const htmlFile = reqFiles.find((f) => f.fieldname === 'file' || f.originalname?.match(/\.html?$/i));
    let rawHtml = req.body.html || '';

    if (htmlFile) {
      rawHtml = htmlFile.buffer.toString('utf-8');
      if (!req.body.filename) {
        customFilename = sanitizeFileName(htmlFile.originalname);
      }
    }

    if (!rawHtml || typeof rawHtml !== 'string') {
      return res.status(400).json({ error: 'No HTML content or document was provided for conversion.' });
    }

    const { html: cleanHtml, warnings, title } = sanitizeHtml(rawHtml, {
      executeJavaScript: config.executeJavaScript,
      allowExternalResources: config.allowExternalResources,
    });

    // In server environment where headless browser is prohibited or unavailable,
    // notify client to execute the DOM render capture pipeline, OR return clean compiled HTML package!
    return res.json({
      success: true,
      html: cleanHtml,
      filename: customFilename,
      title: title || customFilename.replace('.pdf', ''),
      warnings,
      readyForRender: true,
    });
  } catch (error: any) {
    console.error('HTML to PDF Convert Error:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred during PDF conversion.',
    });
  }
});

/**
 * POST /api/html-to-pdf/batch
 * Converts multiple HTML items into PDFs and bundles into a single ZIP file.
 */
router.post('/batch', upload.any(), async (req, res) => {
  try {
    const config = parseConfigFromBody(req.body);
    const reqFiles = (req.files as Express.Multer.File[]) || [];

    if (reqFiles.length === 0) {
      return res.status(400).json({ error: 'No files provided for batch conversion.' });
    }

    const zip = new JSZip();

    // Group files by document index (e.g. doc_0_page_0, doc_1_page_0)
    const docMap = new Map<string, { filename: string; pages: Express.Multer.File[] }>();

    for (const f of reqFiles) {
      const match = f.fieldname.match(/^doc_(\d+)_page_(\d+)$/);
      if (match) {
        const docIdx = match[1];
        if (!docMap.has(docIdx)) {
          const customName = req.body[`doc_${docIdx}_name`] || `document_${parseInt(docIdx, 10) + 1}.pdf`;
          docMap.set(docIdx, { filename: sanitizeFileName(customName), pages: [] });
        }
        docMap.get(docIdx)!.pages.push(f);
      }
    }

    if (docMap.size > 0) {
      // Pre-rendered pages supplied
      for (const [_docIdx, docInfo] of docMap.entries()) {
        const pagesInput: PageImageInput[] = docInfo.pages.map((p) => ({
          imageBuffer: p.buffer,
          mimeType: p.mimetype === 'image/jpeg' ? 'image/jpeg' : 'image/png',
          width: parseInt(req.body.pageWidth || '1200', 10),
          height: parseInt(req.body.pageHeight || '1600', 10),
        }));

        const { buffer } = await createPdfFromPageImages(pagesInput, config, {
          title: docInfo.filename.replace('.pdf', ''),
          filename: docInfo.filename,
        });

        zip.file(docInfo.filename, buffer);
      }
    } else {
      // Raw HTML files provided
      for (let i = 0; i < reqFiles.length; i++) {
        const f = reqFiles[i];
        if (f.originalname.match(/\.html?$/i)) {
          const rawHtml = f.buffer.toString('utf-8');
          const cleanName = sanitizeFileName(f.originalname);
          const { html: sanitized } = sanitizeHtml(rawHtml, {
            executeJavaScript: config.executeJavaScript,
            allowExternalResources: config.allowExternalResources,
          });

          // Store compiled HTML or fallback text
          zip.file(cleanName.replace('.pdf', '.html'), sanitized);
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const zipName = `html_to_pdf_batch_${Date.now()}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    res.setHeader('X-Converted-Filename', zipName);
    res.setHeader('X-Is-Zip', 'true');
    res.setHeader('X-Output-Size', zipBuffer.length.toString());
    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-Converted-Filename, X-Is-Zip, X-Output-Size, Content-Disposition, Content-Type'
    );

    return res.status(200).send(zipBuffer);
  } catch (error: any) {
    console.error('Batch HTML conversion error:', error);
    return res.status(500).json({ error: error.message || 'Batch conversion failed.' });
  }
});

/**
 * GET /api/html-to-pdf/status/:jobId
 */
router.get('/status/:jobId', (req, res) => {
  const job = jobsMap.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired.' });
  }
  return res.json({
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    filename: job.filename,
    pages: job.pages,
    size: job.size,
    warnings: job.warnings,
    error: job.error,
  });
});

/**
 * DELETE /api/html-to-pdf/job/:jobId
 */
router.delete('/job/:jobId', (req, res) => {
  const deleted = jobsMap.delete(req.params.jobId);
  return res.json({ success: deleted });
});

export default router;
