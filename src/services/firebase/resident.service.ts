/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ResidentGatePass,
  HouseholdMember,
  DailyHelpStaff,
  ResidentVehicle,
  HelpDeskComplaint,
  SocietyNoticeItem,
  ResidentInvoice,
  SocietyAmenityItem,
  AmenityBooking,
  HomeServicePartner,
  ServiceJobBooking,
  CommunityPost,
  ResidentChatMessage,
  ResidentNotification,
} from '../../types/resident';
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
// DEFAULT SEED DATA FOR RESIDENT MODULE (Flat B-704)
// ============================================================
const DEFAULT_PASSES: ResidentGatePass[] = [
  {
    id: 'pass_1',
    passCode: '829415',
    qrToken: 'QR-EMR-829415-GUEST',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower B',
    flatNumber: 'B-704',
    residentUid: 'res_priya',
    residentName: 'Dr. Priya Varma',
    visitorName: 'Karan Mehra',
    visitorPhone: '+91 98210 44921',
    category: 'Guest',
    expectedDate: new Date().toISOString().slice(0, 10),
    expectedTime: '04:30 PM',
    validUntil: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    purpose: 'Family Dinner Visit',
    numberOfVisitors: 2,
    status: 'PRE_APPROVED',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'pass_2',
    passCode: '310928',
    qrToken: 'QR-EMR-310928-DELIVERY',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower B',
    flatNumber: 'B-704',
    residentUid: 'res_priya',
    residentName: 'Dr. Priya Varma',
    visitorName: 'Sanjay Kumar (Swiggy)',
    visitorPhone: '+91 98330 11223',
    category: 'Delivery',
    companyName: 'Swiggy',
    expectedDate: new Date().toISOString().slice(0, 10),
    expectedTime: '01:15 PM',
    validUntil: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    purpose: 'Food Delivery #8812',
    numberOfVisitors: 1,
    status: 'INSIDE',
    entryAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    entryGate: 'Gate A, West Corner',
    guardName: 'Bahadur Singh',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'pass_3',
    passCode: '492014',
    qrToken: 'QR-EMR-492014-CAB',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower B',
    flatNumber: 'B-704',
    residentUid: 'res_priya',
    residentName: 'Dr. Priya Varma',
    visitorName: 'Ola Cab (MH 02 CZ 9841)',
    category: 'Cab',
    companyName: 'Ola',
    vehiclePlate: 'MH 02 CZ 9841',
    expectedDate: new Date().toISOString().slice(0, 10),
    expectedTime: '06:00 PM',
    validUntil: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    purpose: 'Airport Pick-Up',
    numberOfVisitors: 1,
    status: 'PRE_APPROVED',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
];

const DEFAULT_FAMILY: HouseholdMember[] = [
  {
    id: 'fam_1',
    residentUid: 'res_priya',
    fullName: 'Rahul Varma',
    relationship: 'Spouse',
    phoneNumber: '+91 98201 54321',
    accessAllowed: true,
    isEmergencyContact: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'fam_2',
    residentUid: 'res_priya',
    fullName: 'Aarav Varma',
    relationship: 'Child',
    phoneNumber: '+91 98201 77889',
    accessAllowed: true,
    isEmergencyContact: false,
    createdAt: '2026-02-10T10:00:00Z',
  },
];

const DEFAULT_DAILY_HELPS: DailyHelpStaff[] = [
  {
    id: 'help_1',
    residentUid: 'res_priya',
    fullName: 'Laxmi Devi',
    category: 'Maid',
    phoneNumber: '+91 98920 11442',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    passCode: '419082',
    currentStatus: 'OUTSIDE',
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  {
    id: 'help_2',
    residentUid: 'res_priya',
    fullName: 'Ramesh Yadav',
    category: 'Driver',
    phoneNumber: '+91 98110 55443',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    passCode: '772109',
    currentStatus: 'INSIDE',
    lastEntryAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  {
    id: 'help_3',
    residentUid: 'res_priya',
    fullName: 'Sunita Bai',
    category: 'Cook',
    phoneNumber: '+91 98230 44112',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    passCode: '189332',
    currentStatus: 'OUTSIDE',
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
];

const DEFAULT_VEHICLES: ResidentVehicle[] = [
  {
    id: 'veh_1',
    residentUid: 'res_priya',
    vehicleNumber: 'MH 02 DQ 4410',
    vehicleType: '4_WHEELER',
    brand: 'Mercedes-Benz',
    model: 'GLC 300',
    color: 'Polar White',
    parkingSlot: 'P-14 (Basement 1)',
    fastTagId: 'FTAG-9982-1402',
  },
  {
    id: 'veh_2',
    residentUid: 'res_priya',
    vehicleNumber: 'MH 02 EN 8820',
    vehicleType: 'EV',
    brand: 'Tata',
    model: 'Nexon EV Max',
    color: 'Daytona Grey',
    parkingSlot: 'P-15 (Basement 1)',
  },
];

const DEFAULT_COMPLAINTS: HelpDeskComplaint[] = [
  {
    id: 'comp_101',
    societyId: 'soc_emerald_heights',
    residentUid: 'res_priya',
    residentName: 'Dr. Priya Varma',
    building: 'Tower B',
    flatNumber: 'B-704',
    category: 'Plumbing',
    title: 'Low Water Pressure in Master Bathroom',
    description: 'Hot water line flow is extremely weak since yesterday morning.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    assignedTo: 'Suresh (Society Plumber)',
    adminReplies: [
      {
        id: 'rep_1',
        author: 'Society Manager',
        role: 'SOCIETY_ADMIN',
        message: 'Technician has been assigned. Will inspect today between 3 PM - 5 PM.',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
    ],
    comments: [
      {
        id: 'c1',
        author: 'Dr. Priya Varma',
        message: 'Please coordinate before arriving as I am in consultation.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'comp_102',
    societyId: 'soc_emerald_heights',
    residentUid: 'res_priya',
    residentName: 'Dr. Priya Varma',
    building: 'Tower B',
    flatNumber: 'B-704',
    category: 'Parking',
    title: 'Unauthorized Car Parked in Slot P-14',
    description: 'A black Creta was parked in my reserved slot P-14.',
    status: 'RESOLVED',
    priority: 'HIGH',
    adminReplies: [
      {
        id: 'rep_2',
        author: 'Gate Security Head',
        role: 'SECURITY_GUARD',
        message: 'Guest car contacted and moved to visitor parking slot V-08. Apologies for the inconvenience.',
        timestamp: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
  },
];

const DEFAULT_NOTICES: SocietyNoticeItem[] = [
  {
    id: 'not_1',
    societyId: 'soc_emerald_heights',
    title: 'Annual General Body Meeting (AGM) 2026',
    category: 'Meeting',
    description: 'The Annual General Body Meeting is scheduled for Sunday, 22nd Nov at 10:30 AM in the Clubhouse Banquet Hall.',
    publishedBy: 'Management Committee',
    publishedRole: 'SOCIETY_ADMIN',
    publishedAt: new Date(Date.now() - 1 * 86400 * 1000).toISOString(),
    priority: 'URGENT',
    attachmentName: 'AGM_Agenda_2026.pdf',
    likes: 42,
    likedByUids: [],
    dislikes: 1,
    comments: [
      {
        id: 'cm_1',
        residentName: 'Vikram Merchant (C-302)',
        flatNumber: 'C-302',
        message: 'Will the solar roof initiative be tabled for discussion?',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'not_2',
    societyId: 'soc_emerald_heights',
    title: 'Scheduled Water Tank Cleaning — Tower B & C',
    category: 'Water Supply',
    description: 'Overhead domestic water tanks will undergo high-pressure cleaning this Thursday from 1:00 PM to 5:00 PM. Water supply will be interrupted during this period.',
    publishedBy: 'Facility Maintenance Team',
    publishedRole: 'SOCIETY_ADMIN',
    publishedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    priority: 'HIGH',
    likes: 28,
    likedByUids: [],
    dislikes: 0,
    comments: [],
  },
];

const DEFAULT_INVOICES: ResidentInvoice[] = [
  {
    id: 'inv_101',
    invoiceNumber: 'INV-EMR-2026-11-042',
    societyId: 'soc_emerald_heights',
    residentUid: 'res_priya',
    building: 'Tower B',
    flatNumber: 'B-704',
    month: 'November',
    year: 2026,
    category: 'Maintenance',
    amount: 4200,
    lateFee: 0,
    totalAmount: 4200,
    dueDate: '2026-11-15',
    status: 'PENDING',
  },
  {
    id: 'inv_102',
    invoiceNumber: 'INV-EMR-2026-10-042',
    societyId: 'soc_emerald_heights',
    residentUid: 'res_priya',
    building: 'Tower B',
    flatNumber: 'B-704',
    month: 'October',
    year: 2026,
    category: 'Maintenance',
    amount: 4200,
    lateFee: 0,
    totalAmount: 4200,
    dueDate: '2026-10-15',
    status: 'PAID',
    paidAt: '2026-10-08T14:32:00Z',
    transactionId: 'TXN-UPI-992140281',
    paymentMethod: 'UPI',
  },
  {
    id: 'inv_103',
    invoiceNumber: 'INV-EMR-2026-09-042',
    societyId: 'soc_emerald_heights',
    residentUid: 'res_priya',
    building: 'Tower B',
    flatNumber: 'B-704',
    month: 'September',
    year: 2026,
    category: 'Maintenance',
    amount: 4200,
    lateFee: 0,
    totalAmount: 4200,
    dueDate: '2026-09-15',
    status: 'PAID',
    paidAt: '2026-09-06T11:12:00Z',
    transactionId: 'TXN-UPI-771920341',
    paymentMethod: 'UPI',
  },
];

const DEFAULT_AMENITIES: SocietyAmenityItem[] = [
  {
    id: 'amn_1',
    name: 'Clubhouse Banquet Hall',
    description: 'Spacious air-conditioned banquet hall with projector, sound system, and buffet counters.',
    photoUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500&auto=format&fit=crop&q=60',
    openingTime: '09:00 AM',
    closingTime: '11:00 PM',
    chargePerHour: 1500,
    capacity: 120,
    rules: ['No loud music after 10:00 PM', 'Catering waste must be cleared', 'No smoking'],
    availableDays: ['Everyday'],
  },
  {
    id: 'amn_2',
    name: 'Olympic Swimming Pool',
    description: 'Temperature-controlled swimming pool with dedicated kids splash area and certified lifeguard.',
    photoUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=500&auto=format&fit=crop&q=60',
    openingTime: '06:00 AM',
    closingTime: '09:00 PM',
    chargePerHour: 0,
    capacity: 30,
    rules: ['Proper nylon swimming costume mandatory', 'Shower before entering pool', 'Children under 10 must be accompanied'],
    availableDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  {
    id: 'amn_3',
    name: 'Badminton & Squash Courts',
    description: 'Synthetic rubber indoor courts with tournament-grade LED floodlighting.',
    photoUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&auto=format&fit=crop&q=60',
    openingTime: '06:00 AM',
    closingTime: '10:00 PM',
    chargePerHour: 200,
    capacity: 8,
    rules: ['Non-marking shoes mandatory', 'Maximum 1 hour booking per flat during peak hours'],
    availableDays: ['Everyday'],
  },
];

const DEFAULT_SERVICE_PARTNERS: HomeServicePartner[] = [
  {
    id: 'sp_1',
    partnerName: 'Urban Company Pro',
    category: 'Home Cleaning',
    rating: 4.8,
    reviewsCount: 142,
    startingPrice: 599,
    photoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60',
    phoneNumber: '+91 98200 11922',
    description: 'Deep kitchen, bathroom, and full apartment sanitization with industrial equipment.',
    isVerified: true,
    availableToday: true,
  },
  {
    id: 'sp_2',
    partnerName: 'Reliable Electricals',
    category: 'Electrician',
    rating: 4.9,
    reviewsCount: 88,
    startingPrice: 199,
    photoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60',
    phoneNumber: '+91 98210 33881',
    description: 'Switchboard installation, fan repair, circuit wiring, and inverter maintenance.',
    isVerified: true,
    availableToday: true,
  },
  {
    id: 'sp_3',
    partnerName: 'AquaFlow Plumbing Care',
    category: 'Plumber',
    rating: 4.7,
    reviewsCount: 110,
    startingPrice: 249,
    photoUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500&auto=format&fit=crop&q=60',
    phoneNumber: '+91 98330 44551',
    description: 'Leak detection, tap & sanitary replacement, drainage unclogging, and geyser installation.',
    isVerified: true,
    availableToday: true,
  },
  {
    id: 'sp_4',
    partnerName: 'CoolBreeze Air Conditioners',
    category: 'AC Repair',
    rating: 4.8,
    reviewsCount: 95,
    startingPrice: 499,
    photoUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&auto=format&fit=crop&q=60',
    phoneNumber: '+91 98190 66772',
    description: 'Split and window AC filter jet cleaning, gas charging, and compressor diagnostic.',
    isVerified: true,
    availableToday: true,
  },
];

const DEFAULT_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    societyId: 'soc_emerald_heights',
    authorUid: 'res_1',
    authorName: 'Anand Joshi',
    authorFlat: 'Tower A-302',
    category: 'General Discussion',
    content: 'Anyone interested in joining morning badminton sessions at the Clubhouse from 7:00 AM? We have 2 slots reserved.',
    likes: 8,
    likedByUids: [],
    comments: [
      {
        id: 'c_1',
        authorName: 'Dr. Priya Varma',
        authorFlat: 'Tower B-704',
        content: 'I would love to join on Tuesdays and Thursdays!',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'post_2',
    societyId: 'soc_emerald_heights',
    authorUid: 'res_2',
    authorName: 'Shalini Rao',
    authorFlat: 'Tower B-1102',
    category: 'Events',
    content: 'Reminder: Free Yoga & Meditation workshop by certified Isha instructor this Saturday at 6:30 AM in the amphitheatre garden. Please bring your yoga mats.',
    likes: 19,
    likedByUids: [],
    comments: [],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

const DEFAULT_NOTIFICATIONS: ResidentNotification[] = [
  {
    id: 'notif_1',
    residentUid: 'res_priya',
    type: 'VISITOR_ARRIVED',
    title: 'Visitor at Gate A',
    body: 'Sanjay Kumar (Swiggy Delivery) checked in at Gate A, West Corner.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'notif_2',
    residentUid: 'res_priya',
    type: 'PAYMENT_REMINDER',
    title: 'Society Maintenance Due',
    body: 'November maintenance invoice of ₹4,200 is due on 15th Nov.',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'notif_3',
    residentUid: 'res_priya',
    type: 'NOTICE',
    title: 'AGM 2026 Scheduled',
    body: 'Annual General Body Meeting notice posted by Society Admin.',
    timestamp: new Date(Date.now() - 1 * 86400 * 1000).toISOString(),
    isRead: true,
  },
];

export const residentService = {
  // ============================================================
  // 1. VISITOR PRE-APPROVAL & GATEPASS GENERATION
  // ============================================================
  async getResidentPasses(societyId: string, residentUid: string): Promise<ResidentGatePass[]> {
    return getStored<ResidentGatePass[]>('hpz_resident_passes_' + societyId, DEFAULT_PASSES);
  },

  async createPreApprovedVisitor(
    societyId: string,
    societyName: string,
    building: string,
    flatNumber: string,
    residentUid: string,
    residentName: string,
    data: {
      visitorName: string;
      visitorPhone?: string;
      category: any;
      expectedDate: string;
      expectedTime: string;
      purpose?: string;
      numberOfVisitors?: number;
      companyName?: string;
      vehiclePlate?: string;
      instructions?: string;
      photoUrl?: string;
    }
  ): Promise<ResidentGatePass> {
    const passes = await this.getResidentPasses(societyId, residentUid);
    const passCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    const qrToken = `QR-EMR-${passCode}-${data.category.toUpperCase()}`;
    const now = new Date().toISOString();

    const newPass: ResidentGatePass = {
      id: `pass_${Date.now()}`,
      passCode,
      qrToken,
      societyId,
      societyName,
      building,
      flatNumber,
      residentUid,
      residentName,
      visitorName: data.visitorName || `${data.category} Visitor`,
      visitorPhone: data.visitorPhone,
      category: data.category,
      expectedDate: data.expectedDate,
      expectedTime: data.expectedTime,
      validUntil: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      purpose: data.purpose || `${data.category} Visit`,
      numberOfVisitors: data.numberOfVisitors || 1,
      status: 'PRE_APPROVED',
      companyName: data.companyName,
      vehiclePlate: data.vehiclePlate,
      instructions: data.instructions,
      photoUrl: data.photoUrl,
      createdAt: now,
    };

    // Save in resident store
    const updatedPasses = [newPass, ...passes];
    setStored('hpz_resident_passes_' + societyId, updatedPasses);

    // Sync directly to Guard Terminal so guards can immediately verify this pre-approved pass
    const guardKey = 'hpz_guard_visitors_' + societyId;
    const guardVisitors = getStored<GuardVisitor[]>(guardKey, []);
    const guardEntry: GuardVisitor = {
      id: newPass.id,
      societyId,
      gateId: 'gate_1',
      gateName: 'Gate A, West Corner',
      guardUid: 'auto_system',
      guardName: 'Pre-Approved by Resident',
      category: newPass.category,
      status: 'APPROVED',
      visitorName: newPass.visitorName,
      visitorPhone: newPass.visitorPhone,
      building: newPass.building,
      flatNumber: newPass.flatNumber,
      passCode: newPass.passCode,
      qrToken: newPass.qrToken,
      isPreApproved: true,
      residentName: newPass.residentName,
      purpose: newPass.purpose,
      deliveryCompany: newPass.companyName,
      cabCompany: newPass.companyName as any,
      cabVehiclePlate: newPass.vehiclePlate,
      approvalHistory: [
        {
          timestamp: now,
          action: 'APPROVED',
          actor: `${newPass.residentName} (Pre-Approved from Resident Mobile App)`,
        },
      ],
      createdAt: now,
    };
    setStored(guardKey, [guardEntry, ...guardVisitors]);

    return newPass;
  },

  async cancelPreApprovedPass(societyId: string, passId: string): Promise<void> {
    const passes = getStored<ResidentGatePass[]>('hpz_resident_passes_' + societyId, DEFAULT_PASSES);
    const updated = passes.map((p) => (p.id === passId ? { ...p, status: 'CANCELLED' as const } : p));
    setStored('hpz_resident_passes_' + societyId, updated);

    // Also update guard roster
    const guardKey = 'hpz_guard_visitors_' + societyId;
    const guardVisitors = getStored<GuardVisitor[]>(guardKey, []);
    setStored(
      guardKey,
      guardVisitors.filter((v) => v.id !== passId)
    );
  },

  // ============================================================
  // 2. LIVE INCOMING VISITOR APPROVAL (DOORBELL CALL)
  // ============================================================
  async checkForIncomingApprovals(societyId: string, flatNumber: string): Promise<GuardVisitor | null> {
    const guardKey = 'hpz_guard_visitors_' + societyId;
    const guardVisitors = getStored<GuardVisitor[]>(guardKey, []);
    // Find any visitor waiting for approval destined for this flat
    const pending = guardVisitors.find(
      (v) =>
        v.status === 'WAITING_APPROVAL' &&
        (v.flatNumber.toLowerCase() === flatNumber.toLowerCase() ||
          v.flatNumber.toLowerCase().includes(flatNumber.toLowerCase()))
    );
    return pending || null;
  },

  async respondToIncomingApproval(
    societyId: string,
    visitorId: string,
    decision: 'ACCEPT' | 'DENY'
  ): Promise<void> {
    const guardKey = 'hpz_guard_visitors_' + societyId;
    const guardVisitors = getStored<GuardVisitor[]>(guardKey, []);
    const now = new Date().toISOString();

    const updated = guardVisitors.map((v) => {
      if (v.id === visitorId) {
        return {
          ...v,
          status: decision === 'ACCEPT' ? ('APPROVED' as const) : ('DENIED' as const),
          approvalHistory: [
            ...v.approvalHistory,
            {
              timestamp: now,
              action: decision === 'ACCEPT' ? ('APPROVED' as const) : ('DENIED' as const),
              actor: 'Resident App (Mobile Authorization Call)',
              notes: decision === 'ACCEPT' ? 'Resident accepted entry' : 'Resident denied entry',
            },
          ],
        };
      }
      return v;
    });
    setStored(guardKey, updated);
  },

  // ============================================================
  // 3. HOUSEHOLD MANAGEMENT (Family, Daily Help, Vehicles)
  // ============================================================
  async getHouseholdMembers(residentUid: string): Promise<HouseholdMember[]> {
    return getStored<HouseholdMember[]>('hpz_resident_family_' + residentUid, DEFAULT_FAMILY);
  },

  async addHouseholdMember(residentUid: string, member: Omit<HouseholdMember, 'id' | 'createdAt'>): Promise<HouseholdMember> {
    const list = await this.getHouseholdMembers(residentUid);
    const newMember: HouseholdMember = {
      ...member,
      id: `fam_${Date.now()}`,
      residentUid,
      createdAt: new Date().toISOString(),
    };
    const updated = [...list, newMember];
    setStored('hpz_resident_family_' + residentUid, updated);
    return newMember;
  },

  async deleteHouseholdMember(residentUid: string, id: string): Promise<void> {
    const list = await this.getHouseholdMembers(residentUid);
    setStored('hpz_resident_family_' + residentUid, list.filter((m) => m.id !== id));
  },

  async getDailyHelps(residentUid: string): Promise<DailyHelpStaff[]> {
    return getStored<DailyHelpStaff[]>('hpz_resident_helps_' + residentUid, DEFAULT_DAILY_HELPS);
  },

  async addDailyHelp(residentUid: string, help: Omit<DailyHelpStaff, 'id' | 'passCode' | 'currentStatus'>): Promise<DailyHelpStaff> {
    const list = await this.getDailyHelps(residentUid);
    const passCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    const newHelp: DailyHelpStaff = {
      ...help,
      id: `help_${Date.now()}`,
      residentUid,
      passCode,
      currentStatus: 'OUTSIDE',
    };
    const updated = [...list, newHelp];
    setStored('hpz_resident_helps_' + residentUid, updated);
    return newHelp;
  },

  async deleteDailyHelp(residentUid: string, id: string): Promise<void> {
    const list = await this.getDailyHelps(residentUid);
    setStored('hpz_resident_helps_' + residentUid, list.filter((h) => h.id !== id));
  },

  async getVehicles(residentUid: string): Promise<ResidentVehicle[]> {
    return getStored<ResidentVehicle[]>('hpz_resident_vehicles_' + residentUid, DEFAULT_VEHICLES);
  },

  async addVehicle(residentUid: string, vehicle: Omit<ResidentVehicle, 'id'>): Promise<ResidentVehicle> {
    const list = await this.getVehicles(residentUid);
    const newVeh: ResidentVehicle = {
      ...vehicle,
      id: `veh_${Date.now()}`,
      residentUid,
    };
    const updated = [...list, newVeh];
    setStored('hpz_resident_vehicles_' + residentUid, updated);
    return newVeh;
  },

  async deleteVehicle(residentUid: string, id: string): Promise<void> {
    const list = await this.getVehicles(residentUid);
    setStored('hpz_resident_vehicles_' + residentUid, list.filter((v) => v.id !== id));
  },

  // ============================================================
  // 4. HELPDESK & COMPLAINTS
  // ============================================================
  async getComplaints(societyId: string, residentUid: string): Promise<HelpDeskComplaint[]> {
    return getStored<HelpDeskComplaint[]>('hpz_resident_complaints_' + societyId, DEFAULT_COMPLAINTS);
  },

  async createComplaint(
    societyId: string,
    residentUid: string,
    residentName: string,
    building: string,
    flatNumber: string,
    data: {
      category: any;
      title: string;
      description: string;
      priority: any;
      photoUrls?: string[];
    }
  ): Promise<HelpDeskComplaint> {
    const list = await this.getComplaints(societyId, residentUid);
    const now = new Date().toISOString();
    const newComplaint: HelpDeskComplaint = {
      id: `comp_${Date.now()}`,
      societyId,
      residentUid,
      residentName,
      building,
      flatNumber,
      category: data.category,
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      status: 'NEW',
      photoUrls: data.photoUrls,
      adminReplies: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newComplaint, ...list];
    setStored('hpz_resident_complaints_' + societyId, updated);

    // Cross-sync to Society Admin Complaints store
    try {
      const socKey = 'hpz_soc_complaints_' + societyId;
      const socComplaints = getStored<any[]>(socKey, []);
      const newSocComplaint = {
        id: newComplaint.id,
        ticketNumber: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        societyId,
        residentUid,
        residentName,
        building,
        flatNumber,
        category: data.category,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: 'NEW',
        createdAt: now,
        updatedAt: now,
        internalNotes: [],
      };
      setStored(socKey, [newSocComplaint, ...socComplaints]);
    } catch (_) {}

    // Dispatch notification to Society Admin
    notificationEngine.dispatchNotification({
      recipientUid: `soc_admin_${societyId}`,
      societyId,
      category: 'MAINTENANCE',
      priority: data.priority === 'CRITICAL' ? 'HIGH' : 'NORMAL',
      title: 'New Resident Complaint Logged',
      body: `${residentName} (${flatNumber}) submitted: ${data.title}`,
      data: { complaintId: newComplaint.id, category: data.category },
    });

    // Audit Log
    logEcosystemAuditEvent({
      action: 'COMPLAINT_UPDATES',
      targetId: newComplaint.id,
      targetType: 'COMPLAINT',
      societyId,
      changeSummary: `New complaint filed by ${residentName} (${flatNumber}): ${data.title}`,
    });

    syncBus.broadcast(
      'COMPLAINT_CREATED',
      societyId,
      residentUid,
      'RESIDENT',
      newComplaint
    );

    return newComplaint;
  },

  async addComplaintComment(societyId: string, complaintId: string, author: string, message: string): Promise<void> {
    const list = getStored<HelpDeskComplaint[]>('hpz_resident_complaints_' + societyId, DEFAULT_COMPLAINTS);
    const updated = list.map((c) => {
      if (c.id === complaintId) {
        return {
          ...c,
          comments: [
            ...(c.comments || []),
            {
              id: `c_${Date.now()}`,
              author,
              message,
              timestamp: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setStored('hpz_resident_complaints_' + societyId, updated);
  },

  // ============================================================
  // 5. SOCIETY NOTICES
  // ============================================================
  async getNotices(societyId: string): Promise<SocietyNoticeItem[]> {
    return getStored<SocietyNoticeItem[]>('hpz_resident_notices_' + societyId, DEFAULT_NOTICES);
  },

  async toggleNoticeLike(societyId: string, noticeId: string, residentUid: string): Promise<void> {
    const list = await this.getNotices(societyId);
    const updated = list.map((n) => {
      if (n.id === noticeId) {
        const hasLiked = n.likedByUids.includes(residentUid);
        return {
          ...n,
          likes: hasLiked ? n.likes - 1 : n.likes + 1,
          likedByUids: hasLiked ? n.likedByUids.filter((u) => u !== residentUid) : [...n.likedByUids, residentUid],
        };
      }
      return n;
    });
    setStored('hpz_resident_notices_' + societyId, updated);
  },

  async addNoticeComment(societyId: string, noticeId: string, residentName: string, flatNumber: string, message: string): Promise<void> {
    const list = await this.getNotices(societyId);
    const updated = list.map((n) => {
      if (n.id === noticeId) {
        return {
          ...n,
          comments: [
            ...n.comments,
            {
              id: `nc_${Date.now()}`,
              residentName,
              flatNumber,
              message,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return n;
    });
    setStored('hpz_resident_notices_' + societyId, updated);
  },

  // ============================================================
  // 6. SOCIETY PAYMENTS & INVOICES
  // ============================================================
  async getInvoices(societyId: string, residentUid: string): Promise<ResidentInvoice[]> {
    return getStored<ResidentInvoice[]>('hpz_resident_invoices_' + societyId, DEFAULT_INVOICES);
  },

  async payInvoice(
    societyId: string,
    invoiceId: string,
    paymentMethod: 'UPI' | 'Card' | 'NetBanking'
  ): Promise<{ success: boolean; transactionId: string; receiptUrl: string }> {
    const list = getStored<ResidentInvoice[]>('hpz_resident_invoices_' + societyId, DEFAULT_INVOICES);
    const transactionId = `TXN-${paymentMethod.toUpperCase()}-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const now = new Date().toISOString();

    const updated = list.map((inv) => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'PAID' as const,
          paidAt: now,
          transactionId,
          paymentMethod,
          receiptUrl: `/receipts/${invoiceId}.pdf`,
        };
      }
      return inv;
    });

    setStored('hpz_resident_invoices_' + societyId, updated);
    return { success: true, transactionId, receiptUrl: `/receipts/${invoiceId}.pdf` };
  },

  // ============================================================
  // 7. AMENITY BOOKINGS
  // ============================================================
  async getAmenities(societyId: string): Promise<SocietyAmenityItem[]> {
    return DEFAULT_AMENITIES;
  },

  async getAmenityBookings(societyId: string, residentUid: string): Promise<AmenityBooking[]> {
    return getStored<AmenityBooking[]>('hpz_resident_bookings_' + societyId, []);
  },

  async bookAmenity(
    societyId: string,
    residentUid: string,
    residentName: string,
    flatNumber: string,
    data: {
      amenityId: string;
      amenityName: string;
      bookingDate: string;
      timeSlot: string;
      totalCharges: number;
    }
  ): Promise<AmenityBooking> {
    const bookings = await this.getAmenityBookings(societyId, residentUid);

    // Double-booking conflict check
    const conflict = bookings.find(
      (b) =>
        b.amenityId === data.amenityId &&
        b.bookingDate === data.bookingDate &&
        b.timeSlot === data.timeSlot &&
        b.status !== 'CANCELLED'
    );
    if (conflict) {
      throw new Error(`This time slot (${data.timeSlot}) is already booked by another resident.`);
    }

    const newBooking: AmenityBooking = {
      id: `bk_${Date.now()}`,
      societyId,
      residentUid,
      residentName,
      flatNumber,
      amenityId: data.amenityId,
      amenityName: data.amenityName,
      bookingDate: data.bookingDate,
      timeSlot: data.timeSlot,
      totalCharges: data.totalCharges,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    const updated = [newBooking, ...bookings];
    setStored('hpz_resident_bookings_' + societyId, updated);

    // Cross-sync to Society Admin Amenity Bookings Store
    try {
      const socKey = 'hpz_soc_amenity_bks_' + societyId;
      const socBookings = getStored<any[]>(socKey, []);
      const newSocBooking = {
        id: newBooking.id,
        amenityId: data.amenityId,
        amenityName: data.amenityName,
        societyId,
        residentUid,
        residentName,
        building: 'Tower B',
        flatNumber,
        bookingDate: data.bookingDate,
        timeSlot: data.timeSlot,
        purpose: 'Recreational Booking',
        attendeesCount: 2,
        charges: data.totalCharges,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      };
      setStored(socKey, [newSocBooking, ...socBookings]);
    } catch (_) {}

    // Dispatch notification to Society Admin
    notificationEngine.dispatchNotification({
      recipientUid: `soc_admin_${societyId}`,
      societyId,
      category: 'COMMUNITY',
      priority: 'NORMAL',
      title: 'New Amenity Booking',
      body: `${residentName} (${flatNumber}) booked ${data.amenityName} for ${data.bookingDate} (${data.timeSlot}).`,
      data: { bookingId: newBooking.id, amenityName: data.amenityName },
    });

    // Audit Log
    logEcosystemAuditEvent({
      action: 'BOOKING_CHANGES',
      targetId: newBooking.id,
      targetType: 'AMENITY_BOOKING',
      societyId,
      changeSummary: `${residentName} (${flatNumber}) booked ${data.amenityName} on ${data.bookingDate} (${data.timeSlot})`,
    });

    syncBus.broadcast(
      'AMENITY_BOOKED',
      societyId,
      residentUid,
      'RESIDENT',
      newBooking
    );

    return newBooking;
  },

  async cancelAmenityBooking(societyId: string, bookingId: string): Promise<void> {
    const bookings = getStored<AmenityBooking[]>('hpz_resident_bookings_' + societyId, []);
    const updated = bookings.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b));
    setStored('hpz_resident_bookings_' + societyId, updated);
  },

  // ============================================================
  // 8. SERVICES MARKETPLACE & BOOKINGS
  // ============================================================
  async getServicePartners(): Promise<HomeServicePartner[]> {
    return DEFAULT_SERVICE_PARTNERS;
  },

  async getServiceBookings(residentUid: string): Promise<ServiceJobBooking[]> {
    return getStored<ServiceJobBooking[]>('hpz_resident_service_jobs_' + residentUid, []);
  },

  async bookServiceJob(
    residentUid: string,
    residentName: string,
    flatNumber: string,
    data: {
      partnerId: string;
      partnerName: string;
      category: string;
      scheduledDate: string;
      scheduledTime: string;
      problemDescription: string;
      estimatedCost: number;
      photoUrls?: string[];
      societyId?: string;
    }
  ): Promise<ServiceJobBooking> {
    const list = await this.getServiceBookings(residentUid);
    const bookingCode = `HPZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newJob: ServiceJobBooking = {
      id: `job_${Date.now()}`,
      residentUid,
      residentName,
      flatNumber,
      partnerId: data.partnerId,
      partnerName: data.partnerName,
      category: data.category,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      problemDescription: data.problemDescription,
      estimatedCost: data.estimatedCost,
      status: 'REQUESTED',
      photoUrls: data.photoUrls,
      createdAt: new Date().toISOString(),
    };
    const updated = [newJob, ...list];
    setStored('hpz_resident_service_jobs_' + residentUid, updated);

    // Cross-sync to Partner App Bookings Store
    try {
      const partnerKey = 'hpz_partner_bookings_' + data.partnerId;
      const partnerBookings = getStored<any[]>(partnerKey, []);
      const partnerEntry = {
        id: newJob.id,
        bookingCode,
        partnerId: data.partnerId,
        residentUid,
        residentName,
        residentPhone: '+91 99554 43322',
        societyId: data.societyId || 'soc_emerald_heights',
        societyName: 'Emerald Heights Luxury Enclave',
        building: 'Tower B',
        flatNumber,
        category: data.category,
        problemDescription: data.problemDescription,
        preferredDate: data.scheduledDate,
        preferredTimeSlot: data.scheduledTime,
        status: 'REQUESTED',
        estimatedCost: data.estimatedCost,
        createdAt: new Date().toISOString(),
      };
      setStored(partnerKey, [partnerEntry, ...partnerBookings]);
    } catch (_) {}

    // Dispatch notification to partner
    notificationEngine.dispatchNotification({
      recipientUid: data.partnerId,
      category: 'SERVICE',
      priority: 'HIGH',
      title: 'New Service Booking Request',
      body: `${residentName} (${flatNumber}) requested ${data.category} for ${data.scheduledDate}.`,
      data: { bookingId: newJob.id, residentUid, category: data.category },
    });

    // Audit Log & Event Broadcast
    logEcosystemAuditEvent({
      action: 'BOOKING_CHANGES',
      targetId: newJob.id,
      targetType: 'SERVICE_BOOKING',
      societyId: data.societyId || 'soc_emerald_heights',
      changeSummary: `${residentName} (${flatNumber}) booked ${data.category} with ${data.partnerName}`,
    });

    syncBus.broadcast(
      'SERVICE_BOOKING_CREATED',
      data.societyId || 'soc_emerald_heights',
      residentUid,
      'RESIDENT',
      newJob
    );

    return newJob;
  },

  // ============================================================
  // 9. EMERGENCY SOS BROADCAST
  // ============================================================
  async triggerEmergencySos(
    societyId: string,
    residentUid: string,
    residentName: string,
    building: string,
    flatNumber: string,
    residentPhone: string,
    category: 'Fire Alert' | 'Stuck in Lift' | 'Medical Emergency' | 'Animal Threat' | 'Visitor Threat' | 'Other Emergency'
  ): Promise<{ alertId: string; status: string }> {
    const alertId = `emg_${Date.now()}`;
    const now = new Date().toISOString();

    // 1. Broadcast directly to Guard Terminal Emergency Store
    const guardKey = 'hpz_guard_emergencies_' + societyId;
    const currentAlerts = getStored<any[]>(guardKey, []);
    const newGuardAlert = {
      id: alertId,
      societyId,
      alertType: category,
      building,
      flatNumber,
      reportingResident: residentName,
      residentPhone,
      timestamp: now,
      status: 'ACTIVE',
      responseNotes: 'Instant SOS dispatched from Resident Mobile App.',
    };
    setStored(guardKey, [newGuardAlert, ...currentAlerts]);

    // 2. Cross-sync to Society Admin Portal Emergency Roster
    try {
      const socKey = 'hpz_soc_emergencies_' + societyId;
      const socAlerts = getStored<any[]>(socKey, []);
      const newSocAlert = {
        id: alertId,
        societyId,
        alertType: category,
        building,
        flatNumber,
        reportingResident: residentName,
        residentPhone,
        timestamp: now,
        status: 'ACTIVE',
        responseNotes: 'Active Emergency Alert triggered by resident.',
      };
      setStored(socKey, [newSocAlert, ...socAlerts]);
    } catch (_) {}

    // 3. Cross-sync to Super Admin Global Emergencies Center
    try {
      const saList = getStored<any[]>('happiiz_sa_emergencies', []);
      const newGlobalIncident = {
        id: alertId,
        societyId,
        societyName: 'Emerald Heights Luxury Enclave',
        alertType: category,
        severity: 'CRITICAL',
        building,
        flatNumber,
        reportingResident: residentName,
        residentPhone,
        status: 'ACTIVE',
        timestamp: now,
        escalationNotes: 'Dispatched to platform emergency monitoring grid.',
      };
      setStored('happiiz_sa_emergencies', [newGlobalIncident, ...saList]);
    } catch (_) {}

    // 4. Dispatch loud emergency notifications to community
    notificationEngine.broadcastToSociety(societyId, {
      category: 'EMERGENCY',
      priority: 'CRITICAL',
      title: `🚨 EMERGENCY: ${category}`,
      body: `${residentName} at ${building} (${flatNumber}) requires immediate assistance. Sentinels dispatched.`,
      data: { alertId, building, flatNumber, residentPhone },
    });

    // 5. Audit Log
    logEcosystemAuditEvent({
      action: 'EMERGENCY_RESPONSE',
      targetId: alertId,
      targetType: 'EMERGENCY_ALERT',
      societyId,
      changeSummary: `EMERGENCY SOS: ${category} triggered by ${residentName} (${building} ${flatNumber})`,
    });

    // 6. Broadcast on sync bus
    syncBus.broadcast(
      'EMERGENCY_TRIGGERED',
      societyId,
      residentUid,
      'RESIDENT',
      newGuardAlert
    );

    return { alertId, status: 'DISPATCHED_TO_SECURITY_AND_ADMIN' };
  },

  // ============================================================
  // 10. MESSAGES TO SECURITY & ADMIN
  // ============================================================
  async sendMessageToSecurity(
    societyId: string,
    residentUid: string,
    residentName: string,
    building: string,
    flatNumber: string,
    category: 'Delivery' | 'Parking' | 'Security' | 'General',
    title: string,
    message: string
  ): Promise<void> {
    const key = 'hpz_guard_messages_' + societyId;
    const current = getStored<any[]>(key, []);
    const newMsg = {
      id: `msg_${Date.now()}`,
      societyId,
      residentUid,
      residentName,
      building,
      flatNumber,
      category,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setStored(key, [newMsg, ...current]);
  },

  // ============================================================
  // 11. COMMUNITY SOCIAL FEED & POSTS
  // ============================================================
  async getCommunityPosts(societyId: string): Promise<CommunityPost[]> {
    return getStored<CommunityPost[]>('hpz_resident_posts_' + societyId, DEFAULT_POSTS);
  },

  async createCommunityPost(
    societyId: string,
    authorUid: string,
    authorName: string,
    authorFlat: string,
    category: any,
    content: string,
    imageUrl?: string
  ): Promise<CommunityPost> {
    const posts = await this.getCommunityPosts(societyId);
    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      societyId,
      authorUid,
      authorName,
      authorFlat,
      category,
      content,
      imageUrl,
      likes: 0,
      likedByUids: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newPost, ...posts];
    setStored('hpz_resident_posts_' + societyId, updated);
    return newPost;
  },

  async togglePostLike(societyId: string, postId: string, userUid: string): Promise<void> {
    const posts = await this.getCommunityPosts(societyId);
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const hasLiked = p.likedByUids.includes(userUid);
        return {
          ...p,
          likes: hasLiked ? p.likes - 1 : p.likes + 1,
          likedByUids: hasLiked ? p.likedByUids.filter((u) => u !== userUid) : [...p.likedByUids, userUid],
        };
      }
      return p;
    });
    setStored('hpz_resident_posts_' + societyId, updated);
  },

  async addPostComment(societyId: string, postId: string, authorName: string, authorFlat: string, content: string): Promise<void> {
    const posts = await this.getCommunityPosts(societyId);
    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `c_${Date.now()}`,
              authorName,
              authorFlat,
              content,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return p;
    });
    setStored('hpz_resident_posts_' + societyId, updated);
  },

  // ============================================================
  // 12. NOTIFICATIONS CENTER
  // ============================================================
  async getNotifications(residentUid: string): Promise<ResidentNotification[]> {
    return getStored<ResidentNotification[]>('hpz_resident_notifications_' + residentUid, DEFAULT_NOTIFICATIONS);
  },

  async markNotificationRead(residentUid: string, notifId: string): Promise<void> {
    const list = await this.getNotifications(residentUid);
    setStored(
      'hpz_resident_notifications_' + residentUid,
      list.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
  },

  async markAllNotificationsRead(residentUid: string): Promise<void> {
    const list = await this.getNotifications(residentUid);
    setStored(
      'hpz_resident_notifications_' + residentUid,
      list.map((n) => ({ ...n, isRead: true }))
    );
  },
};
