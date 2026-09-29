import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DocFusionLogo } from '../components/common/DocFusionLogo';
import { Button } from '../components/common/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../contexts/AuthContext';
import { formatAuthError, FormattedAuthError } from '../lib/authErrors';
import { AuthErrorCard } from '../components/auth/AuthErrorCard';

export const RegisterPage: React.FC = () => {
  useDocumentTitle('Create Account - DocFusion');
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle, user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<FormattedAuthError | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-neutral-300 dark:bg-neutral-700' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = calculatePasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (authError) setAuthError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setAuthError(
        formatAuthError({
          code: 'client/missing-fields',
          message: 'Please complete all required fields.',
        })
      );
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setAuthError(
        formatAuthError({
          code: 'client/password-mismatch',
          message: 'Passwords do not match. Please verify.',
        })
      );
      return;
    }
    if (formData.password.length < 6) {
      setAuthError(
        formatAuthError({
          code: 'auth/weak-password',
          message: 'Password should be at least 6 characters.',
        })
      );
      return;
    }
    if (!formData.agreeTerms) {
      setAuthError(
        formatAuthError({
          code: 'client/terms-not-accepted',
          message: 'Please agree to the Terms of Service to proceed.',
        })
      );
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      await signUpWithEmail(formData.email, formData.password, formData.name);
      setSuccessMsg('Account registered successfully!');
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      setAuthError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      setSuccessMsg('Successfully signed in with Google!');
      navigate('/');
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setAuthError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block">
            <DocFusionLogo size="lg" showSubtitle={true} />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Your Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
            Get instant access to DocFusion&apos;s unified document tools.
          </p>
        </div>

        {/* Card Box */}
        <div className="rounded-3xl border border-slate-200 dark:border-[#222234] bg-white dark:bg-[#0c0c14] p-6 sm:p-8 shadow-xl dark:shadow-2xl dark:shadow-black/80 space-y-6">
          {/* Error & Status Messages */}
          <AuthErrorCard
            error={authError}
            onGoogleSignIn={handleGoogleSignIn}
            isLoading={isLoading}
          />

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Social SSO */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-500 dark:text-neutral-400">
                Fast Sign-Up
              </span>
              <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Active &amp; Ready
              </span>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-[#141422] dark:hover:bg-[#1c1c2e] border border-slate-300 dark:border-[#2b2b40] hover:border-[#7c3aed]/50 text-sm font-semibold text-slate-800 dark:text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 6.3 10.1 6.3z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-[#1f1f2e] w-full" />
            <span className="bg-white dark:bg-[#0c0c14] px-3 text-[11px] font-mono uppercase text-slate-500 dark:text-neutral-500 absolute">
              or register with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="w-full bg-slate-50 dark:bg-[#13131e] border border-slate-300 dark:border-[#252538] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 dark:bg-[#13131e] border border-slate-300 dark:border-[#252538] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-slate-50 dark:bg-[#13131e] border border-slate-300 dark:border-[#252538] rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500 dark:text-neutral-500">Security:</span>
                    <span className="text-slate-700 dark:text-neutral-300">{strength.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-1">
                    <div className={`rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200 dark:bg-neutral-800'}`} />
                    <div className={`rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200 dark:bg-neutral-800'}`} />
                    <div className={`rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200 dark:bg-neutral-800'}`} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-50 dark:bg-[#13131e] border border-slate-300 dark:border-[#252538] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 rounded border-slate-300 dark:border-[#2a2a3e] bg-slate-50 dark:bg-[#141422] text-[#7c3aed] focus:ring-0 w-3.5 h-3.5 shrink-0"
                />
                <span>
                  I agree to the Terms of Service and acknowledge the Zero-Knowledge Privacy Architecture.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>
        </div>

        {/* Footer switch link */}
        <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-[#7c3aed] dark:text-[#a78bfa] hover:underline transition-colors">
            Sign in to your account →
          </Link>
        </p>
      </div>
    </div>
  );
};
