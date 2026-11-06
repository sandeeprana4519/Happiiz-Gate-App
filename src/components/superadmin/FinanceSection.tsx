/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinancialTransaction } from '../../types/admin';
import { exportToCsv } from '../../services/firebase/superadmin.service';
import {
  DollarSign,
  Search,
  Download,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface FinanceSectionProps {
  transactions: FinancialTransaction[];
  monthlyRevenue: number;
  yearlyRevenue: number;
}

export const FinanceSection: React.FC<FinanceSectionProps> = ({
  transactions,
  monthlyRevenue,
  yearlyRevenue,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.gatewayReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = transactions
    .filter((t) => t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleExportCsv = () => {
    exportToCsv('happiiz_gate_financial_ledger', filtered);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">Platform Finance & Transaction Ledger</h2>
          <p className="text-xs text-[#A9B0B8]">
            Multi-society billing collections, automated commission settlements, and gateway audit logs
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E6F1F5] hover:bg-[#F1F9FC] text-xs font-bold text-[#111111] transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#673AB7]" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* 4 Financial Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <span className="text-[11px] font-bold text-[#A9B0B8] uppercase tracking-wider block mb-1">
            Total Collected Revenue
          </span>
          <div className="text-2xl font-black text-[#111111]">₹{totalCollected.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Fully Settled
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <span className="text-[11px] font-bold text-[#A9B0B8] uppercase tracking-wider block mb-1">
            Monthly Recurring (MRR)
          </span>
          <div className="text-2xl font-black text-[#673AB7]">₹{monthlyRevenue.toLocaleString()}</div>
          <span className="text-[11px] text-[#A9B0B8]">Across Active Gated Communities</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <span className="text-[11px] font-bold text-[#A9B0B8] uppercase tracking-wider block mb-1">
            Annual Run Rate (ARR)
          </span>
          <div className="text-2xl font-black text-[#111111]">₹{yearlyRevenue.toLocaleString()}</div>
          <span className="text-[11px] text-[#A9B0B8]">Projected 12-Month Volume</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <span className="text-[11px] font-bold text-[#A9B0B8] uppercase tracking-wider block mb-1">
            Pending Collections
          </span>
          <div className="text-2xl font-black text-amber-600">₹{pendingAmount.toLocaleString()}</div>
          <span className="text-[11px] text-amber-600 font-medium">In Gateway Escrow / Invoicing</span>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by transaction #, entity, gateway ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5">
          {(['ALL', 'SUCCESS', 'PENDING', 'FAILED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st ? 'bg-[#673AB7] text-white shadow-xs' : 'bg-[#F1F9FC] text-[#111111]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC]/60 text-[#A9B0B8] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Txn Number & Ref</th>
                <th className="py-3 px-4">Entity / Community</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-[#F1F9FC]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-[#111111]">{t.transactionNumber}</div>
                    <div className="text-[10px] text-[#A9B0B8] font-mono">Ref: {t.gatewayReference}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-[#111111]">{t.entityName}</div>
                    <div className="text-[11px] text-[#A9B0B8] truncate max-w-xs">{t.description}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F9FC] text-[#673AB7] border border-[#E6F1F5]">
                      {t.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#111111]">
                    {t.paymentMethod}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-sm text-[#111111]">
                    ₹{t.amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#A9B0B8]">
                    {new Date(t.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700'
                          : t.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          t.status === 'SUCCESS' ? 'bg-emerald-500' : t.status === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      />
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
