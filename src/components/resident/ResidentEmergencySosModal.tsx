/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  HeartPulse, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Phone,
  CheckCircle2
} from 'lucide-react';
import { residentService } from '../../services/firebase/resident.service';
import { soundAlert } from '../../utils/soundAlert';

interface ResidentEmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  building: string;
  flatNumber: string;
  residentUid: string;
  residentName: string;
  residentPhone: string;
}

type EmergencyCategory =
  | 'Fire Alert'
  | 'Stuck in Lift'
  | 'Medical Emergency'
  | 'Animal Threat'
  | 'Visitor Threat'
  | 'Other Emergency';

export const ResidentEmergencySosModal: React.FC<ResidentEmergencySosModalProps> = ({
  isOpen,
  onClose,
  societyId,
  building,
  flatNumber,
  residentUid,
  residentName,
  residentPhone,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [alertDispatched, setAlertDispatched] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: { id: EmergencyCategory; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { id: 'Fire Alert', label: 'Fire Emergency', icon: Flame, color: 'text-red-500 bg-red-50 border-red-200' },
    { id: 'Stuck in Lift', label: 'Stuck in Lift', icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { id: 'Medical Emergency', label: 'Medical SOS', icon: HeartPulse, color: 'text-rose-500 bg-rose-50 border-rose-200' },
    { id: 'Visitor Threat', label: 'Intruder / Threat', icon: ShieldAlert, color: 'text-purple-500 bg-purple-50 border-purple-200' },
    { id: 'Animal Threat', label: 'Animal Threat', icon: AlertTriangle, color: 'text-orange-500 bg-orange-50 border-orange-200' },
    { id: 'Other Emergency', label: 'Other Emergency', icon: ShieldAlert, color: 'text-slate-500 bg-slate-50 border-slate-200' },
  ];

  const handleConfirmTrigger = async () => {
    if (!selectedCategory) return;
    setTriggering(true);
    try {
      // Sound local siren pulse
      soundAlert.playEmergencySirenPulse();

      const result = await residentService.triggerEmergencySos(
        societyId,
        residentUid,
        residentName,
        building,
        flatNumber,
        residentPhone,
        selectedCategory
      );
      setAlertId(result.alertId);
      setAlertDispatched(true);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch SOS alert.');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-red-200 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-red-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 animate-pulse text-white" />
            <div>
              <h2 className="text-base font-black">Emergency SOS Center</h2>
              <p className="text-xs text-red-100">Direct Alert to Guards & Quick Response</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {alertDispatched ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                🚨 SOS Alert Dispatched!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Security guards at all gates and Society Admins have been notified with your exact flat coordinates (<strong>{building} - Flat {flatNumber}</strong>).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 text-left space-y-1">
              <p>Alert ID: <strong>{alertId}</strong></p>
              <p>Category: <strong>{selectedCategory}</strong></p>
              <p>Status: <strong className="text-red-600">ACTIVE RESPONSE</strong></p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close & Stand By
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4 text-xs">
            <p className="text-slate-600 font-medium">
              Select emergency type to notify on-duty guards and the quick response team immediately:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-600 ring-2 ring-red-400 bg-red-50 text-red-950 font-bold'
                        : `${cat.color} hover:shadow-xs`
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2 shrink-0" />
                    <span className="font-extrabold text-xs">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedCategory && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-red-700 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Confirm Dispatch for Flat {flatNumber}?</span>
                </div>
                <p className="text-[11px] text-red-800">
                  This will broadcast an audible siren alert to security guard terminals.
                </p>
                <button
                  type="button"
                  disabled={triggering}
                  onClick={handleConfirmTrigger}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{triggering ? 'Broadcasting...' : `CONFIRM ${selectedCategory.toUpperCase()}`}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
