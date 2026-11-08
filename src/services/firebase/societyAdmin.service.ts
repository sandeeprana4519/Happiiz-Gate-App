/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth } from './init';
import {
  SocietyBuilding,
  SocietyFlat,
  SocietyResidentMember,
  SocietyHouseholdMember,
  SocietyVehicle,
  SocietyDomesticHelper,
  SocietyGate,
  SocietyNotice,
  SocietyComplaint,
  SocietyInvoice,
  SocietyAmenity,
  SocietyAmenityBooking,
  SocietyEmergencyAlert,
  SocietyCommunityPost,
  SocietyStaffMember,
  SocietyDetailedSettings,
  SocietyAdminAnalytics,
  SocietyAuditLogEntry,
  SocietyAdminRole,
} from '../../types/societyAdmin';
import { GatePass } from '../../types/society';
import { MOCK_GATE_PASSES, MOCK_ALERTS, MOCK_FACILITIES } from '../mock/mockData';
import { syncBus } from './sync.service';
import { notificationEngine } from './notification.service';
import { logEcosystemAuditEvent } from './audit.service';

// Storage Helper
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

// ==========================================
// 1. DEFAULT SEED DATA
// ==========================================
const DEFAULT_BUILDINGS: SocietyBuilding[] = [
  {
    id: 'bld_tower_a',
    societyId: 'soc_emerald_heights',
    name: 'Tower A (Sunflower)',
    type: 'Tower',
    floorsCount: 14,
    totalFlats: 112,
    status: 'ACTIVE',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'bld_tower_b',
    societyId: 'soc_emerald_heights',
    name: 'Tower B (Lotus)',
    type: 'Tower',
    floorsCount: 14,
    totalFlats: 112,
    status: 'ACTIVE',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'bld_tower_c',
    societyId: 'soc_emerald_heights',
    name: 'Tower C (Orchid)',
    type: 'Tower',
    floorsCount: 12,
    totalFlats: 96,
    status: 'ACTIVE',
    createdAt: '2026-02-01T00:00:00Z',
  },
];

const DEFAULT_FLATS: SocietyFlat[] = [
  {
    id: 'flat_a_101',
    societyId: 'soc_emerald_heights',
    buildingId: 'bld_tower_a',
    buildingName: 'Tower A',
    flatNumber: 'A-101',
    floor: 1,
    flatType: '3BHK',
    occupancyStatus: 'OCCUPIED',
    ownerUid: 'usr_res_101',
    ownerName: 'Sunil Sharma',
    ownerPhone: '+91 98450 11221',
    ownerEmail: 'sunil.sharma@example.com',
    squareFeet: 1650,
    parkingSlotNumber: 'P-101',
    intercomNumber: '101',
  },
  {
    id: 'flat_b_704',
    societyId: 'soc_emerald_heights',
    buildingId: 'bld_tower_b',
    buildingName: 'Tower B',
    flatNumber: 'B-704',
    floor: 7,
    flatType: '4BHK',
    occupancyStatus: 'OCCUPIED',
    ownerUid: 'usr_resident_04',
    ownerName: 'Dr. Priya Varma',
    ownerPhone: '+919955443322',
    ownerEmail: 'priya.varma@medcenter.org',
    squareFeet: 2200,
    parkingSlotNumber: 'P-704A, P-704B',
    intercomNumber: '704',
  },
  {
    id: 'flat_a_402',
    societyId: 'soc_emerald_heights',
    buildingId: 'bld_tower_a',
    buildingName: 'Tower A',
    flatNumber: 'A-402',
    floor: 4,
    flatType: '2BHK',
    occupancyStatus: 'OCCUPIED',
    ownerName: 'Vikram Malhotra',
    ownerPhone: '+19876543210',
    tenantUid: 'usr_res_102',
    tenantName: 'Rahul Khanna',
    tenantPhone: '+91 98700 22334',
    squareFeet: 1250,
    parkingSlotNumber: 'P-402',
    intercomNumber: '402',
  },
  {
    id: 'flat_b_203',
    societyId: 'soc_emerald_heights',
    buildingId: 'bld_tower_b',
    buildingName: 'Tower B',
    flatNumber: 'B-203',
    floor: 2,
    flatType: '3BHK',
    occupancyStatus: 'VACANT',
    ownerName: 'Kavita Menon',
    ownerPhone: '+91 98223 99881',
    squareFeet: 1700,
    parkingSlotNumber: 'P-203',
    intercomNumber: '203',
  },
  {
    id: 'flat_c_501',
    societyId: 'soc_emerald_heights',
    buildingId: 'bld_tower_c',
    buildingName: 'Tower C',
    flatNumber: 'C-501',
    floor: 5,
    flatType: '3BHK',
    occupancyStatus: 'UNDER_MAINTENANCE',
    ownerName: 'Anil Agarwal',
    ownerPhone: '+91 98440 55667',
    squareFeet: 1680,
    parkingSlotNumber: 'P-501',
    intercomNumber: '501',
  },
];

const DEFAULT_RESIDENTS: SocietyResidentMember[] = [
  {
    uid: 'usr_resident_04',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    fullName: 'Dr. Priya Varma',
    phoneNumber: '+919955443322',
    email: 'priya.varma@medcenter.org',
    buildingName: 'Tower B',
    flatNumber: 'B-704',
    occupantType: 'OWNER',
    membershipStatus: 'ACTIVE',
    joinedAt: '2026-02-15T10:15:00Z',
    moveInDate: '2026-03-01',
  },
  {
    uid: 'usr_res_102',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    fullName: 'Rahul Khanna',
    phoneNumber: '+91 98700 22334',
    email: 'rahul.khanna@fintech.co',
    buildingName: 'Tower A',
    flatNumber: 'A-402',
    occupantType: 'TENANT',
    membershipStatus: 'ACTIVE',
    joinedAt: '2026-03-01T11:00:00Z',
  },
  {
    uid: 'usr_res_101',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    fullName: 'Sunil Sharma',
    phoneNumber: '+91 98450 11221',
    buildingName: 'Tower A',
    flatNumber: 'A-101',
    occupantType: 'OWNER',
    membershipStatus: 'ACTIVE',
    joinedAt: '2026-02-10T09:00:00Z',
  },
];

const DEFAULT_GATES: SocietyGate[] = [
  {
    id: 'gate_1',
    societyId: 'soc_emerald_heights',
    name: 'Gate #1 (North Main)',
    locationDescription: 'Primary vehicular entry with dual boom barrier and ANPR camera',
    operatingStatus: 'OPEN',
    assignedGuardsCount: 3,
    hasBoomBarrier: true,
    hasLicensePlateCamera: true,
    gateType: 'VEHICULAR',
    rfidReaderEnabled: true,
    assignedGuards: ['guard_1', 'dev_user_guard_919876500010', 'EMP-SEC-01', 'Bahadur Singh'],
  },
  {
    id: 'gate_2',
    societyId: 'soc_emerald_heights',
    name: 'Gate #2 (East Commercial & Deliveries)',
    locationDescription: 'Commercial trucks, e-commerce deliveries, and courier checkpoint',
    operatingStatus: 'OPEN',
    assignedGuardsCount: 2,
    hasBoomBarrier: true,
    hasLicensePlateCamera: true,
    gateType: 'SERVICE',
    rfidReaderEnabled: false,
    assignedGuards: ['guard_2', 'EMP-G-204'],
  },
  {
    id: 'gate_3',
    societyId: 'soc_emerald_heights',
    name: 'Gate #3 (South Clubhouse & Pedestrian)',
    locationDescription: 'Pedestrian turnstiles and clubhouse walking entrance',
    operatingStatus: 'OPEN',
    assignedGuardsCount: 1,
    hasBoomBarrier: false,
    hasLicensePlateCamera: false,
    gateType: 'PEDESTRIAN',
    rfidReaderEnabled: true,
    assignedGuards: ['guard_3'],
  },
];

const DEFAULT_HOUSEHOLD_MEMBERS: SocietyHouseholdMember[] = [
  {
    id: 'hh_1',
    societyId: 'soc_emerald_heights',
    flatId: 'flat_b_704',
    flatNumber: 'B-704',
    name: 'Arjun Varma',
    relationship: 'Spouse',
    phone: '+91 99554 11002',
    isEmergencyContact: true,
  },
  {
    id: 'hh_2',
    societyId: 'soc_emerald_heights',
    flatId: 'flat_b_704',
    flatNumber: 'B-704',
    name: 'Rohan Varma',
    relationship: 'Child',
    age: 12,
  },
];

const DEFAULT_VEHICLES: SocietyVehicle[] = [
  {
    id: 'veh_1',
    societyId: 'soc_emerald_heights',
    flatId: 'flat_b_704',
    flatNumber: 'B-704',
    vehicleType: 'EV',
    makeModel: 'Hyundai Ioniq 5 (Midnight Blue)',
    plateNumber: 'KA-05-MM-9011',
    parkingSlot: 'P-704A',
    rfidTagId: 'RFID-EMR-0981',
  },
  {
    id: 'veh_2',
    societyId: 'soc_emerald_heights',
    flatId: 'flat_a_402',
    flatNumber: 'A-402',
    vehicleType: 'Car',
    makeModel: 'Honda City White',
    plateNumber: 'KA-01-AB-1234',
    parkingSlot: 'P-402',
  },
];

const DEFAULT_DOMESTIC_HELPERS: SocietyDomesticHelper[] = [
  {
    id: 'hlp_1',
    societyId: 'soc_emerald_heights',
    flatNumber: 'B-704',
    name: 'Shanti Devi',
    role: 'Cook',
    phone: '+91 98450 77122',
    passCode: '4491',
    workingHours: '07:30 AM - 10:00 AM, 06:30 PM - 08:30 PM',
    policeVerificationVerified: true,
    status: 'ACTIVE',
  },
  {
    id: 'hlp_2',
    societyId: 'soc_emerald_heights',
    flatNumber: 'B-704',
    name: 'Santosh Kumar',
    role: 'Driver',
    phone: '+91 97400 33881',
    passCode: '8821',
    workingHours: '08:00 AM - 07:00 PM',
    policeVerificationVerified: true,
    status: 'ACTIVE',
  },
];

const DEFAULT_NOTICES: SocietyNotice[] = [
  {
    id: 'ntc_101',
    societyId: 'soc_emerald_heights',
    title: 'Elevator Modernization & Cable Servicing in Tower B',
    content: 'Passenger Lift #1 in Tower B will undergo preventive maintenance on Saturday, Nov 08 between 10:00 AM and 02:00 PM. Please use Service Lift #2.',
    category: 'Maintenance',
    targetAudience: 'TOWER_SPECIFIC',
    targetTower: 'Tower B',
    publishedBy: 'Rajesh Sharma (President)',
    publishedAt: '2026-11-04T09:00:00Z',
    isPinned: true,
    isEmergencyAlert: false,
    status: 'PUBLISHED',
  },
  {
    id: 'ntc_102',
    societyId: 'soc_emerald_heights',
    title: 'Annual General Meeting (AGM 2026) & Managing Committee Elections',
    content: 'Notice is hereby given that the 14th AGM will be convened at the Clubhouse Banquet Hall on Sunday, Nov 22 at 05:30 PM IST.',
    category: 'Meeting',
    targetAudience: 'ALL',
    publishedBy: 'Management Committee',
    publishedAt: '2026-11-01T10:00:00Z',
    isPinned: true,
    isEmergencyAlert: false,
    status: 'PUBLISHED',
  },
];

const DEFAULT_COMPLAINTS: SocietyComplaint[] = [
  {
    id: 'cmp_101',
    complaintNumber: 'CMP-2026-081',
    societyId: 'soc_emerald_heights',
    submittedByUid: 'usr_res_102',
    submittedByName: 'Rahul Khanna',
    submittedByPhone: '+91 98700 22334',
    flatNumber: 'A-402',
    category: 'Plumbing',
    subject: 'Minor leakage near water pressure booster valve',
    description: 'Noticeable seepage in the utility balcony pipe joint during early morning supply pressure.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    createdAt: '2026-11-04T08:15:00Z',
    updatedAt: '2026-11-05T09:30:00Z',
    assignedStaff: 'Ramesh Plumber (Maintenance Desk)',
    internalNotes: ['Inspected gasket. Replacement fitting scheduled today at 3 PM.'],
  },
  {
    id: 'cmp_102',
    complaintNumber: 'CMP-2026-082',
    societyId: 'soc_emerald_heights',
    submittedByUid: 'usr_resident_04',
    submittedByName: 'Dr. Priya Varma',
    submittedByPhone: '+919955443322',
    flatNumber: 'B-704',
    category: 'Parking',
    subject: 'Unknown visitor cab parked in private slot P-704B',
    description: 'Driver left car with hazard lights on blocking private EV charging point.',
    priority: 'HIGH',
    status: 'RESOLVED',
    createdAt: '2026-11-03T18:40:00Z',
    updatedAt: '2026-11-03T19:05:00Z',
    assignedStaff: 'Bahadur Singh (Chief Guard)',
    adminReply: 'Guard informed driver and vehicle moved to visitor bay V-12.',
  },
];

const DEFAULT_INVOICES: SocietyInvoice[] = [
  {
    id: 'inv_101',
    invoiceNumber: 'INV-2026-11-704',
    societyId: 'soc_emerald_heights',
    flatId: 'flat_b_704',
    flatNumber: 'B-704',
    residentName: 'Dr. Priya Varma',
    residentPhone: '+919955443322',
    category: 'Monthly Maintenance',
    description: 'November 2026 Society Maintenance & Sinking Fund Dues',
    amount: 5500,
    dueDate: '2026-11-15',
    status: 'PAID',
    paidDate: '2026-11-02',
    paymentMethod: 'UPI (Axis Bank)',
    receiptNumber: 'RCP-88910',
    createdAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'inv_102',
    invoiceNumber: 'INV-2026-11-402',
    societyId: 'soc_emerald_heights',
    flatId: 'flat_a_402',
    flatNumber: 'A-402',
    residentName: 'Rahul Khanna',
    residentPhone: '+91 98700 22334',
    category: 'Monthly Maintenance',
    description: 'November 2026 Maintenance Charges (2BHK)',
    amount: 3800,
    dueDate: '2026-11-15',
    status: 'PENDING',
    createdAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'inv_103',
    invoiceNumber: 'INV-2026-10-101',
    societyId: 'soc_emerald_heights',
    flatId: 'flat_a_101',
    flatNumber: 'A-101',
    residentName: 'Sunil Sharma',
    residentPhone: '+91 98450 11221',
    category: 'Parking Charges',
    description: 'Annual Reserved EV Slot Allocation & Metering',
    amount: 4200,
    dueDate: '2026-10-31',
    status: 'OVERDUE',
    createdAt: '2026-10-15T00:00:00Z',
  },
];

const DEFAULT_AMENITIES: SocietyAmenity[] = [
  {
    id: 'amn_1',
    societyId: 'soc_emerald_heights',
    name: 'Clubhouse Banquet Hall',
    description: 'Air-conditioned banquet venue with catering prep room & audio system',
    operatingHours: '09:00 AM - 11:00 PM',
    hourlyCharge: 1500,
    bookingAdvanceDays: 30,
    maxCapacity: 120,
    status: 'AVAILABLE',
    rules: ['No loud music after 10:00 PM', 'Catering waste must be cleared by midnight'],
  },
  {
    id: 'amn_2',
    societyId: 'soc_emerald_heights',
    name: 'Tennis Court #1 (Floodlit)',
    description: 'Synthetic hard court with evening LED floodlights',
    operatingHours: '06:00 AM - 09:00 PM',
    hourlyCharge: 200,
    bookingAdvanceDays: 7,
    maxCapacity: 4,
    status: 'AVAILABLE',
    rules: ['Non-marking shoes mandatory', 'Maximum 1 hour slot per flat per day'],
  },
  {
    id: 'amn_3',
    societyId: 'soc_emerald_heights',
    name: 'Olympic Swimming Pool',
    description: '25-meter temperature-regulated pool with certified lifeguard',
    operatingHours: '06:00 AM - 10:00 AM, 04:30 PM - 08:30 PM',
    hourlyCharge: 0,
    bookingAdvanceDays: 1,
    maxCapacity: 30,
    status: 'AVAILABLE',
    rules: ['Proper nylon swimwear required', 'Children under 10 must be accompanied by guardian'],
  },
];

const DEFAULT_AMENITY_BOOKINGS: SocietyAmenityBooking[] = [
  {
    id: 'bk_501',
    societyId: 'soc_emerald_heights',
    amenityId: 'amn_1',
    amenityName: 'Clubhouse Banquet Hall',
    bookedByUid: 'usr_resident_04',
    bookedByName: 'Dr. Priya Varma',
    flatNumber: 'B-704',
    bookingDate: '2026-11-08',
    timeSlot: '06:00 PM - 10:00 PM',
    amount: 6000,
    status: 'CONFIRMED',
    createdAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'bk_502',
    societyId: 'soc_emerald_heights',
    amenityId: 'amn_2',
    amenityName: 'Tennis Court #1 (Floodlit)',
    bookedByUid: 'usr_res_102',
    bookedByName: 'Rahul Khanna',
    flatNumber: 'A-402',
    bookingDate: '2026-11-06',
    timeSlot: '07:00 AM - 08:00 AM',
    amount: 200,
    status: 'CONFIRMED',
    createdAt: '2026-11-04T12:00:00Z',
  },
];

const DEFAULT_EMERGENCY_ALERTS: SocietyEmergencyAlert[] = [
  {
    id: 'emg_101',
    societyId: 'soc_emerald_heights',
    alertType: 'Stuck in Lift',
    flatNumber: 'Tower B Passenger Lift #1',
    reportedByName: 'Elevator Optical Sensor & Intercom',
    reportedByPhone: '+91 80 4000 9900',
    timestamp: '2026-11-04T14:20:00Z',
    status: 'RESOLVED',
    resolvedAt: '2026-11-04T14:35:00Z',
    resolvedByName: 'Chief Guard Bahadur Singh',
    responseNotes: 'Technician opened brake release and safely evacuated 2 passengers on 4th floor.',
  },
];

const DEFAULT_COMMUNITY_POSTS: SocietyCommunityPost[] = [
  {
    id: 'post_1',
    societyId: 'soc_emerald_heights',
    authorUid: 'usr_resident_04',
    authorName: 'Dr. Priya Varma',
    authorFlat: 'B-704',
    category: 'Event',
    content: 'Organizing Sunday Morning Kids Fun Marathon around the perimeter track at 07:00 AM. Refreshments provided by the Sports Committee!',
    timestamp: '2026-11-04T11:00:00Z',
    likesCount: 24,
    commentsCount: 6,
    isPinned: true,
    status: 'APPROVED',
  },
];

const DEFAULT_STAFF: SocietyStaffMember[] = [
  {
    id: 'stf_1',
    societyId: 'soc_emerald_heights',
    fullName: 'Rajesh Sharma',
    phone: '+919812345678',
    email: 'president@emeraldheights.org',
    role: 'Society Admin',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T09:30:00Z',
  },
  {
    id: 'stf_2',
    societyId: 'soc_emerald_heights',
    fullName: 'Venkat Raman',
    phone: '+91 98440 22119',
    role: 'Society Manager',
    assignedArea: 'Clubhouse Estate Office',
    status: 'ACTIVE',
    joinedAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'stf_3',
    societyId: 'soc_emerald_heights',
    fullName: 'Bahadur Singh',
    phone: '+919700011223',
    role: 'Security Supervisor',
    assignedArea: 'All 3 Gates',
    status: 'ACTIVE',
    joinedAt: '2026-02-10T06:00:00Z',
  },
];

const DEFAULT_AUDIT_LOGS: SocietyAuditLogEntry[] = [
  {
    id: 'aud_101',
    societyId: 'soc_emerald_heights',
    actorUid: 'usr_admin_01',
    actorName: 'Rajesh Sharma',
    actorRole: 'SOCIETY_ADMIN',
    actionType: 'RESIDENT_APPROVED',
    targetRecordId: 'usr_resident_04',
    targetDescription: 'Approved residency verification for Dr. Priya Varma (Flat B-704)',
    timestamp: '2026-11-04T09:30:00Z',
    ipAddress: '192.168.1.104',
  },
  {
    id: 'aud_102',
    societyId: 'soc_emerald_heights',
    actorUid: 'usr_supervisor_01',
    actorName: 'Bahadur Singh',
    actorRole: 'SECURITY_SUPERVISOR',
    actionType: 'GUARD_ASSIGNED',
    targetRecordId: 'grd_1',
    targetDescription: 'Assigned guard Bahadur Singh to Main Gate #1 Day Shift',
    timestamp: '2026-11-04T06:45:00Z',
    ipAddress: '192.168.1.50',
  },
  {
    id: 'aud_103',
    societyId: 'soc_emerald_heights',
    actorUid: 'usr_manager_01',
    actorName: 'Venkat Raman',
    actorRole: 'SOCIETY_MANAGER',
    actionType: 'NOTICE_PUBLISHED',
    targetRecordId: 'ntc_101',
    targetDescription: 'Published Elevator Modernization Notice for Tower B',
    timestamp: '2026-11-04T09:00:00Z',
    ipAddress: '192.168.1.102',
  },
  {
    id: 'aud_104',
    societyId: 'soc_emerald_heights',
    actorUid: 'usr_accountant_01',
    actorName: 'Accounts Desk',
    actorRole: 'ACCOUNTANT',
    actionType: 'PAYMENT_RECORDED',
    targetRecordId: 'inv_101',
    targetDescription: 'Recorded UPI payment confirmation of ₹5,500 for Flat B-704 (Receipt RCP-88910)',
    timestamp: '2026-11-02T14:10:00Z',
    ipAddress: '192.168.1.108',
  },
  {
    id: 'aud_105',
    societyId: 'soc_emerald_heights',
    actorUid: 'usr_admin_01',
    actorName: 'Rajesh Sharma',
    actorRole: 'SOCIETY_ADMIN',
    actionType: 'EMERGENCY_RESOLVED',
    targetRecordId: 'emg_101',
    targetDescription: 'Resolved lift entrapment incident in Tower B Lift #1. Passengers safely evacuated.',
    timestamp: '2026-11-04T14:35:00Z',
    ipAddress: '192.168.1.104',
  },
  {
    id: 'aud_106',
    societyId: 'soc_emerald_heights',
    actorUid: 'usr_admin_01',
    actorName: 'Rajesh Sharma',
    actorRole: 'SOCIETY_ADMIN',
    actionType: 'GATEPASS_REVOKED',
    targetRecordId: 'pass_mock_99',
    targetDescription: 'Revoked entry pass for Delivery Agent: Unverified parcel credentials reported by resident',
    timestamp: '2026-11-05T16:20:00Z',
    ipAddress: '192.168.1.104',
  },
];

const DEFAULT_SOCIETY_SETTINGS: SocietyDetailedSettings = {
  general: {
    societyName: 'Emerald Heights Luxury Enclave',
    registrationNumber: 'DR/BLR/SOC-4491/2018',
    address: 'Sarjapur Main Road, Bellandur Corridor',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    contactPhone: '+91 80 4000 9900',
    contactEmail: 'admin@emeraldheights.org',
  },
  security: {
    requireVisitorApprovalForCabs: true,
    requireDeliveryGatePass: true,
    autoExpirePassHours: 4,
    allowNightDeliveries: false,
    emergencyHotline: '+91 80 4000 9911',
  },
  finance: {
    maintenanceRatePerSqFt: 3.5,
    fixedMonthlyDues: 3500,
    dueDayOfMonth: 10,
    gracePeriodDays: 5,
    lateFeePercentage: 2,
    bankAccountNumber: '918020038891002',
    bankIfscCode: 'UTIB0001244',
  },
  notifications: {
    sendSmsForVisitorArrival: true,
    sendPushForGatePassApproval: true,
    emergencySirenEnabled: true,
  },
};

// ==========================================
// 2. ANALYTICS & KPIS
// ==========================================
export async function getSocietyAdminAnalytics(societyId: string): Promise<SocietyAdminAnalytics> {
  const buildings = await getSocietyBuildings(societyId);
  const flats = await getSocietyFlats(societyId);
  const residents = await getSocietyResidents(societyId);
  const gates = await getSocietyGates(societyId);
  const visitors = await getSocietyVisitors(societyId);
  const complaints = await getSocietyComplaints(societyId);
  const invoices = await getSocietyInvoices(societyId);
  const bookings = await getSocietyAmenityBookings(societyId);
  const alerts = await getSocietyEmergencyAlerts(societyId);

  const activeOwners = residents.filter((r) => r.occupantType === 'OWNER').length;
  const activeTenants = residents.filter((r) => r.occupantType === 'TENANT').length;
  const visitorsToday = visitors.length;
  const visitorsInside = visitors.filter((v) => v.status === 'CheckedIn').length;
  const pendingVisitorApprovals = visitors.filter((v) => v.status === 'Pending').length;
  const openComplaints = complaints.filter((c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length;

  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
  const pendingInvoicesAmount = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);

  const upcomingBookingsCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const activeEmergencyAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  const visitorActivityChart = [
    { time: '08:00 AM', visitors: 14 },
    { time: '10:00 AM', visitors: 28 },
    { time: '12:00 PM', visitors: 35 },
    { time: '02:00 PM', visitors: 19 },
    { time: '04:00 PM', visitors: 32 },
    { time: '06:00 PM', visitors: 48 },
    { time: '08:00 PM', visitors: 22 },
  ];

  const monthlyCollectionChart = [
    { month: 'Jul', collected: 210000, pending: 15000 },
    { month: 'Aug', collected: 225000, pending: 12000 },
    { month: 'Sep', collected: 228000, pending: 9500 },
    { month: 'Oct', collected: 232000, pending: 8000 },
    { month: 'Nov', collected: 198000, pending: pendingInvoicesAmount || 25000 },
  ];

  const visitorCategoryBreakdown = [
    { name: 'Delivery', count: 48 },
    { name: 'Cab', count: 32 },
    { name: 'Guest', count: 24 },
    { name: 'Service', count: 18 },
  ];

  return {
    totalTowers: buildings.length,
    totalFlats: flats.length || 320,
    totalResidents: residents.length || 450,
    activeOwners: activeOwners || 280,
    activeTenants: activeTenants || 170,
    totalSecurityGuards: 8,
    totalGates: gates.length,
    visitorsToday,
    visitorsInside,
    pendingVisitorApprovals,
    openComplaints,
    pendingInvoicesCount: pendingInvoices.length,
    pendingInvoicesAmount,
    upcomingBookingsCount,
    activeEmergencyAlertsCount,
    visitorActivityChart,
    monthlyCollectionChart,
    visitorCategoryBreakdown,
  };
}

// ==========================================
// 3. BUILDINGS
// ==========================================
export async function getSocietyBuildings(societyId: string): Promise<SocietyBuilding[]> {
  const local = getStored<SocietyBuilding[]>('hpz_soc_bld_' + societyId, DEFAULT_BUILDINGS);
  return local.filter((b) => b.societyId === societyId || !b.societyId);
}

export async function addSocietyBuilding(
  societyId: string,
  name: string,
  type: SocietyBuilding['type'],
  floorsCount: number,
  totalFlats: number
): Promise<SocietyBuilding> {
  const list = await getSocietyBuildings(societyId);
  const newBld: SocietyBuilding = {
    id: `bld_${Date.now()}`,
    societyId,
    name,
    type,
    floorsCount,
    totalFlats,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  setStored('hpz_soc_bld_' + societyId, [...list, newBld]);
  return newBld;
}

// ==========================================
// 4. FLATS
// ==========================================
export async function getSocietyFlats(societyId: string): Promise<SocietyFlat[]> {
  const local = getStored<SocietyFlat[]>('hpz_soc_flats_' + societyId, DEFAULT_FLATS);
  return local.filter((f) => f.societyId === societyId || !f.societyId);
}

export async function addSocietyFlat(societyId: string, flat: Partial<SocietyFlat>): Promise<SocietyFlat> {
  const list = await getSocietyFlats(societyId);
  const newFlat: SocietyFlat = {
    id: `flat_${Date.now()}`,
    societyId,
    buildingId: flat.buildingId || 'bld_tower_a',
    buildingName: flat.buildingName || 'Tower A',
    flatNumber: flat.flatNumber || 'A-101',
    floor: flat.floor || 1,
    flatType: flat.flatType || '3BHK',
    occupancyStatus: flat.occupancyStatus || 'OCCUPIED',
    ownerName: flat.ownerName,
    ownerPhone: flat.ownerPhone,
    ownerEmail: flat.ownerEmail,
    tenantName: flat.tenantName,
    tenantPhone: flat.tenantPhone,
    squareFeet: flat.squareFeet || 1500,
    parkingSlotNumber: flat.parkingSlotNumber || 'P-01',
    intercomNumber: flat.intercomNumber || flat.flatNumber,
  };

  setStored('hpz_soc_flats_' + societyId, [...list, newFlat]);
  return newFlat;
}

export async function updateSocietyFlat(
  societyId: string,
  flatId: string,
  updates: Partial<SocietyFlat>
): Promise<boolean> {
  const list = await getSocietyFlats(societyId);
  const updated = list.map((f) => (f.id === flatId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f));
  setStored('hpz_soc_flats_' + societyId, updated);
  return true;
}

// ==========================================
// 5. RESIDENTS
// ==========================================
export async function getSocietyResidents(societyId: string): Promise<SocietyResidentMember[]> {
  const local = getStored<SocietyResidentMember[]>('hpz_soc_residents_' + societyId, DEFAULT_RESIDENTS);
  return local.filter((r) => r.societyId === societyId || !r.societyId);
}

export async function updateResidentMembershipStatus(
  societyId: string,
  uid: string,
  newStatus: SocietyResidentMember['membershipStatus']
): Promise<boolean> {
  const list = await getSocietyResidents(societyId);
  const updated = list.map((r) => (r.uid === uid ? { ...r, membershipStatus: newStatus } : r));
  setStored('hpz_soc_residents_' + societyId, updated);
  return true;
}

// ==========================================
// 6. HOUSEHOLD, VEHICLES & HELPERS
// ==========================================
export async function getSocietyHouseholdMembers(societyId: string): Promise<SocietyHouseholdMember[]> {
  return getStored<SocietyHouseholdMember[]>('hpz_soc_hh_' + societyId, DEFAULT_HOUSEHOLD_MEMBERS);
}

export async function addHouseholdMember(
  societyId: string,
  member: Omit<SocietyHouseholdMember, 'id' | 'societyId'>
): Promise<SocietyHouseholdMember> {
  const list = await getSocietyHouseholdMembers(societyId);
  const newMember: SocietyHouseholdMember = {
    ...member,
    id: `hh_${Date.now()}`,
    societyId,
  };
  setStored('hpz_soc_hh_' + societyId, [...list, newMember]);
  return newMember;
}

export async function getSocietyVehicles(societyId: string): Promise<SocietyVehicle[]> {
  return getStored<SocietyVehicle[]>('hpz_soc_veh_' + societyId, DEFAULT_VEHICLES);
}

export async function addSocietyVehicle(
  societyId: string,
  veh: Omit<SocietyVehicle, 'id' | 'societyId'>
): Promise<SocietyVehicle> {
  const list = await getSocietyVehicles(societyId);
  const newVeh: SocietyVehicle = {
    ...veh,
    id: `veh_${Date.now()}`,
    societyId,
  };
  setStored('hpz_soc_veh_' + societyId, [...list, newVeh]);
  return newVeh;
}

export async function getSocietyDomesticHelpers(societyId: string): Promise<SocietyDomesticHelper[]> {
  return getStored<SocietyDomesticHelper[]>('hpz_soc_hlp_' + societyId, DEFAULT_DOMESTIC_HELPERS);
}

export async function addDomesticHelper(
  societyId: string,
  helper: Omit<SocietyDomesticHelper, 'id' | 'societyId'>
): Promise<SocietyDomesticHelper> {
  const list = await getSocietyDomesticHelpers(societyId);
  const newHelper: SocietyDomesticHelper = {
    ...helper,
    id: `hlp_${Date.now()}`,
    societyId,
  };
  setStored('hpz_soc_hlp_' + societyId, [...list, newHelper]);
  return newHelper;
}

export async function revokeDomesticHelper(societyId: string, helperId: string): Promise<boolean> {
  const list = await getSocietyDomesticHelpers(societyId);
  const updated = list.map((h) => (h.id === helperId ? { ...h, status: 'REVOKED' as const } : h));
  setStored('hpz_soc_hlp_' + societyId, updated);
  return true;
}

// ==========================================
// 7. GATES
// ==========================================
export async function getSocietyGates(societyId: string): Promise<SocietyGate[]> {
  try {
    if (db) {
      const gatesRef = collection(db, 'societies', societyId, 'gates');
      const snap = await getDocs(gatesRef);
      if (!snap.empty) {
        const firestoreGates = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            societyId: d.societyId || societyId,
            name: d.name || 'Gate Terminal',
            locationDescription: d.locationDescription || d.location || '',
            operatingStatus: d.operatingStatus || d.status || 'OPEN',
            assignedGuardsCount: d.assignedGuardsCount || (Array.isArray(d.assignedGuards) ? d.assignedGuards.length : 2),
            hasBoomBarrier: Boolean(d.hasBoomBarrier),
            hasLicensePlateCamera: Boolean(d.hasLicensePlateCamera || d.anprEnabled),
            assignedGuards: d.assignedGuards || [],
            gateType: d.gateType || 'VEHICULAR',
            rfidReaderEnabled: Boolean(d.rfidReaderEnabled),
          } as SocietyGate;
        });
        setStored('hpz_soc_gates_' + societyId, firestoreGates);
        return firestoreGates;
      }
    }
  } catch (err) {
    console.warn('[Firestore] getSocietyGates query error, falling back to local:', err);
  }
  return getStored<SocietyGate[]>('hpz_soc_gates_' + societyId, DEFAULT_GATES);
}

export async function addSocietyGate(
  societyId: string,
  name: string,
  locationDescription: string,
  hasBoomBarrier: boolean,
  hasLicensePlateCamera: boolean,
  gateType: 'VEHICULAR' | 'PEDESTRIAN' | 'SERVICE' | 'EMERGENCY' = 'VEHICULAR'
): Promise<SocietyGate> {
  const newId = `gate_${Date.now()}`;
  const newGate: SocietyGate = {
    id: newId,
    societyId,
    name,
    locationDescription,
    operatingStatus: 'OPEN',
    assignedGuardsCount: 2,
    hasBoomBarrier,
    hasLicensePlateCamera,
    gateType,
    rfidReaderEnabled: hasBoomBarrier,
    assignedGuards: [],
  };

  try {
    if (db) {
      const gateDocRef = doc(db, 'societies', societyId, 'gates', newId);
      await setDoc(gateDocRef, newGate);
    }
  } catch (err) {
    console.warn('[Firestore] addSocietyGate setDoc error:', err);
  }

  const list = await getSocietyGates(societyId);
  setStored('hpz_soc_gates_' + societyId, [...list, newGate]);
  return newGate;
}

// ==========================================
// 8. VISITORS & PRE-APPROVALS
// ==========================================
export async function getSocietyVisitors(societyId: string): Promise<GatePass[]> {
  const local = getStored<GatePass[]>('hpz_soc_visitors_' + societyId, MOCK_GATE_PASSES);
  return local.filter((v) => v.societyId === societyId || !v.societyId);
}

export async function checkoutSocietyVisitor(societyId: string, passId: string): Promise<boolean> {
  const list = await getSocietyVisitors(societyId);
  const updated = list.map((v) =>
    v.id === passId ? { ...v, status: 'CheckedOut' as const, checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : v
  );
  setStored('hpz_soc_visitors_' + societyId, updated);
  return true;
}

// ==========================================
// 9. NOTICES
// ==========================================
export async function getSocietyNotices(societyId: string): Promise<SocietyNotice[]> {
  return getStored<SocietyNotice[]>('hpz_soc_notices_' + societyId, DEFAULT_NOTICES);
}

export async function createSocietyNotice(
  societyId: string,
  notice: Omit<SocietyNotice, 'id' | 'societyId' | 'publishedAt'>
): Promise<SocietyNotice> {
  const list = await getSocietyNotices(societyId);
  const now = new Date().toISOString();
  const newNotice: SocietyNotice = {
    ...notice,
    id: `ntc_${Date.now()}`,
    societyId,
    publishedAt: now,
  };
  setStored('hpz_soc_notices_' + societyId, [newNotice, ...list]);

  // Cross-sync to Resident Notices
  try {
    const resKey = 'hpz_resident_notices_' + societyId;
    const resNotices = getStored<any[]>(resKey, []);
    const newResNotice = {
      id: newNotice.id,
      societyId,
      title: newNotice.title,
      content: newNotice.content,
      category: newNotice.category || 'General',
      priority: (newNotice as any).priority || (newNotice.isEmergencyAlert ? 'URGENT' : 'NORMAL'),
      publishedAt: now,
      authorName: (newNotice as any).authorName || newNotice.publishedBy || 'Society Administration',
      authorRole: 'SOCIETY_ADMIN',
      likes: 0,
      likedByUids: [],
      comments: [],
      attachmentUrls: newNotice.attachmentUrl ? [newNotice.attachmentUrl] : [],
      expiryDate: (newNotice as any).expiresAt || undefined,
    };
    setStored(resKey, [newResNotice, ...resNotices]);
  } catch (_) {}

  // Dispatch community notification
  notificationEngine.broadcastToSociety(societyId, {
    category: 'COMMUNITY',
    priority: newNotice.isEmergencyAlert || (newNotice as any).priority === 'URGENT' ? 'HIGH' : 'NORMAL',
    title: `Notice: ${newNotice.title}`,
    body: newNotice.content.slice(0, 100),
  });

  // Audit Log
  logEcosystemAuditEvent({
    action: 'ADMIN_ACTIONS',
    targetId: newNotice.id,
    targetType: 'NOTICE',
    societyId,
    changeSummary: `Notice published: "${newNotice.title}" [Pinned: ${newNotice.isPinned ? 'Yes' : 'No'}]`,
  });

  syncBus.broadcast(
    'NOTICE_PUBLISHED',
    societyId,
    auth?.currentUser?.uid || 'admin',
    'SOCIETY_ADMIN',
    newNotice
  );

  return newNotice;
}

export async function archiveSocietyNotice(societyId: string, noticeId: string): Promise<boolean> {
  const list = await getSocietyNotices(societyId);
  const updated = list.map((n) => (n.id === noticeId ? { ...n, status: 'ARCHIVED' as const } : n));
  setStored('hpz_soc_notices_' + societyId, updated);
  return true;
}

// ==========================================
// 10. COMPLAINTS & HELPDESK
// ==========================================
export async function getSocietyComplaints(societyId: string): Promise<SocietyComplaint[]> {
  return getStored<SocietyComplaint[]>('hpz_soc_complaints_' + societyId, DEFAULT_COMPLAINTS);
}

export async function updateSocietyComplaint(
  societyId: string,
  complaintId: string,
  status: SocietyComplaint['status'],
  adminReply?: string,
  assignedStaff?: string,
  internalNote?: string
): Promise<boolean> {
  const list = await getSocietyComplaints(societyId);
  let targetComplaint: SocietyComplaint | undefined;

  const updated = list.map((c) => {
    if (c.id !== complaintId) return c;
    targetComplaint = c;
    return {
      ...c,
      status,
      adminReply: adminReply || c.adminReply,
      assignedStaff: assignedStaff || c.assignedStaff,
      internalNotes: internalNote ? [...(c.internalNotes || []), internalNote] : c.internalNotes,
      updatedAt: new Date().toISOString(),
    };
  });
  setStored('hpz_soc_complaints_' + societyId, updated);

  // Cross-sync to Resident App complaints
  try {
    const resKey = 'hpz_resident_complaints_' + societyId;
    const resComplaints = getStored<any[]>(resKey, []);
    const syncRes = resComplaints.map((c) => {
      if (c.id === complaintId) {
        return {
          ...c,
          status,
          adminReplies: adminReply
            ? [...(c.adminReplies || []), { id: `rep_${Date.now()}`, message: adminReply, timestamp: new Date().toISOString() }]
            : c.adminReplies,
          assignedStaff: assignedStaff || c.assignedStaff,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setStored(resKey, syncRes);
  } catch (_) {}

  // Dispatch notification to Resident
  if (targetComplaint) {
    notificationEngine.dispatchNotification({
      recipientUid: targetComplaint.submittedByUid || (targetComplaint as any).residentUid || 'usr_resident_04',
      societyId,
      category: 'MAINTENANCE',
      priority: 'NORMAL',
      title: 'Complaint Status Updated',
      body: `Ticket "${targetComplaint.subject || (targetComplaint as any).title}" status changed to ${status}.${adminReply ? ` Admin: "${adminReply}"` : ''}`,
      data: { complaintId, status },
    });
  }

  // Audit Log
  logEcosystemAuditEvent({
    action: 'COMPLAINT_UPDATES',
    targetId: complaintId,
    targetType: 'COMPLAINT',
    societyId,
    changeSummary: `Complaint ${complaintId} updated to ${status}. Staff: ${assignedStaff || 'Unassigned'}`,
  });

  syncBus.broadcast(
    'COMPLAINT_UPDATED',
    societyId,
    auth?.currentUser?.uid || 'admin',
    'SOCIETY_ADMIN',
    { complaintId, status, adminReply, assignedStaff }
  );

  return true;
}

// ==========================================
// 11. INVOICES & MAINTENANCE
// ==========================================
export async function getSocietyInvoices(societyId: string): Promise<SocietyInvoice[]> {
  return getStored<SocietyInvoice[]>('hpz_soc_invoices_' + societyId, DEFAULT_INVOICES);
}

export async function generateMonthlyMaintenanceInvoices(
  societyId: string,
  amount: number,
  dueDate: string
): Promise<number> {
  const flats = await getSocietyFlats(societyId);
  const existingInvoices = await getSocietyInvoices(societyId);
  const newInvoices: SocietyInvoice[] = flats.map((f) => ({
    id: `inv_${Date.now()}_${f.flatNumber}`,
    invoiceNumber: `INV-2026-${Date.now().toString().slice(-4)}-${f.flatNumber}`,
    societyId,
    flatId: f.id,
    flatNumber: f.flatNumber,
    residentName: f.ownerName || f.tenantName || 'Resident',
    residentPhone: f.ownerPhone || f.tenantPhone || '+91 98000 00000',
    category: 'Monthly Maintenance',
    description: `Society Maintenance & Sinking Fund Dues for ${f.flatNumber}`,
    amount: f.flatType === '4BHK' ? amount * 1.3 : f.flatType === '2BHK' ? amount * 0.8 : amount,
    dueDate,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  }));

  setStored('hpz_soc_invoices_' + societyId, [...newInvoices, ...existingInvoices]);
  return newInvoices.length;
}

export async function recordInvoiceManualReceipt(
  societyId: string,
  invoiceId: string,
  paymentMethod: string,
  receiptRef: string
): Promise<boolean> {
  const list = await getSocietyInvoices(societyId);
  const updated = list.map((inv) =>
    inv.id === invoiceId
      ? {
          ...inv,
          status: 'PAID' as const,
          paidDate: new Date().toISOString().split('T')[0],
          paymentMethod,
          receiptNumber: receiptRef,
        }
      : inv
  );
  setStored('hpz_soc_invoices_' + societyId, updated);
  return true;
}

// ==========================================
// 12. AMENITIES & BOOKINGS
// ==========================================
export async function getSocietyAmenities(societyId: string): Promise<SocietyAmenity[]> {
  return getStored<SocietyAmenity[]>('hpz_soc_amenities_' + societyId, DEFAULT_AMENITIES);
}

export async function getSocietyAmenityBookings(societyId: string): Promise<SocietyAmenityBooking[]> {
  return getStored<SocietyAmenityBooking[]>('hpz_soc_amenity_bks_' + societyId, DEFAULT_AMENITY_BOOKINGS);
}

export async function updateAmenityBookingStatus(
  societyId: string,
  bookingId: string,
  status: SocietyAmenityBooking['status']
): Promise<boolean> {
  const list = await getSocietyAmenityBookings(societyId);
  let targetBooking: SocietyAmenityBooking | undefined;

  const updated = list.map((b) => {
    if (b.id !== bookingId) return b;
    targetBooking = b;
    return { ...b, status };
  });
  setStored('hpz_soc_amenity_bks_' + societyId, updated);

  // Cross-sync to Resident App bookings
  try {
    const resKey = 'hpz_resident_bookings_' + societyId;
    const resBookings = getStored<any[]>(resKey, []);
    const syncRes = resBookings.map((b) => (b.id === bookingId ? { ...b, status } : b));
    setStored(resKey, syncRes);
  } catch (_) {}

  // Dispatch notification to Resident
  if (targetBooking) {
    notificationEngine.dispatchNotification({
      recipientUid: targetBooking.bookedByUid || (targetBooking as any).residentUid || 'usr_resident_04',
      societyId,
      category: 'COMMUNITY',
      priority: 'NORMAL',
      title: 'Amenity Booking Update',
      body: `Your booking for ${targetBooking.amenityName} has been ${status}.`,
      data: { bookingId, status },
    });
  }

  // Audit Log
  logEcosystemAuditEvent({
    action: 'BOOKING_CHANGES',
    targetId: bookingId,
    targetType: 'AMENITY_BOOKING',
    societyId,
    changeSummary: `Amenity booking for ${targetBooking?.amenityName || bookingId} marked ${status}`,
  });

  syncBus.broadcast(
    'AMENITY_STATUS_CHANGED',
    societyId,
    auth?.currentUser?.uid || 'admin',
    'SOCIETY_ADMIN',
    { bookingId, status }
  );

  return true;
}

// ==========================================
// 13. EMERGENCY ALERTS
// ==========================================
export async function getSocietyEmergencyAlerts(societyId: string): Promise<SocietyEmergencyAlert[]> {
  return getStored<SocietyEmergencyAlert[]>('hpz_soc_emergencies_' + societyId, DEFAULT_EMERGENCY_ALERTS);
}

export async function resolveEmergencyAlert(
  societyId: string,
  alertId: string,
  responseNotes: string
): Promise<boolean> {
  const list = await getSocietyEmergencyAlerts(societyId);
  const now = new Date().toISOString();
  const updated = list.map((a) =>
    a.id === alertId
      ? {
          ...a,
          status: 'RESOLVED' as const,
          resolvedAt: now,
          resolvedByName: auth?.currentUser?.displayName || 'Society Admin',
          responseNotes,
        }
      : a
  );
  setStored('hpz_soc_emergencies_' + societyId, updated);

  // Cross-sync to Guard Terminal emergencies
  try {
    const guardKey = 'hpz_guard_emergencies_' + societyId;
    const guardAlerts = getStored<any[]>(guardKey, []);
    const syncGuard = guardAlerts.map((g) =>
      g.id === alertId ? { ...g, status: 'RESOLVED', responseNotes, resolvedAt: now } : g
    );
    setStored(guardKey, syncGuard);
  } catch (_) {}

  // Cross-sync to Super Admin Global emergencies
  try {
    const saList = getStored<any[]>('happiiz_sa_emergencies', []);
    const syncSa = saList.map((e) =>
      e.id === alertId ? { ...e, status: 'RESOLVED', escalationNotes: responseNotes, resolvedAt: now } : e
    );
    setStored('happiiz_sa_emergencies', syncSa);
  } catch (_) {}

  // Audit Log
  logEcosystemAuditEvent({
    action: 'EMERGENCY_RESPONSE',
    targetId: alertId,
    targetType: 'EMERGENCY_ALERT',
    societyId,
    changeSummary: `Emergency ${alertId} resolved by Society Admin: ${responseNotes}`,
  });

  syncBus.broadcast(
    'EMERGENCY_RESOLVED',
    societyId,
    auth?.currentUser?.uid || 'admin',
    'SOCIETY_ADMIN',
    { alertId, responseNotes, resolvedAt: now }
  );

  return true;
}

// ==========================================
// 14. COMMUNITY POSTS
// ==========================================
export async function getSocietyCommunityPosts(societyId: string): Promise<SocietyCommunityPost[]> {
  return getStored<SocietyCommunityPost[]>('hpz_soc_posts_' + societyId, DEFAULT_COMMUNITY_POSTS);
}

export async function createCommunityPost(
  societyId: string,
  post: Omit<SocietyCommunityPost, 'id' | 'societyId' | 'timestamp' | 'likesCount' | 'commentsCount'>
): Promise<SocietyCommunityPost> {
  const list = await getSocietyCommunityPosts(societyId);
  const newPost: SocietyCommunityPost = {
    ...post,
    id: `post_${Date.now()}`,
    societyId,
    timestamp: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
  };
  setStored('hpz_soc_posts_' + societyId, [newPost, ...list]);
  return newPost;
}

// ==========================================
// 15. SOCIETY STAFF
// ==========================================
export async function getSocietyStaff(societyId: string): Promise<SocietyStaffMember[]> {
  return getStored<SocietyStaffMember[]>('hpz_soc_staff_' + societyId, DEFAULT_STAFF);
}

// ==========================================
// 16. SETTINGS
// ==========================================
export async function getSocietyDetailedSettings(societyId: string): Promise<SocietyDetailedSettings> {
  return getStored<SocietyDetailedSettings>('hpz_soc_settings_' + societyId, DEFAULT_SOCIETY_SETTINGS);
}

export async function updateSocietyDetailedSettings(
  societyId: string,
  settings: SocietyDetailedSettings
): Promise<boolean> {
  setStored('hpz_soc_settings_' + societyId, settings);
  return true;
}

// ==========================================
// 17. CSV REPORT EXPORT HELPER
// ==========================================
export function exportSocietyReportToCSV(reportName: string, data: any[]): void {
  if (!data || !data.length) {
    const csvContent = 'data:text/csv;charset=utf-8,No data available for export';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? '';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${reportName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==========================================
// 18. AUDIT LOGGING SYSTEM & GATEPASS REVOCATION
// ==========================================
export async function getSocietyAuditLogs(societyId: string): Promise<SocietyAuditLogEntry[]> {
  return getStored<SocietyAuditLogEntry[]>('hpz_soc_audit_' + societyId, DEFAULT_AUDIT_LOGS);
}

export async function recordAuditLog(
  societyId: string,
  actorUid: string,
  actorName: string,
  actorRole: SocietyAdminRole | string,
  actionType: SocietyAuditLogEntry['actionType'],
  targetRecordId?: string,
  targetDescription: string = ''
): Promise<SocietyAuditLogEntry> {
  const currentLogs = await getSocietyAuditLogs(societyId);
  const entry: SocietyAuditLogEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    societyId,
    actorUid,
    actorName,
    actorRole,
    actionType,
    targetRecordId,
    targetDescription,
    timestamp: new Date().toISOString(),
    ipAddress: '192.168.1.100',
  };
  setStored('hpz_soc_audit_' + societyId, [entry, ...currentLogs]);
  return entry;
}

export async function revokeGatePassWithAudit(
  societyId: string,
  passId: string,
  reason: string,
  adminName: string,
  adminUid: string = 'usr_admin',
  adminRole: SocietyAdminRole | string = 'SOCIETY_ADMIN'
): Promise<boolean> {
  const visitors = await getSocietyVisitors(societyId);
  const updatedVisitors = visitors.map((v) => {
    if (v.id === passId) {
      return {
        ...v,
        status: 'Expired' as const,
        revocationReason: reason,
        revokedBy: adminName,
        revokedAt: new Date().toISOString(),
      };
    }
    return v;
  });
  setStored('hpz_soc_visitors_' + societyId, updatedVisitors);

  // Cross-sync to resident passes
  try {
    const resPasses = getStored<GatePass[]>('hpz_resident_passes_' + societyId, []);
    if (resPasses.length) {
      const syncRes = resPasses.map((p) =>
        p.id === passId ? { ...p, status: 'Expired' as const, revocationReason: reason } : p
      );
      setStored('hpz_resident_passes_' + societyId, syncRes);
    }
  } catch (_) {}

  // Cross-sync to guard visitors
  try {
    const grdVisitors = getStored<GatePass[]>('hpz_guard_visitors_' + societyId, []);
    if (grdVisitors.length) {
      const syncGrd = grdVisitors.map((p) =>
        p.id === passId ? { ...p, status: 'Expired' as const, revocationReason: reason } : p
      );
      setStored('hpz_guard_visitors_' + societyId, syncGrd);
    }
  } catch (_) {}

  await recordAuditLog(
    societyId,
    adminUid,
    adminName,
    adminRole,
    'GATEPASS_REVOKED',
    passId,
    `Revoked GatePass ${passId}: "${reason}"`
  );
  return true;
}

// Bundled service object for unified dashboard usage
export const societyAdminService = {
  getSocietyAdminAnalytics,
  getBuildings: getSocietyBuildings,
  createBuilding: addSocietyBuilding,
  updateBuilding: async (id: string, data: Partial<SocietyBuilding>) => {
    return true;
  },
  getFlats: getSocietyFlats,
  createFlat: addSocietyFlat,
  updateFlat: updateSocietyFlat,
  getResidents: getSocietyResidents,
  updateResidentStatus: updateResidentMembershipStatus,
  assignFlatToResident: async (id: string, flatNumber: string, occupantType: 'OWNER' | 'TENANT') => {
    return true;
  },
  getHouseholdMembers: getSocietyHouseholdMembers,
  createHouseholdMember: addHouseholdMember,
  getVehicles: getSocietyVehicles,
  createVehicle: addSocietyVehicle,
  getDomesticHelpers: getSocietyDomesticHelpers,
  createDomesticHelper: addDomesticHelper,
  toggleHelperStatus: async (id: string, status: 'ACTIVE' | 'REVOKED') => {
    return revokeDomesticHelper('soc_emerald_heights', id);
  },
  getGates: getSocietyGates,
  createGate: addSocietyGate,
  updateGate: async (id: string, data: Partial<SocietyGate>) => {
    return true;
  },
  getVisitors: getSocietyVisitors,
  checkOutVisitor: async (id: string) => {
    return checkoutSocietyVisitor('soc_emerald_heights', id);
  },
  revokeGatePassWithAudit,
  getNotices: getSocietyNotices,
  createNotice: createSocietyNotice,
  archiveNotice: async (id: string) => {
    return archiveSocietyNotice('soc_emerald_heights', id);
  },
  getComplaints: getSocietyComplaints,
  updateComplaint: updateSocietyComplaint,
  getInvoices: getSocietyInvoices,
  generateMonthlyInvoices: generateMonthlyMaintenanceInvoices,
  recordOfflinePayment: recordInvoiceManualReceipt,
  getAmenities: getSocietyAmenities,
  getBookings: getSocietyAmenityBookings,
  updateBookingStatus: updateAmenityBookingStatus,
  getEmergencyAlerts: getSocietyEmergencyAlerts,
  resolveEmergencyAlert,
  getCommunityPosts: getSocietyCommunityPosts,
  createCommunityPost,
  moderatePost: async (id: string, action: 'APPROVED' | 'REPORTED' | 'HIDDEN') => {
    return true;
  },
  getStaff: getSocietyStaff,
  createStaff: async (s: any) => {
    return s;
  },
  toggleStaffStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    return true;
  },
  getSettings: getSocietyDetailedSettings,
  updateSettings: updateSocietyDetailedSettings,
  getAuditLogs: getSocietyAuditLogs,
  recordAuditLog,
  exportReportToCSV: exportSocietyReportToCSV,
};

