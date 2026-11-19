/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformRole } from '../../types/admin';

export interface PlatformPermissionDef {
  key: string;
  label: string;
  description: string;
  moduleGroup: string;
}

export const PLATFORM_STAFF_PERMISSIONS: PlatformPermissionDef[] = [
  {
    key: 'society.read',
    label: 'View Societies & Companies',
    description: 'Inspect onboarded societies, buildings, flats, and corporate campuses',
    moduleGroup: 'Ecosystem',
  },
  {
    key: 'society.create',
    label: 'Create & Provision Societies',
    description: 'Create new tenant societies & corporate campuses',
    moduleGroup: 'Ecosystem',
  },
  {
    key: 'society.approve',
    label: 'Approve Onboarding KYC',
    description: 'Verify and approve pending society onboarding applications',
    moduleGroup: 'Ecosystem',
  },
  {
    key: 'society.suspend',
    label: 'Suspend / Reactivate Societies',
    description: 'Temporarily suspend or reactivate society accounts',
    moduleGroup: 'Ecosystem',
  },
  {
    key: 'marketplace.manage',
    label: 'Manage Service Catalog',
    description: 'Create, edit, and price Marketplace home services',
    moduleGroup: 'Marketplace',
  },
  {
    key: 'partner.verify',
    label: 'Manage & Verify Service Partners',
    description: 'Review Partner 360 CRM, onboard partners & verify KYC documents',
    moduleGroup: 'Marketplace',
  },
  {
    key: 'subscription.manage',
    label: 'Manage SaaS Subscriptions',
    description: 'Manage society subscription plans, renewals & packages',
    moduleGroup: 'Billing',
  },
  {
    key: 'billing.read',
    label: 'View Billing & Revenue Ledger',
    description: 'Inspect financial transactions, invoices, and revenue metrics',
    moduleGroup: 'Billing',
  },
  {
    key: 'billing.refund',
    label: 'Authorize Gateway Refunds',
    description: 'Process billing adjustments and transaction refunds',
    moduleGroup: 'Billing',
  },
  {
    key: 'emergency.monitor',
    label: 'Monitor Emergency SOS Alerts',
    description: 'Track live lift, fire, and medical SOS incidents across societies',
    moduleGroup: 'Operations',
  },
  {
    key: 'support.manage',
    label: 'Manage Support Tickets & Directory',
    description: 'Resolve community helpdesk tickets & view resident/guard directory',
    moduleGroup: 'Operations',
  },
  {
    key: 'announcements.manage',
    label: 'Publish Platform Announcements',
    description: 'Send and export community-wide notices and broadcasts',
    moduleGroup: 'Operations',
  },
  {
    key: 'user.suspend',
    label: 'Manage Global Users',
    description: 'Inspect global users and apply account suspensions',
    moduleGroup: 'Operations',
  },
  {
    key: 'reports.view',
    label: 'Analytics & Reports Export',
    description: 'View intelligence reports and download day/month/year PDFs',
    moduleGroup: 'Intelligence',
  },
  {
    key: 'system.configure',
    label: 'Feature Management Control',
    description: 'Toggle platform feature flags and module configurations',
    moduleGroup: 'Control Bar',
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<PlatformRole, string[]> = {
  SUPER_ADMIN: ['*'],
  PLATFORM_ADMIN: [
    'society.read',
    'society.create',
    'society.approve',
    'society.suspend',
    'partner.verify',
    'support.manage',
    'user.suspend',
    'reports.view',
  ],
  PLATFORM_OPERATIONS: [
    'society.read',
    'marketplace.manage',
    'partner.verify',
    'emergency.monitor',
    'support.manage',
    'announcements.manage',
  ],
  PLATFORM_FINANCE: ['society.read', 'subscription.manage', 'billing.read', 'billing.refund', 'reports.view'],
  PLATFORM_SUPPORT: ['society.read', 'support.manage', 'emergency.monitor', 'announcements.manage'],
  PLATFORM_READ_ONLY: ['society.read', 'billing.read', 'reports.view'],
};
