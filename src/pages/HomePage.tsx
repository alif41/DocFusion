import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Search,
  Send,
  Bot,
  BookOpen,
  ShieldCheck,
  Zap,
  MessageSquare,
  Layers,
  FileText,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { ToolCard } from '../components/common/ToolCard';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { HeroBackgroundSlideshow } from '../components/common/HeroBackgroundSlideshow';
import { PLANNED_TOOLS, CORE_BENEFITS } from '../data/mockData';
import { PlannedTool, ToolCategory } from '../types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const HomePage: React.FC = () => {
  useDocumentTitle('Home - Modern Document & PDF Platform');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectTool, setInspectTool] = useState<PlannedTool | null>(null);
  const [requestToolModal, setRequestToolModal] = useState(false);
  const [requestedToolName, setRequestedToolName] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const categories: { label: string; value: ToolCategory }[] = [
    { label: 'All Tools', value: 'all' },
    { label: 'Organize & Merge', value: 'organize' },
    { label: 'Convert & Export', value: 'convert' },
    { label: 'Optimize & Compress', value: 'optimize' },
    { label: 'Edit & Markup', value: 'edit' },
  ];

  const filteredTools = PLANNED_TOOLS.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedToolName.trim()) return;
    setRequestSubmitted(true);
    setTimeout(() => {
      setRequestSubmitted(false);
      setRequestToolModal(false);
      setRequestedToolName('');
    }, 2000);
  };

  return (
    <div className="space-y-20 sm:space-y-28 pb-20 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-[1560px] mx-auto pt-8 sm:pt-14 pb-4">
        {/* Dynamic rotating background behind hero */}
        <HeroBackgroundSlideshow />

        <div className="relative z-10 text-center w-full max-w-5xl lg:max-w-6xl 2xl:max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08] drop-shadow-sm">
            The Modern{' '}
            <span className="bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#38bdf8] bg-clip-text text-transparent">
              Document &amp; PDF
            </span>{' '}
            Platform
          </h1>

          {/* Tagline / Subtitle */}
          <p className="text-base sm:text-xl lg:text-2xl text-slate-600 dark:text-neutral-300 max-w-3xl lg:max-w-4xl mx-auto leading-relaxed font-normal">
            DocFusion is designed from the ground up as a unified, high-performance ecosystem for all document tasks. Built for speed, privacy, responsive workflow, and architectural scalability.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a href="#tools-directory">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Layers className="w-5 h-5 text-white" />}
                rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                className="w-full sm:w-auto shadow-xl shadow-[#7c3aed]/25 font-bold px-6"
              >
                Browse All Tools
              </Button>
            </a>
            <Link to="/ai-document-assistant">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Bot className="w-5 h-5 text-[#7c3aed] dark:text-[#a78bfa]" />}
                className="w-full sm:w-auto font-bold border border-[#7c3aed]/30 hover:border-[#7c3aed] px-6"
              >
                AI Chat
              </Button>
            </Link>
          </div>

          {/* Micro trust indicators */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs font-mono text-slate-600 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              Responsive Across All Devices
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              Dark &amp; Light Adaptive
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              Zero-Leak In-Memory Engine
            </span>
          </div>
        </div>
      </section>

      {/* 2. TOOLS DIRECTORY SECTION */}
      <section id="tools-directory" className="px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-[1560px] mx-auto scroll-mt-24">
        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8 bg-slate-100/90 dark:bg-[#0e0e16] p-3 rounded-2xl border border-slate-200 dark:border-[#1e1e2d] shadow-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.value
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25 font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.04]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box and Request a Future Tool Button */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative w-full sm:w-60 lg:w-72">
              <Search className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools &amp; formats..."
                className="w-full bg-white dark:bg-[#141420] border border-slate-200 dark:border-[#262638] rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setRequestToolModal(true)}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
              className="w-full sm:w-auto shrink-0 whitespace-nowrap shadow-md shadow-[#7c3aed]/25"
            >
              Request Feature
            </Button>
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onSelect={(selected) => setInspectTool(selected)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matching tools found"
            description={`We couldn't find any tool matching "${searchQuery}". Suggest this feature to our engineering team!`}
            actionText="Suggest this tool"
            onAction={() => {
              setRequestedToolName(searchQuery);
              setRequestToolModal(true);
            }}
          />
        )}
      </section>

      {/* 2.5. AI DOCUMENT ASSISTANT SPOTLIGHT (BEFORE WHY DOCFUSION) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-[1560px] mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-b from-[#111122] via-[#0d0d18] to-[#08080f] border border-[#2b2548] p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl">
          {/* Ambient Purple Background Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#7c3aed]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-[#6366f1]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7c3aed]/15 border border-[#7c3aed]/35 text-xs font-semibold text-[#c084fc]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Google Gemini 3.8 Flash</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
                Chat with Any Document in Real Time
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
                Upload contracts, technical manuals, financial statements, or academic papers. Ask questions in natural language and receive grounded answers with exact page citations and zero hallucination.
              </p>
            </div>

            {/* Value proposition badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-left">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs text-neutral-300">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="font-medium">Strict Page Citations</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs text-neutral-300">
                <div className="w-7 h-7 rounded-lg bg-[#7c3aed]/15 text-[#a78bfa] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-medium">Instant Summaries</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs text-neutral-300">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="font-medium">Clause Explainer</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs text-neutral-300">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-medium">Ephemeral Privacy</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link to="/ai-document-assistant">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Bot className="w-4 h-4 text-white" />}
                  rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                  className="shadow-xl shadow-[#7c3aed]/25 font-bold px-6"
                >
                  Open AI Chat
                </Button>
              </Link>

              <Link
                to="/ai-document-assistant"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#7c3aed]/40 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#a78bfa]" />
                <span>Try Sample Document</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE BENEFITS */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-[1560px] mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
          <span className="text-xs font-mono uppercase tracking-wider text-[#7c3aed] dark:text-[#a78bfa] bg-[#7c3aed]/10 px-3 py-1 rounded-full border border-[#7c3aed]/20">
            Core Philosophy
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Why DocFusion?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400">
            Engineered around four foundational pillars designed to eliminate friction, security vulnerabilities, and visual pollution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {CORE_BENEFITS.map((benefit) => (
            <div
              key={benefit.id}
              className="rounded-2xl border border-slate-200 dark:border-[#20202f] bg-white dark:bg-[#0c0c14] p-6 hover:border-[#7c3aed]/40 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md group"
            >
              <div>
                <div className="mb-4">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-white/[0.04] dark:text-neutral-300 dark:border-white/[0.08]">
                    {benefit.highlight}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{benefit.title}</h3>
                <p className="text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] mb-3">{benefit.tagline}</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
                  {benefit.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#181826] flex items-center text-xs font-mono text-slate-500 dark:text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-neutral-300 transition-colors">
                <span>Phase 1 Verified</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PRE-FOOTER CTA BANNER */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-[1560px] mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 border border-purple-200/80 dark:from-[#17112b] dark:via-[#10101d] dark:to-[#0d1326] dark:border-[#282247] p-8 sm:p-14 text-center relative overflow-hidden shadow-sm">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ready for Next-Gen Document Workflows?
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400">
              Join users leveraging DocFusion for instant PDF conversions, edits, watermarking, and Markdown workflows.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register">
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Free Account
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="secondary" size="md">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL: Inspect Planned Tool */}
      <Modal
        isOpen={!!inspectTool}
        onClose={() => setInspectTool(null)}
        title={inspectTool?.name || 'Planned Tool'}
        subtitle={`Category: ${inspectTool?.category.toUpperCase()} • Status: ${inspectTool?.badge}`}
      >
        <div className="space-y-4 text-sm text-slate-700 dark:text-neutral-300">
          <p className="leading-relaxed">
            {inspectTool?.description}
          </p>

          <div className="rounded-xl bg-slate-100 dark:bg-[#141420] border border-slate-200 dark:border-[#232334] p-4 space-y-2">
            <h5 className="text-xs font-mono uppercase tracking-wider text-[#7c3aed] dark:text-[#a78bfa] font-semibold">
              Tool Specification
            </h5>
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              This tool utilizes DocFusion&apos;s modular document pipeline with client-side sandbox execution and optional server processing.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {inspectTool?.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/[0.08]"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-[#1c1c28] flex items-center justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInspectTool(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Request a Tool */}
      <Modal
        isOpen={requestToolModal}
        onClose={() => setRequestToolModal(false)}
        title="Request a Feature"
        subtitle="Suggest an addition to the DocFusion roadmap"
      >
        {requestSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Proposal Received!</h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              Thank you for contributing to DocFusion. We&apos;ve logged your feedback for our development team.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                Tool or Feature Name
              </label>
              <input
                type="text"
                required
                value={requestedToolName}
                onChange={(e) => setRequestedToolName(e.target.value)}
                placeholder="e.g., Redaction Brush, Form Filler, EPUB to PDF..."
                className="w-full bg-slate-50 dark:bg-[#141420] border border-slate-200 dark:border-[#252538] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                Primary Use Case (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="How would this tool improve your document workflow?"
                className="w-full bg-slate-50 dark:bg-[#141420] border border-slate-200 dark:border-[#252538] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRequestToolModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                rightIcon={<Send className="w-3.5 h-3.5" />}
              >
                Submit Proposal
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
