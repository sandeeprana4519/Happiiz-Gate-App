/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  User, 
  Building2, 
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { ResidentGatePass } from '../../types/resident';

interface ResidentDigitalGatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  pass: ResidentGatePass | null;
  onCancelPass?: (passId: string) => void;
}

export const ResidentDigitalGatePassModal: React.FC<ResidentDigitalGatePassModalProps> = ({
  isOpen,
  onClose,
  pass,
  onCancelPass,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !pass) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pass.passCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `GatePass for ${pass.visitorName}`,
        text: `Here is your Happiiz GatePass for Flat ${pass.flatNumber}, ${pass.societyName}. Your entry code is: ${pass.passCode}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopyCode();
      alert(`GatePass Code #${pass.passCode} copied to clipboard! Share it with ${pass.visitorName}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden select-none animate-scale-in">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#673AB7] to-[#512DA8] p-5 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <span className="text-xs font-black uppercase tracking-widest text-purple-200">
              Happiiz Digital GatePass
            </span>
          </div>
          <h2 className="text-lg font-black">{pass.societyName}</h2>
          <p className="text-xs text-purple-200 mt-0.5">
            Flat {pass.flatNumber} · {pass.building}
          </p>
        </div>

        {/* Pass Body */}
        <div className="p-5 space-y-4">
          {/* Visitor Banner */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <div className="w-12 h-12 rounded-2xl bg-[#673AB7] text-white flex items-center justify-center text-lg font-black shrink-0 shadow-sm">
              {pass.visitorName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#111111] truncate">{pass.visitorName}</h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                  {pass.category}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5 truncate">
                {pass.companyName || pass.purpose || 'Visitor Clearance'}
              </p>
              {(pass.vehiclePlate || pass.vehicleNumber || (pass.vehicleType && pass.vehicleType !== 'None')) && (
                <p className="text-[11px] font-mono text-[#673AB7] font-bold mt-0.5">
                  Vehicle: {pass.vehicleType && pass.vehicleType !== 'None' ? `${pass.vehicleType} ` : ''}
                  {pass.vehiclePlate || pass.vehicleNumber ? `(${pass.vehiclePlate || pass.vehicleNumber})` : ''}
                </p>
              )}
            </div>
          </div>

          {/* 6-Digit GatePass Code Box */}
          <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-purple-200 text-center space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">
              6-Digit Entry Code for Guard
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black font-mono tracking-widest text-[#673AB7]">
                {pass.passCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#673AB7] transition-colors cursor-pointer"
                title="Copy Pass Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[#A9B0B8]">
              Valid until {new Date(pass.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} today
            </p>
          </div>

          {/* QR Code Graphic Display */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs">
            <div className="w-32 h-32 rounded-xl bg-slate-900 p-2 flex items-center justify-center relative group">
              <QrCode className="w-28 h-28 text-white stroke-[1.5]" />
              <div className="absolute inset-0 bg-[#673AB7]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                <span className="text-[10px] font-bold text-white bg-black/80 px-2 py-1 rounded-full">
                  Scan at Gate
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#A9B0B8] mt-2">
              Pass ID: {pass.id}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 py-3 rounded-2xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] shadow-[0_4px_12px_rgba(103,58,183,0.3)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Pass</span>
            </button>
            {onCancelPass && pass.status === 'PRE_APPROVED' && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Cancel this GatePass? The entry code will be revoked.')) {
                    onCancelPass(pass.id);
                    onClose();
                  }
                }}
                className="px-4 py-3 rounded-2xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Cancel Pass
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
