import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  FileCheck,
} from 'lucide-react';
import {
  ALL_CONVERSIONS,
  CONVERSION_CONFIGS,
  ConversionConfig,
  ConversionType,
  ConverterCard,
  ConversionWorkspace,
  ConversionHistory,
} from '../components/UniversalConverter';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const UniversalConverterPage: React.FC = () => {
  useDocumentTitle('Universal Documents Converter - Convert PDF, Word, PowerPoint, Excel');

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read initial conversion type from URL query parameter e.g. /convert?type=pdf-to-word
  const typeParam = searchParams.get('type') as ConversionType | null;
  const initialConfig = typeParam && CONVERSION_CONFIGS[typeParam] ? CONVERSION_CONFIGS[typeParam] : null;

  const [activeConfig, setActiveConfig] = useState<ConversionConfig | null>(initialConfig);

  // Sync state if searchParams change
  useEffect(() => {
    const currentParam = searchParams.get('type') as ConversionType | null;
    if (currentParam && CONVERSION_CONFIGS[currentParam]) {
      setActiveConfig(CONVERSION_CONFIGS[currentParam]);
    } else if (!currentParam) {
      setActiveConfig(null);
    }
  }, [searchParams]);

  const handleSelectCard = (config: ConversionConfig) => {
    setActiveConfig(config);
    setSearchParams({ type: config.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setActiveConfig(null);
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 2xl:px-12 max-w-7xl 2xl:max-w-[1560px] mx-auto space-y-12 w-full">
      {/* If a conversion type is active, render the dedicated Conversion Workspace */}
      {activeConfig ? (
        <ConversionWorkspace
          config={activeConfig}
          onSelectConfig={(newConfig) => {
            setActiveConfig(newConfig);
            setSearchParams({ type: newConfig.id });
          }}
          onBackToDashboard={handleBackToDashboard}
        />
      ) : (
        /* Universal Doc Converter Dashboard */
        <div className="space-y-12 sm:space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-xs font-semibold text-[#a78bfa]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DocFusion Universal Documents Converter</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Convert Documents Easily
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed font-normal">
              Transform your documents between PDF, Word, PowerPoint, and Excel while preserving formatting and structure.
            </p>

            {/* Quick feature pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Zero Quality Loss
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Preserves Tables &amp; Layout
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Privacy-First Sandbox
              </span>
            </div>
          </div>

          {/* Six Conversion Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ALL_CONVERSIONS.map((config) => (
              <ConverterCard
                key={config.id}
                config={config}
                onSelect={handleSelectCard}
              />
            ))}
          </div>

          {/* Conversion History Section */}
          <div className="pt-4 max-w-4xl mx-auto">
            <ConversionHistory onSelectConversion={(type) => {
              if (CONVERSION_CONFIGS[type as ConversionType]) {
                handleSelectCard(CONVERSION_CONFIGS[type as ConversionType]);
              }
            }} />
          </div>

          {/* Technical Guarantee & Architecture Highlights */}
          <div className="p-8 rounded-3xl bg-[#0f0f1c] border border-[#222238] grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center text-[#c084fc]">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Structural Precision</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Retains native headings, paragraphs, table rows, and page bounds rather than flattening content into low-res bitmaps.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Fast In-Memory Engine</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Conversions run through dedicated stream pipelines on high-throughput Node.js microservices for rapid turnaround.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Guaranteed Privacy</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Documents are held strictly in memory during processing and are wiped immediately with no permanent logging.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
