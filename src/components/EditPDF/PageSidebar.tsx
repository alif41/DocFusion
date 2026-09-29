import React from 'react';
import {
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
} from 'lucide-react';
import { EditablePage } from './types';

interface PageSidebarProps {
  pages: EditablePage[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onAddBlankPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PageSidebar: React.FC<PageSidebarProps> = ({
  pages,
  currentPageIndex,
  onSelectPage,
  onAddBlankPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  zoom,
  onZoomChange,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div
      className={`h-full bg-[#10101c] border-r border-[#262638] flex flex-col transition-all duration-300 relative z-20 ${
        isCollapsed ? 'w-12' : 'w-64 sm:w-72'
      }`}
    >
      {/* Top Header */}
      <div className="p-3 border-b border-[#222234] flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#a78bfa]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Pages ({pages.length})
            </span>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1a1a2b] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand page sidebar' : 'Collapse page sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Page Thumbnails List */}
      {!isCollapsed ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {pages.map((page, index) => {
            const isSelected = index === currentPageIndex;

            return (
              <div
                key={page.id}
                onClick={() => onSelectPage(index)}
                className={`group relative rounded-xl border p-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#7c3aed] bg-[#7c3aed]/10 ring-2 ring-[#7c3aed]/30 shadow-lg shadow-[#7c3aed]/10'
                    : 'border-[#262638] bg-[#141424] hover:border-[#383854] hover:bg-[#18182b]'
                }`}
              >
                {/* Header / Page Number & Quick Actions */}
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span
                    className={`text-[11px] font-bold ${
                      isSelected ? 'text-[#a78bfa]' : 'text-neutral-400 group-hover:text-neutral-200'
                    }`}
                  >
                    Page {index + 1}
                  </span>

                  <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Move Up */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index > 0) onMovePage(index, index - 1);
                      }}
                      disabled={index === 0}
                      className="p-1 text-neutral-400 hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move page up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index < pages.length - 1) onMovePage(index, index + 1);
                      }}
                      disabled={index === pages.length - 1}
                      className="p-1 text-neutral-400 hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move page down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicatePage(index);
                      }}
                      className="p-1 text-neutral-400 hover:text-[#a78bfa] cursor-pointer"
                      title="Duplicate page"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pages.length > 1) {
                          onDeletePage(index);
                        }
                      }}
                      disabled={pages.length <= 1}
                      className="p-1 text-neutral-400 hover:text-red-400 disabled:opacity-20 cursor-pointer"
                      title="Delete page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail Preview Paper */}
                <div className="relative aspect-[1/1.414] w-full rounded-lg bg-white overflow-hidden shadow-inner flex items-center justify-center border border-neutral-300">
                  {page.thumbnailUrl ? (
                    <img
                      src={page.thumbnailUrl}
                      alt={`Page ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : page.backgroundUrl ? (
                    <img
                      src={page.backgroundUrl}
                      alt={`Page ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-[10px] text-neutral-400 font-sans p-2 text-center">
                      Blank Page {index + 1}
                    </div>
                  )}

                  {/* Elements overlay count indicator */}
                  {page.elements.length > 0 && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/75 text-white">
                      {page.elements.length} items
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Insert Blank Page Button */}
          <button
            onClick={onAddBlankPage}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#383854] hover:border-[#7c3aed] bg-[#141424] hover:bg-[#7c3aed]/10 text-neutral-300 hover:text-[#a78bfa] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Insert Blank Page</span>
          </button>
        </div>
      ) : (
        /* Collapsed Column: quick page dots */
        <div className="flex-1 overflow-y-auto p-1.5 space-y-2 flex flex-col items-center">
          {pages.map((_, index) => {
            const isSelected = index === currentPageIndex;
            return (
              <button
                key={index}
                onClick={() => onSelectPage(index)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/30'
                    : 'bg-[#18182b] text-neutral-400 hover:text-white'
                }`}
                title={`Page ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}
          <button
            onClick={onAddBlankPage}
            className="w-8 h-8 rounded-lg border border-dashed border-[#383854] hover:border-[#7c3aed] flex items-center justify-center text-neutral-400 hover:text-[#a78bfa] cursor-pointer"
            title="Add blank page"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Zoom & View Controls */}
      <div className="p-3 border-t border-[#222234] bg-[#0c0c16]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">Zoom</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onZoomChange(Math.max(0.5, +(zoom - 0.1).toFixed(2)))}
                className="p-1 rounded-md text-neutral-300 hover:text-white hover:bg-[#1f1f33] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onZoomChange(1.0)}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono text-neutral-200 hover:bg-[#1f1f33] cursor-pointer"
                title="Reset zoom to 100%"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                onClick={() => onZoomChange(Math.min(2.0, +(zoom + 0.1).toFixed(2)))}
                className="p-1 rounded-md text-neutral-300 hover:text-white hover:bg-[#1f1f33] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onZoomChange(Math.min(2.0, +(zoom + 0.1).toFixed(2)))}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-neutral-400">
              {Math.round(zoom * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
