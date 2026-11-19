/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Car,
  Bike,
  User,
  Home,
  Building2,
  RotateCcw,
  Edit3,
  Flag,
  LogIn,
  LogOut,
  Loader2,
  Phone,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  AnprRecognitionResponse,
  UnknownVehicleRecord,
  VehicleMatchResult,
  VehicleMovementDirection,
} from '../../types/anpr';
import { formatIndianPlateDisplay, normalizeIndianPlate } from '../../utils/indianPlateNormalizer';

interface GuardAnprResultCardProps {
  societyName: string;
  gateId: string;
  gateName: string;
  capturedImageDataUrl?: string;
  recognition: AnprRecognitionResponse | null;
  matchResult: VehicleMatchResult;
  scanId?: string;
  busy?: boolean;
  onConfirmMovement: (direction: VehicleMovementDirection, verificationNote?: string) => Promise<void>;
  onManualPlateCheck: (manualPlate: string) => Promise<void>;
  onCreateUnknownEntry: (payload: {
    driverName: string;
    driverMobile?: string;
    visitorType: UnknownVehicleRecord['visitorType'];
    destinationFlat?: string;
    action: 'TEMP_ENTRY_GRANTED' | 'PENDING_RESIDENT_APPROVAL';
  }) => Promise<void>;
  onReportMismatch: (note: string) => Promise<void>;
  onRescan: () => void;
}

export const GuardAnprResultCard: React.FC<GuardAnprResultCardProps> = ({
  societyName,
  gateName,
  capturedImageDataUrl,
  recognition,
  matchResult,
  busy = false,
  onConfirmMovement,
  onManualPlateCheck,
  onCreateUnknownEntry,
  onReportMismatch,
  onRescan,
}) => {
  const [showManualInput, setShowManualInput] = useState(
    matchResult.matchType === 'LOW_CONFIDENCE' || matchResult.matchType === 'FAILED_RECOGNITION'
  );
  const [manualPlate, setManualPlate] = useState(
    matchResult.normalizedPlate || recognition?.normalizedPlate || ''
  );

  // Unknown vehicle form state
  const [showUnknownForm, setShowUnknownForm] = useState(matchResult.matchType === 'UNKNOWN_VEHICLE');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [visitorType, setVisitorType] = useState<UnknownVehicleRecord['visitorType']>('Guest');
  const [destinationFlat, setDestinationFlat] = useState('');

  // Report mismatch state
  const [showMismatchBox, setShowMismatchBox] = useState(false);
  const [mismatchNote, setMismatchNote] = useState('');
  const [mismatchSent, setMismatchSent] = useState(false);

  const vehicle = matchResult.vehicle;
  const displayPlate = formatIndianPlateDisplay(
    vehicle?.normalizedRegistrationNumber || matchResult.normalizedPlate || recognition?.rawPlateText || ''
  );

  const badgeTone =
    matchResult.statusBadge === 'REGISTERED VEHICLE'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : matchResult.statusBadge === 'UNKNOWN VEHICLE'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : matchResult.statusBadge === 'LOW CONFIDENCE'
      ? 'bg-orange-100 text-orange-800 border-orange-200'
      : 'bg-rose-100 text-rose-800 border-rose-200';

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeIndianPlate(manualPlate);
    if (cleaned.length < 4) return;
    await onManualPlateCheck(cleaned);
    setShowManualInput(false);
  };

  const handleUnknownSubmit = async (action: 'TEMP_ENTRY_GRANTED' | 'PENDING_RESIDENT_APPROVAL') => {
    if (!driverName.trim()) return;
    await onCreateUnknownEntry({
      driverName: driverName.trim(),
      driverMobile: driverMobile.trim() || undefined,
      visitorType,
      destinationFlat: destinationFlat.trim() || undefined,
      action,
    });
  };

  const handleMismatchSubmit = async () => {
    await onReportMismatch(mismatchNote.trim() || 'OCR plate mismatch flagged by gate guard');
    setMismatchSent(true);
    setShowMismatchBox(false);
  };

  return (
    <div className="space-y-3.5 animate-fade-in">
      {/* Status Banner + Confidence Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${badgeTone}`}
        >
          {matchResult.statusBadge === 'REGISTERED VEHICLE' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : matchResult.statusBadge === 'UNKNOWN VEHICLE' ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          <span>{matchResult.statusBadge}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {matchResult.gateStatusBadge && (
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                matchResult.gateStatusBadge === 'ALREADY INSIDE'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {matchResult.gateStatusBadge}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-purple-50 text-[#673AB7] border border-purple-200 tabular-nums">
            AI {matchResult.confidence}%
          </span>
        </div>
      </div>

      {/* Indian License Plate Badge + Photo Thumbnail */}
      <div className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center gap-3">
        {capturedImageDataUrl ? (
          <img
            src={capturedImageDataUrl}
            alt="Captured vehicle"
            className="w-20 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-900"
          />
        ) : (
          <div className="w-20 h-16 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
            <Car className="w-7 h-7 text-[#673AB7]" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Indian HSRP Plate Styling */}
          <div className="inline-flex items-stretch rounded-lg border-2 border-slate-900 bg-white shadow-xs overflow-hidden max-w-full">
            <div className="w-4 bg-[#1E3A8A] text-white flex flex-col items-center justify-center text-[6px] font-black leading-none px-0.5 shrink-0">
              <span>IN</span>
              <span>D</span>
            </div>
            <span className="px-2.5 py-1 font-mono font-black text-sm sm:text-base tracking-wider text-slate-950 truncate">
              {displayPlate}
            </span>
          </div>

          <p className="text-[11px] text-[#64748B] truncate">
            Raw OCR: <strong className="text-[#111111] font-mono">{recognition?.rawPlateText || 'Manual'}</strong>
            {recognition?.vehicleType && recognition.vehicleType !== 'Unknown' && (
              <> · <span>{recognition.vehicleType}</span></>
            )}
            {recognition?.vehicleColor && <> · <span>{recognition.vehicleColor}</span></>}
          </p>
        </div>
      </div>

      {/* Explanation / Ambiguity / Image Quality Warning */}
      <div
        className={`p-3 rounded-xl text-xs border leading-relaxed ${
          matchResult.matchType === 'MATCHED_ACTIVE'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : matchResult.matchType === 'UNKNOWN_VEHICLE'
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-rose-50/80 border-rose-200 text-rose-900'
        }`}
      >
        <p className="font-semibold">{matchResult.explanation}</p>
        {matchResult.ambiguityMatched && matchResult.matchedViaCandidate && (
          <p className="text-[11px] mt-1 font-bold text-[#673AB7] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Ambiguity Verified: {matchResult.matchedViaCandidate}</span>
          </p>
        )}
        {recognition?.imageQualityIssues && recognition.imageQualityIssues.length > 0 && (
          <p className="text-[11px] mt-1 opacity-85">
            Diagnostics: {recognition.imageQualityIssues.join(', ')}
          </p>
        )}
      </div>

      {/* Registered Vehicle Full Identity Card */}
      {vehicle && (
        <div className="p-3.5 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-[#E6F1F5] pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center shrink-0">
                {vehicle.vehicleType === 'Motorcycle' ? (
                  <Bike className="w-4 h-4" />
                ) : (
                  <Car className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-[#111111] truncate">{vehicle.makeModel}</p>
                <p className="text-[11px] text-[#64748B]">
                  {vehicle.vehicleType} {vehicle.vehicleColor ? `· ${vehicle.vehicleColor}` : ''} · Slot{' '}
                  <strong className="text-[#111111]">{vehicle.parkingSlot}</strong>
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                vehicle.registrationStatus === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {vehicle.registrationStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="w-3.5 h-3.5 text-[#673AB7] shrink-0" />
              <span className="truncate font-semibold text-[#111111]">{vehicle.ownerName}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Home className="w-3.5 h-3.5 text-[#673AB7] shrink-0" />
              <span className="truncate font-semibold text-[#111111]">
                {vehicle.buildingName ? `${vehicle.buildingName} · ` : ''}Flat {vehicle.flatNumber}
              </span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 min-w-0 text-[11px] text-[#64748B]">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {societyName} · Checkpoint: <strong className="text-[#111111]">{gateName}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Plate Correction / Entry Section */}
      {showManualInput && (
        <form
          onSubmit={handleManualSubmit}
          className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2.5"
        >
          <label className="block text-xs font-extrabold text-[#111111]">
            Manual Plate Verification / Correction
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualPlate}
              onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
              placeholder="e.g. DL8CAF1234"
              className="flex-1 px-3 py-2.5 min-h-[44px] rounded-xl bg-white border border-purple-200 text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
            />
            <button
              type="submit"
              disabled={busy || normalizeIndianPlate(manualPlate).length < 4}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#673AB7] text-white text-xs font-extrabold hover:bg-[#512DA8] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Verify Plate
            </button>
          </div>
        </form>
      )}

      {/* Unknown Vehicle Check-In Form */}
      {matchResult.matchType === 'UNKNOWN_VEHICLE' && showUnknownForm && (
        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-amber-950">Log Unknown Vehicle Visit</h4>
            <span className="text-[10px] font-bold text-amber-700">Society Admin Notified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Driver Name *"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="px-3 py-2.5 min-h-[44px] rounded-xl bg-white border border-amber-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
            />
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="Driver Mobile (Optional)"
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 min-h-[44px] rounded-xl bg-white border border-amber-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
              />
            </div>
            <select
              value={visitorType}
              onChange={(e) => setVisitorType(e.target.value as UnknownVehicleRecord['visitorType'])}
              className="px-3 py-2.5 min-h-[44px] rounded-xl bg-white border border-amber-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
            >
              <option value="Guest">Guest</option>
              <option value="Delivery">Delivery</option>
              <option value="Cab">Cab / Taxi</option>
              <option value="Service">Service / Technician</option>
              <option value="Vendor">Commercial Vendor</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Destination Flat (e.g. B-704)"
              value={destinationFlat}
              onChange={(e) => setDestinationFlat(e.target.value.toUpperCase())}
              className="px-3 py-2.5 min-h-[44px] rounded-xl bg-white border border-amber-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={busy || !driverName.trim()}
              onClick={() => handleUnknownSubmit('TEMP_ENTRY_GRANTED')}
              className="min-h-[44px] px-3 py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-extrabold hover:bg-[#512DA8] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Save Temp Entry</span>
            </button>
            <button
              type="button"
              disabled={busy || !driverName.trim()}
              onClick={() => handleUnknownSubmit('PENDING_RESIDENT_APPROVAL')}
              className="min-h-[44px] px-3 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-extrabold hover:bg-amber-100 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Request Resident Approval</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Guard Confirmation Action Bar (Only Valid Next Actions Shown) */}
      <div className="space-y-2 pt-1">
        {matchResult.matchType === 'MATCHED_ACTIVE' && vehicle && (
          <div className="flex gap-2">
            {vehicle.currentGateStatus === 'OUTSIDE' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onConfirmMovement(
                    'IN',
                    matchResult.ambiguityMatched ? 'Verified via Indian OCR ambiguity match' : undefined
                  )
                }
                className="flex-1 min-h-[48px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>CONFIRM IN</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onConfirmMovement(
                    'OUT',
                    matchResult.ambiguityMatched ? 'Verified via Indian OCR ambiguity match' : undefined
                  )
                }
                className="flex-1 min-h-[48px] px-4 py-3 rounded-2xl bg-[#673AB7] hover:bg-[#512DA8] text-white text-sm font-extrabold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span>CONFIRM OUT</span>
              </button>
            )}
          </div>
        )}

        {/* Secondary Guard Tools Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onRescan}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESCAN</span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => setShowManualInput((v) => !v)}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs font-bold text-[#673AB7] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>MANUAL ENTRY</span>
          </button>

          {matchResult.matchType === 'UNKNOWN_VEHICLE' ? (
            <button
              type="button"
              onClick={() => setShowUnknownForm((v) => !v)}
              className="col-span-2 sm:col-span-1 min-h-[44px] px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{showUnknownForm ? 'HIDE FORM' : 'LOG UNKNOWN'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={mismatchSent}
              onClick={() => setShowMismatchBox((v) => !v)}
              className="col-span-2 sm:col-span-1 min-h-[44px] px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{mismatchSent ? 'FLAGGED' : 'REPORT MISMATCH'}</span>
            </button>
          )}
        </div>

        {showMismatchBox && !mismatchSent && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
            <input
              type="text"
              value={mismatchNote}
              onChange={(e) => setMismatchNote(e.target.value)}
              placeholder="Note correct plate or issue (e.g. Read O instead of 0)..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-rose-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMismatchBox(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMismatchSubmit}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                Submit Flag to Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
