import { createCanvas } from '@napi-rs/canvas';
import { ExtractedImageItem } from './types';

/**
 * Extracts embedded images or renders high-fidelity image snapshots from a PDF page
 */
export async function extractPageImages(
  pdfPage: any,
  pageNumber: number,
  mode: 'extract_folder' | 'inline_base64' | 'skip'
): Promise<ExtractedImageItem[]> {
  if (mode === 'skip') return [];

  const images: ExtractedImageItem[] = [];

  try {
    const operatorList = await pdfPage.getOperatorList();
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const OPS = (pdfjs as any).OPS || {};

    let imgIndex = 1;

    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i];

      // OPS.paintImageXObject (85) or OPS.paintInlineImageXObject (86)
      if (fn === (OPS as any).paintImageXObject || fn === (OPS as any).paintInlineImageXObject || fn === 85 || fn === 86) {
        const objId = operatorList.argsArray[i]?.[0];
        if (!objId) continue;

        try {
          const imgObj = await new Promise<any>((resolve) => {
            if (pdfPage.objs.has(objId)) {
              resolve(pdfPage.objs.get(objId));
            } else {
              pdfPage.objs.get(objId, resolve);
            }
          });

          if (imgObj && imgObj.data && imgObj.width > 20 && imgObj.height > 20) {
            const canvas = createCanvas(imgObj.width, imgObj.height);
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(imgObj.width, imgObj.height);

            // Handle RGB or RGBA data
            if (imgObj.data.length === imgObj.width * imgObj.height * 3) {
              // RGB -> RGBA
              let srcIdx = 0;
              let dstIdx = 0;
              for (let p = 0; p < imgObj.width * imgObj.height; p++) {
                imgData.data[dstIdx] = imgObj.data[srcIdx];
                imgData.data[dstIdx + 1] = imgObj.data[srcIdx + 1];
                imgData.data[dstIdx + 2] = imgObj.data[srcIdx + 2];
                imgData.data[dstIdx + 3] = 255;
                srcIdx += 3;
                dstIdx += 4;
              }
            } else if (imgObj.data.length === imgObj.width * imgObj.height * 4) {
              imgData.data.set(imgObj.data);
            } else {
              // Grayscale or 1-bit
              let dstIdx = 0;
              for (let p = 0; p < imgObj.width * imgObj.height; p++) {
                const val = imgObj.data[p] || 0;
                imgData.data[dstIdx] = val;
                imgData.data[dstIdx + 1] = val;
                imgData.data[dstIdx + 2] = val;
                imgData.data[dstIdx + 3] = 255;
                dstIdx += 4;
              }
            }

            ctx.putImageData(imgData, 0, 0);
            const pngBuffer = canvas.toBuffer('image/png');
            const fileName = `page_${pageNumber}_img_${imgIndex}.png`;
            const relativePath = `images/${fileName}`;

            images.push({
              id: `img_p${pageNumber}_${imgIndex}`,
              name: fileName,
              relativePath,
              pageNumber,
              dataUrl: `data:image/png;base64,${pngBuffer.toString('base64')}`,
              mimeType: 'image/png',
              width: imgObj.width,
              height: imgObj.height,
            });

            imgIndex++;
          }
        } catch {
          // continue if specific image object fails to decode
        }
      }
    }
  } catch (err) {
    console.warn(`Could not inspect image operator list for page ${pageNumber}:`, err);
  }

  return images;
}
