/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { OfflineIndicator } from './OfflineIndicator';
import { PWAInstallPrompt } from './PWAInstallPrompt';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  // Dedicated portal dashboards (Super Admin, Society/Company Admin, Resident, Guard, Service Partner)
  // manage their own dedicated navigation, headers, sidebars, and full-screen layouts.
  // They should never render the public website marketing Header and Footer.
  const searchParams = new URLSearchParams(location.search);
  const roleParam = searchParams.get('role');
  const isAdminLoginRoute =
    location.pathname === '/login' &&
    (roleParam === 'SUPER_ADMIN' ||
      roleParam === 'PLATFORM_STAFF' ||
      roleParam === 'SOCIETY_ADMIN' ||
      roleParam === 'SOCIETY_STAFF' ||
      roleParam === 'COMPANY_ADMIN');

  const isDedicatedPortalScreen =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/staff') ||
    location.pathname.startsWith('/society') ||
    location.pathname.startsWith('/company') ||
    isAdminLoginRoute;

  if (isDedicatedPortalScreen) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#111111] flex flex-col w-full max-w-full overflow-x-hidden no-scrollbar">
        <OfflineIndicator />
        <PWAInstallPrompt />
        <main className="flex-1 w-full max-w-full overflow-x-hidden no-scrollbar">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] flex flex-col">
      <OfflineIndicator />
      <PWAInstallPrompt />
      <Header />

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
