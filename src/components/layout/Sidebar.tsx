/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  Home,
  Building2,
  ShieldAlert,
  Wrench,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../config/constants';

export const Sidebar: React.FC = () => {
  const { user, currentRole, isFirebaseConfigured } = useAuth();

  const navLinks = [
    {
      to: '/dashboard/guard',
      label: 'Security Guard Terminal',
      sub: 'Visitor Check-in & Gate Logs',
      icon: ShieldCheck,
      role: 'SECURITY_GUARD',
    },
    {
      to: '/dashboard/resident',
      label: 'Resident Portal',
      sub: 'Flats, Passes & Deliveries',
      icon: Home,
      role: 'RESIDENT',
    },
    {
      to: '/dashboard/society-admin',
      label: 'Society Admin Portal',
      sub: 'Roster, Residents & Amenities',
      icon: Building2,
      role: 'SOCIETY_ADMIN',
    },
    {
      to: '/dashboard/service-partner',
      label: 'Service Partner Hub',
      sub: 'Vendor Passes & Work Orders',
      icon: Wrench,
      role: 'SERVICE_PARTNER',
    },
    {
      to: '/dashboard/super-admin',
      label: 'Super Admin Console',
      sub: 'Multi-Society SaaS & Health',
      icon: ShieldAlert,
      role: 'SUPER_ADMIN',
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-[#E6F1F5] bg-[#FFFFFF] p-4 min-h-[calc(100vh-4rem)] select-none">
      {/* Current Active Society Box with link to switch */}
      <NavLink
        to="/select-society"
        className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] mb-5 block hover:border-[#673AB7]/40 transition-all group"
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#A9B0B8] uppercase tracking-wider mb-1">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#673AB7]" />
            <span>Active Society</span>
          </div>
          <span className="text-[10px] text-[#673AB7] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Switch
          </span>
        </div>
        <p className="font-bold text-sm text-[#111111] truncate">
          {user?.societyName || 'Happiiz Master Cloud'}
        </p>
        <p className="text-xs text-[#A9B0B8] truncate mt-0.5">
          {user?.societyId ? `Society ID: ${user.societyId}` : 'Multi-Tenant Network'}
        </p>
      </NavLink>

      {/* Navigation Group */}
      <div className="space-y-1.5 flex-1">
        <p className="text-[11px] font-bold text-[#A9B0B8] uppercase tracking-wider px-2 mb-2">
          Role Dashboards
        </p>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isUserRole = currentRole === item.role;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-start gap-3 p-3 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-[#673AB7] text-white shadow-md font-semibold'
                    : 'text-[#111111] hover:bg-[#F1F9FC]'
                }`
              }
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  isUserRole ? 'bg-white/20 text-white' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold truncate">{item.label}</span>
                  {isUserRole && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-white/20 text-white shrink-0">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] opacity-75 truncate">{item.sub}</p>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Cloud & PWA Status Card */}
      <div className="p-3.5 rounded-2xl border border-[#E6F1F5] bg-[#F1F9FC] mt-auto text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#111111]">
            Happiiz Engine
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isFirebaseConfigured ? 'bg-emerald-500' : 'bg-[#673AB7]'
            }`}
          />
        </div>
        <p className="text-[11px] text-[#A9B0B8]">
          {isFirebaseConfigured
            ? 'Firebase Production Connected'
            : 'Reference UI Design System'}
        </p>
      </div>
    </aside>
  );
};
