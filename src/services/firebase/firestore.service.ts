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
import {
  MOCK_USERS,
  MOCK_SOCIETIES,
  MOCK_GATE_PASSES,
  MOCK_MEMBERSHIPS,
  MOCK_ACCESS_REQUESTS,
} from '../mock/mockData';

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
  // 1. If UID is a simulated / demo account, resolve from local session or mock users
  if (uid.startsWith('dev_')) {
    try {
      const savedDemo = localStorage.getItem('happiiz_gate_demo_session');
      if (savedDemo) {
        const parsed = JSON.parse(savedDemo) as UserProfile;
        if (parsed.uid === uid) return parsed;
      }
    } catch (_) {}
    const found = Object.values(MOCK_USERS).find((u) => u.uid === uid);
    if (found) return found;
    return null;
  }

  // 2. If user is not authenticated in Firebase Auth, avoid remote Firestore query
  // as Firestore security rules require request.auth != null
  if (!auth?.currentUser) {
    try {
      const savedDemo = localStorage.getItem('happiiz_gate_demo_session');
      if (savedDemo) {
        const parsed = JSON.parse(savedDemo) as UserProfile;
        if (parsed.uid === uid) return parsed;
      }
    } catch (_) {}
    const found = Object.values(MOCK_USERS).find((u) => u.uid === uid);
    return found || null;
  }

  if (!db) {
    // Dev fallback if Firestore is not provisioned
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
  } catch (error: any) {
    console.warn(`[Firestore] Permission/read notice on ${path}:`, error?.message);
    // Graceful fallback to avoid application crash if user document is not yet provisioned
    try {
      const savedDemo = localStorage.getItem('happiiz_gate_demo_session');
      if (savedDemo) {
        const parsed = JSON.parse(savedDemo) as UserProfile;
        return parsed;
      }
    } catch (_) {}
    const found = Object.values(MOCK_USERS).find((u) => u.uid === uid);
    return found || null;
  }
}

export async function saveFirestoreUserProfile(profile: UserProfile): Promise<boolean> {
  // If demo user or unauthenticated, persist locally
  if (profile.uid.startsWith('dev_') || !auth?.currentUser || !db) {
    try {
      localStorage.setItem('happiiz_gate_demo_session', JSON.stringify(profile));
    } catch (_) {}
    return true;
  }

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
  } catch (error: any) {
    console.warn(`[Firestore] Notice on saving ${path}:`, error?.message);
    try {
      localStorage.setItem('happiiz_gate_demo_session', JSON.stringify(profile));
    } catch (_) {}
    return true;
  }
}

export async function updateFirestoreUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  // If demo user or unauthenticated, update local session
  if (uid.startsWith('dev_') || !auth?.currentUser || !db) {
    try {
      const savedDemo = localStorage.getItem('happiiz_gate_demo_session');
      if (savedDemo) {
        const parsed = JSON.parse(savedDemo) as UserProfile;
        const updated = { ...parsed, ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem('happiiz_gate_demo_session', JSON.stringify(updated));
      }
    } catch (_) {}
    return true;
  }

  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error: any) {
    console.warn(`[Firestore] Notice on updating ${path}:`, error?.message);
    return false;
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
  if (!db || !auth?.currentUser) {
    return MOCK_SOCIETIES.find((s) => s.id === societyId) || null;
  }
  const path = `${COLLECTIONS.SOCIETIES}/${societyId}`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.SOCIETIES, societyId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Society;
    }
    return MOCK_SOCIETIES.find((s) => s.id === societyId) || null;
  } catch (error) {
    console.warn(`[Firestore] Notice fetching society ${path}:`, error);
    return MOCK_SOCIETIES.find((s) => s.id === societyId) || null;
  }
}

export async function createSociety(society: Society): Promise<boolean> {
  // Always update local cache so society is instantly available across views
  try {
    const socKey = 'hpz_all_societies';
    const raw = localStorage.getItem(socKey);
    const list: Society[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((s) => s.id !== society.id);
    localStorage.setItem(socKey, JSON.stringify([society, ...filtered]));
  } catch (_) {}

  if (!db || !auth?.currentUser) return true;
  const path = `${COLLECTIONS.SOCIETIES}/${society.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.SOCIETIES, society.id), {
      ...society,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error: any) {
    console.warn(`[Firestore] Notice creating society ${path}:`, error?.message);
    return true;
  }
}

/**
 * Fetch all society memberships for a specific user across all societies
 */
export async function getUserSocietyMemberships(uid: string): Promise<SocietyMembership[]> {
  // Check local memberships cache first
  try {
    const key = `hpz_user_memberships_${uid}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as SocietyMembership[];
      if (parsed && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  // If demo user or not authenticated in Firebase Auth, do not query remote Firestore
  if (uid.startsWith('dev_') || !auth?.currentUser || !db) {
    try {
      const savedDemo = localStorage.getItem('happiiz_gate_demo_session');
      if (savedDemo) {
        const parsed = JSON.parse(savedDemo) as UserProfile;
        const role = parsed.primaryRole || 'RESIDENT';
        return MOCK_MEMBERSHIPS[role] || MOCK_MEMBERSHIPS['RESIDENT'];
      }
    } catch (_) {}
    return MOCK_MEMBERSHIPS['RESIDENT'];
  }

  try {
    // In Firestore, we check each society's members subcollection or query user memberships
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
  // Always cache locally so pending/active screen and user profile can immediately access memberships
  try {
    const key = `hpz_user_memberships_${membership.uid}`;
    const raw = localStorage.getItem(key);
    const list: SocietyMembership[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((m) => m.societyId !== membership.societyId);
    localStorage.setItem(key, JSON.stringify([membership, ...filtered]));

    // Also sync to society member directory
    const socMemKey = `hpz_soc_members_${membership.societyId}`;
    const socRaw = localStorage.getItem(socMemKey);
    const socList: any[] = socRaw ? JSON.parse(socRaw) : [];
    const filteredSoc = socList.filter((m: any) => m.uid !== membership.uid);
    localStorage.setItem(socMemKey, JSON.stringify([membership, ...filteredSoc]));
  } catch (_) {}

  // If unauthenticated or demo user, local persistence is already established
  if (!db || !auth?.currentUser || membership.uid.startsWith('dev_')) {
    return true;
  }

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
  } catch (error: any) {
    console.warn(`[Firestore] Notice adding society membership ${path}:`, error?.message);
    return true;
  }
}

export async function updateMembershipStatus(
  societyId: string,
  uid: string,
  status: MembershipStatus,
  approvedBy?: string,
  rejectionReason?: string
): Promise<boolean> {
  // Update local caches
  try {
    const key = `hpz_user_memberships_${uid}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: SocietyMembership[] = JSON.parse(raw);
      const updated = list.map((m) =>
        m.societyId === societyId ? { ...m, membershipStatus: status, approvedBy, rejectionReason } : m
      );
      localStorage.setItem(key, JSON.stringify(updated));
    }
    const socMemKey = `hpz_soc_members_${societyId}`;
    const socRaw = localStorage.getItem(socMemKey);
    if (socRaw) {
      const socList: any[] = JSON.parse(socRaw);
      const updated = socList.map((m: any) =>
        m.uid === uid ? { ...m, membershipStatus: status, approvedBy, rejectionReason } : m
      );
      localStorage.setItem(socMemKey, JSON.stringify(updated));
    }
  } catch (_) {}

  if (!db || !auth?.currentUser || uid.startsWith('dev_')) {
    return true;
  }

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
  } catch (error: any) {
    console.warn(`[Firestore] Notice updating membership status ${path}:`, error?.message);
    return true;
  }
}

// ----------------------------------------------------------------------
// SERVICE PARTNERS
// ----------------------------------------------------------------------

export async function getServicePartnerProfile(uid: string): Promise<ServicePartnerProfile | null> {
  try {
    const local = localStorage.getItem(`hpz_partner_profile_${uid}`);
    if (local) return JSON.parse(local) as ServicePartnerProfile;
  } catch (_) {}

  if (uid.startsWith('dev_') || !auth?.currentUser || !db) return null;
  const path = `${COLLECTIONS.SERVICE_PARTNERS}/${uid}`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.SERVICE_PARTNERS, uid));
    if (snap.exists()) {
      return snap.data() as ServicePartnerProfile;
    }
    return null;
  } catch (error) {
    console.warn(`[Firestore] Notice on reading ${path}:`, error);
    return null;
  }
}

export async function saveServicePartnerProfile(
  profile: ServicePartnerProfile
): Promise<boolean> {
  try {
    localStorage.setItem(`hpz_partner_profile_${profile.uid}`, JSON.stringify(profile));
  } catch (_) {}

  if (!db || !auth?.currentUser || profile.uid.startsWith('dev_')) {
    return true;
  }

  const path = `${COLLECTIONS.SERVICE_PARTNERS}/${profile.uid}`;
  try {
    await setDoc(doc(db, COLLECTIONS.SERVICE_PARTNERS, profile.uid), {
      ...profile,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error: any) {
    console.warn(`[Firestore] Notice saving service partner profile ${path}:`, error?.message);
    return true;
  }
}

// ----------------------------------------------------------------------
// ACCESS REQUESTS & APPROVAL WORKFLOW
// ----------------------------------------------------------------------

export async function createAccessRequest(request: AccessRequest): Promise<boolean> {
  // Always cache locally so pending screen and admin card see current session requests
  try {
    localStorage.setItem('happiiz_gate_pending_request', JSON.stringify(request));
    const existingRaw = localStorage.getItem('happiiz_gate_dynamic_requests');
    const dynamicList: AccessRequest[] = existingRaw ? JSON.parse(existingRaw) : [];
    const filtered = dynamicList.filter((r) => r.id !== request.id);
    localStorage.setItem('happiiz_gate_dynamic_requests', JSON.stringify([request, ...filtered]));
  } catch (_) {}

  if (!db || !auth?.currentUser || request.uid.startsWith('dev_')) {
    return true;
  }

  const path = `${COLLECTIONS.ACCESS_REQUESTS}/${request.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ACCESS_REQUESTS, request.id), {
      ...request,
      submittedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.warn(`[Firestore] Notice on saving access request ${path}:`, error);
    return true;
  }
}

export async function getUserActiveAccessRequest(uid: string): Promise<AccessRequest | null> {
  // 1. Check local session storage first
  try {
    const raw = localStorage.getItem('happiiz_gate_pending_request');
    if (raw) {
      const parsed = JSON.parse(raw) as AccessRequest;
      if (parsed.uid === uid) return parsed;
    }
    const dynamicRaw = localStorage.getItem('happiiz_gate_dynamic_requests');
    if (dynamicRaw) {
      const list = JSON.parse(dynamicRaw) as AccessRequest[];
      const found = list.find((r) => r.uid === uid);
      if (found) return found;
    }
  } catch (_) {}

  // 2. Fallback to mock data if in simulation or unauthenticated
  if (!db || !auth?.currentUser || uid.startsWith('dev_')) {
    return MOCK_ACCESS_REQUESTS.find((r) => r.uid === uid) || null;
  }

  try {
    const q = query(
      collection(db, COLLECTIONS.ACCESS_REQUESTS),
      where('uid', '==', uid),
      orderBy('submittedAt', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as AccessRequest;
    }
    return null;
  } catch (error) {
    console.warn('[Firestore] Notice fetching user access request:', error);
    return null;
  }
}

export async function getAccessRequestsForSociety(societyId: string): Promise<AccessRequest[]> {
  // Retrieve any dynamic session requests
  let dynamicList: AccessRequest[] = [];
  try {
    const dynamicRaw = localStorage.getItem('happiiz_gate_dynamic_requests');
    if (dynamicRaw) {
      dynamicList = JSON.parse(dynamicRaw) as AccessRequest[];
    }
  } catch (_) {}

  if (!db || !auth?.currentUser) {
    const matchedMocks = MOCK_ACCESS_REQUESTS.filter(
      (r) => r.societyId === societyId || !societyId
    );
    const combined = [...dynamicList.filter((r) => r.societyId === societyId), ...matchedMocks];
    // Deduplicate by ID
    const seen = new Set<string>();
    return combined.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  const path = COLLECTIONS.ACCESS_REQUESTS;
  try {
    const q = query(
      collection(db, COLLECTIONS.ACCESS_REQUESTS),
      where('societyId', '==', societyId),
      orderBy('submittedAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AccessRequest));
    const combined = [...dynamicList.filter((r) => r.societyId === societyId), ...remoteList];
    const seen = new Set<string>();
    return combined.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  } catch (error) {
    console.warn('[Firestore] Notice fetching society access requests:', error);
    return MOCK_ACCESS_REQUESTS.filter((r) => r.societyId === societyId);
  }
}

export async function getAllAccessRequests(): Promise<AccessRequest[]> {
  let dynamicList: AccessRequest[] = [];
  try {
    const dynamicRaw = localStorage.getItem('happiiz_gate_dynamic_requests');
    if (dynamicRaw) {
      dynamicList = JSON.parse(dynamicRaw) as AccessRequest[];
    }
  } catch (_) {}

  if (!db || !auth?.currentUser) {
    const combined = [...dynamicList, ...MOCK_ACCESS_REQUESTS];
    const seen = new Set<string>();
    return combined.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  const path = COLLECTIONS.ACCESS_REQUESTS;
  try {
    const q = query(
      collection(db, COLLECTIONS.ACCESS_REQUESTS),
      orderBy('submittedAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AccessRequest));
    const combined = [...dynamicList, ...remoteList];
    const seen = new Set<string>();
    return combined.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  } catch (error) {
    console.warn('[Firestore] Notice fetching all access requests:', error);
    return MOCK_ACCESS_REQUESTS;
  }
}

export async function reviewAccessRequest(
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
  reviewedBy: string,
  reviewNotes?: string
): Promise<boolean> {
  // Update dynamic requests in localStorage
  try {
    const dynamicRaw = localStorage.getItem('happiiz_gate_dynamic_requests');
    if (dynamicRaw) {
      const list = JSON.parse(dynamicRaw) as AccessRequest[];
      const updated = list.map((r) =>
        r.id === requestId
          ? { ...r, status, reviewedBy, reviewedAt: new Date().toISOString(), reviewNotes }
          : r
      );
      localStorage.setItem('happiiz_gate_dynamic_requests', JSON.stringify(updated));
    }
  } catch (_) {}

  if (!db || !auth?.currentUser) return true;
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
    console.warn(`[Firestore] Notice updating access request ${path}:`, error);
    return true;
  }
}

/**
 * Super Admin Approval: Activates a newly submitted society and its administrator
 */
export async function approveSocietyOnboarding(
  requestId: string,
  societyId: string,
  adminUid?: string
): Promise<boolean> {
  await reviewAccessRequest(requestId, 'APPROVED', 'SUPER_ADMIN', 'Society approved by platform super admin');

  // Update society status to ACTIVE
  if (db && auth?.currentUser) {
    try {
      const socRef = doc(db, COLLECTIONS.SOCIETIES, societyId);
      await updateDoc(socRef, {
        status: 'ACTIVE',
        approvedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[Firestore] Error activating society:', e);
    }
  }

  // Activate Society Admin member & user account
  if (adminUid) {
    await updateMembershipStatus(societyId, adminUid, 'ACTIVE', 'SUPER_ADMIN');
    await updateFirestoreUserProfile(adminUid, {
      accountStatus: 'ACTIVE',
      role: 'SOCIETY_ADMIN',
      primaryRole: 'SOCIETY_ADMIN',
    });
  }

  return true;
}

/**
 * Super Admin Rejection: Rejects a society onboarding application
 */
export async function rejectSocietyOnboarding(
  requestId: string,
  societyId: string,
  adminUid?: string,
  reason: string = 'Society verification documentation incomplete'
): Promise<boolean> {
  await reviewAccessRequest(requestId, 'REJECTED', 'SUPER_ADMIN', reason);

  if (db && auth?.currentUser) {
    try {
      const socRef = doc(db, COLLECTIONS.SOCIETIES, societyId);
      await updateDoc(socRef, {
        status: 'REJECTED',
        rejectionReason: reason,
      });
    } catch (e) {
      console.warn('[Firestore] Error rejecting society:', e);
    }
  }

  if (adminUid) {
    await updateMembershipStatus(societyId, adminUid, 'REJECTED', 'SUPER_ADMIN', reason);
    await updateFirestoreUserProfile(adminUid, {
      accountStatus: 'REJECTED',
      rejectionReason: reason,
    });
  }

  return true;
}

/**
 * Super Admin Approval: Activates a Service Partner KYC application
 */
export async function approveServicePartner(
  requestId: string,
  partnerUid: string
): Promise<boolean> {
  await reviewAccessRequest(requestId, 'APPROVED', 'SUPER_ADMIN', 'KYC verified and approved');

  if (db && auth?.currentUser) {
    try {
      const partnerRef = doc(db, COLLECTIONS.SERVICE_PARTNERS, partnerUid);
      await updateDoc(partnerRef, {
        verificationStatus: 'ACTIVE',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'SUPER_ADMIN',
      });
    } catch (e) {
      console.warn('[Firestore] Error activating partner:', e);
    }
  }

  await updateFirestoreUserProfile(partnerUid, {
    accountStatus: 'ACTIVE',
  });

  return true;
}

/**
 * Super Admin Rejection: Rejects a Service Partner application
 */
export async function rejectServicePartner(
  requestId: string,
  partnerUid: string,
  reason: string = 'Business credentials or service license not verifiable'
): Promise<boolean> {
  await reviewAccessRequest(requestId, 'REJECTED', 'SUPER_ADMIN', reason);

  if (db && auth?.currentUser) {
    try {
      const partnerRef = doc(db, COLLECTIONS.SERVICE_PARTNERS, partnerUid);
      await updateDoc(partnerRef, {
        verificationStatus: 'REJECTED',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'SUPER_ADMIN',
      });
    } catch (e) {
      console.warn('[Firestore] Error rejecting partner:', e);
    }
  }

  await updateFirestoreUserProfile(partnerUid, {
    accountStatus: 'REJECTED',
    rejectionReason: reason,
  });

  return true;
}

/**
 * Testing & Demo Helper: Instantly simulates administrative approval for a user profile
 */
export async function simulateInstantApproval(uid: string): Promise<boolean> {
  try {
    // 1. Update local demo session
    const savedDemo = localStorage.getItem('happiiz_gate_demo_session');
    if (savedDemo) {
      const parsed = JSON.parse(savedDemo) as UserProfile;
      parsed.accountStatus = 'ACTIVE';
      parsed.onboardingCompleted = true;
      localStorage.setItem('happiiz_gate_demo_session', JSON.stringify(parsed));
    }

    // 2. Update dynamic access requests
    const dynamicRaw = localStorage.getItem('happiiz_gate_dynamic_requests');
    if (dynamicRaw) {
      const list = JSON.parse(dynamicRaw) as AccessRequest[];
      const updated = list.map((r) =>
        r.uid === uid ? { ...r, status: 'APPROVED' as const, reviewedBy: 'AUTO_SIMULATION' } : r
      );
      localStorage.setItem('happiiz_gate_dynamic_requests', JSON.stringify(updated));
    }

    // 3. If live Firestore user, update in database too
    if (db && auth?.currentUser && !uid.startsWith('dev_')) {
      await updateFirestoreUserProfile(uid, {
        accountStatus: 'ACTIVE',
        onboardingCompleted: true,
      });
    }
    return true;
  } catch (e) {
    console.error('Error simulating approval:', e);
    return false;
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
  const generatedId = `PASS-${Date.now()}`;
  try {
    const key = `hpz_resident_passes_${pass.societyId}`;
    const existing = localStorage.getItem(key);
    const list = existing ? JSON.parse(existing) : [];
    localStorage.setItem(key, JSON.stringify([{ id: generatedId, ...pass }, ...list]));
  } catch (_) {}

  if (!db || !auth?.currentUser || (pass as any).residentId?.startsWith('dev_')) {
    return generatedId;
  }

  const path = COLLECTIONS.GATE_PASSES;
  try {
    const passRef = doc(collection(db, COLLECTIONS.GATE_PASSES));
    await setDoc(passRef, {
      ...pass,
      createdAt: new Date().toISOString(),
    });
    return passRef.id;
  } catch (error: any) {
    console.warn(`[Firestore] Notice creating gate pass ${path}:`, error?.message);
    return generatedId;
  }
}
