import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  FolderOpen,
  LogOut,
  ChevronDown,
  Layers,
  FileText,
  FileCode,
  Image as ImageIcon,
  Stamp,
  Code2,
  Scissors,
  Minimize2,
  Edit,
  Sparkles,
  Bot,
  Info,
  HelpCircle,
  FileQuestion,
  Wand2,
  Hash,
  Scaling,
} from 'lucide-react';
import { DocFusionLogo } from '../common/DocFusionLogo';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { UserDocumentsModal } from '../dashboard/UserDocumentsModal';

interface ToolItem {
  label: string;
  path: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  category: 'convert' | 'edit' | 'organize';
}

const CATEGORIES: { id: 'convert' | 'edit' | 'organize'; title: string; subtitle: string }[] = [
  { id: 'convert', title: 'Convert & Extract', subtitle: 'Markdown, Office, Images, Web' },
  { id: 'edit', title: 'Edit & Page Tools', subtitle: 'Watermarks, Page Numbers, Editor' },
  { id: 'organize', title: 'Organize & Optimize', subtitle: 'Merge, Split, Rearrange, Compress' },
];

const TOOLS_LIST: ToolItem[] = [
  // Convert
  {
    label: 'PDF to Markdown',
    path: '/pdf-to-markdown',
    desc: 'Extract tables, code, math formulas and structured text',
    icon: FileCode,
    badge: 'Popular',
    category: 'convert',
  },
  {
    label: 'Universal Documents Converter',
    path: '/convert',
    desc: 'Convert Word, Excel & PowerPoint to/from PDF',
    icon: FileText,
    category: 'convert',
  },
  {
    label: 'Photo Converter',
    path: '/photo-convert',
    desc: 'Convert PNG, JPG, WEBP, HEIC, TIFF to PDF',
    icon: ImageIcon,
    category: 'convert',
  },
  {
    label: 'Photo Resize',
    path: '/resize-photo',
    desc: 'Resize single or batch photos with custom dimensions and presets',
    icon: Scaling,
    category: 'convert',
  },
  {
    label: 'HTML to PDF',
    path: '/html-to-pdf',
    desc: 'Render web URLs and raw HTML into crisp PDF files',
    icon: Code2,
    category: 'convert',
  },
  // Edit & Security
  {
    label: 'Page Numbers',
    path: '/page-numbers',
    desc: 'Insert customizable page numbers, headers, and footers',
    icon: Hash,
    category: 'edit',
  },
  {
    label: 'Watermark PDF',
    path: '/watermark-pdf',
    desc: 'Stamp custom text or image watermarks onto PDF pages',
    icon: Stamp,
    category: 'edit',
  },
  {
    label: 'PDF Editor',
    path: '/edit',
    desc: 'Annotate, draw, redact, and insert text directly onto pages',
    icon: Edit,
    category: 'edit',
  },
  // Organize & Optimize
  {
    label: 'Merge PDF',
    path: '/merge',
    desc: 'Combine multiple PDF documents into one single file',
    icon: Layers,
    category: 'organize',
  },
  {
    label: 'Split PDF',
    path: '/split',
    desc: 'Extract specific pages or page ranges into new documents',
    icon: Scissors,
    category: 'organize',
  },
  {
    label: 'Organize Pages',
    path: '/organize-pdf',
    desc: 'Reorder, rotate, and delete pages with visual drag & drop',
    icon: Layers,
    category: 'organize',
  },
  {
    label: 'Compress PDF',
    path: '/compress',
    desc: 'Shrink file size while preserving high visual sharpness',
    icon: Minimize2,
    category: 'organize',
  },
];

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, signOutUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
    setMoreDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(e.target as Node)) {
        setToolsDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isAnyToolActive = TOOLS_LIST.some((t) => isActive(t.path));
  const isCompanyActive = ['/about', '/contact'].some((p) => isActive(p));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 dark:bg-[#08080c]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#1d1d2b] py-2.5 shadow-md dark:shadow-black/40'
          : 'bg-white/80 dark:bg-[#08080c]/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-[#171724] py-3'
      }`}
    >
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* 1. Left Brand / Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group cursor-pointer">
            <DocFusionLogo size="md" showSubtitle={true} />
          </Link>

          {/* 2. Primary Navigation (Organized & Balanced) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-[#11111a]/80 border border-slate-200 dark:border-[#222233] rounded-full p-1 shadow-inner">
            {/* Overview / Home */}
            <Link
              to="/"
              className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-150 ${
                isActive('/')
                  ? 'bg-white dark:bg-[#202030] text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
              }`}
            >
              Overview
            </Link>

            {/* AI Chat (Prominent, High-Value Assistant) */}
            <Link
              to="/ai-document-assistant"
              className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full transition-all duration-150 ${
                isActive('/ai-document-assistant')
                  ? 'bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white shadow-xs'
                  : 'text-[#a855f7] dark:text-[#c084fc] hover:text-white bg-[#7c3aed]/10 hover:bg-[#7c3aed]/25 border border-[#7c3aed]/30'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Chat</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#7c3aed]/30 text-white font-bold">
                Gemini
              </span>
            </Link>

            {/* Tools Mega Directory Dropdown */}
            <div className="relative" ref={toolsDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setToolsDropdownOpen((prev) => !prev);
                  setMoreDropdownOpen(false);
                }}
                className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isAnyToolActive || toolsDropdownOpen
                    ? 'bg-white dark:bg-[#202030] text-[#7c3aed] dark:text-[#c4b5fd] font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
                }`}
              >
                <span>Tools Directory</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    toolsDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Categorized Mega Menu Dropdown */}
              {toolsDropdownOpen && (
                <div className="absolute top-full -left-20 sm:-left-32 md:left-1/2 md:-translate-x-1/2 mt-2 w-[92vw] sm:w-[680px] max-w-[calc(100vw-2rem)] p-4 rounded-3xl bg-white dark:bg-[#11111c] border border-slate-200 dark:border-[#26263b] shadow-2xl shadow-slate-900/10 dark:shadow-black/70 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-[#1f1f2e] px-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">PDF Toolkit</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#c084fc] font-semibold">
                        10 Web Utilities
                      </span>
                    </div>
                    <Link
                      to="/pdf-to-markdown"
                      className="text-[11px] font-medium text-[#7c3aed] dark:text-[#a78bfa] hover:underline flex items-center gap-1"
                    >
                      Featured: PDF to Markdown <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* 3 Structured Columns */}
                  <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => {
                      const toolsInCat = TOOLS_LIST.filter((t) => t.category === cat.id);
                      return (
                        <div key={cat.id} className="space-y-1.5">
                          <div className="px-2 py-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 block">
                              {cat.title}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {toolsInCat.map((tool) => {
                              const Icon = tool.icon;
                              const active = isActive(tool.path);
                              return (
                                <Link
                                  key={tool.path}
                                  to={tool.path}
                                  className={`flex items-start gap-2 p-2 rounded-xl transition-all ${
                                    active
                                      ? 'bg-[#7c3aed]/10 text-[#7c3aed] dark:text-white font-semibold'
                                      : 'hover:bg-slate-100 dark:hover:bg-[#191928] text-slate-700 dark:text-neutral-300'
                                  }`}
                                >
                                  <div
                                    className={`p-1.5 rounded-lg shrink-0 ${
                                      active
                                        ? 'bg-[#7c3aed] text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-[#1a1a2a] text-[#7c3aed] dark:text-[#a78bfa]'
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-semibold truncate block">
                                        {tool.label}
                                      </span>
                                      {tool.badge && (
                                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                          {tool.badge}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 line-clamp-1">
                                      {tool.desc}
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dropdown Banner for AI Assistant */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#1f1f2e]">
                    <Link
                      to="/ai-document-assistant"
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-[#7c3aed]/10 via-[#6366f1]/10 to-transparent hover:from-[#7c3aed]/20 border border-[#7c3aed]/25 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#6366f1] text-white flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            Have questions about a contract or document?
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                            Chat directly with your PDF and extract cited answers with Google Gemini.
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-[#7c3aed] dark:text-[#c084fc] flex items-center gap-1 shrink-0">
                        Try AI Chat <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick-Access Top Tools */}
            <Link
              to="/pdf-to-markdown"
              className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-150 ${
                isActive('/pdf-to-markdown')
                  ? 'bg-white dark:bg-[#202030] text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
              }`}
            >
              PDF to Markdown
            </Link>

            <Link
              to="/convert"
              className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-150 ${
                isActive('/convert')
                  ? 'bg-white dark:bg-[#202030] text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
              }`}
            >
              Converter
            </Link>

            {/* More / Company Dropdown */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setMoreDropdownOpen((prev) => !prev);
                  setToolsDropdownOpen(false);
                }}
                className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                  isCompanyActive || moreDropdownOpen
                    ? 'bg-white dark:bg-[#202030] text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
                }`}
              >
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    moreDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {moreDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 p-1.5 rounded-2xl bg-white dark:bg-[#11111c] border border-slate-200 dark:border-[#26263b] shadow-2xl shadow-slate-900/10 dark:shadow-black/70 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                  <Link
                    to="/about"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive('/about')
                        ? 'bg-[#7c3aed]/10 text-[#7c3aed] dark:text-white font-semibold'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#181826]'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
                    <span>About DocFusion</span>
                  </Link>
                  <Link
                    to="/contact"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive('/contact')
                        ? 'bg-[#7c3aed]/10 text-[#7c3aed] dark:text-white font-semibold'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#181826]'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
                    <span>Contact & Support</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* 3. Right Action Bar (Auth & User Dashboard) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Auth Controls */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141422] dark:hover:bg-[#1a1a2c] border border-slate-300 dark:border-[#26263a] text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer"
                    title="View Cloud Documents & History"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
                    <span className="hidden md:inline">My Documents</span>
                  </button>

                  <div
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="flex items-center gap-2 pl-2 border-l border-slate-300 dark:border-[#242436] cursor-pointer group"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-8 h-8 rounded-full border border-[#7c3aed]/40 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#38bdf8] flex items-center justify-center text-white font-bold text-xs shadow-xs">
                        {(user.displayName || user.email || 'U')[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-slate-700 dark:text-neutral-300 group-hover:text-slate-900 dark:group-hover:text-white max-w-[100px] truncate hidden md:inline">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => signOutUser()}
                    className="p-2 rounded-xl text-slate-500 dark:text-neutral-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#14141e] border border-slate-300 dark:border-[#262638] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white focus:outline-none cursor-pointer lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* User Documents Modal */}
      <UserDocumentsModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-[#20202e] bg-white/98 dark:bg-[#0c0c14]/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-3 duration-200 max-h-[85vh] overflow-y-auto scrollbar-thin shadow-2xl">
          {/* AI Chat Spotlight Banner */}
          <Link
            to="/ai-document-assistant"
            className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#7c3aed]/20 via-[#6366f1]/20 to-[#7c3aed]/10 border border-[#7c3aed]/40 text-slate-900 dark:text-white shadow-md shadow-[#7c3aed]/10"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold block">AI Document Chat</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#7c3aed] text-white">
                    Gemini 3.8
                  </span>
                </div>
                <span className="text-[11px] text-[#7c3aed] dark:text-[#a78bfa]">
                  Chat & query PDF, Word, or text files
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#7c3aed] dark:text-[#c084fc]" />
          </Link>

          {/* Categorized Tools on Mobile */}
          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const toolsInCat = TOOLS_LIST.filter((t) => t.category === cat.id);
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                      {cat.title}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                      {toolsInCat.length} tools
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {toolsInCat.map((tool) => {
                      const Icon = tool.icon;
                      const active = isActive(tool.path);
                      return (
                        <Link
                          key={tool.path}
                          to={tool.path}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                            active
                              ? 'bg-[#7c3aed]/15 text-[#7c3aed] dark:text-white font-semibold border border-[#7c3aed]/30'
                              : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa] shrink-0" />
                          <span className="truncate">{tool.label}</span>
                          {tool.badge && (
                            <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {tool.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Platform Pages */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#1a1a26]">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-400 dark:text-neutral-400 block mb-1.5 px-1">
              Platform
            </span>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: 'Overview', path: '/' },
                { label: 'About', path: '/about' },
                { label: 'Contact & Support', path: '/contact' },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-[#7c3aed]/15 text-[#7c3aed] dark:text-white font-semibold'
                      : 'text-slate-700 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User Auth on Mobile */}
          <div className="pt-3 border-t border-slate-200 dark:border-[#1a1a26] flex flex-col gap-2">
            {user ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#141422] border border-slate-300 dark:border-[#26263a] text-xs font-semibold text-slate-800 dark:text-neutral-200"
                >
                  <FolderOpen className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
                  <span>My Cloud Documents</span>
                </button>
                <button
                  type="button"
                  onClick={() => signOutUser()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="w-full">
                  <Button variant="secondary" size="md" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" className="w-full">
                  <Button variant="primary" size="md" className="w-full">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
