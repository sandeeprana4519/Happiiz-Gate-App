/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PartnerVerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type ServicePartnerJobStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ServicePartnerProfile {
  uid: string;
  partnerId: string;
  businessName: string;
  businessType: 'INDIVIDUAL' | 'AGENCY';
  contactPersonName: string;
  phoneNumber: string;
  email: string;
  photoUrl?: string;
  businessAddress: string;
  city: string;
  state: string;
  pinCode: string;
  gstNumber?: string;
  panNumber?: string;
  verificationStatus: PartnerVerificationStatus;
  isOnline: boolean;
  assignedCategories: string[];
  rating: number;
  totalReviews: number;
  totalCompletedJobs: number;
  totalEarnings: number;
  walletBalance: number;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  createdAt: string;
}

export interface PartnerTechnician {
  id: string;
  partnerId: string;
  fullName: string;
  phoneNumber: string;
  employeeId: string;
  specialization: string;
  photoUrl?: string;
  isActive: boolean;
  assignedJobsCount: number;
  rating: number;
}

export interface PartnerServiceOffering {
  id: string;
  partnerId: string;
  category: string;
  serviceName: string;
  description: string;
  basePrice: number;
  inspectionFee: number;
  isAvailable: boolean;
}

export interface PartnerJobBooking {
  id: string;
  bookingCode: string;
  partnerId: string;
  societyId: string;
  societyName: string;
  building: string;
  flatNumber: string;
  residentUid: string;
  residentName: string;
  residentPhone?: string;
  category: string;
  problemDescription: string;
  scheduledDate: string;
  scheduledTime: string;
  status: ServicePartnerJobStatus;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianPhone?: string;
  estimatedCost: number;
  finalCost?: number;
  partsCost?: number;
  laborCost?: number;
  taxAmount?: number;
  rejectionReason?: string;
  completionNotes?: string;
  startedAt?: string;
  completedAt?: string;
  gatePassId?: string;
  gateEntryStatus?: 'PENDING' | 'INSIDE' | 'CHECKED_OUT';
  gateEntryAt?: string;
  gateExitAt?: string;
  customerRating?: number;
  customerReview?: string;
  partnerReply?: string;
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID';
  paymentMethod?: 'UPI' | 'Cash' | 'Card' | 'Online';
  transactionId?: string;
  createdAt: string;
}

export interface PartnerEarningRecord {
  id: string;
  partnerId: string;
  bookingId: string;
  bookingCode: string;
  residentName: string;
  serviceCategory: string;
  grossAmount: number;
  platformFee: number;
  netPayout: number;
  status: 'SETTLED' | 'PENDING';
  date: string;
}

export interface PartnerKycDocument {
  id: string;
  partnerId: string;
  documentType: 'Aadhaar' | 'PAN' | 'Business Registration' | 'Trade License';
  documentNumber: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt: string;
}

export interface PartnerSupportTicket {
  id: string;
  partnerId: string;
  topic: 'Payment Dispute' | 'Customer Issue' | 'Gate Clearance' | 'App Bug' | 'Other';
  title: string;
  description: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}
