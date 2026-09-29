import { PDFDocument, rgb, degrees, StandardFonts, PDFFont, PDFImage } from 'pdf-lib';
import { WatermarkItem, WatermarkResultData } from '../types';
import { parsePageRange } from './watermarkEngine';

export interface ExportWatermarkPdfOptions {
  file: File;
  watermarks: WatermarkItem[];
  currentPage?: number;
  filename?: string;
  onProgress?: (step: string, percent: number) => void;
}

export async function exportWatermarkedPdf({
  file,
  watermarks,
  currentPage = 1,
  filename,
  onProgress,
}: ExportWatermarkPdfOptions): Promise<WatermarkResultData> {
  const baseName = file.name.replace(/\.pdf$/i, '');
  const finalFilename = (filename || `${baseName}-watermarked.pdf`).trim();
  const safeFilename = finalFilename.toLowerCase().endsWith('.pdf')
    ? finalFilename
    : `${finalFilename}.pdf`;

  onProgress?.('Preparing PDF', 15);

  try {
    // Attempt backend first
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', safeFilename);
    formData.append('currentPage', currentPage.toString());

    // Prepare serializable watermarks
    const serializedWatermarks = watermarks.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      visible: w.visible,
      text: w.text,
      fontFamily: w.fontFamily,
      fontSize: w.fontSize,
      fontWeight: w.fontWeight,
      fontStyle: w.fontStyle,
      color: w.color,
      imageBase64: w.imageDataUrl,
      imageWidth: w.imageWidth,
      imageHeight: w.imageHeight,
      positionType: w.positionType,
      xPercent: w.xPercent,
      yPercent: w.yPercent,
      rotation: w.rotation,
      opacity: w.opacity,
      isTiled: w.isTiled,
      tileSpacingX: w.tileSpacingX,
      tileSpacingY: w.tileSpacingY,
      tileRotation: w.tileRotation,
      tileOpacity: w.tileOpacity,
      layer: w.layer,
      pageSelection: w.pageSelection,
    }));

    formData.append('watermarks', JSON.stringify(serializedWatermarks));

    onProgress?.('Loading Selected Pages', 35);

    const response = await fetch('/api/watermark-pdf/apply?binary=true', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      onProgress?.('Applying Watermark', 70);
      onProgress?.('Rendering PDF', 85);
      const blob = await response.blob();
      onProgress?.('Finalizing Document', 98);

      const downloadUrl = URL.createObjectURL(blob);
      const originalPages = parseInt(response.headers.get('X-Original-Pages') || '1', 10);
      const watermarkedPages = parseInt(response.headers.get('X-Watermarked-Pages') || '1', 10);

      return {
        blob,
        downloadUrl,
        filename: safeFilename,
        fileSize: blob.size,
        originalPageCount: originalPages,
        watermarkedPageCount: watermarkedPages,
        createdAt: new Date(),
      };
    }

    const errJson = await response.json().catch(() => null);
    if (errJson?.error) {
      console.warn('Backend watermark application failed:', errJson.error);
    }
  } catch (err) {
    console.warn('Backend call failed, switching to client-side fallback:', err);
  }

  // Client-side fallback using pdf-lib
  onProgress?.('Applying Watermark (Client Engine)', 45);

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  const hexToPdfRgb = (hex: string = '#666666') => {
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
    if (clean.length !== 6) return rgb(0.4, 0.4, 0.4);
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(isNaN(r) ? 0.4 : r, isNaN(g) ? 0.4 : g, isNaN(b) ? 0.4 : b);
  };

  const embeddedFonts = new Map<string, PDFFont>();
  const embeddedImages = new Map<string, PDFImage>();
  const modifiedPages = new Set<number>();

  onProgress?.('Rendering PDF', 75);

  for (const wm of watermarks) {
    if (!wm.visible) continue;

    let targetPages: number[] = [];
    if (wm.pageSelection.type === 'all') {
      targetPages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (wm.pageSelection.type === 'current') {
      targetPages = [currentPage];
    } else {
      const set = parsePageRange(wm.pageSelection.customRange, totalPages);
      targetPages = Array.from(set);
    }

    if (targetPages.length === 0) continue;

    // Load Font or Image
    let font: PDFFont | null = null;
    let image: PDFImage | null = null;

    if (wm.type === 'text') {
      const fontKey = wm.fontWeight === 'bold' ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
      if (!embeddedFonts.has(fontKey)) {
        embeddedFonts.set(fontKey, await pdfDoc.embedFont(fontKey));
      }
      font = embeddedFonts.get(fontKey)!;
    } else if (wm.type === 'image' && wm.imageDataUrl) {
      if (!embeddedImages.has(wm.id)) {
        const isJpg = wm.imageDataUrl.includes('image/jpeg') || wm.imageDataUrl.includes('image/jpg');
        const base64Data = wm.imageDataUrl.split(';base64,')[1];
        const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        let embImg: PDFImage;
        try {
          embImg = isJpg ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
        } catch {
          embImg = await pdfDoc.embedPng(bytes);
        }
        embeddedImages.set(wm.id, embImg);
      }
      image = embeddedImages.get(wm.id)!;
    }

    for (const pageNum of targetPages) {
      const pageIndex = pageNum - 1;
      const page = pages[pageIndex];
      if (!page) continue;

      modifiedPages.add(pageNum);
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const opacity = typeof wm.opacity === 'number' ? wm.opacity : 0.3;
      const rotationAngle = wm.rotation ?? 0;

      if (wm.isTiled) {
        const tileSpacingX = wm.tileSpacingX || 160;
        const tileSpacingY = wm.tileSpacingY || 140;
        const cols = Math.ceil(pageWidth / tileSpacingX) + 1;
        const rows = Math.ceil(pageHeight / tileSpacingY) + 1;

        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const x = c * tileSpacingX + (r % 2 === 1 ? tileSpacingX / 2 : 0) - 20;
            const y = r * tileSpacingY - 20;

            if (wm.type === 'text' && font) {
              page.drawText(wm.text || 'CONFIDENTIAL', {
                x,
                y,
                size: (wm.fontSize || 32) * 0.75,
                font,
                color: hexToPdfRgb(wm.color),
                opacity: wm.tileOpacity ?? opacity,
                rotate: degrees(wm.tileRotation ?? rotationAngle),
              });
            } else if (wm.type === 'image' && image) {
              page.drawImage(image, {
                x,
                y,
                width: (wm.imageWidth || 100) * 0.75,
                height: (wm.imageHeight || 60) * 0.75,
                opacity: wm.tileOpacity ?? opacity,
                rotate: degrees(wm.tileRotation ?? rotationAngle),
              });
            }
          }
        }
      } else {
        let targetX = 0;
        let targetY = 0;

        if (wm.type === 'text' && font) {
          const fontSize = wm.fontSize || 48;
          const text = wm.text || 'CONFIDENTIAL';
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const textHeight = font.heightAtSize(fontSize);

          if (wm.positionType === 'custom') {
            targetX = (wm.xPercent / 100) * pageWidth - textWidth / 2;
            targetY = pageHeight - (wm.yPercent / 100) * pageHeight - textHeight / 2;
          } else {
            targetX = (pageWidth - textWidth) / 2;
            targetY = (pageHeight - textHeight) / 2;
          }

          page.drawText(text, {
            x: Math.max(10, Math.min(pageWidth - 20, targetX)),
            y: Math.max(10, Math.min(pageHeight - 20, targetY)),
            size: fontSize,
            font,
            color: hexToPdfRgb(wm.color),
            opacity,
            rotate: degrees(rotationAngle),
          });
        } else if (wm.type === 'image' && image) {
          const imgWidth = wm.imageWidth || 180;
          const imgHeight = wm.imageHeight || 120;

          if (wm.positionType === 'custom') {
            targetX = (wm.xPercent / 100) * pageWidth - imgWidth / 2;
            targetY = pageHeight - (wm.yPercent / 100) * pageHeight - imgHeight / 2;
          } else {
            targetX = (pageWidth - imgWidth) / 2;
            targetY = (pageHeight - imgHeight) / 2;
          }

          page.drawImage(image, {
            x: Math.max(10, Math.min(pageWidth - 20, targetX)),
            y: Math.max(10, Math.min(pageHeight - 20, targetY)),
            width: imgWidth,
            height: imgHeight,
            opacity,
            rotate: degrees(rotationAngle),
          });
        }
      }
    }
  }

  onProgress?.('Finalizing Document', 95);
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    blob,
    downloadUrl,
    filename: safeFilename,
    fileSize: blob.size,
    originalPageCount: totalPages,
    watermarkedPageCount: modifiedPages.size,
    createdAt: new Date(),
  };
}
