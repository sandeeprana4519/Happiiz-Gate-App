/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
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

  // Not logged in -> send to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user profile has not completed onboarding
  if (!user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check account status
  if (user.accountStatus === 'BLOCKED' || user.accountStatus === 'SUSPENDED') {
    return <Navigate to="/status/suspended" replace />;
  }

  if (user.accountStatus === 'REJECTED') {
    return <Navigate to="/status/rejected" replace />;
  }

  if (user.accountStatus === 'PENDING') {
    return <Navigate to="/status/pending" replace />;
  }

  // If role requires an active society membership
  if (requireActiveMembership && !user.isSuperAdmin && user.primaryRole !== 'SUPER_ADMIN') {
    if (!activeMembership || activeMembership.membershipStatus !== 'ACTIVE') {
      return <Navigate to="/status/pending" replace />;
    }
  }

  // Role validation
  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    // If user is super admin, permit access across all dashboards
    if (!user.isSuperAdmin && user.primaryRole !== 'SUPER_ADMIN') {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
