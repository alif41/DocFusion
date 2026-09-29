import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Download,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { DocFusionLogo } from '../components/common/DocFusionLogo';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const AboutPage: React.FC = () => {
  useDocumentTitle('About - Vision & Architecture');
  const milestones = [
    {
      phase: 'Phase 01',
      title: 'Foundation, Identity & UI System',
      status: 'Completed',
      statusVariant: 'emerald' as const,
      description:
        'Establishment of the DocFusion brand mark, design tokens, responsive layout grid, atomic component library, and scalable route architecture.',
    },
    {
      phase: 'Phase 02',
      title: 'Core Document Engines & Sandboxing',
      status: 'Completed',
      statusVariant: 'emerald' as const,
      description:
        'Integration of client and server PDF workers: PDF to Markdown extraction, Merge PDF, Split PDF, Compress PDF, Universal Documents Converter, and multi-format converters.',
    },
    {
      phase: 'Phase 03',
      title: 'Intelligent Workflows & OCR Matrix',
      status: 'Live & Expanding',
      statusVariant: 'purple' as const,
      description:
        'Zero-knowledge OCR extraction, Gemini-assisted layout recognition, table reconstruction, and universal cloud connectors.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16 sm:space-y-24">
      {/* 1. Header / Vision */}
      <section className="text-center max-w-3xl mx-auto space-y-5">
        <Badge variant="purple" size="md">
          Platform Architecture &amp; Vision
        </Badge>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Unifying Document Workflows with Modern Engineering
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          DocFusion replaces fragmented, ad-ridden, and privacy-questionable legacy utilities with a unified, high-performance document ecosystem.
        </p>
      </section>

      {/* Official Brand Identity Presentation */}
      <section className="rounded-3xl border border-slate-200 dark:border-[#232338] bg-slate-50 dark:bg-gradient-to-b dark:from-[#0e0e18] dark:to-[#0a0a10] p-6 sm:p-10 shadow-xs space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#1c1c2b]">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#00A3E0] font-semibold">Visual Identity</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">Official DocFusion Brand Mark</h2>
          </div>
          <a
            href="/logo.svg"
            download="docfusion-logo.svg"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#141422] border border-slate-300 dark:border-[#2a2a3e] text-xs font-mono text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:border-[#00A3E0] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#00A3E0]" />
            Download SVG Asset
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Logo Previews (Light & Dark Variants) */}
          <div className="space-y-4">
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs">
              <DocFusionLogo size="xl" showSubtitle={true} variant="original" />
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#08080c] border border-[#202030] flex items-center justify-center">
              <DocFusionLogo size="xl" showSubtitle={true} variant="dark" />
            </div>
          </div>

          {/* Design Anatomy & Symbolism */}
          <div className="space-y-5 text-sm text-slate-700 dark:text-neutral-300">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Identity Anatomy &amp; Symbolism</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#202034] space-y-1 shadow-xs">
                <span className="text-xs font-mono text-[#00A3E0] font-semibold">01. Dual Document Interlock</span>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  Two overlapping sheet silhouettes (Deep Blue with folded dog-ear and Cyan frame) symbolize multi-format file ingestion and unified fusion.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#202034] space-y-1 shadow-xs">
                <span className="text-xs font-mono text-sky-600 dark:text-sky-400 font-semibold">02. Ascending Dynamic Arrow (&apos;F&apos; Vector)</span>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  The surging upward arrow and ribbon evoke seamless workflow acceleration, zero-friction throughput, and the signature &apos;F&apos; in DocFusion.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#12121e] border border-slate-200 dark:border-[#202034] space-y-1 shadow-xs">
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">03. Dual-Color Palette</span>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  Deep Corporate Blue grounds enterprise stability and privacy, while Cerulean Cyan highlights agility and precision.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Problem vs The DocFusion Solution */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="rounded-3xl border border-rose-200 dark:border-[#261f28] bg-rose-50/50 dark:bg-[#100c12]/50 p-6 sm:p-10 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-mono text-sm font-bold">
            ✕
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">The Legacy Web Experience</h3>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-neutral-400">
            <li className="flex items-start gap-2.5">
              <span className="text-rose-500 shrink-0 mt-0.5">•</span>
              <span>Intrusive display ads and deceptive download buttons that confuse users.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rose-500 shrink-0 mt-0.5">•</span>
              <span>Unclear privacy policies that upload sensitive files to unknown remote servers.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rose-500 shrink-0 mt-0.5">•</span>
              <span>Disjointed tools forcing users to jump across multiple separate websites.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rose-500 shrink-0 mt-0.5">•</span>
              <span>Sluggish server queues and arbitrary daily file size limits.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-emerald-200 dark:border-[#232338] bg-emerald-50/40 dark:bg-[#0c0c16] p-6 sm:p-10 space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-sm font-bold">
            ✓
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">The DocFusion Standard</h3>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-neutral-300">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
              <span>Clean, minimalist SaaS interface engineered for cognitive calm.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
              <span>Zero-knowledge client-side sandboxing preserving document confidentiality.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
              <span>Unified workspace architecture where all document utilities connect.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
              <span>Instant responsiveness with modern WebAssembly and worker thread concurrency.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 3. Strategic Roadmap */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge variant="neutral" size="sm">
            Roadmap
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Architectural Phases
          </h2>
          <p className="text-sm text-slate-600 dark:text-neutral-400">
            How we methodically scale and enhance the DocFusion platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-[#20202e] bg-white dark:bg-[#0c0c14] p-6 sm:p-8 space-y-4 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold">{m.phase}</span>
                  <Badge variant={m.statusVariant} size="sm">
                    {m.status}
                  </Badge>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{m.title}</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
                  {m.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-[#181824] text-[11px] font-mono text-slate-500 dark:text-neutral-500">
                {m.status === 'Completed' ? '✓ Operational in platform' : 'Active development'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Core Values / Principles */}
      <section className="rounded-3xl border border-slate-200 dark:border-[#232336] bg-slate-50 dark:bg-[#0d0d16] p-8 sm:p-14 space-y-8">
        <div className="max-w-2xl space-y-3">
          <Badge variant="purple" size="sm">Design Principles</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Engineering for Trust and Speed
          </h2>
          <p className="text-sm text-slate-600 dark:text-neutral-400">
            Every component inside DocFusion adheres to rigorous quality guidelines:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#141422] border border-slate-200 dark:border-[#232338] space-y-2 shadow-xs">
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">Privacy Invariant</h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              We operate under the principle that sensitive documents must never be harvested or retained.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#141422] border border-slate-200 dark:border-[#232338] space-y-2 shadow-xs">
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">Accessibility First</h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Full keyboard accessibility, screen-reader compatibility, and high visual contrast standards.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#141422] border border-slate-200 dark:border-[#232338] space-y-2 shadow-xs">
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">Modern Modularity</h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Decoupled modules allowing independent scaling of tool engines without degrading system stability.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Contact CTA */}
      <section className="text-center space-y-4 pt-4">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Have an architectural inquiry or partnership question?
        </h3>
        <p className="text-sm text-slate-600 dark:text-neutral-400">
          Our team is available to discuss custom enterprise requirements and roadmap suggestions.
        </p>
        <div className="pt-2">
          <Link to="/contact">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
