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
  const [cabCompany, setCabCompany] = useState<'Ola' | 'Uber' | 'Rapido' | 'BluSmart' | 'Other'>('Ola');
  const [vehicleType, setVehicleType] = useState<'Car' | 'Auto' | 'Bike' | 'E-Rickshaw' | 'Other'>('Car');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('Next 10-15 mins');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const plate = vehiclePlate.trim();
      const pass = await residentService.createPreApprovedVisitor(
        societyId,
        societyName,
        building,
        flatNumber,
        residentUid,
        residentName,
        {
          visitorName: `${cabCompany} ${vehicleType} ${plate ? `(${plate})` : ''}`.trim(),
          category: 'Cab',
          expectedDate: new Date().toISOString().slice(0, 10),
          expectedTime: expectedArrival,
          purpose: 'Cab Pickup / Drop-off at Lobby',
          companyName: cabCompany,
          vehicleType,
          vehiclePlate: plate || undefined,
          vehicleNumber: plate || undefined,
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
        <div className="p-4 sm:p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Car className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#111111]">Allow My Cab (कैब प्रवेश)</h2>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Cab Company */}
          <div>
            <label className="block font-bold text-[#111111] mb-1.5">Cab Provider</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Ola', 'Uber', 'Rapido', 'Other'] as const).map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setCabCompany(comp)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
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

          {/* Vehicle Type Choice Chips */}
          <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-gray-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 font-extrabold text-xs flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[#673AB7]" />
                <span>वाहन प्रकार (Vehicle Type)</span>
              </span>
              <span className="text-[10px] text-gray-600 font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200">
                {vehicleType}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'Car', label: 'कार', icon: '🚗' },
                { id: 'Auto', label: 'ऑटो', icon: '🛺' },
                { id: 'Bike', label: 'बाइक', icon: '🏍️' },
                { id: 'E-Rickshaw', label: 'ई-रिक्शा', icon: '⚡' },
                { id: 'Other', label: 'अन्य', icon: '🚚' },
              ].map((item) => {
                const isSelected = vehicleType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setVehicleType(item.id as any)}
                    className={`py-2 px-1 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#673AB7] text-white border-[#673AB7] shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Vehicle Plate (Optional) */}
            <div className="pt-1">
              <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                Vehicle Number (गाड़ी नंबर - वैकल्पिक / Optional)
              </label>
              <input
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                placeholder="e.g. MH 02 CZ 9841 or last 4 digits"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-[#673AB7] focus:outline-none bg-white text-gray-900"
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
            🛡️ Guard terminal will receive {cabCompany} ({vehicleType}) clearance for direct lobby drop-off.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-[#673AB7] text-white text-xs font-extrabold hover:bg-[#512DA8] shadow-[0_4px_12px_rgba(103,58,183,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{submitting ? 'Authorizing Cab...' : 'Authorize Cab Entry'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
