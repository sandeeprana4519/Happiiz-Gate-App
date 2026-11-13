/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Layers,
  Home,
  Users,
  HeartHandshake,
  ShieldCheck,
  DoorOpen,
  UserCheck,
  Ticket,
  Megaphone,
  Headset,
  CreditCard,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  Wrench,
  BarChart3,
  UserCog,
  Settings,
  ChevronRight,
  Building2,
  X,
  LogOut,
} from 'lucide-react';

export type SocietyAdminTab =
  | 'dashboard'
  | 'profile'
  | 'buildings'
  | 'flats'
  | 'residents'
  | 'household'
  | 'guards'
  | 'gates'
  | 'visitors'
  | 'pre-approvals'
  | 'notices'
  | 'helpdesk'
  | 'maintenance'
  | 'amenities'
  | 'emergency'
  | 'community'
  | 'service-partners'
  | 'reports'
  | 'staff'
  | 'settings';

interface SocietyAdminSidebarProps {
  currentTab: SocietyAdminTab;
  onSelectTab: (tab: SocietyAdminTab) => void;
  openComplaintsCount?: number;
  activeEmergencyAlertsCount?: number;
  societyName: string;
  societyCode: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  Overview: 'bg-teal-400',
  'Physical Structure': 'bg-sky-400',
  'People & Households': 'bg-indigo-400',
  'Security & Access Gates': 'bg-rose-400',
  'Community & Facilities': 'bg-amber-400',
  'Finance & Administration': 'bg-emerald-400',
};

export const SocietyAdminSidebar: React.FC<SocietyAdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  openComplaintsCount = 0,
  activeEmergencyAlertsCount = 0,
  societyName,
  societyCode,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onCloseMobile?.();
    await logout();
    navigate('/login');
  };

  const navSections: {
    category: string;
    items: {
      id: SocietyAdminTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: number;
      badgeVariant?: 'warning' | 'danger';
    }[];
  }[] = [
    {
      category: 'Overview',
      items: [{ id: 'dashboard', label: 'Command Center', icon: LayoutDashboard }],
    },
    {
      category: 'Physical Structure',
      items: [
        { id: 'profile', label: 'Society Profile & Rules', icon: Building2 },
        { id: 'buildings', label: 'Towers, Blocks & Wings', icon: Layers },
        { id: 'flats', label: 'Flat Inventory & Units', icon: Home },
      ],
    },
    {
      category: 'People & Households',
      items: [
        { id: 'residents', label: 'Residents Roster', icon: Users },
        { id: 'household', label: 'Family, Vehicles & Helpers', icon: HeartHandshake },
        { id: 'staff', label: 'Management & Staff', icon: UserCog },
      ],
    },
    {
      category: 'Security & Access Gates',
      items: [
        { id: 'guards', label: 'Security Guard Sentinels', icon: ShieldCheck },
        { id: 'gates', label: 'Gate Checkpoints', icon: DoorOpen },
        { id: 'visitors', label: 'Live Visitor Ingress', icon: UserCheck },
        { id: 'pre-approvals', label: 'Visitor Pre-Approvals', icon: Ticket },
        {
          id: 'emergency',
          label: 'Emergency & SOS Alerts',
          icon: AlertTriangle,
          badge: activeEmergencyAlertsCount,
          badgeVariant: 'danger',
        },
      ],
    },
    {
      category: 'Community & Facilities',
      items: [
        { id: 'notices', label: 'Digital Notice Board', icon: Megaphone },
        {
          id: 'helpdesk',
          label: 'HelpDesk & Complaints',
          icon: Headset,
          badge: openComplaintsCount,
          badgeVariant: 'warning',
        },
        { id: 'amenities', label: 'Amenities & Bookings', icon: Sparkles },
        { id: 'community', label: 'Community Feed & Events', icon: MessageSquare },
        { id: 'service-partners', label: 'Service Partners', icon: Wrench },
      ],
    },
    {
      category: 'Finance & Administration',
      items: [
        { id: 'maintenance', label: 'Dues & Maintenance Invoices', icon: CreditCard },
        { id: 'reports', label: 'Reports & Exports', icon: BarChart3 },
        { id: 'settings', label: 'Society Settings', icon: Settings },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0B2524] via-[#0F3331] to-[#081C1B] text-slate-100 select-none w-full">
      {/* Society Admin Identity Badge */}
      <div className="p-4 border-b border-white/10 bg-white/[0.03] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-black shadow-lg shadow-teal-950/50 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-white truncate tracking-tight">{societyName}</h3>
            <div className="flex items-center gap-1.5 text-[11px] text-teal-200/80">
              <span className="font-mono font-semibold">{societyCode}</span>
              <span>·</span>
              <span className="text-emerald-300 font-semibold">Owner Console</span>
            </div>
          </div>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {navSections.map((sec) => {
          const dotColor = CATEGORY_DOT_COLORS[sec.category] || 'bg-teal-400';
          return (
            <div key={sec.category} className="space-y-1">
              <div className="px-2.5 py-1 flex items-center gap-2 text-[10px] font-bold text-teal-200/65 uppercase tracking-wider">
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                <span>{sec.category}</span>
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile?.();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold shadow-md shadow-teal-950/50'
                        : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-teal-300/75'}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                            item.badgeVariant === 'danger'
                              ? 'bg-rose-500 text-white'
                              : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/90 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sign Out Option */}
      <div className="p-3 border-t border-white/10 bg-black/15">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 border border-rose-400/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign Out (लॉगआउट)</span>
          </div>
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/10 bg-black/25 text-[11px] text-teal-200/75 flex items-center justify-between">
        <span className="font-medium">Society Command</span>
        <span className="text-emerald-300 font-semibold">Active Enclave</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 xl:w-72 shrink-0 border-r border-white/10 flex-col sticky top-0 h-screen select-none z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 bg-[#0B2524]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
