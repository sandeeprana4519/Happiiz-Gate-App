/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { db } from './init';
import {
  AnprRecognitionResponse,
  AnprRetentionPolicy,
  AnprScanOutcome,
  AnprScanRecord,
  AnprVehicleRecord,
  BarrierControlConfig,
  CameraStreamAdapter,
  GateCameraConfig,
  UnknownVehicleRecord,
  VehicleGateStatus,
  VehicleMatchResult,
  VehicleMovementDirection,
  VehicleMovementRecord,
  VehicleMovementSource,
  VehicleMovementVerificationStatus,
  VehicleRegistrationStatus,
} from '../../types/anpr';
import { SocietyVehicle } from '../../types/societyAdmin';
import {
  DEFAULT_CONFIDENCE_THRESHOLD,
  generateIndianOcrAmbiguityCandidates,
  normalizeIndianPlate,
} from '../../utils/indianPlateNormalizer';
import { notificationEngine } from './notification.service';
import { logEcosystemAuditEvent } from './audit.service';
import { syncBus } from './sync.service';

// ============================================================
// STORAGE KEYS & HELPERS
// ============================================================
const VEH_KEY = (societyId: string) => `hpz_soc_veh_${societyId}`;
const MOV_KEY = (societyId: string) => `hpz_anpr_movements_${societyId}`;
const SCAN_KEY = (societyId: string) => `hpz_anpr_scans_${societyId}`;
const UNK_KEY = (societyId: string) => `hpz_anpr_unknown_${societyId}`;
const CAM_KEY = (societyId: string) => `hpz_anpr_cameras_${societyId}`;
const BARRIER_KEY = (societyId: string) => `hpz_anpr_barrier_${societyId}`;
const RETENTION_KEY = (societyId: string) => `hpz_anpr_retention_${societyId}`;

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
// NORMALIZE LEGACY & ANPR VEHICLE RECORDS INTO UNIFIED SCHEMA
// ============================================================
export function toUnifiedAnprVehicle(
  raw: Partial<SocietyVehicle & AnprVehicleRecord>,
  societyId: string
): AnprVehicleRecord {
  const plate = (raw.registrationNumber || raw.plateNumber || '').trim().toUpperCase();
  const normalized = normalizeIndianPlate(raw.normalizedRegistrationNumber || plate);
  const now = new Date().toISOString();
  const brandParts = (raw.makeModel || '').split(' ');
  const inferredBrand = raw.vehicleBrand || brandParts[0] || '';
  const inferredModel = raw.vehicleModel || brandParts.slice(1).join(' ') || '';

  return {
    id: raw.id || raw.vehicleId || `veh_${Date.now()}`,
    vehicleId: raw.vehicleId || raw.id || `veh_${Date.now()}`,
    registrationNumber: plate,
    plateNumber: plate,
    normalizedRegistrationNumber: normalized,
    ownerName: raw.ownerName || 'Registered Resident',
    ownerUserId: raw.ownerUserId,
    societyId: raw.societyId || societyId,
    buildingId: raw.buildingId,
    buildingName: raw.buildingName,
    flatId: raw.flatId || 'flat_unassigned',
    flatNumber: raw.flatNumber || 'Unassigned',
    vehicleType: raw.vehicleType || 'Car',
    vehicleBrand: inferredBrand,
    vehicleModel: inferredModel,
    makeModel:
      raw.makeModel ||
      [raw.vehicleBrand, raw.vehicleModel, raw.vehicleColor].filter(Boolean).join(' ') ||
      'Private Vehicle',
    vehicleColor: raw.vehicleColor,
    vehicleImage: raw.vehicleImage,
    parkingSlot: raw.parkingSlot || 'P-OPEN',
    registrationStatus: (raw.registrationStatus as VehicleRegistrationStatus) || 'ACTIVE',
    currentGateStatus: (raw.currentGateStatus as VehicleGateStatus) || 'OUTSIDE',
    lastMovementId: raw.lastMovementId,
    lastEntryAt: raw.lastEntryAt,
    lastExitAt: raw.lastExitAt,
    lastGateId: raw.lastGateId,
    lastGateName: raw.lastGateName,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}

// ============================================================
// SEED DATA PER SOCIETY (STRICT MULTI-SOCIETY ISOLATION)
// ============================================================
function getDefaultVehiclesForSociety(societyId: string): AnprVehicleRecord[] {
  if (societyId === 'soc_emerald_heights') {
    const today = new Date();
    const twoHoursAgo = new Date(today.getTime() - 2 * 3600 * 1000).toISOString();
    const yesterday = new Date(today.getTime() - 22 * 3600 * 1000).toISOString();

    return [
      {
        id: 'veh_1',
        vehicleId: 'veh_1',
        registrationNumber: 'KA-05-MM-9011',
        normalizedRegistrationNumber: 'KA05MM9011',
        ownerName: 'Dr. Priya Varma',
        ownerUserId: 'usr_resident_04',
        societyId: 'soc_emerald_heights',
        buildingId: 'bld_tower_b',
        buildingName: 'Tower B',
        flatId: 'flat_b_704',
        flatNumber: 'B-704',
        vehicleType: 'EV',
        vehicleBrand: 'Hyundai',
        vehicleModel: 'Ioniq 5',
        makeModel: 'Hyundai Ioniq 5 (Midnight Blue)',
        vehicleColor: 'Midnight Blue',
        parkingSlot: 'P-704A',
        registrationStatus: 'ACTIVE',
        currentGateStatus: 'INSIDE',
        lastMovementId: 'mov_seed_1',
        lastEntryAt: twoHoursAgo,
        lastGateId: 'gate_1',
        lastGateName: 'Gate #1 (North Main)',
        createdAt: '2026-02-18T12:00:00Z',
        updatedAt: twoHoursAgo,
      },
      {
        id: 'veh_2',
        vehicleId: 'veh_2',
        registrationNumber: 'KA-01-AB-1234',
        normalizedRegistrationNumber: 'KA01AB1234',
        ownerName: 'Rahul Khanna',
        ownerUserId: 'usr_res_102',
        societyId: 'soc_emerald_heights',
        buildingId: 'bld_tower_a',
        buildingName: 'Tower A',
        flatId: 'flat_a_402',
        flatNumber: 'A-402',
        vehicleType: 'Car',
        vehicleBrand: 'Honda',
        vehicleModel: 'City VX',
        makeModel: 'Honda City White',
        vehicleColor: 'Platinum White',
        parkingSlot: 'P-402',
        registrationStatus: 'ACTIVE',
        currentGateStatus: 'OUTSIDE',
        lastExitAt: yesterday,
        lastGateId: 'gate_1',
        lastGateName: 'Gate #1 (North Main)',
        createdAt: '2026-03-04T15:30:00Z',
        updatedAt: yesterday,
      },
      {
        id: 'veh_3',
        vehicleId: 'veh_3',
        registrationNumber: 'DL-8C-AF-1234',
        normalizedRegistrationNumber: 'DL8CAF1234',
        ownerName: 'Sunil Sharma',
        ownerUserId: 'usr_res_101',
        societyId: 'soc_emerald_heights',
        buildingId: 'bld_tower_a',
        buildingName: 'Tower A',
        flatId: 'flat_a_101',
        flatNumber: 'A-101',
        vehicleType: 'Car',
        vehicleBrand: 'Tata',
        vehicleModel: 'Harrier XZ',
        makeModel: 'Tata Harrier Dark Edition',
        vehicleColor: 'Oberon Black',
        parkingSlot: 'P-101',
        registrationStatus: 'ACTIVE',
        currentGateStatus: 'OUTSIDE',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z',
      },
      {
        id: 'veh_4',
        vehicleId: 'veh_4',
        registrationNumber: 'MH-12-AB-1234',
        normalizedRegistrationNumber: 'MH12AB1234',
        ownerName: 'Dr. Priya Varma',
        ownerUserId: 'usr_resident_04',
        societyId: 'soc_emerald_heights',
        buildingId: 'bld_tower_b',
        buildingName: 'Tower B',
        flatId: 'flat_b_704',
        flatNumber: 'B-704',
        vehicleType: 'Motorcycle',
        vehicleBrand: 'Royal Enfield',
        vehicleModel: 'Classic 350',
        makeModel: 'Royal Enfield Classic 350',
        vehicleColor: 'Signals Marsh Grey',
        parkingSlot: 'P-704B',
        registrationStatus: 'ACTIVE',
        currentGateStatus: 'OUTSIDE',
        createdAt: '2026-04-02T11:00:00Z',
        updatedAt: '2026-04-02T11:00:00Z',
      },
      {
        id: 'veh_5',
        vehicleId: 'veh_5',
        registrationNumber: 'HR-26-DK-8337',
        normalizedRegistrationNumber: 'HR26DK8337',
        ownerName: 'Kavita Menon',
        ownerUserId: 'usr_res_105',
        societyId: 'soc_emerald_heights',
        buildingId: 'bld_tower_b',
        buildingName: 'Tower B',
        flatId: 'flat_b_203',
        flatNumber: 'B-203',
        vehicleType: 'Car',
        vehicleBrand: 'Maruti Suzuki',
        vehicleModel: 'Grand Vitara',
        makeModel: 'Maruti Grand Vitara Silver',
        vehicleColor: 'Splendid Silver',
        parkingSlot: 'P-203',
        registrationStatus: 'INACTIVE',
        currentGateStatus: 'OUTSIDE',
        createdAt: '2026-04-12T08:00:00Z',
        updatedAt: '2026-10-18T14:20:00Z',
      },
    ];
  }

  // Distinct isolated registry for any other society (e.g. soc_green_valley)
  return [
    {
      id: `veh_${societyId}_1`,
      vehicleId: `veh_${societyId}_1`,
      registrationNumber: 'UP-16-CD-5678',
      normalizedRegistrationNumber: 'UP16CD5678',
      ownerName: 'Amitabh Kulkarni',
      ownerUserId: `usr_res_${societyId}_1`,
      societyId,
      buildingName: 'Block 1',
      flatId: 'flat_gv_101',
      flatNumber: 'G-101',
      vehicleType: 'Car',
      vehicleBrand: 'Mahindra',
      vehicleModel: 'XUV700',
      makeModel: 'Mahindra XUV700 White',
      vehicleColor: 'Everest White',
      parkingSlot: 'GV-01',
      registrationStatus: 'ACTIVE',
      currentGateStatus: 'OUTSIDE',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
    },
  ];
}

function getDefaultMovementsForSociety(societyId: string): VehicleMovementRecord[] {
  if (societyId !== 'soc_emerald_heights') return [];
  const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  return [
    {
      movementId: 'mov_seed_1',
      societyId: 'soc_emerald_heights',
      vehicleId: 'veh_1',
      registrationNumber: 'KA-05-MM-9011',
      normalizedRegistrationNumber: 'KA05MM9011',
      ownerUserId: 'usr_resident_04',
      ownerName: 'Dr. Priya Varma',
      buildingId: 'bld_tower_b',
      buildingName: 'Tower B',
      flatId: 'flat_b_704',
      flatNumber: 'B-704',
      gateId: 'gate_1',
      gateName: 'Gate #1 (North Main)',
      guardUserId: 'dev_user_guard_919876500010',
      guardName: 'Bahadur Singh',
      direction: 'IN',
      recognizedNumber: 'KA05MM9011',
      confidenceScore: 97,
      verificationStatus: 'VERIFIED_REGISTERED',
      timestamp: twoHoursAgo,
      source: 'ANPR_CAMERA',
      createdAt: twoHoursAgo,
    },
  ];
}

function getDefaultScansForSociety(societyId: string): AnprScanRecord[] {
  if (societyId !== 'soc_emerald_heights') return [];
  const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  return [
    {
      scanId: 'scan_seed_1',
      societyId: 'soc_emerald_heights',
      gateId: 'gate_1',
      gateName: 'Gate #1 (North Main)',
      guardUserId: 'dev_user_guard_919876500010',
      guardName: 'Bahadur Singh',
      provider: 'gemini_vision',
      rawPlateText: 'KA 05 MM 9011',
      normalizedPlate: 'KA05MM9011',
      confidenceScore: 97,
      outcome: 'MATCHED_ACTIVE',
      matchedVehicleId: 'veh_1',
      matchedFlatNumber: 'B-704',
      matchedOwnerName: 'Dr. Priya Varma',
      movementId: 'mov_seed_1',
      timestamp: twoHoursAgo,
      createdAt: twoHoursAgo,
    },
  ];
}

function getDefaultCameras(societyId: string): GateCameraConfig[] {
  return [
    {
      id: `cam_${societyId}_1`,
      societyId,
      gateId: 'gate_1',
      gateName: 'Gate #1 (North Main)',
      cameraLabel: 'North Entry Mobile PWA + ANPR',
      streamType: 'MOBILE_PWA_CAMERA',
      connectionStatus: 'ACTIVE_MOBILE',
      anprEnabled: true,
      assignedGuardIds: ['guard_1', 'dev_user_guard_919876500010', 'Bahadur Singh'],
      updatedAt: new Date().toISOString(),
    },
    {
      id: `cam_${societyId}_2`,
      societyId,
      gateId: 'gate_2',
      gateName: 'Gate #2 (East Commercial & Deliveries)',
      cameraLabel: 'East Boom Lane Fixed IP Camera (RTSP Adapter)',
      streamType: 'RTSP_IP_CAMERA',
      streamUrl: '',
      connectionStatus: 'AWAITING_HARDWARE',
      anprEnabled: true,
      assignedGuardIds: ['guard_2'],
      updatedAt: new Date().toISOString(),
    },
  ];
}

// ============================================================
// FUTURE-READY CAMERA STREAM ADAPTER (RTSP / ONVIF / IP CCTV)
// ============================================================
export class RtspOnvifCameraAdapterStub implements CameraStreamAdapter {
  readonly adapterType: GateCameraConfig['streamType'];
  readonly label: string;
  private readonly streamUrl?: string;

  constructor(config: GateCameraConfig) {
    this.adapterType = config.streamType;
    this.label = config.cameraLabel;
    this.streamUrl = config.streamUrl;
  }

  async isConnected(): Promise<boolean> {
    // Fixed RTSP/ONVIF hardware bridge requires local edge gateway URL
    return Boolean(this.streamUrl && this.streamUrl.startsWith('http'));
  }

  async captureFrameBase64(): Promise<{ base64: string; mimeType: string } | null> {
    // Intentionally never simulates fake camera frames; awaits hardware bridge
    return null;
  }
}

// ============================================================
// ANPR & VEHICLE SERVICE IMPLEMENTATION
// ============================================================
export const anprService = {
  // 1. Call Server-Side Trusted AI ANPR Endpoint
  async recognizeVehiclePlate(
    imageBase64: string,
    mimeType: string,
    options: { minConfidence?: number; signal?: AbortSignal } = {}
  ): Promise<AnprRecognitionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const onExternalAbort = () => controller.abort();
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        throw new Error('Scan cancelled by guard.');
      }
      options.signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const response = await fetch('/api/anpr/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          minConfidence: options.minConfidence,
        }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => null);
      if (!payload) {
        throw new Error(`ANPR server returned invalid response (HTTP ${response.status}).`);
      }

      return payload as AnprRecognitionResponse;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return {
          success: false,
          provider: 'gemini_vision',
          plateDetected: false,
          rawPlateText: '',
          normalizedPlate: '',
          candidatePlates: [],
          plateCountInImage: 0,
          vehicleType: 'Unknown',
          confidence: 0,
          lowConfidence: true,
          imageQualityIssues: ['request_timeout_or_cancelled'],
          processingMs: 0,
          errorCode: 'ANPR_TIMEOUT',
          errorMessage: 'Recognition timed out or was cancelled. Please retry or use Manual Entry.',
        };
      }
      return {
        success: false,
        provider: 'gemini_vision',
        plateDetected: false,
        rawPlateText: '',
        normalizedPlate: '',
        candidatePlates: [],
        plateCountInImage: 0,
        vehicleType: 'Unknown',
        confidence: 0,
        lowConfidence: true,
        imageQualityIssues: ['network_error'],
        processingMs: 0,
        errorCode: 'NETWORK_ERROR',
        errorMessage: err?.message || 'Unable to reach ANPR recognition server.',
      };
    } finally {
      clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', onExternalAbort);
    }
  },

  async checkServerHealth(): Promise<{
    ok: boolean;
    activeProviderId: string;
    activeProviderName: string;
    activeProviderConfigured: boolean;
  }> {
    try {
      const res = await fetch('/api/anpr/health');
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return {
        ok: false,
        activeProviderId: 'gemini_vision',
        activeProviderName: 'Gemini Vision ANPR',
        activeProviderConfigured: false,
      };
    }
  },

  // 2. Unified Society-Isolated Vehicle Registry
  async getSocietyVehicles(societyId: string): Promise<AnprVehicleRecord[]> {
    const fallback = getDefaultVehiclesForSociety(societyId);
    const localList = getStored<Partial<SocietyVehicle & AnprVehicleRecord>[]>(VEH_KEY(societyId), fallback);

    // Ensure normalized format across any legacy items
    const normalizedList = localList
      .filter((v) => !v.societyId || v.societyId === societyId)
      .map((v) => toUnifiedAnprVehicle(v, societyId));

    if (db) {
      try {
        const snap = await getDocs(collection(db, 'societies', societyId, 'vehicles'));
        if (!snap.empty) {
          const remoteVehicles = snap.docs.map((d) =>
            toUnifiedAnprVehicle({ id: d.id, ...(d.data() as any) }, societyId)
          );
          const mergedMap = new Map<string, AnprVehicleRecord>();
          normalizedList.forEach((v) => mergedMap.set(v.id, v));
          remoteVehicles.forEach((v) => mergedMap.set(v.id, v));
          const merged = Array.from(mergedMap.values());
          setStored(VEH_KEY(societyId), merged);
          return merged;
        }
      } catch (err) {
        console.warn('[ANPR] Remote vehicle fetch fallback to local store:', err);
      }
    }

    return normalizedList;
  },

  async registerOrUpdateVehicle(
    societyId: string,
    payload: Partial<AnprVehicleRecord> & {
      plateNumber?: string;
      actorUid?: string;
      actorName?: string;
      actorIsAdmin?: boolean;
    }
  ): Promise<AnprVehicleRecord> {
    const existingList = await this.getSocietyVehicles(societyId);
    const regInput = (payload.registrationNumber || payload.plateNumber || '').trim().toUpperCase();
    const normalized = normalizeIndianPlate(regInput);

    if (!normalized || normalized.length < 4) {
      throw new Error('Please enter a valid vehicle registration plate number.');
    }

    const editingId = payload.id || payload.vehicleId;
    const existingTarget = editingId ? existingList.find((v) => v.id === editingId) : undefined;

    // Prevent unauthorized ownership transfer when edited by non-admin resident
    if (
      existingTarget &&
      !payload.actorIsAdmin &&
      existingTarget.ownerUserId &&
      payload.ownerUserId &&
      payload.ownerUserId !== existingTarget.ownerUserId
    ) {
      throw new Error('Unauthorized vehicle ownership change blocked.');
    }

    const desiredStatus: VehicleRegistrationStatus =
      payload.registrationStatus || existingTarget?.registrationStatus || 'ACTIVE';

    // Duplicate ACTIVE plate guard scoped strictly to THIS society
    if (desiredStatus === 'ACTIVE') {
      const duplicate = existingList.find(
        (v) =>
          v.id !== editingId &&
          v.normalizedRegistrationNumber === normalized &&
          v.registrationStatus === 'ACTIVE'
      );
      if (duplicate) {
        throw new Error(
          `Active registration already exists in this society for plate ${normalized} (Flat ${duplicate.flatNumber}).`
        );
      }
    }

    const now = new Date().toISOString();
    const recordId = editingId || `veh_${Date.now()}`;

    const unified = toUnifiedAnprVehicle(
      {
        ...existingTarget,
        ...payload,
        id: recordId,
        vehicleId: recordId,
        societyId,
        registrationNumber: regInput || existingTarget?.registrationNumber || normalized,
        plateNumber: regInput || existingTarget?.plateNumber || normalized,
        normalizedRegistrationNumber: normalized,
        registrationStatus: desiredStatus,
        currentGateStatus:
          payload.currentGateStatus || existingTarget?.currentGateStatus || 'OUTSIDE',
        createdAt: existingTarget?.createdAt || now,
        updatedAt: now,
      },
      societyId
    );

    const updatedList = existingTarget
      ? existingList.map((v) => (v.id === recordId ? unified : v))
      : [unified, ...existingList];

    setStored(VEH_KEY(societyId), updatedList);

    if (db) {
      try {
        await setDoc(doc(db, 'societies', societyId, 'vehicles', recordId), unified, { merge: true });
      } catch (err) {
        console.warn('[ANPR] Firestore vehicle write deferred to local cache:', err);
      }
    }

    logEcosystemAuditEvent({
      action: 'SETTINGS_UPDATED',
      targetId: recordId,
      targetType: 'VEHICLE',
      societyId,
      changeSummary: `${existingTarget ? 'Updated' : 'Registered'} vehicle ${normalized} (Flat ${unified.flatNumber}, Status ${unified.registrationStatus})`,
    });

    syncBus.broadcast('VEHICLE_REGISTRY_UPDATED', societyId, payload.actorUid || 'admin', 'SOCIETY_ADMIN', unified);
    return unified;
  },

  async deleteVehicle(societyId: string, vehicleId: string, actorUid = 'admin'): Promise<void> {
    const list = await this.getSocietyVehicles(societyId);
    const updated = list.filter((v) => v.id !== vehicleId);
    setStored(VEH_KEY(societyId), updated);
    syncBus.broadcast('VEHICLE_REGISTRY_UPDATED', societyId, actorUid, 'SOCIETY_ADMIN', { vehicleId, deleted: true });
  },

  // 3. Multi-Society Isolated Vehicle Lookup & Indian OCR Ambiguity Matcher
  async matchVehicleInSociety(
    societyId: string,
    rawPlateText: string,
    confidence: number,
    options: { plateDetected?: boolean; minConfidence?: number; manualOverride?: boolean } = {}
  ): Promise<VehicleMatchResult> {
    const policy = await this.getRetentionPolicy(societyId);
    const minConfidence = options.minConfidence ?? policy.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
    const normalized = normalizeIndianPlate(rawPlateText);

    if (options.plateDetected === false || !normalized || normalized.length < 4) {
      return {
        matchType: 'FAILED_RECOGNITION',
        normalizedPlate: normalized,
        rawPlateText,
        ambiguityMatched: false,
        confidence,
        lowConfidence: true,
        statusBadge: 'FAILED RECOGNITION',
        explanation:
          'No clear license plate could be extracted from the image. Please rescan cleanly or enter the plate manually.',
      };
    }

    const isLowConf = !options.manualOverride && confidence < minConfidence;
    if (isLowConf) {
      return {
        matchType: 'LOW_CONFIDENCE',
        normalizedPlate: normalized,
        rawPlateText,
        ambiguityMatched: false,
        confidence,
        lowConfidence: true,
        statusBadge: 'LOW CONFIDENCE',
        explanation: `OCR confidence (${confidence}%) is below society threshold (${minConfidence}%). Manual verification or rescan required before entry.`,
      };
    }

    const societyVehicles = await this.getSocietyVehicles(societyId);

    // Exact match first (prefer ACTIVE over INACTIVE)
    const exactMatches = societyVehicles.filter((v) => v.normalizedRegistrationNumber === normalized);
    const exactActive = exactMatches.find((v) => v.registrationStatus === 'ACTIVE');
    const exactInactive = exactMatches.find((v) => v.registrationStatus !== 'ACTIVE');

    if (exactActive) {
      return {
        matchType: 'MATCHED_ACTIVE',
        vehicle: exactActive,
        normalizedPlate: normalized,
        rawPlateText,
        ambiguityMatched: false,
        confidence,
        lowConfidence: false,
        statusBadge: 'REGISTERED VEHICLE',
        gateStatusBadge: exactActive.currentGateStatus === 'INSIDE' ? 'ALREADY INSIDE' : 'OUTSIDE',
        explanation: `Verified active registration in this society for Flat ${exactActive.flatNumber}.`,
      };
    }

    if (exactInactive) {
      return {
        matchType: 'INACTIVE_REGISTRATION',
        vehicle: exactInactive,
        normalizedPlate: normalized,
        rawPlateText,
        ambiguityMatched: false,
        confidence,
        lowConfidence: false,
        statusBadge: 'INACTIVE REGISTRATION',
        gateStatusBadge: exactInactive.currentGateStatus === 'INSIDE' ? 'ALREADY INSIDE' : 'OUTSIDE',
        explanation: `Vehicle ${normalized} exists in Flat ${exactInactive.flatNumber} but is marked ${exactInactive.registrationStatus}. Entry blocked until Society Admin reactivates.`,
      };
    }

    // Controlled OCR ambiguity check (O/0, I/1, B/8, S/5) ONLY against verified plates in THIS society
    const candidates = generateIndianOcrAmbiguityCandidates(normalized);
    for (const candidate of candidates) {
      if (candidate === normalized) continue;
      const candActive = societyVehicles.find(
        (v) => v.normalizedRegistrationNumber === candidate && v.registrationStatus === 'ACTIVE'
      );
      if (candActive) {
        return {
          matchType: 'MATCHED_ACTIVE',
          vehicle: candActive,
          normalizedPlate: candActive.normalizedRegistrationNumber,
          rawPlateText,
          ambiguityMatched: true,
          matchedViaCandidate: `${normalized} → ${candActive.normalizedRegistrationNumber}`,
          confidence,
          lowConfidence: false,
          statusBadge: 'REGISTERED VEHICLE',
          gateStatusBadge: candActive.currentGateStatus === 'INSIDE' ? 'ALREADY INSIDE' : 'OUTSIDE',
          explanation: `Matched society vehicle ${candActive.normalizedRegistrationNumber} via Indian OCR ambiguity check (${normalized} → ${candActive.normalizedRegistrationNumber}).`,
        };
      }
    }

    return {
      matchType: 'UNKNOWN_VEHICLE',
      normalizedPlate: normalized,
      rawPlateText,
      ambiguityMatched: false,
      confidence,
      lowConfidence: false,
      statusBadge: 'UNKNOWN VEHICLE',
      explanation: `Plate ${normalized} is not registered in this society. Proceed with Unknown Vehicle check-in or rescan.`,
    };
  },

  // 4. Atomic IN/OUT State Machine + Resident Notification + Immutable Movement Log
  async confirmVehicleMovement(params: {
    societyId: string;
    societyName: string;
    vehicleId: string;
    direction: VehicleMovementDirection;
    gateId: string;
    gateName: string;
    guardUserId: string;
    guardName: string;
    recognizedNumber: string;
    confidenceScore: number;
    capturedImageReference?: string;
    verificationStatus?: VehicleMovementVerificationStatus;
    source?: VehicleMovementSource;
    notes?: string;
    confirmedByGuard: boolean;
  }): Promise<{ vehicle: AnprVehicleRecord; movement: VehicleMovementRecord }> {
    if (!params.confirmedByGuard) {
      throw new Error('Explicit security guard confirmation is required before recording gate movement.');
    }

    const vehicles = await this.getSocietyVehicles(params.societyId);
    const target = vehicles.find((v) => v.id === params.vehicleId || v.vehicleId === params.vehicleId);
    if (!target) {
      throw new Error('Vehicle record not found inside current society.');
    }

    if (target.registrationStatus !== 'ACTIVE') {
      throw new Error(
        `Cannot record ${params.direction} movement: vehicle ${target.normalizedRegistrationNumber} registration status is ${target.registrationStatus}.`
      );
    }

    // Strict IN / OUT transition validation preventing duplicate IN or duplicate OUT
    if (params.direction === 'IN' && target.currentGateStatus === 'INSIDE') {
      throw new Error(
        `Vehicle ${target.registrationNumber} is already INSIDE campus (since ${
          target.lastEntryAt ? new Date(target.lastEntryAt).toLocaleTimeString() : 'earlier'
        }). Duplicate IN blocked.`
      );
    }
    if (params.direction === 'OUT' && target.currentGateStatus === 'OUTSIDE') {
      throw new Error(
        `Vehicle ${target.registrationNumber} is already OUTSIDE campus. Duplicate OUT blocked.`
      );
    }

    const now = new Date().toISOString();
    const movementId = `mov_${Date.now()}`;
    const nextGateStatus: VehicleGateStatus = params.direction === 'IN' ? 'INSIDE' : 'OUTSIDE';

    const movement: VehicleMovementRecord = {
      movementId,
      societyId: params.societyId,
      vehicleId: target.id,
      registrationNumber: target.registrationNumber,
      normalizedRegistrationNumber: target.normalizedRegistrationNumber,
      ownerUserId: target.ownerUserId,
      ownerName: target.ownerName,
      buildingId: target.buildingId,
      buildingName: target.buildingName,
      flatId: target.flatId,
      flatNumber: target.flatNumber,
      gateId: params.gateId,
      gateName: params.gateName,
      guardUserId: params.guardUserId,
      guardName: params.guardName,
      direction: params.direction,
      capturedImageReference: params.capturedImageReference,
      recognizedNumber: params.recognizedNumber || target.normalizedRegistrationNumber,
      confidenceScore: params.confidenceScore,
      verificationStatus: params.verificationStatus || 'VERIFIED_REGISTERED',
      timestamp: now,
      source: params.source || 'ANPR_CAMERA',
      notes: params.notes,
      createdAt: now,
    };

    const updatedVehicle: AnprVehicleRecord = {
      ...target,
      currentGateStatus: nextGateStatus,
      lastMovementId: movementId,
      lastEntryAt: params.direction === 'IN' ? now : target.lastEntryAt,
      lastExitAt: params.direction === 'OUT' ? now : target.lastExitAt,
      lastGateId: params.gateId,
      lastGateName: params.gateName,
      updatedAt: now,
    };

    // Transactional Firestore write when live Firebase is connected
    if (db) {
      try {
        await runTransaction(db, async (tx) => {
          const vehRef = doc(db!, 'societies', params.societyId, 'vehicles', target.id);
          const snap = await tx.get(vehRef);
          if (snap.exists()) {
            const liveStatus = snap.data().currentGateStatus || 'OUTSIDE';
            if (params.direction === 'IN' && liveStatus === 'INSIDE') {
              throw new Error(`Duplicate IN blocked: ${target.registrationNumber} is already INSIDE.`);
            }
            if (params.direction === 'OUT' && liveStatus === 'OUTSIDE') {
              throw new Error(`Duplicate OUT blocked: ${target.registrationNumber} is already OUTSIDE.`);
            }
          }
          tx.set(vehRef, updatedVehicle, { merge: true });
          const movRef = doc(db!, 'societies', params.societyId, 'vehicleMovements', movementId);
          tx.set(movRef, movement);
        });
      } catch (err: any) {
        if (String(err?.message || '').includes('Duplicate')) {
          throw err;
        }
        console.warn('[ANPR] Firestore transaction fallback to local store:', err);
      }
    }

    // Update unified local synchronized storage
    const updatedVehiclesList = vehicles.map((v) => (v.id === target.id ? updatedVehicle : v));
    setStored(VEH_KEY(params.societyId), updatedVehiclesList);

    const movements = await this.getVehicleMovements(params.societyId);
    setStored(MOV_KEY(params.societyId), [movement, ...movements]);

    // Dispatch instant Resident Notifications (supports both real uid & demo resident uid alias)
    const timeLabel = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateLabel = new Date(now).toLocaleDateString();
    const actionPhrase = params.direction === 'IN' ? 'entered' : 'exited';
    const recipientIds = new Set<string>(
      [target.ownerUserId, ...(target.flatNumber === 'B-704' ? ['usr_resident_04', 'res_priya'] : [])].filter(
        Boolean
      ) as string[]
    );

    recipientIds.forEach((recipientUid) => {
      notificationEngine.dispatchNotification({
        recipientUid,
        societyId: params.societyId,
        category: 'SECURITY',
        priority: 'HIGH',
        title: `Vehicle ${params.direction === 'IN' ? 'Entry' : 'Exit'}: ${target.normalizedRegistrationNumber}`,
        body: `Your registered vehicle ${target.normalizedRegistrationNumber} has ${actionPhrase} ${params.societyName} through ${params.gateName} at ${timeLabel} (${dateLabel}). Guard: ${params.guardName}.`,
        data: {
          vehicleId: target.id,
          movementId,
          plate: target.normalizedRegistrationNumber,
          direction: params.direction,
          gateName: params.gateName,
        },
      });
    });

    logEcosystemAuditEvent({
      action: 'SECURITY_OVERRIDE',
      targetId: movementId,
      targetType: 'VEHICLE_MOVEMENT',
      societyId: params.societyId,
      changeSummary: `Vehicle ${target.normalizedRegistrationNumber} (${target.flatNumber}) ${params.direction} at ${params.gateName} by Guard ${params.guardName}`,
    });

    syncBus.broadcast(
      'VEHICLE_MOVEMENT_RECORDED',
      params.societyId,
      params.guardUserId,
      'SECURITY_GUARD',
      movement
    );

    return { vehicle: updatedVehicle, movement };
  },

  // 5. ANPR Scan History & Retention Purge
  async getAnprScans(societyId: string): Promise<AnprScanRecord[]> {
    return getStored<AnprScanRecord[]>(SCAN_KEY(societyId), getDefaultScansForSociety(societyId));
  },

  async recordAnprScan(
    societyId: string,
    scan: Omit<AnprScanRecord, 'scanId' | 'societyId' | 'createdAt' | 'timestamp'>
  ): Promise<AnprScanRecord> {
    const policy = await this.getRetentionPolicy(societyId);
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + Math.max(1, policy.imageRetentionDays) * 86400 * 1000
    ).toISOString();

    const record: AnprScanRecord = {
      ...scan,
      scanId: `scan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      societyId,
      imageExpiresAt: scan.capturedImageReference ? expiresAt : undefined,
      timestamp: now.toISOString(),
      createdAt: now.toISOString(),
    };

    const existing = await this.getAnprScans(societyId);
    // Cap stored local snapshots safely (150 newest scans)
    const updated = [record, ...existing].slice(0, 150);
    setStored(SCAN_KEY(societyId), updated);

    if (db) {
      try {
        await setDoc(doc(db, 'societies', societyId, 'anprScans', record.scanId), record);
      } catch (_) {}
    }

    return record;
  },

  async reportIncorrectAnprMatch(
    societyId: string,
    scanId: string,
    guardName: string,
    mismatchNote: string
  ): Promise<void> {
    const scans = await this.getAnprScans(societyId);
    const updated = scans.map((s) =>
      s.scanId === scanId
        ? {
            ...s,
            outcome: 'REPORTED_INCORRECT' as AnprScanOutcome,
            reportedIncorrect: true,
            mismatchNote: mismatchNote || `Flagged as incorrect match by ${guardName}`,
          }
        : s
    );
    setStored(SCAN_KEY(societyId), updated);

    notificationEngine.dispatchNotification({
      recipientUid: `soc_admin_${societyId}`,
      societyId,
      category: 'SECURITY',
      priority: 'HIGH',
      title: 'ANPR Incorrect Match Flagged',
      body: `Guard ${guardName} flagged ANPR scan ${scanId}: ${mismatchNote || 'Plate mismatch reported'}.`,
      data: { scanId, mismatchNote },
    });

    syncBus.broadcast('ANPR_MISMATCH_REPORTED', societyId, 'guard', 'SECURITY_GUARD', { scanId });
  },

  // 6. Vehicle Movement History
  async getVehicleMovements(societyId: string): Promise<VehicleMovementRecord[]> {
    return getStored<VehicleMovementRecord[]>(MOV_KEY(societyId), getDefaultMovementsForSociety(societyId));
  },

  // 7. Unknown Vehicle Management
  async getUnknownVehicles(societyId: string): Promise<UnknownVehicleRecord[]> {
    return getStored<UnknownVehicleRecord[]>(UNK_KEY(societyId), []);
  },

  async createUnknownVehicleEntry(
    societyId: string,
    societyName: string,
    entry: Omit<UnknownVehicleRecord, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>
  ): Promise<UnknownVehicleRecord> {
    const now = new Date().toISOString();
    const normalized = normalizeIndianPlate(entry.normalizedPlate || entry.rawPlateText);
    const record: UnknownVehicleRecord = {
      ...entry,
      id: `unk_${Date.now()}`,
      societyId,
      normalizedPlate: normalized,
      createdAt: now,
      updatedAt: now,
    };

    const existing = await this.getUnknownVehicles(societyId);
    setStored(UNK_KEY(societyId), [record, ...existing]);

    if (db) {
      try {
        await setDoc(doc(db, 'societies', societyId, 'unknownVehicles', record.id), record);
      } catch (_) {}
    }

    // If temporary entry granted, also append immutable movement record for gate traceability
    if (record.entryAction === 'TEMP_ENTRY_GRANTED') {
      const mov: VehicleMovementRecord = {
        movementId: `mov_unk_${Date.now()}`,
        societyId,
        registrationNumber: record.rawPlateText || normalized,
        normalizedRegistrationNumber: normalized,
        buildingName: record.destinationBuilding,
        flatNumber: record.destinationFlat,
        gateId: record.gateId,
        gateName: record.gateName,
        guardUserId: record.guardUserId,
        guardName: record.guardName,
        direction: 'IN',
        capturedImageReference: record.capturedImageReference,
        recognizedNumber: normalized,
        confidenceScore: record.confidenceScore,
        verificationStatus: 'UNKNOWN_TEMP_ENTRY',
        timestamp: now,
        source: 'ANPR_CAMERA',
        notes: `Unknown Visitor (${record.visitorType}): ${record.driverName}${
          record.destinationFlat ? ` -> Flat ${record.destinationFlat}` : ''
        }`,
        createdAt: now,
      };
      const existingMovs = await this.getVehicleMovements(societyId);
      setStored(MOV_KEY(societyId), [mov, ...existingMovs]);
    }

    // Notify Society Admin for audit & optional registration conversion
    notificationEngine.dispatchNotification({
      recipientUid: `soc_admin_${societyId}`,
      societyId,
      category: 'SECURITY',
      priority: 'HIGH',
      title: `Unknown Vehicle at ${record.gateName}: ${normalized || 'Unreadable Plate'}`,
      body: `${record.visitorType} (${record.driverName}) for ${
        record.destinationFlat || 'Society Gate'
      }. Action: ${record.entryAction.replace(/_/g, ' ')} at ${societyName}.`,
      data: { unknownVehicleId: record.id, plate: normalized },
    });

    syncBus.broadcast('UNKNOWN_VEHICLE_LOGGED', societyId, record.guardUserId, 'SECURITY_GUARD', record);
    return record;
  },

  async convertUnknownVehicleToRegistered(
    societyId: string,
    unknownId: string,
    registrationDetails: {
      ownerName: string;
      ownerUserId?: string;
      buildingName?: string;
      flatId?: string;
      flatNumber: string;
      vehicleType: 'Car' | 'Motorcycle' | 'EV' | 'Bicycle';
      vehicleBrand?: string;
      vehicleModel?: string;
      vehicleColor?: string;
      parkingSlot?: string;
    }
  ): Promise<AnprVehicleRecord> {
    const unknownList = await this.getUnknownVehicles(societyId);
    const target = unknownList.find((u) => u.id === unknownId);
    if (!target) {
      throw new Error('Unknown vehicle record not found.');
    }

    const registered = await this.registerOrUpdateVehicle(societyId, {
      registrationNumber: target.rawPlateText || target.normalizedPlate,
      plateNumber: target.rawPlateText || target.normalizedPlate,
      ownerName: registrationDetails.ownerName,
      ownerUserId: registrationDetails.ownerUserId,
      buildingName: registrationDetails.buildingName,
      flatId: registrationDetails.flatId || `flat_${registrationDetails.flatNumber.toLowerCase()}`,
      flatNumber: registrationDetails.flatNumber,
      vehicleType: registrationDetails.vehicleType,
      vehicleBrand: registrationDetails.vehicleBrand,
      vehicleModel: registrationDetails.vehicleModel,
      vehicleColor: registrationDetails.vehicleColor,
      makeModel:
        [registrationDetails.vehicleBrand, registrationDetails.vehicleModel].filter(Boolean).join(' ') ||
        'Resident Vehicle',
      parkingSlot: registrationDetails.parkingSlot || 'P-OPEN',
      vehicleImage: target.capturedImageReference,
      registrationStatus: 'ACTIVE',
      currentGateStatus:
        target.entryAction === 'TEMP_ENTRY_GRANTED' ? 'INSIDE' : 'OUTSIDE',
      actorIsAdmin: true,
    });

    const updatedUnknown = unknownList.map((u) =>
      u.id === unknownId
        ? {
            ...u,
            entryAction: 'CONVERTED_TO_REGISTERED' as const,
            convertedVehicleId: registered.id,
            updatedAt: new Date().toISOString(),
          }
        : u
    );
    setStored(UNK_KEY(societyId), updatedUnknown);
    return registered;
  },

  async dismissUnknownVehicle(societyId: string, unknownId: string): Promise<void> {
    const unknownList = await this.getUnknownVehicles(societyId);
    const updated = unknownList.map((u) =>
      u.id === unknownId
        ? { ...u, entryAction: 'DISMISSED' as const, updatedAt: new Date().toISOString() }
        : u
    );
    setStored(UNK_KEY(societyId), updated);
  },

  // 8. Gate Cameras, Barrier Automation Policy (Disabled by Default) & Image Retention
  async getGateCameras(societyId: string): Promise<GateCameraConfig[]> {
    return getStored<GateCameraConfig[]>(CAM_KEY(societyId), getDefaultCameras(societyId));
  },

  async saveGateCamera(societyId: string, camera: GateCameraConfig): Promise<GateCameraConfig[]> {
    const existing = await this.getGateCameras(societyId);
    const idx = existing.findIndex((c) => c.id === camera.id);
    const next = { ...camera, societyId, updatedAt: new Date().toISOString() };
    const updated = idx >= 0 ? existing.map((c) => (c.id === camera.id ? next : c)) : [...existing, next];
    setStored(CAM_KEY(societyId), updated);
    return updated;
  },

  async getBarrierConfig(societyId: string): Promise<BarrierControlConfig> {
    return getStored<BarrierControlConfig>(BARRIER_KEY(societyId), {
      societyId,
      autoOpenBarrierEnabled: false, // Explicitly disabled by default
      requireMinimumConfidence: 92,
      allowAutoEntryWithoutGuardConfirmation: false,
      updatedAt: new Date().toISOString(),
    });
  },

  async saveBarrierConfig(
    societyId: string,
    config: Partial<BarrierControlConfig>,
    updatedBy = 'Society Admin'
  ): Promise<BarrierControlConfig> {
    const current = await this.getBarrierConfig(societyId);
    const merged: BarrierControlConfig = {
      ...current,
      ...config,
      societyId,
      updatedBy,
      updatedAt: new Date().toISOString(),
    };
    setStored(BARRIER_KEY(societyId), merged);
    return merged;
  },

  async getRetentionPolicy(societyId: string): Promise<AnprRetentionPolicy> {
    return getStored<AnprRetentionPolicy>(RETENTION_KEY(societyId), {
      societyId,
      imageRetentionDays: 30,
      autoPurgeEnabled: true,
      confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
      purgedCount: 0,
    });
  },

  async saveRetentionPolicy(
    societyId: string,
    policy: Partial<AnprRetentionPolicy>
  ): Promise<AnprRetentionPolicy> {
    const current = await this.getRetentionPolicy(societyId);
    const merged: AnprRetentionPolicy = {
      ...current,
      ...policy,
      societyId,
    };
    setStored(RETENTION_KEY(societyId), merged);
    return merged;
  },

  async purgeExpiredScanImages(societyId: string, forceOlderThanDays?: number): Promise<number> {
    const policy = await this.getRetentionPolicy(societyId);
    const days = forceOlderThanDays ?? policy.imageRetentionDays;
    const cutoff = Date.now() - Math.max(0, days) * 86400 * 1000;

    const scans = await this.getAnprScans(societyId);
    let purged = 0;
    const cleanedScans = scans.map((s) => {
      const expired =
        (s.imageExpiresAt && new Date(s.imageExpiresAt).getTime() <= Date.now()) ||
        (forceOlderThanDays !== undefined && new Date(s.timestamp).getTime() <= cutoff);
      if (expired && s.capturedImageReference) {
        purged += 1;
        return { ...s, capturedImageReference: undefined };
      }
      return s;
    });
    setStored(SCAN_KEY(societyId), cleanedScans);

    const movements = await this.getVehicleMovements(societyId);
    const cleanedMovs = movements.map((m) => {
      if (m.capturedImageReference && new Date(m.timestamp).getTime() <= cutoff) {
        purged += 1;
        return { ...m, capturedImageReference: undefined };
      }
      return m;
    });
    setStored(MOV_KEY(societyId), cleanedMovs);

    await this.saveRetentionPolicy(societyId, {
      lastPurgedAt: new Date().toISOString(),
      purgedCount: (policy.purgedCount || 0) + purged,
    });

    return purged;
  },
};
