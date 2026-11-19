/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './init';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload a visitor photograph or ID proof to Firebase Storage
 */
export async function uploadVisitorPhoto(
  file: File | Blob,
  societyId: string,
  passId: string
): Promise<UploadResult | null> {
  if (!storage) {
    console.warn('[Storage] Firebase Storage not initialized. Using fallback URL.');
    return {
      url: URL.createObjectURL(file),
      path: `mock/visitors/${passId}.jpg`,
    };
  }

  try {
    const timestamp = Date.now();
    const filePath = `societies/${societyId}/visitors/${passId}_${timestamp}.jpg`;
    const storageRef = ref(storage, filePath);
    
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: 'image/jpeg',
    });
    
    const url = await getDownloadURL(snapshot.ref);
    return { url, path: filePath };
  } catch (error) {
    console.error('[Storage] Error uploading visitor photo:', error);
    return null;
  }
}

/**
 * Upload society notice attachment or resident document
 */
export async function uploadDocument(
  file: File,
  societyId: string,
  category: 'notices' | 'kyc' | 'bills'
): Promise<UploadResult | null> {
  if (!storage) return null;
  try {
    const filePath = `societies/${societyId}/${category}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    const snap = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snap.ref);
    return { url, path: filePath };
  } catch (error) {
    console.error('[Storage] Error uploading document:', error);
    return null;
  }
}
