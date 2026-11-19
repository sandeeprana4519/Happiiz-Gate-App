/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { rolesMatch } from '../config/constants';
import { normalizeAccountStatus } from '../services/firebase/auth.service';
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

  // Not logged in -> send to the single Universal Login page
  if (!user) {
    const params = new URLSearchParams();
    const fullReturnPath = `${location.pathname}${location.search || ''}`;
    if (fullReturnPath && fullReturnPath !== '/' && fullReturnPath !== '/login') {
      params.set('returnTo', fullReturnPath);
    }
    const queryStr = params.toString();
    return (
      <Navigate
        to={queryStr ? `/login?${queryStr}` : '/login'}
        state={{ from: location }}
        replace
      />
    );
  }

  const isSuperAdmin = Boolean(
    user.isSuperAdmin ||
      rolesMatch(currentRole, 'SUPER_ADMIN') ||
      rolesMatch(user.primaryRole, 'SUPER_ADMIN') ||
      rolesMatch(user.role, 'SUPER_ADMIN')
  );

  // If user profile has not completed onboarding (never bounce verified Super Admin)
  if (!user.onboardingCompleted && !isSuperAdmin) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check normalized account status (supports both accountStatus: "ACTIVE" and status: "active")
  const status = normalizeAccountStatus(user);
  if (
    status === 'BLOCKED' ||
    status === 'SUSPENDED' ||
    status === 'INACTIVE' ||
    status === 'DEACTIVATED'
  ) {
    return <Navigate to="/status/suspended" replace />;
  }

  if (status === 'REJECTED') {
    return <Navigate to="/status/rejected" replace />;
  }

  if (status === 'PENDING' && !isSuperAdmin) {
    return <Navigate to="/status/pending" replace />;
  }

  // Strictly enforce active society membership for society-scoped portals
  if (requireActiveMembership && !isSuperAdmin) {
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
