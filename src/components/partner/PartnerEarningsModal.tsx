/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  TrendingUp, 
  Download, 
  Calendar, 
  Receipt, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { PartnerEarningRecord, ServicePartnerProfile } from '../../types/servicePartner';

interface PartnerEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ServicePartnerProfile;
  earnings: PartnerEarningRecord[];
}

export const PartnerEarningsModal: React.FC<PartnerEarningsModalProps> = ({
  isOpen,
  onClose,
  profile,
  earnings,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'TODAY' | 'WEEK'>('ALL');

  if (!isOpen) return null;

  const totalGross = earnings.reduce((sum, e) => sum + e.grossAmount, 0);
  const totalCommission = earnings.reduce((sum, e) => sum + e.platformFee, 0);
  const totalNet = earnings.reduce((sum, e) => sum + e.netPayout, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#111111]">Earnings & Payouts</h2>
              <p className="text-xs text-[#A9B0B8]">Financial ledger for {profile.businessName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Balance Banner */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-100 uppercase tracking-wider font-semibold">
              Available Wallet Balance
            </p>
            <p className="text-2xl font-black mt-0.5">₹{profile.walletBalance.toLocaleString()}</p>
          </div>
          <button
            onClick={() => alert('Withdrawal request submitted! Payout will settle to registered bank account within 24 hours.')}
            className="px-3.5 py-2 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-sm hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            Withdraw Now
          </button>
        </div>

        {/* Financial Metrics Summary */}
        <div className="grid grid-cols-3 p-3 bg-white border-b border-[#E6F1F5] gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <p className="text-[10px] text-[#A9B0B8] uppercase font-bold">Total Gross</p>
            <p className="text-sm font-black text-[#111111] mt-0.5">₹{totalGross.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <p className="text-[10px] text-[#A9B0B8] uppercase font-bold">Platform Fee (10%)</p>
            <p className="text-sm font-black text-rose-600 mt-0.5">-₹{totalCommission.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <p className="text-[10px] text-[#A9B0B8] uppercase font-bold">Net Earned</p>
            <p className="text-sm font-black text-emerald-700 mt-0.5">₹{totalNet.toLocaleString()}</p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-[#111111]">Settled Jobs Ledger</h4>
            <button
              onClick={() => alert('Downloading official GST & Tax Earnings CSV statement...')}
              className="flex items-center gap-1 text-[11px] font-bold text-[#673AB7] hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="space-y-2">
            {earnings.map((e) => (
              <div
                key={e.id}
                className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-[#111111]">{e.residentName}</span>
                    <span className="font-mono text-[10px] text-[#673AB7] font-bold">#{e.bookingCode}</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {e.serviceCategory} · {new Date(e.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-xs text-emerald-700">+₹{e.netPayout}</p>
                  <p className="text-[10px] text-[#A9B0B8]">Fee: ₹{e.platformFee}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
