import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  Camera,
  Image as ImageIcon,
  Sliders,
} from 'lucide-react';
import {
  ALL_PHOTO_CONVERSIONS,
  PHOTO_CONVERSION_CONFIGS,
  PhotoConversionConfig,
  PhotoConversionType,
  PhotoConverterCard,
  ConversionWorkspace,
  ConversionHistory,
} from '../components/UniversalPhotoConverter';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const UniversalPhotoConverterPage: React.FC = () => {
  useDocumentTitle('Universal Photo Converter - Convert Images, RAW, HEIC, WEBP, PDF');

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const typeParam = searchParams.get('type') as PhotoConversionType | null;
  const initialConfig =
    typeParam && PHOTO_CONVERSION_CONFIGS[typeParam]
      ? PHOTO_CONVERSION_CONFIGS[typeParam]
      : null;

  const [activeConfig, setActiveConfig] = useState<PhotoConversionConfig | null>(initialConfig);

  useEffect(() => {
    const currentParam = searchParams.get('type') as PhotoConversionType | null;
    if (currentParam && PHOTO_CONVERSION_CONFIGS[currentParam]) {
      setActiveConfig(PHOTO_CONVERSION_CONFIGS[currentParam]);
    } else if (!currentParam) {
      setActiveConfig(null);
    }
  }, [searchParams]);

  const handleSelectCard = (config: PhotoConversionConfig) => {
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
    <div className="min-h-[calc(100vh-64px)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
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
        /* Universal Photo Converter Dashboard */
        <div className="space-y-12 sm:space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-xs font-semibold text-[#a78bfa]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DocFusion Universal Photo Converter</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Convert Images &amp; Photos Easily
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed font-normal">
              Convert your photos between popular image and document formats while maintaining quality.
            </p>

            {/* Quick feature guarantees */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Original Dimensions Preserved
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Alpha Transparency Handling
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Camera RAW &amp; Apple HEIC Support
              </span>
            </div>
          </div>

          {/* 10 Conversion Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ALL_PHOTO_CONVERSIONS.map((config) => (
              <PhotoConverterCard
                key={config.id}
                config={config}
                onSelect={handleSelectCard}
              />
            ))}
          </div>

          {/* Recent Photo Conversions History */}
          <div className="pt-4 max-w-4xl mx-auto">
            <ConversionHistory
              onSelectConversion={(type) => {
                if (PHOTO_CONVERSION_CONFIGS[type as PhotoConversionType]) {
                  handleSelectCard(PHOTO_CONVERSION_CONFIGS[type as PhotoConversionType]);
                }
              }}
            />
          </div>

          {/* Technical Guarantee & Architecture Highlights */}
          <div className="p-8 rounded-3xl bg-[#0f0f1c] border border-[#222238] grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center text-[#c084fc]">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Full Fidelity Preservation</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Images retain true pixel dimensions, color gamuts, and EXIF orientations without artificial downsampling or compression artifacts.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">High-Speed Image Pipeline</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Server-side libvips and MozJPEG engines process high-resolution images, RAW captures, and multi-page PDFs with minimal latency.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Confidential &amp; Ephemeral</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Files are strictly processed in isolated, transient memory buffers. Uploaded photos are never retained or shared.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
