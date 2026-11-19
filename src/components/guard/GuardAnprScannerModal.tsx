/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  Upload,
  RotateCcw,
  ScanLine,
  Keyboard,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  AnprRecognitionResponse,
  UnknownVehicleRecord,
  VehicleMatchResult,
  VehicleMovementDirection,
} from '../../types/anpr';
import { anprService } from '../../services/firebase/anpr.service';
import { compressVehicleImageToBase64, normalizeIndianPlate } from '../../utils/indianPlateNormalizer';
import { GuardAnprResultCard } from './GuardAnprResultCard';
import { soundAlert } from '../../utils/soundAlert';

interface GuardAnprScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  societyName: string;
  gateId: string;
  gateName: string;
  guardUserId: string;
  guardName: string;
  onMovementCompleted?: () => Promise<void> | void;
}

type ScannerStage = 'LIVE_CAMERA' | 'CAPTURED_PREVIEW' | 'MANUAL_ENTRY' | 'RESULT';

export const GuardAnprScannerModal: React.FC<GuardAnprScannerModalProps> = ({
  isOpen,
  onClose,
  societyId,
  societyName,
  gateId,
  gateName,
  guardUserId,
  guardName,
  onMovementCompleted,
}) => {
  const [stage, setStage] = useState<ScannerStage>('LIVE_CAMERA');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const [capturedDataUrl, setCapturedDataUrl] = useState<string | undefined>(undefined);
  const [capturedBase64, setCapturedBase64] = useState<string | undefined>(undefined);
  const [capturedMimeType, setCapturedMimeType] = useState<string>('image/jpeg');
  const [scanSource, setScanSource] = useState<'ANPR_CAMERA' | 'ANPR_UPLOAD' | 'MANUAL_ENTRY'>('ANPR_CAMERA');

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<AnprRecognitionResponse | null>(null);
  const [matchResult, setMatchResult] = useState<VehicleMatchResult | null>(null);
  const [lastScanId, setLastScanId] = useState<string | undefined>(undefined);

  const [manualPlateInput, setManualPlateInput] = useState('');
  const [busyAction, setBusyAction] = useState(false);
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastScanTimestampRef = useRef<number>(0);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraReady(false);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Live camera API is unavailable on this browser. Please upload a vehicle photo or use Manual Entry.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraReady(true);
      }
    } catch (err: any) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission denied. Enable camera access in browser settings or upload a photo below.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraError('No rear camera detected on this device. Upload a photo or use Manual Plate Entry.');
      } else {
        setCameraError('Could not start camera preview. Upload a vehicle photograph instead.');
      }
    }
  };

  const resetAll = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setScanning(false);
    setScanError(null);
    setCapturedDataUrl(undefined);
    setCapturedBase64(undefined);
    setRecognition(null);
    setMatchResult(null);
    setLastScanId(undefined);
    setCompletionBanner(null);
    setManualPlateInput('');
  };

  useEffect(() => {
    if (isOpen) {
      resetAll();
      setStage('LIVE_CAMERA');
      startCamera();
    } else {
      stopCamera();
      resetAll();
    }
    return () => {
      stopCamera();
      abortControllerRef.current?.abort();
    };
  }, [isOpen]);

  const handleCaptureFrame = async () => {
    if (!videoRef.current || !cameraReady) return;
    setScanError(null);
    try {
      const compressed = await compressVehicleImageToBase64(videoRef.current, {
        maxWidth: 1280,
        quality: 0.84,
      });
      setCapturedDataUrl(compressed.dataUrl);
      setCapturedBase64(compressed.base64);
      setCapturedMimeType(compressed.mimeType);
      setScanSource('ANPR_CAMERA');
      stopCamera();
      setStage('CAPTURED_PREVIEW');
    } catch (err: any) {
      setScanError(err?.message || 'Unable to capture frame.');
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScanError(null);
    try {
      const compressed = await compressVehicleImageToBase64(file, {
        maxWidth: 1280,
        quality: 0.84,
      });
      setCapturedDataUrl(compressed.dataUrl);
      setCapturedBase64(compressed.base64);
      setCapturedMimeType(compressed.mimeType);
      setScanSource('ANPR_UPLOAD');
      stopCamera();
      setStage('CAPTURED_PREVIEW');
    } catch (err: any) {
      setScanError(err?.message || 'Failed to load selected photograph.');
    }
  };

  const handleRetake = () => {
    resetAll();
    setStage('LIVE_CAMERA');
    startCamera();
  };

  const handleRunAiScan = async () => {
    if (!capturedBase64 || scanning) return;
    // Duplicate scan debounce guard (1.5s)
    const now = Date.now();
    if (now - lastScanTimestampRef.current < 1500) return;
    lastScanTimestampRef.current = now;

    setScanning(true);
    setScanError(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const policy = await anprService.getRetentionPolicy(societyId);
      const res = await anprService.recognizeVehiclePlate(capturedBase64, capturedMimeType, {
        minConfidence: policy.confidenceThreshold,
        signal: controller.signal,
      });

      setRecognition(res);

      if (!res.success) {
        await anprService.recordAnprScan(societyId, {
          gateId,
          gateName,
          guardUserId,
          guardName,
          provider: res.provider,
          rawPlateText: '',
          normalizedPlate: '',
          confidenceScore: 0,
          outcome: 'FAILED_RECOGNITION',
          capturedImageReference: capturedDataUrl,
          imageQualityIssues: res.imageQualityIssues,
        });
        setScanError(res.errorMessage || 'AI recognition unavailable. Please retry or use Manual Entry.');
        return;
      }

      const match = await anprService.matchVehicleInSociety(
        societyId,
        res.rawPlateText,
        res.confidence,
        {
          plateDetected: res.plateDetected,
          minConfidence: policy.confidenceThreshold,
        }
      );

      const scanOutcome =
        match.matchType === 'MATCHED_ACTIVE'
          ? 'MATCHED_ACTIVE'
          : match.matchType === 'INACTIVE_REGISTRATION'
          ? 'INACTIVE_MATCH'
          : match.matchType === 'LOW_CONFIDENCE'
          ? 'LOW_CONFIDENCE'
          : match.matchType === 'FAILED_RECOGNITION'
          ? 'FAILED_RECOGNITION'
          : res.plateCountInImage > 1
          ? 'MULTIPLE_PLATES'
          : 'UNKNOWN_VEHICLE';

      const loggedScan = await anprService.recordAnprScan(societyId, {
        gateId,
        gateName,
        guardUserId,
        guardName,
        provider: res.provider,
        rawPlateText: res.rawPlateText,
        normalizedPlate: match.normalizedPlate,
        confidenceScore: res.confidence,
        outcome: scanOutcome,
        matchedVehicleId: match.vehicle?.id,
        matchedFlatNumber: match.vehicle?.flatNumber,
        matchedOwnerName: match.vehicle?.ownerName,
        capturedImageReference: capturedDataUrl,
        imageQualityIssues: res.imageQualityIssues,
      });

      setLastScanId(loggedScan.scanId);
      setMatchResult(match);
      setStage('RESULT');

      if (match.matchType === 'MATCHED_ACTIVE') {
        soundAlert.playApprovalChime();
      }
    } catch (err: any) {
      setScanError(err?.message || 'Unexpected error during AI vehicle scan.');
    } finally {
      setScanning(false);
      abortControllerRef.current = null;
    }
  };

  const handleManualVerify = async (plateRaw: string) => {
    const cleaned = normalizeIndianPlate(plateRaw);
    if (cleaned.length < 4) {
      setScanError('Enter at least 4 alphanumeric characters (e.g. DL8CAF1234).');
      return;
    }
    setBusyAction(true);
    setScanError(null);
    try {
      const match = await anprService.matchVehicleInSociety(societyId, cleaned, 100, {
        plateDetected: true,
        manualOverride: true,
      });

      const logged = await anprService.recordAnprScan(societyId, {
        gateId,
        gateName,
        guardUserId,
        guardName,
        provider: 'gemini_vision',
        rawPlateText: cleaned,
        normalizedPlate: match.normalizedPlate,
        confidenceScore: 100,
        outcome:
          match.matchType === 'MATCHED_ACTIVE'
            ? 'MATCHED_ACTIVE'
            : match.matchType === 'INACTIVE_REGISTRATION'
            ? 'INACTIVE_MATCH'
            : 'UNKNOWN_VEHICLE',
        matchedVehicleId: match.vehicle?.id,
        matchedFlatNumber: match.vehicle?.flatNumber,
        matchedOwnerName: match.vehicle?.ownerName,
        capturedImageReference: capturedDataUrl,
      });

      setLastScanId(logged.scanId);
      setMatchResult(match);
      setStage('RESULT');
    } finally {
      setBusyAction(false);
    }
  };

  const handleConfirmMovement = async (direction: VehicleMovementDirection, verificationNote?: string) => {
    if (!matchResult?.vehicle) return;
    setBusyAction(true);
    setScanError(null);
    try {
      const { vehicle } = await anprService.confirmVehicleMovement({
        societyId,
        societyName,
        vehicleId: matchResult.vehicle.id,
        direction,
        gateId,
        gateName,
        guardUserId,
        guardName,
        recognizedNumber: matchResult.normalizedPlate,
        confidenceScore: matchResult.confidence,
        capturedImageReference: capturedDataUrl,
        verificationStatus:
          scanSource === 'MANUAL_ENTRY' ? 'MANUAL_CORRECTION' : 'VERIFIED_REGISTERED',
        source: scanSource,
        notes: verificationNote,
        confirmedByGuard: true,
      });

      soundAlert.playApprovalChime();
      setCompletionBanner(
        `${direction} confirmed for ${vehicle.registrationNumber} (Flat ${vehicle.flatNumber}). Resident notified.`
      );
      setMatchResult({
        ...matchResult,
        vehicle,
        gateStatusBadge: vehicle.currentGateStatus === 'INSIDE' ? 'ALREADY INSIDE' : 'OUTSIDE',
      });
      await onMovementCompleted?.();
    } catch (err: any) {
      setScanError(err?.message || 'Failed to record movement.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleCreateUnknownEntry = async (payload: {
    driverName: string;
    driverMobile?: string;
    visitorType: UnknownVehicleRecord['visitorType'];
    destinationFlat?: string;
    action: 'TEMP_ENTRY_GRANTED' | 'PENDING_RESIDENT_APPROVAL';
  }) => {
    setBusyAction(true);
    setScanError(null);
    try {
      const plate = matchResult?.normalizedPlate || normalizeIndianPlate(manualPlateInput) || 'UNREADABLE';
      await anprService.createUnknownVehicleEntry(societyId, societyName, {
        gateId,
        gateName,
        guardUserId,
        guardName,
        rawPlateText: recognition?.rawPlateText || plate,
        normalizedPlate: plate,
        confidenceScore: matchResult?.confidence ?? 0,
        driverName: payload.driverName,
        driverMobile: payload.driverMobile,
        visitorType: payload.visitorType,
        destinationFlat: payload.destinationFlat,
        capturedImageReference: capturedDataUrl,
        residentApprovalStatus:
          payload.action === 'PENDING_RESIDENT_APPROVAL' ? 'PENDING' : 'NOT_REQUESTED',
        entryAction: payload.action,
      });

      soundAlert.playApprovalChime();
      setCompletionBanner(
        payload.action === 'TEMP_ENTRY_GRANTED'
          ? `Temporary Entry saved for ${plate} (${payload.driverName}). Society Admin notified.`
          : `Approval request sent for ${plate} (${payload.driverName}) to Flat ${
              payload.destinationFlat || 'Host'
            }.`
      );
      await onMovementCompleted?.();
    } catch (err: any) {
      setScanError(err?.message || 'Could not log unknown vehicle.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleReportMismatch = async (note: string) => {
    if (!lastScanId) return;
    await anprService.reportIncorrectAnprMatch(societyId, lastScanId, guardName, note);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#050505] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#673AB7] flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold truncate">AI Vehicle Scanner (ANPR)</h3>
              <p className="text-[11px] text-purple-200 truncate">{gateName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close AI Vehicle Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden photo upload input (gallery or mobile native camera fallback) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleUploadPhoto}
          className="hidden"
        />

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {completionBanner && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p>{completionBanner}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold cursor-pointer"
                  >
                    Scan Next Vehicle
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-[11px] font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {scanError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {/* STAGE 1: LIVE CAMERA VIEWFINDER */}
          {stage === 'LIVE_CAMERA' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Animated License Plate Alignment Overlay */}
                {!cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-[270px] h-24 rounded-2xl border-2 border-[#A78BFA] bg-[#673AB7]/10 relative shadow-[0_0_0_9999px_rgba(0,0,0,0.38)] flex items-center justify-center">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl-md" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr-md" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl-md" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-white rounded-br-md" />
                      <span className="text-[11px] font-mono font-extrabold text-white/95 bg-black/55 px-2.5 py-0.5 rounded-md tracking-wider">
                        ALIGN NUMBER PLATE HERE
                      </span>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/92 p-5 flex flex-col items-center justify-center text-center space-y-3">
                    <ShieldAlert className="w-9 h-9 text-amber-400" />
                    <p className="text-xs text-slate-200 leading-relaxed max-w-xs">{cameraError}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-extrabold cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer"
                      >
                        Retry Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Capture Controls (Large Thumb-Friendly Touch Targets) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={!cameraReady}
                  onClick={handleCaptureFrame}
                  className="col-span-2 min-h-[52px] px-4 py-3 rounded-2xl bg-[#673AB7] hover:bg-[#512DA8] text-white text-sm font-extrabold shadow-lg flex items-center justify-center gap-2 disabled:opacity-45 cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>Capture Vehicle Plate</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] px-3 py-2.5 rounded-xl bg-[#F1F9FC] hover:bg-[#E6F1F5] border border-[#E6F1F5] text-xs font-bold text-[#111111] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#673AB7]" />
                  <span>Upload Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setScanSource('MANUAL_ENTRY');
                    setStage('MANUAL_ENTRY');
                  }}
                  className="min-h-[44px] px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-[#673AB7] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Keyboard className="w-4 h-4" />
                  <span>Manual Plate</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: CAPTURED PHOTO PREVIEW -> RETAKE OR SCAN */}
          {stage === 'CAPTURED_PREVIEW' && capturedDataUrl && (
            <div className="space-y-3">
              <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200">
                <img
                  src={capturedDataUrl}
                  alt="Captured vehicle preview"
                  className="w-full h-full object-contain"
                />
                {scanning && (
                  <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 space-y-3">
                    <Loader2 className="w-9 h-9 text-[#A78BFA] animate-spin" />
                    <div className="text-center">
                      <p className="text-sm font-extrabold">Analyzing License Plate with AI...</p>
                      <p className="text-[11px] text-purple-200 mt-0.5">
                        Detecting Indian plate format & checking {societyName} registry
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => abortControllerRef.current?.abort()}
                      className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer"
                    >
                      Cancel Scan
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={scanning}
                  onClick={handleRetake}
                  className="min-h-[48px] px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-extrabold text-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake</span>
                </button>

                <button
                  type="button"
                  disabled={scanning}
                  onClick={handleRunAiScan}
                  className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#673AB7] hover:bg-[#512DA8] text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>{scanning ? 'Scanning...' : 'Scan Plate'}</span>
                </button>
              </div>

              <button
                type="button"
                disabled={scanning}
                onClick={() => {
                  setScanSource('MANUAL_ENTRY');
                  setStage('MANUAL_ENTRY');
                }}
                className="w-full min-h-[42px] rounded-xl text-xs font-bold text-[#673AB7] hover:bg-purple-50 cursor-pointer"
              >
                Or Enter Registration Number Manually
              </button>
            </div>
          )}

          {/* STAGE 3: MANUAL PLATE LOOKUP */}
          {stage === 'MANUAL_ENTRY' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleManualVerify(manualPlateInput);
              }}
              className="space-y-3"
            >
              <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2.5">
                <label className="block text-xs font-extrabold text-[#111111]">
                  Enter Vehicle Registration Number ({societyName})
                </label>
                <input
                  type="text"
                  autoFocus
                  value={manualPlateInput}
                  onChange={(e) => setManualPlateInput(e.target.value.toUpperCase())}
                  placeholder="e.g. DL8CAF1234 or KA05MM9011"
                  className="w-full px-3.5 py-3 min-h-[48px] rounded-xl bg-white border border-purple-200 text-base font-mono font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
                />
                <p className="text-[11px] text-[#64748B]">
                  Supports Indian RTO formats (spaces/hyphens automatically stripped). Lookup is strictly isolated to this society.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="min-h-[48px] px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Back to Camera
                </button>
                <button
                  type="submit"
                  disabled={busyAction || normalizeIndianPlate(manualPlateInput).length < 4}
                  className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#673AB7] hover:bg-[#512DA8] text-white text-xs font-extrabold disabled:opacity-50 cursor-pointer"
                >
                  {busyAction ? 'Checking...' : 'Check Registry'}
                </button>
              </div>
            </form>
          )}

          {/* STAGE 4: PREMIUM RECOGNITION RESULT & ACTION SCREEN */}
          {stage === 'RESULT' && matchResult && (
            <GuardAnprResultCard
              societyName={societyName}
              gateId={gateId}
              gateName={gateName}
              capturedImageDataUrl={capturedDataUrl}
              recognition={recognition}
              matchResult={matchResult}
              scanId={lastScanId}
              busy={busyAction}
              onConfirmMovement={handleConfirmMovement}
              onManualPlateCheck={handleManualVerify}
              onCreateUnknownEntry={handleCreateUnknownEntry}
              onReportMismatch={handleReportMismatch}
              onRescan={handleRetake}
            />
          )}
        </div>
      </div>
    </div>
  );
};
