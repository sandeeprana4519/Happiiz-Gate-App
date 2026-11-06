/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Car, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { residentService } from '../../services/firebase/resident.service';
import { ResidentGatePass } from '../../types/resident';

interface ResidentAllowCabModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  societyName: string;
  building: string;
  flatNumber: string;
  residentUid: string;
  residentName: string;
  onSuccess: (pass: ResidentGatePass) => void;
}

export const ResidentAllowCabModal: React.FC<ResidentAllowCabModalProps> = ({
  isOpen,
  onClose,
  societyId,
  societyName,
  building,
  flatNumber,
  residentUid,
  residentName,
  onSuccess,
}) => {
  const [cabCompany, setCabCompany] = useState<'Ola' | 'Uber' | 'Rapido' | 'Other'>('Ola');
  const [vehicleLast4, setVehicleLast4] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('Next 10-15 mins');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleLast4.trim()) {
      alert('Please enter vehicle number (last 4 digits).');
      return;
    }

    setSubmitting(true);
    try {
      const pass = await residentService.createPreApprovedVisitor(
        societyId,
        societyName,
        building,
        flatNumber,
        residentUid,
        residentName,
        {
          visitorName: `${cabCompany} Cab (${vehicleLast4})`,
          category: 'Cab',
          expectedDate: new Date().toISOString().slice(0, 10),
          expectedTime: expectedArrival,
          purpose: 'Cab Pickup / Drop-off at Lobby',
          companyName: cabCompany,
          vehiclePlate: vehicleLast4.length === 4 ? `MH -- -- ${vehicleLast4}` : vehicleLast4,
          instructions: `Direct lobby drop-off for Flat ${flatNumber}`,
        }
      );
      onSuccess(pass);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to authorize cab.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden select-none animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Car className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#111111]">Allow My Cab</h2>
              <p className="text-xs text-[#A9B0B8]">Fast clearance for Flat {flatNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Cab Company */}
          <div>
            <label className="block font-bold text-[#111111] mb-1.5">Cab Provider</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Ola', 'Uber', 'Rapido', 'Other'] as const).map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setCabCompany(comp)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                    cabCompany === comp
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          {/* Last 4 Digits of Vehicle */}
          <div>
            <label className="block font-bold text-[#111111] mb-1">
              Vehicle Plate (Last 4 Digits) *
            </label>
            <div className="relative">
              <Car className="absolute left-3.5 top-3 w-4 h-4 text-[#A9B0B8]" />
              <input
                type="text"
                maxLength={10}
                required
                value={vehicleLast4}
                onChange={(e) => setVehicleLast4(e.target.value.toUpperCase())}
                placeholder="e.g. 9841 or MH 02 CZ 9841"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#673AB7]"
              />
            </div>
          </div>

          {/* Expected Arrival */}
          <div>
            <label className="block font-bold text-[#111111] mb-1">Expected Arrival</label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3 w-4 h-4 text-[#A9B0B8]" />
              <input
                type="text"
                value={expectedArrival}
                onChange={(e) => setExpectedArrival(e.target.value)}
                placeholder="e.g. In 5-10 mins"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-[11px] text-[#64748B] leading-relaxed">
            🛡️ Guard terminal will receive vehicle plate #{vehicleLast4 || '----'} with automatic clearance for direct lobby drop-off.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-[#673AB7] text-white text-xs font-extrabold hover:bg-[#512DA8] shadow-[0_4px_12px_rgba(103,58,183,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{submitting ? 'Authorizing Cab...' : 'Authorize Cab Entry'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
