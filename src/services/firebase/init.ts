/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import {
  isFirebaseConfigured,
  firebaseValidation,
  IS_PRODUCTION_BUILD,
  IS_DEV_MODE,
} from '../../config/firebase.config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let initError: string | null = null;

if (isFirebaseConfigured && firebaseValidation.config) {
  try {
    const existingApps = getApps();
    if (existingApps.length === 0) {
      app = initializeApp(firebaseValidation.config);
    } else {
      app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error: any) {
    console.warn('[Happiiz Gate] Firebase initialization error:', error);
    initError = error?.message || 'Failed to initialize Firebase instances.';
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
} else if (firebaseValidation.errorMessage && IS_DEV_MODE) {
  console.info('[Happiiz Gate] Running in Development Sandbox Mode:', firebaseValidation.errorMessage);
}

/**
 * Verifies live Firestore reachability against the configured backend.
 * Differentiates offline errors from permission/config errors cleanly.
 */
export async function testFirestoreConnection(): Promise<{
  connected: boolean;
  offline: boolean;
  error: string | null;
}> {
  if (!db) {
    return {
      connected: false,
      offline: false,
      error: firebaseValidation.errorMessage || 'Firestore is not initialized.',
    };
  }
  try {
    await getDocFromServer(doc(db, 'platformSettings', 'connection_health'));
    return { connected: true, offline: false, error: null };
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    const isOffline =
      msg.toLowerCase().includes('the client is offline') ||
      msg.toLowerCase().includes('unavailable');
    // Permission denied proves the Firestore backend responded over network
    if (msg.toLowerCase().includes('permission') || error?.code === 'permission-denied') {
      return { connected: true, offline: false, error: null };
    }
    return { connected: false, offline: isOffline, error: msg };
  }
}

export { app, auth, db, storage };

export const getFirebaseStatus = () => ({
  configured: isFirebaseConfigured,
  initialized: Boolean(app && auth && db),
  productionMode: IS_PRODUCTION_BUILD,
  devSandboxActive: IS_DEV_MODE,
  error: initError || firebaseValidation.errorMessage,
  projectId: firebaseValidation.config?.projectId || null,
  authDomain: firebaseValidation.config?.authDomain || null,
});
