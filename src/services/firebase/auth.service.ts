/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  signInWithPhoneNumber,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  type ConfirmationResult,
  type UserCredential,
  type AuthError,
} from 'firebase/auth';
import { auth } from './init';
import { isFirebaseConfigured, firebaseValidation } from '../../config/firebase.config';

export interface PhoneAuthSession {
  confirmationResult: ConfirmationResult | null;
  phoneNumber: string;
}

/**
 * Initializes and binds a Firebase RecaptchaVerifier to a DOM container with safe lifecycle management
 */
export function setupRecaptchaVerifier(containerId: string): RecaptchaVerifier | null {
  if (!auth) {
    console.warn('[AuthService] Firebase auth is not initialized.');
    return null;
  }

  // Ensure DOM container exists
  const oldContainer = document.getElementById(containerId);
  if (!oldContainer) {
    console.warn(`[AuthService] Container element #${containerId} not found in DOM.`);
    return null;
  }

  try {
    // 1. Clear any previous global instance and remove leftover widgets
    cleanupRecaptchaVerifier((window as any).recaptchaVerifier);

    // 2. To permanently prevent "reCAPTCHA has already been rendered in this element",
    // replace the container with a brand new clean DOM node so grecaptcha's internal element map is reset
    const freshContainer = document.createElement('div');
    freshContainer.id = containerId;
    if (oldContainer.parentNode) {
      oldContainer.parentNode.replaceChild(freshContainer, oldContainer);
    }

    const verifier = new RecaptchaVerifier(auth, freshContainer, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved automatically by user or invisible challenge
      },
      'expired-callback': () => {
        console.warn('[AuthService] reCAPTCHA token expired.');
      },
    });

    (window as any).recaptchaVerifier = verifier;
    return verifier;
  } catch (error: any) {
    console.error('[AuthService] Error creating RecaptchaVerifier:', error);
    return null;
  }
}

/**
 * Safely clears and destroys a RecaptchaVerifier instance
 */
export function cleanupRecaptchaVerifier(verifier: RecaptchaVerifier | null): void {
  if (verifier) {
    try {
      verifier.clear();
    } catch (e) {
      // Safe ignore
    }
  }
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      // Safe ignore
    }
    (window as any).recaptchaVerifier = null;
  }
  // Remove any leftover invisible recaptcha badges added to document.body
  if (typeof document !== 'undefined') {
    const badges = document.querySelectorAll('.grecaptcha-badge');
    badges.forEach((b) => b.remove());
  }
}

/**
 * Translates Firebase Auth error codes into human-readable, actionable guidance
 */
export function mapFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  const message = (error?.message || '').toLowerCase();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'your domain';

  if (message.includes('recaptcha has already been rendered')) {
    return 'Security verification re-initialized. Please tap Send OTP again.';
  }

  if (
    code === 'auth/operation-not-allowed' ||
    message.includes('sms unable to be sent') ||
    message.includes('region enabled')
  ) {
    if (message.includes('region') || message.includes('sms unable to be sent')) {
      return (
        'Firebase SMS Region Policy: SMS delivery to this country is currently restricted in Firebase Console. ' +
        'To resolve: In Firebase Console > Authentication > Settings > SMS Region Policy, add your country code (e.g. India +91). ' +
        'Alternatively, configure this number in Firebase Console > Authentication > Sign-in method > Phone > "Phone numbers for testing" for instant verification.'
      );
    }
    return (
      'Phone authentication is disabled in Firebase Console. ' +
      'In Firebase Console > Authentication > Sign-in method, click "Phone", toggle "Enable", and click "Save".'
    );
  }

  switch (code) {
    case 'auth/configuration-not-found':
      return (
        'Phone Authentication is not enabled for this Firebase project. ' +
        'In the Firebase Console (console.firebase.google.com), open Authentication > Sign-in method, ' +
        'click "Phone", toggle "Enable", and click "Save". If using a new project, ensure Identity Platform is enabled.'
      );

    case 'auth/invalid-api-key':
      return 'Invalid Firebase API Key. Please verify VITE_FIREBASE_API_KEY in your environment configuration.';

    case 'auth/unauthorized-domain':
      return (
        `Domain "${hostname}" is not authorized for Firebase Authentication. ` +
        `In Firebase Console > Authentication > Settings > Authorized domains, add "${hostname}".`
      );

    case 'auth/invalid-phone-number':
      return 'Invalid mobile phone number format. Please ensure the number follows international E.164 format (e.g. +91 98765 43210).';

    case 'auth/too-many-requests':
      return 'Too many OTP attempts or SMS quota exceeded. Please wait a few minutes before trying again.';

    case 'auth/quota-exceeded':
      return (
        'Firebase SMS daily quota has been exceeded for this project. ' +
        'Tip: You can add Test Phone Numbers in Firebase Console (Authentication > Sign-in method > Phone) to test without SMS quota.'
      );

    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed or expired. Please refresh the page and try again.';

    case 'auth/invalid-verification-code':
      return 'Incorrect 6-digit OTP code. Please check your SMS and enter the valid verification code.';

    case 'auth/code-expired':
      return 'This verification code has expired. Please tap "Resend Verification Code" to request a new OTP.';

    case 'auth/session-expired':
      return 'The verification session has expired. Please re-enter your mobile number to receive a new OTP.';

    case 'auth/missing-phone-number':
      return 'Mobile phone number is required.';

    case 'auth/missing-verification-code':
      return 'Please enter all 6 digits of the verification code.';

    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connectivity.';

    case 'auth/popup-blocked':
      return 'Google Sign-In popup was blocked by your browser. Please allow popups for this site and retry.';

    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled before completion.';

    case 'auth/cancelled-popup-request':
      return 'Another sign-in popup is already open. Please complete or close it.';

    default:
      if (error?.message?.includes('configuration-not-found')) {
        return (
          'Phone Authentication is not enabled in Firebase Console. ' +
          'Navigate to Authentication > Sign-in method, click "Phone", toggle "Enable", and click "Save".'
        );
      }
      return error?.message || 'Authentication error occurred. Please try again.';
  }
}

/**
 * Sends a real SMS OTP to the recipient phone number via Firebase Phone Auth
 */
export async function sendFirebaseOtp(
  phoneNumberE164: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      firebaseValidation.errorMessage ||
        'Firebase is not configured with production credentials. Please configure your .env file.'
    );
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumberE164, verifier);
    return confirmationResult;
  } catch (error: any) {
    console.warn('[AuthService] Firebase phone OTP notice:', error?.code || error?.message);
    const friendlyMessage = mapFirebaseAuthError(error);
    const customErr: any = new Error(friendlyMessage);
    customErr.code = error?.code;
    customErr.originalError = error;
    throw customErr;
  }
}

/**
 * Confirms the 6-digit OTP code entered by the user
 */
export async function confirmFirebaseOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<UserCredential> {
  try {
    const credential = await confirmationResult.confirm(otpCode);
    return credential;
  } catch (error: any) {
    console.warn('[AuthService] OTP verification notice:', error?.code || error?.message);
    const friendlyMessage = mapFirebaseAuthError(error);
    const customErr: any = new Error(friendlyMessage);
    customErr.code = error?.code;
    customErr.originalError = error;
    throw customErr;
  }
}

/**
 * Google Sign-In using Firebase Authentication
 */
export async function signInWithGoogleProvider(): Promise<UserCredential> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      firebaseValidation.errorMessage ||
        'Firebase is not configured with production credentials. Please configure your .env file.'
    );
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const credential = await signInWithPopup(auth, provider);
    return credential;
  } catch (error: any) {
    console.warn('[AuthService] Google Sign-In notice:', error?.code || error?.message);
    const friendlyMessage = mapFirebaseAuthError(error);
    const customErr: any = new Error(friendlyMessage);
    customErr.code = error?.code;
    customErr.originalError = error;
    throw customErr;
  }
}

/**
 * Signs the user out from Firebase
 */
export async function signOutFirebase(): Promise<void> {
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.warn('[AuthService] Sign out notice:', error);
    }
  }
}
