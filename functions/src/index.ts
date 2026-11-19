/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Happiiz Gate App — Trusted Firebase Cloud Functions (Server-Side Auth & Claims)
 *
 * Deploy with:
 *   cd functions && npm install && npm run build && firebase deploy --only functions
 *
 * Zero hardcoded secrets or passwords. All role checks strictly bind to Firebase Auth UID,
 * ID token Custom Claims, and authoritative Firestore /users/{uid} records.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const ALLOWED_ROLES = new Set([
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'PLATFORM_SUPPORT',
  'PLATFORM_FINANCE',
  'PLATFORM_OPERATIONS',
  'PLATFORM_READ_ONLY',
  'PLATFORM_STAFF',
  'PLATFORM_ADMIN_STAFF',
  'SOCIETY_ADMIN',
  'COMPANY_ADMIN',
  'SOCIETY_STAFF',
  'SECURITY_SUPERVISOR',
  'SECURITY_STAFF',
  'SECURITY_GUARD',
  'GATE_GUARD',
  'DIGITAL_SUPPORTER',
  'RESIDENT',
  'SERVICE_PARTNER',
  'TECHNICIAN',
]);

/**
 * Returns authoritative server-verified role, account status, memberships, and permissions
 * for the currently authenticated Firebase user.
 */
export const verifyUserAuthorization = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const uid = request.auth.uid;
  const tokenClaims = request.auth.token || {};

  const userSnap = await db.collection('users').doc(uid).get();
  const profile = userSnap.exists ? userSnap.data() || {} : null;

  const isSuperAdmin =
    tokenClaims.role === 'SUPER_ADMIN' ||
    tokenClaims.isSuperAdmin === true ||
    profile?.isSuperAdmin === true ||
    profile?.primaryRole === 'SUPER_ADMIN' ||
    profile?.role === 'SUPER_ADMIN';

  const resolvedRole = isSuperAdmin
    ? 'SUPER_ADMIN'
    : (typeof tokenClaims.role === 'string' && ALLOWED_ROLES.has(tokenClaims.role)
        ? tokenClaims.role
        : profile?.primaryRole || profile?.role || null);

  if (!resolvedRole) {
    throw new HttpsError(
      'failed-precondition',
      'No authorized role is assigned to this account UID.'
    );
  }

  const accountStatus = String(profile?.accountStatus || 'ACTIVE').toUpperCase();
  if (['DISABLED', 'DEACTIVATED', 'BLOCKED', 'SUSPENDED', 'REJECTED', 'INACTIVE'].includes(accountStatus)) {
    throw new HttpsError('permission-denied', `Account status is ${accountStatus}.`);
  }

  return {
    uid,
    email: request.auth.token.email || profile?.email || null,
    role: resolvedRole,
    isSuperAdmin,
    accountStatus,
    societyId: (tokenClaims.societyId as string) || profile?.societyId || null,
    companyId: (tokenClaims.companyId as string) || profile?.companyId || null,
    gateAssigned: (tokenClaims.gateAssigned as string) || profile?.gateAssigned || null,
    permissions: Array.isArray(profile?.platformPermissions)
      ? profile.platformPermissions
      : Array.isArray(profile?.societyPermissions)
      ? profile.societyPermissions
      : [],
  };
});

/**
 * Allows an existing verified Super Admin to assign or synchronize Firebase Custom Claims
 * and Firestore /users/{uid} role records for any user without client-side privilege escalation.
 */
export const setAuthorizedUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const callerUid = request.auth.uid;
  const callerClaims = request.auth.token || {};
  const callerDoc = await db.collection('users').doc(callerUid).get();
  const callerIsSuperAdmin =
    callerClaims.role === 'SUPER_ADMIN' ||
    callerClaims.isSuperAdmin === true ||
    callerDoc.data()?.isSuperAdmin === true ||
    callerDoc.data()?.primaryRole === 'SUPER_ADMIN';

  if (!callerIsSuperAdmin) {
    throw new HttpsError('permission-denied', 'Only a verified Super Admin may assign user roles.');
  }

  const { targetUid, role, societyId, companyId, gateAssigned, accountStatus } = request.data || {};
  if (!targetUid || typeof targetUid !== 'string') {
    throw new HttpsError('invalid-argument', 'targetUid is required.');
  }

  const normalizedRole = String(role || '').trim().toUpperCase();
  if (!ALLOWED_ROLES.has(normalizedRole)) {
    throw new HttpsError('invalid-argument', `Unsupported role: ${normalizedRole}`);
  }

  const targetUser = await admin.auth().getUser(targetUid);
  const nextClaims: Record<string, unknown> = {
    ...(targetUser.customClaims || {}),
    role: normalizedRole,
    isSuperAdmin: normalizedRole === 'SUPER_ADMIN',
  };
  if (societyId) nextClaims.societyId = String(societyId);
  if (companyId) nextClaims.companyId = String(companyId);
  if (gateAssigned) nextClaims.gateAssigned = String(gateAssigned);

  await admin.auth().setCustomUserClaims(targetUid, nextClaims);

  await db
    .collection('users')
    .doc(targetUid)
    .set(
      {
        uid: targetUid,
        email: targetUser.email || null,
        primaryRole: normalizedRole,
        role: normalizedRole,
        isSuperAdmin: normalizedRole === 'SUPER_ADMIN',
        accountStatus: accountStatus || 'ACTIVE',
        onboardingCompleted: true,
        ...(societyId ? { societyId: String(societyId) } : {}),
        ...(companyId ? { companyId: String(companyId) } : {}),
        ...(gateAssigned ? { gateAssigned: String(gateAssigned) } : {}),
        updatedAt: new Date().toISOString(),
        updatedBy: callerUid,
      },
      { merge: true }
    );

  return {
    success: true,
    uid: targetUid,
    role: normalizedRole,
  };
});
