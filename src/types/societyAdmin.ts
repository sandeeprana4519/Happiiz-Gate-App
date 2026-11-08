/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MembershipStatus, UserRole } from './auth';
import { VisitorType, GatePassStatus } from './society';

export interface SocietyBuilding {
  id: string;
  societyId: string;
  name: string; // e.g. "Tower A", "B Wing", "Block 1"
  type: 'Tower' | 'Block' | 'Wing' | 'Villa Row';
  floorsCount: number;
  totalFlats: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export type FlatOccupancyStatus = 'OCCUPIED' | 'VACANT' | 'UNDER_MAINTENANCE' | 'INACTIVE';
export type FlatType = '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'Penthouse' | 'Duplex' | 'Villa';

export interface SocietyFlat {
  id: string;
  societyId: string;
  buildingId: string;
  buildingName: string;
  flatNumber: string; // e.g. "A-704", "B-102"
  floor: number;
  flatType: FlatType;
  occupancyStatus: FlatOccupancyStatus;
  ownerUid?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  tenantUid?: string;
  tenantName?: string;
  tenantPhone?: string;
  squareFeet?: number;
  parkingSlotNumber?: string;
  intercomNumber?: string;
  updatedAt?: string;
}

export interface SocietyResidentMember {
  uid: string;
  societyId: string;
  societyName: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  photoURL?: string;
  buildingName: string;
  flatNumber: string;
  occupantType: 'OWNER' | 'TENANT';
  membershipStatus: MembershipStatus;
  joinedAt: string;
  moveInDate?: string;
  emergencyContactPhone?: string;
}

export interface SocietyHouseholdMember {
  id: string;
  societyId: string;
  flatId: string;
  flatNumber: string;
  name: string;
  relationship: 'Spouse' | 'Child' | 'Parent' | 'Relative' | 'Roommate';
  phone?: string;
  age?: number;
  isEmergencyContact?: boolean;
}

export interface SocietyVehicle {
  id: string;
  societyId: string;
  flatId: string;
  flatNumber: string;
  vehicleType: 'Car' | 'Motorcycle' | 'EV' | 'Bicycle';
  makeModel: string; // e.g. "Honda City White", "Tata Nexon EV"
  plateNumber: string; // e.g. "KA-05-MN-4421"
  parkingSlot: string;
  rfidTagId?: string;
}

export interface SocietyDomesticHelper {
  id: string;
  societyId: string;
  flatNumber: string;
  name: string;
  role: 'Maid' | 'Cook' | 'Driver' | 'Nanny' | 'Elderly Care';
  phone: string;
  passCode: string;
  workingHours: string;
  policeVerificationVerified: boolean;
  status: 'ACTIVE' | 'REVOKED';
}

export interface SocietyGate {
  id: string;
  societyId: string;
  name: string; // e.g. "Gate #1 (North Main)", "Gate #2 (East Commercial & Deliveries)"
  locationDescription: string;
  operatingStatus: 'OPEN' | 'RESTRICTED' | 'EMERGENCY_LOCKED' | 'MAINTENANCE';
  assignedGuardsCount: number;
  hasBoomBarrier: boolean;
  hasLicensePlateCamera: boolean;
  assignedGuards?: string[];
  gateType?: 'VEHICULAR' | 'PEDESTRIAN' | 'SERVICE' | 'EMERGENCY';
  rfidReaderEnabled?: boolean;
}

export interface SocietyNotice {
  id: string;
  societyId: string;
  title: string;
  content: string;
  category:
    | 'General'
    | 'Maintenance'
    | 'Meeting'
    | 'Emergency'
    | 'Water Supply'
    | 'Electricity'
    | 'Security'
    | 'Events';
  targetAudience: 'ALL' | 'OWNERS_ONLY' | 'TENANTS_ONLY' | 'TOWER_SPECIFIC';
  targetTower?: string;
  publishedBy: string;
  publishedAt: string;
  isPinned: boolean;
  isEmergencyAlert: boolean;
  attachmentUrl?: string;
  status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT';
}

export interface SocietyComplaint {
  id: string;
  complaintNumber: string;
  societyId: string;
  submittedByUid: string;
  submittedByName: string;
  submittedByPhone: string;
  flatNumber: string;
  category:
    | 'Plumbing'
    | 'Electricity'
    | 'Parking'
    | 'Lift'
    | 'Housekeeping'
    | 'Security'
    | 'Water Supply'
    | 'Other';
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  assignedStaff?: string;
  adminReply?: string;
  internalNotes?: string[];
}

export interface SocietyInvoice {
  id: string;
  invoiceNumber: string;
  societyId: string;
  flatId: string;
  flatNumber: string;
  residentName: string;
  residentPhone: string;
  category:
    | 'Monthly Maintenance'
    | 'Security Deposit'
    | 'Welfare Fund'
    | 'Parking Charges'
    | 'Late Fees'
    | 'Clubhouse Booking'
    | 'Other Charges';
  description: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'FAILED';
  paidDate?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface SocietyAmenity {
  id: string;
  societyId: string;
  name: string; // e.g. "Clubhouse Banquet Hall", "Tennis Court", "Swimming Pool", "Gymnasium"
  description: string;
  operatingHours: string;
  hourlyCharge: number;
  bookingAdvanceDays: number;
  maxCapacity: number;
  status: 'AVAILABLE' | 'UNDER_MAINTENANCE' | 'CLOSED';
  rules: string[];
}

export interface SocietyAmenityBooking {
  id: string;
  societyId: string;
  amenityId: string;
  amenityName: string;
  bookedByUid: string;
  bookedByName: string;
  flatNumber: string;
  bookingDate: string;
  timeSlot: string;
  amount: number;
  status: 'CONFIRMED' | 'PENDING_APPROVAL' | 'CANCELLED';
  createdAt: string;
}

export interface SocietyEmergencyAlert {
  id: string;
  societyId: string;
  alertType: 'Fire' | 'Stuck in Lift' | 'Animal Threat' | 'Visitor Threat' | 'Medical Emergency' | 'SOS';
  flatNumber: string;
  reportedByName: string;
  reportedByPhone: string;
  timestamp: string;
  status: 'ACTIVE' | 'RESOLVED';
  resolvedAt?: string;
  resolvedByName?: string;
  responseNotes?: string;
}

export interface SocietyCommunityPost {
  id: string;
  societyId: string;
  authorUid: string;
  authorName: string;
  authorFlat: string;
  category: 'General' | 'Recommendation' | 'Buy & Sell' | 'Event' | 'Notice';
  content: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  status: 'APPROVED' | 'REPORTED' | 'HIDDEN';
}

export interface SocietyStaffMember {
  id: string;
  societyId: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'Society Admin' | 'Society Manager' | 'Accountant' | 'Security Supervisor' | 'Maintenance Staff';
  assignedArea?: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinedAt: string;
}

export interface SocietyDetailedSettings {
  general: {
    societyName: string;
    registrationNumber: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contactPhone: string;
    contactEmail: string;
    rulesDocumentUrl?: string;
  };
  security: {
    requireVisitorApprovalForCabs: boolean;
    requireDeliveryGatePass: boolean;
    autoExpirePassHours: number;
    allowNightDeliveries: boolean;
    emergencyHotline: string;
  };
  finance: {
    maintenanceRatePerSqFt: number;
    fixedMonthlyDues: number;
    dueDayOfMonth: number;
    gracePeriodDays: number;
    lateFeePercentage: number;
    bankAccountNumber?: string;
    bankIfscCode?: string;
  };
  notifications: {
    sendSmsForVisitorArrival: boolean;
    sendPushForGatePassApproval: boolean;
    emergencySirenEnabled: boolean;
  };
}

export interface SocietyAdminAnalytics {
  totalTowers: number;
  totalFlats: number;
  totalResidents: number;
  activeOwners: number;
  activeTenants: number;
  totalSecurityGuards: number;
  totalGates: number;
  visitorsToday: number;
  visitorsInside: number;
  pendingVisitorApprovals: number;
  openComplaints: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmount: number;
  upcomingBookingsCount: number;
  activeEmergencyAlertsCount: number;
  visitorActivityChart: {
    time: string;
    visitors: number;
  }[];
  monthlyCollectionChart: {
    month: string;
    collected: number;
    pending: number;
  }[];
  visitorCategoryBreakdown: {
    name: string;
    count: number;
  }[];
}

export type SocietyAdminRole =
  | 'SOCIETY_ADMIN'
  | 'SOCIETY_MANAGER'
  | 'SECURITY_SUPERVISOR'
  | 'ACCOUNTANT'
  | 'FACILITY_MANAGER'
  | 'HELPDESK_MANAGER'
  | 'READ_ONLY_ADMIN';

export interface SocietyAuditLogEntry {
  id: string;
  societyId: string;
  actorUid: string;
  actorName: string;
  actorRole: SocietyAdminRole | string;
  actionType:
    | 'RESIDENT_APPROVED'
    | 'RESIDENT_REJECTED'
    | 'RESIDENT_SUSPENDED'
    | 'GUARD_ASSIGNED'
    | 'GUARD_DEACTIVATED'
    | 'GATE_CONFIGURED'
    | 'GATEPASS_REVOKED'
    | 'EMERGENCY_ACKNOWLEDGED'
    | 'EMERGENCY_RESOLVED'
    | 'COMPLAINT_ASSIGNED'
    | 'COMPLAINT_RESOLVED'
    | 'INVOICE_GENERATED'
    | 'PAYMENT_RECORDED'
    | 'NOTICE_PUBLISHED'
    | 'NOTICE_ARCHIVED'
    | 'AMENITY_CREATED'
    | 'AMENITY_BOOKING_APPROVED'
    | 'SERVICE_PARTNER_APPROVED'
    | 'SERVICE_PARTNER_SUSPENDED'
    | 'SETTINGS_UPDATED';
  targetRecordId?: string;
  targetDescription: string;
  timestamp: string;
  ipAddress?: string;
}

