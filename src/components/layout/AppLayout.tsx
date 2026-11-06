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

  // Resident and Guard screens have their own dedicated mobile headers & bottom navs
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

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
