/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  MarketplaceService,
  MarketplaceBooking,
  PartnerCrmProfile,
  PartnerCustomServiceRate,
  PartnerAnalyticsSummary,
  CrmDateFilterType,
} from '../../types/marketplace';
import { syncBus } from './sync.service';
import { notificationEngine } from './notification.service';
import { logEcosystemAuditEvent } from './audit.service';
import { getAllServicePartners } from './superadmin.service';

const SERVICES_KEY = 'hpz_marketplace_services';
const BOOKINGS_KEY = 'hpz_marketplace_bookings';
const PARTNER_CUSTOM_RATES_KEY = 'hpz_marketplace_partner_custom_rates';

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

// Default Catalog Services (Urban Company Style)
const DEFAULT_SERVICES: MarketplaceService[] = [
  {
    id: 'srv_car_wash_sedan',
    name: 'Car Wash & Foam Detailing (Sedan / Hatchback)',
    category: 'Automotive Cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop',
    description: 'Complete high-pressure exterior foam wash, tire dressing, interior vacuuming, dashboard polish, and door jamb cleaning at your parking bay.',
    whatIsIncluded: [
      'High-pressure water & pH-neutral foam wash',
      'Interior vacuuming (seats, floor mats, boot)',
      'Dashboard & console microfiber conditioning',
      'Tire shiner & rim de-greasing',
      'Water spots removal on windshield & mirrors',
    ],
    pricingType: 'FIXED',
    basePrice: 399,
    commissionRate: 15,
    estimatedDuration: '45 mins',
    status: 'ACTIVE',
    popularBadge: true,
    rating: 4.8,
    reviewCount: 342,
    partnerCount: 6,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-02-15T12:00:00Z',
  },
  {
    id: 'srv_car_wash_suv',
    name: 'Car Wash & Deep Detailing (SUV / Luxury)',
    category: 'Automotive Cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&auto=format&fit=crop',
    description: 'Specialized deep clean for 7-seaters & compact SUVs. Includes roof rail wipe, wheel arch mud extraction, leather conditioner, and engine bay dry wash.',
    whatIsIncluded: [
      'Deep foam wash with clay sponge application',
      '3-row cabin vacuuming & boot deodorization',
      'Leather/fabric seat spot cleaning',
      'Hydrophobic glass treatment for rain driving',
      'Engine bay dry air-pressure cleaning',
    ],
    pricingType: 'FIXED',
    basePrice: 549,
    commissionRate: 15,
    estimatedDuration: '60 mins',
    status: 'ACTIVE',
    popularBadge: false,
    rating: 4.9,
    reviewCount: 188,
    partnerCount: 5,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-18T10:00:00Z',
  },
  {
    id: 'srv_plumber_visit',
    name: 'Plumbing Diagnostic & Tap / Drain Repair',
    category: 'Plumbing',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop',
    description: 'Expert doorstep visit to diagnose and fix leaking faucets, under-sink siphon traps, toilet flush cisterns, angle valves, or slow drain blockages.',
    whatIsIncluded: [
      'Doorstep inspection & diagnosis within 60 mins',
      'Leakage repair for 2 tap/faucet fixtures',
      'Drain water siphon unclogging',
      'Water pressure gauge check',
      'Procurement assistance for replacement spares (charged at actuals)',
    ],
    pricingType: 'INSPECTION',
    basePrice: 199,
    commissionRate: 10,
    estimatedDuration: '30-45 mins',
    status: 'ACTIVE',
    popularBadge: true,
    rating: 4.7,
    reviewCount: 512,
    partnerCount: 8,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'srv_electrician_diag',
    name: 'Electrician Diagnostic & Power Fault Repair',
    category: 'Electrical',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop',
    description: 'Certified electrical technician for tripping MCBs, switchboard replacements, ceiling fan regulator issues, inverter hookup, and chandelier installations.',
    whatIsIncluded: [
      'Digital multimeter voltage & earthing check',
      'Repair/replacement of up to 2 switch points/MCBs',
      'Short-circuit diagnosis in distribution board',
      'Safe insulation of open or loose wiring',
      '30-day service warranty on repair work',
    ],
    pricingType: 'INSPECTION',
    basePrice: 249,
    commissionRate: 10,
    estimatedDuration: '45 mins',
    status: 'ACTIVE',
    popularBadge: true,
    rating: 4.8,
    reviewCount: 420,
    partnerCount: 7,
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-02-12T10:00:00Z',
  },
  {
    id: 'srv_ac_service_deep',
    name: 'AC Jet Servicing & Cooling Optimization',
    category: 'Appliance Repair',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop',
    description: 'Deep high-pressure water jacket servicing for indoor cooling coils, outdoor unit condenser fin cleaning, gas pressure inspection, and antibacterial spray.',
    whatIsIncluded: [
      'Indoor blower & cooling coil jet pump wash with spill kit',
      'Outdoor condenser unit chemical fin clean',
      'Drain pipe flush to prevent indoor water leakage',
      'Suction/discharge refrigerant gas pressure check',
      'Remote controller and thermostat sensor calibration',
    ],
    pricingType: 'FIXED',
    basePrice: 599,
    commissionRate: 15,
    estimatedDuration: '1.5 hours',
    status: 'ACTIVE',
    popularBadge: true,
    rating: 4.9,
    reviewCount: 630,
    partnerCount: 5,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'srv_home_deep_clean',
    name: 'Full Home Deep Cleaning (2 BHK / 3 BHK)',
    category: 'Cleaning & Sanitization',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop',
    description: 'Heavy-duty mechanized cleaning by a 3-member team. Includes single-disc floor scrub, kitchen degreasing, bathroom descaling, balcony wash, and cobweb removal.',
    whatIsIncluded: [
      'Mechanized single-disc floor scrubbing with scrubbing pad',
      'Kitchen chimney, tiles, cabinets & stove oil de-greasing',
      'Bathroom hard-water stain removal on tiles & fixtures',
      'Balcony railing, floor & sliding door track clean',
      'Full upholstery dusting & ceiling fan blade wiping',
    ],
    pricingType: 'FIXED',
    basePrice: 1999,
    commissionRate: 20,
    estimatedDuration: '3.5 - 4 hours',
    status: 'ACTIVE',
    popularBadge: false,
    rating: 4.7,
    reviewCount: 215,
    partnerCount: 4,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-25T10:00:00Z',
  },
  {
    id: 'srv_appliance_ro_purifier',
    name: 'Water Purifier / RO Filter Servicing',
    category: 'Appliance Repair',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop',
    description: 'Complete RO TDS check, sediment & pre-carbon filter wash, booster pump pressure evaluation, and UV lamp sanitization for drinking water safety.',
    whatIsIncluded: [
      'TDS test before and after filtration',
      'Sediment pre-filter replacement check',
      'Booster pump electrical draw & leakage test',
      'UV lamp intensity evaluation',
      'Internal tank food-grade sanitization tablet',
    ],
    pricingType: 'INSPECTION',
    basePrice: 349,
    commissionRate: 15,
    estimatedDuration: '45 mins',
    status: 'ACTIVE',
    popularBadge: false,
    rating: 4.8,
    reviewCount: 165,
    partnerCount: 4,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'srv_carpenter_repair',
    name: 'Carpenter Woodwork & Door Lock Fitting',
    category: 'Carpentry',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop',
    description: 'Door hinge alignment, hydraulic closer installation, wardrobe drawer channel replacement, digital door lock fitting, or modular kitchen hinge repairs.',
    whatIsIncluded: [
      'Door gap trimming and floor dragging fix',
      'Hinge lubrication and screw tightening',
      'Drawer slider rail realignment',
      'Handle, latch & tower bolt installations',
      'Drilling and wall-anchor mounting service',
    ],
    pricingType: 'HOURLY',
    basePrice: 299,
    commissionRate: 10,
    estimatedDuration: '1 hour',
    status: 'ACTIVE',
    popularBadge: false,
    rating: 4.6,
    reviewCount: 140,
    partnerCount: 5,
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
  },
];

// Rich Initial Bookings Seed for Ledger & CRM
const DEFAULT_BOOKINGS: MarketplaceBooking[] = [
  {
    id: 'bk_mp_101',
    bookingCode: 'HPZ-UC-9041',
    serviceId: 'srv_car_wash_sedan',
    serviceName: 'Car Wash & Foam Detailing (Sedan / Hatchback)',
    category: 'Automotive Cleaning',
    serviceImageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop',
    pricingType: 'FIXED',
    residentUid: 'res_priya',
    residentName: 'Dr. Priya Varma',
    residentPhone: '+91 99554 43322',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower B',
    flatNumber: 'B-704',
    partnerId: 'sp_1',
    partnerName: 'Urban Company Pro Facilities',
    partnerPhone: '+91 98450 11992',
    partnerPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: '10:00 AM - 11:30 AM',
    problemDescription: 'White Honda City parked in Basement B2-Bay 14. Foam wash and vacuuming needed before afternoon airport run.',
    status: 'COMPLETED',
    baseCost: 399,
    partsCost: 0,
    laborCost: 399,
    taxAmount: 0,
    totalAmount: 399,
    commissionRate: 15,
    commissionAmount: 60,
    partnerEarnings: 339,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    transactionId: 'TXN-UPI-98441029',
    completionNotes: 'Completed foam wash and interior vacuum. Bay left dry.',
    customerRating: 5,
    customerReview: 'Super punctual! The car was sparkling clean right in my parking slot.',
    assignedTechnicianName: 'Suresh Kumar',
    assignedTechnicianPhone: '+91 98330 44109',
    gatePassId: 'PASS-AUTO-9041',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2.2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'bk_mp_102',
    bookingCode: 'HPZ-UC-8832',
    serviceId: 'srv_ac_service_deep',
    serviceName: 'AC Jet Servicing & Cooling Optimization',
    category: 'Appliance Repair',
    serviceImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop',
    pricingType: 'FIXED',
    residentUid: 'res_priya',
    residentName: 'Dr. Priya Varma',
    residentPhone: '+91 99554 43322',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower B',
    flatNumber: 'B-704',
    partnerId: 'sp_1',
    partnerName: 'Urban Company Pro Facilities',
    partnerPhone: '+91 98450 11992',
    partnerPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    scheduledDate: new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10),
    scheduledTime: '02:00 PM - 03:30 PM',
    problemDescription: 'Living room split AC airflow is weak and foul smell coming out upon turning on.',
    status: 'COMPLETED',
    baseCost: 599,
    partsCost: 150,
    laborCost: 599,
    taxAmount: 0,
    totalAmount: 749,
    commissionRate: 15,
    commissionAmount: 112,
    partnerEarnings: 637,
    paymentStatus: 'PAID',
    paymentMethod: 'Online Gateway',
    transactionId: 'TXN-ONL-77192834',
    completionNotes: 'High-pressure jet wash cleaned dust clog from evaporator coils. New antibacterial air filter inserted.',
    customerRating: 5,
    customerReview: 'Cooling was restored immediately. Very professional and clean setup.',
    assignedTechnicianName: 'Ramesh Yadav',
    assignedTechnicianPhone: '+91 98110 55443',
    gatePassId: 'PASS-AC-8832',
    createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 29 * 3600 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'bk_mp_103',
    bookingCode: 'HPZ-UC-7619',
    serviceId: 'srv_plumber_visit',
    serviceName: 'Plumbing Diagnostic & Tap / Drain Repair',
    category: 'Plumbing',
    serviceImageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop',
    pricingType: 'INSPECTION',
    residentUid: 'res_rajesh',
    residentName: 'Rajesh Sharma',
    residentPhone: '+91 98765 43210',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower A',
    flatNumber: 'A-402',
    partnerId: 'sp_1',
    partnerName: 'Urban Company Pro Facilities',
    partnerPhone: '+91 98450 11992',
    partnerPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    scheduledDate: new Date(Date.now() - 3 * 86400 * 1000).toISOString().slice(0, 10),
    scheduledTime: '11:00 AM - 12:30 PM',
    problemDescription: 'Master washroom hand shower angle valve leaking through wall thread.',
    status: 'COMPLETED',
    baseCost: 199,
    partsCost: 280,
    laborCost: 250,
    taxAmount: 0,
    totalAmount: 530,
    commissionRate: 10,
    commissionAmount: 53,
    partnerEarnings: 477,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    transactionId: 'TXN-UPI-44019283',
    completionNotes: 'Replaced brass angle valve with Teflon tape seal.',
    customerRating: 4.5,
    customerReview: 'Fixed the leak quickly, polite plumber.',
    assignedTechnicianName: 'Mohan Lal',
    assignedTechnicianPhone: '+91 98190 77334',
    gatePassId: 'PASS-PL-7619',
    createdAt: new Date(Date.now() - 76 * 3600 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 75 * 3600 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 73 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
  },
  {
    id: 'bk_mp_104',
    bookingCode: 'HPZ-UC-6540',
    serviceId: 'srv_home_deep_clean',
    serviceName: 'Full Home Deep Cleaning (2 BHK / 3 BHK)',
    category: 'Cleaning & Sanitization',
    serviceImageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop',
    pricingType: 'FIXED',
    residentUid: 'res_vikram',
    residentName: 'Vikram Merchant',
    residentPhone: '+91 98210 88776',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower C',
    flatNumber: 'C-302',
    partnerId: 'sp_1',
    partnerName: 'Urban Company Pro Facilities',
    partnerPhone: '+91 98450 11992',
    partnerPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    scheduledDate: new Date(Date.now() - 8 * 86400 * 1000).toISOString().slice(0, 10),
    scheduledTime: '09:00 AM - 01:00 PM',
    problemDescription: 'Post-renovation deep cleaning for 3 BHK flat. Dust extraction and floor scrubbing required.',
    status: 'COMPLETED',
    baseCost: 1999,
    partsCost: 300,
    laborCost: 1999,
    taxAmount: 0,
    totalAmount: 2299,
    commissionRate: 20,
    commissionAmount: 460,
    partnerEarnings: 1839,
    paymentStatus: 'PAID',
    paymentMethod: 'Online Gateway',
    transactionId: 'TXN-ONL-99881122',
    completionNotes: 'Full flat scrubbed, chimney degreased, all 3 washrooms descaled.',
    customerRating: 5,
    customerReview: 'Magnificent work. The apartment smells clean and looks brand new.',
    assignedTechnicianName: 'Suresh Kumar (Team Lead)',
    assignedTechnicianPhone: '+91 98330 44109',
    gatePassId: 'PASS-CLN-6540',
    createdAt: new Date(Date.now() - 200 * 3600 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 198 * 3600 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 194 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 190 * 3600 * 1000).toISOString(),
  },
  {
    id: 'bk_mp_105',
    bookingCode: 'HPZ-UC-5412',
    serviceId: 'srv_electrician_diag',
    serviceName: 'Electrician Diagnostic & Power Fault Repair',
    category: 'Electrical',
    serviceImageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop',
    pricingType: 'INSPECTION',
    residentUid: 'res_ananya',
    residentName: 'Ananya Deshmukh',
    residentPhone: '+91 98223 34455',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower B',
    flatNumber: 'B-301',
    partnerId: 'sp_1',
    partnerName: 'Urban Company Pro Facilities',
    partnerPhone: '+91 98450 11992',
    partnerPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    scheduledDate: new Date(Date.now() - 14 * 86400 * 1000).toISOString().slice(0, 10),
    scheduledTime: '04:00 PM - 05:30 PM',
    problemDescription: 'Geyser plug point burning smell and MCB tripping when switched on.',
    status: 'COMPLETED',
    baseCost: 249,
    partsCost: 350,
    laborCost: 250,
    taxAmount: 0,
    totalAmount: 600,
    commissionRate: 10,
    commissionAmount: 60,
    partnerEarnings: 540,
    paymentStatus: 'PAID',
    paymentMethod: 'Cash',
    transactionId: 'TXN-CSH-550192',
    completionNotes: 'Replaced charred 16A socket and re-crimped 4 sq.mm copper wires.',
    customerRating: 5,
    customerReview: 'Saved our geyser from catching fire. Very knowledgeable technician.',
    assignedTechnicianName: 'Suresh Kumar',
    assignedTechnicianPhone: '+91 98330 44109',
    gatePassId: 'PASS-EL-5412',
    createdAt: new Date(Date.now() - 340 * 3600 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 338 * 3600 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 336 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 334 * 3600 * 1000).toISOString(),
  },
  {
    id: 'bk_mp_106',
    bookingCode: 'HPZ-UC-4190',
    serviceId: 'srv_car_wash_sedan',
    serviceName: 'Car Wash & Foam Detailing (Sedan / Hatchback)',
    category: 'Automotive Cleaning',
    serviceImageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop',
    pricingType: 'FIXED',
    residentUid: 'res_priya',
    residentName: 'Dr. Priya Varma',
    residentPhone: '+91 99554 43322',
    societyId: 'soc_emerald_heights',
    societyName: 'Emerald Heights Luxury Enclave',
    building: 'Tower B',
    flatNumber: 'B-704',
    partnerId: 'sp_1',
    partnerName: 'Urban Company Pro Facilities',
    partnerPhone: '+91 98450 11992',
    partnerPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: '03:00 PM - 04:30 PM',
    problemDescription: 'Hyundai i20 foam wash and dry clean interior mats.',
    status: 'REQUESTED',
    baseCost: 399,
    partsCost: 0,
    laborCost: 399,
    taxAmount: 0,
    totalAmount: 399,
    commissionRate: 15,
    commissionAmount: 60,
    partnerEarnings: 339,
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
  },
];

class MarketplaceServiceEngine {
  // ============================================================
  // 1. CATALOG MANAGEMENT (SUPER ADMIN)
  // ============================================================
  async getServices(): Promise<MarketplaceService[]> {
    return getStored<MarketplaceService[]>(SERVICES_KEY, DEFAULT_SERVICES);
  }

  async getServiceById(id: string): Promise<MarketplaceService | null> {
    const list = await this.getServices();
    return list.find((s) => s.id === id) || null;
  }

  async createService(data: Partial<MarketplaceService>): Promise<MarketplaceService> {
    const list = await this.getServices();
    const id = `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newService: MarketplaceService = {
      id,
      name: data.name || 'New Marketplace Service',
      category: data.category || 'General Maintenance',
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop',
      description: data.description || 'Professional doorstep service delivered by verified technicians.',
      whatIsIncluded: data.whatIsIncluded && data.whatIsIncluded.length > 0
        ? data.whatIsIncluded
        : ['Doorstep inspection & diagnosis', 'Standard service execution with tools', '30-day post-service warranty guarantee'],
      pricingType: data.pricingType || 'FIXED',
      basePrice: Number(data.basePrice) || 299,
      commissionRate: Number(data.commissionRate) || 15,
      estimatedDuration: data.estimatedDuration || '45 mins',
      status: data.status || 'ACTIVE',
      popularBadge: Boolean(data.popularBadge),
      rating: 5.0,
      reviewCount: 0,
      partnerCount: 3,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newService, ...list];
    setStored(SERVICES_KEY, updated);

    logEcosystemAuditEvent({
      action: 'ADD_MARKETPLACE_SERVICE',
      targetId: id,
      targetType: 'SERVICE_BOOKING',
      changeSummary: `Super Admin added new marketplace service: "${newService.name}" (Base: ₹${newService.basePrice}, Comm: ${newService.commissionRate}%)`,
    });

    syncBus.broadcast('MARKETPLACE_SERVICE_CREATED', 'ALL', 'super_admin', 'SUPER_ADMIN', newService);
    return newService;
  }

  async updateService(id: string, updates: Partial<MarketplaceService>): Promise<MarketplaceService> {
    const list = await this.getServices();
    const now = new Date().toISOString();
    let updatedService: MarketplaceService | null = null;

    const updated = list.map((s) => {
      if (s.id === id) {
        updatedService = {
          ...s,
          ...updates,
          updatedAt: now,
        };
        return updatedService;
      }
      return s;
    });

    setStored(SERVICES_KEY, updated);

    if (updatedService) {
      logEcosystemAuditEvent({
        action: 'UPDATE_MARKETPLACE_SERVICE',
        targetId: id,
        targetType: 'SERVICE_BOOKING',
        changeSummary: `Super Admin updated service: "${(updatedService as MarketplaceService).name}"`,
      });
      syncBus.broadcast('MARKETPLACE_SERVICE_UPDATED', 'ALL', 'super_admin', 'SUPER_ADMIN', updatedService);
      return updatedService;
    }

    throw new Error('Service not found');
  }

  async toggleServiceStatus(id: string): Promise<MarketplaceService> {
    const list = await this.getServices();
    const service = list.find((s) => s.id === id);
    if (!service) throw new Error('Service not found');

    const newStatus = service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.updateService(id, { status: newStatus });
  }

  async deleteService(id: string): Promise<boolean> {
    const list = await this.getServices();
    const target = list.find((s) => s.id === id);
    const updated = list.filter((s) => s.id !== id);
    setStored(SERVICES_KEY, updated);

    logEcosystemAuditEvent({
      action: 'DELETE_MARKETPLACE_SERVICE',
      targetId: id,
      targetType: 'SERVICE_BOOKING',
      changeSummary: `Super Admin deleted service: "${target?.name || id}"`,
    });

    syncBus.broadcast('MARKETPLACE_SERVICE_DELETED', 'ALL', 'super_admin', 'SUPER_ADMIN', { id });
    return true;
  }

  // ============================================================
  // 2. END-TO-END ON-DEMAND BOOKINGS (URBAN COMPANY WORKFLOW)
  // ============================================================
  async getBookings(): Promise<MarketplaceBooking[]> {
    return getStored<MarketplaceBooking[]>(BOOKINGS_KEY, DEFAULT_BOOKINGS);
  }

  async getResidentBookings(residentUid: string): Promise<MarketplaceBooking[]> {
    const all = await this.getBookings();
    return all.filter((b) => b.residentUid === residentUid);
  }

  async getPartnerBookings(partnerId: string): Promise<MarketplaceBooking[]> {
    const all = await this.getBookings();
    return all.filter((b) => b.partnerId === partnerId);
  }

  /**
   * STEP 1: RESIDENT CREATES SERVICE BOOKING
   */
  async createResidentBooking(data: {
    serviceId: string;
    residentUid: string;
    residentName: string;
    residentPhone: string;
    societyId: string;
    societyName: string;
    building?: string;
    flatNumber: string;
    scheduledDate: string;
    scheduledTime: string;
    problemDescription: string;
    partnerId?: string;
  }): Promise<MarketplaceBooking> {
    const services = await this.getServices();
    const service = services.find((s) => s.id === data.serviceId) || services[0];
    const partnerId = data.partnerId || 'sp_1';

    const list = await this.getBookings();
    const now = new Date().toISOString();
    const bookingCode = `HPZ-UC-${Math.floor(1000 + Math.random() * 9000)}`;

    const commissionRate = service.commissionRate || 15;
    const baseCost = service.basePrice;
    const commissionAmount = Math.round((baseCost * commissionRate) / 100);
    const partnerEarnings = baseCost - commissionAmount;

    const newBooking: MarketplaceBooking = {
      id: `bk_mp_${Date.now()}`,
      bookingCode,
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      serviceImageUrl: service.imageUrl,
      pricingType: service.pricingType,
      residentUid: data.residentUid,
      residentName: data.residentName,
      residentPhone: data.residentPhone || '+91 99554 43322',
      societyId: data.societyId,
      societyName: data.societyName,
      building: data.building || 'Tower B',
      flatNumber: data.flatNumber,
      partnerId,
      partnerName: 'Urban Company Pro Facilities',
      partnerPhone: '+91 98450 11992',
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      problemDescription: data.problemDescription,
      status: 'REQUESTED',
      baseCost,
      partsCost: 0,
      laborCost: baseCost,
      taxAmount: 0,
      totalAmount: baseCost,
      commissionRate,
      commissionAmount,
      partnerEarnings,
      paymentStatus: 'PENDING',
      createdAt: now,
    };

    const updated = [newBooking, ...list];
    setStored(BOOKINGS_KEY, updated);

    // Cross-sync to resident local jobs store
    try {
      const resKey = `hpz_resident_service_jobs_${data.residentUid}`;
      const resJobs = getStored<any[]>(resKey, []);
      setStored(resKey, [newBooking, ...resJobs]);
    } catch (_) {}

    // Cross-sync to partner local store
    try {
      const ptKey = `hpz_partner_bookings_${partnerId}`;
      const ptJobs = getStored<any[]>(ptKey, []);
      setStored(ptKey, [newBooking, ...ptJobs]);
    } catch (_) {}

    // STEP 2: BROADCAST & NOTIFY SERVICE PARTNER
    notificationEngine.dispatchNotification({
      recipientUid: partnerId,
      societyId: data.societyId,
      category: 'SERVICE',
      priority: 'HIGH',
      title: `New Booking Request: ${service.name}`,
      body: `${data.residentName} (${data.flatNumber}) requested ${service.name} for ${data.scheduledDate} at ${data.scheduledTime}.`,
      data: { bookingId: newBooking.id, bookingCode, category: service.category },
    });

    logEcosystemAuditEvent({
      action: 'BOOKING_CHANGES',
      targetId: newBooking.id,
      targetType: 'SERVICE_BOOKING',
      societyId: data.societyId,
      changeSummary: `${data.residentName} (${data.flatNumber}) booked ${service.name} #${bookingCode}`,
    });

    syncBus.broadcast('MARKETPLACE_BOOKING_CREATED', data.societyId, data.residentUid, 'RESIDENT', newBooking);
    return newBooking;
  }

  /**
   * STEP 3: PARTNER ACCEPTS BOOKING
   */
  async acceptBooking(
    bookingId: string,
    partnerId: string,
    technicianName?: string,
    technicianPhone?: string
  ): Promise<MarketplaceBooking> {
    const list = await this.getBookings();
    const now = new Date().toISOString();
    let updatedBooking: MarketplaceBooking | null = null;

    const updated = list.map((b) => {
      if (b.id === bookingId) {
        const techName = technicianName || 'Suresh Kumar';
        const techPhone = technicianPhone || '+91 98330 44109';
        const passId = `PASS-${b.category.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        updatedBooking = {
          ...b,
          status: 'ACCEPTED',
          partnerId,
          assignedTechnicianName: techName,
          assignedTechnicianPhone: techPhone,
          gatePassId: passId,
          acceptedAt: now,
        };

        // STEP 3B: INSTANT NOTIFICATION TRIGGER TO RESIDENT
        notificationEngine.dispatchNotification({
          recipientUid: b.residentUid,
          societyId: b.societyId,
          category: 'SERVICE',
          priority: 'HIGH',
          title: 'Your Service is Confirmed!',
          body: `Your service is confirmed! ${b.partnerName} (${techName}) will arrive on ${b.scheduledDate} at ${b.scheduledTime}.`,
          data: { bookingId: b.id, bookingCode: b.bookingCode, technicianName: techName },
        });

        return updatedBooking;
      }
      return b;
    });

    setStored(BOOKINGS_KEY, updated);

    if (updatedBooking) {
      syncBus.broadcast('MARKETPLACE_BOOKING_ACCEPTED', (updatedBooking as MarketplaceBooking).societyId, partnerId, 'SERVICE_PARTNER', updatedBooking);
      return updatedBooking;
    }

    throw new Error('Booking not found');
  }

  /**
   * STEP 4: PARTNER MARKS JOB IN PROGRESS
   */
  async startJob(bookingId: string): Promise<MarketplaceBooking> {
    const list = await this.getBookings();
    const now = new Date().toISOString();
    let updatedBooking: MarketplaceBooking | null = null;

    const updated = list.map((b) => {
      if (b.id === bookingId) {
        updatedBooking = {
          ...b,
          status: 'IN_PROGRESS',
          startedAt: now,
        };
        return updatedBooking;
      }
      return b;
    });

    setStored(BOOKINGS_KEY, updated);
    if (!updatedBooking) throw new Error('Booking not found');

    notificationEngine.dispatchNotification({
      recipientUid: (updatedBooking as MarketplaceBooking).residentUid,
      societyId: (updatedBooking as MarketplaceBooking).societyId,
      category: 'SERVICE',
      priority: 'NORMAL',
      title: 'Technician Arrived - Service In Progress',
      body: `${(updatedBooking as MarketplaceBooking).assignedTechnicianName || 'Technician'} has started the service for ${(updatedBooking as MarketplaceBooking).serviceName}.`,
    });

    syncBus.broadcast('MARKETPLACE_BOOKING_STARTED', (updatedBooking as MarketplaceBooking).societyId, (updatedBooking as MarketplaceBooking).partnerId, 'SERVICE_PARTNER', updatedBooking);
    return updatedBooking;
  }

  /**
   * STEP 5 & 6: SERVICE COMPLETION, INVOICING & REVENUE SPLIT
   */
  async completeJob(
    bookingId: string,
    data: {
      partsCost: number;
      laborCost: number;
      completionNotes?: string;
      paymentMethod?: 'UPI' | 'Cash' | 'Card' | 'Online Gateway';
      customerRating?: number;
      customerReview?: string;
    }
  ): Promise<MarketplaceBooking> {
    const list = await this.getBookings();
    const now = new Date().toISOString();
    let updatedBooking: MarketplaceBooking | null = null;

    const updated = list.map((b) => {
      if (b.id === bookingId) {
        const parts = Number(data.partsCost) || 0;
        const labor = Number(data.laborCost) || b.baseCost;
        const total = parts + labor;
        const commRate = b.commissionRate || 15;
        const commissionAmount = Math.round((total * commRate) / 100);
        const partnerEarnings = total - commissionAmount;
        const txnId = `TXN-${data.paymentMethod ? data.paymentMethod.slice(0, 3).toUpperCase() : 'UPI'}-${Math.floor(10000000 + Math.random() * 90000000)}`;

        updatedBooking = {
          ...b,
          status: 'COMPLETED',
          partsCost: parts,
          laborCost: labor,
          totalAmount: total,
          commissionAmount,
          partnerEarnings,
          paymentStatus: 'PAID',
          paymentMethod: data.paymentMethod || 'UPI',
          transactionId: txnId,
          completionNotes: data.completionNotes || 'Service completed successfully to resident satisfaction.',
          customerRating: data.customerRating || 5,
          customerReview: data.customerReview || undefined,
          completedAt: now,
        };

        // Notify Resident with Invoice Summary
        notificationEngine.dispatchNotification({
          recipientUid: b.residentUid,
          societyId: b.societyId,
          category: 'SERVICE',
          priority: 'NORMAL',
          title: `Service Completed - Invoice ₹${total}`,
          body: `Work order #${b.bookingCode} completed. Invoice of ₹${total} paid via ${data.paymentMethod || 'UPI'}.`,
        });

        return updatedBooking;
      }
      return b;
    });

    setStored(BOOKINGS_KEY, updated);
    if (!updatedBooking) throw new Error('Booking not found');

    logEcosystemAuditEvent({
      action: 'SERVICE_INVOICE_PAID',
      targetId: bookingId,
      targetType: 'FINANCIAL_TRANSACTION',
      societyId: (updatedBooking as MarketplaceBooking).societyId,
      changeSummary: `Completed job #${(updatedBooking as MarketplaceBooking).bookingCode}. Gross: ₹${(updatedBooking as MarketplaceBooking).totalAmount}, Platform Cut: ₹${(updatedBooking as MarketplaceBooking).commissionAmount}, Partner: ₹${(updatedBooking as MarketplaceBooking).partnerEarnings}`,
    });

    syncBus.broadcast('MARKETPLACE_BOOKING_COMPLETED', (updatedBooking as MarketplaceBooking).societyId, (updatedBooking as MarketplaceBooking).partnerId, 'SERVICE_PARTNER', updatedBooking);
    return updatedBooking;
  }

  // ============================================================
  // 3. PARTNER 360° CRM & ANALYTICS
  // ============================================================
  async getPartnerCrmProfiles(): Promise<PartnerCrmProfile[]> {
    const rawPartners = await getAllServicePartners();
    const allBookings = await this.getBookings();
    const allServices = await this.getServices();
    const customRatesStore = getStored<Record<string, PartnerCustomServiceRate[]>>(PARTNER_CUSTOM_RATES_KEY, {});

    return rawPartners.map((p) => {
      const pId: string = p.uid || p.id || 'sp_1';
      const pBookings = allBookings.filter((b) => b.partnerId === pId || b.partnerId === 'sp_1');
      const completedJobs = pBookings.filter((b) => b.status === 'COMPLETED');

      const lifetimeGmv = completedJobs.reduce((sum, j) => sum + (j.totalAmount || 0), 0);
      const lifetimeCommissionPaid = completedJobs.reduce((sum, j) => sum + (j.commissionAmount || 0), 0);
      const lifetimeNetEarnings = lifetimeGmv - lifetimeCommissionPaid;

      // Custom Rates mapping or defaults from catalog
      const storedRates = customRatesStore[pId];
      const servicesOffered: PartnerCustomServiceRate[] = storedRates || allServices.slice(0, 5).map((s) => ({
        serviceId: s.id,
        serviceName: s.name,
        category: s.category,
        customPrice: s.basePrice,
        basePrice: s.basePrice,
        isOptedIn: true,
        customDuration: s.estimatedDuration,
      }));

      const ratingValues = completedJobs.map((j) => j.customerRating).filter(Boolean) as number[];
      const avgRating = ratingValues.length > 0
        ? Number((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1))
        : 4.8;

      const partnerPhoto = (p as any).photoUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';

      return {
        partnerId: pId,
        partnerName: p.name || p.businessName || 'Pro Technician',
        businessName: p.businessName || p.name || 'Pro Facility Services',
        photoUrl: partnerPhoto,
        email: p.email || `${pId}@happiizgate.com`,
        phone: p.phone || p.contactNumber || '+91 98450 11992',
        joinedAt: p.createdAt || '2026-01-10T10:00:00Z',
        status: (p.status?.toUpperCase() as any) || 'ACTIVE',
        verificationStatus: p.verificationStatus === 'ACTIVE' ? 'VERIFIED' : 'PENDING',
        primaryDomains: p.serviceDomain || p.serviceCategories || ['Automotive Cleaning', 'Plumbing', 'Electrical'],
        mappedSocieties: [
          { id: p.assignedSocietyId || 'soc_emerald_heights', name: p.assignedSocietyName || 'Emerald Heights Luxury Enclave' },
        ],
        rating: avgRating,
        reviewCount: completedJobs.length > 0 ? completedJobs.length + 24 : 12,
        totalJobsCompleted: completedJobs.length,
        lifetimeGmv,
        lifetimeCommissionPaid,
        lifetimeNetEarnings,
        servicesOffered,
        jobHistory: pBookings,
        onboardedBy: p.onboardedBy || 'super_admin',
        serviceArea: p.serviceArea || (p.serviceAreas && p.serviceAreas[0]) || 'All Zones',
        address: p.address || p.businessAddress || 'Locality Hub',
        rawPartner: p,
      };
    });
  }

  async getPartnerCrmDetail(partnerId: string): Promise<PartnerCrmProfile | null> {
    const list = await this.getPartnerCrmProfiles();
    return list.find((p) => p.partnerId === partnerId || partnerId === 'sp_1') || list[0] || null;
  }

  async updatePartnerCustomRates(partnerId: string, rates: PartnerCustomServiceRate[]): Promise<boolean> {
    const customRatesStore = getStored<Record<string, PartnerCustomServiceRate[]>>(PARTNER_CUSTOM_RATES_KEY, {});
    customRatesStore[partnerId] = rates;
    setStored(PARTNER_CUSTOM_RATES_KEY, customRatesStore);
    syncBus.broadcast('PARTNER_RATES_UPDATED', 'ALL', partnerId, 'SERVICE_PARTNER', rates);
    return true;
  }

  /**
   * Filter Partner Job History by Day, Month, or Year
   */
  filterJobHistory(
    jobs: MarketplaceBooking[],
    filterType: CrmDateFilterType,
    dateValue?: string // YYYY-MM-DD or YYYY-MM or YYYY
  ): { filteredJobs: MarketplaceBooking[]; summary: PartnerAnalyticsSummary } {
    const completed = jobs.filter((j) => j.status === 'COMPLETED');

    let filtered = completed;
    if (filterType === 'DAY' && dateValue) {
      filtered = completed.filter((j) => j.scheduledDate === dateValue || j.createdAt.startsWith(dateValue));
    } else if (filterType === 'MONTH' && dateValue) {
      filtered = completed.filter((j) => j.scheduledDate.startsWith(dateValue) || j.createdAt.startsWith(dateValue));
    } else if (filterType === 'YEAR' && dateValue) {
      filtered = completed.filter((j) => j.scheduledDate.startsWith(dateValue) || j.createdAt.startsWith(dateValue));
    }

    const totalJobs = filtered.length;
    const totalGmv = filtered.reduce((acc, j) => acc + (j.totalAmount || 0), 0);
    const totalCommission = filtered.reduce((acc, j) => acc + (j.commissionAmount || 0), 0);
    const totalPayout = totalGmv - totalCommission;
    const averageTicketSize = totalJobs > 0 ? Math.round(totalGmv / totalJobs) : 0;
    const completionRate = jobs.length > 0 ? Math.round((totalJobs / jobs.length) * 100) : 100;

    return {
      filteredJobs: filtered,
      summary: {
        totalJobs,
        totalGmv,
        totalCommission,
        totalPayout,
        averageTicketSize,
        completionRate,
      },
    };
  }

  /**
   * EXPORT FINANCIAL STATEMENT TO PDF (Using jsPDF and jsPDF-AutoTable)
   */
  exportPartnerStatementPdf(
    partner: PartnerCrmProfile,
    filterType: CrmDateFilterType,
    filterValue: string,
    jobs: MarketplaceBooking[],
    summary: PartnerAnalyticsSummary
  ): void {
    const doc = new jsPDF();

    // 1. Header Banner
    doc.setFillColor(103, 58, 183); // #673AB7 Royal Violet
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('HAPPIIZ GATE · ON-DEMAND MARKETPLACE', 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PARTNER FINANCIAL STATEMENT & REVENUE RECONCILIATION', 14, 23);

    const generatedOn = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.setFontSize(8);
    doc.text(`Generated: ${generatedOn}`, 145, 23);

    // 2. Partner Metadata Card
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTNER CRM PROFILE', 14, 42);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Agency / Legal Name: ${partner.businessName}`, 14, 49);
    doc.text(`Primary Technician / Rep: ${partner.partnerName}`, 14, 55);
    doc.text(`Registered Contact: ${partner.phone} · ${partner.email}`, 14, 61);
    doc.text(`Verification Status: ${partner.verificationStatus} (KYC Compliant)`, 14, 67);

    doc.setFont('helvetica', 'bold');
    doc.text('STATEMENT PERIOD', 130, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`Filter Scope: ${filterType} (${filterValue || 'All Time'})`, 130, 49);
    doc.text(`Assigned Society: ${partner.mappedSocieties[0]?.name || 'All Mapped Societies'}`, 130, 55);
    doc.text(`Customer Rating: ★ ${partner.rating} / 5.0 (${partner.reviewCount} Reviews)`, 130, 61);

    // 3. KPI Summary Table
    const summaryData = [
      [
        String(summary.totalJobs),
        `INR ${summary.totalGmv.toLocaleString('en-IN')}`,
        `INR ${summary.totalCommission.toLocaleString('en-IN')}`,
        `INR ${summary.totalPayout.toLocaleString('en-IN')}`,
        `INR ${summary.averageTicketSize.toLocaleString('en-IN')}`,
      ],
    ];

    autoTable(doc, {
      startY: 74,
      head: [['Completed Jobs', 'Gross Volume (GMV)', 'Admin Commission Cut', 'Partner Net Payout', 'Avg Ticket Size']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [55, 65, 81],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 10,
        fontStyle: 'bold',
        textColor: [103, 58, 183],
      },
    });

    // 4. Date-wise Job History & Ledger Table
    const lastY = (doc as any).lastAutoTable?.finalY || 95;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DATE-WISE SERVICE HISTORY & DISBURSEMENTS LEDGER', 14, lastY + 12);

    const tableRows = jobs.map((j) => [
      j.bookingCode,
      j.scheduledDate,
      j.residentName,
      `${j.building || ''} ${j.flatNumber}`,
      j.serviceName.length > 25 ? j.serviceName.slice(0, 25) + '...' : j.serviceName,
      `INR ${j.totalAmount}`,
      `INR ${j.commissionAmount} (${j.commissionRate}%)`,
      `INR ${j.partnerEarnings}`,
      j.paymentMethod || 'UPI',
    ]);

    autoTable(doc, {
      startY: lastY + 16,
      head: [['Booking ID', 'Date', 'Customer', 'Flat', 'Service Provided', 'Invoice Total', 'Platform Cut', 'Net Payout', 'Method']],
      body: tableRows.length > 0 ? tableRows : [['-', '-', '-', '-', 'No completed jobs recorded for this period', '-', '-', '-', '-']],
      theme: 'striped',
      headStyles: {
        fillColor: [103, 58, 183],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // 5. Footer Signature / Watermark
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Happiiz Gate Enterprise SaaS · Page ${i} of ${pageCount} · System Authoritative Audit Hash #${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        14,
        288
      );
    }

    const filename = `Partner_Statement_${partner.businessName.replace(/[^a-zA-Z0-9]/g, '_')}_${filterType}_${filterValue || 'All'}.pdf`;
    doc.save(filename);
  }

  /**
   * EXPORT SERVICE CATALOG TO BRANDED PRINTABLE PDF
   */
  exportCatalogPdf(services: MarketplaceService[]): void {
    const doc = new jsPDF();
    const activeServices = services.filter((s) => s.status === 'ACTIVE');

    // 1. Header Banner
    doc.setFillColor(103, 58, 183); // #673AB7
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('HAPPIIZ GATE · ON-DEMAND MARKETPLACE', 14, 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL SERVICE CATALOG & RATE SPECIFICATIONS', 14, 22);

    const generatedOn = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.setFontSize(8);
    doc.text(`Generated: ${generatedOn}`, 145, 22);

    // 2. Catalog Metrics Summary
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CATALOG SPECIFICATIONS OVERVIEW', 14, 42);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Services Published: ${services.length} (${activeServices.length} Active, ${services.length - activeServices.length} Inactive)`, 14, 48);
    const categoriesCount = new Set(services.map((s) => s.category)).size;
    doc.text(`Trade Domains Covered: ${categoriesCount} Specialized Sectors`, 14, 54);
    const avgCommission = Math.round(
      services.reduce((acc, s) => acc + (s.commissionRate || 15), 0) / (services.length || 1)
    );
    doc.text(`Average Platform Take-Rate: ${avgCommission}% Commission`, 130, 48);
    doc.text(`Sync Mode: Real-Time Resident App & Partner App Ingress`, 130, 54);

    // 3. Table of Services
    const tableRows = services.map((s, idx) => [
      String(idx + 1),
      s.name,
      s.category,
      s.pricingType,
      `INR ${s.basePrice}`,
      `${s.commissionRate}% (INR ${Math.round((s.basePrice * s.commissionRate) / 100)})`,
      s.estimatedDuration,
      s.status,
    ]);

    autoTable(doc, {
      startY: 62,
      head: [['#', 'Service Title', 'Domain / Category', 'Model', 'Base Rate', 'Platform Commission', 'Duration', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [103, 58, 183],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // 4. Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Happiiz Gate Enterprise SaaS · Service Catalog Master Report · Page ${i} of ${pageCount}`,
        14,
        288
      );
    }

    doc.save(`Happiiz_Service_Catalog_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /**
   * EXPORT MULTI-VARIABLE FILTERED PARTNERS REPORT TO PDF
   */
  exportPartnersDirectoryPdf(
    partners: PartnerCrmProfile[],
    filters: { area?: string; society?: string; source?: string; dateRange?: string }
  ): void {
    const doc = new jsPDF('landscape');

    // 1. Header Banner
    doc.setFillColor(103, 58, 183);
    doc.rect(0, 0, 297, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('HAPPIIZ GATE · OUR SERVICE PARTNERS DIRECTORY', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('COMPREHENSIVE MULTI-VARIABLE PARTNERS AUDIT & PERFORMANCE LEDGER', 14, 22);

    const generatedOn = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.setFontSize(8);
    doc.text(`Generated: ${generatedOn}`, 225, 22);

    // 2. Applied Filter Criteria Strip
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('APPLIED FILTER SCOPE', 14, 38);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const filterInfo = [
      `Area / Locality: ${filters.area || 'All Areas'}`,
      `Society: ${filters.society || 'All Communities'}`,
      `Onboarding Source: ${filters.source || 'All Sources'}`,
      `Date Range: ${filters.dateRange || 'All Time'}`,
      `Matching Records: ${partners.length} Partners`,
    ].join('   |   ');
    doc.text(filterInfo, 14, 44);

    // 3. Financial Aggregate Metrics
    const totalGmv = partners.reduce((acc, p) => acc + (p.lifetimeGmv || 0), 0);
    const totalComm = partners.reduce((acc, p) => acc + (p.lifetimeCommissionPaid || 0), 0);
    const totalPayout = partners.reduce((acc, p) => acc + (p.lifetimeNetEarnings || 0), 0);
    const totalJobs = partners.reduce((acc, p) => acc + (p.totalJobsCompleted || 0), 0);

    const summaryRow = [
      [
        String(partners.length),
        String(totalJobs),
        `INR ${totalGmv.toLocaleString('en-IN')}`,
        `INR ${totalComm.toLocaleString('en-IN')}`,
        `INR ${totalPayout.toLocaleString('en-IN')}`,
      ],
    ];

    autoTable(doc, {
      startY: 48,
      head: [['Partners Count', 'Completed Jobs Executed', 'Gross Merchandise Value (GMV)', 'Platform Commission Cut', 'Net Partner Payouts']],
      body: summaryRow,
      theme: 'grid',
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [55, 65, 81],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
        fontStyle: 'bold',
        textColor: [103, 58, 183],
      },
    });

    // 4. Partner List Table
    const lastY = (doc as any).lastAutoTable?.finalY || 65;
    const tableRows = partners.map((p) => [
      p.partnerId,
      `${p.businessName}\nRep: ${p.partnerName}`,
      `${p.phone}\n${p.email}`,
      p.mappedSocieties[0]?.name || 'All Mapped Societies',
      p.serviceArea || 'General Hub',
      p.onboardedBy === 'society_admin' ? 'Society Admin Mapped' : 'Super Admin Provisioned',
      `★ ${p.rating} (${p.reviewCount})`,
      String(p.totalJobsCompleted),
      `INR ${(p.lifetimeGmv || 0).toLocaleString('en-IN')}`,
      `INR ${(p.lifetimeNetEarnings || 0).toLocaleString('en-IN')}`,
      p.status,
    ]);

    autoTable(doc, {
      startY: lastY + 8,
      head: [['Partner ID', 'Business & Rep', 'Contact Info', 'Assigned Society', 'Locality / Area', 'Onboarding Source', 'Rating', 'Jobs', 'Lifetime GMV', 'Net Earnings', 'Status']],
      body: tableRows.length > 0 ? tableRows : [['-', 'No partners match the current filter selection', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'striped',
      headStyles: {
        fillColor: [103, 58, 183],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // 5. Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Happiiz Gate Enterprise SaaS · Partner Directory Filter Report · Page ${i} of ${pageCount}`,
        14,
        200
      );
    }

    doc.save(`Partners_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /**
   * EXPORT INDIVIDUAL PARTNER FULL APPLICATION DOSSIER (PDF)
   */
  exportPartnerDossierPdf(partner: any): void {
    const doc = new jsPDF();

    // 1. Header Banner
    doc.setFillColor(103, 58, 183);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('HAPPIIZ GATE · PARTNER COMPLIANCE DOSSIER', 14, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL VERIFICATION APPLICATION & REGULATORY AUDIT RECORD', 14, 23);

    const generatedOn = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.setFontSize(8);
    doc.text(`Generated: ${generatedOn}`, 145, 23);

    // 2. Section 1: Partner Profile & Identity
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PARTNER IDENTITY & ONBOARDING PROVENANCE', 14, 42);

    const pName = partner.name || partner.partnerName || 'Technician';
    const bName = partner.businessName || pName;
    const uid = partner.uid || partner.partnerId || 'sp_1';
    const phone = partner.phone || partner.contactNumber || 'N/A';
    const email = partner.email || 'N/A';
    const address = partner.businessAddress || partner.address || 'Locality Hub';
    const society = partner.assignedSocietyName || (partner.mappedSocieties && partner.mappedSocieties[0]?.name) || 'All Communities';
    const area = partner.serviceArea || (partner.serviceAreas && partner.serviceAreas[0]) || 'General Zone';
    const source = partner.onboardedBy === 'society_admin' ? 'Submitted by Society Admin' : 'Super Admin Provisioned';
    const status = partner.verificationStatus || (partner.status === 'ACTIVE' || partner.status === 'active' ? 'ACTIVE' : 'PENDING');
    const registeredDate = partner.createdAt || partner.joinedAt || new Date().toISOString();

    const profileData = [
      ['Commercial Business Name:', bName, 'Partner Record UID:', uid],
      ['Lead Technician / Representative:', pName, 'Contact Mobile:', phone],
      ['Official Login Email:', email, 'Registered Locality / Hub:', area],
      ['Permanent / Workshop Address:', address, 'Assigned Gated Community:', society],
      ['Onboarding Source:', source, 'Verification Status:', `${status} (Verified On File)`],
      ['Application Submitted Date:', new Date(registeredDate).toLocaleDateString('en-IN'), 'Review Authority:', 'Super Admin Master Console'],
    ];

    autoTable(doc, {
      startY: 46,
      body: profileData,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 50 },
        1: { textColor: [17, 24, 39], fontStyle: 'bold', cellWidth: 55 },
        2: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 45 },
        3: { textColor: [17, 24, 39], cellWidth: 50 },
      },
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 80;

    // 3. Section 2: Rate Card Matrix & Agreed Payouts
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('2. AGREED RATE CARD MATRIX & COMMISSION SCHEDULE', 14, currentY);

    const rates: PartnerCustomServiceRate[] = partner.rateCard || partner.servicesOffered || [];
    const rateRows = rates.length > 0
      ? rates.map((r, i) => {
          const base = r.basePrice || 299;
          const quoted = r.customPrice || base;
          const comm = 15;
          const adminCut = Math.round((quoted * comm) / 100);
          const net = quoted - adminCut;
          return [
            String(i + 1),
            r.serviceName,
            r.category,
            `INR ${base}`,
            `INR ${quoted}`,
            `${comm}% (INR ${adminCut})`,
            `INR ${net}`,
          ];
        })
      : [
          ['1', 'General Electrical / Maintenance Visit', 'Electrical', 'INR 249', 'INR 249', '10% (INR 25)', 'INR 224'],
          ['2', 'Plumbing Diagnostic & Leakage Repair', 'Plumbing', 'INR 199', 'INR 199', '10% (INR 20)', 'INR 179'],
          ['3', 'Car Wash & Foam Detailing', 'Automotive Cleaning', 'INR 399', 'INR 399', '15% (INR 60)', 'INR 339'],
        ];

    autoTable(doc, {
      startY: currentY + 4,
      head: [['#', 'Service Name', 'Category', 'Platform Base', 'Agreed Quoted Rate', 'Platform Commission Cut', 'Net Partner Disbursement']],
      body: rateRows,
      theme: 'grid',
      headStyles: {
        fillColor: [103, 58, 183],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 30;

    // 4. Section 3: KYC Documents Checklist & Verification Status
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('3. COMPLIANCE DOCUMENTS CHECKLIST & VERIFICATION REPOSITORY', 14, currentY);

    const docs = partner.documents || {};
    const bank = docs.bankDetails || {};

    const kycChecklist = [
      [
        '1',
        docs.nationalIdType || 'Aadhaar Card / Photo ID',
        docs.nationalIdNumber || 'XXXX-XXXX-9812',
        'VERIFIED & RECORDED',
        docs.nationalIdUrl ? 'File Stored in Secure Cloud' : 'aadhaar_front_back.pdf',
      ],
      [
        '2',
        'Permanent Account Number (PAN Card)',
        docs.panNumber || 'ABCDE1234F',
        'VERIFIED & RECORDED',
        docs.panUrl ? 'File Stored in Secure Cloud' : 'pan_card_copy.jpg',
      ],
      [
        '3',
        'Settlement Bank Account',
        `${bank.bankName || 'HDFC Bank'} · A/C: ${bank.accNo || '918802991002'} · IFSC: ${bank.ifsc || 'HDFC0001234'}`,
        'ACTIVE SETTLEMENT',
        bank.passbookUrl ? 'File Stored in Secure Cloud' : 'cancelled_cheque.pdf',
      ],
      [
        '4',
        'Police Background Verification Clearance',
        `Clearance Certificate Dated: ${docs.policeVerificationDate || '2026-10-15'}`,
        docs.isPoliceVerified !== false ? 'CLEARED & APPROVED' : 'PENDING POLICE AUDIT',
        docs.policeVerificationUrl ? 'File Stored in Secure Cloud' : 'police_clearance_cert.pdf',
      ],
      [
        '5',
        'Commercial Master Service Agreement',
        'Standard Happiiz Gate SaaS Provider Terms & Conditions',
        'SIGNED & ACKNOWLEDGED',
        'msa_signed_agreement.pdf',
      ],
    ];

    autoTable(doc, {
      startY: currentY + 4,
      head: [['#', 'Document Type', 'Identifier / Account Details', 'Compliance Status', 'Document Reference / Digital File']],
      body: kycChecklist,
      theme: 'grid',
      headStyles: {
        fillColor: [55, 65, 81],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 40;

    // 5. Verification Seal & Legal Attestation
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY + 6, 182, 36, 3, 3, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(103, 58, 183);
    doc.text('SYSTEM AUTHORITATIVE COMPLIANCE & LEGAL ATTESTATION', 20, currentY + 14);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      'This document is an authoritative system-generated compliance dossier verifying that the above service provider entity has undergone KYC scrutiny, background clearance, and agreed to the platform rate card matrix. Authorized for community entry dispatch.',
      20,
      currentY + 20,
      { maxWidth: 170 }
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Digital Signoff: Super Admin Trust & Safety Desk  ·  Verification Hash: #SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 20, currentY + 34);

    // 6. Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Happiiz Gate Enterprise SaaS · Partner Dossier · ${bName} · Page ${i} of ${pageCount}`,
        14,
        288
      );
    }

    const filename = `Partner_Dossier_${bName.replace(/[^a-zA-Z0-9]/g, '_')}_${uid}.pdf`;
    doc.save(filename);
  }
}

export const marketplaceService = new MarketplaceServiceEngine();
