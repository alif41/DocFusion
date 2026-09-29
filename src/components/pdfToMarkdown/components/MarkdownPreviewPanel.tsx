import React, { useState } from 'react';
import {
  Copy,
  Check,
  Code2,
  Download,
  FileArchive,
  Eye,
  FileText,
  Tag,
} from 'lucide-react';
import { ExtractedImageItem } from '../types';

interface MarkdownPreviewPanelProps {
  markdown: string;
  images: ExtractedImageItem[];
  originalFilename: string;
  onDownloadMd: () => void;
  onDownloadZip: () => void;
}

export const MarkdownPreviewPanel: React.FC<MarkdownPreviewPanelProps> = ({
  markdown,
  images,
  originalFilename,
  onDownloadMd,
  onDownloadZip,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Parse frontmatter vs body
  let frontmatterData: Record<string, string> | null = null;
  let bodyMarkdown = markdown;

  if (markdown.startsWith('---')) {
    const secondTripleDash = markdown.indexOf('\n---', 3);
    if (secondTripleDash !== -1) {
      const frontmatterText = markdown.substring(3, secondTripleDash).trim();
      bodyMarkdown = markdown.substring(secondTripleDash + 4).trim();

      const pairs: Record<string, string> = {};
      frontmatterText.split('\n').forEach((line) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          const key = line.substring(0, colonIdx).trim();
          const val = line.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
          pairs[key] = val;
        }
      });
      frontmatterData = pairs;
    }
  }

  // Convert Markdown body to safe formatted HTML elements
  const renderMarkdownElements = () => {
    if (!bodyMarkdown.trim()) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-neutral-500 space-y-2">
          <Eye className="w-8 h-8 opacity-30 text-[#7c3aed] dark:text-[#a78bfa]" />
          <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">Live Preview is empty</p>
          <p className="text-xs text-slate-400 dark:text-neutral-600">Converted or typed Markdown will be rendered here.</p>
        </div>
      );
    }

    const lines = bodyMarkdown.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Page comments <!-- Page X -->
      if (/^<!--\s*Page\s+\d+\s*-->$/i.test(line.trim())) {
        const pageNum = line.match(/\d+/)?.[0];
        elements.push(
          <div key={`page-div-${i}`} className="my-6 flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#7c3aed]/30 to-transparent" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#7c3aed] dark:text-[#a78bfa] bg-[#7c3aed]/10 px-2 py-0.5 rounded-full border border-[#7c3aed]/20">
              Page {pageNum}
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#7c3aed]/30 to-transparent" />
          </div>
        );
        i++;
        continue;
      }

      // Horizontal Rule
      if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        elements.push(<hr key={`hr-${i}`} className="my-6 border-slate-200 dark:border-[#262638]" />);
        i++;
        continue;
      }

      // Code blocks
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3);
        const codeLines: string[] = [];
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          codeLines.push(lines[j]);
          j++;
        }
        elements.push(
          <div key={`code-${i}`} className="my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-[#26263b] bg-slate-950 shadow-xs">
            {lang && (
              <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                {lang}
              </div>
            )}
            <pre className="p-3 text-xs font-mono text-[#a5b4fc] overflow-x-auto scrollbar-thin">
              <code>{codeLines.join('\n')}</code>
            </pre>
          </div>
        );
        i = j + 1;
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-[#28283d]">
            {line.slice(2)}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-xl font-bold text-slate-850 dark:text-neutral-100 mt-5 mb-2 pb-1 border-b border-slate-200 dark:border-[#202030]">
            {line.slice(3)}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-base font-semibold text-[#7c3aed] dark:text-[#c4b5fd] mt-4 mb-2">
            {line.slice(4)}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={`h4-${i}`} className="text-sm font-semibold text-slate-800 dark:text-neutral-300 mt-3 mb-1">
            {line.slice(5)}
          </h4>
        );
        i++;
        continue;
      }

      // Blockquotes
      if (line.startsWith('>')) {
        const quoteLines: string[] = [line.replace(/^>\s*/, '')];
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith('>')) {
          quoteLines.push(lines[j].replace(/^>\s*/, ''));
          j++;
        }
        elements.push(
          <blockquote
            key={`quote-${i}`}
            className="my-3 pl-3 py-1.5 border-l-2 border-[#7c3aed] bg-purple-50/70 dark:bg-[#141420]/50 text-slate-700 dark:text-neutral-300 italic text-xs rounded-r-lg"
          >
            {quoteLines.join(' ')}
          </blockquote>
        );
        i = j;
        continue;
      }

      // Tables (GFM)
      if (line.includes('|') && lines[i + 1]?.includes('|') && lines[i + 1]?.includes('---')) {
        const tableLines: string[] = [line, lines[i + 1]];
        let j = i + 2;
        while (j < lines.length && lines[j].includes('|') && lines[j].trim() !== '') {
          tableLines.push(lines[j]);
          j++;
        }

        const parseCells = (rowStr: string) =>
          rowStr
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());

        const headers = parseCells(tableLines[0]);
        const dataRows = tableLines.slice(2).map(parseCells);

        elements.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-[#28283d] scrollbar-thin shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-[#181826] text-slate-800 dark:text-neutral-200 border-b border-slate-200 dark:border-[#28283d]">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={`th-${hIdx}`} className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-wider text-[#7c3aed] dark:text-[#a78bfa]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#202030] bg-white dark:bg-[#101018]">
                {dataRows.map((r, rIdx) => (
                  <tr key={`tr-${rIdx}`} className="hover:bg-slate-50 dark:hover:bg-[#1a1a28]/60 transition-colors">
                    {r.map((c, cIdx) => (
                      <td key={`td-${rIdx}-${cIdx}`} className="py-2 px-3 text-slate-700 dark:text-neutral-300 text-xs">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

        i = j;
        continue;
      }

      // Unordered lists
      if (/^[•\-\*]\s+/.test(line)) {
        const items: string[] = [line.replace(/^[•\-\*]\s+/, '')];
        let j = i + 1;
        while (j < lines.length && /^[•\-\*]\s+/.test(lines[j])) {
          items.push(lines[j].replace(/^[•\-\*]\s+/, ''));
          j++;
        }
        elements.push(
          <ul key={`ul-${i}`} className="my-2 space-y-1 list-disc list-inside text-xs text-slate-700 dark:text-neutral-300">
            {items.map((it, itIdx) => (
              <li key={`li-${itIdx}`}>{it}</li>
            ))}
          </ul>
        );
        i = j;
        continue;
      }

      // Ordered lists
      if (/^\d+[\.\)]\s+/.test(line)) {
        const items: string[] = [line.replace(/^\d+[\.\)]\s+/, '')];
        let j = i + 1;
        while (j < lines.length && /^\d+[\.\)]\s+/.test(lines[j])) {
          items.push(lines[j].replace(/^\d+[\.\)]\s+/, ''));
          j++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="my-2 space-y-1 list-decimal list-inside text-xs text-slate-700 dark:text-neutral-300">
            {items.map((it, itIdx) => (
              <li key={`oli-${itIdx}`}>{it}</li>
            ))}
          </ol>
        );
        i = j;
        continue;
      }

      // Image links: ![alt](url)
      const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2];
        const matchedImg = images.find(
          (img) => img.relativePath === src || img.name === src || src.includes(img.name)
        );
        const resolvedSrc = matchedImg?.dataUrl || (src.startsWith('data:') ? src : null);

        elements.push(
          <div key={`img-${i}`} className="my-4 p-2 bg-slate-50 dark:bg-[#12121c] border border-slate-200 dark:border-[#252538] rounded-xl flex flex-col items-center">
            {resolvedSrc ? (
              <img src={resolvedSrc} alt={alt} className="max-h-60 rounded object-contain" />
            ) : (
              <div className="w-full h-32 flex flex-col items-center justify-center bg-white dark:bg-[#0d0d16] rounded border border-dashed border-slate-300 dark:border-[#33334d] text-slate-600 dark:text-neutral-400 gap-1">
                <FileText className="w-6 h-6 text-[#7c3aed] dark:text-[#a78bfa]" />
                <span className="text-[11px] font-mono">{src}</span>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500">(Included in export ZIP archive)</span>
              </div>
            )}
            {alt && <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-mono mt-1">{alt}</span>}
          </div>
        );
        i++;
        continue;
      }

      // Regular paragraph line
      if (line.trim()) {
        elements.push(
          <p key={`p-${i}`} className="my-2 text-xs leading-relaxed text-slate-700 dark:text-neutral-300">
            {line}
          </p>
        );
      }

      i++;
    }

    return elements;
  };

  const handleCopyMd = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyHtml = async () => {
    try {
      const htmlText = `<!DOCTYPE html>\n<html>\n<head>\n<title>${originalFilename}</title>\n</head>\n<body>\n<pre>${markdown.replace(/</g, '&lt;')}</pre>\n</body>\n</html>`;
      await navigator.clipboard.writeText(htmlText);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-[#0d0d14] transition-colors">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#14141f] border-b border-slate-200 dark:border-[#222233] gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-neutral-300 font-medium">
          <Eye className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
          <span>Live Rendered View</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyMd}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1c1c2b] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#28283d] text-xs border border-slate-200 dark:border-transparent transition-colors cursor-pointer"
            title="Copy Markdown text"
          >
            {copiedMd ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>Copy MD</span>
          </button>

          <button
            type="button"
            onClick={handleCopyHtml}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1c1c2b] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#28283d] text-xs border border-slate-200 dark:border-transparent transition-colors cursor-pointer"
            title="Copy as HTML"
          >
            {copiedHtml ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Code2 className="w-3 h-3" />}
            <span>Copy HTML</span>
          </button>

          <button
            type="button"
            onClick={onDownloadMd}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] text-xs font-medium shadow-xs transition-colors cursor-pointer"
            title="Download .md file"
          >
            <Download className="w-3 h-3" />
            <span>.md</span>
          </button>

          {images.length > 0 && (
            <button
              type="button"
              onClick={onDownloadZip}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-medium shadow-xs transition-colors cursor-pointer"
              title="Download Markdown + Images in ZIP"
            >
              <FileArchive className="w-3 h-3" />
              <span>ZIP Bundle</span>
            </button>
          )}
        </div>
      </div>

      {/* Rendered Scroll Surface */}
      <div className="flex-1 overflow-auto p-5 scrollbar-thin max-w-3xl mx-auto w-full">
        {/* YAML Frontmatter Tag Card */}
        {frontmatterData && (
          <div className="mb-6 p-3.5 rounded-xl bg-white dark:bg-[#141422] border border-slate-200 dark:border-[#2a2a40] shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#7c3aed] dark:text-[#a78bfa] mb-2 font-semibold uppercase tracking-wider">
              <Tag className="w-3 h-3" />
              <span>Document Metadata (Frontmatter)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {Object.entries(frontmatterData).map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2">
                  <span className="text-slate-400 dark:text-neutral-500 text-[11px]">{k}:</span>
                  <span className="text-slate-800 dark:text-neutral-300 truncate" title={v}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body Elements */}
        {renderMarkdownElements()}
      </div>
    </div>
  );
};
