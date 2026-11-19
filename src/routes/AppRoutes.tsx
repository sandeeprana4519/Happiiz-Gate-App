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
import { DigitalSupporterDashboard } from '../pages/dashboards/DigitalSupporterDashboard';
import { SecurityStaffDashboard } from '../pages/dashboards/SecurityStaffDashboard';
import { NotFoundPage } from '../pages/notFound/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public Landing & Unified Centralized Authentication */}
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

        {/* ============================================================ */}
        {/* PWA APP 1: GATE GUARD APP (/guard & /dashboard/guard)        */}
        {/* ============================================================ */}
        <Route
          path="/guard/*"
          element={
            <ProtectedRoute
              allowedRoles={['SECURITY_GUARD', 'GATE_GUARD', 'SOCIETY_ADMIN', 'SECURITY_STAFF', 'SUPER_ADMIN']}
              requireActiveMembership={true}
            >
              <SecurityGuardDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/guard/*"
          element={
            <ProtectedRoute
              allowedRoles={['SECURITY_GUARD', 'GATE_GUARD', 'SOCIETY_ADMIN', 'SECURITY_STAFF', 'SUPER_ADMIN']}
              requireActiveMembership={true}
            >
              <SecurityGuardDashboard />
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* PWA APP 2: DIGITAL SUPPORTER APP (/supporter)                */}
        {/* ============================================================ */}
        <Route
          path="/supporter/*"
          element={
            <ProtectedRoute allowedRoles={['DIGITAL_SUPPORTER', 'PLATFORM_STAFF', 'SUPER_ADMIN']}>
              <DigitalSupporterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/supporter/*"
          element={
            <ProtectedRoute allowedRoles={['DIGITAL_SUPPORTER', 'PLATFORM_STAFF', 'SUPER_ADMIN']}>
              <DigitalSupporterDashboard />
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* PWA APP 3: SERVICE PARTNER APP (/partner)                    */}
        {/* ============================================================ */}
        <Route
          path="/partner/*"
          element={
            <ProtectedRoute allowedRoles={['SERVICE_PARTNER', 'SUPER_ADMIN']}>
              <ServicePartnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/service-partner/*"
          element={
            <ProtectedRoute allowedRoles={['SERVICE_PARTNER', 'SUPER_ADMIN']}>
              <ServicePartnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* WEB PORTAL 4: SOCIETY ADMIN PORTAL (/society)                */}
        {/* ============================================================ */}
        <Route
          path="/society/*"
          element={
            <ProtectedRoute
              allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}
              requireActiveMembership={true}
            >
              <SocietyAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/society-admin/*"
          element={
            <ProtectedRoute
              allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}
              requireActiveMembership={true}
            >
              <SocietyAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* WEB PORTAL 5: SECURITY STAFF PORTAL (/security-staff)        */}
        {/* ============================================================ */}
        <Route
          path="/security-staff/*"
          element={
            <ProtectedRoute
              allowedRoles={['SECURITY_STAFF', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}
              requireActiveMembership={true}
            >
              <SecurityStaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/security-staff/*"
          element={
            <ProtectedRoute
              allowedRoles={['SECURITY_STAFF', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}
              requireActiveMembership={true}
            >
              <SecurityStaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* PRESERVED: SOCIETY STAFF WORKSPACE & RESIDENT PORTAL         */}
        {/* ============================================================ */}
        <Route
          path="/dashboard/resident/*"
          element={
            <ProtectedRoute
              allowedRoles={['RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}
              requireActiveMembership={true}
            >
              <ResidentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/society-staff/*"
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

        {/* ============================================================ */}
        {/* WEB PORTAL 6: PLATFORM ADMIN STAFF PORTAL (/platform-staff)  */}
        {/* ============================================================ */}
        <Route
          path="/platform-staff/*"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_STAFF', 'PLATFORM_ADMIN_STAFF', 'SUPER_ADMIN']}>
              <PlatformStaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/platform-staff/*"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_STAFF', 'PLATFORM_ADMIN_STAFF', 'SUPER_ADMIN']}>
              <PlatformStaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_STAFF', 'PLATFORM_ADMIN_STAFF', 'SUPER_ADMIN']}>
              <PlatformStaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* WEB PORTAL 7: SUPER ADMIN PORTAL (/super-admin & /admin)     */}
        {/* ============================================================ */}
        <Route
          path="/super-admin/*"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/super-admin/*"
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
