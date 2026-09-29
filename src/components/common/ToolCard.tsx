import React from 'react';
import {
  FileText,
  Combine,
  Scissors,
  Minimize2,
  Lock,
  Stamp,
  Layers,
  ArrowRight,
  FileOutput,
  Search,
  Edit3,
  Code,
  Image as ImageIcon,
  Hash,
  Scaling,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlannedTool } from '../../types';
import { Badge } from './Badge';

interface ToolCardProps {
  tool: PlannedTool;
  onSelect?: (tool: PlannedTool) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  const navigate = useNavigate();

  // Map icon name to Lucide Icon
  const renderIcon = () => {
    switch (tool.iconName) {
      case 'Combine':
        return <Combine className="w-5 h-5" />;
      case 'Scissors':
        return <Scissors className="w-5 h-5" />;
      case 'Minimize2':
        return <Minimize2 className="w-5 h-5" />;
      case 'FileOutput':
        return <FileOutput className="w-5 h-5" />;
      case 'Lock':
        return <Lock className="w-5 h-5" />;
      case 'Stamp':
        return <Stamp className="w-5 h-5" />;
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'Search':
        return <Search className="w-5 h-5" />;
      case 'Edit3':
        return <Edit3 className="w-5 h-5" />;
      case 'Code':
        return <Code className="w-5 h-5" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5" />;
      case 'Hash':
        return <Hash className="w-5 h-5" />;
      case 'Scaling':
        return <Scaling className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const isLive = tool.badge === 'Live Now' || !!tool.routePath;

  const badgeVariant =
    tool.badge === 'Live Now'
      ? 'emerald'
      : tool.badge === 'Architecture Ready'
      ? 'blue'
      : tool.badge === 'In Development'
      ? 'purple'
      : 'neutral';

  const handleClick = () => {
    if (tool.routePath) {
      navigate(tool.routePath);
    } else if (onSelect) {
      onSelect(tool);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-2xl border p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-xs ${
        isLive
          ? 'border-[#7c3aed]/30 bg-purple-50/40 hover:bg-purple-50/70 hover:border-[#7c3aed] dark:border-[#7c3aed]/40 dark:bg-[#100d1c] dark:hover:border-[#7c3aed] dark:hover:bg-[#141024] hover:shadow-xl hover:shadow-[#7c3aed]/15'
          : 'border-slate-200 bg-white hover:border-[#7c3aed]/40 hover:bg-slate-50 dark:border-[#20202e] dark:bg-[#0c0c12] dark:hover:border-[#7c3aed]/50 dark:hover:bg-[#101018] hover:shadow-lg dark:hover:shadow-[#7c3aed]/10'
      }`}
    >
      {/* Background glow accent on hover */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all duration-300 ${
          isLive
            ? 'bg-[#7c3aed]/10 group-hover:bg-[#7c3aed]/20 dark:bg-[#7c3aed]/15 dark:group-hover:bg-[#7c3aed]/25'
            : 'bg-[#7c3aed]/5 group-hover:bg-[#7c3aed]/10 dark:bg-[#7c3aed]/5 dark:group-hover:bg-[#7c3aed]/15'
        }`}
      />

      <div>
        {/* Top: Icon & Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-all shadow-xs ${
              isLive
                ? 'bg-[#7c3aed] text-white border-transparent'
                : 'bg-slate-100 border-slate-200 text-[#7c3aed] dark:bg-[#14141e] dark:border-[#262638] dark:text-[#a78bfa] group-hover:bg-[#7c3aed]/15 group-hover:border-[#7c3aed]/30 group-hover:text-[#7c3aed] dark:group-hover:text-white'
            }`}
          >
            {renderIcon()}
          </div>
          <Badge variant={badgeVariant} size="sm">
            {tool.badge === 'Live Now' ? 'Live Tool' : tool.badge}
          </Badge>
        </div>

        {/* Title & Description */}
        <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-[#7c3aed] dark:group-hover:text-[#c4b5fd] transition-colors mb-2">
          {tool.name}
        </h4>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
          {tool.description}
        </p>
      </div>

      {/* Footer Tags & Action Indicator */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#1a1a26] flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {tool.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/[0.04] dark:text-neutral-400 dark:border-white/[0.04]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          className={`text-xs font-mono flex items-center gap-1 transition-colors ${
            isLive
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
              : 'text-slate-500 dark:text-neutral-500 group-hover:text-[#7c3aed] dark:group-hover:text-[#a78bfa]'
          }`}
        >
          <span>{isLive ? 'Use Tool' : 'Inspect'}</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
