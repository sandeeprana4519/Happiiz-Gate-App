/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './init';
import {
  UserProfile,
  SocietyMembership,
  ServicePartnerProfile,
  AccessRequest,
  UserRole,
  MembershipStatus,
} from '../../types/auth';
import { GatePass, Society } from '../../types/society';
import { MOCK_USERS, MOCK_SOCIETIES, MOCK_GATE_PASSES } from '../mock/mockData';

// Firestore Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  SOCIETIES: 'societies',
  MEMBERS: 'members', // subcollection inside societies/{societyId}/members/{uid}
  SERVICE_PARTNERS: 'servicePartners',
  ACCESS_REQUESTS: 'accessRequests',
  GATE_PASSES: 'gate_passes',
  VISITORS: 'visitors',
  ALERTS: 'security_alerts',
  FACILITIES: 'facility_bookings',
  ADMINS: 'admins',
} as const;

// Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      phoneNumber: auth?.currentUser?.phoneNumber || null,
    },
  };
  console.error('[Firestore Error]', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------------------------------------------------------------
// USER PROFILE OPERATIONS
// ----------------------------------------------------------------------

export async function getFirestoreUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) {
    // Dev fallback if Firebase is not yet provisioned in .env
    const found = Object.values(MOCK_USERS).find((u) => u.uid === uid);
    return found || null;
  }
  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveFirestoreUserProfile(profile: UserProfile): Promise<boolean> {
  if (!db) return true;
  const path = `${COLLECTIONS.USERS}/${profile.uid}`;
  try {
    const userRef = doc(db, COLLECTIONS.USERS, profile.uid);
    await setDoc(
      userRef,
      {
        ...profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateFirestoreUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  if (!db) return true;
  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ----------------------------------------------------------------------
// SOCIETY & MULTI-TENANT MEMBERSHIP OPERATIONS
// ----------------------------------------------------------------------

export async function getAllSocieties(): Promise<Society[]> {
  if (!db) return MOCK_SOCIETIES;
  const path = COLLECTIONS.SOCIETIES;
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.SOCIETIES));
    if (snap.empty) {
      return MOCK_SOCIETIES;
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Society));
  } catch (error) {
    console.warn('[Firestore] Falling back to initial societies list:', error);
    return MOCK_SOCIETIES;
  }
}

export async function getSocietyById(societyId: string): Promise<Society | null> {
  if (!db) {
    return MOCK_SOCIETIES.find((s) => s.id === societyId) || null;
  }
  const path = `${COLLECTIONS.SOCIETIES}/${societyId}`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.SOCIETIES, societyId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Society;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createSociety(society: Society): Promise<boolean> {
  if (!db) return true;
  const path = `${COLLECTIONS.SOCIETIES}/${society.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.SOCIETIES, society.id), {
      ...society,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch all society memberships for a specific user across all societies
 */
export async function getUserSocietyMemberships(uid: string): Promise<SocietyMembership[]> {
  if (!db) {
    // Dev fallback
    return [
      {
        uid,
        societyId: 'soc_emerald_heights',
        societyName: 'Emerald Heights Luxury Enclave',
        societyCode: 'EMR-01',
        role: 'RESIDENT',
        membershipStatus: 'ACTIVE',
        wingId: 'Tower B',
        flatId: 'B-704',
        occupantType: 'OWNER',
        joinedAt: '2026-02-15T10:15:00Z',
      },
    ];
  }

  try {
    // In Firestore, we check each society's members subcollection or query user memberships
    // To support fast multi-society listing without collection group query indexing complexities,
    // we query societies list and fetch the member doc
    const societies = await getAllSocieties();
    const memberships: SocietyMembership[] = [];

    for (const soc of societies) {
      try {
        const memberRef = doc(db, COLLECTIONS.SOCIETIES, soc.id, COLLECTIONS.MEMBERS, uid);
        const snap = await getDoc(memberRef);
        if (snap.exists()) {
          memberships.push({
            id: snap.id,
            societyId: soc.id,
            societyName: soc.societyName,
            societyCode: soc.societyCode,
            ...snap.data(),
          } as SocietyMembership);
        }
      } catch (e) {
        // Continue checking other societies
      }
    }

    return memberships;
  } catch (error) {
    console.error('[Firestore] Error getting user society memberships:', error);
    return [];
  }
}

export async function addSocietyMembership(membership: SocietyMembership): Promise<boolean> {
  if (!db) return true;
  const path = `${COLLECTIONS.SOCIETIES}/${membership.societyId}/${COLLECTIONS.MEMBERS}/${membership.uid}`;
  try {
    const memberRef = doc(
      db,
      COLLECTIONS.SOCIETIES,
      membership.societyId,
      COLLECTIONS.MEMBERS,
      membership.uid
    );
    await setDoc(memberRef, {
      ...membership,
      joinedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateMembershipStatus(
  societyId: string,
  uid: string,
  status: MembershipStatus,
  approvedBy?: string,
  rejectionReason?: string
): Promise<boolean> {
  if (!db) return true;
  const path = `${COLLECTIONS.SOCIETIES}/${societyId}/${COLLECTIONS.MEMBERS}/${uid}`;
  try {
    const memberRef = doc(db, COLLECTIONS.SOCIETIES, societyId, COLLECTIONS.MEMBERS, uid);
    await updateDoc(memberRef, {
      membershipStatus: status,
      approvedBy: approvedBy || null,
      approvedAt: status === 'ACTIVE' ? new Date().toISOString() : null,
      rejectionReason: rejectionReason || null,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ----------------------------------------------------------------------
// SERVICE PARTNERS
// ----------------------------------------------------------------------

export async function getServicePartnerProfile(uid: string): Promise<ServicePartnerProfile | null> {
  if (!db) return null;
  const path = `${COLLECTIONS.SERVICE_PARTNERS}/${uid}`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.SERVICE_PARTNERS, uid));
    if (snap.exists()) {
      return snap.data() as ServicePartnerProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveServicePartnerProfile(
  profile: ServicePartnerProfile
): Promise<boolean> {
  if (!db) return true;
  const path = `${COLLECTIONS.SERVICE_PARTNERS}/${profile.uid}`;
  try {
    await setDoc(doc(db, COLLECTIONS.SERVICE_PARTNERS, profile.uid), {
      ...profile,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------------------------
// ACCESS REQUESTS & APPROVAL WORKFLOW
// ----------------------------------------------------------------------

export async function createAccessRequest(request: AccessRequest): Promise<boolean> {
  if (!db) return true;
  const path = `${COLLECTIONS.ACCESS_REQUESTS}/${request.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ACCESS_REQUESTS, request.id), {
      ...request,
      submittedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getAccessRequestsForSociety(societyId: string): Promise<AccessRequest[]> {
  if (!db) return [];
  const path = COLLECTIONS.ACCESS_REQUESTS;
  try {
    const q = query(
      collection(db, COLLECTIONS.ACCESS_REQUESTS),
      where('societyId', '==', societyId),
      orderBy('submittedAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AccessRequest));
  } catch (error) {
    console.error('[Firestore] Error getting society access requests:', error);
    return [];
  }
}

export async function getAllAccessRequests(): Promise<AccessRequest[]> {
  if (!db) return [];
  const path = COLLECTIONS.ACCESS_REQUESTS;
  try {
    const q = query(
      collection(db, COLLECTIONS.ACCESS_REQUESTS),
      orderBy('submittedAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AccessRequest));
  } catch (error) {
    console.error('[Firestore] Error getting all access requests:', error);
    return [];
  }
}

export async function reviewAccessRequest(
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
  reviewedBy: string,
  reviewNotes?: string
): Promise<boolean> {
  if (!db) return true;
  const path = `${COLLECTIONS.ACCESS_REQUESTS}/${requestId}`;
  try {
    const reqRef = doc(db, COLLECTIONS.ACCESS_REQUESTS, requestId);
    await updateDoc(reqRef, {
      status,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      reviewNotes: reviewNotes || null,
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ----------------------------------------------------------------------
// GATE PASSES
// ----------------------------------------------------------------------

export async function getActiveGatePasses(societyId: string): Promise<GatePass[]> {
  if (!db) return MOCK_GATE_PASSES;
  const path = COLLECTIONS.GATE_PASSES;
  try {
    const q = query(
      collection(db, COLLECTIONS.GATE_PASSES),
      where('societyId', '==', societyId),
      limit(50)
    );
    const snap = await getDocs(q);
    if (snap.empty) return MOCK_GATE_PASSES;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GatePass));
  } catch (error) {
    console.warn('[Firestore] Falling back to mock gate passes:', error);
    return MOCK_GATE_PASSES;
  }
}

export async function createGatePass(pass: Omit<GatePass, 'id'>): Promise<string | null> {
  if (!db) return `PASS-${Date.now()}`;
  const path = COLLECTIONS.GATE_PASSES;
  try {
    const passRef = doc(collection(db, COLLECTIONS.GATE_PASSES));
    await setDoc(passRef, {
      ...pass,
      createdAt: new Date().toISOString(),
    });
    return passRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
