import { LayoutLine, ExtractedPageLayout } from './layoutExtractor';

export interface StructuredBlock {
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'code' | 'blockquote' | 'hr';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  content?: string;
  items?: string[]; // for lists
  ordered?: boolean;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  language?: string;
}

/**
 * Formats inline Markdown elements (bold, italic, code, links) within a line's text items
 */
export function formatInlineMarkdown(line: LayoutLine): string {
  if (line.items.length === 0) return line.text;

  let result = '';
  for (let i = 0; i < line.items.length; i++) {
    const item = line.items[i];
    let str = item.str;

    if (item.linkUrl) {
      str = `[${str}](${item.linkUrl})`;
    } else if (item.isMonospace && !str.includes('`')) {
      str = `\`${str}\``;
    } else {
      if (item.isBold && item.isItalic && !str.startsWith('***')) {
        str = `***${str}***`;
      } else if (item.isBold && !str.startsWith('**') && !line.isHeadingCandidate) {
        str = `**${str}**`;
      } else if (item.isItalic && !str.startsWith('*') && !line.isHeadingCandidate) {
        str = `*${str}*`;
      }
    }

    if (result.length > 0 && !result.endsWith(' ') && !str.startsWith(' ')) {
      result += ' ';
    }
    result += str;
  }

  // Fallback to line.text if formatting resulted in empty
  return result.trim() || line.text;
}

/**
 * Detects high-level document structures (Headings, Tables, Lists, Code, Quotes, Paragraphs)
 */
export function detectPageStructure(
  layout: ExtractedPageLayout,
  options: {
    detectTables?: boolean;
    detectCodeBlocks?: boolean;
    cleanPageArtifacts?: boolean;
  }
): StructuredBlock[] {
  const blocks: StructuredBlock[] = [];
  const lines = layout.lines;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Filter out isolated page footers/headers if requested
    if (options.cleanPageArtifacts) {
      if (
        (i === 0 || i === lines.length - 1) &&
        (/^page\s+\d+(\s+of\s+\d+)?$/i.test(line.text) || /^\d+$/.test(line.text))
      ) {
        i++;
        continue;
      }
    }

    // 1. Table Detection
    if (options.detectTables && line.isTableCandidate && line.columnTokens.length >= 2) {
      const tableRows: string[][] = [line.columnTokens];
      let j = i + 1;

      while (j < lines.length) {
        const nextLine = lines[j];
        if (nextLine.isTableCandidate && nextLine.columnTokens.length >= 2) {
          tableRows.push(nextLine.columnTokens);
          j++;
        } else if (nextLine.columnTokens.length === 1 && tableRows.length > 0) {
          // Wrapped cell in previous row candidate
          break;
        } else {
          break;
        }
      }

      if (tableRows.length >= 2) {
        // Normalize column count across all rows
        const maxCols = Math.max(...tableRows.map((r) => r.length));
        const normalizedRows = tableRows.map((r) => {
          const row = [...r];
          while (row.length < maxCols) row.push('');
          return row.map((cell) => cell.replace(/\|/g, '\\|').trim());
        });

        const headers = normalizedRows[0];
        const dataRows = normalizedRows.slice(1);

        blocks.push({
          type: 'table',
          tableData: {
            headers,
            rows: dataRows,
          },
        });

        i = j;
        continue;
      }
    }

    // 2. Code Block Detection
    if (options.detectCodeBlocks && line.isMonospace) {
      const codeLines: string[] = [line.text];
      let j = i + 1;
      while (j < lines.length && (lines[j].isMonospace || lines[j].text.startsWith('    '))) {
        codeLines.push(lines[j].text);
        j++;
      }

      if (codeLines.length >= 2 || line.text.includes('{') || line.text.includes('function') || line.text.includes('class ')) {
        blocks.push({
          type: 'code',
          content: codeLines.join('\n'),
        });
        i = j;
        continue;
      }
    }

    // 3. Heading Detection
    if (line.isHeadingCandidate && line.headingLevel) {
      blocks.push({
        type: 'heading',
        level: line.headingLevel,
        content: line.text,
      });
      i++;
      continue;
    }

    // 4. List Detection (Bulleted or Numbered)
    if (line.isListItemCandidate) {
      const listItems: string[] = [];
      const isOrdered = /^\d+[\.\)]/.test(line.text);
      let j = i;

      while (j < lines.length) {
        const cur = lines[j];
        if (cur.isListItemCandidate) {
          // Strip bullet or number prefix
          const cleaned = cur.text.replace(/^([•\-\*▪▫]|\d+[\.\)]|[a-zA-Z][\.\)])\s+/, '');
          listItems.push(cleaned);
          j++;
        } else if (
          j > i &&
          !cur.isHeadingCandidate &&
          !cur.isTableCandidate &&
          cur.x > lines[i].x + 10
        ) {
          // Indented continuation of previous list item
          if (listItems.length > 0) {
            listItems[listItems.length - 1] += ' ' + cur.text;
          }
          j++;
        } else {
          break;
        }
      }

      blocks.push({
        type: 'list',
        ordered: isOrdered,
        items: listItems,
      });

      i = j;
      continue;
    }

    // 5. Blockquote Detection
    if (line.isBlockquoteCandidate) {
      const quoteLines: string[] = [line.text.replace(/^>\s*/, '')];
      let j = i + 1;
      while (j < lines.length && (lines[j].isBlockquoteCandidate || lines[j].isItalic)) {
        quoteLines.push(lines[j].text.replace(/^>\s*/, ''));
        j++;
      }

      blocks.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
      });
      i = j;
      continue;
    }

    // 6. Regular Paragraph (with multi-line grouping)
    const paraLines: string[] = [formatInlineMarkdown(line)];
    let j = i + 1;

    while (j < lines.length) {
      const nextLine = lines[j];
      if (
        nextLine.isHeadingCandidate ||
        nextLine.isTableCandidate ||
        nextLine.isListItemCandidate ||
        nextLine.isBlockquoteCandidate ||
        (options.detectCodeBlocks && nextLine.isMonospace)
      ) {
        break;
      }

      // Check distance between lines
      const prevLine = lines[j - 1];
      const gap = nextLine.y - prevLine.y;
      if (gap > prevLine.fontSize * 2.4) {
        // Large gap signifies separate paragraph
        break;
      }

      paraLines.push(formatInlineMarkdown(nextLine));
      j++;
    }

    blocks.push({
      type: 'paragraph',
      content: paraLines.join(' '),
    });

    i = j;
  }

  return blocks;
}
