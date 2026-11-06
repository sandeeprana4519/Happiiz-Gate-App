/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Users, 
  Phone, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  Power 
} from 'lucide-react';
import { PartnerTechnician } from '../../types/servicePartner';
import { servicePartnerService } from '../../services/firebase/servicePartner.service';

interface PartnerTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  technicians: PartnerTechnician[];
  onRefresh: () => void;
}

export const PartnerTeamModal: React.FC<PartnerTeamModalProps> = ({
  isOpen,
  onClose,
  partnerId,
  technicians,
  onRefresh,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialization, setSpecialization] = useState('Senior Electrician');
  const [employeeId, setEmployeeId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) return;

    setSubmitting(true);
    try {
      await servicePartnerService.addTechnician(partnerId, {
        fullName,
        phoneNumber,
        specialization,
        employeeId: employeeId || undefined,
      });
      setFullName('');
      setPhoneNumber('');
      setEmployeeId('');
      setShowAdd(false);
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (techId: string) => {
    await servicePartnerService.toggleTechnicianStatus(partnerId, techId);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#111111]">
              Technician Team Management
            </h2>
            <p className="text-xs text-[#A9B0B8]">
              Manage field engineers, specialists and staff
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3 bg-white border-b border-[#E6F1F5] flex items-center justify-between">
          <span className="text-xs font-bold text-[#64748B]">
            {technicians.length} Registered Technicians
          </span>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Technician</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {showAdd && (
            <form onSubmit={handleAddSubmit} className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
              <h4 className="font-bold text-xs text-[#111111]">Register New Technician</h4>
              <input
                type="text"
                required
                placeholder="Full Name (e.g. Ramesh Verma)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number (+91 ...)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
              />
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
              >
                <option value="Senior Electrician">Senior Electrician</option>
                <option value="AC Jet Cleaning & HVAC">AC Jet Cleaning & HVAC</option>
                <option value="Plumbing & Drainage">Plumbing & Drainage</option>
                <option value="Appliance Repair Technician">Appliance Repair Technician</option>
                <option value="Carpentry Specialist">Carpentry Specialist</option>
              </select>
              <input
                type="text"
                placeholder="Employee ID (optional)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] cursor-pointer"
              >
                {submitting ? 'Registering...' : 'Save & Issue Security Credentials'}
              </button>
            </form>
          )}

          <div className="space-y-2.5">
            {technicians.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {t.photoUrl ? (
                    <img
                      src={t.photoUrl}
                      alt={t.fullName}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#673AB7] text-white font-bold flex items-center justify-center shrink-0">
                      {t.fullName.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs text-[#111111]">{t.fullName}</h4>
                      <span className="font-mono text-[10px] text-[#A9B0B8]">#{t.employeeId}</span>
                    </div>
                    <p className="text-[11px] font-medium text-[#673AB7]">{t.specialization}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#64748B] mt-0.5">
                      <span>{t.phoneNumber}</span>
                      <span>·</span>
                      <span className="text-amber-600 font-bold">★ {t.rating}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleStatus(t.id)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    t.isActive
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                  title={t.isActive ? 'Active (Click to Deactivate)' : 'Inactive (Click to Activate)'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
