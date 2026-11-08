/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LogOut, 
  Clock, 
  Phone, 
  Search, 
  User, 
  Truck, 
  Wrench, 
  Car, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight,
  History,
  Filter,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { GuardVisitor, VisitorCategoryType } from '../../types/guard';

interface GuardInsideViewProps {
  visitors: GuardVisitor[];
  activeGate: string;
  guardName: string;
  onCheckOut: (visitorId: string, exitGate: string, guardName: string) => Promise<void>;
  onRefresh: () => void;
  initialMode?: 'IN' | 'OUT';
}

export const GuardInsideView: React.FC<GuardInsideViewProps> = ({
  visitors,
  activeGate,
  guardName,
  onCheckOut,
  onRefresh,
  initialMode = 'IN',
}) => {
  const [activeMode, setActiveMode] = useState<'IN' | 'OUT'>(initialMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | VisitorCategoryType>('ALL');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // IN list (visitors currently inside premises)
  const insideList = visitors.filter(v => v.status === 'INSIDE');
  const filteredInside = insideList.filter(v => {
    const matchSearch = searchTerm === '' ||
      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.passCode.includes(searchTerm) ||
      (v.visitorPhone && v.visitorPhone.includes(searchTerm)) ||
      (v.deliveryCompany && v.deliveryCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.cabVehiclePlate && v.cabVehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.vehicleNumber && v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.vehicleType && v.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchCat = categoryFilter === 'ALL' || v.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // OUT list (visitors who have checked out or exit history logs)
  const outList = visitors.filter(v => v.status === 'CHECKED_OUT');
  const filteredOut = outList.filter(v => {
    const matchSearch = searchTerm === '' ||
      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.passCode.includes(searchTerm) ||
      (v.visitorPhone && v.visitorPhone.includes(searchTerm)) ||
      (v.deliveryCompany && v.deliveryCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.cabVehiclePlate && v.cabVehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.vehicleNumber && v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.vehicleType && v.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchCat = categoryFilter === 'ALL' || v.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleProcessCheckout = async (id: string) => {
    setCheckoutLoading(id);
    try {
      await onCheckOut(id, activeGate, guardName);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getDurationString = (entryTime?: string, exitTime?: string) => {
    if (!entryTime) return 'Just entered';
    const endTime = exitTime ? new Date(exitTime).getTime() : Date.now();
    const mins = Math.floor((endTime - new Date(entryTime).getTime()) / (60 * 1000));
    if (mins < 1) return exitTime ? '< 1m duration' : 'Just entered';
    if (mins < 60) return `${mins}m ${exitTime ? 'stay' : 'inside'}`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ${exitTime ? 'stay' : 'inside'}`;
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3.5 px-1 sm:px-2 pt-2 pb-24 animate-fade-in max-w-lg mx-auto min-w-0">
      {/* Top Toggle Switcher: IN (अंदर) vs OUT (बाहर / Logs) */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F1F9FC] rounded-2xl border border-[#E6F1F5] text-xs font-bold w-full min-w-0">
        <button
          type="button"
          onClick={() => {
            setActiveMode('IN');
            setSearchTerm('');
            setCategoryFilter('ALL');
          }}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-0 cursor-pointer ${
            activeMode === 'IN'
              ? 'bg-[#673AB7] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 shrink-0" />
          <span className="truncate">In (अंदर) • {insideList.length}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('OUT');
            setSearchTerm('');
            setCategoryFilter('ALL');
          }}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-0 cursor-pointer ${
            activeMode === 'OUT'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 shrink-0" />
          <span className="truncate">Out (बाहर / Logs) • {outList.length}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: IN (Active Inside Premises) */}
      {/* ======================================================== */}
      {activeMode === 'IN' && (
        <div className="space-y-3 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-0.5">
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <span>Inside Premises</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-[11px] text-gray-500">Currently on society grounds (वर्तमान में अंदर)</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-[#673AB7] font-extrabold text-xs border border-purple-100 shrink-0">
              {insideList.length} Active Inside
            </span>
          </div>

          {/* Category Filter Pills for IN */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(['ALL', 'Guest', 'Delivery', 'Service', 'Cab'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#673AB7] text-white shadow-xs'
                    : 'bg-[#F1F9FC] text-gray-600 border border-[#E6F1F5] hover:bg-gray-100'
                }`}
              >
                {cat === 'ALL' ? 'All Inside' : cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by visitor, flat, cab plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F1F9FC] rounded-2xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
            />
          </div>

          {/* List of Inside Visitors */}
          <div className="space-y-2.5">
            {filteredInside.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-gray-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <p className="font-semibold text-gray-700">No visitors inside premises</p>
                <p className="text-[11px]">All checked-in visitors have completed exit clearance.</p>
              </div>
            ) : (
              filteredInside.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3 flex-wrap xs:flex-nowrap min-w-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {v.photoUrl ? (
                        <img src={v.photoUrl} alt={v.visitorName} className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-purple-200 shrink-0" />
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold shrink-0">
                          {v.category === 'Guest' ? <User className="w-5 h-5 sm:w-6 sm:h-6" /> :
                           v.category === 'Delivery' ? <Truck className="w-5 h-5 sm:w-6 sm:h-6" /> :
                           v.category === 'Service' ? <Wrench className="w-5 h-5 sm:w-6 sm:h-6" /> :
                           <Car className="w-5 h-5 sm:w-6 sm:h-6" />}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">{v.visitorName}</h4>
                          <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F1F9FC] text-[#673AB7] border border-[#E6F1F5] shrink-0">
                            {v.deliveryCompany || v.cabCompany || v.category}
                          </span>
                        </div>

                        <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 truncate">
                          To Flat <strong className="text-gray-900">{v.flatNumber}</strong> ({v.building})
                        </p>

                        {(v.vehicleNumber || v.cabVehiclePlate) && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              {v.vehicleType && v.vehicleType !== 'None' ? v.vehicleType : 'Vehicle'}:
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-gray-800 tracking-wider bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {v.vehicleNumber || v.cabVehiclePlate}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shrink-0 flex items-center gap-1 self-start">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">{getDurationString(v.entryAt)}</span>
                    </span>
                  </div>

                  {/* Sub-details & Check out */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-gray-400 font-mono">
                      In: {v.entryAt ? new Date(v.entryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} via {v.gateName}
                    </div>

                    <div className="flex items-center gap-2">
                      {v.residentPhone && (
                        <a
                          href={`tel:${v.residentPhone}`}
                          className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                          title="Call Resident"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleProcessCheckout(v.id)}
                        disabled={checkoutLoading === v.id}
                        className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{checkoutLoading === v.id ? 'Logging Out...' : 'Check Out (बाहर करें)'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: OUT (Exit Logs & Audit History) */}
      {/* ======================================================== */}
      {activeMode === 'OUT' && (
        <div className="space-y-3 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-0.5">
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <span>Gate Exit Logs</span>
                <History className="w-4 h-4 text-blue-600" />
              </h2>
              <p className="text-[11px] text-gray-500">Checked-out visitors & historical egress logs (बाहर गए विज़िटर्स)</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-100 shrink-0">
              {outList.length} Exited
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {(['ALL', 'Guest', 'Delivery', 'Service', 'Cab'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#F1F9FC] text-gray-600 border border-[#E6F1F5] hover:bg-gray-100'
                }`}
              >
                {cat === 'ALL' ? 'All Exits' : cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search visitor, flat, plate, pass code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F1F9FC] rounded-2xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* List of Exit Logs */}
          <div className="space-y-2.5">
            {filteredOut.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-gray-400 space-y-1">
                <History className="w-8 h-8 text-blue-400 mx-auto mb-1 opacity-70" />
                <p className="font-semibold text-gray-700">No exit logs found</p>
                <p className="text-[11px]">Checked out visitors will appear here with full timestamps.</p>
              </div>
            ) : (
              filteredOut.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                        {v.category === 'Guest' ? <User className="w-5 h-5" /> :
                         v.category === 'Delivery' ? <Truck className="w-5 h-5" /> :
                         v.category === 'Service' ? <Wrench className="w-5 h-5" /> :
                         <Car className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">{v.visitorName}</h4>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#F1F9FC] text-blue-700 border border-[#E6F1F5] shrink-0">
                            {v.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 truncate mt-0.5">
                          Visited Flat <strong className="text-gray-900">{v.flatNumber}</strong> ({v.building})
                          {v.residentName && ` • ${v.residentName}`}
                        </p>
                        {(v.vehicleNumber || v.cabVehiclePlate) && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              {v.vehicleType && v.vehicleType !== 'None' ? v.vehicleType : 'Vehicle'}:
                            </span>
                            <span className="text-[10px] font-mono font-bold text-gray-800 tracking-wider">
                              {v.vehicleNumber || v.cabVehiclePlate}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                      CHECKED OUT
                    </span>
                  </div>

                  {/* Ingress / Egress Timestamps */}
                  <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-[#F8FAFC] border border-gray-100">
                      <span className="text-[9px] font-bold text-gray-400 block uppercase">Entry Time (अंदर)</span>
                      <p className="font-bold text-gray-800 font-mono mt-0.5">
                        {v.entryAt ? new Date(v.entryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">via {v.gateName}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-blue-50/50 border border-blue-100">
                      <span className="text-[9px] font-bold text-blue-600 block uppercase">Exit Time (बाहर)</span>
                      <p className="font-bold text-blue-900 font-mono mt-0.5">
                        {v.exitAt ? new Date(v.exitAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Completed'}
                      </p>
                      <p className="text-[10px] text-blue-600 truncate">
                        {getDurationString(v.entryAt, v.exitAt)}
                      </p>
                    </div>
                  </div>

                  {/* Pass code & Vehicle details */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5 px-0.5">
                    <span className="font-mono text-gray-400">Pass Code #{v.passCode}</span>
                    {v.cabVehiclePlate && (
                      <span className="font-mono font-bold text-gray-700">Vehicle: {v.cabVehiclePlate}</span>
                    )}
                    {v.exitingGuardName && (
                      <span className="text-[10px] text-gray-400">Logged by: {v.exitingGuardName}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
