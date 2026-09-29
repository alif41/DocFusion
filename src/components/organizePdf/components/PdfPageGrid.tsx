import React from 'react';
import { OrganizePageItem, DragState } from '../types';
import { PdfPageCard } from './PdfPageCard';

interface PdfPageGridProps {
  pages: OrganizePageItem[];
  selectedPageIds: Set<string>;
  dragState: DragState;
  zoomLevel: number;
  onToggleSelect: (pageId: string, shiftKey: boolean) => void;
  onDragStart: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDragOver: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDragLeave: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDrop: (e: React.DragEvent, page: OrganizePageItem) => void;
  onDragEnd: () => void;
  onQuickMove: (pageId: string, direction: 'first' | 'left' | 'right' | 'last') => void;
}

export const PdfPageGrid: React.FC<PdfPageGridProps> = ({
  pages,
  selectedPageIds,
  dragState,
  zoomLevel,
  onToggleSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onQuickMove,
}) => {
  // Determine dynamic responsive grid column classes based on zoom level
  const getGridColsClass = () => {
    switch (zoomLevel) {
      case 75:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5';
      case 125:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5';
      case 150:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6';
      case 100:
      default:
        return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5';
    }
  };

  return (
    <div className={`grid ${getGridColsClass()} transition-all duration-200`}>
      {pages.map((page, index) => (
        <PdfPageCard
          key={page.id}
          page={page}
          index={index}
          totalCount={pages.length}
          isSelected={selectedPageIds.has(page.id)}
          dragState={dragState}
          onToggleSelect={onToggleSelect}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          onQuickMove={onQuickMove}
        />
      ))}
    </div>
  );
};
