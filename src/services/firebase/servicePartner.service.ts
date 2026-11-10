/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ServicePartnerProfile,
  PartnerJobBooking,
  PartnerTechnician,
  PartnerServiceOffering,
  PartnerEarningRecord,
  PartnerKycDocument,
  PartnerSupportTicket,
  ServicePartnerJobStatus,
} from '../../types/servicePartner';
import { GuardVisitor } from '../../types/guard';
import { syncBus } from './sync.service';
import { notificationEngine } from './notification.service';
import { logEcosystemAuditEvent } from './audit.service';

// Storage helper with fallback
function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return fallback;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

// ============================================================
// DEFAULT SEED DATA FOR SERVICE PARTNER APPLICATION
// ============================================================
const DEFAULT_PARTNER_PROFILE: ServicePartnerProfile = {
  uid: 'partner_apex_1',
  partnerId: 'sp_1',
  businessName: 'Apex Electricals & Facilities Ltd.',
  businessType: 'AGENCY',
  contactPersonName: 'Amit Patel',
  phoneNumber: '+91 98210 33881',
  email: 'service@apexfacilities.com',
  photoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60',
  businessAddress: 'Plot 42, Electronics City Phase 1',
  city: 'Bengaluru',
  state: 'Karnataka',
  pinCode: '560100',
  gstNumber: '29ABCDE1234F1Z5',
  panNumber: 'ABCDE1234F',
  verificationStatus: 'APPROVED',
  isOnline: true,
  assignedCategories: ['Electrician', 'Appliance Repair', 'AC Repair', 'Plumbing'],
  rating: 4.8,
  totalReviews: 124,
  totalCompletedJobs: 382,
  totalEarnings: 84600,
  walletBalance: 12450,
  workingHours: {
    start: '08:00 AM',
    end: '08:00 PM',
  },
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  createdAt: '2026-01-10T09:00:00Z',
};

const DEFAULT_TECHNICIANS: PartnerTechnician[] = [
  {
    id: 'tech_1',
    partnerId: 'sp_1',
    fullName: 'Ramesh Verma',
    phoneNumber: '+91 98220 11928',
    employeeId: 'APX-TC-101',
    specialization: 'Senior Electrician & Inverter Specialist',
    photoUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=60',
    isActive: true,
    assignedJobsCount: 3,
    rating: 4.9,
  },
  {
    id: 'tech_2',
    partnerId: 'sp_1',
    fullName: 'Suresh Kumar',
    phoneNumber: '+91 98330 44109',
    employeeId: 'APX-TC-102',
    specialization: 'AC Jet Cleaning & HVAC Diagnostic',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60',
    isActive: true,
    assignedJobsCount: 1,
    rating: 4.7,
  },
  {
    id: 'tech_3',
    partnerId: 'sp_1',
    fullName: 'Mohan Lal',
    phoneNumber: '+91 98190 77334',
    employeeId: 'APX-TC-103',
    specialization: 'Plumbing & Drainage Pipe Care',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=60',
    isActive: true,
    assignedJobsCount: 0,
    rating: 4.8,
  },
];

const DEFAULT_SERVICES: PartnerServiceOffering[] = [
  {
    id: 'srv_1',
    partnerId: 'sp_1',
    category: 'Electrician',
    serviceName: 'Switchboard, MCB & Short Circuit Repair',
    description: 'Diagnosis and replacement of faulty breakers, wiring spark repair, switchboard installation.',
    basePrice: 199,
    inspectionFee: 99,
    isAvailable: true,
  },
  {
    id: 'srv_2',
    partnerId: 'sp_1',
    category: 'AC Repair',
    serviceName: 'Split AC Foam & Jet Service',
    description: 'Deep high-pressure coil wash, tray cleaning, gas leakage check, and temperature calibration.',
    basePrice: 499,
    inspectionFee: 149,
    isAvailable: true,
  },
  {
    id: 'srv_3',
    partnerId: 'sp_1',
    category: 'Plumbing',
    serviceName: 'Sanitary Fittings & Tap Leakage Fix',
    description: 'Washbasin mixer repair, flush valve overhaul, angle stop-cock replacement.',
    basePrice: 249,
    inspectionFee: 99,
    isAvailable: true,
  },
  {
    id: 'srv_4',
    partnerId: 'sp_1',
    category: 'Appliance Repair',
    serviceName: 'Washing Machine & Microwave Inspection',
    description: 'Motor PCB diagnosis, spin tub alignment, magnetron repair with authentic parts warranty.',
    basePrice: 349,
    inspectionFee: 149,
    isAvailable: true,
  },
];

const DEFAULT_BOOKINGS: PartnerJobBooking[] = [
  {
    id: 'bk_srv_101',
    bookingCode: 'HPZ-SRV-901',
    partnerId: 'sp_1',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower B',
    flatNumber: 'B-704',
    residentUid: 'res_priya',
    residentName: 'Dr. Priya Varma',
    residentPhone: '+91 98201 12345',
    category: 'Electrician',
    problemDescription: 'Master bedroom main chandelier circuit tripping MCB instantly upon turning on.',
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: '02:00 PM - 03:30 PM',
    status: 'REQUESTED',
    estimatedCost: 299,
    paymentStatus: 'PENDING',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'bk_srv_102',
    bookingCode: 'HPZ-SRV-882',
    partnerId: 'sp_1',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower A',
    flatNumber: 'A-402',
    residentUid: 'res_rajesh',
    residentName: 'Rajesh Sharma',
    residentPhone: '+91 98765 43210',
    category: 'AC Repair',
    problemDescription: 'Daikin 1.5 Ton Split AC outdoor unit making heavy vibrating sound, low cooling.',
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: '04:00 PM - 05:30 PM',
    status: 'ACCEPTED',
    assignedTechnicianId: 'tech_2',
    assignedTechnicianName: 'Suresh Kumar',
    assignedTechnicianPhone: '+91 98330 44109',
    estimatedCost: 499,
    gatePassId: 'PASS-AC-8821',
    gateEntryStatus: 'PENDING',
    paymentStatus: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'bk_srv_103',
    bookingCode: 'HPZ-SRV-771',
    partnerId: 'sp_1',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower C',
    flatNumber: 'C-302',
    residentUid: 'res_vikram',
    residentName: 'Vikram Merchant',
    residentPhone: '+91 98210 88776',
    category: 'Plumbing',
    problemDescription: 'Kitchen sink drain siphon leaking beneath granite counter.',
    scheduledDate: new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10),
    scheduledTime: '11:00 AM - 12:00 PM',
    status: 'COMPLETED',
    assignedTechnicianId: 'tech_3',
    assignedTechnicianName: 'Mohan Lal',
    assignedTechnicianPhone: '+91 98190 77334',
    estimatedCost: 249,
    finalCost: 350,
    partsCost: 150,
    laborCost: 200,
    taxAmount: 0,
    startedAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    completionNotes: 'Replaced flexible trap pipe and sealed PVC joint with M-Seal.',
    gatePassId: 'PASS-PL-7710',
    gateEntryStatus: 'CHECKED_OUT',
    customerRating: 5,
    customerReview: 'Prompt arrival and very neat repair work without spilling dirty water.',
    partnerReply: 'Thank you Mr. Merchant! Happy to assist anytime.',
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    transactionId: 'TXN-UPI-98442018',
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
];

const DEFAULT_EARNINGS: PartnerEarningRecord[] = [
  {
    id: 'earn_1',
    partnerId: 'sp_1',
    bookingId: 'bk_srv_103',
    bookingCode: 'HPZ-SRV-771',
    residentName: 'Vikram Merchant',
    serviceCategory: 'Plumbing',
    grossAmount: 350,
    platformFee: 35,
    netPayout: 315,
    status: 'SETTLED',
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'earn_2',
    partnerId: 'sp_1',
    bookingId: 'bk_srv_099',
    bookingCode: 'HPZ-SRV-642',
    residentName: 'Shalini Rao',
    serviceCategory: 'Electrician',
    grossAmount: 650,
    platformFee: 65,
    netPayout: 585,
    status: 'SETTLED',
    date: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
  },
];

export const servicePartnerService = {
  // ============================================================
  // 1. PARTNER PROFILE & KYC
  // ============================================================
  async getPartnerProfile(partnerId: string = 'sp_1'): Promise<ServicePartnerProfile> {
    return getStored<ServicePartnerProfile>('hpz_partner_profile_' + partnerId, DEFAULT_PARTNER_PROFILE);
  },

  async updatePartnerProfile(partnerId: string, updates: Partial<ServicePartnerProfile>): Promise<ServicePartnerProfile> {
    const profile = await this.getPartnerProfile(partnerId);
    const updated = { ...profile, ...updates };
    setStored('hpz_partner_profile_' + partnerId, updated);
    return updated;
  },

  async toggleOnlineAvailability(partnerId: string, isOnline: boolean): Promise<boolean> {
    const profile = await this.getPartnerProfile(partnerId);
    profile.isOnline = isOnline;
    setStored('hpz_partner_profile_' + partnerId, profile);
    return isOnline;
  },

  // ============================================================
  // 2. BOOKINGS & WORK ORDERS LIFECYCLE
  // ============================================================
  async getPartnerBookings(partnerId: string = 'sp_1'): Promise<PartnerJobBooking[]> {
    return getStored<PartnerJobBooking[]>('hpz_partner_bookings_' + partnerId, DEFAULT_BOOKINGS);
  },

  async acceptBooking(
    partnerId: string,
    bookingId: string,
    assignedTechnicianId?: string
  ): Promise<PartnerJobBooking> {
    const bookings = await this.getPartnerBookings(partnerId);
    const technicians = await this.getTechnicians(partnerId);
    const selectedTech = technicians.find((t) => t.id === assignedTechnicianId) || technicians[0];
    const now = new Date().toISOString();
    let updatedBooking: PartnerJobBooking | null = null;

    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        const passCode = `${Math.floor(100000 + Math.random() * 900000)}`;
        const gatePassId = `PASS-TECH-${passCode}`;

        updatedBooking = {
          ...b,
          status: 'ACCEPTED' as ServicePartnerJobStatus,
          assignedTechnicianId: selectedTech?.id,
          assignedTechnicianName: selectedTech?.fullName,
          assignedTechnicianPhone: selectedTech?.phoneNumber,
          gatePassId,
          gateEntryStatus: 'PENDING',
        };

        // ============================================================
        // SECTION 11 GUARD APP INTEGRATION:
        // Automatically make the authorized service visit visible in Guard App
        // ============================================================
        const guardKey = 'hpz_guard_visitors_' + b.societyId;
        const guardVisitors = getStored<GuardVisitor[]>(guardKey, []);
        const guardVisitEntry: GuardVisitor = {
          id: gatePassId,
          societyId: b.societyId,
          gateId: 'gate_1',
          gateName: 'Gate A, West Corner',
          guardUid: 'system_service_portal',
          guardName: 'Authorized Service Pass',
          category: 'Service',
          status: 'APPROVED',
          visitorName: `${selectedTech ? selectedTech.fullName : 'Technician'} (${b.category})`,
          visitorPhone: selectedTech?.phoneNumber || b.residentPhone,
          building: b.building,
          flatNumber: b.flatNumber,
          passCode,
          qrToken: `QR-TECH-${passCode}`,
          isPreApproved: true,
          residentName: b.residentName,
          purpose: `${b.category} Work Order: ${b.problemDescription.slice(0, 40)}...`,
          serviceCompany: 'Apex Electricals & Facilities',
          serviceCategory: b.category as any,
          approvalHistory: [
            {
              timestamp: now,
              action: 'APPROVED',
              actor: `Partner Confirmed (${selectedTech ? selectedTech.fullName : 'Technician Assigned'})`,
              notes: `Booking Code #${b.bookingCode}`,
            },
          ],
          createdAt: now,
        };

        setStored(guardKey, [guardVisitEntry, ...guardVisitors]);

        // Cross-sync to Resident App Service Jobs store
        try {
          const resJobsKey = 'hpz_resident_service_jobs_' + b.residentUid;
          const resJobs = getStored<any[]>(resJobsKey, []);
          const syncJobs = resJobs.map((j) =>
            j.id === b.id || j.id === b.bookingCode
              ? {
                  ...j,
                  status: 'ACCEPTED',
                  partnerName: 'Apex Electricals & Facilities',
                  assignedTechnician: selectedTech?.fullName,
                  assignedTechnicianPhone: selectedTech?.phoneNumber,
                }
              : j
          );
          setStored(resJobsKey, syncJobs);
        } catch (_) {}

        // Cross-sync to Marketplace Bookings store
        try {
          const mpKey = 'hpz_marketplace_bookings';
          const mpJobs = getStored<any[]>(mpKey, []);
          const syncMp = mpJobs.map((j) =>
            j.id === b.id || j.bookingCode === b.bookingCode
              ? {
                  ...j,
                  status: 'ACCEPTED',
                  assignedTechnicianName: selectedTech?.fullName || 'Suresh Kumar',
                  assignedTechnicianPhone: selectedTech?.phoneNumber || '+91 98330 44109',
                  gatePassId,
                }
              : j
          );
          setStored(mpKey, syncMp);
        } catch (_) {}

        // Notify Resident
        notificationEngine.dispatchNotification({
          recipientUid: b.residentUid || 'usr_resident_04',
          societyId: b.societyId,
          category: 'SERVICE',
          priority: 'NORMAL',
          title: 'Service Booking Confirmed',
          body: `Work Order #${b.bookingCode} for ${b.category} accepted. Technician ${selectedTech ? selectedTech.fullName : 'assigned'} is scheduled.`,
          data: { bookingId: b.id, category: b.category, flatNumber: b.flatNumber },
        });

        // Audit & Event Broadcast
        logEcosystemAuditEvent({
          action: 'JOB_STATUS_CHANGES',
          targetId: b.id,
          targetType: 'SERVICE_BOOKING',
          societyId: b.societyId,
          changeSummary: `Service booking #${b.bookingCode} accepted by partner ${partnerId}. Tech: ${selectedTech?.fullName}`,
        });

        syncBus.broadcast(
          'SERVICE_BOOKING_ACCEPTED',
          b.societyId,
          partnerId,
          'SERVICE_PARTNER',
          updatedBooking
        );

        return updatedBooking;
      }
      return b;
    });

    setStored('hpz_partner_bookings_' + partnerId, updated);
    if (!updatedBooking) throw new Error('Booking not found');
    return updatedBooking;
  },

  async rejectBooking(partnerId: string, bookingId: string, rejectionReason: string): Promise<PartnerJobBooking> {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('A detailed rejection reason is mandatory.');
    }

    const bookings = await this.getPartnerBookings(partnerId);
    let updatedBooking: PartnerJobBooking | null = null;

    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        updatedBooking = {
          ...b,
          status: 'REJECTED' as ServicePartnerJobStatus,
          rejectionReason,
        };

        // Cross-sync to Resident App
        try {
          const resJobsKey = 'hpz_resident_service_jobs_' + b.residentUid;
          const resJobs = getStored<any[]>(resJobsKey, []);
          const syncJobs = resJobs.map((j) =>
            j.id === b.id || j.id === b.bookingCode
              ? { ...j, status: 'REJECTED', rejectionReason }
              : j
          );
          setStored(resJobsKey, syncJobs);
        } catch (_) {}

        notificationEngine.dispatchNotification({
          recipientUid: b.residentUid || 'usr_resident_04',
          societyId: b.societyId,
          category: 'SERVICE',
          priority: 'NORMAL',
          title: 'Service Request Declined',
          body: `Booking #${b.bookingCode} could not be fulfilled: ${rejectionReason}`,
        });

        logEcosystemAuditEvent({
          action: 'JOB_STATUS_CHANGES',
          targetId: b.id,
          targetType: 'SERVICE_BOOKING',
          societyId: b.societyId,
          changeSummary: `Booking #${b.bookingCode} declined by partner: ${rejectionReason}`,
        });

        syncBus.broadcast(
          'SERVICE_BOOKING_REJECTED',
          b.societyId,
          partnerId,
          'SERVICE_PARTNER',
          { bookingId: b.id, rejectionReason }
        );

        return updatedBooking;
      }
      return b;
    });

    setStored('hpz_partner_bookings_' + partnerId, updated);
    if (!updatedBooking) throw new Error('Booking not found');
    return updatedBooking;
  },

  async startJob(partnerId: string, bookingId: string): Promise<PartnerJobBooking> {
    const bookings = await this.getPartnerBookings(partnerId);
    const now = new Date().toISOString();
    let updatedBooking: PartnerJobBooking | null = null;

    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        updatedBooking = {
          ...b,
          status: 'IN_PROGRESS' as ServicePartnerJobStatus,
          startedAt: now,
        };

        // Cross-sync to Resident App
        try {
          const resJobsKey = 'hpz_resident_service_jobs_' + b.residentUid;
          const resJobs = getStored<any[]>(resJobsKey, []);
          const syncJobs = resJobs.map((j) =>
            j.id === b.id || j.id === b.bookingCode ? { ...j, status: 'IN_PROGRESS' } : j
          );
          setStored(resJobsKey, syncJobs);
        } catch (_) {}

        return updatedBooking;
      }
      return b;
    });

    setStored('hpz_partner_bookings_' + partnerId, updated);
    if (!updatedBooking) throw new Error('Booking not found');
    return updatedBooking;
  },

  async completeJob(
    partnerId: string,
    bookingId: string,
    details: {
      partsCost: number;
      laborCost: number;
      completionNotes: string;
      paymentMethod?: 'UPI' | 'Cash' | 'Card';
    }
  ): Promise<PartnerJobBooking> {
    const bookings = await this.getPartnerBookings(partnerId);
    const now = new Date().toISOString();
    let updatedBooking: PartnerJobBooking | null = null;

    const totalCost = details.partsCost + details.laborCost;
    const platformFee = Math.round(totalCost * 0.1); // 10% platform commission
    const netPayout = totalCost - platformFee;

    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        const txnId = `TXN-SRV-${Math.floor(10000000 + Math.random() * 90000000)}`;
        updatedBooking = {
          ...b,
          status: 'COMPLETED' as ServicePartnerJobStatus,
          partsCost: details.partsCost,
          laborCost: details.laborCost,
          finalCost: totalCost,
          completionNotes: details.completionNotes,
          completedAt: now,
          paymentStatus: 'PAID' as const,
          paymentMethod: details.paymentMethod || 'UPI',
          transactionId: txnId,
        };

        // Cross-sync to Resident App service jobs
        try {
          const resJobsKey = 'hpz_resident_service_jobs_' + b.residentUid;
          const resJobs = getStored<any[]>(resJobsKey, []);
          const syncJobs = resJobs.map((j) =>
            j.id === b.id || j.id === b.bookingCode
              ? {
                  ...j,
                  status: 'COMPLETED',
                  finalCost: totalCost,
                  completedAt: now,
                }
              : j
          );
          setStored(resJobsKey, syncJobs);
        } catch (_) {}

        // Cross-sync to Marketplace Bookings store
        try {
          const mpKey = 'hpz_marketplace_bookings';
          const mpJobs = getStored<any[]>(mpKey, []);
          const syncMp = mpJobs.map((j) =>
            j.id === b.id || j.bookingCode === b.bookingCode
              ? {
                  ...j,
                  status: 'COMPLETED',
                  totalAmount: totalCost,
                  commissionAmount: platformFee,
                  partnerEarnings: netPayout,
                  paymentStatus: 'PAID',
                  paymentMethod: details.paymentMethod || 'UPI',
                  transactionId: txnId,
                  completionNotes: details.completionNotes,
                  completedAt: now,
                }
              : j
          );
          setStored(mpKey, syncMp);
        } catch (_) {}

        // Create resident invoice record
        try {
          const invKey = 'hpz_resident_invoices_' + b.societyId;
          const existingInvoices = getStored<any[]>(invKey, []);
          const newInvoice = {
            id: `inv_srv_${Date.now()}`,
            invoiceNumber: `INV-SRV-${Math.floor(10000 + Math.random() * 90000)}`,
            societyId: b.societyId,
            category: 'Service',
            title: `Service Invoice: ${b.category}`,
            amount: totalCost,
            billingMonth: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            dueDate: now,
            status: 'PAID',
            paymentDate: now,
            paymentMode: details.paymentMethod || 'UPI',
            transactionRef: txnId,
            receiptUrl: '#',
          };
          setStored(invKey, [newInvoice, ...existingInvoices]);
        } catch (_) {}

        // Notify Resident
        notificationEngine.dispatchNotification({
          recipientUid: b.residentUid || 'usr_resident_04',
          societyId: b.societyId,
          category: 'SERVICE',
          priority: 'NORMAL',
          title: 'Service Work Completed',
          body: `Job #${b.bookingCode} completed. Invoice of ₹${totalCost.toLocaleString()} generated and receipt confirmed.`,
          data: { bookingId: b.id, finalCost: totalCost },
        });

        // Audit Log
        logEcosystemAuditEvent({
          action: 'JOB_STATUS_CHANGES',
          targetId: b.id,
          targetType: 'SERVICE_BOOKING',
          societyId: b.societyId,
          changeSummary: `Service job #${b.bookingCode} completed. Amount: ₹${totalCost}. Net partner payout: ₹${netPayout}`,
        });

        syncBus.broadcast(
          'SERVICE_BOOKING_COMPLETED',
          b.societyId,
          partnerId,
          'SERVICE_PARTNER',
          updatedBooking
        );

        return updatedBooking;
      }
      return b;
    });

    setStored('hpz_partner_bookings_' + partnerId, updated);

    // Record earnings transaction
    if (updatedBooking) {
      const earnings = await this.getEarnings(partnerId);
      const newEarning: PartnerEarningRecord = {
        id: `earn_${Date.now()}`,
        partnerId,
        bookingId,
        bookingCode: (updatedBooking as PartnerJobBooking).bookingCode,
        residentName: (updatedBooking as PartnerJobBooking).residentName,
        serviceCategory: (updatedBooking as PartnerJobBooking).category,
        grossAmount: totalCost,
        platformFee,
        netPayout,
        status: 'SETTLED',
        date: now,
      };
      setStored('hpz_partner_earnings_' + partnerId, [newEarning, ...earnings]);

      // Update partner totals
      const profile = await this.getPartnerProfile(partnerId);
      profile.totalCompletedJobs += 1;
      profile.totalEarnings += netPayout;
      profile.walletBalance += netPayout;
      setStored('hpz_partner_profile_' + partnerId, profile);
    }

    if (!updatedBooking) throw new Error('Booking not found');
    return updatedBooking;
  },

  // ============================================================
  // 3. TECHNICIAN & TEAM MANAGEMENT
  // ============================================================
  async getTechnicians(partnerId: string = 'sp_1'): Promise<PartnerTechnician[]> {
    return getStored<PartnerTechnician[]>('hpz_partner_technicians_' + partnerId, DEFAULT_TECHNICIANS);
  },

  async addTechnician(
    partnerId: string,
    data: {
      fullName: string;
      phoneNumber: string;
      specialization: string;
      employeeId?: string;
    }
  ): Promise<PartnerTechnician> {
    const list = await this.getTechnicians(partnerId);
    const newTech: PartnerTechnician = {
      id: `tech_${Date.now()}`,
      partnerId,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      employeeId: data.employeeId || `APX-TC-${Math.floor(100 + Math.random() * 900)}`,
      specialization: data.specialization,
      isActive: true,
      assignedJobsCount: 0,
      rating: 5.0,
    };
    const updated = [...list, newTech];
    setStored('hpz_partner_technicians_' + partnerId, updated);
    return newTech;
  },

  async toggleTechnicianStatus(partnerId: string, technicianId: string): Promise<void> {
    const list = await this.getTechnicians(partnerId);
    const updated = list.map((t) => (t.id === technicianId ? { ...t, isActive: !t.isActive } : t));
    setStored('hpz_partner_technicians_' + partnerId, updated);
  },

  // ============================================================
  // 4. SERVICE OFFERINGS & PRICING
  // ============================================================
  async getServiceOfferings(partnerId: string = 'sp_1'): Promise<PartnerServiceOffering[]> {
    return getStored<PartnerServiceOffering[]>('hpz_partner_services_' + partnerId, DEFAULT_SERVICES);
  },

  async updateServiceOffering(
    partnerId: string,
    serviceId: string,
    data: Partial<PartnerServiceOffering>
  ): Promise<void> {
    const list = await this.getServiceOfferings(partnerId);
    const updated = list.map((s) => (s.id === serviceId ? { ...s, ...data } : s));
    setStored('hpz_partner_services_' + partnerId, updated);
  },

  // ============================================================
  // 5. FINANCIAL EARNINGS & TRANSACTIONS
  // ============================================================
  async getEarnings(partnerId: string = 'sp_1'): Promise<PartnerEarningRecord[]> {
    return getStored<PartnerEarningRecord[]>('hpz_partner_earnings_' + partnerId, DEFAULT_EARNINGS);
  },

  // ============================================================
  // 6. CUSTOMER REVIEWS
  // ============================================================
  async replyToCustomerReview(partnerId: string, bookingId: string, replyText: string): Promise<void> {
    const bookings = await this.getPartnerBookings(partnerId);
    const updated = bookings.map((b) => (b.id === bookingId ? { ...b, partnerReply: replyText } : b));
    setStored('hpz_partner_bookings_' + partnerId, updated);
  },

  // ============================================================
  // 7. SUPPORT TICKETS
  // ============================================================
  async getSupportTickets(partnerId: string = 'sp_1'): Promise<PartnerSupportTicket[]> {
    return getStored<PartnerSupportTicket[]>('hpz_partner_support_' + partnerId, [
      {
        id: 'tkt_1',
        partnerId,
        topic: 'Gate Clearance',
        title: 'Gate Pass QR Scanner alignment at North Gate',
        description: 'Guard terminal North Gate took multiple attempts to read technician QR code.',
        status: 'RESOLVED',
        adminReply: 'Scanner camera lens cleaned at North Gate terminal. Clearance verified.',
        createdAt: '2026-11-01T10:00:00Z',
        updatedAt: '2026-11-02T14:00:00Z',
      },
    ]);
  },

  async createSupportTicket(
    partnerId: string,
    data: { topic: any; title: string; description: string }
  ): Promise<PartnerSupportTicket> {
    const list = await this.getSupportTickets(partnerId);
    const newTkt: PartnerSupportTicket = {
      id: `tkt_${Date.now()}`,
      partnerId,
      topic: data.topic,
      title: data.title,
      description: data.description,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newTkt, ...list];
    setStored('hpz_partner_support_' + partnerId, updated);
    return newTkt;
  },
};
