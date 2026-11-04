/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from './OfflineIndicator';
import { PWAInstallPrompt } from './PWAInstallPrompt';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  // Resident and Guard screens have their own dedicated headers & navigation from reference screenshots
  const isDedicatedMobileScreen =
    location.pathname === '/dashboard/resident' ||
    location.pathname === '/dashboard/guard';

  if (isDedicatedMobileScreen) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#111111] flex flex-col">
        <OfflineIndicator />
        <PWAInstallPrompt />
        <main className="flex-1 w-full">
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

      <div className="flex-1 flex w-full">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 lg:pb-8 pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
};
