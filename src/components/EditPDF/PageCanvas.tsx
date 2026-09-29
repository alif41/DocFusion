import React, { useRef, useState } from 'react';
import { EditablePage, DocumentElement, TextElement, ImageElement, TableElement } from './types';
import { TextEditor } from './TextEditor';
import { ImageEditor } from './ImageEditor';
import { TableEditor } from './TableEditor';

interface PageCanvasProps {
  page: EditablePage;
  scale: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DocumentElement>) => void;
  onDeleteElement: (id: string) => void;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({
  page,
  scale,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
}) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const canvasWidth = page.width * scale;
  const canvasHeight = page.height * scale;

  // Handle element dragging
  const handleDragStart = (e: React.MouseEvent, element: DocumentElement) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveDragId(element.id);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startElemX = element.x;
    const startElemY = element.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startMouseX) / scale;
      const deltaY = (moveEvent.clientY - startMouseY) / scale;

      const newX = Math.max(0, Math.min(page.width - element.width, startElemX + deltaX));
      const newY = Math.max(0, Math.min(page.height - element.height, startElemY + deltaY));

      onUpdateElement(element.id, {
        x: Math.round(newX),
        y: Math.round(newY),
      });
    };

    const onMouseUp = () => {
      setActiveDragId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      className="flex-1 overflow-auto flex items-start justify-center p-6 sm:p-10 bg-[#0c0c16] relative select-none"
      onClick={() => onSelectElement(null)}
    >
      {/* Paper Container: clean document page like Microsoft Word */}
      <div
        ref={canvasRef}
        className="relative bg-white text-black border border-neutral-300 shadow-lg transition-all duration-75 select-none"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
        }}
      >
        {/* Real Document Structure Layer: renders all borders, logos, dividing lines, vectors, and page design */}
        {page.backgroundUrl && (
          <img
            src={page.backgroundUrl}
            alt="Page Background"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        )}

        {/* Render Editable Document Elements */}
        {page.elements.map((el) => {
          const isSelected = el.id === selectedElementId;

          if (el.type === 'image') {
            return (
              <ImageEditor
                key={el.id}
                element={el as ImageElement}
                isSelected={isSelected}
                onSelect={() => onSelectElement(el.id)}
                onChange={(updates) => onUpdateElement(el.id, updates)}
                onDelete={() => onDeleteElement(el.id)}
                onDragStart={(e) => handleDragStart(e, el)}
                scale={scale}
              />
            );
          }

          if (el.type === 'table') {
            return (
              <TableEditor
                key={el.id}
                element={el as TableElement}
                isSelected={isSelected}
                onSelect={() => onSelectElement(el.id)}
                onChange={(updates) => onUpdateElement(el.id, updates)}
                onDelete={() => onDeleteElement(el.id)}
                onDragStart={(e) => handleDragStart(e, el)}
                scale={scale}
              />
            );
          }

          // Text Element (text / heading / paragraph / list_item)
          return (
            <TextEditor
              key={el.id}
              element={el as TextElement}
              isSelected={isSelected}
              onSelect={() => onSelectElement(el.id)}
              onChange={(updates) => onUpdateElement(el.id, updates)}
              onDragStart={(e) => handleDragStart(e, el)}
              scale={scale}
            />
          );
        })}
      </div>
    </div>
  );
};
