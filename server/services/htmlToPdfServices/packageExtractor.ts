import JSZip from 'jszip';
import path from 'path';

export interface ExtractedPackage {
  mainHtml: string;
  filename: string;
  filesCount: number;
  warnings: string[];
}

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.css': 'text/css',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

export async function extractAndBundleHtmlPackage(zipBuffer: Buffer): Promise<ExtractedPackage> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const warnings: string[] = [];
  const fileMap = new Map<string, { buffer: Buffer; mime: string }>();

  // Security check: limit total entries and uncompressed size (prevent zip bombs)
  const entries = Object.keys(zip.files);
  if (entries.length > 500) {
    throw new Error('ZIP package exceeds limit of 500 entries.');
  }

  let totalSize = 0;
  const MAX_UNCOMPRESSED_SIZE = 50 * 1024 * 1024; // 50MB

  for (const relativePath of entries) {
    const entry = zip.files[relativePath];
    if (entry.dir) continue;

    // Path traversal check
    const normalized = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    if (normalized.includes('..') || path.isAbsolute(normalized)) {
      warnings.push(`Ignored potentially dangerous path inside archive: ${relativePath}`);
      continue;
    }

    const ext = path.extname(normalized).toLowerCase();

    // Check against dangerous executable extensions
    if (['.exe', '.sh', '.bat', '.cmd', '.bin', '.dll', '.so', '.vbs'].includes(ext)) {
      warnings.push(`Skipped unsupported executable file: ${normalized}`);
      continue;
    }

    const data = await entry.async('nodebuffer');
    totalSize += data.length;
    if (totalSize > MAX_UNCOMPRESSED_SIZE) {
      throw new Error('Uncompressed package size exceeds maximum limit of 50MB.');
    }

    const mime = MIME_MAP[ext] || 'application/octet-stream';
    fileMap.set(normalized.replace(/\\/g, '/').toLowerCase(), { buffer: data, mime });
    // Also store without leading slash/dot
    fileMap.set(normalized.replace(/^\.?\//, '').replace(/\\/g, '/').toLowerCase(), { buffer: data, mime });
  }

  // Find main HTML file: priority to index.html / index.htm, then any .html
  let mainHtmlKey: string | null = null;
  const htmlKeys = Array.from(fileMap.keys()).filter((k) => k.endsWith('.html') || k.endsWith('.htm'));

  if (htmlKeys.length === 0) {
    throw new Error('No HTML document (.html or .htm) found in the uploaded package.');
  }

  mainHtmlKey =
    htmlKeys.find((k) => k.endsWith('index.html') || k.endsWith('index.htm')) || htmlKeys[0];

  const mainHtmlBuffer = fileMap.get(mainHtmlKey)!.buffer;
  let htmlString = mainHtmlBuffer.toString('utf-8');

  // Directory of main html
  const baseDir = path.dirname(mainHtmlKey).replace(/\\/g, '/');

  // Inline relative CSS files: <link rel="stylesheet" href="...">
  htmlString = htmlString.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) return tag;
    const href = hrefMatch[1].trim();
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//') || href.startsWith('data:')) {
      return tag;
    }

    const resolved = path.posix.normalize(baseDir === '.' ? href : `${baseDir}/${href}`).toLowerCase();
    const asset = fileMap.get(resolved) || fileMap.get(href.toLowerCase());
    if (asset) {
      const cssContent = asset.buffer.toString('utf-8');
      return `<style>/* inlined ${href} */\n${cssContent}\n</style>`;
    } else {
      warnings.push(`Referenced stylesheet "${href}" was not found in package.`);
      return tag;
    }
  });

  // Inline relative image assets: <img ... src="...">
  htmlString = htmlString.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (match, prefix, src, suffix) => {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return match;
    }

    const cleanSrc = src.split('?')[0].split('#')[0];
    const resolved = path.posix.normalize(baseDir === '.' ? cleanSrc : `${baseDir}/${cleanSrc}`).toLowerCase();
    const asset = fileMap.get(resolved) || fileMap.get(cleanSrc.toLowerCase());

    if (asset && asset.mime.startsWith('image/')) {
      const base64 = asset.buffer.toString('base64');
      const dataUri = `data:${asset.mime};base64,${base64}`;
      return `${prefix}${dataUri}${suffix}`;
    } else {
      warnings.push(`Image asset "${src}" was not found in package.`);
      return match;
    }
  });

  // Inline relative CSS background images: url('...')
  htmlString = htmlString.replace(/url\(\s*['"]?([^'"()]+)['"]?\s*\)/gi, (match, url) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return match;
    }
    const cleanUrl = url.split('?')[0].split('#')[0];
    const resolved = path.posix.normalize(baseDir === '.' ? cleanUrl : `${baseDir}/${cleanUrl}`).toLowerCase();
    const asset = fileMap.get(resolved) || fileMap.get(cleanUrl.toLowerCase());

    if (asset) {
      const base64 = asset.buffer.toString('base64');
      return `url('data:${asset.mime};base64,${base64}')`;
    }
    return match;
  });

  return {
    mainHtml: htmlString,
    filename: path.basename(mainHtmlKey).replace(/\.[^/.]+$/, '') + '.pdf',
    filesCount: entries.length,
    warnings,
  };
}
