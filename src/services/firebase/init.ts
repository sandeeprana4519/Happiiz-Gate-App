/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import {
  isFirebaseConfigured,
  firebaseValidation,
  type FirebaseClientConfig,
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
} else if (firebaseValidation.errorMessage) {
  console.info('[Happiiz Gate] Running in Development Preview Mode:', firebaseValidation.errorMessage);
}

export { app, auth, db, storage };

export const getFirebaseStatus = () => ({
  configured: isFirebaseConfigured,
  initialized: Boolean(app && auth),
  error: initError || firebaseValidation.errorMessage,
  projectId: firebaseValidation.config?.projectId || null,
  authDomain: firebaseValidation.config?.authDomain || null,
});
