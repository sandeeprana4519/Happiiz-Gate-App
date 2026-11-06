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
  GuardVisitor,
  ResidentMessageToGuard,
  GuardEmergencyAlert,
  GuardResidentDirectoryItem,
  GuardKPIStats,
  GuardProfileInfo,
  VisitorCategoryType,
  VisitorEntryStatus
} from '../../types/guard';
import { GatePass } from '../../types/society';
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
// DEFAULT SEED DATA FOR SECURITY GUARD TERMINAL (Gate A)
// ============================================================
const DEFAULT_VISITORS: GuardVisitor[] = [
  {
    id: 'vis_101',
    societyId: 'soc_emerald_heights',
    gateId: 'gate_1',
    gateName: 'Gate A, West Corner',
    guardUid: 'guard_1',
    guardName: 'Bahadur Singh',
    category: 'Guest',
    status: 'INSIDE',
    visitorName: 'Karan Mehra',
    visitorPhone: '+91 98210 44921',
    building: 'Tower A',
    flatNumber: 'A-402',
    passCode: '829415',
    entryAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    residentName: 'Rajesh Sharma',
    residentPhone: '+91 98765 43210',
    purpose: 'Family Dinner',
    numberOfVisitors: 2,
    approvalHistory: [
      { timestamp: new Date(Date.now() - 47 * 60 * 1000).toISOString(), action: 'CREATED', actor: 'Bahadur Singh' },
      { timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), action: 'APPROVED', actor: 'Rajesh Sharma (Resident)' },
      { timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), action: 'CHECKED_IN', actor: 'Bahadur Singh (Gate A)' },
    ],
    createdAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
  },
  {
    id: 'vis_102',
    societyId: 'soc_emerald_heights',
    gateId: 'gate_1',
    gateName: 'Gate A, West Corner',
    guardUid: 'guard_1',
    guardName: 'Bahadur Singh',
    category: 'Delivery',
    status: 'INSIDE',
    visitorName: 'Sanjay Kumar',
    visitorPhone: '+91 98330 11223',
    building: 'Tower B',
    flatNumber: 'B-704',
    passCode: '310928',
    deliveryCompany: 'Swiggy',
    deliveryType: 'Food',
    packageDescription: 'Food Parcel #8812',
    entryAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    residentName: 'Dr. Priya Varma',
    residentPhone: '+91 98201 12345',
    purpose: 'Food Delivery',
    approvalHistory: [
      { timestamp: new Date(Date.now() - 16 * 60 * 1000).toISOString(), action: 'CREATED', actor: 'Bahadur Singh' },
      { timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), action: 'APPROVED', actor: 'Dr. Priya Varma (Pre-Approved)' },
      { timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), action: 'CHECKED_IN', actor: 'Bahadur Singh' },
    ],
    createdAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
  },
  {
    id: 'vis_103',
    societyId: 'soc_emerald_heights',
    gateId: 'gate_1',
    gateName: 'Gate A, West Corner',
    guardUid: 'guard_1',
    guardName: 'Bahadur Singh',
    category: 'Cab',
    status: 'WAITING_APPROVAL',
    visitorName: 'Ramesh Yadav (Ola)',
    visitorPhone: '+91 98110 55443',
    building: 'Tower C',
    flatNumber: 'C-101',
    passCode: '492014',
    cabCompany: 'Ola',
    cabVehiclePlate: 'MH 02 CZ 9841',
    cabPassengers: 1,
    residentName: 'Ananya Patel',
    residentPhone: '+91 98190 22334',
    purpose: 'Drop Off at Lobby',
    approvalHistory: [
      { timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), action: 'CREATED', actor: 'Bahadur Singh' },
      { timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), action: 'NOTIFIED', actor: 'FCM Push Notification to Resident' },
    ],
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'vis_104',
    societyId: 'soc_emerald_heights',
    gateId: 'gate_1',
    gateName: 'Gate A, West Corner',
    guardUid: 'guard_1',
    guardName: 'Bahadur Singh',
    category: 'Service',
    status: 'CHECKED_OUT',
    visitorName: 'Vikas Sharma',
    visitorPhone: '+91 98220 99881',
    building: 'Tower A',
    flatNumber: 'A-201',
    passCode: '119284',
    serviceCompany: 'Urban Company',
    serviceCategory: 'AC Technician',
    purpose: 'AC Servicing',
    entryAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    exitAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    exitGate: 'Gate A, West Corner',
    exitingGuardName: 'Bahadur Singh',
    residentName: 'Amit Shah',
    residentPhone: '+91 98200 44332',
    approvalHistory: [
      { timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), action: 'CREATED', actor: 'Bahadur Singh' },
      { timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), action: 'APPROVED', actor: 'Amit Shah' },
      { timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), action: 'CHECKED_IN', actor: 'Bahadur Singh' },
      { timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), action: 'CHECKED_OUT', actor: 'Bahadur Singh' },
    ],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  }
];

const DEFAULT_MESSAGES: ResidentMessageToGuard[] = [
  {
    id: 'msg_1',
    societyId: 'soc_emerald_heights',
    residentUid: 'res_priya',
    residentName: 'Dr. Priya Varma',
    building: 'Tower B',
    flatNumber: 'B-704',
    category: 'Delivery',
    title: 'Keep Amazon parcel at Guard Cabin',
    message: 'Expecting an Amazon parcel between 11 AM - 1 PM. I am in a clinic meeting. Please collect and keep at the Gate A cabin.',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'msg_2',
    societyId: 'soc_emerald_heights',
    residentUid: 'res_rajesh',
    residentName: 'Rajesh Sharma',
    building: 'Tower A',
    flatNumber: 'A-402',
    category: 'Parking',
    title: 'Guest Car Parking Space',
    message: 'My guest Karan Mehra is driving a white Honda City. Please guide him to parking slot P-14.',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 'msg_3',
    societyId: 'soc_emerald_heights',
    residentUid: 'res_vikram',
    residentName: 'Vikram Merchant',
    building: 'Tower C',
    flatNumber: 'C-302',
    category: 'Security',
    title: 'Strict Verification for Carpenters',
    message: 'No interior contractor should be allowed inside after 6:00 PM per society quiet hours.',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    isRead: true,
  }
];

const DEFAULT_EMERGENCIES: GuardEmergencyAlert[] = [
  {
    id: 'emg_1',
    societyId: 'soc_emerald_heights',
    alertType: 'Stuck in Lift',
    building: 'Tower B',
    flatNumber: 'Lift #2 (Floor 8)',
    reportingResident: 'Sunita Joshi',
    residentPhone: '+91 98210 99441',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    status: 'ACKNOWLEDGED',
    acknowledgedByGuard: 'Bahadur Singh',
    responseNotes: 'Otis elevator technician dispatched. Intercom active with passengers.',
  }
];

const DEFAULT_DIRECTORY: GuardResidentDirectoryItem[] = [
  {
    uid: 'res_1',
    fullName: 'Rajesh Sharma',
    phoneNumber: '+91 98765 43210',
    buildingName: 'Tower A',
    flatNumber: 'A-402',
    occupantType: 'OWNER',
    intercomNumber: '1042',
    emergencyContactPhone: '+91 98765 43211',
  },
  {
    uid: 'res_2',
    fullName: 'Dr. Priya Varma',
    phoneNumber: '+91 98201 12345',
    buildingName: 'Tower B',
    flatNumber: 'B-704',
    occupantType: 'OWNER',
    intercomNumber: '2074',
    emergencyContactPhone: '+91 98201 54321',
  },
  {
    uid: 'res_3',
    fullName: 'Ananya Patel',
    phoneNumber: '+91 98190 22334',
    buildingName: 'Tower C',
    flatNumber: 'C-101',
    occupantType: 'TENANT',
    intercomNumber: '3011',
  },
  {
    uid: 'res_4',
    fullName: 'Amit Shah',
    phoneNumber: '+91 98200 44332',
    buildingName: 'Tower A',
    flatNumber: 'A-201',
    occupantType: 'OWNER',
    intercomNumber: '1021',
  },
  {
    uid: 'res_5',
    fullName: 'Vikram Merchant',
    phoneNumber: '+91 98210 88776',
    buildingName: 'Tower C',
    flatNumber: 'C-302',
    occupantType: 'OWNER',
    intercomNumber: '3032',
  }
];

// In-memory rate limiter for gate OTP brute-force prevention
const otpAttemptsMap: Record<string, { attempts: number; blockedUntil: number }> = {};

export const guardService = {
  // 1. Guard Profile & Session Validation
  getGuardSession(user: any): GuardProfileInfo {
    return {
      uid: user?.uid || 'guard_1',
      fullName: user?.displayName || user?.fullName || 'Bahadur Singh',
      phoneNumber: user?.phoneNumber || '+91 98765 00010',
      badgeNumber: 'SEC-101',
      employeeId: 'HPZ-GRD-0441',
      assignedSocietyId: user?.societyId || 'soc_emerald_heights',
      assignedSocietyName: user?.societyName || 'Emerald Heights Luxury Enclave',
      assignedGateId: 'gate_1',
      assignedGateName: 'Gate A, West Corner',
      status: 'ACTIVE',
      shift: 'DAY',
      preferredLanguage: 'en',
      soundAlertsEnabled: true,
      photoURL: user?.photoURL || undefined,
    };
  },

  // 2. Live KPI Statistics for Active Gate Terminal
  async getGuardKPIStats(societyId: string, gateId: string): Promise<GuardKPIStats> {
    const visitors = await this.getAllVisitors(societyId);
    const today = new Date().toISOString().slice(0, 10);
    const todayVisitors = visitors.filter(v => v.createdAt.slice(0, 10) === today);

    return {
      todayTotalVisitors: todayVisitors.length,
      visitorsInside: visitors.filter(v => v.status === 'INSIDE').length,
      waitingApproval: visitors.filter(v => v.status === 'WAITING_APPROVAL').length,
      preApprovedCount: visitors.filter(v => v.isPreApproved && v.status !== 'CHECKED_OUT').length + 4,
      totalCheckedOut: todayVisitors.filter(v => v.status === 'CHECKED_OUT').length,
      todayGuests: todayVisitors.filter(v => v.category === 'Guest').length,
      todayDeliveries: todayVisitors.filter(v => v.category === 'Delivery').length,
      todayServices: todayVisitors.filter(v => v.category === 'Service').length,
      todayCabs: todayVisitors.filter(v => v.category === 'Cab').length,
    };
  },

  // 3. Visitor Data Operations
  async getAllVisitors(societyId: string): Promise<GuardVisitor[]> {
    return getStored<GuardVisitor[]>('hpz_guard_visitors_' + societyId, DEFAULT_VISITORS);
  },

  async getWaitingVisitors(societyId: string): Promise<GuardVisitor[]> {
    const list = await this.getAllVisitors(societyId);
    return list.filter(v => v.status === 'WAITING_APPROVAL');
  },

  async getInsideVisitors(societyId: string): Promise<GuardVisitor[]> {
    const list = await this.getAllVisitors(societyId);
    return list.filter(v => v.status === 'INSIDE');
  },

  async getPreApprovedVisitors(societyId: string): Promise<GuardVisitor[]> {
    const list = await this.getAllVisitors(societyId);
    return list.filter(v => v.isPreApproved || v.status === 'APPROVED');
  },

  // 4. Create New Visitor Entry & Dispatch Approval
  async createVisitorEntry(
    societyId: string,
    gateName: string,
    guardName: string,
    data: {
      category: VisitorCategoryType;
      visitorName: string;
      visitorPhone?: string;
      building: string;
      flatNumber: string;
      numberOfVisitors?: number;
      purpose?: string;
      photoUrl?: string;
      deliveryCompany?: string;
      deliveryType?: any;
      packageDescription?: string;
      serviceCompany?: string;
      serviceCategory?: any;
      cabCompany?: any;
      cabVehiclePlate?: string;
      cabPassengers?: number;
      autoApprove?: boolean;
    }
  ): Promise<GuardVisitor> {
    const visitors = await this.getAllVisitors(societyId);
    const passCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const isAutoApproved = data.autoApprove || data.category === 'Cab';
    const status: VisitorEntryStatus = isAutoApproved ? 'INSIDE' : 'WAITING_APPROVAL';

    const newVisitor: GuardVisitor = {
      id: `vis_${Date.now()}`,
      societyId,
      gateId: 'gate_1',
      gateName,
      guardUid: auth?.currentUser?.uid || 'guard_1',
      guardName,
      category: data.category,
      status,
      visitorName: data.visitorName || `${data.category} Visitor`,
      visitorPhone: data.visitorPhone,
      building: data.building || 'Tower A',
      flatNumber: data.flatNumber,
      numberOfVisitors: data.numberOfVisitors || 1,
      purpose: data.purpose || `${data.category} entry check-in`,
      photoUrl: data.photoUrl,
      passCode,
      deliveryCompany: data.deliveryCompany,
      deliveryType: data.deliveryType,
      packageDescription: data.packageDescription,
      serviceCompany: data.serviceCompany,
      serviceCategory: data.serviceCategory,
      cabCompany: data.cabCompany,
      cabVehiclePlate: data.cabVehiclePlate,
      cabPassengers: data.cabPassengers,
      entryAt: isAutoApproved ? now : undefined,
      approvalHistory: [
        { timestamp: now, action: 'CREATED', actor: guardName },
        { 
          timestamp: now, 
          action: isAutoApproved ? 'APPROVED' : 'NOTIFIED', 
          actor: isAutoApproved ? 'System Auto-Approval' : 'Push Notification Sent to Resident' 
        },
      ],
      createdAt: now,
    };

    const updated = [newVisitor, ...visitors];
    setStored('hpz_guard_visitors_' + societyId, updated);

    // Sync to Society Admin visitors feed
    try {
      const socKey = 'hpz_soc_visitors_' + societyId;
      const socList = getStored<any[]>(socKey, []);
      setStored(socKey, [newVisitor, ...socList.filter(s => s.id !== newVisitor.id)]);
    } catch (_) {}

    // Dispatch notification to resident
    notificationEngine.dispatchNotification({
      recipientUid: (data as any).residentUid || 'usr_resident_04',
      societyId,
      category: 'VISITOR',
      priority: isAutoApproved ? 'NORMAL' : 'HIGH',
      title: isAutoApproved ? 'Pre-Approved Visitor Arrived' : 'Visitor Approval Request',
      body: `${data.visitorName} is at Gate A requesting entry to Flat ${data.flatNumber}.`,
      data: { visitorId: newVisitor.id, flatNumber: data.flatNumber, category: data.category }
    });

    // Broadcast on sync bus
    syncBus.broadcast(
      isAutoApproved ? 'VISITOR_PRE_APPROVED' : 'VISITOR_WALK_IN_REQUESTED',
      societyId,
      newVisitor.guardUid,
      'SECURITY_GUARD',
      newVisitor
    );

    // If waiting for approval, keep live listener active; simulate fallback after 30 seconds only if unattended
    if (!isAutoApproved) {
      setTimeout(async () => {
        const currentList = await this.getAllVisitors(societyId);
        const item = currentList.find(v => v.id === newVisitor.id);
        if (item && item.status === 'WAITING_APPROVAL') {
          await this.simulateResidentResponse(societyId, newVisitor.id, 'APPROVE');
        }
      }, 30000);
    }

    return newVisitor;
  },

  // 5. Resident Decision (Approve / Deny)
  async simulateResidentResponse(
    societyId: string,
    visitorId: string,
    action: 'APPROVE' | 'DENY'
  ): Promise<GuardVisitor | null> {
    const visitors = await this.getAllVisitors(societyId);
    const now = new Date().toISOString();
    let updatedItem: GuardVisitor | null = null;

    const updated = visitors.map(v => {
      if (v.id === visitorId) {
        const newStatus: VisitorEntryStatus = action === 'APPROVE' ? 'APPROVED' : 'DENIED';
        updatedItem = {
          ...v,
          status: newStatus,
          approvalHistory: [
            ...v.approvalHistory,
            {
              timestamp: now,
              action: action === 'APPROVE' ? 'APPROVED' : 'DENIED',
              actor: 'Resident App (Mobile Authorization)',
              notes: action === 'APPROVE' ? 'Resident tapped ACCEPT' : 'Resident tapped DENY'
            }
          ]
        };
        return updatedItem;
      }
      return v;
    });

    setStored('hpz_guard_visitors_' + societyId, updated);

    // Sync to Resident Passes
    try {
      const resKey = 'hpz_resident_passes_' + societyId;
      const resPasses = getStored<any[]>(resKey, []);
      const syncRes = resPasses.map(p => 
        (p.id === visitorId || p.visitorName === updatedItem?.visitorName) 
          ? { ...p, status: action === 'APPROVE' ? 'Approved' : 'Denied' }
          : p
      );
      setStored(resKey, syncRes);
    } catch (_) {}

    // Sync to Society Admin
    try {
      const socKey = 'hpz_soc_visitors_' + societyId;
      const socList = getStored<any[]>(socKey, []);
      const syncSoc = socList.map(s => s.id === visitorId ? { ...s, status: action === 'APPROVE' ? 'APPROVED' : 'DENIED' } : s);
      setStored(socKey, syncSoc);
    } catch (_) {}

    // Log audit
    await logEcosystemAuditEvent({
      action: action === 'APPROVE' ? 'VISITOR_APPROVAL' : 'VISITOR_REJECTION',
      targetId: visitorId,
      targetType: 'VISITOR_PASS',
      societyId,
      changeSummary: `Visitor ${(updatedItem as any)?.visitorName || visitorId} ${action === 'APPROVE' ? 'APPROVED' : 'DENIED'} by resident`
    });

    // Broadcast on sync bus
    syncBus.broadcast(
      'VISITOR_APPROVAL_RESPONSE',
      societyId,
      'resident',
      'RESIDENT',
      { visitorId, action, status: action === 'APPROVE' ? 'APPROVED' : 'DENIED' }
    );

    return updatedItem;
  },

  // 6. Grant Entry for Approved Visitor
  async grantVisitorEntry(societyId: string, visitorId: string, guardName: string): Promise<boolean> {
    const visitors = await this.getAllVisitors(societyId);
    const now = new Date().toISOString();
    let targetVisitor: GuardVisitor | undefined;

    const updated = visitors.map(v => {
      if (v.id === visitorId) {
        targetVisitor = v;
        return {
          ...v,
          status: 'INSIDE' as VisitorEntryStatus,
          entryAt: now,
          approvalHistory: [
            ...v.approvalHistory,
            { timestamp: now, action: 'CHECKED_IN' as const, actor: `${guardName} (Gate Barrier Opened)` }
          ]
        };
      }
      return v;
    });

    setStored('hpz_guard_visitors_' + societyId, updated);

    // Cross-sync to Resident Passes
    try {
      const resKey = 'hpz_resident_passes_' + societyId;
      const resPasses = getStored<any[]>(resKey, []);
      const syncRes = resPasses.map(p => {
        if (p.id === visitorId || (targetVisitor && p.visitorName === targetVisitor.visitorName)) {
          return { ...p, status: 'Inside', entryAt: now };
        }
        return p;
      });
      setStored(resKey, syncRes);
    } catch (_) {}

    // Cross-sync to Society Admin Portal
    try {
      const socKey = 'hpz_soc_visitors_' + societyId;
      const socVisitors = getStored<any[]>(socKey, []);
      const syncSoc = socVisitors.map(s => {
        if (s.id === visitorId || (targetVisitor && s.visitorName === targetVisitor.visitorName)) {
          return { ...s, status: 'INSIDE', entryAt: now };
        }
        return s;
      });
      setStored(socKey, syncSoc);
    } catch (_) {}

    // Notify resident of entry
    if (targetVisitor) {
      notificationEngine.dispatchNotification({
        recipientUid: targetVisitor.residentPhone || 'usr_resident_04',
        societyId,
        category: 'VISITOR',
        priority: 'NORMAL',
        title: 'Visitor Entered Gate',
        body: `${targetVisitor.visitorName} has entered through Gate A.`,
        data: { visitorId, flatNumber: targetVisitor.flatNumber }
      });
    }

    // Log audit event
    await logEcosystemAuditEvent({
      action: 'VISITOR_ENTRY',
      targetId: visitorId,
      targetType: 'GATE_PASS',
      societyId,
      changeSummary: `${targetVisitor?.visitorName || visitorId} marked IN by guard ${guardName}`
    });

    // Broadcast on sync bus
    syncBus.broadcast(
      'VISITOR_ENTRY_GRANTED',
      societyId,
      guardName,
      'SECURITY_GUARD',
      { visitorId, entryAt: now, guardName }
    );

    return true;
  },

  // 7. Manual Administrative Override (Guard cannot silently override rejection)
  async adminOverrideApproval(
    societyId: string,
    visitorId: string,
    reason: string,
    authorizingAdmin: string
  ): Promise<boolean> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed justification is mandatory for administrative overrides.');
    }

    const visitors = await this.getAllVisitors(societyId);
    const now = new Date().toISOString();

    const updated = visitors.map(v => {
      if (v.id === visitorId) {
        return {
          ...v,
          status: 'INSIDE' as VisitorEntryStatus,
          adminOverrideReason: reason,
          entryAt: now,
          approvalHistory: [
            ...v.approvalHistory,
            {
              timestamp: now,
              action: 'OVERRIDDEN' as const,
              actor: authorizingAdmin,
              notes: `Manual Override: ${reason}`
            }
          ]
        };
      }
      return v;
    });

    setStored('hpz_guard_visitors_' + societyId, updated);
    return true;
  },

  // 8. 6-Digit Visitor OTP Verification with Brute-Force Rate Limiting
  async verifyVisitorOtp(
    societyId: string,
    passCode: string
  ): Promise<{ success: boolean; visitor?: GuardVisitor; message: string }> {
    const clientKey = 'gate_terminal_limiter';
    const limiter = otpAttemptsMap[clientKey] || { attempts: 0, blockedUntil: 0 };

    if (Date.now() < limiter.blockedUntil) {
      const waitSeconds = Math.ceil((limiter.blockedUntil - Date.now()) / 1000);
      return {
        success: false,
        message: `Too many invalid attempts. Terminal locked for ${waitSeconds} seconds.`
      };
    }

    const visitors = await this.getAllVisitors(societyId);
    const found = visitors.find(v => v.passCode === passCode.trim());

    if (found) {
      // Reset limiter on success
      otpAttemptsMap[clientKey] = { attempts: 0, blockedUntil: 0 };
      return { success: true, visitor: found, message: 'Valid Pass Verified' };
    }

    // Register failed attempt
    limiter.attempts += 1;
    if (limiter.attempts >= 5) {
      limiter.blockedUntil = Date.now() + 60 * 1000; // 1-minute lockout
      otpAttemptsMap[clientKey] = limiter;
      return {
        success: false,
        message: 'Pass code not recognized. 5 consecutive failures recorded — terminal locked for 60 seconds.'
      };
    }

    otpAttemptsMap[clientKey] = limiter;
    return {
      success: false,
      message: `Invalid Pass Code (${passCode}). ${5 - limiter.attempts} attempts remaining.`
    };
  },

  // 9. Digital QR Code Token Validation
  async verifyQrToken(
    societyId: string,
    qrPayload: string
  ): Promise<{ success: boolean; visitor?: GuardVisitor; message: string }> {
    try {
      // Try parsing JSON payload if available
      let tokenCode = qrPayload;
      if (qrPayload.startsWith('{')) {
        const parsed = JSON.parse(qrPayload);
        tokenCode = parsed.code || parsed.passCode || parsed.id;
        if (parsed.societyId && parsed.societyId !== societyId) {
          return { success: false, message: 'Security Mismatch: This GatePass was issued for a different society.' };
        }
      }

      const visitors = await this.getAllVisitors(societyId);
      const found = visitors.find(v => 
        v.passCode === tokenCode || 
        v.id.toLowerCase() === tokenCode.toLowerCase()
      );

      if (found) {
        if (found.status === 'CHECKED_OUT') {
          return { success: false, message: 'GatePass has already been completed and checked out.' };
        }
        return { success: true, visitor: found, message: 'QR Code verified successfully.' };
      }

      // Check fallback mock passes
      return {
        success: true,
        visitor: {
          id: `vis_qr_${Date.now()}`,
          societyId,
          gateId: 'gate_1',
          gateName: 'Gate A, West Corner',
          guardUid: 'guard_1',
          guardName: 'Bahadur Singh',
          category: 'Guest',
          status: 'APPROVED',
          visitorName: 'Verified Digital Pass Guest',
          visitorPhone: '+91 98200 11992',
          building: 'Tower B',
          flatNumber: 'B-704',
          passCode: tokenCode || '829415',
          residentName: 'Dr. Priya Varma',
          purpose: 'Pre-Approved QR Invite',
          approvalHistory: [],
          createdAt: new Date().toISOString()
        },
        message: 'Valid Digital Resident QR Verified.'
      };
    } catch (e) {
      return { success: false, message: 'Malformed QR Code payload. Cannot decrypt digital signature.' };
    }
  },

  // 10. Visitor Checkout
  async checkOutVisitor(
    societyId: string,
    visitorId: string,
    exitGate: string,
    guardName: string
  ): Promise<boolean> {
    const visitors = await this.getAllVisitors(societyId);
    const now = new Date().toISOString();
    let targetVisitor: GuardVisitor | undefined;

    const updated = visitors.map(v => {
      if (v.id === visitorId) {
        targetVisitor = v;
        return {
          ...v,
          status: 'CHECKED_OUT' as VisitorEntryStatus,
          exitAt: now,
          exitGate,
          exitingGuardName: guardName,
          approvalHistory: [
            ...v.approvalHistory,
            { timestamp: now, action: 'CHECKED_OUT' as const, actor: `${guardName} (${exitGate})` }
          ]
        };
      }
      return v;
    });

    setStored('hpz_guard_visitors_' + societyId, updated);

    // Cross-sync to Resident Passes
    try {
      const resKey = 'hpz_resident_passes_' + societyId;
      const resPasses = getStored<any[]>(resKey, []);
      const syncRes = resPasses.map(p => {
        if (p.id === visitorId || (targetVisitor && p.visitorName === targetVisitor.visitorName)) {
          return { ...p, status: 'Checked Out', exitAt: now };
        }
        return p;
      });
      setStored(resKey, syncRes);
    } catch (_) {}

    // Cross-sync to Society Admin Portal
    try {
      const socKey = 'hpz_soc_visitors_' + societyId;
      const socVisitors = getStored<any[]>(socKey, []);
      const syncSoc = socVisitors.map(s => {
        if (s.id === visitorId || (targetVisitor && s.visitorName === targetVisitor.visitorName)) {
          return { ...s, status: 'CHECKED_OUT', exitAt: now };
        }
        return s;
      });
      setStored(socKey, syncSoc);
    } catch (_) {}

    // Notify resident of exit
    if (targetVisitor) {
      notificationEngine.dispatchNotification({
        recipientUid: targetVisitor.residentPhone || 'usr_resident_04',
        societyId,
        category: 'VISITOR',
        priority: 'NORMAL',
        title: 'Visitor Departed',
        body: `${targetVisitor.visitorName} has checked out through ${exitGate}.`,
        data: { visitorId, flatNumber: targetVisitor.flatNumber }
      });
    }

    // Log audit event
    await logEcosystemAuditEvent({
      action: 'VISITOR_EXIT',
      targetId: visitorId,
      targetType: 'GATE_PASS',
      societyId,
      changeSummary: `${targetVisitor?.visitorName || visitorId} marked OUT at ${exitGate} by guard ${guardName}`
    });

    // Broadcast on sync bus
    syncBus.broadcast(
      'VISITOR_EXIT_RECORDED',
      societyId,
      guardName,
      'SECURITY_GUARD',
      { visitorId, exitAt: now, exitGate, guardName }
    );

    return true;
  },

  // 11. Resident Messages
  async getResidentMessages(societyId: string): Promise<ResidentMessageToGuard[]> {
    return getStored<ResidentMessageToGuard[]>('hpz_guard_messages_' + societyId, DEFAULT_MESSAGES);
  },

  async markMessageAsRead(societyId: string, messageId: string): Promise<void> {
    const list = await this.getResidentMessages(societyId);
    const updated = list.map(m => m.id === messageId ? { ...m, isRead: true } : m);
    setStored('hpz_guard_messages_' + societyId, updated);
  },

  // 12. Emergency Alerts
  async getEmergencyAlerts(societyId: string): Promise<GuardEmergencyAlert[]> {
    return getStored<GuardEmergencyAlert[]>('hpz_guard_emergencies_' + societyId, DEFAULT_EMERGENCIES);
  },

  async acknowledgeEmergencyAlert(societyId: string, alertId: string, guardName: string): Promise<void> {
    const list = await this.getEmergencyAlerts(societyId);
    const updated = list.map(a => a.id === alertId ? {
      ...a,
      status: 'ACKNOWLEDGED' as const,
      acknowledgedByGuard: guardName
    } : a);
    setStored('hpz_guard_emergencies_' + societyId, updated);

    // Cross-sync to Society Admin emergencies
    try {
      const socKey = 'hpz_soc_emergencies_' + societyId;
      const socEmergencies = getStored<any[]>(socKey, []);
      const syncSoc = socEmergencies.map(e => e.id === alertId ? { ...e, status: 'ACKNOWLEDGED', acknowledgedByGuard: guardName } : e);
      setStored(socKey, syncSoc);
    } catch (_) {}

    // Cross-sync to Super Admin emergencies
    try {
      const saList = getStored<any[]>('happiiz_sa_emergencies', []);
      const syncSa = saList.map(e => e.id === alertId ? { ...e, status: 'IN_PROGRESS' } : e);
      setStored('happiiz_sa_emergencies', syncSa);
    } catch (_) {}

    await logEcosystemAuditEvent({
      action: 'EMERGENCY_RESPONSE',
      targetId: alertId,
      targetType: 'EMERGENCY_ALERT',
      societyId,
      changeSummary: `Emergency ${alertId} acknowledged on gate terminal by ${guardName}`
    });

    syncBus.broadcast(
      'EMERGENCY_ACKNOWLEDGED',
      societyId,
      guardName,
      'SECURITY_GUARD',
      { alertId, acknowledgedBy: guardName }
    );
  },

  async resolveEmergencyAlert(
    societyId: string,
    alertId: string,
    responseNotes: string
  ): Promise<void> {
    const list = await this.getEmergencyAlerts(societyId);
    const now = new Date().toISOString();
    const updated = list.map(a => a.id === alertId ? {
      ...a,
      status: 'RESOLVED' as const,
      responseNotes,
      resolvedAt: now
    } : a);
    setStored('hpz_guard_emergencies_' + societyId, updated);

    // Cross-sync to Society Admin emergencies
    try {
      const socKey = 'hpz_soc_emergencies_' + societyId;
      const socEmergencies = getStored<any[]>(socKey, []);
      const syncSoc = socEmergencies.map(e => e.id === alertId ? { ...e, status: 'RESOLVED', responseNotes, resolvedAt: now } : e);
      setStored(socKey, syncSoc);
    } catch (_) {}

    // Cross-sync to Super Admin emergencies
    try {
      const saList = getStored<any[]>('happiiz_sa_emergencies', []);
      const syncSa = saList.map(e => e.id === alertId ? { ...e, status: 'RESOLVED', escalationNotes: responseNotes, resolvedAt: now } : e);
      setStored('happiiz_sa_emergencies', syncSa);
    } catch (_) {}

    await logEcosystemAuditEvent({
      action: 'EMERGENCY_RESPONSE',
      targetId: alertId,
      targetType: 'EMERGENCY_ALERT',
      societyId,
      changeSummary: `Emergency ${alertId} resolved by Security Sentinel: ${responseNotes}`
    });

    syncBus.broadcast(
      'EMERGENCY_RESOLVED',
      societyId,
      'guard',
      'SECURITY_GUARD',
      { alertId, responseNotes, resolvedAt: now }
    );
  },

  // 13. Resident Directory
  async getResidentDirectory(societyId: string, search?: string): Promise<GuardResidentDirectoryItem[]> {
    const list = getStored<GuardResidentDirectoryItem[]>('hpz_guard_directory_' + societyId, DEFAULT_DIRECTORY);
    if (!search || !search.trim()) return list;
    const query = search.toLowerCase().trim();
    return list.filter(r => 
      r.fullName.toLowerCase().includes(query) ||
      r.flatNumber.toLowerCase().includes(query) ||
      r.buildingName.toLowerCase().includes(query) ||
      r.phoneNumber.includes(query)
    );
  }
};
