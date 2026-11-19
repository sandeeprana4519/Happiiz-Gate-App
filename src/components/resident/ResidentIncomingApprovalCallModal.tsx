/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  User, 
  Truck, 
  Wrench, 
  Car, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  PhoneCall,
  Volume2
} from 'lucide-react';
import { GuardVisitor } from '../../types/guard';
import { soundAlert } from '../../utils/soundAlert';

interface ResidentIncomingApprovalCallModalProps {
  visitor: GuardVisitor | null;
  onAccept: (visitorId: string) => Promise<void>;
  onDeny: (visitorId: string) => Promise<void>;
  onCallGuard?: (guardPhone?: string) => void;
  onDismiss: () => void;
}

export const ResidentIncomingApprovalCallModal: React.FC<ResidentIncomingApprovalCallModalProps> = ({
  visitor,
  onAccept,
  onDeny,
  onCallGuard,
  onDismiss,
}) => {
  const [countdown, setCountdown] = useState(45);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!visitor) return;

    // Gentle doorbell ring
    soundAlert.playVisitorChime();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visitor, onDismiss]);

  if (!visitor) return null;

  const handleAcceptClick = async () => {
    setResponding(true);
    try {
      soundAlert.playApprovalChime();
      await onAccept(visitor.id);
      onDismiss();
    } finally {
      setResponding(false);
    }
  };

  const handleDenyClick = async () => {
    setResponding(true);
    try {
      await onDeny(visitor.id);
      onDismiss();
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl overflow-hidden p-6 text-center space-y-5 animate-scale-in">
        {/* Pulsing Ringing Doorbell Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 animate-pulse">
            <Volume2 className="w-3.5 h-3.5" />
            <span>INCOMING GATE DOORBELL ({countdown}s)</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mt-2">
            Visitor at Society Gate
          </h2>
          <p className="text-xs text-slate-400">
            {visitor.gateName} · Guard: {visitor.guardName}
          </p>
        </div>

        {/* Visitor Photo & Category */}
        <div className="relative mx-auto w-24 h-24 rounded-full ring-4 ring-[#673AB7] p-1 overflow-hidden bg-slate-900 flex items-center justify-center shadow-lg">
          {visitor.photoUrl ? (
            <img
              src={visitor.photoUrl}
              alt={visitor.visitorName}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#673AB7]/30 text-white flex items-center justify-center text-3xl font-black">
              {visitor.visitorName.charAt(0)}
            </div>
          )}
          <span className="absolute bottom-0 right-1 p-1 rounded-full bg-[#673AB7] text-white">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>

        {/* Visitor Credentials */}
        <div className="space-y-1 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-black text-white">{visitor.visitorName}</h3>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 font-bold border border-purple-700">
              {visitor.category}
            </span>
            {visitor.deliveryCompany && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700">
                {visitor.deliveryCompany}
              </span>
            )}
            {visitor.cabVehiclePlate && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 font-mono font-bold border border-blue-700">
                {visitor.cabVehiclePlate}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Purpose: <strong className="text-slate-200">{visitor.purpose || 'Entry clearance request'}</strong>
          </p>
          {visitor.visitorPhone && (
            <p className="text-xs text-slate-400">
              Phone: <strong className="text-slate-200">{visitor.visitorPhone}</strong>
            </p>
          )}
        </div>

        {/* Call Guard Button */}
        <div>
          <button
            type="button"
            onClick={() => {
              if (onCallGuard) onCallGuard(visitor.residentPhone);
              else alert(`Dialing Gate Intercom for ${visitor.gateName}...`);
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Phone className="w-3.5 h-3.5 text-purple-400" />
            <span>Call Gate Guard ({visitor.guardName})</span>
          </button>
        </div>

        {/* Action Buttons: DENY and ACCEPT */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* DENY BUTTON */}
          <button
            type="button"
            disabled={responding}
            onClick={handleDenyClick}
            className="py-3.5 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 font-bold text-xs hover:bg-rose-600 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            <span>DENY ENTRY</span>
          </button>

          {/* ACCEPT BUTTON */}
          <button
            type="button"
            disabled={responding}
            onClick={handleAcceptClick}
            className="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-[0_4px_16px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{responding ? 'Authorizing...' : 'ALLOW ENTRY'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
