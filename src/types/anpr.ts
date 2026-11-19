/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AnprProviderId = 'gemini_vision' | 'plate_recognizer' | 'cloud_vision_alpr';

export interface AnprBoundingBox {
  ymin: number; // Normalized 0..1000
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface AnprRecognitionResponse {
  success: boolean;
  provider: AnprProviderId;
  plateDetected: boolean;
  rawPlateText: string;
  normalizedPlate: string;
  candidatePlates: string[];
  plateCountInImage: number;
  vehicleType: 'Car' | 'Motorcycle' | 'EV' | 'Auto' | 'Commercial' | 'Bicycle' | 'Unknown';
  vehicleBrand?: string;
  vehicleColor?: string;
  confidence: number; // 0..100
  lowConfidence: boolean;
  imageQualityIssues: string[];
  ambiguityNote?: string;
  boundingBox?: AnprBoundingBox;
  processingMs: number;
  errorCode?: string;
  errorMessage?: string;
}

export type VehicleRegistrationStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type VehicleGateStatus = 'INSIDE' | 'OUTSIDE';

export interface AnprVehicleRecord {
  id: string;
  vehicleId: string;
  registrationNumber: string;
  plateNumber?: string;
  normalizedRegistrationNumber: string;
  ownerName: string;
  ownerUserId?: string;
  societyId: string;
  buildingId?: string;
  buildingName?: string;
  flatId: string;
  flatNumber: string;
  vehicleType: 'Car' | 'Motorcycle' | 'EV' | 'Bicycle';
  vehicleBrand?: string;
  vehicleModel?: string;
  makeModel: string;
  vehicleColor?: string;
  vehicleImage?: string;
  parkingSlot: string;
  registrationStatus: VehicleRegistrationStatus;
  currentGateStatus: VehicleGateStatus;
  lastMovementId?: string;
  lastEntryAt?: string;
  lastExitAt?: string;
  lastGateId?: string;
  lastGateName?: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleMovementDirection = 'IN' | 'OUT';

export type VehicleMovementVerificationStatus =
  | 'VERIFIED_REGISTERED'
  | 'MANUAL_CORRECTION'
  | 'UNKNOWN_TEMP_ENTRY'
  | 'INACTIVE_BLOCKED'
  | 'REPORTED_MISMATCH';

export type VehicleMovementSource = 'ANPR_CAMERA' | 'ANPR_UPLOAD' | 'MANUAL_ENTRY' | 'RTSP_FUTURE';

export interface VehicleMovementRecord {
  movementId: string;
  societyId: string;
  vehicleId?: string;
  registrationNumber: string;
  normalizedRegistrationNumber: string;
  ownerUserId?: string;
  ownerName?: string;
  buildingId?: string;
  buildingName?: string;
  flatId?: string;
  flatNumber?: string;
  gateId: string;
  gateName: string;
  guardUserId: string;
  guardName: string;
  direction: VehicleMovementDirection;
  capturedImageReference?: string;
  recognizedNumber: string;
  confidenceScore: number;
  verificationStatus: VehicleMovementVerificationStatus;
  timestamp: string;
  source: VehicleMovementSource;
  notes?: string;
  createdAt: string;
}

export type AnprScanOutcome =
  | 'MATCHED_ACTIVE'
  | 'INACTIVE_MATCH'
  | 'UNKNOWN_VEHICLE'
  | 'LOW_CONFIDENCE'
  | 'FAILED_RECOGNITION'
  | 'MULTIPLE_PLATES'
  | 'REPORTED_INCORRECT';

export interface AnprScanRecord {
  scanId: string;
  societyId: string;
  gateId: string;
  gateName: string;
  guardUserId: string;
  guardName: string;
  provider: AnprProviderId;
  rawPlateText: string;
  normalizedPlate: string;
  confidenceScore: number;
  outcome: AnprScanOutcome;
  matchedVehicleId?: string;
  matchedFlatNumber?: string;
  matchedOwnerName?: string;
  capturedImageReference?: string;
  imageExpiresAt?: string;
  imageQualityIssues?: string[];
  movementId?: string;
  reportedIncorrect?: boolean;
  mismatchNote?: string;
  timestamp: string;
  createdAt: string;
}

export interface UnknownVehicleRecord {
  id: string;
  societyId: string;
  gateId: string;
  gateName: string;
  guardUserId: string;
  guardName: string;
  rawPlateText: string;
  normalizedPlate: string;
  confidenceScore: number;
  driverName: string;
  driverMobile?: string;
  visitorType: 'Guest' | 'Delivery' | 'Cab' | 'Service' | 'Vendor' | 'Other';
  destinationBuilding?: string;
  destinationFlat?: string;
  capturedImageReference?: string;
  residentApprovalStatus: 'PENDING' | 'APPROVED' | 'DENIED' | 'NOT_REQUESTED';
  entryAction:
    | 'TEMP_ENTRY_GRANTED'
    | 'PENDING_RESIDENT_APPROVAL'
    | 'CONVERTED_TO_REGISTERED'
    | 'DISMISSED';
  convertedVehicleId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GateCameraConfig {
  id: string;
  societyId: string;
  gateId: string;
  gateName: string;
  cameraLabel: string;
  streamType: 'MOBILE_PWA_CAMERA' | 'RTSP_IP_CAMERA' | 'ONVIF_CCTV' | 'WEBHOOK_EDGE_ANPR';
  streamUrl?: string;
  connectionStatus: 'ACTIVE_MOBILE' | 'AWAITING_HARDWARE';
  anprEnabled: boolean;
  assignedGuardIds: string[];
  updatedAt: string;
}

export interface BarrierControlConfig {
  societyId: string;
  autoOpenBarrierEnabled: boolean; // Disabled by default per strict security policy
  requireMinimumConfidence: number; // e.g. 92
  allowAutoEntryWithoutGuardConfirmation: boolean; // False by default
  hardwareRelayEndpoint?: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface AnprRetentionPolicy {
  societyId: string;
  imageRetentionDays: number; // e.g. 30
  autoPurgeEnabled: boolean;
  lastPurgedAt?: string;
  purgedCount?: number;
  confidenceThreshold: number; // Default 72
}

export interface VehicleMatchResult {
  matchType:
    | 'MATCHED_ACTIVE'
    | 'INACTIVE_REGISTRATION'
    | 'UNKNOWN_VEHICLE'
    | 'LOW_CONFIDENCE'
    | 'FAILED_RECOGNITION';
  vehicle?: AnprVehicleRecord;
  normalizedPlate: string;
  rawPlateText: string;
  ambiguityMatched: boolean;
  matchedViaCandidate?: string;
  confidence: number;
  lowConfidence: boolean;
  statusBadge:
    | 'REGISTERED VEHICLE'
    | 'UNKNOWN VEHICLE'
    | 'INACTIVE REGISTRATION'
    | 'LOW CONFIDENCE'
    | 'FAILED RECOGNITION';
  gateStatusBadge?: 'ALREADY INSIDE' | 'OUTSIDE';
  explanation: string;
}

export interface CameraStreamAdapter {
  readonly adapterType: GateCameraConfig['streamType'];
  readonly label: string;
  isConnected(): Promise<boolean>;
  captureFrameBase64(): Promise<{ base64: string; mimeType: string } | null>;
}

export interface BarrierController {
  openBarrier(params: {
    societyId: string;
    gateId: string;
    vehicleRegistrationNumber: string;
    authorizedBy: string;
  }): Promise<{ opened: boolean; reason: string }>;
}
