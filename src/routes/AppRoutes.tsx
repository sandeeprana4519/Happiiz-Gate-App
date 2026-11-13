/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { WelcomePage } from '../pages/landing/WelcomePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { OnboardingHub } from '../pages/onboarding/OnboardingHub';
import { ResidentRegistration } from '../pages/onboarding/ResidentRegistration';
import { GuardRegistration } from '../pages/onboarding/GuardRegistration';
import { SocietyAdminRegistration } from '../pages/onboarding/SocietyAdminRegistration';
import { ServicePartnerRegistration } from '../pages/onboarding/ServicePartnerRegistration';
import { PendingApprovalPage } from '../pages/status/PendingApprovalPage';
import { AccountRejectedPage } from '../pages/status/AccountRejectedPage';
import { AccountSuspendedPage } from '../pages/status/AccountSuspendedPage';
import { UnauthorizedPage } from '../pages/status/UnauthorizedPage';
import { MultiSocietySelectPage } from '../pages/status/MultiSocietySelectPage';
import { ProfileSettingsPage } from '../pages/profile/ProfileSettingsPage';
import { SuperAdminDashboard } from '../pages/dashboards/SuperAdminDashboard';
import { SocietyAdminDashboard } from '../pages/dashboards/SocietyAdminDashboard';
import { SecurityGuardDashboard } from '../pages/dashboards/SecurityGuardDashboard';
import { ResidentDashboard } from '../pages/dashboards/ResidentDashboard';
import { ServicePartnerDashboard } from '../pages/dashboards/ServicePartnerDashboard';
import { PlatformStaffDashboard } from '../pages/dashboards/PlatformStaffDashboard';
import { SocietyStaffDashboard } from '../pages/dashboards/SocietyStaffDashboard';
import { NotFoundPage } from '../pages/notFound/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public Landing & Authentication */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Onboarding & Role Registrations */}
        <Route path="/onboarding" element={<OnboardingHub />} />
        <Route path="/onboarding/resident" element={<ResidentRegistration />} />
        <Route path="/onboarding/guard" element={<GuardRegistration />} />
        <Route path="/onboarding/society-admin" element={<SocietyAdminRegistration />} />
        <Route path="/onboarding/service-partner" element={<ServicePartnerRegistration />} />

        {/* Account Status Screens */}
        <Route path="/status/pending" element={<PendingApprovalPage />} />
        <Route path="/status/rejected" element={<AccountRejectedPage />} />
        <Route path="/status/suspended" element={<AccountSuspendedPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/select-society" element={<MultiSocietySelectPage />} />

        {/* User Account & Security Settings */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Security Guard Sentinel */}
        <Route
          path="/dashboard/guard"
          element={
            <ProtectedRoute
              allowedRoles={['SECURITY_GUARD', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}
              requireActiveMembership={true}
            >
              <SecurityGuardDashboard />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Resident Portal */}
        <Route
          path="/dashboard/resident"
          element={
            <ProtectedRoute
              allowedRoles={['RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}
              requireActiveMembership={true}
            >
              <ResidentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Society Admin Center */}
        <Route
          path="/dashboard/society-admin"
          element={
            <ProtectedRoute
              allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}
              requireActiveMembership={true}
            >
              <SocietyAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Society Staff Workspace (Strictly Isolated to Assigned Society & Permissions) */}
        <Route
          path="/dashboard/society-staff"
          element={
            <ProtectedRoute
              allowedRoles={['SOCIETY_STAFF']}
              requireActiveMembership={true}
            >
              <SocietyStaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/society-staff/*"
          element={
            <ProtectedRoute
              allowedRoles={['SOCIETY_STAFF']}
              requireActiveMembership={true}
            >
              <SocietyStaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Service Partner Hub */}
        <Route
          path="/dashboard/service-partner"
          element={
            <ProtectedRoute allowedRoles={['SERVICE_PARTNER', 'SUPER_ADMIN']}>
              <ServicePartnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Platform Staff Operations Portal */}
        <Route
          path="/dashboard/platform-staff"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_STAFF', 'SUPER_ADMIN']}>
              <PlatformStaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_STAFF', 'SUPER_ADMIN']}>
              <PlatformStaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Super Admin Console */}
        <Route
          path="/dashboard/super-admin"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
