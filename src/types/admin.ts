/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, MembershipStatus } from './auth';
import { EntityDocument } from './society';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
  maxResidents: number;
  maxGuards: number;
  maxGates: number;
  maxAdmins: number;
  features: string[];
  trialDays: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
}

export interface SocietySubscription {
  id: string;
  societyId: string;
  societyName: string;
  planId: string;
  planName: string;
  billingCycle: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
  status: 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'PENDING_RENEWAL';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  amountPaid: number;
  currency: string;
  nextBillingDate: string;
}

export interface FinancialTransaction {
  id: string;
  transactionNumber: string;
  referenceId?: string; // Society ID or Partner ID
  entityName: string;
  type: 'SUBSCRIPTION' | 'PARTNER_COMMISSION' | 'REFUND' | 'SETUP_FEE';
  amount: number;
  currency: string;
  paymentMethod: 'UPI' | 'Card' | 'NetBanking' | 'Bank Transfer';
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
  paymentDate: string;
  gatewayReference: string;
  description: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  submittedByUid: string;
  submittedByName: string;
  submittedByPhone: string;
  submittedByEmail?: string;
  societyId?: string;
  societyName?: string;
  category:
    | 'Access Issue'
    | 'Billing'
    | 'Hardware/Gate'
    | 'Feature Request'
    | 'Emergency SOS'
    | 'General';
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  internalNotes?: string[];
  replies?: {
    id: string;
    senderUid: string;
    senderName: string;
    senderRole: string;
    message: string;
    timestamp: string;
  }[];
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  targetAudience:
    | 'ALL_SOCIETIES'
    | 'SELECTED_SOCIETY'
    | 'SOCIETY_ADMINS'
    | 'SECURITY_GUARDS'
    | 'RESIDENTS'
    | 'SERVICE_PARTNERS';
  selectedSocietyId?: string;
  selectedSocietyName?: string;
  deliveryStatus: 'SENT' | 'SCHEDULED' | 'FAILED' | 'DRAFT';
  scheduledAt?: string;
  sentAt: string;
  sentBy: string;
  recipientCount: number;
  priority?: 'NORMAL' | 'HIGH' | 'EMERGENCY';
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole | 'SYSTEM';
  action: string;
  targetRecordId: string;
  targetRecordType:
    | 'SOCIETY'
    | 'USER'
    | 'SUBSCRIPTION'
    | 'TRANSACTION'
    | 'SUPPORT_TICKET'
    | 'SETTINGS'
    | 'NOTIFICATION'
    | 'ROLE_PERMISSION';
  timestamp: string;
  reason?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface PlatformSettings {
  general: {
    platformName: string;
    platformLogoUrl?: string;
    supportEmail: string;
    supportPhone: string;
    defaultCountry: string;
    defaultCurrency: string;
    timeZone: string;
  };
  registration: {
    allowSocietyApplications: boolean;
    allowResidentRegistration: boolean;
    allowGuardRegistration: boolean;
    allowServicePartnerRegistration: boolean;
    requireDocumentKycForPartners: boolean;
  };
  notifications: {
    fcmConfigured: boolean;
    emailConfigured: boolean;
    smsConfigured: boolean;
    enableEmergencyBroadcast: boolean;
  };
  maintenance: {
    isMaintenanceMode: boolean;
    maintenanceMessage: string;
  };
}

export type PlatformRole =
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_SUPPORT'
  | 'PLATFORM_FINANCE'
  | 'PLATFORM_OPERATIONS'
  | 'PLATFORM_READ_ONLY';

export interface PlatformStaffMember {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: PlatformRole;
  department: 'Executive' | 'Finance' | 'Support' | 'Operations' | 'Engineering';
  status: 'ACTIVE' | 'INACTIVE';
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
}

export interface ManagedCompany {
  id: string;
  companyName: string;
  companyCode?: string;
  registrationNumber?: string;
  companyType: 'Commercial Building' | 'Corporate Campus' | 'Factory' | 'Tech Park' | 'Enterprise' | string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string;
  adminUid?: string;
  adminName?: string;
  adminLoginEmail?: string;
  adminPassword?: string;
  totalBuildings: number;
  totalOffices: number;
  totalGates?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  subscriptionPlan: string;
  subscriptionType?: string;
  subscriptionDuration?: string;
  documents?: EntityDocument[];
  registeredAt: string;
}

export type OnboardingStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTIVE';

export interface SocietyOnboardingCase {
  id: string;
  societyName: string;
  societyType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string;
  proposedAdminName: string;
  proposedAdminPhone: string;
  totalBuildings: number;
  totalFlats: number;
  selectedPlanId: string;
  selectedPlanName: string;
  status: OnboardingStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documents: { name: string; type: string; url?: string; verified: boolean }[];
  currentStep: number;
}

export interface GlobalUserRecord {
  uid: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  role: UserRole | string;
  societyId?: string;
  societyName?: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'REJECTED';
  registeredAt: string;
  lastActiveAt?: string;
}

export interface GlobalEmergencyIncident {
  id: string;
  societyId: string;
  societyName: string;
  alertType: 'Fire' | 'Medical' | 'Lift Emergency' | 'Animal Threat' | 'Visitor Threat' | 'Other';
  buildingName: string;
  flatNumber: string;
  reportedByName: string;
  reportedByPhone: string;
  alertTime: string;
  status: 'ACTIVE' | 'ESCALATED' | 'RESOLVED';
  resolvedAt?: string;
  resolvedBy?: string;
  escalationNotes?: string;
}

export interface FeatureFlagItem {
  id: string;
  moduleKey:
    | 'residentApp'
    | 'guardApp'
    | 'servicePartnerApp'
    | 'societyAdminPortal'
    | 'helpdesk'
    | 'notices'
    | 'payments'
    | 'amenities'
    | 'community'
    | 'emergencyAlerts'
    | 'serviceMarketplace';
  name: string;
  description: string;
  globallyEnabled: boolean;
  minPlanRequired: 'FREE TRIAL' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  societyOverrides?: Record<string, boolean>;
}

export interface ServiceHealthStatus {
  service: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE' | 'UNKNOWN';
  latencyMs: number;
  lastChecked: string;
  details: string;
}

export interface SuperAdminStats {
  totalSocieties: number;
  activeSocieties: number;
  pendingSocieties: number;
  suspendedSocieties: number;
  totalCompanies: number;
  totalBuildings: number;
  totalFlats: number;
  totalResidents: number;
  totalSecurityGuards: number;
  totalSocietyAdmins: number;
  totalServicePartners: number;
  pendingServicePartners: number;
  totalPlatformUsers: number;
  visitorsToday: number;
  totalServiceBookings: number;
  activeEmergencyAlerts: number;
  activeEmergencies?: number;
  mrr: number;
  arr: number;
  totalSubscriptionRevenue: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
  expiredSubscriptions: number;
  trialSubscriptions: number;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  outstandingInvoicesAmount: number;
  pendingOnboardingCases?: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  pendingSupportTickets: number;
  growthChartData: {
    month: string;
    societies: number;
    residents: number;
    guards: number;
    revenue: number;
  }[];
}

