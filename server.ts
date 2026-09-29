import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import { createServer as createViteServer } from 'vite';
import { executeConversion } from './server/services';
import photoConvertRouter from './server/routes/photoConvert';
import htmlToPdfRouter from './server/routes/htmlToPdf';
import organizePdfRouter from './server/routes/organizePdf';
import watermarkPdfRouter from './server/routes/watermarkPdf';
import pdfToMarkdownRouter from './server/routes/pdfToMarkdown';
import aiDocumentAssistantRouter from './server/routes/aiDocumentAssistant';
import photoResizeRouter from './server/routes/photoResize';

const execFileAsync = promisify(execFile);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Multer config for handling PDF uploads in memory (clean & ephemeral)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB per file limit
      files: 40,                  // up to 40 PDFs at once
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

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'docfusion-pdf-engine', version: '1.0.0' });
  });

  // Server-side PDF Merge Endpoint
  app.post('/api/pdf/merge', (req, res, next) => {
    upload.array('files', 40)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'One or more files exceed the maximum allowable size of 50MB.',
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              error: 'Maximum of 40 files can be merged in a single batch.',
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
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || !Array.isArray(files) || files.length < 2) {
        return res.status(400).json({
          error: 'Please provide at least 2 PDF files to merge.',
        });
      }

      const outputName =
        (req.body.filename as string)?.trim() || 'docfusion-merged.pdf';
      const safeOutputName = outputName.toLowerCase().endsWith('.pdf')
        ? outputName
        : `${outputName}.pdf`;

      // Create new master PDF document
      const mergedPdf = await PDFDocument.create();
      let totalPages = 0;
      const fileReport: Array<{ name: string; pages: number; size: number }> = [];

      // Sequentially process files to strictly preserve client order
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
        if (
          file.buffer.length < 5 ||
          file.buffer[0] !== 0x25 ||
          file.buffer[1] !== 0x50 ||
          file.buffer[2] !== 0x44 ||
          file.buffer[3] !== 0x46 ||
          file.buffer[4] !== 0x2d
        ) {
          return res.status(400).json({
            error: `File #${i + 1} ("${file.originalname}") is corrupted or not a recognized PDF.`,
          });
        }

        try {
          // Load document, ignoring minor syntax encryption flags if possible
          const sourcePdf = await PDFDocument.load(file.buffer, {
            ignoreEncryption: true,
          });

          const pageIndices = sourcePdf.getPageIndices();
          const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);

          for (const copiedPage of copiedPages) {
            mergedPdf.addPage(copiedPage);
          }

          totalPages += copiedPages.length;
          fileReport.push({
            name: file.originalname,
            pages: copiedPages.length,
            size: file.size,
          });
        } catch (loadErr: any) {
          console.error(`Failed to parse PDF #${i + 1} ("${file.originalname}"):`, loadErr);
          return res.status(400).json({
            error: `Failed to process "${file.originalname}". The document might be password-protected, encrypted, or corrupted.`,
          });
        }
      }

      if (totalPages === 0) {
        return res.status(400).json({
          error: 'The provided documents contained zero readable pages.',
        });
      }

      // Serialize merged document to bytes
      const mergedBytes = await mergedPdf.save();
      const outputBuffer = Buffer.from(mergedBytes);

      // Expose custom metadata headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(safeOutputName)}"`
      );
      res.setHeader('X-Total-Pages', totalPages.toString());
      res.setHeader('X-Total-Size', outputBuffer.length.toString());
      res.setHeader('X-Merged-Filename', encodeURIComponent(safeOutputName));
      res.setHeader('X-Files-Merged', files.length.toString());
      res.setHeader(
        'Access-Control-Expose-Headers',
        'X-Total-Pages, X-Total-Size, X-Merged-Filename, X-Files-Merged, Content-Disposition'
      );

      // Return generated merged PDF binary
      return res.status(200).send(outputBuffer);
    } catch (error: any) {
      console.error('Server PDF Merge processing error:', error);
      return res.status(500).json({
        error:
          error.message ||
          'Internal server error while processing and merging PDF documents.',
      });
    }
  });

  // Server-side PDF Compression Endpoint (Ghostscript + Structural Optimizer)
  app.post('/api/pdf/compress', upload.single('file'), async (req, res) => {
    let tempInPath: string | null = null;
    let tempOutPath: string | null = null;

    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No PDF file was provided for compression.' });
      }

      // Validate PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
      if (
        file.buffer.length < 5 ||
        file.buffer[0] !== 0x25 ||
        file.buffer[1] !== 0x50 ||
        file.buffer[2] !== 0x44 ||
        file.buffer[3] !== 0x46 ||
        file.buffer[4] !== 0x2d
      ) {
        return res.status(400).json({
          error: 'The uploaded file is not a valid PDF document.',
        });
      }

      const originalSize = file.size;
      const preset = (req.body.preset as string) || 'recommended';
      const dpi = req.body.dpi ? parseInt(req.body.dpi, 10) : 135;

      const tempId = `docfusion_cmp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      tempInPath = path.join(os.tmpdir(), `${tempId}_in.pdf`);
      tempOutPath = path.join(os.tmpdir(), `${tempId}_out.pdf`);

      await fs.promises.writeFile(tempInPath, file.buffer);

      let gsArgs: string[] = [];

      if (preset === 'extreme') {
        gsArgs = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/screen',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          '-dDetectDuplicateImages=true',
          '-dCompressFonts=true',
          '-dSubsetFonts=true',
          '-dDownsampleColorImages=true',
          '-dColorImageResolution=72',
          '-dColorImageDownsampleType=/Bicubic',
          '-dDownsampleGrayImages=true',
          '-dGrayImageResolution=72',
          '-dDownsampleMonoImages=true',
          '-dMonoImageResolution=150',
          '-dFastWebView=true',
          `-sOutputFile=${tempOutPath}`,
          tempInPath,
        ];
      } else if (preset === 'less') {
        gsArgs = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/printer',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          '-dDetectDuplicateImages=true',
          '-dCompressFonts=true',
          '-dSubsetFonts=true',
          '-dFastWebView=true',
          `-sOutputFile=${tempOutPath}`,
          tempInPath,
        ];
      } else if (preset === 'structural') {
        gsArgs = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/default',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          '-dDownsampleColorImages=false',
          '-dDownsampleGrayImages=false',
          '-dDownsampleMonoImages=false',
          '-dDetectDuplicateImages=true',
          '-dCompressFonts=true',
          '-dSubsetFonts=true',
          '-dFastWebView=true',
          `-sOutputFile=${tempOutPath}`,
          tempInPath,
        ];
      } else if (preset === 'custom') {
        const targetDpi = Math.max(72, Math.min(300, isNaN(dpi) ? 135 : dpi));
        gsArgs = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          '-dDownsampleColorImages=true',
          `-dColorImageResolution=${targetDpi}`,
          '-dColorImageDownsampleType=/Bicubic',
          '-dDownsampleGrayImages=true',
          `-dGrayImageResolution=${targetDpi}`,
          '-dDownsampleMonoImages=true',
          `-dMonoImageResolution=${Math.max(150, targetDpi)}`,
          '-dDetectDuplicateImages=true',
          '-dCompressFonts=true',
          '-dSubsetFonts=true',
          '-dFastWebView=true',
          `-sOutputFile=${tempOutPath}`,
          tempInPath,
        ];
      } else {
        // default 'recommended'
        gsArgs = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/ebook',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          '-dDetectDuplicateImages=true',
          '-dCompressFonts=true',
          '-dSubsetFonts=true',
          '-dDownsampleColorImages=true',
          '-dColorImageResolution=130',
          '-dColorImageDownsampleType=/Bicubic',
          '-dDownsampleGrayImages=true',
          '-dGrayImageResolution=130',
          '-dDownsampleMonoImages=true',
          '-dMonoImageResolution=200',
          '-dFastWebView=true',
          `-sOutputFile=${tempOutPath}`,
          tempInPath,
        ];
      }

      let gsSuccess = false;
      try {
        await execFileAsync('gs', gsArgs);
        if (fs.existsSync(tempOutPath)) {
          gsSuccess = true;
        }
      } catch (gsErr) {
        console.warn('Ghostscript compression notice:', gsErr);
      }

      let finalBuffer: Buffer = file.buffer;
      let finalSize = originalSize;
      let alreadyOptimized = false;

      if (gsSuccess && tempOutPath) {
        const gsBuffer = await fs.promises.readFile(tempOutPath);
        if (gsBuffer.length < originalSize) {
          finalBuffer = gsBuffer;
          finalSize = gsBuffer.length;
        } else if (preset !== 'extreme') {
          // If ebook/printer was larger than original (e.g. on already compressed files),
          // test screen mode to see if downsampling yields actual savings
          try {
            await execFileAsync('gs', [
              '-sDEVICE=pdfwrite',
              '-dCompatibilityLevel=1.4',
              '-dPDFSETTINGS=/screen',
              '-dNOPAUSE',
              '-dQUIET',
              '-dBATCH',
              `-sOutputFile=${tempOutPath}`,
              tempInPath,
            ]);
            const screenBuffer = await fs.promises.readFile(tempOutPath);
            if (screenBuffer.length < originalSize) {
              finalBuffer = screenBuffer;
              finalSize = screenBuffer.length;
            }
          } catch {
            // Keep current buffer
          }
        }
      }

      // Secondary pass: if finalSize is still >= originalSize, try pdf-lib stream & metadata optimization
      if (finalSize >= originalSize) {
        try {
          const sourcePdf = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
          const cleanPdf = await PDFDocument.create();
          cleanPdf.setTitle('');
          cleanPdf.setAuthor('');
          cleanPdf.setProducer('DocFusion Optimizer');
          cleanPdf.setCreator('');
          const pages = await cleanPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
          pages.forEach((p) => cleanPdf.addPage(p));
          const optBytes = await cleanPdf.save({ useObjectStreams: true, addDefaultPage: false });
          if (optBytes.length < originalSize) {
            finalBuffer = Buffer.from(optBytes);
            finalSize = optBytes.length;
          }
        } catch (pdfLibErr) {
          console.warn('pdf-lib optimization pass notice:', pdfLibErr);
        }
      }

      // STRICT INVARIANT: The output MUST NEVER be larger than the original input!
      // If even after all optimization passes the file was already maximally compacted:
      if (finalSize >= originalSize) {
        finalBuffer = file.buffer;
        finalSize = originalSize;
        alreadyOptimized = true;
      }

      const savedBytes = Math.max(0, originalSize - finalSize);
      const savingsPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

      // Extract page count
      let totalPages = 1;
      try {
        const inspectDoc = await PDFDocument.load(finalBuffer, { ignoreEncryption: true });
        totalPages = inspectDoc.getPageCount();
      } catch {
        // keep 1
      }

      const baseName = file.originalname.replace(/\.pdf$/i, '');
      const outFilename = `${baseName}_compressed.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(outFilename)}"`
      );
      res.setHeader('X-Original-Size', originalSize.toString());
      res.setHeader('X-Compressed-Size', finalSize.toString());
      res.setHeader('X-Saved-Bytes', savedBytes.toString());
      res.setHeader('X-Savings-Percent', savingsPercent.toString());
      res.setHeader('X-Already-Optimized', alreadyOptimized ? 'true' : 'false');
      res.setHeader('X-Total-Pages', totalPages.toString());
      res.setHeader(
        'Access-Control-Expose-Headers',
        'X-Original-Size, X-Compressed-Size, X-Saved-Bytes, X-Savings-Percent, X-Already-Optimized, X-Total-Pages, Content-Disposition'
      );

      return res.status(200).send(finalBuffer);
    } catch (error: any) {
      console.error('Server PDF Compression error:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error while compressing PDF document.',
      });
    } finally {
      // Clean up temporary files
      try {
        if (tempInPath && fs.existsSync(tempInPath)) await fs.promises.unlink(tempInPath);
        if (tempOutPath && fs.existsSync(tempOutPath)) await fs.promises.unlink(tempOutPath);
      } catch {
        // ignore cleanup error
      }
    }
  });

  // Universal Document Converter Multer Upload Middleware (supports PDF, Word, PowerPoint, Excel)
  const convertUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 1,
    },
    fileFilter: (_req, file, cb) => {
      const allowedExts = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("This file type isn't supported for this conversion."));
      }
    },
  });

  // Universal Conversion Handler Function
  const handleUniversalConversion = async (req: express.Request, res: express.Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          error: 'Please upload a document to convert.',
        });
      }

      // Determine conversion type from param or route
      let conversionType = (req.params.conversionType || req.body.conversionType || '').toLowerCase();
      if (!conversionType) {
        const urlPart = req.path.replace('/api/convert/', '').toLowerCase();
        if (urlPart) conversionType = urlPart;
      }

      const validConversions = [
        'pdf-to-word',
        'pdf-to-powerpoint',
        'pdf-to-excel',
        'word-to-pdf',
        'powerpoint-to-pdf',
        'excel-to-pdf',
      ];

      if (!validConversions.includes(conversionType)) {
        return res.status(400).json({
          error: `Invalid or unsupported conversion type: "${conversionType}".`,
        });
      }

      const ext = path.extname(file.originalname).toLowerCase();

      // Validate file format matches requested conversion
      if (
        (conversionType === 'pdf-to-word' ||
          conversionType === 'pdf-to-powerpoint' ||
          conversionType === 'pdf-to-excel') &&
        ext !== '.pdf'
      ) {
        return res.status(400).json({
          error: "This file type isn't supported for this conversion. Please upload a PDF document.",
        });
      }

      if (conversionType === 'word-to-pdf' && ext !== '.docx' && ext !== '.doc') {
        return res.status(400).json({
          error: "This file type isn't supported for this conversion. Please upload a Word document (.docx or .doc).",
        });
      }

      if (conversionType === 'powerpoint-to-pdf' && ext !== '.pptx' && ext !== '.ppt') {
        return res.status(400).json({
          error: "This file type isn't supported for this conversion. Please upload a PowerPoint presentation (.pptx or .ppt).",
        });
      }

      if (conversionType === 'excel-to-pdf' && ext !== '.xlsx' && ext !== '.xls') {
        return res.status(400).json({
          error: "This file type isn't supported for this conversion. Please upload an Excel spreadsheet (.xlsx or .xls).",
        });
      }

      // Basic file integrity check
      if (file.buffer.length < 10) {
        return res.status(400).json({
          error: "We couldn't read this document. Please upload a valid file.",
        });
      }

      // Execute conversion
      const result = await executeConversion(conversionType, file.buffer, file.originalname);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(result.filename)}"`
      );
      res.setHeader('X-Original-Filename', encodeURIComponent(file.originalname));
      res.setHeader('X-Converted-Filename', encodeURIComponent(result.filename));
      res.setHeader('X-Original-Size', file.size.toString());
      res.setHeader('X-Output-Size', result.buffer.length.toString());
      res.setHeader('X-Conversion-Type', conversionType);
      if (result.pageCount) {
        res.setHeader('X-Page-Count', result.pageCount.toString());
      }
      if (result.warning) {
        res.setHeader('X-Conversion-Warning', encodeURIComponent(result.warning));
      }
      res.setHeader(
        'Access-Control-Expose-Headers',
        'X-Original-Filename, X-Converted-Filename, X-Original-Size, X-Output-Size, X-Conversion-Type, X-Page-Count, X-Conversion-Warning, Content-Disposition, Content-Type'
      );

      return res.status(200).send(result.buffer);
    } catch (error: any) {
      console.error('Universal Converter server execution error:', error);
      return res.status(500).json({
        error:
          "We couldn't convert this document due to complex or proprietary structures. Please verify the file integrity or try another document.",
      });
    }
  };

  // Dedicated route endpoints
  const convertUploadMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    convertUpload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'Uploaded file exceeds the maximum allowable size of 50MB.',
            });
          }
          return res.status(400).json({ error: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ error: err.message || "This file type isn't supported for this conversion." });
      }
      next();
    });
  };

  app.post('/api/convert/pdf-to-word', convertUploadMiddleware, handleUniversalConversion);
  app.post('/api/convert/pdf-to-powerpoint', convertUploadMiddleware, handleUniversalConversion);
  app.post('/api/convert/pdf-to-excel', convertUploadMiddleware, handleUniversalConversion);
  app.post('/api/convert/word-to-pdf', convertUploadMiddleware, handleUniversalConversion);
  app.post('/api/convert/powerpoint-to-pdf', convertUploadMiddleware, handleUniversalConversion);
  app.post('/api/convert/excel-to-pdf', convertUploadMiddleware, handleUniversalConversion);
  app.post('/api/convert/:conversionType', convertUploadMiddleware, handleUniversalConversion);

  // Universal Photo Converter API
  app.use('/api/photo-convert', photoConvertRouter);

  // Universal HTML to PDF Converter API
  app.use('/api/html-to-pdf', htmlToPdfRouter);

  // Organize PDF API
  app.use('/api/organize-pdf', organizePdfRouter);

  // Watermark PDF API
  app.use('/api/watermark-pdf', watermarkPdfRouter);

  // PDF to Markdown API
  app.use('/api/pdf-to-markdown', pdfToMarkdownRouter);

  // AI Document Assistant API (Google Gemini)
  app.use('/api/ai-document-assistant', aiDocumentAssistantRouter);

  // Photo Resize API
  app.use('/api/photo-resize', photoResizeRouter);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DocFusion full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
