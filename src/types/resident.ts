/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisitorCategoryType, VisitorEntryStatus } from './guard';

// Resident Membership Status
export type ResidentMembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

// Occupant Role
export type ResidentOccupantType = 'OWNER' | 'TENANT' | 'FAMILY_MEMBER';

// Resident GatePass details
export interface ResidentGatePass {
  id: string;
  passCode: string;
  qrToken: string;
  societyId: string;
  societyName: string;
  building: string;
  flatNumber: string;
  residentUid: string;
  residentName: string;
  residentPhone?: string;
  visitorName: string;
  visitorPhone?: string;
  category: VisitorCategoryType;
  expectedDate: string;
  expectedTime: string;
  validUntil: string;
  purpose: string;
  numberOfVisitors: number;
  status: 'PRE_APPROVED' | 'WAITING' | 'INSIDE' | 'CHECKED_OUT' | 'EXPIRED' | 'CANCELLED' | 'DENIED';
  photoUrl?: string;
  companyName?: string;
  vehiclePlate?: string;
  vehicleType?: 'None' | 'Bike' | 'Car' | 'Auto' | 'E-Rickshaw' | 'Other';
  vehicleNumber?: string;
  instructions?: string;
  entryAt?: string;
  exitAt?: string;
  entryGate?: string;
  guardName?: string;
  createdAt: string;
}

// Household Family Member
export interface HouseholdMember {
  id: string;
  residentUid: string;
  fullName: string;
  relationship: 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Other';
  phoneNumber: string;
  photoUrl?: string;
  accessAllowed: boolean;
  isEmergencyContact: boolean;
  createdAt: string;
}

// Daily Help (Maid, Driver, Cook, etc.)
export interface DailyHelpStaff {
  id: string;
  residentUid: string;
  fullName: string;
  category: 'Maid' | 'Driver' | 'Cook' | 'Laundry' | 'Cleaning' | 'Tutor' | 'Car Cleaner' | 'Other';
  phoneNumber: string;
  photoUrl?: string;
  validFrom: string;
  validTo: string;
  passCode: string;
  currentStatus: 'INSIDE' | 'OUTSIDE';
  lastEntryAt?: string;
  lastExitAt?: string;
  daysActive: string[];
}

// Resident Vehicle
export interface ResidentVehicle {
  id: string;
  residentUid: string;
  vehicleNumber: string;
  vehicleType: '4_WHEELER' | '2_WHEELER' | 'EV';
  brand: string;
  model: string;
  color: string;
  parkingSlot: string;
  fastTagId?: string;
}

// HelpDesk Complaint
export type ComplaintCategory =
  | 'Plumbing'
  | 'Electricity'
  | 'Parking'
  | 'Lift'
  | 'Water Supply'
  | 'Security'
  | 'Housekeeping'
  | 'Other';

export type ComplaintStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface HelpDeskComplaint {
  id: string;
  societyId: string;
  residentUid: string;
  residentName: string;
  building: string;
  flatNumber: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  photoUrls?: string[];
  assignedTo?: string;
  adminReplies?: {
    id: string;
    author: string;
    role: string;
    message: string;
    timestamp: string;
  }[];
  comments?: {
    id: string;
    author: string;
    message: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Society Notice
export interface SocietyNoticeItem {
  id: string;
  societyId: string;
  title: string;
  category: 'General' | 'Maintenance' | 'Meeting' | 'Emergency' | 'Water Supply' | 'Electricity' | 'Security' | 'Events';
  description: string;
  publishedBy: string;
  publishedRole: string;
  publishedAt: string;
  priority: 'NORMAL' | 'URGENT' | 'HIGH';
  attachmentUrl?: string;
  attachmentName?: string;
  likes: number;
  likedByUids: string[];
  dislikes: number;
  comments: {
    id: string;
    residentName: string;
    flatNumber: string;
    message: string;
    timestamp: string;
  }[];
}

// Resident Payment Invoice
export interface ResidentInvoice {
  id: string;
  invoiceNumber: string;
  societyId: string;
  residentUid: string;
  building: string;
  flatNumber: string;
  month: string;
  year: number;
  category: 'Maintenance' | 'Security Deposit' | 'Welfare Fund' | 'Parking' | 'Clubhouse' | 'Penalty';
  amount: number;
  lateFee: number;
  totalAmount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'FAILED';
  paidAt?: string;
  transactionId?: string;
  paymentMethod?: 'UPI' | 'Card' | 'NetBanking' | 'Cash Receipt';
  receiptUrl?: string;
}

// Amenity & Amenity Booking
export interface SocietyAmenityItem {
  id: string;
  name: string;
  description: string;
  photoUrl: string;
  openingTime: string;
  closingTime: string;
  chargePerHour: number;
  rules: string[];
  capacity: number;
  availableDays: string[];
}

export interface AmenityBooking {
  id: string;
  amenityId: string;
  amenityName: string;
  societyId: string;
  residentUid: string;
  residentName: string;
  flatNumber: string;
  bookingDate: string;
  timeSlot: string;
  totalCharges: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

// Home Services Marketplace
export interface HomeServicePartner {
  id: string;
  partnerName: string;
  category:
    | 'Home Cleaning'
    | 'Appliance Repair'
    | 'Electrician'
    | 'Plumber'
    | 'Carpenter'
    | 'AC Repair'
    | 'Painting'
    | 'Pest Control'
    | 'Packers & Movers'
    | 'Home Sanitization'
    | 'Beauty Services';
  rating: number;
  reviewsCount: number;
  startingPrice: number;
  photoUrl: string;
  phoneNumber: string;
  description: string;
  isVerified: boolean;
  availableToday: boolean;
}

export interface ServiceJobBooking {
  id: string;
  partnerId: string;
  partnerName: string;
  category: string;
  residentUid: string;
  residentName: string;
  flatNumber: string;
  scheduledDate: string;
  scheduledTime: string;
  problemDescription: string;
  estimatedCost: number;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  photoUrls?: string[];
  createdAt: string;
}

// Community Social Post
export interface CommunityPost {
  id: string;
  societyId: string;
  authorUid: string;
  authorName: string;
  authorFlat: string;
  authorAvatar?: string;
  category: 'Society Updates' | 'Lost & Found' | 'Events' | 'General Discussion' | 'Recommendations';
  content: string;
  imageUrl?: string;
  likes: number;
  likedByUids: string[];
  comments: {
    id: string;
    authorName: string;
    authorFlat: string;
    content: string;
    timestamp: string;
  }[];
  createdAt: string;
}

// Resident Chat Message
export interface ResidentChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderFlat: string;
  recipientUid: string;
  recipientName: string;
  recipientFlat: string;
  messageText: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
}

// Resident In-App Notification
export interface ResidentNotification {
  id: string;
  residentUid: string;
  type:
    | 'VISITOR_ARRIVED'
    | 'VISITOR_APPROVED'
    | 'VISITOR_REJECTED'
    | 'GATEPASS_GENERATED'
    | 'SERVICE_UPDATED'
    | 'PAYMENT_REMINDER'
    | 'PAYMENT_CONFIRMATION'
    | 'HELPDESK_UPDATE'
    | 'NOTICE'
    | 'AMENITY_UPDATE'
    | 'SOS_RESPONSE';
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: any;
}
