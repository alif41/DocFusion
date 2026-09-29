import JSZip from 'jszip';
import { ConversionResult, PdfToMarkdownOptions, ExtractedImageItem } from '../types';

/**
 * Sends PDF to the backend conversion pipeline
 */
export async function convertPdfDocument(
  file: File,
  options: PdfToMarkdownOptions
): Promise<ConversionResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pageRange', options.pageRange);
  formData.append('ocrStrategy', options.ocrStrategy);
  formData.append('ocrLanguage', options.ocrLanguage);
  formData.append('imageMode', options.imageMode);
  formData.append('includeFrontmatter', String(options.includeFrontmatter));
  formData.append('detectTables', String(options.detectTables));
  formData.append('detectCodeBlocks', String(options.detectCodeBlocks));
  formData.append('cleanPageArtifacts', String(options.cleanPageArtifacts));

  const response = await fetch('/api/pdf-to-markdown/convert', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = 'PDF to Markdown conversion failed.';
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {
      // response might not be json
    }
    throw new Error(errorMsg);
  }

  const data: ConversionResult = await response.json();
  return data;
}

/**
 * Downloads plain Markdown text as a .md file
 */
export function downloadMarkdownFile(markdown: string, filename: string) {
  const cleanName = filename.endsWith('.md') ? filename : `${filename}.md`;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Downloads a ZIP package containing the .md file + extracted images
 */
export async function downloadZipBundle(
  markdown: string,
  images: ExtractedImageItem[],
  baseFilename: string
) {
  try {
    // Try server-side export first
    const response = await fetch('/api/pdf-to-markdown/export-zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown,
        images,
        filename: baseFilename.endsWith('.md') ? baseFilename : `${baseFilename}.md`,
      }),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanBase = baseFilename.replace(/\.md$/i, '');
      a.download = `${cleanBase}-markdown.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
  } catch (serverErr) {
    console.warn('Server zip export unavailable, running client fallback:', serverErr);
  }

  // Client-side JSZip fallback
  const zip = new JSZip();
  const mdName = baseFilename.endsWith('.md') ? baseFilename : `${baseFilename}.md`;
  zip.file(mdName, markdown);

  if (images && images.length > 0) {
    const imgFolder = zip.folder('images');
    for (const img of images) {
      if (img.dataUrl) {
        const base64Data = img.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        imgFolder?.file(img.name, base64Data, { base64: true });
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  const cleanBase = baseFilename.replace(/\.md$/i, '');
  a.download = `${cleanBase}-markdown.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
