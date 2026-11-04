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
  type User,
} from 'firebase/auth';
import { auth } from './init';
import { isFirebaseConfigured } from '../../config/firebase.config';

export interface PhoneAuthSession {
  confirmationResult: ConfirmationResult | null;
  phoneNumber: string;
}

/**
 * Initializes and binds a Firebase RecaptchaVerifier to a DOM container
 */
export function setupRecaptchaVerifier(containerId: string): RecaptchaVerifier | null {
  if (!auth) {
    console.warn('[AuthService] Firebase auth not initialized.');
    return null;
  }

  try {
    // Clear any existing verifier instance from window
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {
        // ignore clear error
      }
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved automatically
      },
      'expired-callback': () => {
        console.warn('[AuthService] reCAPTCHA token expired. Resetting verifier.');
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
 * Sends a real SMS OTP to the recipient phone number via Firebase Phone Auth
 */
export async function sendFirebaseOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult;
  } catch (error: any) {
    console.error('[AuthService] Firebase phone OTP error:', error);

    // Human-readable mapping of Firebase Auth error codes
    switch (error.code) {
      case 'auth/invalid-phone-number':
        throw new Error('Invalid mobile phone number format. Please check the country code and digits.');
      case 'auth/too-many-requests':
        throw new Error('Too many OTP attempts or SMS quota exceeded. Please wait a few minutes before trying again.');
      case 'auth/quota-exceeded':
        throw new Error('Firebase SMS daily quota has been exceeded. Please try again later or contact your society administrator.');
      case 'auth/captcha-check-failed':
        throw new Error('reCAPTCHA verification failed. Please refresh the page and try again.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your internet connection.');
      case 'auth/billing-not-enabled':
        throw new Error('Firebase Phone Auth requires an active project setup. Please verify your Firebase Console settings.');
      default:
        throw new Error(error.message || 'Failed to send verification SMS OTP.');
    }
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
    console.error('[AuthService] OTP verification failed:', error);

    switch (error.code) {
      case 'auth/invalid-verification-code':
        throw new Error('Incorrect 6-digit OTP code. Please check your SMS and enter the valid code.');
      case 'auth/code-expired':
        throw new Error('This OTP code has expired. Please request a new code using the resend button.');
      case 'auth/session-expired':
        throw new Error('The verification session has expired. Please re-enter your phone number.');
      default:
        throw new Error(error.message || 'OTP verification failed. Please try again.');
    }
  }
}

/**
 * Google Sign-In using Firebase Authentication
 */
export async function signInWithGoogleProvider(): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please check your configuration.');
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const credential = await signInWithPopup(auth, provider);
    return credential;
  } catch (error: any) {
    console.error('[AuthService] Google Sign-In failed:', error);

    switch (error.code) {
      case 'auth/popup-blocked':
        throw new Error('Google Sign-In popup was blocked by your browser. Please allow popups for this site and retry.');
      case 'auth/popup-closed-by-user':
        throw new Error('Sign-in was cancelled before completion.');
      case 'auth/cancelled-popup-request':
        throw new Error('Another sign-in popup is already open.');
      case 'auth/network-request-failed':
        throw new Error('Network error during Google authentication.');
      default:
        throw new Error(error.message || 'Google Sign-In failed. Please try again or use Phone OTP.');
    }
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
      console.error('[AuthService] Sign out error:', error);
    }
  }
}
