/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase/init';
import { isFirebaseConfigured } from '../config/firebase.config';
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
import { signOutFirebase } from '../services/firebase/auth.service';
import { MOCK_USERS, MOCK_MEMBERSHIPS } from '../services/mock/mockData';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_MEMBERSHIP_KEY = 'happiiz_gate_active_membership';
const DEMO_USER_SESSION_KEY = 'happiiz_gate_demo_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<SocietyMembership[]>([]);
  const [activeMembership, setActiveMembershipState] = useState<SocietyMembership | null>(null);
  const [servicePartnerProfile, setServicePartnerProfile] = useState<ServicePartnerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to load user profile & memberships from Firestore
  const loadUserData = useCallback(async (uid: string, fbUserObj?: FirebaseUser | null) => {
    try {
      setLoading(true);
      const profile = await getFirestoreUserProfile(uid);

      if (profile) {
        setUser(profile);

        // If user is super admin
        if (profile.isSuperAdmin || profile.primaryRole === 'SUPER_ADMIN') {
          setMemberships([]);
          setActiveMembershipState(null);
          setLoading(false);
          return;
        }

        // If user is service partner
        if (profile.primaryRole === 'SERVICE_PARTNER') {
          const partner = await getServicePartnerProfile(uid);
          setServicePartnerProfile(partner);
        }

        // Load society memberships
        const userMemberships = await getUserSocietyMemberships(uid);
        setMemberships(userMemberships);

        // Check stored active membership preference
        const savedMembershipId = localStorage.getItem(ACTIVE_MEMBERSHIP_KEY);
        const matched = userMemberships.find((m) => m.societyId === savedMembershipId);
        
        if (matched && matched.membershipStatus === 'ACTIVE') {
          setActiveMembershipState(matched);
        } else {
          // Default to first active membership
          const firstActive = userMemberships.find((m) => m.membershipStatus === 'ACTIVE');
          setActiveMembershipState(firstActive || userMemberships[0] || null);
        }
      } else {
        // User is authenticated via Firebase but does NOT have a profile yet (needs onboarding)
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

  // Listen to real Firebase Authentication state changes
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      // In development mode when Firebase credentials are not yet supplied,
      // load the saved demo session or default to resident profile
      try {
        const savedDemo = localStorage.getItem(DEMO_USER_SESSION_KEY);
        if (savedDemo) {
          const parsed = JSON.parse(savedDemo) as UserProfile;
          setUser(parsed);
          const role = parsed.primaryRole || 'RESIDENT';
          const sampleMems = MOCK_MEMBERSHIPS[role] || [];
          setMemberships(sampleMems);
          setActiveMembershipState(sampleMems[0] || null);
        }
      } catch (e) {
        console.warn('Error reading demo user session:', e);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
      setFirebaseUser(currentFbUser);

      if (currentFbUser) {
        await loadUserData(currentFbUser.uid, currentFbUser);
      } else {
        setUser(null);
        setMemberships([]);
        setActiveMembershipState(null);
        setServicePartnerProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadUserData]);

  const setActiveMembership = (membership: SocietyMembership) => {
    setActiveMembershipState(membership);
    localStorage.setItem(ACTIVE_MEMBERSHIP_KEY, membership.societyId);
  };

  const refreshUserProfile = async () => {
    if (firebaseUser) {
      await loadUserData(firebaseUser.uid, firebaseUser);
    } else if (user) {
      await loadUserData(user.uid);
    }
  };

  const logout = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const isDevMode = !isFirebaseConfigured || Boolean(import.meta.env.DEV);

  const switchRole = (newRole: UserRole) => {
    loginWithDemoRole(newRole);
  };

  const loginWithDemoRole = (role: UserRole) => {
    const demoUser = MOCK_USERS[role] || MOCK_USERS['RESIDENT'];
    setUser(demoUser);
    const sampleMems = MOCK_MEMBERSHIPS[role] || [];
    setMemberships(sampleMems);
    setActiveMembershipState(sampleMems[0] || null);
    try {
      localStorage.setItem(DEMO_USER_SESSION_KEY, JSON.stringify(demoUser));
    } catch (e) {
      console.warn('Error saving demo session:', e);
    }
  };

  // Determine current active role from verified data
  let currentRole: UserRole | null = null;
  if (user) {
    if (user.isSuperAdmin || user.primaryRole === 'SUPER_ADMIN') {
      currentRole = 'SUPER_ADMIN';
    } else if (user.primaryRole === 'SERVICE_PARTNER') {
      currentRole = 'SERVICE_PARTNER';
    } else if (activeMembership && activeMembership.membershipStatus === 'ACTIVE') {
      currentRole = activeMembership.role;
    } else if (user.primaryRole) {
      currentRole = user.primaryRole;
    }
  }

  // Enrich user with convenience properties for downstream compatibility
  const enrichedUser: UserProfile | null = user
    ? {
        ...user,
        displayName: user.fullName || user.displayName || 'User',
        societyName: activeMembership?.societyName || user.societyName,
        societyId: activeMembership?.societyId || user.societyId,
        flatNumber: activeMembership?.flatId || user.flatNumber,
        block: activeMembership?.wingId || user.block,
        partnerCompany: servicePartnerProfile?.businessName || user.partnerCompany,
        role: currentRole || user.primaryRole || 'RESIDENT',
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
        isDevMode,
        setActiveMembership,
        switchRole,
        loginWithDemoRole,
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
