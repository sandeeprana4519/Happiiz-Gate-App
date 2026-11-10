/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  UserCog,
  Users,
  ShieldCheck,
  Wrench,
  CreditCard,
  DollarSign,
  Headset,
  Bell,
  BarChart3,
  KeyRound,
  History,
  Settings,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Briefcase,
  ClipboardList,
  AlertOctagon,
  Sliders,
  Activity,
  UserPlus,
  Layers,
} from 'lucide-react';

export type SuperAdminTab =
  | 'dashboard'
  | 'societies'
  | 'companies'
  | 'onboarding'
  | 'subscriptions'
  | 'finance'
  | 'marketplace-services'
  | 'partners'
  | 'partner-kyc'
  | 'users'
  | 'roles'
  | 'emergency'
  | 'support'
  | 'notifications'
  | 'reports'
  | 'feature-flags'
  | 'system-health'
  | 'platform-staff'
  | 'audit-logs'
  | 'settings';

interface SuperAdminSidebarProps {
  currentTab: SuperAdminTab;
  onSelectTab: (tab: SuperAdminTab) => void;
  pendingApprovalsCount?: number;
  openTicketsCount?: number;
  activeEmergenciesCount?: number;
}

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingApprovalsCount = 0,
  openTicketsCount = 0,
  activeEmergenciesCount = 0,
}) => {
  const navItems: {
    id: SuperAdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    category?: string;
  }[] = [
    { id: 'dashboard', label: 'Master Dashboard', icon: LayoutDashboard, category: 'Core' },
    { id: 'societies', label: 'Societies', icon: Building2, category: 'Ecosystem' },
    { id: 'companies', label: 'Companies', icon: Briefcase, category: 'Ecosystem' },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, category: 'Billing' },
    { id: 'finance', label: 'Billing & Revenue', icon: DollarSign, category: 'Billing' },
    { id: 'marketplace-services', label: 'Service Catalog', icon: Layers, category: 'Marketplace' },
    { id: 'partners', label: 'Our Partners', icon: Wrench, category: 'Marketplace' },
    {
      id: 'partner-kyc',
      label: 'Add New Partner',
      icon: ShieldCheck,
      badge: pendingApprovalsCount,
      badgeColor: 'bg-amber-500 text-white',
      category: 'Marketplace',
    },
    { id: 'users', label: 'Global Users', icon: Users, category: 'Directory' },
    { id: 'roles', label: 'Roles & Permissions', icon: KeyRound, category: 'Security' },
    {
      id: 'emergency',
      label: 'Emergency Monitoring',
      icon: AlertOctagon,
      badge: activeEmergenciesCount,
      badgeColor: 'bg-red-500 text-white',
      category: 'Operations',
    },
    { id: 'support', label: 'Support Tickets', icon: Headset, badge: openTicketsCount, category: 'Operations' },
    { id: 'notifications', label: 'Announcements', icon: Bell, category: 'Operations' },
    { id: 'reports', label: 'Analytics & Reports', icon: BarChart3, category: 'Intelligence' },
    { id: 'feature-flags', label: 'Feature Management', icon: Sliders, category: 'Control' },
    { id: 'system-health', label: 'System Health', icon: Activity, category: 'DevOps' },
    { id: 'platform-staff', label: 'Platform Staff', icon: UserPlus, category: 'Team' },
    { id: 'audit-logs', label: 'Audit Logs', icon: History, category: 'Security' },
    { id: 'settings', label: 'Platform Settings', icon: Settings, category: 'System' },
  ];

  return (
    <aside className="w-64 xl:w-72 shrink-0 bg-[#FFFFFF] border-r border-[#E6F1F5] flex flex-col h-full select-none">
      {/* Super Admin Identity Badge */}
      <div className="p-4 border-b border-[#E6F1F5] bg-[#F1F9FC]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-black shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-[#111111] truncate">Super Console</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#673AB7] text-white uppercase tracking-wider">
                Root
              </span>
            </div>
            <p className="text-[11px] text-[#A9B0B8] truncate">Happiiz Gate Enterprise SaaS</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const showCategoryHeader = idx === 0 || item.category !== navItems[idx - 1].category;

          return (
            <React.Fragment key={item.id}>
              {showCategoryHeader && item.category && (
                <div className="pt-3 pb-1 px-3 text-[10px] font-extrabold text-[#A9B0B8] uppercase tracking-wider">
                  {item.category}
                </div>
              )}
              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#673AB7] text-white shadow-xs'
                    : 'text-[#111111] hover:bg-[#F1F9FC] hover:text-[#673AB7]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#A9B0B8]'}`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-[#673AB7]'
                          : item.badgeColor || 'bg-amber-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />}
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom Security Info */}
      <div className="p-3 border-t border-[#E6F1F5] bg-[#F1F9FC]/40 text-[11px] text-[#A9B0B8] flex items-center justify-between">
        <span className="font-mono text-[10px]">v4.2.0 • Cloud RBAC</span>
        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Secured
        </span>
      </div>
    </aside>
  );
};
