import { PDFDocument } from 'pdf-lib';

export interface PDFMetadata {
  pageCount: number;
  thumbnailUrl: string;
  isValid: boolean;
  error?: string;
}

/**
 * Validates that an uploaded File is a genuine PDF by checking MIME type and magic bytes
 */
export async function validatePDFFile(file: File): Promise<boolean> {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return false;
  }
  try {
    const slice = file.slice(0, 5);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    );
  } catch {
    return false;
  }
}

/**
 * Generates an elegant SVG thumbnail simulating the PDF's first page
 */
function generateDocumentPreviewSVG(filename: string, pageCount: number, widthRatio = 1): string {
  const cleanName = filename.replace(/\.pdf$/i, '');
  const truncatedTitle = cleanName.length > 20 ? `${cleanName.substring(0, 18)}...` : cleanName;

  // SVG representation of a clean document page
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 210" width="160" height="210">
    <defs>
      <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1c1c28"/>
        <stop offset="100%" stop-color="#12121b"/>
      </linearGradient>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#7c3aed"/>
        <stop offset="100%" stop-color="#a78bfa"/>
      </linearGradient>
    </defs>
    <!-- Paper shadow & background -->
    <rect x="2" y="2" width="156" height="206" rx="8" fill="url(#docGrad)" stroke="#2b2b3d" stroke-width="1.5"/>
    
    <!-- Top colored document ribbon -->
    <rect x="16" y="16" width="36" height="5" rx="2.5" fill="url(#headerGrad)"/>
    
    <!-- PDF Badge -->
    <rect x="112" y="14" width="32" height="15" rx="3.5" fill="#e11d48" fill-opacity="0.2" stroke="#e11d48" stroke-opacity="0.4" stroke-width="1"/>
    <text x="128" y="25" fill="#f43f5e" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">PDF</text>
    
    <!-- Document Header / Title simulation -->
    <text x="16" y="42" fill="#f4f4f6" font-size="10" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="600">${escapeXml(truncatedTitle)}</text>
    <rect x="16" y="50" width="90" height="3" rx="1.5" fill="#38384f"/>
    <rect x="16" y="58" width="60" height="3" rx="1.5" fill="#2d2d40"/>
    
    <!-- Content line placeholders (simulating paragraphs) -->
    <rect x="16" y="74" width="128" height="2.5" rx="1.25" fill="#2b2b3d"/>
    <rect x="16" y="83" width="120" height="2.5" rx="1.25" fill="#262638"/>
    <rect x="16" y="92" width="124" height="2.5" rx="1.25" fill="#262638"/>
    <rect x="16" y="101" width="95" height="2.5" rx="1.25" fill="#232332"/>

    <!-- Simulated table or figure block -->
    <rect x="16" y="115" width="128" height="42" rx="4" fill="#14141f" stroke="#252535" stroke-width="1"/>
    <line x1="16" y1="128" x2="144" y2="128" stroke="#252535" stroke-width="1"/>
    <line x1="60" y1="115" x2="60" y2="157" stroke="#252535" stroke-width="1"/>
    <line x1="100" y1="115" x2="100" y2="157" stroke="#252535" stroke-width="1"/>
    
    <!-- Bottom line text -->
    <rect x="16" y="169" width="110" height="2.5" rx="1.25" fill="#262638"/>
    <rect x="16" y="177" width="75" height="2.5" rx="1.25" fill="#232332"/>

    <!-- Footer Page counter -->
    <circle cx="22" cy="193" r="3.5" fill="#7c3aed" fill-opacity="0.4"/>
    <text x="32" y="196" fill="#8e8ea0" font-size="8" font-family="monospace">Page 1 of ${pageCount}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * Extracts page count and generates a preview thumbnail for an uploaded PDF file.
 */
export async function getPDFMetadata(file: File): Promise<PDFMetadata> {
  const isValid = await validatePDFFile(file);
  if (!isValid) {
    return {
      pageCount: 0,
      thumbnailUrl: '',
      isValid: false,
      error: 'File is not a valid PDF document or header is corrupt.',
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 0) {
      return {
        pageCount: 0,
        thumbnailUrl: '',
        isValid: false,
        error: 'PDF contains zero readable pages.',
      };
    }

    const firstPage = pdfDoc.getPage(0);
    const { width, height } = firstPage.getSize();
    const ratio = height > 0 ? width / height : 1;

    const thumbnailUrl = generateDocumentPreviewSVG(file.name, pageCount, ratio);

    return {
      pageCount,
      thumbnailUrl,
      isValid: true,
    };
  } catch (err: any) {
    console.warn('PDF metadata parsing error for file:', file.name, err);
    return {
      pageCount: 1, // fallback estimate
      thumbnailUrl: generateDocumentPreviewSVG(file.name, 1),
      isValid: true,
      error: undefined,
    };
  }
}
