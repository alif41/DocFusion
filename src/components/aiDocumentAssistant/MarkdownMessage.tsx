import React from 'react';
import { BookOpen } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
  onCitationClick?: (pageNumber: number) => void;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, onCitationClick }) => {
  // Format inline text: bold, italic, inline code, and clickable [Page X] citations
  const formatInlineText = (text: string) => {
    // Split by citation brackets [Page X] or [Page X, Y]
    const citationRegex = /(\[Page\s*\d+(?:,\s*\d+)*\])/gi;
    const parts = text.split(citationRegex);

    return parts.map((part, idx) => {
      // Check if this part is a citation like [Page 2]
      const match = part.match(/\[Page\s*(\d+)/i);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        return (
          <button
            key={`cite-${idx}`}
            type="button"
            onClick={() => onCitationClick && onCitationClick(pageNum)}
            className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#7c3aed]/20 hover:bg-[#7c3aed]/35 border border-[#7c3aed]/40 text-[#c084fc] hover:text-white transition-all cursor-pointer shadow-xs"
            title={`Jump to Page ${pageNum}`}
          >
            <BookOpen className="w-3 h-3 text-[#a78bfa]" />
            <span>{part.replace(/[\[\]]/g, '')}</span>
          </button>
        );
      }

      // Format bold **text**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={`txt-${idx}`}>
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith('**') && bPart.endsWith('**')) {
              const boldContent = bPart.slice(2, -2);
              return (
                <strong key={`b-${bIdx}`} className="font-bold text-white">
                  {boldContent}
                </strong>
              );
            }

            // Inline code `code`
            const codeParts = bPart.split(/(`[^`]+`)/g);
            return codeParts.map((cPart, cIdx) => {
              if (cPart.startsWith('`') && cPart.endsWith('`')) {
                return (
                  <code
                    key={`c-${cIdx}`}
                    className="font-mono text-xs px-1.5 py-0.5 rounded bg-black/40 border border-[#2d2d42] text-[#e0e7ff]"
                  >
                    {cPart.slice(1, -1)}
                  </code>
                );
              }
              return cPart;
            });
          })}
        </span>
      );
    });
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  const flushTable = () => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-xl border border-[#28283e] bg-[#0c0c16]/90">
          <table className="w-full text-left text-xs border-collapse font-sans">
            {tableHeaders.length > 0 && (
              <thead>
                <tr className="bg-[#161626] border-b border-[#28283e]">
                  {tableHeaders.map((header, i) => (
                    <th key={i} className="py-2.5 px-3.5 font-bold text-white tracking-wider">
                      {formatInlineText(header.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-[#202034]">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3.5 text-neutral-300">
                      {formatInlineText(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Markdown Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.slice(1, -1).split('|');
      // Check if separator row like |---|---|
      const isSeparator = cells.every((c) => /^\s*[-:]+\s*$/.test(c));

      if (isSeparator) {
        inTable = true;
        continue;
      }

      if (!inTable && tableHeaders.length === 0) {
        tableHeaders = cells;
        inTable = true;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-lg sm:text-xl font-extrabold text-white mt-4 mb-2 flex items-center gap-2 border-b border-[#24243a] pb-1.5">
          {formatInlineText(trimmed.slice(2))}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-base sm:text-lg font-bold text-white mt-3.5 mb-1.5 text-[#e2e8f0]">
          {formatInlineText(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm sm:text-base font-semibold text-[#a78bfa] mt-3 mb-1">
          {formatInlineText(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // Bullet list items
    if (/^[-*•]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*•]\s+/, '');
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-1 text-xs sm:text-sm text-neutral-300 pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] mt-1.5 shrink-0" />
          <span className="flex-1 leading-relaxed">{formatInlineText(itemText)}</span>
        </div>
      );
      continue;
    }

    // Numbered list items
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        elements.push(
          <div key={`nli-${i}`} className="flex items-start gap-2 my-1.5 text-xs sm:text-sm text-neutral-300 pl-1">
            <span className="font-mono font-bold text-xs text-[#a78bfa] shrink-0 mt-0.5 min-w-[18px]">
              {match[1]}.
            </span>
            <span className="flex-1 leading-relaxed">{formatInlineText(match[2])}</span>
          </div>
        );
        continue;
      }
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-2 border-l-2 border-[#7c3aed] pl-3 py-1 italic text-xs sm:text-sm text-neutral-400 bg-white/[0.02] rounded-r-lg"
        >
          {formatInlineText(trimmed.slice(1).trim())}
        </blockquote>
      );
      continue;
    }

    // Empty line spacing
    if (trimmed === '') {
      elements.push(<div key={`sp-${i}`} className="h-2" />);
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${i}`} className="text-xs sm:text-sm text-neutral-200 leading-relaxed my-1">
        {formatInlineText(line)}
      </p>
    );
  }

  if (inTable) {
    flushTable();
  }

  return <div className="space-y-0.5 select-text">{elements}</div>;
};
