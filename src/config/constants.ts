/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoleConfig, UserRole } from '../types/auth';

export const APP_NAME = 'Happiiz Gate App';
export const APP_SHORT_NAME = 'Happiiz Gate';
export const APP_TAGLINE = 'Next-Gen Society & Gate Security Management';
export const APP_VERSION = '2.0.0-auth-rbac';

export const USER_ROLES: Record<UserRole, RoleConfig> = {
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    label: 'Super Admin',
    title: 'Platform Master Console',
    description: 'Multi-society management, SaaS billing, global security & system logs.',
    badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    defaultPath: '/dashboard/super-admin',
    iconName: 'ShieldAlert',
    capabilities: [
      'Manage Societies & Subscriptions',
      'System Audit & Global Analytics',
      'Feature Flags & Master Policies',
      'Enterprise Billing & Invoicing',
    ],
  },
  SOCIETY_ADMIN: {
    id: 'SOCIETY_ADMIN',
    label: 'Society Admin',
    title: 'Society Operations Center',
    description: 'Resident management, staff roster, visitor policies, facility bookings & accounts.',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    defaultPath: '/dashboard/society-admin',
    iconName: 'Building2',
    capabilities: [
      'Flats & Resident Onboarding',
      'Security Guards & Roster Allocation',
      'Society Maintenance & Notice Board',
      'Clubhouse & Amenities Management',
    ],
  },
  SECURITY_GUARD: {
    id: 'SECURITY_GUARD',
    label: 'Security Guard',
    title: 'Gate Sentinel Terminal',
    description: 'High-speed visitor check-in, OTP verification, vehicle logs & emergency SOS.',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    defaultPath: '/dashboard/guard',
    iconName: 'ShieldCheck',
    capabilities: [
      'Fast Visitor Entry / Exit Scanning',
      'Vehicle Plate & Delivery Logging',
      'Instant Resident Call Verification',
      'One-Touch Emergency SOS Dispatch',
    ],
  },
  RESIDENT: {
    id: 'RESIDENT',
    label: 'Resident',
    title: 'Resident Portal',
    description: 'Pre-approve guests, delivery alerts, domestic staff tracking & society bills.',
    badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    defaultPath: '/dashboard/resident',
    iconName: 'Home',
    capabilities: [
      'Pre-Approve Guests & Instant Pass',
      'Live Gate Notifications & Approvals',
      'Maid / Cook Attendance Real-time',
      'Amenity Booking & Maintenance Pay',
    ],
  },
  SERVICE_PARTNER: {
    id: 'SERVICE_PARTNER',
    label: 'Service Partner',
    title: 'Partner & Vendor Hub',
    description: 'Work order dispatch, technician gate passes, and service verification.',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    defaultPath: '/dashboard/service-partner',
    iconName: 'Wrench',
    capabilities: [
      'Technician Duty Passes',
      'Assigned Society Maintenance Tasks',
      'QR Code Gate Entry Passes',
      'Completion Work Order Sign-off',
    ],
  },
};

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
