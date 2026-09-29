import React, { useState, useEffect } from 'react';
import heroDocsCloud from '../../assets/images/hero_docs_cloud_1790019009855.jpg';
import heroDocMerge from '../../assets/images/hero_doc_merge_1790019026804.jpg';
import heroDocShield from '../../assets/images/hero_doc_shield_1790019039700.jpg';
import heroDocScanner from '../../assets/images/hero_doc_scanner_1790019053973.jpg';
import heroDocMatrix from '../../assets/images/hero_doc_matrix_1790019067259.jpg';

interface SlideItem {
  id: string;
  image: string;
  title: string;
  category: string;
}

const HERO_SLIDES: SlideItem[] = [
  {
    id: 'docs-cloud',
    image: heroDocsCloud,
    title: 'Cloud Document Ecosystem',
    category: 'Ingestion & Sync',
  },
  {
    id: 'doc-merge',
    image: heroDocMerge,
    title: 'Dynamic Fusion Engine',
    category: 'Merge & Compilation',
  },
  {
    id: 'doc-shield',
    image: heroDocShield,
    title: 'Cryptographic Document Security',
    category: 'Sandboxing & Vault',
  },
  {
    id: 'doc-scanner',
    image: heroDocScanner,
    title: 'High-Precision OCR & Scan',
    category: 'Format Transformation',
  },
  {
    id: 'doc-matrix',
    image: heroDocMatrix,
    title: 'Global Enterprise Matrix',
    category: 'Workflow Orchestration',
  },
];

export const HeroBackgroundSlideshow: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Transition every 2 seconds as requested by the user
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % HERO_SLIDES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="absolute inset-0 -top-6 -bottom-10 overflow-hidden rounded-3xl pointer-events-none select-none z-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-hidden="true"
    >
      {/* 5 Rotating Background Images with 2-second crossfade */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } transition-transform duration-[2000ms]`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.1] saturate-[1.15]"
            />
          </div>
        );
      })}

      {/* Multi-tier Gradient Masks for absolute text readability and contrast */}
      {/* 1. Deep solid vignette at edges */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#08080a]/75 to-[#08080a]" />

      {/* 2. Top-to-bottom dark gradient matching the dark canvas */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08080a]/90 via-[#08080a]/70 to-[#08080a]" />

      {/* 3. Subtle Brand-Themed Blue & Cyan Atmospheric Wash */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0F4C81]/25 via-transparent to-[#00A3E0]/20 mix-blend-overlay" />

      {/* 4. Subtle glowing radial pulse in the center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#0F4C81]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle indicator pills showing 2-second progression */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto bg-[#08080a]/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
        {HERO_SLIDES.map((slide, idx) => {
          const active = idx === currentIndex;
          return (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(idx)}
              className={`group relative h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                active ? 'w-6 bg-[#00A3E0]' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
              title={`${slide.title} (${slide.category})`}
            >
              <span className="sr-only">Slide {idx + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
