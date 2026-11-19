/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Car,
  Bike,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  Download,
  FileText,
  Eye,
  Edit3,
  Trash2,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  Sliders,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  UserPlus,
  Image as ImageIcon,
  Calendar,
  Ban,
} from 'lucide-react';
import { Society } from '../../types/society';
import {
  SocietyBuilding,
  SocietyFlat,
  SocietyGate,
  SocietyResidentMember,
} from '../../types/societyAdmin';
import {
  AnprRetentionPolicy,
  AnprScanOutcome,
  AnprScanRecord,
  AnprVehicleRecord,
  BarrierControlConfig,
  GateCameraConfig,
  UnknownVehicleRecord,
  VehicleMovementRecord,
  VehicleRegistrationStatus,
} from '../../types/anpr';
import { anprService } from '../../services/firebase/anpr.service';
import { syncBus } from '../../services/firebase/sync.service';
import { normalizeIndianPlate } from '../../utils/indianPlateNormalizer';
import {
  buildSocietyPeriodLabel,
  buildSocietySlug,
  exportSocietyPdf,
  matchesSocietyPeriod,
  normalizeSocietyIsoDate,
  SocietyPeriodMode,
} from './societyPdfExportUtils';
import { SocietyPdfExportToolbar } from './SocietyPdfExportToolbar';

interface SocietyVehiclesAnprViewProps {
  society: Society;
  buildings: SocietyBuilding[];
  flats: SocietyFlat[];
  residents: SocietyResidentMember[];
  gates: SocietyGate[];
  onVehiclesChanged?: () => Promise<void> | void;
}

type AnprAdminSubTab = 'registry' | 'movements' | 'scans' | 'unknown' | 'settings';
type ScanDateFilter = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'CUSTOM';
type ScanOutcomeFilter =
  | 'ALL'
  | 'MATCHED_ACTIVE'
  | 'UNKNOWN_VEHICLE'
  | 'FAILED_RECOGNITION'
  | 'LOW_CONFIDENCE'
  | 'REPORTED_INCORRECT';

function downloadCsv(filename: string, headers: string[], rows: (string | number | undefined)[][]) {
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function isSameDay(iso: string | undefined, targetDate: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === targetDate.getFullYear() &&
    d.getMonth() === targetDate.getMonth() &&
    d.getDate() === targetDate.getDate()
  );
}

export const SocietyVehiclesAnprView: React.FC<SocietyVehiclesAnprViewProps> = ({
  society,
  buildings,
  flats,
  residents,
  gates,
  onVehiclesChanged,
}) => {
  const societyId = society.id || 'soc_emerald_heights';

  const [subTab, setSubTab] = useState<AnprAdminSubTab>('registry');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Primary Datasets
  const [vehicles, setVehicles] = useState<AnprVehicleRecord[]>([]);
  const [movements, setMovements] = useState<VehicleMovementRecord[]>([]);
  const [scans, setScans] = useState<AnprScanRecord[]>([]);
  const [unknownVehicles, setUnknownVehicles] = useState<UnknownVehicleRecord[]>([]);
  const [cameras, setCameras] = useState<GateCameraConfig[]>([]);
  const [barrierConfig, setBarrierConfig] = useState<BarrierControlConfig | null>(null);
  const [retentionPolicy, setRetentionPolicy] = useState<AnprRetentionPolicy | null>(null);
  const [serverHealth, setServerHealth] = useState<{
    ok: boolean;
    activeProviderId: string;
    activeProviderName: string;
    activeProviderConfigured: boolean;
  } | null>(null);

  // Registry Filters
  const [regSearch, setRegSearch] = useState('');
  const [regBuildingFilter, setRegBuildingFilter] = useState('ALL');
  const [regFlatFilter, setRegFlatFilter] = useState('ALL');
  const [regTypeFilter, setRegTypeFilter] = useState('ALL');
  const [regStatusFilter, setRegStatusFilter] = useState('ALL');
  const [regGateStatusFilter, setRegGateStatusFilter] = useState('ALL');

  // Movement Filters
  const [movDirectionFilter, setMovDirectionFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [movGateFilter, setMovGateFilter] = useState('ALL');
  const [movSearch, setMovSearch] = useState('');

  // ANPR Scan Filters
  const [scanDateFilter, setScanDateFilter] = useState<ScanDateFilter>('ALL');
  const [scanCustomStart, setScanCustomStart] = useState(() =>
    new Date(Date.now() - 7 * 86400 * 1000).toISOString().slice(0, 10)
  );
  const [scanCustomEnd, setScanCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [scanOutcomeFilter, setScanOutcomeFilter] = useState<ScanOutcomeFilter>('ALL');
  const [scanSearch, setScanSearch] = useState('');

  // Unknown Vehicle Filter
  const [unknownFilter, setUnknownFilter] = useState<'ALL' | 'PENDING' | 'CONVERTED_TO_REGISTERED'>(
    'ALL'
  );

  // Modals / Drawers
  const [selectedVehicleDrawer, setSelectedVehicleDrawer] = useState<AnprVehicleRecord | null>(
    null
  );
  const [showVehForm, setShowVehForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<AnprVehicleRecord | null>(null);
  const [vehFormError, setVehFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AnprVehicleRecord | null>(null);

  const [convertingUnknown, setConvertingUnknown] = useState<UnknownVehicleRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; caption: string } | null>(null);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [camForm, setCamForm] = useState<Partial<GateCameraConfig>>({
    gateId: 'gate_1',
    gateName: 'Gate #1 (North Main)',
    cameraLabel: '',
    streamType: 'MOBILE_PWA_CAMERA',
    streamUrl: '',
    anprEnabled: true,
  });

  // Vehicle Add/Edit Form State
  const [vForm, setVForm] = useState({
    registrationNumber: '',
    ownerName: '',
    buildingName: '',
    flatNumber: '',
    vehicleType: 'Car' as 'Car' | 'Motorcycle' | 'EV' | 'Bicycle',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleColor: '',
    parkingSlot: '',
    registrationStatus: 'ACTIVE' as VehicleRegistrationStatus,
  });

  // Unknown -> Registered Convert Form State
  const [convertForm, setConvertForm] = useState({
    ownerName: '',
    buildingName: '',
    flatNumber: '',
    vehicleType: 'Car' as 'Car' | 'Motorcycle' | 'EV' | 'Bicycle',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleColor: '',
    parkingSlot: 'P-OPEN',
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vehData, movData, scanData, unkData, camData, barData, retData, healthData] =
        await Promise.all([
          anprService.getSocietyVehicles(societyId),
          anprService.getVehicleMovements(societyId),
          anprService.getAnprScans(societyId),
          anprService.getUnknownVehicles(societyId),
          anprService.getGateCameras(societyId),
          anprService.getBarrierConfig(societyId),
          anprService.getRetentionPolicy(societyId),
          anprService.checkServerHealth(),
        ]);
      setVehicles(vehData);
      setMovements(movData);
      setScans(scanData);
      setUnknownVehicles(unkData);
      setCameras(camData);
      setBarrierConfig(barData);
      setRetentionPolicy(retData);
      setServerHealth(healthData);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to load Vehicle & ANPR data.' });
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => {
    loadAll();
    const unsub = syncBus.subscribeAll((evt) => {
      if (evt.societyId === societyId || evt.societyId === 'all') {
        loadAll();
      }
    });
    return () => unsub();
  }, [loadAll, societyId]);

  // 8 KPI Metrics
  const kpis = useMemo(() => {
    const today = new Date();
    const totalRegistered = vehicles.length;
    const cars = vehicles.filter((v) => v.vehicleType === 'Car').length;
    const bikes = vehicles.filter(
      (v) => v.vehicleType === 'Motorcycle' || v.vehicleType === 'Bicycle'
    ).length;
    const others = vehicles.filter((v) => v.vehicleType === 'EV').length;
    const currentlyInside = vehicles.filter((v) => v.currentGateStatus === 'INSIDE').length;
    const currentlyOutside = vehicles.filter((v) => v.currentGateStatus !== 'INSIDE').length;
    const unknownToday = unknownVehicles.filter((u) => isSameDay(u.createdAt, today)).length;
    const inactiveRegs = vehicles.filter((v) => v.registrationStatus !== 'ACTIVE').length;

    return {
      totalRegistered,
      cars,
      bikes,
      others,
      currentlyInside,
      currentlyOutside,
      unknownToday,
      inactiveRegs,
    };
  }, [vehicles, unknownVehicles]);

  // Filtered Vehicle Registry
  const filteredVehicles = useMemo(() => {
    const q = regSearch.trim().toLowerCase();
    const qPlate = normalizeIndianPlate(regSearch);
    return vehicles.filter((v) => {
      if (
        !matchesSocietyPeriod(
          v.createdAt || v.updatedAt || v.lastEntryAt,
          periodMode,
          dayValue,
          monthValue,
          yearValue
        )
      )
        return false;
      if (regBuildingFilter !== 'ALL' && (v.buildingName || '') !== regBuildingFilter) return false;
      if (regFlatFilter !== 'ALL' && v.flatNumber !== regFlatFilter) return false;
      if (regTypeFilter !== 'ALL' && v.vehicleType !== regTypeFilter) return false;
      if (regStatusFilter !== 'ALL' && v.registrationStatus !== regStatusFilter) return false;
      if (regGateStatusFilter !== 'ALL' && v.currentGateStatus !== regGateStatusFilter)
        return false;
      if (!q) return true;
      return (
        v.registrationNumber.toLowerCase().includes(q) ||
        v.normalizedRegistrationNumber.includes(qPlate) ||
        v.ownerName.toLowerCase().includes(q) ||
        v.flatNumber.toLowerCase().includes(q) ||
        (v.makeModel || '').toLowerCase().includes(q)
      );
    });
  }, [
    vehicles,
    regSearch,
    regBuildingFilter,
    regFlatFilter,
    regTypeFilter,
    regStatusFilter,
    regGateStatusFilter,
    periodMode,
    dayValue,
    monthValue,
    yearValue,
  ]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    const q = movSearch.trim().toLowerCase();
    return movements.filter((m) => {
      if (!matchesSocietyPeriod(m.timestamp, periodMode, dayValue, monthValue, yearValue))
        return false;
      if (movDirectionFilter !== 'ALL' && m.direction !== movDirectionFilter) return false;
      if (movGateFilter !== 'ALL' && m.gateId !== movGateFilter) return false;
      if (!q) return true;
      return (
        (m.registrationNumber || '').toLowerCase().includes(q) ||
        (m.normalizedRegistrationNumber || '').toLowerCase().includes(q) ||
        (m.ownerName || '').toLowerCase().includes(q) ||
        (m.flatNumber || '').toLowerCase().includes(q) ||
        (m.guardName || '').toLowerCase().includes(q)
      );
    });
  }, [movements, movDirectionFilter, movGateFilter, movSearch, periodMode, dayValue, monthValue, yearValue]);

  // Filtered ANPR Scans
  const filteredScans = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400 * 1000);
    const sevenDaysAgo = Date.now() - 7 * 86400 * 1000;
    const q = scanSearch.trim().toLowerCase();

    return scans.filter((s) => {
      if (!matchesSocietyPeriod(s.timestamp, periodMode, dayValue, monthValue, yearValue))
        return false;
      if (scanDateFilter === 'TODAY' && !isSameDay(s.timestamp, today)) return false;
      if (scanDateFilter === 'YESTERDAY' && !isSameDay(s.timestamp, yesterday)) return false;
      if (scanDateFilter === 'LAST_7_DAYS' && new Date(s.timestamp).getTime() < sevenDaysAgo)
        return false;
      if (scanDateFilter === 'CUSTOM') {
        const isoDay = (s.timestamp || '').slice(0, 10);
        if (scanCustomStart && isoDay < scanCustomStart) return false;
        if (scanCustomEnd && isoDay > scanCustomEnd) return false;
      }

      if (scanOutcomeFilter !== 'ALL') {
        if (scanOutcomeFilter === 'REPORTED_INCORRECT') {
          if (!s.reportedIncorrect && s.outcome !== 'REPORTED_INCORRECT') return false;
        } else if (s.outcome !== scanOutcomeFilter) {
          return false;
        }
      }

      if (!q) return true;
      return (
        (s.rawPlateText || '').toLowerCase().includes(q) ||
        (s.normalizedPlate || '').toLowerCase().includes(q) ||
        (s.matchedFlatNumber || '').toLowerCase().includes(q) ||
        (s.matchedOwnerName || '').toLowerCase().includes(q) ||
        (s.guardName || '').toLowerCase().includes(q)
      );
    });
  }, [scans, scanDateFilter, scanCustomStart, scanCustomEnd, scanOutcomeFilter, scanSearch, periodMode, dayValue, monthValue, yearValue]);

  // Filtered Unknown Vehicles
  const filteredUnknown = useMemo(() => {
    return unknownVehicles.filter((u) => {
      if (!matchesSocietyPeriod(u.createdAt, periodMode, dayValue, monthValue, yearValue))
        return false;
      if (unknownFilter === 'PENDING') {
        return u.entryAction === 'PENDING_RESIDENT_APPROVAL' || u.entryAction === 'TEMP_ENTRY_GRANTED';
      }
      if (unknownFilter === 'CONVERTED_TO_REGISTERED') {
        return u.entryAction === 'CONVERTED_TO_REGISTERED';
      }
      return true;
    });
  }, [unknownVehicles, unknownFilter, periodMode, dayValue, monthValue, yearValue]);

  // Distinct Building/Flat Options for Dropdowns
  const buildingNames = useMemo(() => {
    const set = new Set<string>();
    buildings.forEach((b) => set.add(b.name));
    vehicles.forEach((v) => v.buildingName && set.add(v.buildingName));
    return Array.from(set);
  }, [buildings, vehicles]);

  const flatOptions = useMemo(() => {
    const set = new Set<string>();
    flats.forEach((f) => set.add(f.flatNumber));
    vehicles.forEach((v) => v.flatNumber && set.add(v.flatNumber));
    return Array.from(set).sort();
  }, [flats, vehicles]);

  // Handlers
  const openAddVehicleModal = () => {
    setEditingVehicle(null);
    setVehFormError('');
    setVForm({
      registrationNumber: '',
      ownerName: '',
      buildingName: buildingNames[0] || '',
      flatNumber: flatOptions[0] || '',
      vehicleType: 'Car',
      vehicleBrand: '',
      vehicleModel: '',
      vehicleColor: '',
      parkingSlot: '',
      registrationStatus: 'ACTIVE',
    });
    setShowVehForm(true);
  };

  const openEditVehicleModal = (v: AnprVehicleRecord) => {
    setEditingVehicle(v);
    setVehFormError('');
    setVForm({
      registrationNumber: v.registrationNumber,
      ownerName: v.ownerName,
      buildingName: v.buildingName || '',
      flatNumber: v.flatNumber,
      vehicleType: v.vehicleType,
      vehicleBrand: v.vehicleBrand || '',
      vehicleModel: v.vehicleModel || '',
      vehicleColor: v.vehicleColor || '',
      parkingSlot: v.parkingSlot || '',
      registrationStatus: v.registrationStatus,
    });
    setShowVehForm(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehFormError('');
    try {
      const matchedFlat = flats.find((f) => f.flatNumber === vForm.flatNumber);
      const matchedResident = residents.find((r) => r.flatNumber === vForm.flatNumber);
      await anprService.registerOrUpdateVehicle(societyId, {
        id: editingVehicle?.id,
        vehicleId: editingVehicle?.vehicleId,
        registrationNumber: vForm.registrationNumber.trim().toUpperCase(),
        plateNumber: vForm.registrationNumber.trim().toUpperCase(),
        ownerName: vForm.ownerName.trim() || matchedResident?.fullName || 'Registered Resident',
        ownerUserId: editingVehicle?.ownerUserId || matchedResident?.uid,
        buildingId: matchedFlat?.buildingId || editingVehicle?.buildingId,
        buildingName: vForm.buildingName || matchedFlat?.buildingName,
        flatId: matchedFlat?.id || editingVehicle?.flatId || `flat_${vForm.flatNumber}`,
        flatNumber: vForm.flatNumber || 'Unassigned',
        vehicleType: vForm.vehicleType,
        vehicleBrand: vForm.vehicleBrand.trim(),
        vehicleModel: vForm.vehicleModel.trim(),
        vehicleColor: vForm.vehicleColor.trim(),
        makeModel:
          [vForm.vehicleBrand.trim(), vForm.vehicleModel.trim(), vForm.vehicleColor.trim()]
            .filter(Boolean)
            .join(' ') || 'Private Vehicle',
        parkingSlot: vForm.parkingSlot.trim() || 'P-OPEN',
        registrationStatus: vForm.registrationStatus,
        actorIsAdmin: true,
      });

      setShowVehForm(false);
      setFeedback({
        type: 'success',
        text: editingVehicle
          ? `Updated vehicle ${normalizeIndianPlate(vForm.registrationNumber)}.`
          : `Registered vehicle ${normalizeIndianPlate(vForm.registrationNumber)} to Flat ${vForm.flatNumber}.`,
      });
      await loadAll();
      await onVehiclesChanged?.();
    } catch (err: any) {
      setVehFormError(err?.message || 'Unable to save vehicle record.');
    }
  };

  const handleQuickStatusChange = async (
    v: AnprVehicleRecord,
    nextStatus: VehicleRegistrationStatus
  ) => {
    try {
      await anprService.registerOrUpdateVehicle(societyId, {
        ...v,
        registrationStatus: nextStatus,
        actorIsAdmin: true,
      });
      setFeedback({
        type: 'success',
        text: `Vehicle ${v.normalizedRegistrationNumber} marked ${nextStatus}.`,
      });
      await loadAll();
      await onVehiclesChanged?.();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to update status.' });
    }
  };

  const handleConfirmDeleteVehicle = async () => {
    if (!deleteTarget) return;
    await anprService.deleteVehicle(societyId, deleteTarget.id, 'society_admin');
    setDeleteTarget(null);
    if (selectedVehicleDrawer?.id === deleteTarget.id) setSelectedVehicleDrawer(null);
    setFeedback({
      type: 'success',
      text: `Removed vehicle ${deleteTarget.normalizedRegistrationNumber} from society registry.`,
    });
    await loadAll();
    await onVehiclesChanged?.();
  };

  const handleConvertUnknown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingUnknown) return;
    try {
      const matchedFlat = flats.find((f) => f.flatNumber === convertForm.flatNumber);
      const matchedResident = residents.find((r) => r.flatNumber === convertForm.flatNumber);
      await anprService.convertUnknownVehicleToRegistered(societyId, convertingUnknown.id, {
        ownerName: convertForm.ownerName.trim() || matchedResident?.fullName || convertingUnknown.driverName,
        ownerUserId: matchedResident?.uid,
        buildingName: convertForm.buildingName || matchedFlat?.buildingName,
        flatId: matchedFlat?.id,
        flatNumber: convertForm.flatNumber || convertingUnknown.destinationFlat || 'Unassigned',
        vehicleType: convertForm.vehicleType,
        vehicleBrand: convertForm.vehicleBrand,
        vehicleModel: convertForm.vehicleModel,
        vehicleColor: convertForm.vehicleColor,
        parkingSlot: convertForm.parkingSlot,
      });
      setConvertingUnknown(null);
      setFeedback({
        type: 'success',
        text: `Converted ${convertingUnknown.normalizedPlate} into an ACTIVE registered society vehicle.`,
      });
      await loadAll();
      await onVehiclesChanged?.();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to convert unknown vehicle.' });
    }
  };

  const handleSaveBarrierPolicy = async () => {
    if (!barrierConfig) return;
    const saved = await anprService.saveBarrierConfig(societyId, barrierConfig, 'Society Admin');
    setBarrierConfig(saved);
    setFeedback({
      type: 'success',
      text: `Barrier policy saved. Automatic gate opening is ${
        saved.autoOpenBarrierEnabled ? 'ENABLED (Guard confirm remains active)' : 'DISABLED'
      }.`,
    });
  };

  const handleSaveRetention = async () => {
    if (!retentionPolicy) return;
    const saved = await anprService.saveRetentionPolicy(societyId, retentionPolicy);
    setRetentionPolicy(saved);
    setFeedback({
      type: 'success',
      text: `Saved ANPR retention (${saved.imageRetentionDays} days) and OCR confidence threshold (${saved.confidenceThreshold}%).`,
    });
  };

  const handlePurgeExpiredImages = async () => {
    const purged = await anprService.purgeExpiredScanImages(societyId);
    await loadAll();
    setFeedback({
      type: 'success',
      text:
        purged > 0
          ? `Purged ${purged} expired captured plate snapshot(s) cleanly.`
          : 'No expired captured plate snapshots found under current retention window.',
    });
  };

  const handleSaveCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camForm.cameraLabel?.trim()) return;
    const gate = gates.find((g) => g.id === camForm.gateId);
    const cam: GateCameraConfig = {
      id: camForm.id || `cam_${Date.now()}`,
      societyId,
      gateId: camForm.gateId || 'gate_1',
      gateName: gate?.name || camForm.gateName || 'Main Gate',
      cameraLabel: camForm.cameraLabel.trim(),
      streamType: (camForm.streamType as GateCameraConfig['streamType']) || 'MOBILE_PWA_CAMERA',
      streamUrl: camForm.streamUrl?.trim() || '',
      connectionStatus:
        camForm.streamType === 'MOBILE_PWA_CAMERA' ? 'ACTIVE_MOBILE' : 'AWAITING_HARDWARE',
      anprEnabled: camForm.anprEnabled !== false,
      assignedGuardIds: camForm.assignedGuardIds || [],
      updatedAt: new Date().toISOString(),
    };
    const updated = await anprService.saveGateCamera(societyId, cam);
    setCameras(updated);
    setShowCameraModal(false);
    setFeedback({ type: 'success', text: `Saved camera checkpoint "${cam.cameraLabel}".` });
  };

  // Exports
  const handleExportRegistryPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const slug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'Vehicle Registry & ANPR Directory',
      subtitle: 'Society-Scoped Authorized Vehicles & Gate Status',
      filename: `${slug}_vehicle_registry_${period.slug}`,
      filterSummary: `Period: ${period.label} · Building: ${regBuildingFilter} · Flat: ${regFlatFilter} · Type: ${regTypeFilter} · Status: ${regStatusFilter} · Total: ${filteredVehicles.length}`,
      columns: [
        'Plate Number',
        'Normalized',
        'Owner Name',
        'Building',
        'Flat',
        'Type',
        'Make & Model',
        'Parking Slot',
        'Registration',
        'Gate Status',
        'Registered Date',
      ],
      rows: filteredVehicles.map((v) => ({
        'Plate Number': v.registrationNumber,
        Normalized: v.normalizedRegistrationNumber,
        'Owner Name': v.ownerName,
        Building: v.buildingName || '-',
        Flat: v.flatNumber,
        Type: v.vehicleType,
        'Make & Model': v.makeModel,
        'Parking Slot': v.parkingSlot,
        Registration: v.registrationStatus,
        'Gate Status': v.currentGateStatus,
        'Registered Date': normalizeSocietyIsoDate(v.createdAt || v.updatedAt) || '-',
      })),
    });
  };

  const handleExportMovementsPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const slug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'Vehicle IN/OUT Movement Audit Log',
      subtitle: 'Immutable Guard-Confirmed Gate Entry & Exit Ledger',
      filename: `${slug}_vehicle_movements_${period.slug}`,
      filterSummary: `Period: ${period.label} · Direction: ${movDirectionFilter} · Gate: ${movGateFilter} · Total Records: ${filteredMovements.length}`,
      columns: [
        'Timestamp',
        'Direction',
        'Plate',
        'Owner',
        'Flat',
        'Gate',
        'Guard',
        'Confidence',
        'Verification',
      ],
      rows: filteredMovements.map((m) => ({
        Timestamp: new Date(m.timestamp).toLocaleString(),
        Direction: m.direction,
        Plate: m.normalizedRegistrationNumber,
        Owner: m.ownerName || 'Visitor',
        Flat: m.flatNumber || '-',
        Gate: m.gateName,
        Guard: m.guardName,
        Confidence: `${m.confidenceScore}%`,
        Verification: m.verificationStatus,
      })),
    });
  };

  const handleExportScansPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const slug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'ANPR AI Scan History Log',
      subtitle: 'Camera OCR Detections, Confidence & Exception Audit',
      filename: `${slug}_anpr_scans_${period.slug}`,
      filterSummary: `Period: ${period.label} · Date Scope: ${scanDateFilter} · Outcome: ${scanOutcomeFilter} · Total Scans: ${filteredScans.length}`,
      columns: [
        'Timestamp',
        'Raw OCR',
        'Normalized',
        'Confidence',
        'Outcome',
        'Matched Flat',
        'Gate',
        'Guard',
        'Provider',
      ],
      rows: filteredScans.map((s) => ({
        Timestamp: new Date(s.timestamp).toLocaleString(),
        'Raw OCR': s.rawPlateText || '-',
        Normalized: s.normalizedPlate || '-',
        Confidence: `${s.confidenceScore}%`,
        Outcome: s.outcome,
        'Matched Flat': s.matchedFlatNumber || '-',
        Gate: s.gateName,
        Guard: s.guardName,
        Provider: s.provider,
      })),
    });
  };

  const handleExportUnknownPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const slug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'Unknown & Unregistered Vehicles Queue',
      subtitle: 'Security & Access Gates • Unrecognized Vehicle Exceptions',
      filename: `${slug}_unknown_vehicles_${period.slug}`,
      filterSummary: `Period: ${period.label} · Queue Filter: ${unknownFilter} · Total Records: ${filteredUnknown.length}`,
      columns: [
        'Plate / OCR',
        'Driver Name',
        'Mobile',
        'Visitor Type',
        'Target Flat',
        'Gate & Guard',
        'Action Status',
        'Logged At',
      ],
      rows: filteredUnknown.map((u) => ({
        'Plate / OCR': u.normalizedPlate || u.rawPlateText || 'UNREADABLE',
        'Driver Name': u.driverName || '-',
        Mobile: u.driverMobile || '-',
        'Visitor Type': u.visitorType,
        'Target Flat': u.destinationFlat || '-',
        'Gate & Guard': `${u.gateName} (${u.guardName})`,
        'Action Status': u.entryAction,
        'Logged At': new Date(u.createdAt).toLocaleString(),
      })),
    });
  };

  const handleExportCompleteAnprPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const slug = buildSocietySlug(society);
    const regColumns = ['Plate Number', 'Owner Name', 'Flat', 'Type', 'Parking Slot', 'Registration', 'Gate Status'];
    const regRows = filteredVehicles.map((v) => ({
      'Plate Number': v.registrationNumber,
      'Owner Name': v.ownerName,
      Flat: v.flatNumber,
      Type: v.vehicleType,
      'Parking Slot': v.parkingSlot,
      Registration: v.registrationStatus,
      'Gate Status': v.currentGateStatus,
    }));
    const movColumns = ['Timestamp', 'Direction', 'Plate', 'Flat', 'Gate', 'Guard', 'Confidence'];
    const movRows = filteredMovements.map((m) => ({
      Timestamp: new Date(m.timestamp).toLocaleString(),
      Direction: m.direction,
      Plate: m.normalizedRegistrationNumber,
      Flat: m.flatNumber || '-',
      Gate: m.gateName,
      Guard: m.guardName,
      Confidence: `${m.confidenceScore}%`,
    }));
    const scanColumns = ['Timestamp', 'Normalized', 'Confidence', 'Outcome', 'Matched Flat', 'Gate', 'Guard'];
    const scanRows = filteredScans.map((s) => ({
      Timestamp: new Date(s.timestamp).toLocaleString(),
      Normalized: s.normalizedPlate || s.rawPlateText || '-',
      Confidence: `${s.confidenceScore}%`,
      Outcome: s.outcome,
      'Matched Flat': s.matchedFlatNumber || '-',
      Gate: s.gateName,
      Guard: s.guardName,
    }));

    exportSocietyPdf({
      society,
      title: 'Vehicle & ANPR Control Complete Report',
      subtitle: 'Registry, Gate IN/OUT Movements & AI ANPR Scan Logs',
      filename: `${slug}_vehicle_anpr_complete_${period.slug}`,
      filterSummary: `Period: ${period.label} · Vehicles: ${regRows.length} · Movements: ${movRows.length} · ANPR Scans: ${scanRows.length}`,
      columns: regColumns,
      rows: regRows,
      extraSections: [
        { sectionTitle: `Vehicle IN/OUT Movements (${movRows.length})`, columns: movColumns, rows: movRows },
        { sectionTitle: `ANPR AI Scan Logs (${scanRows.length})`, columns: scanColumns, rows: scanRows },
      ],
    });
  };

  const activeAnprMatchedCount =
    subTab === 'registry'
      ? filteredVehicles.length
      : subTab === 'movements'
      ? filteredMovements.length
      : subTab === 'scans'
      ? filteredScans.length
      : filteredUnknown.length;

  const handleActiveAnprPdfExport = () => {
    if (subTab === 'registry') return handleExportRegistryPdf();
    if (subTab === 'movements') return handleExportMovementsPdf();
    if (subTab === 'scans') return handleExportScansPdf();
    return handleExportUnknownPdf();
  };

  const activeAnprPdfLabel =
    subTab === 'registry'
      ? 'Registry PDF'
      : subTab === 'movements'
      ? 'Movements PDF'
      : subTab === 'scans'
      ? 'ANPR Scans PDF'
      : 'Unknown Queue PDF';

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Vehicle & ANPR Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {society.societyName} ({society.societyCode}) · Isolated society vehicle registry, gate IN/OUT state machine & AI plate recognition logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={openAddVehicleModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vehicle</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            {feedback.text}
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 8 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          {
            label: 'Total Vehicles',
            value: kpis.totalRegistered,
            sub: 'Registered',
            icon: Car,
            tone: 'text-slate-900',
            onClick: () => {
              setSubTab('registry');
              setRegTypeFilter('ALL');
              setRegStatusFilter('ALL');
              setRegGateStatusFilter('ALL');
            },
          },
          {
            label: 'Cars',
            value: kpis.cars,
            sub: '4-Wheelers',
            icon: Car,
            tone: 'text-teal-700',
            onClick: () => {
              setSubTab('registry');
              setRegTypeFilter('Car');
            },
          },
          {
            label: 'Bikes',
            value: kpis.bikes,
            sub: '2-Wheelers',
            icon: Bike,
            tone: 'text-indigo-700',
            onClick: () => {
              setSubTab('registry');
              setRegTypeFilter('Motorcycle');
            },
          },
          {
            label: 'Other / EV',
            value: kpis.others,
            sub: 'Electric',
            icon: Zap,
            tone: 'text-sky-700',
            onClick: () => {
              setSubTab('registry');
              setRegTypeFilter('EV');
            },
          },
          {
            label: 'Inside Now',
            value: kpis.currentlyInside,
            sub: 'On Campus',
            icon: ArrowDownLeft,
            tone: 'text-emerald-700',
            onClick: () => {
              setSubTab('registry');
              setRegGateStatusFilter('INSIDE');
            },
          },
          {
            label: 'Outside Now',
            value: kpis.currentlyOutside,
            sub: 'Exited',
            icon: ArrowUpRight,
            tone: 'text-slate-700',
            onClick: () => {
              setSubTab('registry');
              setRegGateStatusFilter('OUTSIDE');
            },
          },
          {
            label: 'Unknown Today',
            value: kpis.unknownToday,
            sub: 'Gate Review',
            icon: ShieldAlert,
            tone: 'text-amber-700',
            onClick: () => setSubTab('unknown'),
          },
          {
            label: 'Inactive',
            value: kpis.inactiveRegs,
            sub: 'Blocked / Hold',
            icon: Ban,
            tone: 'text-rose-700',
            onClick: () => {
              setSubTab('registry');
              setRegStatusFilter('INACTIVE');
            },
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-teal-500 text-left transition-colors cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 truncate">{card.label}</span>
                <Icon className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
              <div>
                <p className={`text-2xl font-bold tabular-nums leading-none ${card.tone}`}>
                  {card.value}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">{card.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-Navigation Segmented Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        {(
          [
            { id: 'registry', label: `Vehicle Registry (${filteredVehicles.length})` },
            { id: 'movements', label: `Movement History (${filteredMovements.length})` },
            { id: 'scans', label: `ANPR Scan History (${filteredScans.length})` },
            {
              id: 'unknown',
              label: `Unknown Vehicles (${filteredUnknown.filter((u) => u.entryAction !== 'CONVERTED_TO_REGISTERED' && u.entryAction !== 'DISMISSED').length})`,
            },
            { id: 'settings', label: 'Gates, Cameras & Privacy' },
          ] as { id: AnprAdminSubTab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === t.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period Filter & PDF Export Toolbar (All Time / Day-wise / Month-wise / Year-wise) */}
      {subTab !== 'settings' && (
        <SocietyPdfExportToolbar
          periodMode={periodMode}
          onPeriodModeChange={setPeriodMode}
          dayValue={dayValue}
          onDayValueChange={setDayValue}
          monthValue={monthValue}
          onMonthValueChange={setMonthValue}
          yearValue={yearValue}
          onYearValueChange={setYearValue}
          matchedCount={activeAnprMatchedCount}
          onExportPdf={handleActiveAnprPdfExport}
          pdfButtonLabel={activeAnprPdfLabel}
          secondaryExportLabel="Complete ANPR PDF"
          onSecondaryExportPdf={handleExportCompleteAnprPdf}
          onResetPeriod={() => setPeriodMode('ALL')}
        />
      )}

      {/* ============================================================ */}
      {/* TAB 1: VEHICLE REGISTRY */}
      {/* ============================================================ */}
      {subTab === 'registry' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  placeholder="Search plate, owner, flat..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <select
                value={regBuildingFilter}
                onChange={(e) => setRegBuildingFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="ALL">All Towers / Blocks</option>
                {buildingNames.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={regFlatFilter}
                onChange={(e) => setRegFlatFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="ALL">All Flats</option>
                {flatOptions.map((f) => (
                  <option key={f} value={f}>
                    Flat {f}
                  </option>
                ))}
              </select>

              <select
                value={regTypeFilter}
                onChange={(e) => setRegTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="ALL">All Types</option>
                <option value="Car">Car</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="EV">EV</option>
                <option value="Bicycle">Bicycle</option>
              </select>

              <select
                value={regStatusFilter}
                onChange={(e) => setRegStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="ALL">All Reg Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>

              <select
                value={regGateStatusFilter}
                onChange={(e) => setRegGateStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="ALL">All Gate States</option>
                <option value="INSIDE">Currently Inside</option>
                <option value="OUTSIDE">Currently Outside</option>
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    `${buildSocietySlug(society)}_vehicles`,
                    ['Plate', 'Normalized', 'Owner', 'Flat', 'Type', 'Make/Model', 'Slot', 'Status', 'Gate'],
                    filteredVehicles.map((v) => [
                      v.registrationNumber,
                      v.normalizedRegistrationNumber,
                      v.ownerName,
                      v.flatNumber,
                      v.vehicleType,
                      v.makeModel,
                      v.parkingSlot,
                      v.registrationStatus,
                      v.currentGateStatus,
                    ])
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportRegistryPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-xs font-semibold text-teal-800 cursor-pointer whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-2.5 px-4">Registration Plate</th>
                  <th className="py-2.5 px-4">Resident / Flat</th>
                  <th className="py-2.5 px-4">Vehicle Details</th>
                  <th className="py-2.5 px-4">Parking</th>
                  <th className="py-2.5 px-4">Registration</th>
                  <th className="py-2.5 px-4">Campus Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No registered vehicles match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-mono font-bold text-slate-900 tabular-nums">
                          {v.registrationNumber}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {v.normalizedRegistrationNumber}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{v.ownerName}</div>
                        <div className="text-[11px] text-slate-500">
                          {v.buildingName ? `${v.buildingName} · ` : ''}Flat {v.flatNumber}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="text-slate-800 font-medium">{v.makeModel}</div>
                        <div className="text-[11px] text-slate-500">
                          {v.vehicleType}
                          {v.vehicleColor ? ` · ${v.vehicleColor}` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700 tabular-nums">
                        {v.parkingSlot}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            v.registrationStatus === 'ACTIVE'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : v.registrationStatus === 'INACTIVE'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {v.registrationStatus === 'ACTIVE' ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <Ban className="w-3 h-3" />
                          )}
                          {v.registrationStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            v.currentGateStatus === 'INSIDE'
                              ? 'bg-sky-50 border-sky-200 text-sky-800'
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          {v.currentGateStatus === 'INSIDE' ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {v.currentGateStatus}
                        </span>
                        {(v.lastEntryAt || v.lastExitAt) && (
                          <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                            {new Date(
                              v.currentGateStatus === 'INSIDE'
                                ? v.lastEntryAt || v.updatedAt
                                : v.lastExitAt || v.updatedAt
                            ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedVehicleDrawer(v)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title="Inspect Vehicle History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditVehicleModal(v)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title="Edit Vehicle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickStatusChange(
                                v,
                                v.registrationStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                              )
                            }
                            className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-medium text-slate-700 cursor-pointer"
                          >
                            {v.registrationStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(v)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                            title="Delete Vehicle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: MOVEMENT HISTORY */}
      {/* ============================================================ */}
      {subTab === 'movements' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={movSearch}
                  onChange={(e) => setMovSearch(e.target.value)}
                  placeholder="Search plate, owner, flat, guard..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['ALL', 'IN', 'OUT'] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setMovDirectionFilter(dir)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      movDirectionFilter === dir
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {dir === 'ALL' ? 'All Movements' : dir}
                  </button>
                ))}
              </div>

              <select
                value={movGateFilter}
                onChange={(e) => setMovGateFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="ALL">All Gates</option>
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    `${buildSocietySlug(society)}_vehicle_movements`,
                    ['Timestamp', 'Direction', 'Plate', 'Owner', 'Flat', 'Gate', 'Guard', 'Confidence', 'Verification'],
                    filteredMovements.map((m) => [
                      m.timestamp,
                      m.direction,
                      m.normalizedRegistrationNumber,
                      m.ownerName || '-',
                      m.flatNumber || '-',
                      m.gateName,
                      m.guardName,
                      `${m.confidenceScore}%`,
                      m.verificationStatus,
                    ])
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportMovementsPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-xs font-semibold text-teal-800 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Direction</th>
                  <th className="py-2.5 px-4">Plate</th>
                  <th className="py-2.5 px-4">Owner / Flat</th>
                  <th className="py-2.5 px-4">Gate & Guard</th>
                  <th className="py-2.5 px-4">Verification</th>
                  <th className="py-2.5 px-4 text-right">Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No vehicle IN/OUT movements recorded for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => (
                    <tr key={m.movementId} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 tabular-nums text-slate-700 whitespace-nowrap">
                        {new Date(m.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-bold ${
                            m.direction === 'IN'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-sky-50 border-sky-200 text-sky-700'
                          }`}
                        >
                          {m.direction === 'IN' ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {m.direction}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        {m.normalizedRegistrationNumber}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-900">{m.ownerName || 'Visitor'}</div>
                        <div className="text-[11px] text-slate-500">
                          Flat {m.flatNumber || 'Gate Entry'}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="text-slate-800">{m.gateName}</div>
                        <div className="text-[11px] text-slate-500">Guard: {m.guardName}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="text-slate-800 font-medium">{m.verificationStatus}</div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          Confidence: {m.confidenceScore}% · {m.source}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {m.capturedImageReference ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: m.capturedImageReference!,
                                caption: `${m.normalizedRegistrationNumber} · ${m.direction} at ${new Date(m.timestamp).toLocaleString()}`,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs text-slate-700 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No photo</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: ANPR SCAN HISTORY */}
      {/* ============================================================ */}
      {subTab === 'scans' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'ALL', label: 'All Dates' },
                    { id: 'TODAY', label: 'Today' },
                    { id: 'YESTERDAY', label: 'Yesterday' },
                    { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                    { id: 'CUSTOM', label: 'Custom Date' },
                  ] as { id: ScanDateFilter; label: string }[]
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setScanDateFilter(d.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      scanDateFilter === d.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      `${buildSocietySlug(society)}_anpr_scans`,
                      ['Timestamp', 'Raw OCR', 'Normalized', 'Confidence', 'Outcome', 'Flat', 'Gate', 'Guard'],
                      filteredScans.map((s) => [
                        s.timestamp,
                        s.rawPlateText,
                        s.normalizedPlate,
                        `${s.confidenceScore}%`,
                        s.outcome,
                        s.matchedFlatNumber || '-',
                        s.gateName,
                        s.guardName,
                      ])
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportScansPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-xs font-semibold text-teal-800 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {scanDateFilter === 'CUSTOM' && (
              <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-700">From:</span>
                <input
                  type="date"
                  value={scanCustomStart}
                  onChange={(e) => setScanCustomStart(e.target.value)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white"
                />
                <span className="font-medium text-slate-700">To:</span>
                <input
                  type="date"
                  value={scanCustomEnd}
                  onChange={(e) => setScanCustomEnd(e.target.value)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white"
                />
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'ALL', label: 'All Outcomes' },
                    { id: 'MATCHED_ACTIVE', label: 'Registered Vehicles' },
                    { id: 'UNKNOWN_VEHICLE', label: 'Unknown Vehicles' },
                    { id: 'FAILED_RECOGNITION', label: 'Failed Recognition' },
                    { id: 'LOW_CONFIDENCE', label: 'Low Confidence' },
                    { id: 'REPORTED_INCORRECT', label: 'Reported Incorrect' },
                  ] as { id: ScanOutcomeFilter; label: string }[]
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setScanOutcomeFilter(o.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer border ${
                      scanOutcomeFilter === o.id
                        ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={scanSearch}
                  onChange={(e) => setScanSearch(e.target.value)}
                  placeholder="Search OCR plate, flat, guard..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Recognized Plate</th>
                  <th className="py-2.5 px-4">Confidence</th>
                  <th className="py-2.5 px-4">Outcome</th>
                  <th className="py-2.5 px-4">Matched Resident / Notes</th>
                  <th className="py-2.5 px-4">Gate / Guard</th>
                  <th className="py-2.5 px-4 text-right">Image</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredScans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No ANPR camera scan events match this date or outcome filter.
                    </td>
                  </tr>
                ) : (
                  filteredScans.map((s) => (
                    <tr key={s.scanId} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 tabular-nums text-slate-700 whitespace-nowrap">
                        {new Date(s.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-mono font-bold text-slate-900">
                          {s.normalizedPlate || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Raw: {s.rawPlateText || 'Unreadable'}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums font-semibold text-slate-800">
                        {s.confidenceScore}%
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${
                            s.outcome === 'MATCHED_ACTIVE'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : s.outcome === 'UNKNOWN_VEHICLE'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : s.outcome === 'REPORTED_INCORRECT' || s.outcome === 'FAILED_RECOGNITION'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {s.outcome.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {s.matchedFlatNumber ? (
                          <div>
                            <span className="font-semibold text-slate-900">
                              {s.matchedOwnerName}
                            </span>
                            <span className="text-slate-500"> · Flat {s.matchedFlatNumber}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Unmatched plate</span>
                        )}
                        {s.mismatchNote && (
                          <div className="text-[11px] text-rose-700 mt-0.5">{s.mismatchNote}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="text-slate-800">{s.gateName}</div>
                        <div className="text-[11px] text-slate-500">
                          {s.guardName} · {s.provider}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {s.capturedImageReference ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: s.capturedImageReference!,
                                caption: `ANPR Scan ${s.normalizedPlate || s.rawPlateText} (${s.confidenceScore}%)`,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs text-slate-700 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Purged / None</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: UNKNOWN VEHICLES REVIEW & CONVERSION */}
      {/* ============================================================ */}
      {subTab === 'unknown' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Unknown & Unregistered Vehicle Review Queue
              </h3>
              <p className="text-xs text-slate-500">
                Inspect unrecognized vehicles logged at gates and optionally convert frequent family/visitor vehicles into active flat registrations.
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'ALL', label: 'All' },
                  { id: 'PENDING', label: 'Needs Review' },
                  { id: 'CONVERTED_TO_REGISTERED', label: 'Converted' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setUnknownFilter(f.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    unknownFilter === f.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredUnknown.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No unknown vehicle check-in entries recorded yet.
              </div>
            ) : (
              filteredUnknown.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70"
                >
                  <div className="flex items-start gap-3.5">
                    {u.capturedImageReference ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: u.capturedImageReference!,
                            caption: `Unknown Vehicle ${u.normalizedPlate || u.rawPlateText}`,
                          })
                        }
                        className="w-20 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer"
                      >
                        <img
                          src={u.capturedImageReference}
                          alt={u.normalizedPlate}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="w-20 h-14 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Car className="w-5 h-5" />
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {u.normalizedPlate || u.rawPlateText || 'UNREADABLE'}
                        </span>
                        <span className="px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-semibold">
                          {u.entryAction.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-500">
                          {u.visitorType} · Confidence {u.confidenceScore}%
                        </span>
                      </div>
                      <div className="text-slate-700">
                        Driver: <strong>{u.driverName}</strong>
                        {u.driverMobile ? ` (${u.driverMobile})` : ''}
                        {u.destinationFlat ? ` → Visiting Flat ${u.destinationFlat}` : ''}
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        {u.gateName} · Guard: {u.guardName} · {new Date(u.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {u.entryAction !== 'CONVERTED_TO_REGISTERED' && u.entryAction !== 'DISMISSED' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setConvertingUnknown(u);
                          setConvertForm({
                            ownerName: u.driverName || '',
                            buildingName: u.destinationBuilding || buildingNames[0] || '',
                            flatNumber: u.destinationFlat || flatOptions[0] || '',
                            vehicleType: 'Car',
                            vehicleBrand: '',
                            vehicleModel: '',
                            vehicleColor: '',
                            parkingSlot: 'P-OPEN',
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Convert to Registered</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await anprService.dismissUnknownVehicle(societyId, u.id);
                          await loadAll();
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: GATES, CAMERAS, BARRIER POLICY & RETENTION */}
      {/* ============================================================ */}
      {subTab === 'settings' && (
        <div className="space-y-6">
          {/* Server AI Engine Health (No client API key input UI) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Trusted Server-Side ANPR Engine Status
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Active Provider:{' '}
                <strong>{serverHealth?.activeProviderName || 'Gemini Vision ANPR'}</strong> · Server API keys are managed strictly via backend environment variables (never stored or exposed in browser UI).
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 ${
                serverHealth?.activeProviderConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {serverHealth?.activeProviderConfigured
                ? 'Server ANPR Ready'
                : 'Backend Key Pending Env Setup'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automatic Barrier Control Policy (Disabled by Default) */}
            {barrierConfig && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-600" />
                      Automatic Boom Barrier Policy
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hardware relay control disabled by default. Guard confirmation on mobile scanner remains mandatory.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  Security Safeguard: Even if high-confidence ANPR detects an active plate, gate entry/exit records and barrier relays require explicit guard confirmation unless hardware interlocks are formally commissioned.
                </div>

                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Enable Automatic Boom Barrier Relay Trigger
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Default: OFF (Disabled until physical barrier controller is installed)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={barrierConfig.autoOpenBarrierEnabled}
                    onChange={(e) =>
                      setBarrierConfig({
                        ...barrierConfig,
                        autoOpenBarrierEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Barrier Auto-Relay Min Confidence (%)
                    </label>
                    <input
                      type="number"
                      min={60}
                      max={99}
                      value={barrierConfig.requireMinimumConfidence}
                      onChange={(e) =>
                        setBarrierConfig({
                          ...barrierConfig,
                          requireMinimumConfidence: Number(e.target.value) || 92,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Hardware Controller Endpoint (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="http://192.168.1.50:8080/relay"
                      value={barrierConfig.hardwareRelayEndpoint || ''}
                      onChange={(e) =>
                        setBarrierConfig({
                          ...barrierConfig,
                          hardwareRelayEndpoint: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveBarrierPolicy}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Barrier Policy
                </button>
              </div>
            )}

            {/* Privacy & Image Retention Policy */}
            {retentionPolicy && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-600" />
                    OCR Threshold & Image Privacy Retention
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure confidence cutoff for guard warnings and automatic image cleanup schedule.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Minimum OCR Confidence Threshold (%)
                    </label>
                    <input
                      type="number"
                      min={40}
                      max={98}
                      value={retentionPolicy.confidenceThreshold}
                      onChange={(e) =>
                        setRetentionPolicy({
                          ...retentionPolicy,
                          confidenceThreshold: Number(e.target.value) || 72,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Captured Image Retention (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={retentionPolicy.imageRetentionDays}
                      onChange={(e) =>
                        setRetentionPolicy({
                          ...retentionPolicy,
                          imageRetentionDays: Number(e.target.value) || 30,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 tabular-nums"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <span className="text-xs font-medium text-slate-800">
                    Auto-purge captured plate photos after retention window (keeps audit log)
                  </span>
                  <input
                    type="checkbox"
                    checked={retentionPolicy.autoPurgeEnabled}
                    onChange={(e) =>
                      setRetentionPolicy({
                        ...retentionPolicy,
                        autoPurgeEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveRetention}
                      className="px-4 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Retention Settings
                    </button>
                    <button
                      type="button"
                      onClick={handlePurgeExpiredImages}
                      className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                    >
                      Purge Expired Images Now
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    Purged total: {retentionPolicy.purgedCount || 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gate Cameras & Future RTSP/ONVIF Adapter List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Gate Cameras & Future CCTV / RTSP Integrations
                </h3>
                <p className="text-xs text-slate-500">
                  Active Guard Mobile PWA scanners alongside modular RTSP / ONVIF camera adapters awaiting fixed hardware bridge connection.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCamForm({
                    gateId: gates[0]?.id || 'gate_1',
                    gateName: gates[0]?.name || 'Gate #1 (North Main)',
                    cameraLabel: '',
                    streamType: 'MOBILE_PWA_CAMERA',
                    streamUrl: '',
                    anprEnabled: true,
                  });
                  setShowCameraModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Gate Camera</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {cameras.map((cam) => (
                <div
                  key={cam.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{cam.cameraLabel}</div>
                      <div className="text-slate-500 mt-0.5">
                        {cam.gateName} · Stream Type: <span className="font-mono">{cam.streamType}</span>
                        {cam.streamUrl ? ` · URL: ${cam.streamUrl}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded border text-[11px] font-semibold ${
                        cam.connectionStatus === 'ACTIVE_MOBILE'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {cam.connectionStatus === 'ACTIVE_MOBILE'
                        ? 'Active Mobile PWA'
                        : 'Awaiting Hardware Connection'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCamForm(cam);
                        setShowCameraModal(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VEHICLE DETAIL DRAWER (FULL HISTORY & SCAN LOGS) */}
      {/* ============================================================ */}
      {selectedVehicleDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {selectedVehicleDrawer.registrationNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedVehicleDrawer.ownerName} · Flat {selectedVehicleDrawer.flatNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicleDrawer(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Normalized Plate</span>
                  <strong className="font-mono text-slate-900">
                    {selectedVehicleDrawer.normalizedRegistrationNumber}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Gate Status</span>
                  <strong className="text-slate-900">{selectedVehicleDrawer.currentGateStatus}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Vehicle Model & Color</span>
                  <strong className="text-slate-900">{selectedVehicleDrawer.makeModel}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Parking Slot & Status</span>
                  <strong className="text-slate-900">
                    {selectedVehicleDrawer.parkingSlot} · {selectedVehicleDrawer.registrationStatus}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Last Gate</span>
                  <strong className="text-slate-900">
                    {selectedVehicleDrawer.lastGateName || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Updated</span>
                  <strong className="text-slate-900 tabular-nums">
                    {new Date(selectedVehicleDrawer.updatedAt).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Movement Audit Trail</h4>
                {movements.filter(
                  (m) =>
                    m.vehicleId === selectedVehicleDrawer.id ||
                    m.normalizedRegistrationNumber ===
                      selectedVehicleDrawer.normalizedRegistrationNumber
                ).length === 0 ? (
                  <p className="text-slate-500">No gate movements logged yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {movements
                      .filter(
                        (m) =>
                          m.vehicleId === selectedVehicleDrawer.id ||
                          m.normalizedRegistrationNumber ===
                            selectedVehicleDrawer.normalizedRegistrationNumber
                      )
                      .map((m) => (
                        <div key={m.movementId} className="p-3 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-900">{m.direction}</span> at{' '}
                            {m.gateName}
                            <div className="text-[11px] text-slate-500">
                              Guard: {m.guardName} · Confidence {m.confidenceScore}%
                            </div>
                          </div>
                          <span className="tabular-nums text-slate-500">
                            {new Date(m.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">ANPR Camera Scan Logs</h4>
                {scans.filter(
                  (s) =>
                    s.matchedVehicleId === selectedVehicleDrawer.id ||
                    s.normalizedPlate === selectedVehicleDrawer.normalizedRegistrationNumber
                ).length === 0 ? (
                  <p className="text-slate-500">No ANPR scans recorded for this plate.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {scans
                      .filter(
                        (s) =>
                          s.matchedVehicleId === selectedVehicleDrawer.id ||
                          s.normalizedPlate === selectedVehicleDrawer.normalizedRegistrationNumber
                      )
                      .map((s) => (
                        <div key={s.scanId} className="p-3 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-900">{s.outcome}</span> ({s.confidenceScore}%)
                            <div className="text-[11px] text-slate-500">
                              Raw: {s.rawPlateText} · {s.gateName}
                            </div>
                          </div>
                          <span className="tabular-nums text-slate-500">
                            {new Date(s.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD / EDIT VEHICLE MODAL */}
      {/* ============================================================ */}
      {showVehForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form
            onSubmit={handleSaveVehicle}
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingVehicle ? 'Edit Registered Vehicle' : 'Register Society Vehicle'}
              </h3>
              <button
                type="button"
                onClick={() => setShowVehForm(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              {vehFormError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                  {vehFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DL 8C AF 1234"
                    value={vForm.registrationNumber}
                    onChange={(e) =>
                      setVForm({ ...vForm, registrationNumber: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vehicle Type</label>
                  <select
                    value={vForm.vehicleType}
                    onChange={(e) =>
                      setVForm({ ...vForm, vehicleType: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Car">Car</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="EV">EV</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Priya Varma"
                    value={vForm.ownerName}
                    onChange={(e) => setVForm({ ...vForm, ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Flat Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="B-704"
                    value={vForm.flatNumber}
                    onChange={(e) => setVForm({ ...vForm, flatNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tower / Block</label>
                  <input
                    type="text"
                    placeholder="Tower B"
                    value={vForm.buildingName}
                    onChange={(e) => setVForm({ ...vForm, buildingName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="Hyundai"
                    value={vForm.vehicleBrand}
                    onChange={(e) => setVForm({ ...vForm, vehicleBrand: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Model</label>
                  <input
                    type="text"
                    placeholder="Ioniq 5"
                    value={vForm.vehicleModel}
                    onChange={(e) => setVForm({ ...vForm, vehicleModel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="White"
                    value={vForm.vehicleColor}
                    onChange={(e) => setVForm({ ...vForm, vehicleColor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Parking Slot</label>
                  <input
                    type="text"
                    placeholder="P-704A"
                    value={vForm.parkingSlot}
                    onChange={(e) => setVForm({ ...vForm, parkingSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={vForm.registrationStatus}
                    onChange={(e) =>
                      setVForm({
                        ...vForm,
                        registrationStatus: e.target.value as VehicleRegistrationStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowVehForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold cursor-pointer"
              >
                {editingVehicle ? 'Save Changes' : 'Register Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* CONVERT UNKNOWN VEHICLE TO REGISTERED MODAL */}
      {/* ============================================================ */}
      {convertingUnknown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form
            onSubmit={handleConvertUnknown}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Convert Unknown Vehicle to Registered
                </h3>
                <p className="text-xs font-mono text-teal-700 font-bold">
                  Plate: {convertingUnknown.normalizedPlate || convertingUnknown.rawPlateText}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConvertingUnknown(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Owner / Resident Name *</label>
                <input
                  type="text"
                  required
                  value={convertForm.ownerName}
                  onChange={(e) => setConvertForm({ ...convertForm, ownerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Flat Number *</label>
                  <input
                    type="text"
                    required
                    value={convertForm.flatNumber}
                    onChange={(e) => setConvertForm({ ...convertForm, flatNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vehicle Type</label>
                  <select
                    value={convertForm.vehicleType}
                    onChange={(e) =>
                      setConvertForm({ ...convertForm, vehicleType: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Car">Car</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="EV">EV</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Brand & Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda City"
                    value={convertForm.vehicleBrand}
                    onChange={(e) => setConvertForm({ ...convertForm, vehicleBrand: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Parking Slot</label>
                  <input
                    type="text"
                    value={convertForm.parkingSlot}
                    onChange={(e) => setConvertForm({ ...convertForm, parkingSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setConvertingUnknown(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Registration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Remove Registered Vehicle?</h3>
            <p className="text-xs text-slate-600">
              Remove <strong className="font-mono">{deleteTarget.registrationNumber}</strong> (Flat{' '}
              {deleteTarget.flatNumber}) from active society ANPR lookups? Past immutable movement logs remain preserved.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVehicle}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                Remove Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* GATE CAMERA MODAL */}
      {/* ============================================================ */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form
            onSubmit={handleSaveCamera}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Configure Gate Camera Adapter</h3>
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Camera Label *</label>
                <input
                  type="text"
                  required
                  placeholder="North Gate Entry Camera"
                  value={camForm.cameraLabel || ''}
                  onChange={(e) => setCamForm({ ...camForm, cameraLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Gate Assignment</label>
                <select
                  value={camForm.gateId || 'gate_1'}
                  onChange={(e) => setCamForm({ ...camForm, gateId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  {gates.length > 0 ? (
                    gates.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="gate_1">Gate #1 (North Main)</option>
                      <option value="gate_2">Gate #2 (East Deliveries)</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Stream / Adapter Type</label>
                <select
                  value={camForm.streamType || 'MOBILE_PWA_CAMERA'}
                  onChange={(e) =>
                    setCamForm({
                      ...camForm,
                      streamType: e.target.value as GateCameraConfig['streamType'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="MOBILE_PWA_CAMERA">Mobile PWA Guard Camera (Active)</option>
                  <option value="RTSP_IP_CAMERA">Fixed RTSP IP Camera (Hardware Bridge)</option>
                  <option value="ONVIF_CCTV">ONVIF CCTV Feed (Hardware Bridge)</option>
                  <option value="WEBHOOK_EDGE_ANPR">Edge ANPR Webhook Adapter</option>
                </select>
              </div>
              {camForm.streamType !== 'MOBILE_PWA_CAMERA' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    RTSP / Edge Bridge URL
                  </label>
                  <input
                    type="text"
                    placeholder="rtsp://192.168.1.25:554/stream1"
                    value={camForm.streamUrl || ''}
                    onChange={(e) => setCamForm({ ...camForm, streamUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold cursor-pointer"
              >
                Save Camera Config
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* CAPTURED IMAGE LIGHTBOX */}
      {/* ============================================================ */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-200 border-b border-slate-800">
              <span className="font-medium truncate">{previewImage.caption}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.caption}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
};
