/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FirebaseConfigValidation {
  isValid: boolean;
  isPlaceholder: boolean;
  missingKeys: string[];
  errorMessage: string | null;
  config: FirebaseClientConfig | null;
}

const env = import.meta.env;

// Raw values from Vite environment
export const rawFirebaseConfig: Partial<FirebaseClientConfig> = {
  apiKey: (env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: (env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (env.VITE_FIREBASE_APP_ID || '').trim(),
  measurementId: (env.VITE_FIREBASE_MEASUREMENT_ID || '').trim(),
};

/**
 * Checks if a string contains known example template placeholders.
 */
function isPlaceholderValue(val?: string): boolean {
  if (!val) return false;
  const lower = val.toLowerCase();
  return (
    lower.includes('yourapikeyhere') ||
    lower.includes('your_') ||
    lower.includes('placeholder') ||
    lower.includes('happiiz-gate-prod') ||
    lower.includes('123456789012') ||
    lower.includes('abcdef123456789') ||
    lower.includes('your-project') ||
    lower.includes('example.com') ||
    val.includes('<') ||
    val.includes('>')
  );
}

/**
 * Validates whether the Firebase configuration is complete, non-placeholder, and syntactically valid.
 */
export function validateFirebaseConfig(): FirebaseConfigValidation {
  const missingKeys: string[] = [];

  if (!rawFirebaseConfig.apiKey) missingKeys.push('VITE_FIREBASE_API_KEY');
  if (!rawFirebaseConfig.projectId) missingKeys.push('VITE_FIREBASE_PROJECT_ID');
  if (!rawFirebaseConfig.appId) missingKeys.push('VITE_FIREBASE_APP_ID');

  const hasPlaceholder =
    isPlaceholderValue(rawFirebaseConfig.apiKey) ||
    isPlaceholderValue(rawFirebaseConfig.projectId) ||
    isPlaceholderValue(rawFirebaseConfig.appId) ||
    isPlaceholderValue(rawFirebaseConfig.authDomain);

  if (missingKeys.length > 0) {
    return {
      isValid: false,
      isPlaceholder: false,
      missingKeys,
      errorMessage: `Missing required Firebase environment variables: ${missingKeys.join(', ')}.`,
      config: null,
    };
  }

  if (hasPlaceholder) {
    return {
      isValid: false,
      isPlaceholder: true,
      missingKeys: [],
      errorMessage:
        'Firebase configuration contains sample template placeholders (e.g. AIzaSyYourApiKeyHere). Please replace them with actual credentials from your Firebase Console.',
      config: null,
    };
  }

  // Basic API key format validation (Firebase Web API keys start with "AIza")
  if (!rawFirebaseConfig.apiKey?.startsWith('AIza') || rawFirebaseConfig.apiKey.length < 30) {
    return {
      isValid: false,
      isPlaceholder: false,
      missingKeys: [],
      errorMessage:
        'VITE_FIREBASE_API_KEY appears malformed. Official Google/Firebase Web API keys start with "AIza".',
      config: null,
    };
  }

  // Derive authDomain if not explicitly provided
  const projectId = rawFirebaseConfig.projectId!;
  const authDomain =
    rawFirebaseConfig.authDomain && !isPlaceholderValue(rawFirebaseConfig.authDomain)
      ? rawFirebaseConfig.authDomain
      : `${projectId}.firebaseapp.com`;

  // Derive storageBucket if not explicitly provided
  const storageBucket =
    rawFirebaseConfig.storageBucket && !isPlaceholderValue(rawFirebaseConfig.storageBucket)
      ? rawFirebaseConfig.storageBucket
      : `${projectId}.firebasestorage.app`;

  const validConfig: FirebaseClientConfig = {
    apiKey: rawFirebaseConfig.apiKey!,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId: rawFirebaseConfig.messagingSenderId || '',
    appId: rawFirebaseConfig.appId!,
    measurementId: rawFirebaseConfig.measurementId || undefined,
  };

  return {
    isValid: true,
    isPlaceholder: false,
    missingKeys: [],
    errorMessage: null,
    config: validConfig,
  };
}

// Global cached validation
export const firebaseValidation = validateFirebaseConfig();

/**
 * True if and only if valid, non-placeholder Firebase credentials are provided.
 */
export const isFirebaseConfigured: boolean = firebaseValidation.isValid;

/**
 * True if environment variables contain sample values like AIzaSyYourApiKeyHere.
 */
export const isUsingPlaceholderConfig: boolean = firebaseValidation.isPlaceholder;

export const IS_DEV_MODE =
  env.DEV ||
  env.VITE_ENABLE_DEV_MOCK_AUTH === 'true' ||
  !isFirebaseConfigured;
