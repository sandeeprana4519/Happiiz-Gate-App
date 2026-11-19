/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Car, 
  ShieldCheck,
  CheckCircle2,
  Wrench,
  Truck
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
  const [vehicleType, setVehicleType] = useState<'None' | 'Bike' | 'Car' | 'Auto' | 'E-Rickshaw' | 'Other'>('None');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
      if (initialCategory === 'Cab') {
        setVehicleType('Car');
        setCompanyName('Ola');
      } else {
        setVehicleType('None');
      }
    }
  }, [isOpen, initialCategory]);

  const handleCategoryChange = (cat: VisitorCategoryType) => {
    setCategory(cat);
    if (cat === 'Cab' && vehicleType === 'None') {
      setVehicleType('Car');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      alert('Please enter visitor name.');
      return;
    }

    setSubmitting(true);
    try {
      const finalPlate = vehicleNumber.trim();
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
          vehicleType,
          vehiclePlate: finalPlate || undefined,
          vehicleNumber: finalPlate || undefined,
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
        <div className="p-4 sm:p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]">
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
          {/* Category Tabs */}
          <div>
            <label className="block font-bold text-[#111111] mb-1.5">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Guest', 'Delivery', 'Service', 'Cab'] as VisitorCategoryType[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
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
              {category === 'Delivery' ? 'Delivery Agent / Company' : category === 'Cab' ? 'Driver / Cab Details' : 'Visitor Full Name'} *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-[#A9B0B8]" />
              <input
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder={
                  category === 'Guest' 
                    ? 'e.g. Karan Mehra' 
                    : category === 'Delivery' 
                    ? 'e.g. Swiggy Food Courier' 
                    : category === 'Cab'
                    ? 'e.g. Uber / Ola Driver'
                    : 'e.g. Urban Company Electrician'
                }
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

          {/* Category-Specific Options */}
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
          )}

          {/* ======================================================== */}
          {/* VEHICLE DETAILS SECTION (GUEST, DELIVERY, SERVICE, CAB)  */}
          {/* ======================================================== */}
          <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-gray-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 font-extrabold text-xs flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[#673AB7]" />
                <span>वाहन का विवरण (Vehicle Details)</span>
              </span>
              <span className="text-[10px] text-gray-600 font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200">
                {vehicleType === 'None' ? 'पैदल / No Vehicle' : `${vehicleType}`}
              </span>
            </div>

            {/* Vehicle Type Choice Chips */}
            <div>
              <label className="block font-semibold text-gray-600 mb-1.5 text-[11px]">
                वाहन प्रकार चुनें (Select Vehicle Type)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { id: 'None', label: 'पैदल', icon: '🚶' },
                  { id: 'Bike', label: 'बाइक', icon: '🏍️' },
                  { id: 'Car', label: 'कार', icon: '🚗' },
                  { id: 'Auto', label: 'ऑटो', icon: '🛺' },
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
                      <span className="text-base">{item.icon}</span>
                      <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Number input when a vehicle is selected (Optional for all four) */}
            {vehicleType !== 'None' && (
              <div className="pt-1 animate-scale-in">
                <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                  Vehicle Registration Number (गाड़ी नंबर - वैकल्पिक / Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL 01 AB 1234 or HR 26 DK 8899"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-mono font-bold tracking-wider uppercase bg-white text-gray-900"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  सुरक्षा रिकॉर्ड व त्वरित गेट क्लीयरेंस के लिए (ऐच्छिक)
                </p>
              </div>
            )}
          </div>

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
              placeholder="e.g. Please allow direct entry to Tower B lift lobby or guide to visitor parking."
              className="w-full p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[#673AB7] text-white text-xs font-extrabold hover:bg-[#512DA8] shadow-[0_4px_12px_rgba(103,58,183,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
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
