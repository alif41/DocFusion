import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ConversionConfig } from './types';

interface ConversionInfoProps {
  config: ConversionConfig;
}

export const ConversionInfo: React.FC<ConversionInfoProps> = ({ config }) => {
  return (
    <div className="bg-[#121220] border border-[#24243a] rounded-3xl p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs font-mono uppercase tracking-wider text-[#a78bfa]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fidelity & Structure Engine</span>
        </div>
        <h3 className="text-lg font-bold text-white">
          Output: {config.targetFormat} ({config.targetExt.toUpperCase()})
        </h3>
        <p className="text-xs text-neutral-400 mt-1">
          Configured for high precision conversion preserving typography, layout, and document structure.
        </p>
      </div>

      {/* Preservation Highlights */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
          What is Preserved
        </h4>
        <div className="space-y-2.5">
          {config.supportedFeatures.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Structural Details */}
      <div className="space-y-2.5 pt-2 border-t border-[#222234]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
          Conversion Specifications
        </h4>
        <div className="space-y-2">
          {config.fidelityDetails.map((det, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
              <span>{det}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer / Warning if any */}
      {config.disclaimer && (
        <div className="p-3.5 rounded-2xl bg-[#18182a] border border-[#2b2b42] flex items-start gap-2.5 text-xs text-neutral-400">
          <Info className="w-4 h-4 text-[#a78bfa] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">{config.disclaimer}</p>
        </div>
      )}

      {/* Security & Privacy Badge */}
      <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-200">Ephemeral Processing</p>
          <p className="text-[11px] text-emerald-400/80">
            Files are processed strictly in-memory and permanently purged after conversion.
          </p>
        </div>
      </div>
    </div>
  );
};
