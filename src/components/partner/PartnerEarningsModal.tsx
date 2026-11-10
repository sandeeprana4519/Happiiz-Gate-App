/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  TrendingUp, 
  Download, 
  Calendar, 
  Receipt, 
  CheckCircle2, 
  ArrowUpRight,
  Filter,
  DollarSign,
  Layers,
  FileText,
} from 'lucide-react';
import { PartnerEarningRecord, ServicePartnerProfile } from '../../types/servicePartner';
import { CrmDateFilterType, MarketplaceBooking } from '../../types/marketplace';
import { marketplaceService } from '../../services/firebase/marketplace.service';

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
  const [filterPeriod, setFilterPeriod] = useState<CrmDateFilterType>('ALL');
  const [filterDateValue, setFilterDateValue] = useState<string>('');
  const [partnerBookings, setPartnerBookings] = useState<MarketplaceBooking[]>([]);
  const partnerId = profile.partnerId || profile.uid || 'sp_1';

  useEffect(() => {
    if (isOpen) {
      marketplaceService.getPartnerBookings(partnerId).then((bks) => {
        setPartnerBookings(bks);
      });
    }
  }, [isOpen, partnerId]);

  if (!isOpen) return null;

  const { filteredJobs, summary } = marketplaceService.filterJobHistory(
    partnerBookings,
    filterPeriod,
    filterDateValue
  );

  const handleExportPdf = async () => {
    const crmProfile = await marketplaceService.getPartnerCrmDetail(partnerId);
    if (!crmProfile) return;
    marketplaceService.exportPartnerStatementPdf(
      crmProfile,
      filterPeriod,
      filterDateValue,
      filteredJobs,
      summary
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#111111]">Earnings & Financial Ledger</h2>
              <p className="text-xs text-[#64748B]">Revenue reconciliation for {profile.businessName}</p>
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 backdrop-blur-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => alert('Withdrawal request submitted! Payout will settle to registered bank account within 24 hours.')}
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-sm hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              Withdraw Now
            </button>
          </div>
        </div>

        {/* Filter Period Buttons */}
        <div className="p-3 bg-white border-b border-[#E6F1F5] flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex p-1 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <button
              type="button"
              onClick={() => {
                setFilterPeriod('ALL');
                setFilterDateValue('');
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterPeriod === 'ALL' ? 'bg-[#673AB7] text-white shadow-xs' : 'text-[#64748B]'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterPeriod('DAY');
                setFilterDateValue(new Date().toISOString().slice(0, 10));
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterPeriod === 'DAY' ? 'bg-[#673AB7] text-white shadow-xs' : 'text-[#64748B]'
              }`}
            >
              Day-wise
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterPeriod('MONTH');
                setFilterDateValue(new Date().toISOString().slice(0, 7));
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterPeriod === 'MONTH' ? 'bg-[#673AB7] text-white shadow-xs' : 'text-[#64748B]'
              }`}
            >
              Month-wise
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterPeriod('YEAR');
                setFilterDateValue(String(new Date().getFullYear()));
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterPeriod === 'YEAR' ? 'bg-[#673AB7] text-white shadow-xs' : 'text-[#64748B]'
              }`}
            >
              Year-wise
            </button>
          </div>

          {filterPeriod === 'DAY' && (
            <input
              type="date"
              value={filterDateValue}
              onChange={(e) => setFilterDateValue(e.target.value)}
              className="px-2 py-1 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] font-semibold text-[#111111]"
            />
          )}
          {filterPeriod === 'MONTH' && (
            <input
              type="month"
              value={filterDateValue}
              onChange={(e) => setFilterDateValue(e.target.value)}
              className="px-2 py-1 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] font-semibold text-[#111111]"
            />
          )}
        </div>

        {/* Financial Metrics Summary */}
        <div className="grid grid-cols-3 p-3 bg-white border-b border-[#E6F1F5] gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <p className="text-[10px] text-[#A9B0B8] uppercase font-bold">Total Gross (GMV)</p>
            <p className="text-sm font-black text-[#111111] mt-0.5">₹{summary.totalGmv.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <p className="text-[10px] text-[#A9B0B8] uppercase font-bold">Platform Fee Cut</p>
            <p className="text-sm font-black text-rose-600 mt-0.5">-₹{summary.totalCommission.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <p className="text-[10px] text-[#A9B0B8] uppercase font-bold">Net Payout</p>
            <p className="text-sm font-black text-emerald-700 mt-0.5">₹{summary.totalPayout.toLocaleString()}</p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-[#111111]">
              Settled Work Orders ({filteredJobs.length})
            </h4>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1 text-[11px] font-bold text-[#673AB7] hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Statement</span>
            </button>
          </div>

          <div className="space-y-2">
            {filteredJobs.length === 0 ? (
              <div className="p-6 text-center text-[#64748B] bg-[#F1F9FC] rounded-2xl border border-[#E6F1F5]">
                No completed work orders for this period.
              </div>
            ) : (
              filteredJobs.map((e) => (
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
                      {e.serviceName} · {e.scheduledDate}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-xs text-emerald-700">+₹{e.partnerEarnings}</p>
                    <p className="text-[10px] text-[#A9B0B8]">
                      Gross: ₹{e.totalAmount} · Cut: ₹{e.commissionAmount}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
