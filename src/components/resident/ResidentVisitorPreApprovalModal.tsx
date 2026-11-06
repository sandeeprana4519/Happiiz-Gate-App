/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Building2, 
  Truck, 
  Wrench, 
  Car, 
  FileText, 
  ShieldCheck,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { VisitorCategoryType } from '../../types/guard';
import { ResidentGatePass } from '../../types/resident';
import { residentService } from '../../services/firebase/resident.service';

interface ResidentVisitorPreApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory: VisitorCategoryType;
  societyId: string;
  societyName: string;
  building: string;
  flatNumber: string;
  residentUid: string;
  residentName: string;
  onSuccess: (pass: ResidentGatePass) => void;
}

export const ResidentVisitorPreApprovalModal: React.FC<ResidentVisitorPreApprovalModalProps> = ({
  isOpen,
  onClose,
  initialCategory,
  societyId,
  societyName,
  building,
  flatNumber,
  residentUid,
  residentName,
  onSuccess,
}) => {
  const [category, setCategory] = useState<VisitorCategoryType>(initialCategory);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedTime, setExpectedTime] = useState('05:00 PM');
  const [numberOfVisitors, setNumberOfVisitors] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [companyName, setCompanyName] = useState('Swiggy');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      alert('Please enter visitor name.');
      return;
    }

    setSubmitting(true);
    try {
      const newPass = await residentService.createPreApprovedVisitor(
        societyId,
        societyName,
        building,
        flatNumber,
        residentUid,
        residentName,
        {
          visitorName,
          visitorPhone,
          category,
          expectedDate,
          expectedTime,
          purpose: purpose || `${category} Visit`,
          numberOfVisitors,
          companyName: category === 'Delivery' || category === 'Cab' ? companyName : undefined,
          vehiclePlate: category === 'Cab' ? vehiclePlate : undefined,
          instructions,
        }
      );
      onSuccess(newPass);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create pre-approval pass.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden select-none animate-scale-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#111111]">
              Pre-Approve {category}
            </h2>
            <p className="text-xs text-[#A9B0B8]">
              Instant GatePass for Flat {flatNumber} ({building})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Category Tabs */}
          <div>
            <label className="block font-bold text-[#111111] mb-1.5">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Guest', 'Delivery', 'Service', 'Cab'] as VisitorCategoryType[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                    category === cat
                      ? 'bg-[#673AB7] text-white shadow-sm'
                      : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Visitor Name */}
          <div>
            <label className="block font-bold text-[#111111] mb-1">
              {category === 'Delivery' ? 'Delivery Agent / Company' : 'Visitor Name'} *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-[#A9B0B8]" />
              <input
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder={category === 'Guest' ? 'e.g. Karan Mehra' : category === 'Delivery' ? 'e.g. Swiggy Food Courier' : 'e.g. Urban Company Electrician'}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block font-bold text-[#111111] mb-1">Mobile Number (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[#A9B0B8]" />
              <input
                type="tel"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="+91 98210 00000"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
              />
            </div>
          </div>

          {/* Delivery or Cab Specific Options */}
          {category === 'Delivery' && (
            <div>
              <label className="block font-bold text-[#111111] mb-1">Delivery Provider</label>
              <select
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
              >
                {['Swiggy', 'Zomato', 'Amazon', 'Blinkit', 'Flipkart', 'Zepto', 'BlueDart', 'Courier / Other'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {category === 'Cab' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Cab Company</label>
                <select
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
                >
                  {['Ola', 'Uber', 'Rapido', 'InDrive', 'BluSmart', 'Private Cab'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Vehicle Plate (Last 4 digits or full)</label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="e.g. MH 02 CZ 9841"
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#111111] mb-1">Expected Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-[#A9B0B8]" />
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-[#111111] mb-1">Expected Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-4 h-4 text-[#A9B0B8]" />
                <input
                  type="text"
                  value={expectedTime}
                  onChange={(e) => setExpectedTime(e.target.value)}
                  placeholder="e.g. 05:00 PM"
                  className="w-full pl-9 pr-2 py-2 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            </div>
          </div>

          {/* Purpose & Gate Instructions */}
          <div>
            <label className="block font-bold text-[#111111] mb-1">Instructions for Guard / Gate</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Please allow direct entry to Tower B lift lobby or guide to parking P-14."
              className="w-full p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[#673AB7] text-white text-xs font-extrabold hover:bg-[#512DA8] shadow-[0_4px_12px_rgba(103,58,183,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Generating GatePass...' : 'Generate Pre-Approved GatePass'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
