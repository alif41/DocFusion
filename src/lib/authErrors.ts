import { firebaseConfig } from './firebase';

export interface FormattedAuthError {
  code: string;
  title: string;
  message: string;
  isUnauthorizedDomain?: boolean;
  isOperationNotAllowed?: boolean;
  isPopupBlocked?: boolean;
  isPopupClosed?: boolean;
  currentHostname: string;
  suggestedDomainToAdd: string;
  firebaseConsoleUrl: string;
}

/**
 * Normalizes Firebase Authentication error codes and messages into
 * actionable, user-friendly diagnostic information.
 */
export function formatAuthError(error: any): FormattedAuthError {
  const code: string = error?.code || '';
  const rawMessage: string = error?.message || String(error || '');
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = firebaseConfig.projectId || 'regal-cubist-hcb1c';
  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  // Determine the best domain to add to Authorized Domains in Firebase
  let suggestedDomainToAdd = currentHostname || 'your-site.netlify.app';
  if (currentHostname.endsWith('.netlify.app')) {
    // Authorizing 'netlify.app' covers the primary domain, custom subdomains, branch deploys, and deploy previews!
    suggestedDomainToAdd = 'netlify.app';
  }

  const isUnauthorizedDomain =
    code === 'auth/unauthorized-domain' ||
    rawMessage.includes('unauthorized-domain') ||
    rawMessage.includes('auth/unauthorized-domain');

  const isOperationNotAllowed =
    code === 'auth/operation-not-allowed' ||
    rawMessage.includes('operation-not-allowed');

  const isPopupBlocked =
    code === 'auth/popup-blocked' ||
    rawMessage.includes('popup-blocked');

  const isPopupClosed =
    code === 'auth/popup-closed-by-user' ||
    rawMessage.includes('popup-closed-by-user');

  if (isUnauthorizedDomain) {
    return {
      code: code || 'auth/unauthorized-domain',
      title: 'Domain Not Authorized in Firebase',
      message: `The domain "${currentHostname || 'this site'}" is not authorized for Firebase Authentication operations.`,
      isUnauthorizedDomain: true,
      currentHostname,
      suggestedDomainToAdd,
      firebaseConsoleUrl,
    };
  }

  if (isOperationNotAllowed) {
    return {
      code: code || 'auth/operation-not-allowed',
      title: 'Email/Password Sign-In Disabled',
      message:
        'Email & Password sign-in is not enabled in this Firebase project. You can sign in instantly with Google, or enable Email/Password provider in the Firebase Console.',
      isOperationNotAllowed: true,
      currentHostname,
      suggestedDomainToAdd,
      firebaseConsoleUrl: `https://console.firebase.google.com/project/${projectId}/authentication/providers`,
    };
  }

  if (isPopupBlocked) {
    return {
      code: code || 'auth/popup-blocked',
      title: 'Sign-In Popup Blocked',
      message:
        'The Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.',
      isPopupBlocked: true,
      currentHostname,
      suggestedDomainToAdd,
      firebaseConsoleUrl,
    };
  }

  if (isPopupClosed) {
    return {
      code: code || 'auth/popup-closed-by-user',
      title: 'Sign-In Cancelled',
      message: 'The sign-in popup was closed before completing authentication.',
      isPopupClosed: true,
      currentHostname,
      suggestedDomainToAdd,
      firebaseConsoleUrl,
    };
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  ) {
    return {
      code,
      title: 'Invalid Credentials',
      message: 'Invalid email or password. Please verify credentials or create an account.',
      currentHostname,
      suggestedDomainToAdd,
      firebaseConsoleUrl,
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      code,
      title: 'Account Already Exists',
      message: 'An account with this email address already exists. Please sign in instead.',
      currentHostname,
      suggestedDomainToAdd,
      firebaseConsoleUrl,
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      code,
      title: 'Network Error',
      message: 'Unable to connect to authentication servers. Please verify your internet connection.',
      currentHostname,
      suggestedDomainToAdd,
      firebaseConsoleUrl,
    };
  }

  if (code === 'auth/too-many-requests') {
    return {
      code,
      title: 'Temporarily Disabled',
      message: 'Access to this account has been temporarily disabled due to multiple failed login attempts. Please reset your password or try again later.',
      currentHostname,
      suggestedDomainToAdd,
      firebaseConsoleUrl,
    };
  }

  if (code === 'auth/weak-password') {
    return {
      code,
      title: 'Weak Password',
      message: 'Password must be at least 6 characters long.',
      currentHostname,
      suggestedDomainToAdd,
      firebaseConsoleUrl,
    };
  }

  if (code === 'auth/invalid-email') {
    return {
      code,
      title: 'Invalid Email',
      message: 'Please provide a valid email address.',
      currentHostname,
      suggestedDomainToAdd,
      firebaseConsoleUrl,
    };
  }

  // Fallback: Strip Firebase prefix if present
  const cleanMessage = rawMessage
    .replace(/^Firebase:\s*/i, '')
    .replace(/^Error\s*\(([^)]+)\):?\s*/i, '')
    .trim();

  return {
    code,
    title: 'Authentication Failed',
    message: cleanMessage || 'An unexpected error occurred during authentication. Please try again.',
    currentHostname,
    suggestedDomainToAdd,
    firebaseConsoleUrl,
  };
}
