import React from 'react';
import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Layers,
} from 'lucide-react';
import { PhotoConversionConfig, PhotoFormat } from './types';

interface PhotoConverterCardProps {
  config: PhotoConversionConfig;
  onSelect: (config: PhotoConversionConfig) => void;
}

export const PhotoConverterCard: React.FC<PhotoConverterCardProps> = ({ config, onSelect }) => {
  const renderIcon = () => {
    switch (config.iconName) {
      case 'FileText':
        return <FileText className="w-5 h-5" />;
      case 'Camera':
        return <Camera className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <ImageIcon className="w-5 h-5" />;
    }
  };

  const getFormatBadge = (fmt: PhotoFormat) => {
    switch (fmt) {
      case 'JPG':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'PNG':
        return {
          bg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
          dot: 'bg-blue-400',
        };
      case 'HEIC':
        return {
          bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400',
        };
      case 'WEBP':
        return {
          bg: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
          dot: 'bg-teal-400',
        };
      case 'RAW':
        return {
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'PDF':
        return {
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400',
        };
    }
  };

  const srcBadge = getFormatBadge(config.sourceFormat);
  const tgtBadge = getFormatBadge(config.targetFormat);

  return (
    <div
      onClick={() => onSelect(config)}
      className="group relative bg-[#12121e]/90 hover:bg-[#161626] border border-[#242438] hover:border-[#7c3aed]/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-[#7c3aed]/10 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Header: Icon & Target Ext */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-[#2d2d44] group-hover:border-[#7c3aed]/40 flex items-center justify-center text-white transition-colors">
            {renderIcon()}
          </div>
          <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-neutral-400">
            {config.targetExt.toUpperCase()}
          </span>
        </div>

        {/* Source -> Target Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${srcBadge.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${srcBadge.dot}`} />
            {config.sourceFormat}
          </span>

          <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-[#a78bfa] transition-colors group-hover:translate-x-0.5 duration-200" />

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${tgtBadge.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tgtBadge.dot}`} />
            {config.targetFormat}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#e0e7ff] transition-colors">
          {config.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6">
          {config.description}
        </p>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(config);
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c1c2c] hover:bg-[#7c3aed] text-white text-xs sm:text-sm font-semibold border border-[#2d2d46] hover:border-[#7c3aed] transition-all duration-200 group-hover:shadow-md cursor-pointer"
      >
        <span>Convert Now</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
