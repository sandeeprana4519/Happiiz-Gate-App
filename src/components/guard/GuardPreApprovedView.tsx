/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Search, 
  User, 
  Truck, 
  Wrench, 
  Car, 
  Clock, 
  Phone, 
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { GuardVisitor, VisitorCategoryType } from '../../types/guard';

interface GuardPreApprovedViewProps {
  visitors: GuardVisitor[];
  onFastTrackCheckIn: (visitorId: string) => Promise<void>;
  onRefresh?: () => void;
}

export const GuardPreApprovedView: React.FC<GuardPreApprovedViewProps> = ({
  visitors,
  onFastTrackCheckIn,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | VisitorCategoryType>('ALL');
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null);

  const preApprovedList = visitors.filter(v => v.isPreApproved || v.status === 'APPROVED');
  const filtered = preApprovedList.filter(p => {
    const matchSearch = searchTerm === '' ||
      p.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.passCode.includes(searchTerm) ||
      (p.visitorPhone && p.visitorPhone.includes(searchTerm)) ||
      (p.residentName && p.residentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.cabVehiclePlate && p.cabVehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleCheckIn = async (visitorId: string) => {
    setCheckInLoading(visitorId);
    try {
      await onFastTrackCheckIn(visitorId);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCheckInLoading(null);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3.5 px-1 sm:px-2 pt-2 pb-24 animate-fade-in max-w-lg mx-auto min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
            <span>Resident Pre-Approved Passes</span>
            <CheckCircle2 className="w-4 h-4 text-[#673AB7]" />
          </h2>
          <p className="text-[11px] text-gray-500">Scheduled guests and delivery agents cleared in advance</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-purple-50 text-[#673AB7] font-extrabold text-xs border border-purple-100 shrink-0">
          {preApprovedList.length} Pre-Approved
        </span>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {(['ALL', 'Guest', 'Delivery', 'Service', 'Cab'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-gray-600 border border-[#E6F1F5] hover:bg-gray-100'
            }`}
          >
            {cat === 'ALL' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by visitor, flat, passcode, resident..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-[#F1F9FC] rounded-2xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
        />
      </div>

      {/* List of Pre-Approved Passes */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-gray-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-purple-400 mx-auto mb-1 opacity-70" />
            <p className="font-bold text-gray-700">No active pre-approved GatePasses</p>
            <p className="text-[11px]">When residents create advance gate passes, they appear here.</p>
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs space-y-3 hover:border-[#673AB7] transition-all"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3 flex-wrap xs:flex-nowrap min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.visitorName} className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-purple-200 shrink-0" />
                  ) : (
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold shrink-0">
                      {p.category === 'Guest' ? <User className="w-5 h-5 sm:w-6 sm:h-6" /> :
                       p.category === 'Delivery' ? <Truck className="w-5 h-5 sm:w-6 sm:h-6" /> :
                       p.category === 'Service' ? <Wrench className="w-5 h-5 sm:w-6 sm:h-6" /> :
                       <Car className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">{p.visitorName}</h4>
                      <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F1F9FC] text-[#673AB7] border border-[#E6F1F5] shrink-0">
                        {p.deliveryCompany || p.cabCompany || p.category}
                      </span>
                    </div>

                    <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 truncate">
                      To Flat <strong className="text-gray-900">{p.flatNumber}</strong> ({p.building})
                      {p.residentName && ` • Resident: ${p.residentName}`}
                    </p>

                    {(p.vehicleNumber || p.cabVehiclePlate) && (
                      <p className="text-[10px] sm:text-[11px] font-mono font-bold text-gray-700 mt-0.5 truncate flex items-center gap-1">
                        <span className="text-[9px] px-1 py-0.2 bg-purple-50 text-[#673AB7] rounded font-sans font-bold">
                          {p.vehicleType && p.vehicleType !== 'None' ? p.vehicleType : 'Vehicle'}:
                        </span>
                        <span>{p.vehicleNumber || p.cabVehiclePlate}</span>
                      </p>
                    )}
                  </div>
                </div>

                <span className="font-mono font-black text-xs sm:text-sm text-[#673AB7] bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100 shrink-0">
                  #{p.passCode}
                </span>
              </div>

              {p.purpose && (
                <p className="text-[11px] text-gray-500 italic bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-gray-100">
                  Purpose: {p.purpose}
                </p>
              )}

              {/* Action buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pre-Approved
                </span>

                <div className="flex items-center gap-2">
                  {p.residentPhone && (
                    <a
                      href={`tel:${p.residentPhone}`}
                      className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                      title="Call Host Resident"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCheckIn(p.id)}
                    disabled={checkInLoading === p.id}
                    className="px-4 py-1.5 bg-[#673AB7] hover:bg-[#5E35B1] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{checkInLoading === p.id ? 'Checking In...' : 'Fast Check-In (प्रवेश दें)'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
