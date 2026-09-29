import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface DocumentTemplate {
  id: 'blank' | 'nda' | 'invoice' | 'certificate' | 'memo';
  title: string;
  description: string;
  badge: string;
  defaultFilename: string;
  iconName: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    title: 'Blank A4 Document',
    description: 'Clean blank canvas with standard margins, ready for typing, drawing, notes, and signing.',
    badge: 'Popular',
    defaultFilename: 'Untitled_Document.pdf',
    iconName: 'FileText',
  },
  {
    id: 'nda',
    title: 'Mutual NDA Agreement',
    description: 'Standard confidentiality agreement with clauses, term covenants, and dual signature blocks.',
    badge: 'Legal',
    defaultFilename: 'Mutual_NDA_Agreement.pdf',
    iconName: 'Shield',
  },
  {
    id: 'invoice',
    title: 'Professional Invoice',
    description: 'Pre-formatted invoice with itemized fee table, balance breakdown, terms, and signature line.',
    badge: 'Business',
    defaultFilename: 'Standard_Invoice.pdf',
    iconName: 'FileSpreadsheet',
  },
  {
    id: 'certificate',
    title: 'Formal Certificate',
    description: 'Bordered certificate of completion or achievement ready for recipient names and official seals.',
    badge: 'Award',
    defaultFilename: 'Certificate_of_Completion.pdf',
    iconName: 'Award',
  },
  {
    id: 'memo',
    title: 'Meeting Notes & Memo',
    description: 'Meeting agenda, attendee roster, key discussion points, and action items checklist.',
    badge: 'Productivity',
    defaultFilename: 'Meeting_Notes_Memo.pdf',
    iconName: 'CheckSquare',
  },
];

/**
 * Generates an automatic PDF document from a selected template or clean blank page
 */
export async function generateDocumentFromTemplate(
  templateId: 'blank' | 'nda' | 'invoice' | 'certificate' | 'memo',
  customTitle?: string
): Promise<{ file: File; buffer: ArrayBuffer; filename: string }> {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // A4 dimensions: 595.28 x 841.89 points
  const width = 595;
  const height = 842;

  let filename = customTitle || 'Untitled_Document.pdf';

  if (templateId === 'blank') {
    const page = doc.addPage([width, height]);
    filename = customTitle || 'Untitled_Document.pdf';

    // Draw subtle top guide line
    page.drawLine({
      start: { x: 50, y: height - 60 },
      end: { x: width - 50, y: height - 60 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.9),
    });

    // Subtle header placeholder text
    page.drawText('UNTITLED DOCUMENT', {
      x: 50,
      y: height - 52,
      size: 8,
      font: helveticaBold,
      color: rgb(0.65, 0.65, 0.7),
    });

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    page.drawText(dateStr, {
      x: width - 110,
      y: height - 52,
      size: 8,
      font: helvetica,
      color: rgb(0.65, 0.65, 0.7),
    });
  } else if (templateId === 'nda') {
    filename = customTitle || 'Mutual_NDA_Agreement.pdf';
    const page = doc.addPage([width, height]);

    // Top banner
    page.drawRectangle({
      x: 50,
      y: height - 85,
      width: width - 100,
      height: 40,
      color: rgb(0.96, 0.97, 1.0),
      borderColor: rgb(0.8, 0.85, 0.95),
      borderWidth: 1,
    });

    page.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
      x: 65,
      y: height - 68,
      size: 14,
      font: helveticaBold,
      color: rgb(0.12, 0.15, 0.35),
    });
    page.drawText('STRICTLY CONFIDENTIAL // REF-NDA-' + Math.floor(1000 + Math.random() * 9000), {
      x: 65,
      y: height - 80,
      size: 8,
      font: helvetica,
      color: rgb(0.45, 0.5, 0.65),
    });

    let y = height - 120;
    page.drawText('This Non-Disclosure Agreement (the "Agreement") is entered into by and between:', {
      x: 50,
      y,
      size: 9.5,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });

    y -= 30;
    page.drawText('Party A: _____________________________________   ("Disclosing Party")', {
      x: 50,
      y,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.15, 0.15, 0.2),
    });
    y -= 22;
    page.drawText('Party B: _____________________________________   ("Receiving Party")', {
      x: 50,
      y,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.15, 0.15, 0.2),
    });

    y -= 35;
    page.drawText('1. Confidential Information', {
      x: 50,
      y,
      size: 10.5,
      font: helveticaBold,
      color: rgb(0.12, 0.15, 0.3),
    });
    y -= 16;
    page.drawText(
      'The term "Confidential Information" shall include all proprietary technical data, software binaries, trade',
      { x: 50, y, size: 9, font: helvetica, color: rgb(0.25, 0.25, 0.25) }
    );
    y -= 14;
    page.drawText(
      'secrets, business records, and customer lists disclosed by one Party to the other.',
      { x: 50, y, size: 9, font: helvetica, color: rgb(0.25, 0.25, 0.25) }
    );

    y -= 28;
    page.drawText('2. Obligations of Receiving Party', {
      x: 50,
      y,
      size: 10.5,
      font: helveticaBold,
      color: rgb(0.12, 0.15, 0.3),
    });
    y -= 16;
    page.drawText(
      'The Receiving Party agrees to hold and maintain the Confidential Information in strict confidence with the',
      { x: 50, y, size: 9, font: helvetica, color: rgb(0.25, 0.25, 0.25) }
    );
    y -= 14;
    page.drawText(
      'same degree of care used to protect its own confidential assets, but not less than reasonable care.',
      { x: 50, y, size: 9, font: helvetica, color: rgb(0.25, 0.25, 0.25) }
    );

    y -= 28;
    page.drawText('3. Term & Termination', {
      x: 50,
      y,
      size: 10.5,
      font: helveticaBold,
      color: rgb(0.12, 0.15, 0.3),
    });
    y -= 16;
    page.drawText(
      'The non-disclosure provisions of this Agreement shall survive for a period of two (2) years from the date',
      { x: 50, y, size: 9, font: helvetica, color: rgb(0.25, 0.25, 0.25) }
    );
    y -= 14;
    page.drawText(
      'of initial execution and disclosure of information.',
      { x: 50, y, size: 9, font: helvetica, color: rgb(0.25, 0.25, 0.25) }
    );

    // Signature Area
    y = 180;
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.85),
    });

    y -= 30;
    page.drawText('IN WITNESS WHEREOF, the authorized representatives have executed this Agreement:', {
      x: 50,
      y,
      size: 9,
      font: helveticaOblique,
      color: rgb(0.4, 0.4, 0.45),
    });

    // Party A Sig Box
    y -= 50;
    page.drawLine({
      start: { x: 50, y },
      end: { x: 250, y },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.35),
    });
    page.drawText('Signature (Party A)', { x: 50, y: y - 14, size: 8.5, font: helveticaBold, color: rgb(0.3, 0.3, 0.35) });
    page.drawText('Date: ____________________', { x: 50, y: y - 28, size: 8.5, font: helvetica, color: rgb(0.4, 0.4, 0.4) });

    // Party B Sig Box
    page.drawLine({
      start: { x: 340, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.35),
    });
    page.drawText('Signature (Party B)', { x: 340, y: y - 14, size: 8.5, font: helveticaBold, color: rgb(0.3, 0.3, 0.35) });
    page.drawText('Date: ____________________', { x: 340, y: y - 28, size: 8.5, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
  } else if (templateId === 'invoice') {
    filename = customTitle || 'Standard_Invoice.pdf';
    const page = doc.addPage([width, height]);

    // Header brand block
    page.drawText('INVOICE', {
      x: 50,
      y: height - 70,
      size: 24,
      font: helveticaBold,
      color: rgb(0.12, 0.15, 0.3),
    });

    const invNum = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    page.drawText(`Invoice Number: ${invNum}`, {
      x: width - 200,
      y: height - 60,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(`Issue Date: ${new Date().toLocaleDateString()}`, {
      x: width - 200,
      y: height - 74,
      size: 9,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText('Payment Due: Upon Receipt', {
      x: width - 200,
      y: height - 88,
      size: 9,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Bill To & Billed From
    let y = height - 130;
    page.drawText('BILLED TO:', { x: 50, y, size: 9, font: helveticaBold, color: rgb(0.4, 0.45, 0.55) });
    page.drawText('PAYABLE TO:', { x: 320, y, size: 9, font: helveticaBold, color: rgb(0.4, 0.45, 0.55) });

    y -= 16;
    page.drawText('Client Name: Acme Corporation', { x: 50, y, size: 9.5, font: helvetica, color: rgb(0.15, 0.15, 0.2) });
    page.drawText('DocFusion Enterprise Solutions', { x: 320, y, size: 9.5, font: helvetica, color: rgb(0.15, 0.15, 0.2) });

    y -= 14;
    page.drawText('Attn: Accounts Payable', { x: 50, y, size: 9, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('support@docfusion.cloud', { x: 320, y, size: 9, font: helvetica, color: rgb(0.3, 0.3, 0.3) });

    // Table Header
    y -= 40;
    page.drawRectangle({
      x: 50,
      y: y - 6,
      width: width - 100,
      height: 24,
      color: rgb(0.93, 0.94, 0.98),
    });

    page.drawText('DESCRIPTION', { x: 60, y: y + 2, size: 8.5, font: helveticaBold, color: rgb(0.2, 0.25, 0.4) });
    page.drawText('QTY', { x: 340, y: y + 2, size: 8.5, font: helveticaBold, color: rgb(0.2, 0.25, 0.4) });
    page.drawText('RATE', { x: 400, y: y + 2, size: 8.5, font: helveticaBold, color: rgb(0.2, 0.25, 0.4) });
    page.drawText('AMOUNT', { x: 475, y: y + 2, size: 8.5, font: helveticaBold, color: rgb(0.2, 0.25, 0.4) });

    // Line items
    const items = [
      { desc: 'Document Studio Platform License (Enterprise)', qty: '1', rate: '$1,200.00', amount: '$1,200.00' },
      { desc: 'Lossless PDF Engine API Integration', qty: '1', rate: '$650.00', amount: '$650.00' },
      { desc: 'Cloud Firestore Sync & Security Audit', qty: '1', rate: '$450.00', amount: '$450.00' },
    ];

    items.forEach((item) => {
      y -= 26;
      page.drawLine({
        start: { x: 50, y: y - 5 },
        end: { x: width - 50, y: y - 5 },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.93),
      });

      page.drawText(item.desc, { x: 60, y: y + 2, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(item.qty, { x: 345, y: y + 2, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(item.rate, { x: 400, y: y + 2, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(item.amount, { x: 475, y: y + 2, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
    });

    // Subtotal & Total
    y -= 45;
    page.drawText('Subtotal:', { x: 380, y, size: 9.5, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('$2,300.00', { x: 475, y, size: 9.5, font: helvetica, color: rgb(0.1, 0.1, 0.1) });

    y -= 18;
    page.drawText('Tax (0%):', { x: 380, y, size: 9.5, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('$0.00', { x: 475, y, size: 9.5, font: helvetica, color: rgb(0.1, 0.1, 0.1) });

    y -= 22;
    page.drawRectangle({
      x: 370,
      y: y - 6,
      width: width - 50 - 370,
      height: 26,
      color: rgb(0.93, 0.94, 0.98),
    });
    page.drawText('Total Due:', { x: 380, y: y + 2, size: 10.5, font: helveticaBold, color: rgb(0.1, 0.15, 0.35) });
    page.drawText('$2,300.00', { x: 465, y: y + 2, size: 11, font: helveticaBold, color: rgb(0.1, 0.15, 0.35) });

    // Payment notes & signature
    y = 120;
    page.drawText('Payment Instructions: Direct ACH / Wire or Corporate Card.', {
      x: 50,
      y,
      size: 8.5,
      font: helveticaOblique,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 40;
    page.drawLine({
      start: { x: 50, y },
      end: { x: 250, y },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.35),
    });
    page.drawText('Authorized Signature', { x: 50, y: y - 14, size: 8, font: helveticaBold, color: rgb(0.3, 0.3, 0.35) });
  } else if (templateId === 'certificate') {
    filename = customTitle || 'Certificate_of_Completion.pdf';
    const page = doc.addPage([width, height]);

    // Decorative outer double border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: rgb(0.2, 0.25, 0.5),
      borderWidth: 2,
    });
    page.drawRectangle({
      x: 36,
      y: 36,
      width: width - 72,
      height: height - 72,
      borderColor: rgb(0.7, 0.6, 0.2),
      borderWidth: 0.75,
    });

    // Content
    let y = height - 140;
    page.drawText('CERTIFICATE OF RECOGNITION', {
      x: 120,
      y,
      size: 20,
      font: helveticaBold,
      color: rgb(0.15, 0.18, 0.38),
    });

    y -= 25;
    page.drawText('THIS OFFICIAL CERTIFICATE IS PROUDLY PRESENTED TO', {
      x: 140,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0.45, 0.45, 0.5),
    });

    y -= 60;
    page.drawText('[ RECIPIENT FULL NAME ]', {
      x: 165,
      y,
      size: 18,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawLine({
      start: { x: 120, y: y - 8 },
      end: { x: width - 120, y: y - 8 },
      thickness: 1,
      color: rgb(0.7, 0.6, 0.2),
    });

    y -= 50;
    page.drawText(
      'In honor of outstanding performance, high technical proficiency, and dedication to excellence.',
      { x: 75, y, size: 9.5, font: helveticaOblique, color: rgb(0.3, 0.3, 0.35) }
    );

    // Dual signatures at bottom
    y = 120;
    page.drawLine({
      start: { x: 70, y },
      end: { x: 230, y },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.35),
    });
    page.drawText('Program Director', { x: 105, y: y - 14, size: 8.5, font: helveticaBold, color: rgb(0.3, 0.3, 0.35) });

    page.drawLine({
      start: { x: width - 230, y },
      end: { x: width - 70, y },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.35),
    });
    page.drawText('Executive Officer', { x: width - 190, y: y - 14, size: 8.5, font: helveticaBold, color: rgb(0.3, 0.3, 0.35) });
  } else if (templateId === 'memo') {
    filename = customTitle || 'Meeting_Notes_Memo.pdf';
    const page = doc.addPage([width, height]);

    // Header
    page.drawText('MEETING NOTES & EXECUTIVE MEMO', {
      x: 50,
      y: height - 70,
      size: 16,
      font: helveticaBold,
      color: rgb(0.12, 0.15, 0.3),
    });

    let y = height - 105;
    page.drawText('Date & Time: __________________________', { x: 50, y, size: 9.5, font: helvetica, color: rgb(0.25, 0.25, 0.25) });
    page.drawText('Facilitator: ___________________________', { x: 310, y, size: 9.5, font: helvetica, color: rgb(0.25, 0.25, 0.25) });

    y -= 22;
    page.drawText('Attendees: ____________________________________________________________________', {
      x: 50,
      y,
      size: 9.5,
      font: helvetica,
      color: rgb(0.25, 0.25, 0.25),
    });

    y -= 35;
    page.drawText('1. Agenda & Key Objectives', { x: 50, y, size: 11, font: helveticaBold, color: rgb(0.12, 0.15, 0.3) });
    y -= 18;
    page.drawText('• Review project roadmap deliverables and architectural milestones.', { x: 60, y, size: 9, font: helvetica, color: rgb(0.25, 0.25, 0.25) });
    y -= 15;
    page.drawText('• Align on release deployment and database security rules verification.', { x: 60, y, size: 9, font: helvetica, color: rgb(0.25, 0.25, 0.25) });

    y -= 35;
    page.drawText('2. Key Decisions Made', { x: 50, y, size: 11, font: helveticaBold, color: rgb(0.12, 0.15, 0.3) });
    y -= 18;
    page.drawText('• Decision 1: ________________________________________________________________', { x: 60, y, size: 9, font: helvetica, color: rgb(0.25, 0.25, 0.25) });
    y -= 16;
    page.drawText('• Decision 2: ________________________________________________________________', { x: 60, y, size: 9, font: helvetica, color: rgb(0.25, 0.25, 0.25) });

    y -= 35;
    page.drawText('3. Action Items Checklist', { x: 50, y, size: 11, font: helveticaBold, color: rgb(0.12, 0.15, 0.3) });
    for (let i = 1; i <= 4; i++) {
      y -= 20;
      page.drawRectangle({
        x: 60,
        y: y - 1,
        width: 10,
        height: 10,
        borderColor: rgb(0.4, 0.4, 0.45),
        borderWidth: 1,
      });
      page.drawText(`Action item ${i}: _____________________________________   Assignee: ___________`, {
        x: 78,
        y,
        size: 9,
        font: helvetica,
        color: rgb(0.25, 0.25, 0.25),
      });
    }

    y = 100;
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.9),
    });
    page.drawText('DocFusion Document Studio — Cloud Synchronized Memo', {
      x: 50,
      y: y - 15,
      size: 8,
      font: helveticaOblique,
      color: rgb(0.5, 0.5, 0.55),
    });
  }

  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const file = new File([blob], filename, { type: 'application/pdf' });

  return {
    file,
    buffer: pdfBytes.buffer as ArrayBuffer,
    filename,
  };
}

/**
 * Appends an additional blank A4 page to an existing PDF document
 */
export async function appendBlankPageToExistingPDF(
  sourceBytes: ArrayBuffer
): Promise<{ file: File; buffer: ArrayBuffer; newPageCount: number }> {
  const doc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  doc.addPage([595, 842]);
  const newBytes = await doc.save();
  const blob = new Blob([newBytes], { type: 'application/pdf' });
  const file = new File([blob], 'updated_document.pdf', { type: 'application/pdf' });

  return {
    file,
    buffer: newBytes.buffer as ArrayBuffer,
    newPageCount: doc.getPageCount(),
  };
}
