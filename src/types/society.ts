/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EntityDocument {
  id: string;
  title: string;
  name: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  size?: number;
}

export interface Society {
  id: string;
  societyName: string;
  name?: string; // Compatibility alias
  societyCode: string;
  code?: string; // Compatibility alias
  address: string;
  city: string;
  state?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  totalTowers?: number;
  totalFlats: number;
  occupiedFlats: number;
  totalGates: number;
  activeGuards: number;
  subscriptionPlan: 'Basic' | 'Enterprise' | 'Premium 3D' | string;
  subscriptionType?: string;
  subscriptionDuration?: string;
  adminLoginEmail?: string;
  adminPassword?: string;
  documents?: EntityDocument[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  createdAt?: string;
}

export type VisitorType = 'Guest' | 'Delivery' | 'Cab' | 'Service' | 'Family';

export type GatePassStatus =
  | 'Pending'
  | 'Approved'
  | 'CheckedIn'
  | 'CheckedOut'
  | 'Rejected'
  | 'Expired';

export interface GatePass {
  id: string;
  societyId?: string;
  visitorName: string;
  visitorPhone: string;
  visitorType: VisitorType;
  vehicleNumber?: string;
  hostFlat: string;
  hostResidentName: string;
  entryGate: string;
  checkInTime?: string;
  checkOutTime?: string;
  passCode: string;
  status: GatePassStatus;
  purpose: string;
  photoUrl?: string;
  createdAt?: string;
}

export interface SecurityAlert {
  id: string;
  societyId?: string;
  type: 'Fire' | 'Medical' | 'Security Threat' | 'Gate Forced' | 'SOS';
  flatNumber?: string;
  location: string;
  reportedBy: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'critical';
  resolved: boolean;
}

export interface FacilityBooking {
  id: string;
  societyId?: string;
  facilityName: string;
  bookedBy: string;
  flatNumber: string;
  date: string;
  timeSlot: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}
