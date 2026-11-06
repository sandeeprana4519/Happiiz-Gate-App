/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VisitorCategoryType = 'Guest' | 'Delivery' | 'Service' | 'Cab' | 'Other';

export type VisitorEntryStatus = 
  | 'WAITING_APPROVAL' 
  | 'APPROVED' 
  | 'DENIED' 
  | 'INSIDE' 
  | 'CHECKED_OUT' 
  | 'TIMEOUT' 
  | 'EXPIRED';

export interface VisitorAuditAction {
  timestamp: string;
  action: 'CREATED' | 'NOTIFIED' | 'APPROVED' | 'DENIED' | 'TIMEOUT' | 'OVERRIDDEN' | 'CHECKED_IN' | 'CHECKED_OUT';
  actor: string;
  notes?: string;
}

export interface GuardVisitor {
  id: string;
  societyId: string;
  gateId: string;
  gateName: string;
  guardUid: string;
  guardName: string;
  category: VisitorCategoryType;
  status: VisitorEntryStatus;
  visitorName: string;
  visitorPhone?: string;
  building: string;
  flatNumber: string;
  photoUrl?: string;
  passCode: string; // 6-digit verification code
  qrToken?: string;
  entryAt?: string;
  exitAt?: string;
  exitGate?: string;
  exitingGuardName?: string;
  residentId?: string;
  residentName?: string;
  residentPhone?: string;
  purpose?: string;
  numberOfVisitors?: number;
  
  // Category-specific details
  deliveryCompany?: string;
  deliveryType?: 'Food' | 'Grocery' | 'E-commerce' | 'Courier' | 'Other';
  packageDescription?: string;
  
  serviceCompany?: string;
  serviceCategory?: 'Electrician' | 'Plumber' | 'Carpenter' | 'AC Technician' | 'Appliance Repair' | 'Cleaning' | 'Other';
  
  cabCompany?: 'Ola' | 'Uber' | 'Rapido' | 'InDrive' | 'Other';
  cabVehiclePlate?: string;
  cabPassengers?: number;

  isPreApproved?: boolean;
  approvalHistory: VisitorAuditAction[];
  adminOverrideReason?: string;
  createdAt: string;
}

export interface ResidentMessageToGuard {
  id: string;
  societyId: string;
  residentUid: string;
  residentName: string;
  building: string;
  flatNumber: string;
  category: 'Parking' | 'Water Supply' | 'Security' | 'Delivery' | 'General';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  guardReply?: string;
}

export interface GuardEmergencyAlert {
  id: string;
  societyId: string;
  alertType: 'Fire Alert' | 'Stuck in Lift' | 'Medical Emergency' | 'Animal Threat' | 'Visitor Threat' | 'Other Emergency';
  building: string;
  flatNumber: string;
  reportingResident: string;
  residentPhone: string;
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';
  acknowledgedByGuard?: string;
  responseNotes?: string;
  resolvedAt?: string;
}

export interface GuardResidentDirectoryItem {
  uid: string;
  fullName: string;
  phoneNumber: string;
  buildingName: string;
  flatNumber: string;
  occupantType: 'OWNER' | 'TENANT';
  intercomNumber?: string;
  emergencyContactPhone?: string;
}

export interface GuardKPIStats {
  todayTotalVisitors: number;
  visitorsInside: number;
  waitingApproval: number;
  preApprovedCount: number;
  totalCheckedOut: number;
  todayGuests: number;
  todayDeliveries: number;
  todayServices: number;
  todayCabs: number;
}

export interface GuardProfileInfo {
  uid: string;
  fullName: string;
  phoneNumber: string;
  badgeNumber: string;
  employeeId: string;
  assignedSocietyId: string;
  assignedSocietyName: string;
  assignedGateId: string;
  assignedGateName: string;
  status: 'ACTIVE' | 'INACTIVE';
  shift: 'DAY' | 'NIGHT' | 'ROTATIONAL';
  preferredLanguage: 'en' | 'hi';
  soundAlertsEnabled: boolean;
  photoURL?: string;
}
