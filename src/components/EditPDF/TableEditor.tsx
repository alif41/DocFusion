import React from 'react';
import { TableElement, TableCell } from './types';
import { Move, Plus, Trash2, Rows, Columns } from 'lucide-react';

interface TableEditorProps {
  element: TableElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updated: Partial<TableElement>) => void;
  onDelete: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  scale: number;
}

export const TableEditor: React.FC<TableEditorProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  onDragStart,
  scale,
}) => {
  const handleCellTextChange = (rowIndex: number, colIndex: number, newText: string) => {
    const newCells = element.cells.map((row, r) =>
      row.map((cell, c) => {
        if (r === rowIndex && c === colIndex) {
          return { ...cell, text: newText };
        }
        return cell;
      })
    );
    onChange({ cells: newCells });
  };

  const handleAddRow = () => {
    const newRowIndex = element.rows;
    const newRowCells: TableCell[] = Array.from({ length: element.cols }, (_, c) => ({
      id: `cell_${newRowIndex}_${c}_${Date.now()}`,
      text: '',
      fontSize: 10,
    }));
    onChange({
      rows: element.rows + 1,
      cells: [...element.cells, newRowCells],
      height: element.height + 24,
    });
  };

  const handleRemoveRow = () => {
    if (element.rows <= 1) return;
    const newCells = element.cells.slice(0, -1);
    onChange({
      rows: element.rows - 1,
      cells: newCells,
      height: Math.max(30, element.height - 24),
    });
  };

  const handleAddCol = () => {
    const newColIndex = element.cols;
    const newCells = element.cells.map((row, r) => [
      ...row,
      {
        id: `cell_${r}_${newColIndex}_${Date.now()}`,
        text: '',
        fontSize: 10,
      },
    ]);
    onChange({
      cols: element.cols + 1,
      cells: newCells,
      width: element.width + 60,
    });
  };

  const handleRemoveCol = () => {
    if (element.cols <= 1) return;
    const newCells = element.cells.map((row) => row.slice(0, -1));
    onChange({
      cols: element.cols - 1,
      cells: newCells,
      width: Math.max(60, element.width - 60),
    });
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
          : 'hover:ring-1 hover:ring-blue-400/60'
      }`}
      style={{
        left: `${element.x * scale}px`,
        top: `${element.y * scale}px`,
        width: `${element.width * scale}px`,
        height: `${element.height * scale}px`,
      }}
    >
      {/* Table Toolbar when selected */}
      {isSelected && (
        <div className="absolute -top-8 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e1e30] border border-[#363652] text-white text-[11px] font-sans z-30 whitespace-nowrap">
          <div onMouseDown={onDragStart} className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-neutral-300 hover:text-white mr-1">
            <Move className="w-3 h-3" />
            <span>Move</span>
          </div>

          <div className="h-3 w-px bg-[#363652] mx-0.5" />

          {/* Add / remove Row */}
          <button
            onClick={handleAddRow}
            className="flex items-center gap-0.5 hover:text-[#a78bfa] p-0.5 cursor-pointer"
            title="Add row"
          >
            <Rows className="w-3 h-3" />
            <span>+Row</span>
          </button>
          <button
            onClick={handleRemoveRow}
            disabled={element.rows <= 1}
            className="hover:text-red-300 p-0.5 disabled:opacity-30 cursor-pointer"
            title="Remove row"
          >
            <span>-Row</span>
          </button>

          <div className="h-3 w-px bg-[#363652] mx-0.5" />

          {/* Add / remove Column */}
          <button
            onClick={handleAddCol}
            className="flex items-center gap-0.5 hover:text-[#a78bfa] p-0.5 cursor-pointer"
            title="Add column"
          >
            <Columns className="w-3 h-3" />
            <span>+Col</span>
          </button>
          <button
            onClick={handleRemoveCol}
            disabled={element.cols <= 1}
            className="hover:text-red-300 p-0.5 disabled:opacity-30 cursor-pointer"
            title="Remove column"
          >
            <span>-Col</span>
          </button>

          <div className="h-3 w-px bg-[#363652] mx-0.5" />

          {/* Delete Table */}
          <button
            onClick={onDelete}
            className="hover:text-red-400 p-0.5 text-neutral-400 cursor-pointer"
            title="Delete entire table"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* HTML Table Grid */}
      <table
        className="w-full h-full border-collapse bg-white"
        style={{
          borderColor: element.borderColor || '#cbd5e1',
          borderWidth: `${element.borderWidth || 1}px`,
        }}
      >
        <tbody>
          {element.cells.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td
                  key={cell.id || `${rIdx}_${cIdx}`}
                  className="p-1 border border-slate-300 relative text-black"
                  style={{
                    backgroundColor: cell.backgroundColor || 'transparent',
                    fontSize: `${(cell.fontSize || 11) * scale}px`,
                    fontWeight: cell.fontWeight || 'normal',
                    textAlign: cell.textAlign || 'left',
                  }}
                >
                  <input
                    type="text"
                    value={cell.text || ''}
                    onChange={(e) => handleCellTextChange(rIdx, cIdx, e.target.value)}
                    className="w-full h-full bg-transparent border-none outline-none text-inherit text-xs"
                    placeholder="..."
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
