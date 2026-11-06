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
  DoorClosed, 
  CheckCircle2 
} from 'lucide-react';
import { GuardVisitor } from '../../types/guard';

interface GuardInsideViewProps {
  visitors: GuardVisitor[];
  activeGate: string;
  guardName: string;
  onCheckOut: (visitorId: string, exitGate: string, guardName: string) => Promise<void>;
  onRefresh: () => void;
}

export const GuardInsideView: React.FC<GuardInsideViewProps> = ({
  visitors,
  activeGate,
  guardName,
  onCheckOut,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const insideList = visitors.filter(v => v.status === 'INSIDE');
  const filtered = insideList.filter(v => 
    v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.deliveryCompany && v.deliveryCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (v.cabVehiclePlate && v.cabVehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleProcessCheckout = async (id: string) => {
    setCheckoutLoading(id);
    try {
      await onCheckOut(id, activeGate, guardName);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getDurationString = (entryTime?: string) => {
    if (!entryTime) return 'Just entered';
    const mins = Math.floor((Date.now() - new Date(entryTime).getTime()) / (60 * 1000));
    if (mins < 1) return 'Just entered';
    if (mins < 60) return `${mins}m inside`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m inside`;
  };

  return (
    <div className="space-y-4 px-4 pt-4 pb-20 animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Inside Premises</h2>
          <p className="text-xs text-gray-400">Visitors & commercial vehicles currently on society grounds</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-purple-50 text-[#673AB7] font-bold text-xs border border-purple-100">
          {insideList.length} Active Inside
        </span>
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

      {/* Inside List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-gray-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
            <p className="font-semibold text-gray-700">No visitors inside premises</p>
            <p className="text-[11px]">All checked-in visitors have completed exit clearance.</p>
          </div>
        ) : (
          filtered.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {v.photoUrl ? (
                    <img src={v.photoUrl} alt={v.visitorName} className="w-12 h-12 rounded-xl object-cover border border-purple-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold">
                      {v.category === 'Guest' ? <User className="w-6 h-6" /> :
                       v.category === 'Delivery' ? <Truck className="w-6 h-6" /> :
                       v.category === 'Service' ? <Wrench className="w-6 h-6" /> :
                       <Car className="w-6 h-6" />}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-900">{v.visitorName}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F1F9FC] text-[#673AB7] border border-[#E6F1F5]">
                        {v.deliveryCompany || v.cabCompany || v.category}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-0.5">
                      To Flat <strong className="text-gray-900">{v.flatNumber}</strong> ({v.building})
                    </p>

                    {v.cabVehiclePlate && (
                      <p className="text-[11px] font-mono font-bold text-gray-700 mt-0.5">
                        Plate: {v.cabVehiclePlate}
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getDurationString(v.entryAt)}
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
                    onClick={() => handleProcessCheckout(v.id)}
                    disabled={checkoutLoading === v.id}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{checkoutLoading === v.id ? 'Logging Out...' : 'Check Out'}</span>
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
