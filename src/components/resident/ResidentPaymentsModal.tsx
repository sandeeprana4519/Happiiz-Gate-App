/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  CheckCircle2, 
  Download, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { ResidentInvoice } from '../../types/resident';
import { residentService } from '../../services/firebase/resident.service';

interface ResidentPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  residentUid: string;
  flatNumber: string;
}

export const ResidentPaymentsModal: React.FC<ResidentPaymentsModalProps> = ({
  isOpen,
  onClose,
  societyId,
  residentUid,
  flatNumber,
}) => {
  const [invoices, setInvoices] = useState<ResidentInvoice[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [payingInvoice, setPayingInvoice] = useState<ResidentInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [processing, setProcessing] = useState(false);
  const [paidReceipt, setPaidReceipt] = useState<{ transactionId: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await residentService.getInvoices(societyId, residentUid);
      setInvoices(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, societyId, residentUid]);

  if (!isOpen) return null;

  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');
  const totalOutstanding = pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  const handlePayNow = async () => {
    if (!payingInvoice) return;
    setProcessing(true);
    try {
      const res = await residentService.payInvoice(societyId, payingInvoice.id, paymentMethod);
      setPaidReceipt({ transactionId: res.transactionId, amount: payingInvoice.totalAmount });
      setPayingInvoice(null);
      await loadData();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#111111]">Society Payments</h2>
              <p className="text-xs text-[#A9B0B8]">Dues & receipts for Flat {flatNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outstanding Dues Banner */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-100 font-semibold uppercase tracking-wider">
              Total Outstanding Dues
            </p>
            <p className="text-2xl font-black mt-0.5">₹{totalOutstanding.toLocaleString()}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
            {pendingInvoices.length} Due Invoice{pendingInvoices.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-3 bg-white border-b border-[#E6F1F5] gap-2">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PENDING'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            Pending Dues ({pendingInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            Receipt History ({paidInvoices.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* PAID RECEIPT BANNER */}
          {paidReceipt && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-scale-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-black text-sm text-emerald-950">Payment Successful!</h4>
              <p className="text-xs text-emerald-800">
                ₹{paidReceipt.amount.toLocaleString()} received. Ref ID: <strong className="font-mono">{paidReceipt.transactionId}</strong>
              </p>
              <button
                onClick={() => setPaidReceipt(null)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* TAB 1: PENDING DUES */}
          {activeTab === 'PENDING' && (
            <div className="space-y-3">
              {pendingInvoices.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-slate-500 font-medium">
                  🎉 No pending dues! All maintenance invoices are fully paid.
                </div>
              ) : (
                pendingInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#111111]">
                        {inv.month} {inv.year} Maintenance
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <p className="text-xl font-black text-[#111111]">₹{inv.totalAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-[#A9B0B8]">Invoice #{inv.invoiceNumber}</p>
                      </div>

                      <button
                        onClick={() => setPayingInvoice(inv)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Pay Now</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: RECEIPT HISTORY */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-2.5">
              {paidInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#111111]">{inv.month} {inv.year}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Paid
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      ₹{inv.totalAmount.toLocaleString()} · Txn: <span className="font-mono">{inv.transactionId}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => alert(`Downloading official PDF receipt for Invoice #${inv.invoiceNumber}...`)}
                    className="p-2 rounded-xl hover:bg-slate-200 text-[#673AB7] transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                    title="Download Receipt"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAY NOW CHECKOUT MODAL OVERLAY */}
        {payingInvoice && (
          <div className="p-5 border-t border-[#E6F1F5] bg-white space-y-3 animate-slide-up">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-[#111111]">
                Pay ₹{payingInvoice.totalAmount.toLocaleString()}
              </h4>
              <button
                onClick={() => setPayingInvoice(null)}
                className="text-xs font-bold text-[#64748B] hover:text-[#111111]"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'Card', 'NetBanking'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 rounded-xl text-xs font-bold text-center transition-all ${
                    paymentMethod === m
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={processing}
              onClick={handlePayNow}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{processing ? 'Verifying with Bank Gateway...' : `Complete Payment via ${paymentMethod}`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
