import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  ConversionStage,
  HtmlConversionResult,
  HtmlToPdfConfig,
  UploadedHtmlFile,
} from '../components/HtmlToPdf/types';
import { PAGE_DIMENSIONS_MM } from '../components/HtmlToPdf/config';

export function useHtmlConversion() {
  const [stage, setStage] = useState<ConversionStage>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentDocumentName, setCurrentDocumentName] = useState<string>('');
  const [filesCompleted, setFilesCompleted] = useState<number>(0);
  const [result, setResult] = useState<HtmlConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<boolean>(false);

  const reset = () => {
    setStage('idle');
    setProgressPercent(0);
    setResult(null);
    setErrorMessage(null);
    setFilesCompleted(0);
  };

  const cancel = () => {
    abortRef.current = true;
    setStage('idle');
    setProgressPercent(0);
  };

  /**
   * Render HTML string to page image blobs using browser DOM + html2canvas
   */
  const renderHtmlToPageBlobs = async (
    html: string,
    config: HtmlToPdfConfig
  ): Promise<{ blobs: Blob[]; pagesCount: number }> => {
    // 1. Create temporary offscreen container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.zIndex = '-9999';
    container.style.background = '#ffffff';

    // Page aspect calculation (A4 = 210 x 297 mm, standard 794 x 1123 px at 96 DPI)
    const dims = PAGE_DIMENSIONS_MM[config.pageSize] || PAGE_DIMENSIONS_MM.A4;
    const isLandscape = config.orientation === 'landscape';
    const widthMm = isLandscape ? Math.max(dims.width, dims.height) : Math.min(dims.width, dims.height);
    const heightMm = isLandscape ? Math.min(dims.width, dims.height) : Math.max(dims.width, dims.height);

    // 1mm ~ 3.78px at 96 DPI
    const targetPxWidth = Math.round(widthMm * 3.7795);
    const targetPxHeight = Math.round(heightMm * 3.7795);

    container.style.width = `${targetPxWidth}px`;
    container.style.minHeight = `${targetPxHeight}px`;

    // Apply sandboxed HTML content
    container.innerHTML = html;
    document.body.appendChild(container);

    // Wait a brief tick for fonts & images to settle
    await new Promise((r) => setTimeout(r, 150));

    // Determine scale based on quality setting
    let canvasScale = 2; // high
    if (config.quality === 'standard') canvasScale = 1.5;
    if (config.quality === 'maximum') canvasScale = 2.5;

    try {
      const fullCanvas = await html2canvas(container, {
        scale: canvasScale,
        useCORS: config.allowExternalResources,
        allowTaint: true,
        backgroundColor: config.printBackground ? null : '#ffffff',
        logging: false,
        windowWidth: targetPxWidth,
      });

      const totalH = fullCanvas.height;
      const pageHeightScaled = targetPxHeight * canvasScale;
      const numPages = Math.max(1, Math.ceil(totalH / pageHeightScaled));
      const pageBlobs: Blob[] = [];

      for (let i = 0; i < numPages; i++) {
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = fullCanvas.width;
        pageCanvas.height = pageHeightScaled;
        const ctx = pageCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

          const sourceY = i * pageHeightScaled;
          const sliceH = Math.min(pageHeightScaled, totalH - sourceY);

          ctx.drawImage(
            fullCanvas,
            0,
            sourceY,
            fullCanvas.width,
            sliceH,
            0,
            0,
            fullCanvas.width,
            sliceH
          );
        }

        const blob = await new Promise<Blob>((resolve) => {
          pageCanvas.toBlob(
            (b) => resolve(b || new Blob()),
            config.quality === 'maximum' ? 'image/png' : 'image/jpeg',
            0.94
          );
        });
        pageBlobs.push(blob);
      }

      return { blobs: pageBlobs, pagesCount: numPages };
    } finally {
      document.body.removeChild(container);
    }
  };

  /**
   * Convert single HTML document
   */
  const convertSingle = async (
    html: string,
    filename: string,
    config: HtmlToPdfConfig
  ): Promise<HtmlConversionResult> => {
    abortRef.current = false;
    setErrorMessage(null);
    setCurrentDocumentName(filename);
    setStage('preparing');
    setProgressPercent(15);

    await new Promise((r) => setTimeout(r, 100));
    setStage('loading_css');
    setProgressPercent(30);

    await new Promise((r) => setTimeout(r, 100));
    setStage('loading_assets');
    setProgressPercent(45);

    setStage('rendering');
    setProgressPercent(60);
    const { blobs, pagesCount } = await renderHtmlToPageBlobs(html, config);

    if (abortRef.current) throw new Error('Conversion cancelled.');

    setStage('generating_pdf');
    setProgressPercent(80);

    const formData = new FormData();
    formData.append('filename', filename);
    formData.append('config', JSON.stringify(config));
    blobs.forEach((b, idx) => {
      formData.append(`page_image_${idx}`, b, `page_${idx}.${config.quality === 'maximum' ? 'png' : 'jpg'}`);
    });

    setStage('finalizing');
    setProgressPercent(92);

    const response = await fetch('/api/html-to-pdf/convert', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || 'Failed to assemble PDF from HTML.');
    }

    const pdfBlob = await response.blob();
    const downloadUrl = URL.createObjectURL(pdfBlob);

    const rawName = response.headers.get('X-Converted-Filename');
    const outFilename = rawName ? decodeURIComponent(rawName) : filename.replace(/\.[^/.]+$/, '') + '.pdf';

    setProgressPercent(100);
    setStage('complete');

    const res: HtmlConversionResult = {
      blob: pdfBlob,
      downloadUrl,
      filename: outFilename,
      pages: pagesCount,
      size: pdfBlob.size,
    };
    setResult(res);
    return res;
  };

  /**
   * Batch convert multiple HTML files
   */
  const convertBatch = async (
    files: UploadedHtmlFile[],
    config: HtmlToPdfConfig
  ): Promise<HtmlConversionResult> => {
    abortRef.current = false;
    setErrorMessage(null);
    setFilesCompleted(0);
    setStage('preparing');
    setProgressPercent(10);

    const formData = new FormData();
    formData.append('config', JSON.stringify(config));

    for (let i = 0; i < files.length; i++) {
      if (abortRef.current) throw new Error('Batch conversion cancelled.');

      const fileItem = files[i];
      setCurrentDocumentName(fileItem.name);
      setStage('rendering');

      const progressBase = 10 + Math.round((i / files.length) * 75);
      setProgressPercent(progressBase);

      const { blobs } = await renderHtmlToPageBlobs(fileItem.htmlContent, config);

      blobs.forEach((b, pageIdx) => {
        formData.append(`doc_${i}_page_${pageIdx}`, b, `doc_${i}_page_${pageIdx}.jpg`);
      });
      formData.append(`doc_${i}_name`, fileItem.name.replace(/\.[^/.]+$/, '') + '.pdf');

      fileItem.status = 'completed';
      setFilesCompleted(i + 1);
    }

    setStage('generating_pdf');
    setProgressPercent(88);

    setStage('finalizing');
    setProgressPercent(95);

    const res = await fetch('/api/html-to-pdf/batch', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Batch ZIP packaging failed.');
    }

    const zipBlob = await res.blob();
    const downloadUrl = URL.createObjectURL(zipBlob);
    const zipName = `html_to_pdf_batch_${Date.now()}.zip`;

    setProgressPercent(100);
    setStage('complete');

    const batchRes: HtmlConversionResult = {
      blob: zipBlob,
      downloadUrl,
      filename: zipName,
      pages: files.length,
      size: zipBlob.size,
      isZip: true,
    };
    setResult(batchRes);
    return batchRes;
  };

  return {
    stage,
    progressPercent,
    currentDocumentName,
    filesCompleted,
    result,
    errorMessage,
    setErrorMessage,
    setStage,
    convertSingle,
    convertBatch,
    cancel,
    reset,
  };
}
