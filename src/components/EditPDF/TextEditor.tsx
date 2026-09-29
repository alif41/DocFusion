import React, { useRef, useEffect } from 'react';
import { TextElement } from './types';
import { Move, Sparkles } from 'lucide-react';

interface TextEditorProps {
  element: TextElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updated: Partial<TextElement>) => void;
  onDragStart: (e: React.MouseEvent) => void;
  scale: number;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  scale,
}) => {
  const textRef = useRef<HTMLDivElement | null>(null);

  // Sync contenteditable text with element.text when not actively editing
  useEffect(() => {
    if (textRef.current && document.activeElement !== textRef.current) {
      if (textRef.current.innerText !== element.text) {
        textRef.current.innerText = element.text;
      }
    }
  }, [element.text]);

  const handleInput = () => {
    if (textRef.current) {
      const newText = textRef.current.innerText;
      onChange({ text: newText });
    }
  };

  const getFontFamilyCSS = (font: string) => {
    switch (font) {
      case 'Times New Roman':
        return 'Times New Roman, Times, serif';
      case 'Courier New':
        return 'Courier New, Courier, monospace';
      case 'Georgia':
        return 'Georgia, serif';
      case 'Helvetica':
        return 'Helvetica, Arial, sans-serif';
      default:
        return 'Inter, system-ui, -apple-system, sans-serif';
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group absolute select-none ${
        isSelected
          ? 'outline outline-1.5 outline-[#7c3aed] z-20'
          : 'hover:outline hover:outline-1 hover:outline-neutral-300/80'
      }`}
      style={{
        left: `${element.x * scale}px`,
        top: `${element.y * scale}px`,
        minWidth: `${Math.max(element.width * scale, 40)}px`,
        minHeight: `${Math.max(element.height * scale, 18)}px`,
      }}
    >
      {/* Drag handle when selected */}
      {isSelected && (
        <div
          onMouseDown={onDragStart}
          className="absolute -top-6 -left-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#7c3aed] text-white text-[10px] font-mono cursor-grab active:cursor-grabbing z-30 select-none"
          title="Drag to reposition text block"
        >
          <Move className="w-3 h-3" />
          <span>Move</span>
          {element.isOCRText && (
            <span className="flex items-center gap-0.5 text-cyan-200 ml-1">
              <Sparkles className="w-2.5 h-2.5" />
              OCR
            </span>
          )}
        </div>
      )}

      {/* Editable Content Container */}
      <div
        ref={textRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        className="outline-none whitespace-pre-wrap break-words px-1 py-0.5 cursor-text"
        style={{
          fontFamily: getFontFamilyCSS(element.fontFamily),
          fontSize: `${element.fontSize * scale}px`,
          fontWeight: element.fontWeight === 'bold' ? 700 : 400,
          fontStyle: element.fontStyle,
          textDecoration: [
            element.underline ? 'underline' : '',
            element.strikethrough ? 'line-through' : '',
          ]
            .filter(Boolean)
            .join(' ') || 'none',
          color: element.color || '#111827',
          backgroundColor:
            element.backgroundColor && element.backgroundColor !== 'transparent'
              ? element.backgroundColor
              : undefined,
          textAlign: element.textAlign || 'left',
          lineHeight: element.lineHeight || 1.35,
          paddingLeft: element.indent ? `${element.indent * 16 * scale}px` : undefined,
        }}
      />
    </div>
  );
};
