import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Code2,
  Sparkles,
  ShieldCheck,
  Bot,
  Layers,
} from 'lucide-react';
import { DocFusionLogo } from '../common/DocFusionLogo';
import { Modal } from '../common/Modal';

export const Footer: React.FC = () => {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const developerName = 'Sarder Md Al Alif';
  const supportEmail = 'sardermdalalif@gmail.com';

  return (
    <footer className="border-t border-slate-200 dark:border-[#1a1a26] bg-white dark:bg-[#07070a] pt-8 pb-6 text-slate-600 dark:text-neutral-400 transition-colors">
      <div className="max-w-5xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Compact Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-slate-200 dark:border-[#161622]">
          {/* Brand & Developer Column */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <DocFusionLogo size="sm" showSubtitle={false} />
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Unified, zero-leak document and PDF platform architecture.
            </p>

            {/* Developer & Support Info */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f0f18] border border-slate-200 dark:border-[#1e1e2e] space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-neutral-200">
                <Code2 className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa] shrink-0" />
                <span className="text-[11px] font-medium truncate">
                  Dev: <strong className="font-semibold text-slate-900 dark:text-white">{developerName}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-[11px] text-[#7c3aed] dark:text-[#a78bfa] hover:underline truncate"
                  title={supportEmail}
                >
                  {supportEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Tools Column */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-900 dark:text-neutral-200 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#7c3aed] dark:text-[#a78bfa]" />
              <span>Key Tools</span>
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  to="/ai-document-assistant"
                  className="text-[#7c3aed] dark:text-[#c084fc] font-medium hover:underline flex items-center gap-1"
                >
                  <Bot className="w-3 h-3" />
                  <span>AI Document Chat</span>
                </Link>
              </li>
              <li>
                <Link to="/pdf-to-markdown" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  PDF to Markdown
                </Link>
              </li>
              <li>
                <Link to="/convert" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Universal Documents Converter
                </Link>
              </li>
              <li>
                <Link to="/merge" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Merge &amp; Split PDF
                </Link>
              </li>
              <li>
                <Link to="/compress" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link to="/watermark-pdf" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Watermark PDF
                </Link>
              </li>
              <li>
                <Link to="/page-numbers" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Add Page Numbers
                </Link>
              </li>
              <li>
                <Link to="/resize-photo" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Photo Resize
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Column */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-900 dark:text-neutral-200 font-semibold flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-500" />
              <span>Platform</span>
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  About DocFusion
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Contact &amp; Support
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${supportEmail}`}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1 text-[#7c3aed] dark:text-[#a78bfa]"
                >
                  <Mail className="w-3 h-3" />
                  <span>Email Developer</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Account Column */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-900 dark:text-neutral-200 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Legal &amp; Account</span>
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/login" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Streamlined Bottom Attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-neutral-500 font-mono">
          <div className="flex items-center gap-2 flex-wrap text-center sm:text-left">
            <span>© {new Date().getFullYear()} DocFusion.</span>
            <span>•</span>
            <span>
              Developed by <strong className="text-slate-800 dark:text-neutral-200 font-semibold">{developerName}</strong>
            </span>
          </div>

          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Mail className="w-3 h-3 text-[#7c3aed] dark:text-[#a78bfa]" />
            <span>{supportEmail}</span>
          </a>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title="Privacy Policy"
        subtitle="DocFusion Zero-Knowledge Architecture"
      >
        <div className="space-y-4 text-sm text-slate-700 dark:text-neutral-300 max-h-[60vh] overflow-y-auto pr-2">
          <p>
            At <strong className="text-slate-900 dark:text-white">DocFusion</strong>, your privacy is foundational. We believe your confidential documents belong exclusively to you.
          </p>
          <div className="space-y-1.5">
            <h5 className="font-semibold text-slate-900 dark:text-white">1. Ephemeral Processing Architecture</h5>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              DocFusion document engines prioritize client-side execution through browser sandboxing and ephemeral memory processing. Documents are processed in-memory and are never permanently persisted without your explicit authenticated permission.
            </p>
          </div>
          <div className="space-y-1.5">
            <h5 className="font-semibold text-slate-900 dark:text-white">2. Developer &amp; Data Controller</h5>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Engineered by <strong>{developerName}</strong>. Direct privacy inquiries to{' '}
              <a href={`mailto:${supportEmail}`} className="text-[#7c3aed] dark:text-[#a78bfa] underline font-medium">
                {supportEmail}
              </a>.
            </p>
          </div>
        </div>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title="Terms of Service"
        subtitle="Platform usage terms & conditions"
      >
        <div className="space-y-4 text-sm text-slate-700 dark:text-neutral-300 max-h-[60vh] overflow-y-auto pr-2">
          <p>
            Welcome to <strong className="text-slate-900 dark:text-white">DocFusion</strong>. By accessing this platform, you agree to these Terms of Service.
          </p>
          <div className="space-y-1.5">
            <h5 className="font-semibold text-slate-900 dark:text-white">1. Platform Scope</h5>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              DocFusion provides unified document and PDF utilities including PDF editing, organization, conversion, watermarking, and AI document intelligence.
            </p>
          </div>
          <div className="space-y-1.5">
            <h5 className="font-semibold text-slate-900 dark:text-white">2. Contact &amp; Support</h5>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              For support inquiries or bug reports, contact lead developer <strong>{developerName}</strong> at{' '}
              <a href={`mailto:${supportEmail}`} className="text-[#7c3aed] dark:text-[#a78bfa] underline font-medium">
                {supportEmail}
              </a>.
            </p>
          </div>
        </div>
      </Modal>
    </footer>
  );
};
