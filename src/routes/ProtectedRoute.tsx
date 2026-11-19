/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { rolesMatch } from '../config/constants';
import { LoadingScreen } from '../components/common/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireActiveMembership?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireActiveMembership = false,
}) => {
  const { user, currentRole, activeMembership, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Verifying security credentials & access permissions..." />;
  }

  // Not logged in -> send to centralized login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user profile has not completed onboarding
  if (!user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check account status including INACTIVE and DEACTIVATED
  if (
    user.accountStatus === 'BLOCKED' ||
    user.accountStatus === 'SUSPENDED' ||
    user.accountStatus === 'INACTIVE' ||
    user.accountStatus === 'DEACTIVATED'
  ) {
    return <Navigate to="/status/suspended" replace />;
  }

  if (user.accountStatus === 'REJECTED') {
    return <Navigate to="/status/rejected" replace />;
  }

  if (user.accountStatus === 'PENDING') {
    return <Navigate to="/status/pending" replace />;
  }

  // Strictly enforce active society membership for society-scoped portals
  if (requireActiveMembership && !user.isSuperAdmin && !rolesMatch(user.primaryRole, 'SUPER_ADMIN')) {
    if (!activeMembership || activeMembership.membershipStatus !== 'ACTIVE') {
      return <Navigate to="/status/pending" replace />;
    }
  }

  // Strict Role-Based Access Control enforcement
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = Boolean(
      currentRole && allowedRoles.some((allowed) => rolesMatch(allowed, currentRole))
    );
    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
