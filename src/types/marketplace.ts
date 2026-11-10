/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ServicePricingType = 'FIXED' | 'HOURLY' | 'INSPECTION';

export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentMethod = 'UPI' | 'Cash' | 'Card' | 'Online Gateway';

export interface MarketplaceService {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  whatIsIncluded: string[];
  pricingType: ServicePricingType;
  basePrice: number;
  commissionRate: number; // Percentage (e.g., 15 for 15%)
  estimatedDuration: string; // e.g. "45 mins", "1.5 hours"
  status: 'ACTIVE' | 'INACTIVE';
  popularBadge?: boolean;
  rating?: number;
  reviewCount?: number;
  partnerCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceBooking {
  id: string;
  bookingCode: string;
  serviceId: string;
  serviceName: string;
  category: string;
  serviceImageUrl?: string;
  pricingType: ServicePricingType;
  residentUid: string;
  residentName: string;
  residentPhone: string;
  societyId: string;
  societyName: string;
  building?: string;
  flatNumber: string;
  partnerId: string;
  partnerName: string;
  partnerPhone?: string;
  partnerPhotoUrl?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // e.g. "10:00 AM - 11:30 AM"
  problemDescription: string;
  status: BookingStatus;
  baseCost: number;
  partsCost: number;
  laborCost: number;
  taxAmount: number;
  totalAmount: number;
  commissionRate: number; // e.g. 15%
  commissionAmount: number; // Platform revenue cut
  partnerEarnings: number; // Net payout = totalAmount - commissionAmount
  paymentStatus: 'PENDING' | 'PAID';
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  completionNotes?: string;
  customerRating?: number;
  customerReview?: string;
  assignedTechnicianName?: string;
  assignedTechnicianPhone?: string;
  gatePassId?: string;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
}

export interface PartnerCustomServiceRate {
  serviceId: string;
  serviceName: string;
  category: string;
  customPrice: number;
  basePrice: number;
  isOptedIn: boolean;
  customDuration?: string;
}

export interface PartnerCrmProfile {
  partnerId: string;
  partnerName: string;
  businessName: string;
  photoUrl: string;
  email: string;
  phone: string;
  joinedAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  primaryDomains: string[];
  mappedSocieties: { id: string; name: string }[];
  rating: number;
  reviewCount: number;
  totalJobsCompleted: number;
  lifetimeGmv: number;
  lifetimeCommissionPaid: number;
  lifetimeNetEarnings: number;
  servicesOffered: PartnerCustomServiceRate[];
  jobHistory: MarketplaceBooking[];
  onboardedBy?: 'super_admin' | 'society_admin' | 'self';
  serviceArea?: string;
  address?: string;
  rawPartner?: any;
}

export type CrmDateFilterType = 'ALL' | 'DAY' | 'MONTH' | 'YEAR';

export interface PartnerAnalyticsSummary {
  totalJobs: number;
  totalGmv: number;
  totalCommission: number;
  totalPayout: number;
  averageTicketSize: number;
  completionRate: number;
}
