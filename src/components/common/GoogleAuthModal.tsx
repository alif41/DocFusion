import React, { useState } from 'react';
import { Button } from './Button';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email?: string) => Promise<void>;
  title?: string;
  subtitle?: string;
  isSavePrompt?: boolean;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  title = 'LOGIN WITH GOOGLE',
  subtitle = 'Sign in with your Google account via Firebase Authentication to unlock persistent cloud file storage.',
  isSavePrompt = false,
}) => {
  const [emailInput, setEmailInput] = useState('alifalmahmudn@gmail.com');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await onSignIn(emailInput.trim() || undefined);
      onClose();
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20221F]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E5E5E0] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-[#EFF6EE] border border-[#D1E6CF] text-[10px] font-mono font-bold text-[#4D7543] rounded">
            FIREBASE AUTHENTICATION
          </div>
          <h2 className="text-xl font-black tracking-tight text-[#171717]">
            {isSavePrompt ? 'Want to keep your files and access them later?' : title}
          </h2>
          <p className="text-xs text-[#666666] leading-relaxed">
            {isSavePrompt
              ? 'Files created without an account are temporary and may be removed after you leave or after the temporary session expires. Sign in to save this file to your personal workspace.'
              : subtitle}
          </p>
        </div>

        {/* Account selection / authentication card */}
        <div className="bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl p-4 space-y-3">
          <label className="text-xs font-mono text-[#888888] block">
            AUTHENTICATE AS GOOGLE USER:
          </label>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="your-google-email@gmail.com"
            className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-[#FFFFFF] border border-[#D5D5CF] rounded-xl focus:border-[#20221F] outline-none text-[#171717]"
          />
          <p className="text-[11px] text-[#888888] leading-tight">
            Connects securely to Firebase Google Sign-In with client token verification.
          </p>
        </div>

        {/* Action Buttons (NO ICONS) */}
        <div className="space-y-2 pt-1">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
            onClick={handleSignIn}
          >
            {isLoading ? 'AUTHENTICATING...' : 'LOGIN WITH GOOGLE'}
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={onClose}
          >
            {isSavePrompt ? 'CONTINUE WITHOUT SAVING' : 'CONTINUE AS GUEST'}
          </Button>
        </div>

        <div className="text-[10px] font-mono text-[#888888] text-center border-t border-[#EFEFEA] pt-3">
          All processing features work completely in Guest Mode without login.
        </div>
      </div>
    </div>
  );
};
