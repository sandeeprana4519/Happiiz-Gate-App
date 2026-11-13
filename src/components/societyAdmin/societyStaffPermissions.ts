/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SocietyStaffRoleLabel } from '../../types/societyAdmin';

export interface SocietyPermissionDef {
  key: string;
  label: string;
  description: string;
  moduleGroup: string;
}

export const SOCIETY_STAFF_PERMISSIONS: SocietyPermissionDef[] = [
  {
    key: 'society.structure.view',
    label: 'Towers, Flats & Society Profile',
    description: 'View & manage society profile, towers/wings, and flat inventory units',
    moduleGroup: 'Physical Structure',
  },
  {
    key: 'society.residents.manage',
    label: 'Residents Roster & Approvals',
    description: 'View residents directory, approve onboarding & update flat assignments',
    moduleGroup: 'People & Households',
  },
  {
    key: 'society.household.manage',
    label: 'Family, Vehicles & Helpers',
    description: 'Manage family members, vehicles, domestic helpers & guard gate passes',
    moduleGroup: 'People & Households',
  },
  {
    key: 'society.guards_gates.manage',
    label: 'Security Guards & Gates',
    description: 'Manage security guard shifts, assignments and society gate checkpoints',
    moduleGroup: 'Security & Gates',
  },
  {
    key: 'society.visitors.manage',
    label: 'Live Visitors & Pre-Approvals',
    description: 'Track live visitor ingress, check-outs & digital gate passes',
    moduleGroup: 'Security & Gates',
  },
  {
    key: 'society.emergency.monitor',
    label: 'Emergency & SOS Alerts',
    description: 'Monitor and resolve live SOS panic and emergency incidents',
    moduleGroup: 'Security & Gates',
  },
  {
    key: 'society.notices.manage',
    label: 'Digital Notice Board',
    description: 'Publish and archive society notices, alerts and circulars',
    moduleGroup: 'Community & Facilities',
  },
  {
    key: 'society.helpdesk.manage',
    label: 'HelpDesk & Complaints',
    description: 'Triage, assign, reply to, and resolve resident helpdesk tickets',
    moduleGroup: 'Community & Facilities',
  },
  {
    key: 'society.amenities.manage',
    label: 'Amenities & Club Bookings',
    description: 'Approve or reject clubhouse, banquet hall & facility reservations',
    moduleGroup: 'Community & Facilities',
  },
  {
    key: 'society.community.manage',
    label: 'Community Feed & Service Partners',
    description: 'Moderate community discussion posts & view society vendor partners',
    moduleGroup: 'Community & Facilities',
  },
  {
    key: 'society.maintenance.manage',
    label: 'Dues & Maintenance Invoices',
    description: 'Generate monthly maintenance bills & record offline receipts',
    moduleGroup: 'Finance & Admin',
  },
  {
    key: 'society.reports.view',
    label: 'Reports & Exports',
    description: 'Generate society operational reports, CSV exports & view audit trail',
    moduleGroup: 'Finance & Admin',
  },
  {
    key: 'society.settings.manage',
    label: 'Society Rules & Settings',
    description: 'Update society rules, security policies & billing settings',
    moduleGroup: 'Finance & Admin',
  },
];

export const DEFAULT_SOCIETY_STAFF_PERMISSIONS: Record<SocietyStaffRoleLabel, string[]> = {
  'Society Admin': SOCIETY_STAFF_PERMISSIONS.map((p) => p.key),
  'Society Manager': [
    'society.structure.view',
    'society.residents.manage',
    'society.household.manage',
    'society.visitors.manage',
    'society.notices.manage',
    'society.helpdesk.manage',
    'society.amenities.manage',
    'society.reports.view',
  ],
  Accountant: [
    'society.structure.view',
    'society.maintenance.manage',
    'society.reports.view',
  ],
  'Security Supervisor': [
    'society.guards_gates.manage',
    'society.visitors.manage',
    'society.emergency.monitor',
    'society.household.manage',
  ],
  'Maintenance Staff': [
    'society.structure.view',
    'society.helpdesk.manage',
    'society.amenities.manage',
  ],
  'HelpDesk Executive': [
    'society.residents.manage',
    'society.notices.manage',
    'society.helpdesk.manage',
    'society.community.manage',
  ],
  'Facility Coordinator': [
    'society.amenities.manage',
    'society.notices.manage',
    'society.community.manage',
  ],
  'Society Staff': [
    'society.visitors.manage',
    'society.helpdesk.manage',
  ],
};

export function getSocietyPermissionLabel(key: string): string {
  if (key === '*') return 'Full Society Access';
  return SOCIETY_STAFF_PERMISSIONS.find((p) => p.key === key)?.label || key;
}
