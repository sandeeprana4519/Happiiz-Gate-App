/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Store,
  Wrench,
  UserPlus,
  CreditCard,
  DollarSign,
  UsersRound,
  ShieldAlert,
  Headset,
  Bell,
  BookUser,
  Users,
  KeyRound,
  Sliders,
  BarChart3,
  Activity,
  History,
  Settings,
  Layers,
  Sparkles,
} from 'lucide-react';

export type SuperAdminTab =
  | 'dashboard'
  | 'societies'
  | 'companies'
  | 'onboarding'
  | 'subscriptions'
  | 'subscription-tiers'
  | 'assign-plan'
  | 'finance'
  | 'marketplace-services'
  | 'partners'
  | 'partner-kyc'
  | 'directory'
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

export type SidebarBadgeKey =
  | 'pendingApprovalsCount'
  | 'openTicketsCount'
  | 'activeEmergenciesCount';

export interface SidebarNavItem {
  id: SuperAdminTab;
  label: string;
  path: string;
  aliases?: string[];
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: SidebarBadgeKey;
  badgeColor?: string;
}

export interface SidebarSectionConfig {
  id: string;
  title: string;
  defaultOpen?: boolean;
  items: SidebarNavItem[];
}

export const SUPER_ADMIN_SIDEBAR_CONFIG: SidebarSectionConfig[] = [
  {
    id: 'core',
    title: 'CORE',
    defaultOpen: true,
    items: [
      {
        id: 'dashboard',
        label: 'Master Dashboard',
        path: '/admin/dashboard',
        aliases: ['/admin/core/dashboard', '/dashboard/super-admin'],
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 'ecosystem',
    title: 'ECOSYSTEM',
    defaultOpen: true,
    items: [
      {
        id: 'societies',
        label: 'Societies',
        path: '/admin/ecosystem/societies',
        icon: Building2,
      },
      {
        id: 'companies',
        label: 'Companies',
        path: '/admin/ecosystem/companies',
        icon: Briefcase,
      },
    ],
  },
  {
    id: 'marketplace',
    title: 'MARKETPLACE',
    defaultOpen: true,
    items: [
      {
        id: 'marketplace-services',
        label: 'Service Catalog',
        path: '/admin/marketplace/services',
        icon: Store,
      },
      {
        id: 'partners',
        label: 'Our Partners',
        path: '/admin/marketplace/our-partners',
        icon: Wrench,
      },
      {
        id: 'partner-kyc',
        label: 'Add New Partner',
        path: '/admin/marketplace/add-partner',
        icon: UserPlus,
      },
    ],
  },
  {
    id: 'billing',
    title: 'BILLING',
    defaultOpen: true,
    items: [
      {
        id: 'subscriptions',
        label: 'Subscriptions',
        path: '/admin/billing/subscriptions',
        icon: CreditCard,
      },
      {
        id: 'subscription-tiers',
        label: 'Subscription Tiers',
        path: '/admin/billing/subscription-tiers',
        aliases: ['/admin/billing/tiers', '/admin/billing/trials'],
        icon: Layers,
      },
      {
        id: 'assign-plan',
        label: 'Assign / Upgrade Plan',
        path: '/admin/billing/assign-plan',
        icon: Sparkles,
      },
      {
        id: 'finance',
        label: 'Billing & Revenue',
        path: '/admin/billing/revenue',
        icon: DollarSign,
      },
    ],
  },
  {
    id: 'our-team',
    title: 'OUR TEAM',
    defaultOpen: true,
    items: [
      {
        id: 'platform-staff',
        label: 'Platform Staff',
        path: '/admin/team/platform-staff',
        icon: UsersRound,
      },
    ],
  },
  {
    id: 'operations',
    title: 'OPERATIONS',
    defaultOpen: true,
    items: [
      {
        id: 'emergency',
        label: 'Emergency Monitoring',
        path: '/admin/operations/emergency-monitoring',
        icon: ShieldAlert,
        badgeKey: 'activeEmergenciesCount',
        badgeColor: 'bg-red-500 text-white',
      },
      {
        id: 'support',
        label: 'Support Tickets',
        path: '/admin/operations/support-tickets',
        icon: Headset,
      },
      {
        id: 'notifications',
        label: 'Announcements',
        path: '/admin/operations/announcements',
        icon: Bell,
      },
      {
        id: 'directory',
        label: 'Directory',
        path: '/admin/operations/directory',
        icon: BookUser,
      },
      {
        id: 'users',
        label: 'Global Users',
        path: '/admin/operations/global-users',
        icon: Users,
      },
    ],
  },
  {
    id: 'intelligence',
    title: 'INTELLIGENCE',
    defaultOpen: true,
    items: [
      {
        id: 'reports',
        label: 'Analytics & Reports',
        path: '/admin/intelligence/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'control-bar',
    title: 'CONTROL BAR',
    defaultOpen: true,
    items: [
      {
        id: 'feature-flags',
        label: 'Feature Management',
        path: '/admin/control/features',
        icon: Sliders,
      },
      {
        id: 'roles',
        label: 'Security Rules & Permissions',
        path: '/admin/control/rules-permissions',
        aliases: ['/admin/security/rules-permissions', '/admin/operations/rules-permissions'],
        icon: KeyRound,
      },
    ],
  },
  {
    id: 'devops',
    title: 'DEVOPS',
    defaultOpen: true,
    items: [
      {
        id: 'system-health',
        label: 'Security & Health',
        path: '/admin/devops/security-health',
        icon: Activity,
      },
    ],
  },
  {
    id: 'security-audit',
    title: 'SECURITY & AUDIT',
    defaultOpen: true,
    items: [
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        path: '/admin/security/audit-logs',
        icon: History,
      },
      {
        id: 'settings',
        label: 'System / Platform Settings',
        path: '/admin/security/platform-settings',
        icon: Settings,
      },
    ],
  },
];

export const normalizeSuperAdminTab = (tab?: string | null): SuperAdminTab => {
  switch (tab) {
    case 'onboarding':
    case 'approvals':
      return 'societies';
    case 'residents':
    case 'guards':
    case 'society-admins':
      return 'directory';
    case 'emergencies':
      return 'emergency';
    case 'global-users':
      return 'users';
    default: {
      const validIds = new Set<string>(
        SUPER_ADMIN_SIDEBAR_CONFIG.flatMap((section) => section.items.map((item) => item.id))
      );
      return tab && validIds.has(tab) ? (tab as SuperAdminTab) : 'dashboard';
    }
  }
};

export const findNavItemByPath = (pathname: string): SidebarNavItem | undefined => {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  for (const section of SUPER_ADMIN_SIDEBAR_CONFIG) {
    for (const item of section.items) {
      if (item.path === cleanPath || item.aliases?.includes(cleanPath)) {
        return item;
      }
    }
  }
  return undefined;
};

export const findNavItemByTab = (tab: SuperAdminTab): SidebarNavItem | undefined => {
  const normalized = normalizeSuperAdminTab(tab);
  for (const section of SUPER_ADMIN_SIDEBAR_CONFIG) {
    const found = section.items.find((item) => item.id === normalized);
    if (found) return found;
  }
  return undefined;
};

export const findSectionIdByTab = (tab: SuperAdminTab): string | undefined => {
  const normalized = normalizeSuperAdminTab(tab);
  for (const section of SUPER_ADMIN_SIDEBAR_CONFIG) {
    if (section.items.some((item) => item.id === normalized)) {
      return section.id;
    }
  }
  return undefined;
};
