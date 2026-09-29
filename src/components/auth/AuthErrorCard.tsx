import React, { useState } from 'react';
import { Globe, AlertCircle, ExternalLink, Copy, Check, ShieldAlert, ArrowRight } from 'lucide-react';
import { FormattedAuthError } from '../../lib/authErrors';

interface AuthErrorCardProps {
  error: FormattedAuthError | null;
  onGoogleSignIn?: () => void;
  isLoading?: boolean;
}

export const AuthErrorCard: React.FC<AuthErrorCardProps> = ({
  error,
  onGoogleSignIn,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const handleCopyDomain = async (domainText: string) => {
    try {
      await navigator.clipboard.writeText(domainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy domain', err);
    }
  };

  // 1. UNAUTHORIZED DOMAIN (Netlify or Custom Domain)
  if (error.isUnauthorizedDomain) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-500/40 text-amber-950 dark:text-amber-100 text-xs space-y-3.5 shadow-sm animate-in fade-in duration-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <h4 className="font-semibold text-amber-950 dark:text-amber-200 text-sm flex items-center gap-1.5">
              <span>Domain Not Authorized in Firebase</span>
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 font-bold">
                auth/unauthorized-domain
              </span>
            </h4>
            <p className="text-slate-700 dark:text-neutral-300 leading-relaxed text-[12px]">
              Firebase rejects authentication from <strong>{error.currentHostname || 'this Netlify domain'}</strong> because it has not yet been registered under <strong>Authorized Domains</strong> in your Firebase Console.
            </p>
          </div>
        </div>

        {/* Recommended Domain to Copy */}
        <div className="bg-white dark:bg-[#12121e] rounded-xl p-3 border border-amber-200/80 dark:border-[#26263b] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
            <span>Domain to add:</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {error.suggestedDomainToAdd === 'netlify.app'
                ? 'Covers all Netlify previews & sites'
                : 'Exact Hostname'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1a2e] font-mono text-xs text-slate-900 dark:text-amber-300 font-bold select-all truncate border border-slate-200 dark:border-white/5">
              {error.suggestedDomainToAdd}
            </code>
            <button
              type="button"
              onClick={() => handleCopyDomain(error.suggestedDomainToAdd)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-black font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-black" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3 Quick Steps to fix */}
        <div className="text-[11px] text-slate-700 dark:text-neutral-300 space-y-1.5 bg-amber-100/50 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-200/50 dark:border-amber-500/20">
          <div className="font-semibold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>How to allow this Netlify domain (Takes ~20 seconds):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>
              Open Firebase Console{' '}
              <a
                href={error.firebaseConsoleUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#7c3aed] dark:text-[#a78bfa] hover:underline"
              >
                <span>Authorized Domains Settings</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            </li>
            <li>
              Scroll to the <strong>Authorized domains</strong> section and click <strong>Add domain</strong>.
            </li>
            <li>
              Paste <strong className="font-mono text-amber-900 dark:text-amber-300">{error.suggestedDomainToAdd}</strong> and click <strong>Save</strong>.
            </li>
          </ol>
        </div>

        {/* Direct Action Link */}
        <a
          href={error.firebaseConsoleUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-xs transition-all shadow-sm"
        >
          <span>Open Firebase Authorized Domains Settings</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // 2. OPERATION NOT ALLOWED (Email/Password disabled in Firebase)
  if (error.isOperationNotAllowed) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-3 animate-in fade-in duration-200">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 text-sm">
              Email/Password Sign-In Is Disabled
            </h4>
            <p className="text-slate-600 dark:text-neutral-300 leading-relaxed text-[12px]">
              By default, this Firebase project has <strong>Google Authentication</strong> enabled. Email/Password provider is not activated in the Firebase Console.
            </p>
          </div>
        </div>

        {onGoogleSignIn && (
          <div className="bg-white/80 dark:bg-black/30 rounded-xl p-3 space-y-2 border border-amber-200 dark:border-white/5">
            <p className="text-slate-800 dark:text-white font-medium flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                ✓
              </span>
              <span>Instant Login: Use your Google account</span>
            </p>
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <span>Continue with Google</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="text-[11px] text-slate-600 dark:text-neutral-400 space-y-1 pt-1 border-t border-amber-200 dark:border-amber-500/20">
          <p className="text-slate-700 dark:text-neutral-300 font-medium">To enable Email/Password login:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>
              Open the{' '}
              <a
                href={error.firebaseConsoleUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-700 dark:text-amber-400 underline font-mono inline-flex items-center gap-1"
              >
                <span>Firebase Providers Console</span>
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>
            </li>
            <li>Click <strong>Authentication &gt; Sign-in method</strong></li>
            <li>Click <strong>Email/Password</strong>, toggle <strong>Enable</strong>, and Save.</li>
          </ol>
        </div>
      </div>
    );
  }

  // 3. STANDARD USER-FACING ERROR
  return (
    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs space-y-1 animate-in fade-in duration-150">
      <div className="font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
        <span>{error.title}</span>
      </div>
      <p className="text-rose-800/90 dark:text-rose-300/90 leading-relaxed pl-5">
        {error.message}
      </p>
    </div>
  );
};
