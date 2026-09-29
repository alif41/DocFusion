import React, { useState } from 'react';
import { ImageElement } from './types';
import { Move, Trash2, Maximize2 } from 'lucide-react';

interface ImageEditorProps {
  element: ImageElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updated: Partial<ImageElement>) => void;
  onDelete: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  scale: number;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  onDragStart,
  scale,
}) => {
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const handleResizeStart = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const startLeft = element.x;
    const startTop = element.y;
    const aspect = startWidth / startHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startLeft;
      let newTop = startTop;

      if (corner === 'se') {
        newWidth = Math.max(30, startWidth + deltaX);
        newHeight = newWidth / aspect;
      } else if (corner === 'sw') {
        newWidth = Math.max(30, startWidth - deltaX);
        newHeight = newWidth / aspect;
        newX = startLeft + (startWidth - newWidth);
      } else if (corner === 'ne') {
        newWidth = Math.max(30, startWidth + deltaX);
        newHeight = newWidth / aspect;
        newTop = startTop + (startHeight - newHeight);
      } else if (corner === 'nw') {
        newWidth = Math.max(30, startWidth - deltaX);
        newHeight = newWidth / aspect;
        newX = startLeft + (startWidth - newWidth);
        newTop = startTop + (startHeight - newHeight);
      }

      onChange({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
        x: Math.round(newX),
        y: Math.round(newTop),
      });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`absolute group select-none ${
        isSelected
          ? 'ring-2 ring-[#7c3aed] ring-offset-1 z-20'
          : 'hover:ring-1 hover:ring-[#7c3aed]/50'
      }`}
      style={{
        left: `${element.x * scale}px`,
        top: `${element.y * scale}px`,
        width: `${element.width * scale}px`,
        height: `${element.height * scale}px`,
      }}
    >
      {/* Top action badge when selected */}
      {isSelected && (
        <div className="absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#7c3aed] text-white text-[10px] font-mono z-30">
          <div onMouseDown={onDragStart} className="flex items-center gap-1 cursor-grab active:cursor-grabbing">
            <Move className="w-3 h-3" />
            <span>Move</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-2 hover:text-red-300 cursor-pointer"
            title="Delete Image"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Image Content */}
      <img
        src={element.src}
        alt={element.alt || 'Document graphic'}
        className="w-full h-full object-contain pointer-events-none rounded-sm"
        style={{ opacity: element.opacity ?? 1 }}
      />

      {/* Resize corner handles when selected */}
      {isSelected && (
        <>
          <div
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#7c3aed] rounded-full cursor-nwse-resize z-30"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#7c3aed] rounded-full cursor-nesw-resize z-30"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#7c3aed] rounded-full cursor-nesw-resize z-30"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#7c3aed] rounded-full cursor-nwse-resize z-30"
          />
        </>
      )}
    </div>
  );
};
