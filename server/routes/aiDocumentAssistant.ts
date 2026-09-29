import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseDocumentBuffer } from '../services/aiDocumentAssistant/docParser';
import { sessionStore } from '../services/aiDocumentAssistant/sessionStore';
import {
  generateDocumentOverview,
  chatWithDocument,
  chatGeneral,
  executeQuickAction,
} from '../services/aiDocumentAssistant/geminiClient';
import { DocumentAnalysis, QuickActionType } from '../services/aiDocumentAssistant/types';

const router = Router();

// Memory upload handling up to 45MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 45 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    const isAllowed =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'text/markdown' ||
      lower.endsWith('.pdf') ||
      lower.endsWith('.docx') ||
      lower.endsWith('.txt') ||
      lower.endsWith('.md');

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Please upload a PDF, Word document (.docx), or Text file (.txt, .md).'));
    }
  },
});

/**
 * POST /api/ai-document-assistant/upload
 * Ingests a document, extracts text, generates initial overview & suggestions, creates session
 */
router.post('/upload', (req: Request, res: Response) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 45MB limit.' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No document file provided.' });
    }

    try {
      const { buffer, originalname, mimetype, size } = req.file;

      // 1. Parse document into structured pages
      const parsed = await parseDocumentBuffer(buffer, originalname, mimetype);

      if (!parsed.pages || parsed.pages.length === 0 || parsed.totalWords < 5) {
        return res.status(400).json({
          error:
            'Could not extract readable text from this document. It might be scanned or image-only without OCR, or password-protected.',
        });
      }

      // 2. Generate initial synopsis & suggested questions
      const overview = await generateDocumentOverview(originalname, parsed.pages);

      // 3. Store ephemeral session
      const sessionId = `doc_ai_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const analysis: DocumentAnalysis = {
        id: sessionId,
        filename: originalname,
        fileType: parsed.fileType,
        fileSize: size,
        totalPages: parsed.pages.length,
        totalWords: parsed.totalWords,
        totalChars: parsed.totalChars,
        synopsis: overview.synopsis,
        keyTopics: overview.keyTopics,
        suggestedQuestions: overview.suggestedQuestions,
        pages: parsed.pages,
        uploadedAt: Date.now(),
      };

      sessionStore.set(sessionId, analysis);

      // Return analysis without huge page buffers (send page summary)
      return res.status(200).json({
        sessionId,
        filename: analysis.filename,
        fileType: analysis.fileType,
        fileSize: analysis.fileSize,
        totalPages: analysis.totalPages,
        totalWords: analysis.totalWords,
        synopsis: analysis.synopsis,
        keyTopics: analysis.keyTopics,
        suggestedQuestions: analysis.suggestedQuestions,
        pages: analysis.pages.map((p) => ({
          pageNumber: p.pageNumber,
          wordCount: p.wordCount,
          charCount: p.charCount,
          preview: p.text.slice(0, 160),
        })),
      });
    } catch (parseErr: any) {
      console.error('AI Document Assistant upload error:', parseErr);
      return res.status(500).json({
        error: parseErr.message || 'Failed to analyze and index the uploaded document.',
      });
    }
  });
});

/**
 * POST /api/ai-document-assistant/chat
 * Multi-turn chat strictly grounded in document context with page references
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { sessionId, message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'User message cannot be empty.' });
    }

    // If session ID is provided, ground the chat in the document
    if (sessionId && typeof sessionId === 'string') {
      const analysis = sessionStore.get(sessionId);
      if (analysis) {
        const result = await chatWithDocument(analysis, message.trim(), Array.isArray(history) ? history : []);
        return res.status(200).json(result);
      }
    }

    // General chat if no document attached or session expired
    const generalResult = await chatGeneral(message.trim(), Array.isArray(history) ? history : []);
    return res.status(200).json(generalResult);
  } catch (chatErr: any) {
    console.error('AI Document Assistant chat error:', chatErr);
    return res.status(500).json({
      error: chatErr.message || 'Gemini could not generate an answer for this query.',
    });
  }
});

/**
 * POST /api/ai-document-assistant/action
 * Executes pre-packaged quick actions: summarize, explain, extract, faqs
 */
router.post('/action', async (req: Request, res: Response) => {
  try {
    const { sessionId, action } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Session ID is required.' });
    }

    const validActions: QuickActionType[] = ['summarize', 'explain', 'extract', 'faqs'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        error: `Invalid action "${action}". Allowed: ${validActions.join(', ')}`,
      });
    }

    const analysis = sessionStore.get(sessionId);
    if (!analysis) {
      return res.status(404).json({
        error: 'Document session expired or not found. Please re-upload your document.',
      });
    }

    const result = await executeQuickAction(analysis, action as QuickActionType);
    return res.status(200).json(result);
  } catch (actionErr: any) {
    console.error('AI Document Assistant action error:', actionErr);
    return res.status(500).json({
      error: actionErr.message || 'Failed to execute quick action on document.',
    });
  }
});

/**
 * GET /api/ai-document-assistant/sample
 * Pre-loads a rich enterprise document sample so users can test instantly with 1 click
 */
router.get('/sample', async (_req: Request, res: Response) => {
  try {
    const sampleFilename = 'DocFusion_Enterprise_SLA_and_Security_Specification.md';
    const samplePages = [
      {
        pageNumber: 1,
        text: `# DocFusion Enterprise Cloud Service Level Agreement & Architecture
Document Reference: DF-SLA-2026-V4
Effective Date: October 1, 2026
Parties: DocFusion Technologies Inc. ("Provider") and Authorized Enterprise Customer ("Subscriber")

## 1. Executive Summary & Purpose
This Service Level Agreement ("SLA") defines the operational performance metrics, data privacy commitments, and technical specifications governing the DocFusion Document Intelligence and PDF Processing Platform. The platform provides in-memory document transformations, vector conversions, client-side encryption, and Google Gemini document cognition services.

## 2. Platform Availability & Uptime Guarantee
- Standard Guaranteed Uptime: 99.95% monthly availability across all global endpoints (US-East, EU-Central, AP-Southeast).
- Enterprise Mission-Critical Tier: 99.99% monthly availability with multi-region failover.
- Permitted Maintenance Windows: Scheduled updates occur on Sundays between 02:00 UTC and 04:00 UTC with at least 72 hours prior notification.
- Financial Service Credits: If uptime drops below 99.90%, Subscriber receives a 10% credit; below 99.50%, a 25% credit; and below 99.00%, a 50% credit applied to the next billing cycle.`,
        charCount: 1180,
        wordCount: 175,
      },
      {
        pageNumber: 2,
        text: `## 3. Data Protection, Ephemeral Memory, and Security Controls
- Zero-Disk Ephemeral Architecture: Document processing operates in isolated volatile RAM (Linux tmpfs/cgroups). Document buffers are securely wiped and garbage-collected immediately upon completion of processing or stream termination.
- Cryptographic Standards: All data in transit is encrypted using TLS 1.3 with AES-256-GCM cipher suites. Client documents stored in user vaults utilize customer-managed keys (CMK) via Envelope Encryption.
- Compliance Certifications: DocFusion maintains verified annual compliance for SOC 2 Type II, ISO/IEC 27001:2022, HIPAA Security Rule, and EU GDPR Article 28 data processing guidelines.
- Sub-processors: AI reasoning is performed via private, enterprise Google Gemini APIs running in isolated VPC endpoints with zero customer prompt or document retention for foundation model training.

## 4. Incident Response Time Objectives (RTO / RPO)
- Severity 1 (Critical Outage): Initial response within 15 minutes; 24/7 dedicated incident commander; RTO 60 minutes; RPO 0 minutes.
- Severity 2 (Major Feature Degradation): Initial response within 60 minutes; RTO 4 hours; RPO 15 minutes.
- Severity 3 (Minor Defect): Initial response within 4 business hours; resolution in next maintenance release.`,
        charCount: 1250,
        wordCount: 185,
      },
      {
        pageNumber: 3,
        text: `## 5. Commercial Terms & Pricing Structure
- Enterprise Plan: $49 per user / month billed annually, including unlimited PDF conversions, OCR pipelines, and 500,000 AI Document Assistant tokens per seat per month.
- Dedicated Instance Add-on: $2,500/month flat fee for single-tenant VPC cluster isolation.
- Payment Terms: Net 30 days from invoice date via wire transfer or automated ACH.

## 6. Term, Termination, and Data Return
- Term: Initial 12-month commitment renewing automatically unless cancelled with 60 days written notice.
- Termination for Cause: Either party may terminate immediately if a material breach remains uncured for 30 consecutive calendar days.
- Data Deletion Certificate: Within 14 business days of termination, Provider will supply an audited Certificate of Destruction verifying complete zero-fill wiping of all tenant metadata and logs.

Signatures & Approvals:
Marcus Vance, Chief Information Security Officer, DocFusion Technologies Inc.
Elena Rostova, VP Global Procurement & Vendor Risk Management`,
        charCount: 1040,
        wordCount: 155,
      },
    ];

    const totalWords = samplePages.reduce((acc, p) => acc + p.wordCount, 0);
    const totalChars = samplePages.reduce((acc, p) => acc + p.charCount, 0);

    const sessionId = `doc_ai_sample_${Date.now()}`;
    const analysis: DocumentAnalysis = {
      id: sessionId,
      filename: sampleFilename,
      fileType: 'markdown',
      fileSize: 4200,
      totalPages: 3,
      totalWords,
      totalChars,
      synopsis:
        'Official DocFusion Enterprise SLA outlining the 99.99% uptime guarantee, zero-disk ephemeral RAM privacy model, 15-minute critical incident response, and SOC 2 / ISO 27001 compliance standards.',
      keyTopics: ['99.99% Uptime SLA', 'Ephemeral Memory Security', 'RTO/RPO Incident Response', 'Commercial Pricing & Net 30'],
      suggestedQuestions: [
        'What is the uptime guarantee and what service credits are offered if it is breached?',
        'How does the Zero-Disk Ephemeral architecture protect document privacy?',
        'What are the RTO and RPO targets for Severity 1 outages?',
        'What is the Enterprise pricing and what are the payment terms?',
      ],
      pages: samplePages,
      uploadedAt: Date.now(),
    };

    sessionStore.set(sessionId, analysis);

    return res.status(200).json({
      sessionId,
      filename: analysis.filename,
      fileType: analysis.fileType,
      fileSize: analysis.fileSize,
      totalPages: analysis.totalPages,
      totalWords: analysis.totalWords,
      synopsis: analysis.synopsis,
      keyTopics: analysis.keyTopics,
      suggestedQuestions: analysis.suggestedQuestions,
      pages: analysis.pages.map((p) => ({
        pageNumber: p.pageNumber,
        wordCount: p.wordCount,
        charCount: p.charCount,
        preview: p.text.slice(0, 160),
      })),
    });
  } catch (sampleErr: any) {
    console.error('AI Document Assistant sample error:', sampleErr);
    return res.status(500).json({ error: 'Failed to load sample document.' });
  }
});

/**
 * DELETE /api/ai-document-assistant/session/:id
 * Cleans up session from memory
 */
router.delete('/session/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = sessionStore.delete(id);
  return res.status(200).json({ success: deleted });
});

export default router;
