/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Home, Building2, ShieldAlert, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { currentRole } = useAuth();

  const navItems = [
    {
      to: '/dashboard/guard',
      label: 'Guard',
      icon: Shield,
      role: 'SECURITY_GUARD',
    },
    {
      to: '/dashboard/resident',
      label: 'Resident',
      icon: Home,
      role: 'RESIDENT',
    },
    {
      to: '/dashboard/society-admin',
      label: 'Society',
      icon: Building2,
      role: 'SOCIETY_ADMIN',
    },
    {
      to: '/dashboard/service-partner',
      label: 'Partner',
      icon: Wrench,
      role: 'SERVICE_PARTNER',
    },
    {
      to: '/dashboard/super-admin',
      label: 'Platform',
      icon: ShieldAlert,
      role: 'SUPER_ADMIN',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050505] border-t border-black pb-safe"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isUserRole = currentRole === item.role;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-[#9DA3AD] hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className="w-5 h-5 transition-transform" />
                    {isUserRole && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#673AB7] ring-1 ring-black" />
                    )}
                  </div>
                  <span className="text-[10px] tracking-tight mt-1 truncate max-w-full px-1">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 w-6 h-0.5 bg-white rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
