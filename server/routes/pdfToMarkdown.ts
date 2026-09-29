import { Router, Request, Response } from 'express';
import multer from 'multer';
import JSZip from 'jszip';
import { convertPdfToMarkdown } from '../services/pdfToMarkdown';
import { PdfToMarkdownOptions } from '../services/pdfToMarkdown/types';

const router = Router();

// Multer memory storage (50MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Uploaded file is not a valid PDF document.'));
    }
  },
});

/**
 * POST /api/pdf-to-markdown/convert
 * Converts uploaded PDF into clean Markdown with layout detection and optional OCR
 */
router.post('/convert', (req: Request, res: Response) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds maximum allowable limit of 50MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'Invalid upload.' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No PDF file provided.' });
    }

    try {
      const options: PdfToMarkdownOptions = {
        pageRange: req.body.pageRange || 'all',
        ocrStrategy: (req.body.ocrStrategy as any) || 'auto',
        ocrLanguage: req.body.ocrLanguage || 'eng',
        imageMode: (req.body.imageMode as any) || 'extract_folder',
        includeFrontmatter: req.body.includeFrontmatter !== 'false' && req.body.includeFrontmatter !== false,
        detectTables: req.body.detectTables !== 'false' && req.body.detectTables !== false,
        detectCodeBlocks: req.body.detectCodeBlocks !== 'false' && req.body.detectCodeBlocks !== false,
        cleanPageArtifacts: req.body.cleanPageArtifacts !== 'false' && req.body.cleanPageArtifacts !== false,
      };

      const result = await convertPdfToMarkdown(
        req.file.buffer,
        req.file.originalname,
        options
      );

      return res.status(200).json(result);
    } catch (conversionError: any) {
      console.error('PDF to Markdown conversion error:', conversionError);
      return res.status(500).json({
        error: conversionError.message || 'Failed to convert PDF document to Markdown.',
      });
    }
  });
});

/**
 * POST /api/pdf-to-markdown/export-zip
 * Bundles Markdown text + extracted images into a downloadable ZIP archive
 */
router.post('/export-zip', async (req: Request, res: Response) => {
  try {
    const { markdown, images, filename = 'document.md' } = req.body;

    if (!markdown && typeof markdown !== 'string') {
      return res.status(400).json({ error: 'Markdown content is required to generate export bundle.' });
    }

    const zip = new JSZip();
    const mdName = filename.endsWith('.md') ? filename : `${filename}.md`;

    // 1. Add Markdown file
    zip.file(mdName, markdown);

    // 2. Add images in images/ subfolder
    if (Array.isArray(images) && images.length > 0) {
      const imgFolder = zip.folder('images');
      for (const img of images) {
        if (img.dataUrl && typeof img.dataUrl === 'string') {
          // Extract base64 payload from data URL
          const base64Data = img.dataUrl.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          imgFolder?.file(img.name, imgBuffer);
        }
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const zipBaseName = mdName.replace(/\.md$/i, '');
    const downloadZipName = `${zipBaseName}-markdown.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadZipName)}"`);
    res.setHeader('Content-Length', zipBuffer.length.toString());

    return res.status(200).send(zipBuffer);
  } catch (zipError: any) {
    console.error('Error generating markdown ZIP package:', zipError);
    return res.status(500).json({ error: 'Failed to create export ZIP archive.' });
  }
});

export default router;
