/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase/init';
import { isFirebaseConfigured, IS_DEV_MODE } from '../config/firebase.config';
import { normalizeUserRole } from '../config/constants';
import {
  UserProfile,
  UserRole,
  SocietyMembership,
  ServicePartnerProfile,
  AuthContextType,
} from '../types/auth';
import {
  getFirestoreUserProfile,
  getUserSocietyMemberships,
  getServicePartnerProfile,
} from '../services/firebase/firestore.service';
import {
  signOutFirebase,
  resolveVerifiedRoleFromClaimsAndProfile,
} from '../services/firebase/auth.service';
import { MOCK_USERS, MOCK_MEMBERSHIPS } from '../services/mock/mockData';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_MEMBERSHIP_KEY = 'happiiz_gate_active_membership';
const DEMO_USER_SESSION_KEY = 'happiiz_gate_demo_session';
const SESSION_LAST_ACTIVITY_KEY = 'happiiz_session_last_activity';

// Idle session limit: 8 hours on desktop admin portals, 24 hours on active gate/mobile PWAs
const ADMIN_SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const PWA_SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

function getSessionTimeoutMs(role?: UserRole | null): number {
  const norm = normalizeUserRole(role);
  if (norm === 'SECURITY_GUARD' || norm === 'DIGITAL_SUPPORTER' || norm === 'SERVICE_PARTNER') {
    return PWA_SESSION_TIMEOUT_MS;
  }
  return ADMIN_SESSION_TIMEOUT_MS;
}

function buildMembershipsForProfile(profile: UserProfile): SocietyMembership[] {
  const role = normalizeUserRole(profile.primaryRole || profile.role || 'RESIDENT');
  if ((role === 'SOCIETY_STAFF' || role === 'SECURITY_STAFF') && profile.societyId) {
    return [
      {
        uid: profile.uid,
        societyId: profile.societyId,
        societyName: profile.societyName || 'Assigned Society',
        societyCode: profile.societyCode || 'SOC',
        role,
        membershipStatus: profile.accountStatus === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
        employmentId: profile.societyStaffId || profile.loginId,
        joinedAt: profile.createdAt || new Date().toISOString(),
        approvedBy: 'SOCIETY_ADMIN',
      },
    ];
  }
  return profile.onboardingCompleted ? (MOCK_MEMBERSHIPS[role] || []) : [];
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<SocietyMembership[]>([]);
  const [activeMembership, setActiveMembershipState] = useState<SocietyMembership | null>(null);
  const [servicePartnerProfile, setServicePartnerProfile] = useState<ServicePartnerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);

  const loadUserData = useCallback(async (uid: string, fbUserObj?: FirebaseUser | null) => {
    try {
      setLoading(true);

      // 1. Read verified Firebase Custom Claims from ID Token when live Firebase Auth is active
      let tokenClaims: Record<string, any> = {};
      if (fbUserObj) {
        try {
          const tokenResult = await fbUserObj.getIdTokenResult();
          tokenClaims = tokenResult.claims || {};
        } catch (claimErr) {
          console.warn('[AuthContext] Unable to read Firebase Custom Claims:', claimErr);
        }
      }

      // 2. Read authoritative Firestore /users/{uid} document
      let profile: UserProfile | null = null;
      try {
        profile = await getFirestoreUserProfile(uid);
      } catch (profileErr) {
        console.warn('[AuthContext] Firestore profile read notice:', profileErr);
      }

      // 3. Resolve verified role from Custom Claims + Firestore (never from localStorage or email alone)
      const verified = resolveVerifiedRoleFromClaimsAndProfile(tokenClaims, profile);

      if (profile || verified.role) {
        const nowIso = new Date().toISOString();
        const mergedProfile: UserProfile = profile
          ? {
              ...profile,
              uid,
              email: profile.email || fbUserObj?.email || undefined,
              isSuperAdmin: verified.isSuperAdmin || profile.isSuperAdmin === true,
              primaryRole: verified.role || profile.primaryRole || profile.role,
              role: verified.role || profile.role || profile.primaryRole,
              customClaimsRole: verified.rawClaimRole || profile.customClaimsRole,
              societyId: (tokenClaims.societyId as string) || profile.societyId,
              companyId: (tokenClaims.companyId as string) || profile.companyId,
              gateAssigned: (tokenClaims.gateAssigned as string) || profile.gateAssigned,
              onboardingCompleted: verified.isSuperAdmin ? true : profile.onboardingCompleted,
              accountStatus: profile.accountStatus || 'ACTIVE',
            }
          : {
              uid,
              fullName: fbUserObj?.displayName || (verified.isSuperAdmin ? 'Platform Super Admin' : 'Verified User'),
              displayName: fbUserObj?.displayName || (verified.isSuperAdmin ? 'Platform Super Admin' : 'Verified User'),
              email: fbUserObj?.email || undefined,
              phoneNumber: fbUserObj?.phoneNumber || '',
              photoURL: fbUserObj?.photoURL || undefined,
              preferredLanguage: 'en',
              accountStatus: 'ACTIVE',
              onboardingCompleted: true,
              createdAt: nowIso,
              updatedAt: nowIso,
              lastLoginAt: nowIso,
              primaryRole: verified.role!,
              role: verified.role!,
              isSuperAdmin: verified.isSuperAdmin,
              customClaimsRole: verified.rawClaimRole,
              societyId: tokenClaims.societyId as string | undefined,
              companyId: tokenClaims.companyId as string | undefined,
              gateAssigned: tokenClaims.gateAssigned as string | undefined,
              platformRole:
                verified.rawClaimRole && verified.role === 'PLATFORM_STAFF'
                  ? verified.rawClaimRole
                  : undefined,
            };

        setUser(mergedProfile);
        try {
          localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
        } catch (_) {}

        const resolvedRole = normalizeUserRole(mergedProfile.primaryRole || mergedProfile.role);

        if (mergedProfile.isSuperAdmin || resolvedRole === 'SUPER_ADMIN') {
          setMemberships([]);
          setActiveMembershipState(null);
          setLoading(false);
          return;
        }

        if (resolvedRole === 'PLATFORM_STAFF' || resolvedRole === 'DIGITAL_SUPPORTER') {
          setMemberships([]);
          setActiveMembershipState(null);
          setLoading(false);
          return;
        }

        if (resolvedRole === 'SERVICE_PARTNER') {
          const partner = await getServicePartnerProfile(uid);
          setServicePartnerProfile(partner);
        }

        const userMemberships = await getUserSocietyMemberships(uid);
        setMemberships(userMemberships);

        const savedMembershipId = localStorage.getItem(ACTIVE_MEMBERSHIP_KEY);
        const matched = userMemberships.find((m) => m.societyId === savedMembershipId);

        if (matched && matched.membershipStatus === 'ACTIVE') {
          setActiveMembershipState(matched);
        } else {
          const firstActive = userMemberships.find((m) => m.membershipStatus === 'ACTIVE');
          setActiveMembershipState(firstActive || userMemberships[0] || null);
        }
      } else {
        setUser({
          uid,
          fullName: fbUserObj?.displayName || '',
          email: fbUserObj?.email || undefined,
          phoneNumber: fbUserObj?.phoneNumber || '',
          photoURL: fbUserObj?.photoURL || undefined,
          preferredLanguage: 'en',
          accountStatus: 'PENDING',
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
        setMemberships([]);
        setActiveMembershipState(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOutFirebase();
      setUser(null);
      setFirebaseUser(null);
      setMemberships([]);
      setActiveMembershipState(null);
      setServicePartnerProfile(null);
      localStorage.removeItem(ACTIVE_MEMBERSHIP_KEY);
      localStorage.removeItem(DEMO_USER_SESSION_KEY);
      localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen to Firebase Auth (production) or sandbox demo session (dev-only)
  useEffect(() => {
    // Check idle session expiration on boot
    try {
      const lastActivityRaw = localStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
      if (lastActivityRaw) {
        const lastActivity = Number(lastActivityRaw);
        if (Number.isFinite(lastActivity) && Date.now() - lastActivity > PWA_SESSION_TIMEOUT_MS) {
          localStorage.removeItem(DEMO_USER_SESSION_KEY);
          localStorage.removeItem(ACTIVE_MEMBERSHIP_KEY);
          localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
        }
      }
    } catch (_) {}

    if (!auth || !isFirebaseConfigured) {
      // STRICT GUARD: Only load sandbox session in explicit dev/sandbox mode
      if (!IS_DEV_MODE) {
        setLoading(false);
        return;
      }
      try {
        const savedDemo = localStorage.getItem(DEMO_USER_SESSION_KEY);
        if (savedDemo) {
          const parsed = JSON.parse(savedDemo) as UserProfile;
          setUser(parsed);
          const sampleMems = buildMembershipsForProfile(parsed);
          setMemberships(sampleMems);
          setActiveMembershipState(sampleMems[0] || null);
        }
      } catch (e) {
        console.warn('Error reading sandbox session:', e);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
      setFirebaseUser(currentFbUser);

      if (currentFbUser) {
        // Production Firebase session always clears any stale sandbox key
        if (!IS_DEV_MODE) {
          try {
            localStorage.removeItem(DEMO_USER_SESSION_KEY);
          } catch (_) {}
        }
        await loadUserData(currentFbUser.uid, currentFbUser);
      } else {
        // Production builds with Firebase configured NEVER fall back to client localStorage sessions
        if (IS_DEV_MODE) {
          try {
            const savedDemo = localStorage.getItem(DEMO_USER_SESSION_KEY);
            if (savedDemo) {
              const parsed = JSON.parse(savedDemo) as UserProfile;
              setUser(parsed);
              const sampleMems = buildMembershipsForProfile(parsed);
              setMemberships(sampleMems);
              setActiveMembershipState(sampleMems[0] || null);
              setLoading(false);
              return;
            }
          } catch (_) {}
        }
        setUser(null);
        setMemberships([]);
        setActiveMembershipState(null);
        setServicePartnerProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadUserData]);

  // Idle inactivity monitor
  useEffect(() => {
    if (!user) return;
    const touchActivity = () => {
      try {
        localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
        if (sessionWarning) setSessionWarning(null);
      } catch (_) {}
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, touchActivity, { passive: true }));

    const interval = setInterval(() => {
      try {
        const lastRaw = localStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
        if (!lastRaw) return;
        const elapsed = Date.now() - Number(lastRaw);
        const limit = getSessionTimeoutMs(user.primaryRole || user.role);
        if (elapsed >= limit) {
          setSessionWarning('Your session expired due to inactivity. Please sign in again.');
          void logout();
        } else if (elapsed >= limit - 5 * 60 * 1000) {
          setSessionWarning('Your session will expire in under 5 minutes due to inactivity.');
        }
      } catch (_) {}
    }, 60 * 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, touchActivity));
      clearInterval(interval);
    };
  }, [user, logout, sessionWarning]);

  const setActiveMembership = (membership: SocietyMembership) => {
    setActiveMembershipState(membership);
    localStorage.setItem(ACTIVE_MEMBERSHIP_KEY, membership.societyId);
  };

  const refreshUserProfile = async () => {
    if (firebaseUser) {
      await loadUserData(firebaseUser.uid, firebaseUser);
    } else if (user && IS_DEV_MODE) {
      await loadUserData(user.uid);
    }
  };

  const loginWithDemoRole = (role: UserRole) => {
    if (!IS_DEV_MODE) {
      console.warn('[AuthContext] Blocked sandbox role switch in production mode.');
      return;
    }
    const canonical = normalizeUserRole(role);
    const demoUser = MOCK_USERS[canonical] || MOCK_USERS['RESIDENT'];
    setUser(demoUser);
    const sampleMems = MOCK_MEMBERSHIPS[canonical] || [];
    setMemberships(sampleMems);
    setActiveMembershipState(sampleMems[0] || null);
    try {
      localStorage.setItem(DEMO_USER_SESSION_KEY, JSON.stringify(demoUser));
      localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
    } catch (e) {
      console.warn('Error saving sandbox session:', e);
    }
  };

  const switchRole = (newRole: UserRole) => {
    loginWithDemoRole(newRole);
  };

  const loginWithDemoSession = (profile: UserProfile) => {
    if (!IS_DEV_MODE && !firebaseUser) {
      console.warn('[AuthContext] Blocked unverified client session injection in production mode.');
      return;
    }
    setUser(profile);
    const sampleMems = buildMembershipsForProfile(profile);
    setMemberships(sampleMems);
    setActiveMembershipState(sampleMems[0] || null);
    try {
      if (IS_DEV_MODE) {
        localStorage.setItem(DEMO_USER_SESSION_KEY, JSON.stringify(profile));
      }
      localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
    } catch (e) {
      console.warn('Error saving session:', e);
    }
  };

  // Determine canonical active role strictly from verified profile/membership
  let currentRole: UserRole | null = null;
  if (user) {
    const baseRole = normalizeUserRole(user.primaryRole || user.role);
    if (user.isSuperAdmin || baseRole === 'SUPER_ADMIN') {
      currentRole = 'SUPER_ADMIN';
    } else if (baseRole === 'PLATFORM_STAFF') {
      currentRole = 'PLATFORM_STAFF';
    } else if (baseRole === 'DIGITAL_SUPPORTER') {
      currentRole = 'DIGITAL_SUPPORTER';
    } else if (baseRole === 'SERVICE_PARTNER') {
      currentRole = 'SERVICE_PARTNER';
    } else if (activeMembership && activeMembership.membershipStatus === 'ACTIVE') {
      currentRole = normalizeUserRole(activeMembership.role);
    } else if (user.primaryRole || user.role) {
      currentRole = baseRole;
    }
  }

  const enrichedUser: UserProfile | null = user
    ? {
        ...user,
        displayName: user.fullName || user.displayName || 'User',
        societyName: activeMembership?.societyName || user.societyName,
        societyId: activeMembership?.societyId || user.societyId,
        societyCode: activeMembership?.societyCode || user.societyCode,
        flatNumber: activeMembership?.flatId || user.flatNumber,
        block: activeMembership?.wingId || user.block,
        partnerCompany: servicePartnerProfile?.businessName || user.partnerCompany,
        role: currentRole || normalizeUserRole(user.primaryRole) || 'RESIDENT',
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: enrichedUser,
        firebaseUser,
        currentRole,
        memberships,
        activeMembership,
        servicePartnerProfile,
        loading,
        isFirebaseConfigured,
        isDevMode: IS_DEV_MODE,
        sessionWarning,
        setActiveMembership,
        switchRole,
        loginWithDemoRole,
        loginWithDemoSession,
        refreshUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
