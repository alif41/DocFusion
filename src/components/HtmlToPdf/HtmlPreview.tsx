import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  Sparkles,
  Code,
} from 'lucide-react';
import { HtmlToPdfConfig } from './types';
import { PAGE_DIMENSIONS_MM } from './config';

interface HtmlPreviewProps {
  html: string;
  config: HtmlToPdfConfig;
  onRefresh?: () => void;
}

export const HtmlPreview: React.FC<HtmlPreviewProps> = ({
  html,
  config,
  onRefresh,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [debouncedHtml, setDebouncedHtml] = useState<string>(html);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Debounce HTML updates for smooth typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHtml(html);
    }, 300);
    return () => clearTimeout(handler);
  }, [html]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.5, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.4, +(z - 0.15).toFixed(2)));
  const handleResetZoom = () => setZoomLevel(0.85);

  // Page dimensions
  const dims = PAGE_DIMENSIONS_MM[config.pageSize] || PAGE_DIMENSIONS_MM.A4;
  const isLandscape = config.orientation === 'landscape';
  const widthMm = isLandscape ? Math.max(dims.width, dims.height) : Math.min(dims.width, dims.height);
  const heightMm = isLandscape ? Math.min(dims.width, dims.height) : Math.max(dims.width, dims.height);

  return (
    <div
      className={`flex flex-col bg-[#0e0e1a] border border-[#222236] rounded-3xl overflow-hidden shadow-2xl transition-all ${
        isFullScreen ? 'fixed inset-4 z-50 rounded-2xl shadow-black/80' : 'h-[580px]'
      }`}
    >
      {/* Preview Top Toolbar */}
      <div className="bg-[#141424] border-b border-[#24243a] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-white tracking-wide">
            <Eye className="w-4 h-4 text-[#a78bfa]" />
            <span>Live PDF Preview</span>
          </div>

          <span className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
            {config.pageSize} ({widthMm} × {heightMm} mm)
          </span>
        </div>

        {/* Viewport & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          {/* Device Toggle */}
          <div className="flex items-center bg-[#1b1b2e] border border-[#2d2d46] rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                deviceMode === 'desktop'
                  ? 'bg-[#7c3aed] text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Desktop Page Layout"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-[#7c3aed] text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Mobile Responsive Preview"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#1b1b2e] border border-[#2d2d46] rounded-xl p-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh preview */}
          <button
            type="button"
            onClick={() => {
              setDebouncedHtml(html);
              if (onRefresh) onRefresh();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Refresh Preview"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-neutral-700 mx-1" />

          {/* Full-screen toggle */}
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Preview'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preview Viewport Canvas */}
      <div className="flex-1 bg-[#090912] overflow-auto flex items-center justify-center p-4 sm:p-6 scrollbar-thin">
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className={`relative shadow-2xl transition-all ${
            deviceMode === 'mobile'
              ? 'w-[375px] min-h-[667px] border-4 border-neutral-700 rounded-3xl overflow-hidden bg-white'
              : 'w-[794px] min-h-[1123px] bg-white rounded-md border border-neutral-200'
          }`}
        >
          {/* Header preview if enabled */}
          {config.headerFooter.enabled && (
            <div className="px-8 pt-6 pb-2 border-b border-neutral-300 flex justify-between items-center text-[10px] text-neutral-600 font-sans">
              <span>{config.headerFooter.header.leftText}</span>
              <span className="font-bold text-neutral-800">
                {config.headerFooter.header.showTitle ? 'Document Title' : config.headerFooter.header.centerText}
              </span>
              <span>
                {config.headerFooter.header.showDate ? new Date().toLocaleDateString() : config.headerFooter.header.rightText}
              </span>
            </div>
          )}

          {/* Rendered HTML inside isolated sandbox iframe or empty state */}
          {!debouncedHtml.trim() ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400 min-h-[600px]">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-300 flex items-center justify-center mb-3 text-[#7c3aed]">
                <Code className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-neutral-800">Your Live Preview</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
                Type or paste your own HTML &amp; CSS code in the editor on the left to render your document in real time.
              </p>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={debouncedHtml}
              sandbox={config.executeJavaScript ? 'allow-scripts' : ''}
              className="w-full h-full min-h-[1050px] border-none"
              title="HTML PDF Live Preview"
            />
          )}

          {/* Footer preview if enabled */}
          {config.headerFooter.enabled && (
            <div className="px-8 pb-6 pt-2 border-t border-neutral-300 flex justify-between items-center text-[10px] text-neutral-600 font-sans">
              <span>{config.headerFooter.footer.leftText}</span>
              <span>{config.headerFooter.footer.centerText}</span>
              <span className="font-mono text-neutral-700">
                {config.headerFooter.footer.showPageNumber ? 'Page 1 of 1' : config.headerFooter.footer.rightText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
