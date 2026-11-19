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

// Node/tsx CLI fallback ONLY (never prevents Vite static `import.meta.env.VITE_*` inlining)
const nodeEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

// IMPORTANT: Always use direct static `import.meta.env.VITE_*` member expressions so Vite
// statically replaces and embeds all production Firebase config variables during `vite build`.
const VITE_API_KEY = import.meta.env?.VITE_FIREBASE_API_KEY ?? nodeEnv.VITE_FIREBASE_API_KEY ?? '';
const VITE_AUTH_DOMAIN = import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN ?? nodeEnv.VITE_FIREBASE_AUTH_DOMAIN ?? '';
const VITE_PROJECT_ID = import.meta.env?.VITE_FIREBASE_PROJECT_ID ?? nodeEnv.VITE_FIREBASE_PROJECT_ID ?? '';
const VITE_STORAGE_BUCKET = import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET ?? nodeEnv.VITE_FIREBASE_STORAGE_BUCKET ?? '';
const VITE_MESSAGING_SENDER_ID = import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID ?? nodeEnv.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '';
const VITE_APP_ID = import.meta.env?.VITE_FIREBASE_APP_ID ?? nodeEnv.VITE_FIREBASE_APP_ID ?? '';
const VITE_MEASUREMENT_ID = import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID ?? nodeEnv.VITE_FIREBASE_MEASUREMENT_ID ?? '';
const VITE_APP_ENV_RAW = import.meta.env?.VITE_APP_ENV ?? nodeEnv.VITE_APP_ENV ?? '';
const VITE_ENABLE_DEV_MOCK_AUTH_RAW =
  import.meta.env?.VITE_ENABLE_DEV_MOCK_AUTH ?? nodeEnv.VITE_ENABLE_DEV_MOCK_AUTH ?? '';
const VITE_IS_PROD = Boolean(import.meta.env?.PROD);

// Raw values from Vite environment
export const rawFirebaseConfig: Partial<FirebaseClientConfig> = {
  apiKey: String(VITE_API_KEY).trim(),
  authDomain: String(VITE_AUTH_DOMAIN).trim(),
  projectId: String(VITE_PROJECT_ID).trim(),
  storageBucket: String(VITE_STORAGE_BUCKET).trim(),
  messagingSenderId: String(VITE_MESSAGING_SENDER_ID).trim(),
  appId: String(VITE_APP_ID).trim(),
  measurementId: String(VITE_MEASUREMENT_ID).trim(),
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
      errorMessage: `Missing required Firebase build environment variables: ${missingKeys.join(', ')}. Configure them in .env.production or GitHub Actions Secrets and rebuild.`,
      config: null,
    };
  }

  if (hasPlaceholder) {
    return {
      isValid: false,
      isPlaceholder: true,
      missingKeys: [],
      errorMessage:
        'Firebase configuration contains sample template placeholders (e.g. YOUR_FIREBASE_API_KEY). Replace them with real values from Firebase Console > Project Settings and rebuild.',
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

/**
 * Strict Production vs Sandbox check:
 * - In production build (`PROD === true` or `VITE_APP_ENV === 'production'`) WITH valid Firebase,
 *   IS_DEV_MODE is strictly `false` (no mock auth bypasses or quick-test credentials exposed).
 * - If explicitly enabled in non-production OR Firebase keys are absent in dev, dev sandbox mode is active.
 */
export const IS_PRODUCTION_BUILD: boolean =
  VITE_IS_PROD || String(VITE_APP_ENV_RAW).toLowerCase() === 'production';

export const IS_DEV_MODE: boolean = isFirebaseConfigured
  ? !IS_PRODUCTION_BUILD && String(VITE_ENABLE_DEV_MOCK_AUTH_RAW).toLowerCase() === 'true'
  : !IS_PRODUCTION_BUILD || String(VITE_ENABLE_DEV_MOCK_AUTH_RAW).toLowerCase() === 'true';

/**
 * Non-secret runtime diagnostics for Firebase Auth & environment troubleshooting.
 * Never returns API keys, tokens, or credentials.
 */
export function getFirebaseDiagnostics() {
  return {
    isFirebaseConfigured,
    isUsingPlaceholderConfig,
    isProductionBuild: IS_PRODUCTION_BUILD,
    isDevMode: IS_DEV_MODE,
    projectId: firebaseValidation.config?.projectId || null,
    authDomain: firebaseValidation.config?.authDomain || null,
    missingKeys: firebaseValidation.missingKeys,
    configError: firebaseValidation.errorMessage,
  };
}
