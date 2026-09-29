import { StructuredBlock } from './structureDetector';
import { ExtractedImageItem, PdfDocumentMetadata, PdfToMarkdownOptions } from './types';

/**
 * Builds YAML frontmatter block for the Markdown document
 */
export function generateYamlFrontmatter(
  metadata: PdfDocumentMetadata,
  stats: { totalPages: number; convertedPages: number }
): string {
  const lines: string[] = ['---'];

  if (metadata.title) {
    const cleanTitle = metadata.title.replace(/"/g, '\\"');
    lines.push(`title: "${cleanTitle}"`);
  }
  if (metadata.author) {
    const cleanAuthor = metadata.author.replace(/"/g, '\\"');
    lines.push(`author: "${cleanAuthor}"`);
  }
  if (metadata.subject) {
    lines.push(`subject: "${metadata.subject.replace(/"/g, '\\"')}"`);
  }
  lines.push(`source: "${metadata.originalFilename}"`);
  lines.push(`totalPages: ${stats.totalPages}`);
  lines.push(`convertedPages: ${stats.convertedPages}`);
  lines.push(`date: "${new Date().toISOString().split('T')[0]}"`);
  lines.push(`generator: "DocFusion PDF to Markdown"`);
  lines.push('---');

  return lines.join('\n');
}

/**
 * Converts a structured block into formatted Markdown text
 */
export function formatBlockToMarkdown(
  block: StructuredBlock,
  pageImages: ExtractedImageItem[],
  imageMode: 'extract_folder' | 'inline_base64' | 'skip'
): string {
  switch (block.type) {
    case 'heading': {
      const hashes = '#'.repeat(block.level || 2);
      return `${hashes} ${block.content || ''}`;
    }

    case 'paragraph': {
      return block.content || '';
    }

    case 'list': {
      if (!block.items || block.items.length === 0) return '';
      if (block.ordered) {
        return block.items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
      } else {
        return block.items.map((item) => `- ${item}`).join('\n');
      }
    }

    case 'table': {
      if (!block.tableData) return '';
      const { headers, rows } = block.tableData;
      if (headers.length === 0) return '';

      const colCount = Math.max(headers.length, ...rows.map((r) => r.length));
      const normalizedHeaders = [...headers];
      while (normalizedHeaders.length < colCount) normalizedHeaders.push('');

      const headerRow = `| ${normalizedHeaders.join(' | ')} |`;
      const separatorRow = `| ${normalizedHeaders.map(() => '---').join(' | ')} |`;

      const dataRows = rows.map((row) => {
        const normalizedRow = [...row];
        while (normalizedRow.length < colCount) normalizedRow.push('');
        return `| ${normalizedRow.join(' | ')} |`;
      });

      return [headerRow, separatorRow, ...dataRows].join('\n');
    }

    case 'code': {
      const lang = block.language || '';
      return `\`\`\`${lang}\n${block.content || ''}\n\`\`\``;
    }

    case 'blockquote': {
      const lines = (block.content || '').split('\n');
      return lines.map((l) => `> ${l}`).join('\n');
    }

    case 'hr': {
      return '---';
    }

    default:
      return block.content || '';
  }
}

/**
 * Generates final consolidated Markdown from all processed pages
 */
export function assembleMarkdownDocument(
  pageResults: {
    pageNumber: number;
    blocks: StructuredBlock[];
    ocrMarkdown?: string;
    images: ExtractedImageItem[];
  }[],
  metadata: PdfDocumentMetadata,
  options: PdfToMarkdownOptions
): {
  markdown: string;
  rawMarkdownWithoutFrontmatter: string;
  frontmatter: string;
} {
  const imageMode = options.imageMode || 'extract_folder';
  const pageSections: string[] = [];

  for (let i = 0; i < pageResults.length; i++) {
    const page = pageResults[i];
    const sectionParts: string[] = [];

    // Optional page separator comment
    if (pageResults.length > 1) {
      if (i > 0) {
        sectionParts.push('\n---\n');
      }
      sectionParts.push(`<!-- Page ${page.pageNumber} -->\n`);
    }

    // Insert extracted images for this page at the top or within flow
    if (imageMode !== 'skip' && page.images.length > 0) {
      const imgLinks = page.images.map((img) => {
        const src = imageMode === 'inline_base64' ? img.dataUrl : img.relativePath;
        return `![Image on Page ${page.pageNumber}](${src})`;
      });
      sectionParts.push(imgLinks.join('\n\n'));
    }

    // If OCR was performed for this page, use the high-fidelity OCR markdown
    if (page.ocrMarkdown) {
      sectionParts.push(page.ocrMarkdown);
    } else {
      // Format structured blocks
      for (const block of page.blocks) {
        const formatted = formatBlockToMarkdown(block, page.images, imageMode);
        if (formatted.trim()) {
          sectionParts.push(formatted);
        }
      }
    }

    pageSections.push(sectionParts.join('\n\n'));
  }

  const rawMarkdown = pageSections.join('\n\n').trim();

  const frontmatter = options.includeFrontmatter !== false
    ? generateYamlFrontmatter(metadata, {
        totalPages: metadata.pageCount,
        convertedPages: metadata.selectedPages.length,
      })
    : '';

  const finalMarkdown = frontmatter ? `${frontmatter}\n\n${rawMarkdown}` : rawMarkdown;

  return {
    markdown: finalMarkdown,
    rawMarkdownWithoutFrontmatter: rawMarkdown,
    frontmatter,
  };
}
