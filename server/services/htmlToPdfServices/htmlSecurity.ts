import path from 'path';

const BLOCKED_HOST_REGEX = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.169\.254|metadata\.google\.internal)$/i;

export interface SanitizationResult {
  html: string;
  warnings: string[];
  title?: string;
}

export function isSafeRemoteUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOST_REGEX.test(hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFileName(name: string): string {
  const base = path.basename(name);
  let clean = base.replace(/[^a-zA-Z0-9_\-\.\s]/g, '_').trim();
  if (!clean || clean === '.') {
    clean = 'document';
  }
  if (!clean.toLowerCase().endsWith('.pdf')) {
    clean = clean.replace(/\.[^/.]+$/, '') + '.pdf';
  }
  return clean;
}

export function sanitizeHtml(
  rawHtml: string,
  options: {
    executeJavaScript?: boolean;
    allowExternalResources?: boolean;
  } = {}
): SanitizationResult {
  const warnings: string[] = [];
  let html = rawHtml;

  // Extract <title> if present
  let title: string | undefined;
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }

  // 1. Check for scripts if executeJavaScript is disabled
  if (!options.executeJavaScript) {
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(html)) {
      warnings.push('Embedded JavaScript tags were disabled for security.');
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    // Remove inline event handlers like onclick, onload
    html = html.replace(/\son[a-z]+\s*=\s*(["'])[\s\S]*?\1/gi, '');
    html = html.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');
  }

  // 2. Block dangerous protocols like file:// or javascript: in href/src
  html = html.replace(/(href|src)\s*=\s*(["'])\s*(file:|javascript:|vbscript:)[^"']*\2/gi, (_match, attr, quote) => {
    warnings.push(`Blocked insecure protocol in ${attr} attribute.`);
    return `${attr}=${quote}#${quote}`;
  });

  // 3. Check external resources if allowExternalResources is disabled
  if (!options.allowExternalResources) {
    html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, () => {
      warnings.push('External stylesheet links were blocked per security configuration.');
      return '';
    });
    html = html.replace(/<img[^>]+src=["'](http[s]?:\/\/[^"']+)["'][^>]*>/gi, (tag, url) => {
      warnings.push(`External image (${url}) was omitted.`);
      return `<div style="border: 1px dashed #999; padding: 4px; display: inline-block; font-size: 10px; color: #888;">[External Image Blocked]</div>`;
    });
  } else {
    // Validate that external URLs do not target internal IPs (SSRF mitigation)
    html = html.replace(/(href|src)\s*=\s*(["'])(https?:\/\/[^"']+)\2/gi, (match, attr, quote, url) => {
      if (!isSafeRemoteUrl(url)) {
        warnings.push(`Blocked potentially dangerous internal URL: ${url}`);
        return `${attr}=${quote}#${quote}`;
      }
      return match;
    });
  }

  return { html, warnings, title };
}
