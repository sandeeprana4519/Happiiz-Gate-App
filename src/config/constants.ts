/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoleConfig, UserRole } from '../types/auth';

export const APP_NAME = 'Happiiz Gate App';
export const APP_SHORT_NAME = 'Happiiz Gate';
export const APP_TAGLINE = 'Next-Gen Society & Gate Security Management';
export const APP_VERSION = '2.5.0-prod';

const _env: Record<string, any> =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env
    : typeof process !== 'undefined' && process.env
    ? process.env
    : {};

/**
 * Cryptographically verified Root Super Admin Firebase Auth UID (non-secret identifier).
 * NEVER grants Super Admin by email alone — strictly bound to Firebase Auth UID.
 */
export const ROOT_SUPER_ADMIN_UID: string = String(
  _env.VITE_ROOT_SUPER_ADMIN_UID || 'i2INKUJ27fZpwFKOBV5o7qOm4it2'
).trim();

export function normalizeUserRole(role?: string | null): UserRole {
  const upper = String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!upper) return 'RESIDENT';
  if (upper === 'SUPER_ADMIN' || upper === 'SUPERADMIN') return 'SUPER_ADMIN';
  if (
    upper === 'PLATFORM_ADMIN_STAFF' ||
    upper === 'PLATFORM_ADMIN' ||
    upper === 'PLATFORM_SUPPORT' ||
    upper === 'PLATFORM_FINANCE' ||
    upper === 'PLATFORM_OPERATIONS' ||
    upper === 'PLATFORM_READ_ONLY'
  ) {
    return 'PLATFORM_STAFF';
  }
  if (upper === 'COMPANY_ADMIN') return 'SOCIETY_ADMIN';
  if (upper === 'SECURITY_SUPERVISOR') return 'SECURITY_STAFF';
  if (upper === 'GATE_GUARD') return 'SECURITY_GUARD';
  if (upper === 'TECHNICIAN') return 'SERVICE_PARTNER';
  return upper as UserRole;
}

export function isKnownUserRole(role?: string | null): boolean {
  const raw = String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!raw) return false;
  return Object.prototype.hasOwnProperty.call(USER_ROLES, raw) || raw === 'SUPERADMIN';
}

export function rolesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return normalizeUserRole(a) === normalizeUserRole(b);
}

const GUARD_ROLE_CONFIG: RoleConfig = {
  id: 'SECURITY_GUARD',
  label: 'Gate Guard',
  title: 'Gate Guard Sentinel PWA',
  description: 'High-speed visitor check-in, AI ANPR plate scan, OTP verification & emergency SOS.',
  badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  defaultPath: '/guard',
  iconName: 'ShieldCheck',
  capabilities: [
    'Fast Visitor Entry / Exit Scanning',
    'AI ANPR Vehicle Plate Scanner',
    'Instant Resident Call Verification',
    'One-Touch Emergency SOS Dispatch',
  ],
};

const PLATFORM_STAFF_ROLE_CONFIG: RoleConfig = {
  id: 'PLATFORM_STAFF',
  label: 'Admin Platform Staff',
  title: 'Admin Platform Staff Operations Portal',
  description: 'Permission-scoped corporate portal for operations, finance, support & partner verification teams.',
  badgeColor: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  defaultPath: '/platform-staff',
  iconName: 'UsersRound',
  capabilities: [
    'Assigned Role & Permissions Overview',
    'Super Admin Authorized Modules Only',
    'Departmental Operations & Support',
    'Audit-Tracked Actions',
  ],
};

const SOCIETY_ADMIN_ROLE_CONFIG: RoleConfig = {
  id: 'SOCIETY_ADMIN',
  label: 'Society Admin',
  title: 'Society Operations Center',
  description: 'Resident management, staff roster, visitor policies, facility bookings & accounts.',
  badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  defaultPath: '/society',
  iconName: 'Building2',
  capabilities: [
    'Flats & Resident Onboarding',
    'Security Guards & Roster Allocation',
    'Society Maintenance & Notice Board',
    'Clubhouse & Amenities Management',
  ],
};

const SECURITY_STAFF_ROLE_CONFIG: RoleConfig = {
  id: 'SECURITY_STAFF',
  label: 'Security Staff',
  title: 'Society Security Control Portal',
  description: 'Gate monitoring, guard shift oversight, visitor & ANPR surveillance, and SOS response.',
  badgeColor: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  defaultPath: '/security-staff',
  iconName: 'ShieldCheck',
  capabilities: [
    'Multi-Gate Monitoring & Gate Activity',
    'Guard Roster & Shift Oversight',
    'Vehicle & AI ANPR Scan History',
    'Emergency SOS & Security Reports',
  ],
};

const SERVICE_PARTNER_ROLE_CONFIG: RoleConfig = {
  id: 'SERVICE_PARTNER',
  label: 'Service Partner',
  title: 'Service Partner PWA',
  description: 'Work order dispatch, technician gate passes, bookings & service verification.',
  badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  defaultPath: '/partner',
  iconName: 'Wrench',
  capabilities: [
    'Technician Duty Passes',
    'Assigned Society Maintenance Tasks',
    'QR Code Gate Entry Passes',
    'Completion Work Order Sign-off',
  ],
};

export const USER_ROLES: Record<UserRole, RoleConfig> = {
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    label: 'Super Admin',
    title: 'Platform Master Console',
    description: 'Multi-society management, SaaS billing, global security & system logs.',
    badgeColor: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30',
    defaultPath: '/super-admin',
    iconName: 'ShieldAlert',
    capabilities: [
      'Manage Societies & Subscriptions',
      'System Audit & Global Analytics',
      'Feature Flags & Master Policies',
      'Enterprise Billing & Invoicing',
    ],
  },
  PLATFORM_STAFF: PLATFORM_STAFF_ROLE_CONFIG,
  PLATFORM_ADMIN_STAFF: { ...PLATFORM_STAFF_ROLE_CONFIG, id: 'PLATFORM_ADMIN_STAFF' },
  PLATFORM_ADMIN: { ...PLATFORM_STAFF_ROLE_CONFIG, id: 'PLATFORM_ADMIN', label: 'Platform Admin' },
  PLATFORM_SUPPORT: { ...PLATFORM_STAFF_ROLE_CONFIG, id: 'PLATFORM_SUPPORT', label: 'Platform Support' },
  PLATFORM_FINANCE: { ...PLATFORM_STAFF_ROLE_CONFIG, id: 'PLATFORM_FINANCE', label: 'Platform Finance' },
  PLATFORM_OPERATIONS: { ...PLATFORM_STAFF_ROLE_CONFIG, id: 'PLATFORM_OPERATIONS', label: 'Platform Operations' },
  PLATFORM_READ_ONLY: { ...PLATFORM_STAFF_ROLE_CONFIG, id: 'PLATFORM_READ_ONLY', label: 'Platform Read-Only' },
  SOCIETY_ADMIN: SOCIETY_ADMIN_ROLE_CONFIG,
  COMPANY_ADMIN: { ...SOCIETY_ADMIN_ROLE_CONFIG, id: 'COMPANY_ADMIN', label: 'Company Admin' },
  SECURITY_STAFF: SECURITY_STAFF_ROLE_CONFIG,
  SECURITY_SUPERVISOR: { ...SECURITY_STAFF_ROLE_CONFIG, id: 'SECURITY_SUPERVISOR', label: 'Security Supervisor' },
  SOCIETY_STAFF: {
    id: 'SOCIETY_STAFF',
    label: 'Society Staff',
    title: 'Society Staff Portal',
    description: 'Society-scoped operational portal restricted strictly to modules & permissions granted by the Society Admin.',
    badgeColor: 'bg-teal-500/15 text-teal-600 border-teal-500/30',
    defaultPath: '/dashboard/society-staff',
    iconName: 'UserCog',
    capabilities: [
      'Single-Society Isolated Workspace',
      'Assigned Role & Permissions Only',
      'Resident, Visitor, Helpdesk & Billing Tasks',
      'Society-Audited Actions',
    ],
  },
  SECURITY_GUARD: GUARD_ROLE_CONFIG,
  GATE_GUARD: {
    ...GUARD_ROLE_CONFIG,
    id: 'GATE_GUARD',
  },
  DIGITAL_SUPPORTER: {
    id: 'DIGITAL_SUPPORTER',
    label: 'Digital Supporter',
    title: 'Digital Supporter Mobile PWA',
    description: 'Assigned support tickets, live society assistance, resident issue triage & mobile notifications.',
    badgeColor: 'bg-sky-500/15 text-sky-600 border-sky-500/30',
    defaultPath: '/supporter',
    iconName: 'Headset',
    capabilities: [
      'Assigned Support Ticket Resolution',
      'Multi-Society Assistance Queue',
      'Mobile Offline Support Workspace',
      'Instant Escalation & Notifications',
    ],
  },
  RESIDENT: {
    id: 'RESIDENT',
    label: 'Resident',
    title: 'Resident Portal',
    description: 'Pre-approve guests, delivery alerts, domestic staff tracking & society bills.',
    badgeColor: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
    defaultPath: '/dashboard/resident',
    iconName: 'Home',
    capabilities: [
      'Pre-Approve Guests & Instant Pass',
      'Live Gate Notifications & Approvals',
      'Maid / Cook Attendance Real-time',
      'Amenity Booking & Maintenance Pay',
    ],
  },
  SERVICE_PARTNER: SERVICE_PARTNER_ROLE_CONFIG,
  TECHNICIAN: { ...SERVICE_PARTNER_ROLE_CONFIG, id: 'TECHNICIAN', label: 'Technician' },
};

export function getRoleDefaultRoute(role?: UserRole | string | null): string {
  const canonical = normalizeUserRole(role);
  return USER_ROLES[canonical]?.defaultPath || '/dashboard/resident';
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
];

export const SERVICE_CATEGORIES = [
  'Elevator & Lifts Maintenance',
  'HVAC & Air Conditioning',
  'Plumbing & Water Tanks',
  'Electrical & DG Backup',
  'Security & CCTV Surveillance',
  'Housekeeping & Waste Management',
  'Pest Control & Sanitization',
  'Carpentry & Civil Works',
  'Gardening & Landscaping',
  'Fire Safety & Systems',
];
