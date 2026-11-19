#!/usr/bin/env node
/**
 * Happiiz Gate App — Secure Server-Side Super Admin Provisioning & Diagnostic Tool
 *
 * USAGE (run privately from an authorized admin machine or secure CI — NEVER commit credentials):
 *
 *   # Option A: Using Google Application Credentials file path
 *   export GOOGLE_APPLICATION_CREDENTIALS="/secure/path/serviceAccountKey.json"
 *   export SUPER_ADMIN_UID="i2INKUJ27fZpwFKOBV5o7qOm4it2"
 *   export SUPER_ADMIN_EMAIL="sandeeprana4519@gmail.com"
 *   # Optional — ONLY set if you explicitly want to reset the Super Admin password in Firebase Auth:
 *   # export SUPER_ADMIN_NEW_PASSWORD="YourNewStrongPassword!"
 *   node scripts/provision-super-admin.mjs
 *
 *   # Option B: Using inline JSON env var (e.g., GitHub Actions / Cloud Run secret)
 *   export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
 *   node scripts/provision-super-admin.mjs --verify-only
 *
 * SECURITY GUARANTEES:
 * - Zero hardcoded passwords or private keys in source code.
 * - Never writes plaintext passwords to Firestore or console logs.
 * - Binds SUPER_ADMIN privileges strictly to the verified Firebase Auth UID + Custom Claims + Firestore /users/{uid}.
 * - Detects and reports any duplicate or conflicting Super Admin records.
 */

import fs from 'node:fs';
import path from 'node:path';

const VERIFY_ONLY = process.argv.includes('--verify-only');

const TARGET_UID = (process.env.SUPER_ADMIN_UID || '').trim();
const TARGET_EMAIL = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
const TARGET_DISPLAY_NAME = (process.env.SUPER_ADMIN_NAME || 'Platform Super Admin').trim();
const NEW_PASSWORD = process.env.SUPER_ADMIN_NEW_PASSWORD || '';

function maskUid(uid) {
  if (!uid || uid.length < 8) return '***';
  return `${uid.slice(0, 4)}...${uid.slice(-4)}`;
}

async function loadFirebaseAdmin() {
  try {
    const adminMod = await import('firebase-admin');
    return adminMod.default || adminMod;
  } catch (err) {
    console.error('\n[ERROR] The `firebase-admin` package is not installed in this environment.');
    console.error('Install it privately on your admin machine or inside `functions/` before running:');
    console.error('  npm install --no-save firebase-admin');
    console.error('  # or run from functions/: cd functions && npm install && node ../scripts/provision-super-admin.mjs\n');
    process.exit(1);
  }
}

function resolveServiceAccountCredential(admin) {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const keyPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (inlineJson && inlineJson.trim().startsWith('{')) {
    const parsed = JSON.parse(inlineJson);
    return admin.credential.cert(parsed);
  }

  if (keyPath) {
    const resolved = path.resolve(keyPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Service account key file not found at: ${resolved}`);
    }
    const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    return admin.credential.cert(parsed);
  }

  return admin.credential.applicationDefault();
}

async function main() {
  console.log('===============================================================');
  console.log(' Happiiz Gate — Super Admin Firebase Auth & Firestore Repair');
  console.log(` Mode: ${VERIFY_ONLY ? 'VERIFY ONLY (Read-Only Diagnostic)' : 'PROVISION / REPAIR'}`);
  console.log('===============================================================\n');

  if (!TARGET_UID || !TARGET_EMAIL) {
    console.error('[ERROR] Required environment variables missing.');
    console.error('Please export BOTH:');
    console.error('  export SUPER_ADMIN_UID="<firebase-auth-uid>"');
    console.error('  export SUPER_ADMIN_EMAIL="<super-admin-email>"');
    console.error('  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"');
    process.exit(1);
  }

  const admin = await loadFirebaseAdmin();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: resolveServiceAccountCredential(admin),
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  // 1. Inspect Firebase Auth user by UID and by Email
  let userByUid = null;
  let userByEmail = null;

  try {
    userByUid = await auth.getUser(TARGET_UID);
    console.log(`[OK] Firebase Auth user found for UID ${maskUid(TARGET_UID)} (email: ${userByUid.email}, disabled: ${userByUid.disabled})`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.warn(`[WARN] No Firebase Auth user exists with UID ${maskUid(TARGET_UID)}.`);
    } else {
      throw err;
    }
  }

  try {
    userByEmail = await auth.getUserByEmail(TARGET_EMAIL);
    console.log(`[OK] Firebase Auth user found for email ${TARGET_EMAIL} (UID: ${maskUid(userByEmail.uid)})`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.warn(`[WARN] No Firebase Auth user exists with email ${TARGET_EMAIL}.`);
    } else {
      throw err;
    }
  }

  // Detect duplicate/conflicting accounts
  if (userByUid && userByEmail && userByUid.uid !== userByEmail.uid) {
    console.error('\n[CRITICAL] UID / EMAIL MISMATCH DETECTED!');
    console.error(`  - UID ${maskUid(TARGET_UID)} has email: ${userByUid.email}`);
    console.error(`  - Email ${TARGET_EMAIL} belongs to a DIFFERENT UID: ${maskUid(userByEmail.uid)}`);
    console.error('Resolve this conflict manually in Firebase Console > Authentication before proceeding.');
    process.exit(1);
  }

  let authUser = userByUid || userByEmail;

  // Create Auth user with exact TARGET_UID if missing (and not verify-only)
  if (!authUser) {
    if (VERIFY_ONLY) {
      console.error('[FAIL] Super Admin user does not exist in Firebase Authentication.');
      process.exit(1);
    }
    if (!NEW_PASSWORD || NEW_PASSWORD.length < 8) {
      console.error('[ERROR] To create a missing Firebase Auth user, set SUPER_ADMIN_NEW_PASSWORD (min 8 chars).');
      process.exit(1);
    }
    authUser = await auth.createUser({
      uid: TARGET_UID,
      email: TARGET_EMAIL,
      emailVerified: true,
      password: NEW_PASSWORD,
      displayName: TARGET_DISPLAY_NAME,
      disabled: false,
    });
    console.log(`[FIXED] Created Firebase Auth user with exact UID ${maskUid(authUser.uid)}.`);
  } else if (!VERIFY_ONLY) {
    // Ensure account is enabled, email verified, and optionally update password if explicitly requested
    const updates = {};
    if (authUser.disabled) updates.disabled = false;
    if (!authUser.emailVerified) updates.emailVerified = true;
    if (authUser.email?.toLowerCase() !== TARGET_EMAIL) updates.email = TARGET_EMAIL;
    if (NEW_PASSWORD) {
      if (NEW_PASSWORD.length < 8) {
        throw new Error('SUPER_ADMIN_NEW_PASSWORD must be at least 8 characters long.');
      }
      updates.password = NEW_PASSWORD;
    }
    if (Object.keys(updates).length > 0) {
      authUser = await auth.updateUser(authUser.uid, updates);
      console.log(
        `[FIXED] Updated Firebase Auth account (${Object.keys(updates)
          .map((k) => (k === 'password' ? 'password:[REDACTED]' : k))
          .join(', ')}).`
      );
    }
  }

  // 2. Verify / Set Custom Claims strictly for verified UID
  const currentClaims = authUser.customClaims || {};
  const claimsOk =
    currentClaims.role === 'SUPER_ADMIN' && currentClaims.isSuperAdmin === true;

  if (claimsOk) {
    console.log('[OK] Firebase Custom Claims already configured: { role: "SUPER_ADMIN", isSuperAdmin: true }');
  } else if (VERIFY_ONLY) {
    console.warn(`[WARN] Firebase Custom Claims missing/outdated: ${JSON.stringify(currentClaims)}`);
  } else {
    await auth.setCustomUserClaims(authUser.uid, {
      ...currentClaims,
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
    });
    console.log('[FIXED] Set Firebase Custom Claims: { role: "SUPER_ADMIN", isSuperAdmin: true }');
  }

  // 3. Verify / Upsert Firestore /users/{uid} record (NEVER store passwords)
  const userDocRef = db.collection('users').doc(authUser.uid);
  const userDocSnap = await userDocRef.get();
  const nowIso = new Date().toISOString();

  if (userDocSnap.exists) {
    const data = userDocSnap.data() || {};
    console.log(
      `[OK] Firestore /users/${maskUid(authUser.uid)} exists (primaryRole: ${data.primaryRole}, role: ${data.role}, status: ${data.accountStatus}, isSuperAdmin: ${data.isSuperAdmin})`
    );
  } else {
    console.warn(`[WARN] Firestore /users/${maskUid(authUser.uid)} document does NOT exist (this blocks production login when Custom Claims are absent).`);
  }

  if (!VERIFY_ONLY) {
    const existingData = userDocSnap.exists ? userDocSnap.data() : {};
    await userDocRef.set(
      {
        uid: authUser.uid,
        fullName: existingData?.fullName || TARGET_DISPLAY_NAME,
        displayName: existingData?.displayName || existingData?.fullName || TARGET_DISPLAY_NAME,
        email: TARGET_EMAIL,
        phoneNumber: existingData?.phoneNumber || authUser.phoneNumber || '',
        preferredLanguage: existingData?.preferredLanguage || 'en',
        primaryRole: 'SUPER_ADMIN',
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
        accountStatus: 'ACTIVE',
        onboardingCompleted: true,
        createdAt: existingData?.createdAt || nowIso,
        updatedAt: nowIso,
        lastLoginAt: existingData?.lastLoginAt || nowIso,
      },
      { merge: true }
    );
    console.log(`[FIXED] Upserted authoritative Firestore document /users/${maskUid(authUser.uid)}.`);
  }

  // 4. Audit duplicate Super Admin records in Firestore
  const dupSnap = await db.collection('users').where('primaryRole', '==', 'SUPER_ADMIN').get();
  console.log(`\n[AUDIT] Total Firestore users with primaryRole == 'SUPER_ADMIN': ${dupSnap.size}`);
  dupSnap.forEach((docSnap) => {
    const d = docSnap.data();
    console.log(`  - UID: ${maskUid(docSnap.id)} | email: ${d.email || 'n/a'} | status: ${d.accountStatus || 'n/a'}`);
  });

  console.log('\n[DONE] Super Admin verification & provisioning complete.');
  if (!VERIFY_ONLY) {
    console.log('Next Step: Sign out and sign back in on the live Universal Login page so the browser refreshes the ID token Custom Claims.');
  }
}

main().catch((err) => {
  console.error('\n[FATAL]', err?.message || err);
  process.exit(1);
});
