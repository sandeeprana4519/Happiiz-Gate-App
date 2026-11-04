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

// Read variables from Vite client environment
const env = import.meta.env;

export const rawFirebaseConfig: Partial<FirebaseClientConfig> = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

/**
 * Validates if the required Firebase config keys are supplied.
 * If not supplied, the app enters high-fidelity Mock/Development mode
 * with full visual preview of all 5 role dashboards.
 */
export const isFirebaseConfigured = Boolean(
  rawFirebaseConfig.apiKey &&
    rawFirebaseConfig.projectId &&
    rawFirebaseConfig.appId &&
    !rawFirebaseConfig.apiKey.includes('YOUR_') &&
    !rawFirebaseConfig.projectId.includes('placeholder')
);

export const IS_DEV_MODE =
  env.DEV ||
  env.VITE_ENABLE_DEV_MOCK_AUTH === 'true' ||
  !isFirebaseConfigured;
