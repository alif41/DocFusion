export interface LayoutItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
  isMonospace: boolean;
  linkUrl?: string;
}

export interface LayoutLine {
  y: number;
  x: number;
  width: number;
  text: string;
  fontSize: number;
  isHeadingCandidate: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  isBold: boolean;
  isItalic: boolean;
  isMonospace: boolean;
  items: LayoutItem[];
  columnTokens: string[];
  isTableCandidate: boolean;
  isListItemCandidate: boolean;
  listBullet?: string;
  isBlockquoteCandidate: boolean;
  linkUrls: string[];
}

export interface ExtractedPageLayout {
  pageNumber: number;
  width: number;
  height: number;
  lines: LayoutLine[];
  avgFontSize: number;
  isMultiColumn: boolean;
  annotations: { x: number; y: number; width: number; height: number; url: string }[];
}

/**
 * Extracts and reconstructs layout lines with reading order from a PDF page
 */
export async function extractPageLayout(
  pdfPage: any,
  pageNumber: number
): Promise<ExtractedPageLayout> {
  const viewport = pdfPage.getViewport({ scale: 1.0 });
  const textContent = await pdfPage.getTextContent();

  // Extract link annotations if available
  let annotations: { x: number; y: number; width: number; height: number; url: string }[] = [];
  try {
    const annots = await pdfPage.getAnnotations();
    for (const a of annots || []) {
      if (a.subtype === 'Link' && a.url) {
        const rect = a.rect || [0, 0, 0, 0];
        // rect in PDF: [x1, y1, x2, y2] (bottom-left origin)
        const x = rect[0];
        const y = viewport.height - rect[3];
        const width = rect[2] - rect[0];
        const height = rect[3] - rect[1];
        annotations.push({ x, y, width, height, url: a.url });
      }
    }
  } catch {
    // annotations may not be supported or empty
  }

  const rawItems: LayoutItem[] = [];

  for (const item of textContent.items as any[]) {
    if (!item.str || item.str.trim() === '') continue;

    const transform = item.transform;
    const rawX = transform[4];
    const rawY = transform[5];
    const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]) || 12;
    const x = Math.round(rawX * 10) / 10;
    const y = Math.round((viewport.height - rawY) * 10) / 10;

    const fontName = (item.fontName || '').toLowerCase();
    const isBold =
      fontName.includes('bold') ||
      fontName.includes('black') ||
      fontName.includes('heavy') ||
      fontName.includes('700') ||
      fontName.includes('semibold');
    const isItalic = fontName.includes('italic') || fontName.includes('oblique');
    const isMonospace =
      fontName.includes('mono') ||
      fontName.includes('courier') ||
      fontName.includes('consolas') ||
      fontName.includes('code');

    // Check if this text overlaps with a link annotation
    let linkUrl: string | undefined = undefined;
    for (const a of annotations) {
      if (
        x >= a.x - 5 &&
        x <= a.x + a.width + 5 &&
        y >= a.y - 5 &&
        y <= a.y + a.height + 5
      ) {
        linkUrl = a.url;
        break;
      }
    }

    rawItems.push({
      str: item.str,
      x,
      y,
      width: item.width || item.str.length * fontSize * 0.5,
      height: item.height || fontSize,
      fontSize: Math.round(fontSize * 10) / 10,
      fontName: item.fontName || 'Default',
      isBold,
      isItalic,
      isMonospace,
      linkUrl,
    });
  }

  // Calculate average font size
  let totalFontSize = 0;
  let totalChars = 0;
  for (const it of rawItems) {
    totalFontSize += it.fontSize * it.str.length;
    totalChars += it.str.length;
  }
  const avgFontSize = totalChars > 0 ? totalFontSize / totalChars : 12;

  // Detect multi-column: check if items are clustered into 2 distinct horizontal halves
  const midX = viewport.width / 2;
  let leftItemsCount = 0;
  let rightItemsCount = 0;
  for (const it of rawItems) {
    if (it.x + it.width < midX - 20) leftItemsCount++;
    else if (it.x > midX + 20) rightItemsCount++;
  }
  const isMultiColumn =
    leftItemsCount > 15 && rightItemsCount > 15 && Math.abs(leftItemsCount - rightItemsCount) < leftItemsCount * 0.8;

  // Function to group a set of items into lines
  const groupItemsToLines = (itemsList: LayoutItem[]): LayoutLine[] => {
    // Sort items by Y, then X
    itemsList.sort((a, b) => {
      if (Math.abs(a.y - b.y) <= 3) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    const buckets: LayoutItem[][] = [];
    for (const item of itemsList) {
      let placed = false;
      for (const bucket of buckets) {
        const avgY = bucket.reduce((sum, it) => sum + it.y, 0) / bucket.length;
        if (Math.abs(item.y - avgY) <= Math.max(3.5, item.fontSize * 0.35)) {
          bucket.push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        buckets.push([item]);
      }
    }

    // Sort buckets top to bottom
    buckets.sort((a, b) => {
      const aY = a.reduce((sum, it) => sum + it.y, 0) / a.length;
      const bY = b.reduce((sum, it) => sum + it.y, 0) / b.length;
      return aY - bY;
    });

    const lines: LayoutLine[] = [];

    for (const bucket of buckets) {
      bucket.sort((a, b) => a.x - b.x);

      let lineText = '';
      let maxFontSize = 0;
      let hasBold = false;
      let hasItalic = false;
      let hasMono = false;
      const columnTokens: string[] = [];
      let currentToken = '';
      let lastXEnd = -1;
      const linkUrls: string[] = [];

      for (const it of bucket) {
        if (it.fontSize > maxFontSize) maxFontSize = it.fontSize;
        if (it.isBold) hasBold = true;
        if (it.isItalic) hasItalic = true;
        if (it.isMonospace) hasMono = true;
        if (it.linkUrl && !linkUrls.includes(it.linkUrl)) linkUrls.push(it.linkUrl);

        const gap = lastXEnd >= 0 ? it.x - lastXEnd : 0;
        if (gap > 24 && currentToken.trim()) {
          columnTokens.push(currentToken.trim());
          currentToken = '';
        }

        if (gap > 3 && lineText.length > 0 && !lineText.endsWith(' ')) {
          lineText += ' ';
          currentToken += ' ';
        }

        lineText += it.str;
        currentToken += it.str;
        lastXEnd = it.x + it.width;
      }

      if (currentToken.trim()) {
        columnTokens.push(currentToken.trim());
      }

      const trimmedText = lineText.trim();
      if (!trimmedText) continue;

      const isHeadingCandidate =
        maxFontSize >= avgFontSize * 1.25 ||
        (hasBold && maxFontSize >= avgFontSize * 1.1 && trimmedText.length < 80);

      let headingLevel: 1 | 2 | 3 | 4 | 5 | 6 | undefined = undefined;
      if (isHeadingCandidate) {
        if (maxFontSize >= avgFontSize * 1.8) headingLevel = 1;
        else if (maxFontSize >= avgFontSize * 1.45) headingLevel = 2;
        else if (maxFontSize >= avgFontSize * 1.25) headingLevel = 3;
        else headingLevel = 4;
      }

      // Check list bullet candidate
      const bulletMatch = trimmedText.match(/^([•\-\*▪▫]|\d+[\.\)]|[a-zA-Z][\.\)])\s+/);
      const isListItemCandidate = !!bulletMatch;
      const listBullet = bulletMatch ? bulletMatch[1] : undefined;

      // Check blockquote candidate: line starts with > or is indented with italic/distinct style
      const isBlockquoteCandidate = trimmedText.startsWith('>') || (hasItalic && bucket[0].x > 60 && !isHeadingCandidate);

      const avgY = bucket.reduce((sum, it) => sum + it.y, 0) / bucket.length;
      const minX = bucket[0].x;
      const maxX = bucket[bucket.length - 1].x + bucket[bucket.length - 1].width;

      lines.push({
        y: Math.round(avgY * 10) / 10,
        x: Math.round(minX * 10) / 10,
        width: Math.round((maxX - minX) * 10) / 10,
        text: trimmedText,
        fontSize: maxFontSize || 12,
        isHeadingCandidate,
        headingLevel,
        isBold: hasBold,
        isItalic: hasItalic,
        isMonospace: hasMono,
        items: bucket,
        columnTokens,
        isTableCandidate: columnTokens.length >= 2,
        isListItemCandidate,
        listBullet,
        isBlockquoteCandidate,
        linkUrls,
      });
    }

    return lines;
  };

  let finalLines: LayoutLine[] = [];

  if (isMultiColumn) {
    // Process left column, then right column
    const leftItems = rawItems.filter((it) => it.x + it.width <= midX);
    const rightItems = rawItems.filter((it) => it.x > midX);
    const fullSpanItems = rawItems.filter((it) => it.x < midX && it.x + it.width > midX);

    const fullSpanLines = groupItemsToLines(fullSpanItems);
    const leftLines = groupItemsToLines(leftItems);
    const rightLines = groupItemsToLines(rightItems);

    // Sort full span lines (e.g. title/abstract) at top if y < first column line
    const topFullSpan = fullSpanLines.filter((l) => l.y < (leftLines[0]?.y ?? 9999));
    const bottomFullSpan = fullSpanLines.filter((l) => l.y >= (leftLines[0]?.y ?? 9999));

    finalLines = [...topFullSpan, ...leftLines, ...rightLines, ...bottomFullSpan];
  } else {
    finalLines = groupItemsToLines(rawItems);
  }

  return {
    pageNumber,
    width: Math.round(viewport.width),
    height: Math.round(viewport.height),
    lines: finalLines,
    avgFontSize,
    isMultiColumn,
    annotations,
  };
}
