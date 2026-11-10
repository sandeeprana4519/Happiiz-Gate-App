/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Society } from '../../types/society';
import { settleSocietyDues } from '../../services/firebase/superadmin.service';
import {
  AlertTriangle,
  CreditCard,
  FileText,
  CheckCircle2,
  X,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  Download,
  Loader2,
} from 'lucide-react';

interface OutstandingDuesBannerProps {
  society: Society;
  onPaymentSettled?: () => Promise<void> | void;
}

export const OutstandingDuesBanner: React.FC<OutstandingDuesBannerProps> = ({
  society,
  onPaymentSettled,
}) => {
  const [showPayModal, setShowPayModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'NetBanking' | 'Bank Transfer'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    txnId: string;
    invoiceId: string;
    amount: number;
  } | null>(null);

  const pendingAmount = society.pendingDues || 0;
  const isOverdue = pendingAmount > 0 && society.duesStatus !== 'PAID';

  if (!isOverdue && !paymentSuccess) {
    return null;
  }

  const invoiceNumber = society.duesInvoiceNumber || 'INV-2026-EMR01';
  const dueDate = society.duesDueDate || '2026-11-20';

  // Handle Payment Execution
  const handleExecutePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await settleSocietyDues(society.id, paymentMethod);
      if (res.success) {
        setPaymentSuccess({
          txnId: res.transactionId || `HPZ-TXN-${Date.now().toString().slice(-6)}`,
          invoiceId: res.invoiceId || invoiceNumber,
          amount: pendingAmount,
        });
        if (onPaymentSettled) {
          await onPaymentSettled();
        }
      }
    } catch (err) {
      console.error('Payment settlement error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. TOP OUTSTANDING BALANCE ALERT BANNER (Command Centre / Top of Dashboard) */}
      {/* ========================================================================= */}
      {isOverdue && !paymentSuccess && (
        <div className="rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 p-4 sm:p-5 shadow-sm transition-all mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Alert Icon & Text */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-red-950 tracking-tight">
                    Subscription Amount Pending: ₹{pendingAmount.toLocaleString()} is overdue.
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                    Action Required
                  </span>
                </div>

                <p className="text-xs text-red-800 font-medium">
                  Please settle your dues to avoid service interruption. Due Date: <strong className="font-bold underline">{dueDate}</strong> • Invoice #{invoiceNumber}
                </p>
                <p className="text-[11px] text-gray-600">
                  Includes Platform SaaS Multi-Tenant License, Gate Security Sentinel & Resident Mobile App Access.
                </p>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
              {/* View Invoice */}
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-300 bg-white hover:bg-red-50 text-red-900 text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <FileText className="w-4 h-4 text-red-700" />
                <span>View Invoice</span>
              </button>

              {/* Pay Now */}
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition shadow-xs cursor-pointer hover:shadow-md"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Now (₹{pendingAmount.toLocaleString()})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUCCESS CONFIRMATION BANNER (Temporary after payment) */}
      {/* ========================================================================= */}
      {paymentSuccess && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 sm:p-5 shadow-sm transition-all mb-6 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  Payment Successful! All Dues Cleared.
                </h4>
                <p className="text-xs text-emerald-800">
                  ₹{paymentSuccess.amount.toLocaleString()} settled for Invoice #{paymentSuccess.invoiceId} • Txn Ref: {paymentSuccess.txnId}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSuccess(null)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAY NOW GATEWAY */}
      {/* ========================================================================= */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#673AB7] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    SaaS Subscription Dues Settlement
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {society.societyName || 'Society'} ({society.societyCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amount Box */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase">Amount Payable</span>
                <div className="text-2xl font-black text-[#673AB7] font-mono">
                  ₹{pendingAmount.toLocaleString()}
                </div>
              </div>
              <span className="text-xs font-bold text-purple-900 px-2 py-1 rounded bg-purple-100">
                Invoice #{invoiceNumber}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 block">Select Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'Card', label: 'Debit / Card', icon: CreditCard },
                  { id: 'NetBanking', label: 'Net Banking', icon: ShieldCheck },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                        paymentMethod === m.id
                          ? 'border-[#673AB7] bg-purple-50 text-[#673AB7] shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Details */}
            {paymentMethod === 'UPI' && (
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-center text-xs">
                <div className="w-24 h-24 bg-white border border-gray-300 rounded-xl mx-auto flex items-center justify-center p-2 shadow-2xs">
                  <QrCode className="w-20 h-20 text-gray-800" />
                </div>
                <div className="text-gray-600 font-mono text-[11px]">
                  UPI ID: <strong className="text-gray-900">happiiz.billing@icici</strong>
                </div>
                <p className="text-[10px] text-gray-400">
                  Scan with GPay, PhonePe, Paytm, or BHIM UPI
                </p>
              </div>
            )}

            {paymentMethod === 'Card' && (
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Card Number (4111 2222 3333 4444)"
                  defaultValue="4532 •••• •••• 8812"
                  className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    defaultValue="08/29"
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    defaultValue="•••"
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'NetBanking' && (
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                <select className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white font-semibold">
                  <option>HDFC Bank Corporate</option>
                  <option>ICICI Bank Current Account</option>
                  <option>State Bank of India</option>
                  <option>Axis Bank Commercial</option>
                </select>
                <p className="text-[10px] text-gray-400">
                  You will be securely redirected to your bank portal for two-factor authorization
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="w-1/3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecutePayment}
                className="w-2/3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Pay ₹{pendingAmount.toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW INVOICE */}
      {/* ========================================================================= */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900 tracking-tight">
                    HAPPIIZ GATE OPERATIONS
                  </h3>
                  <p className="text-[10px] text-gray-500">Official Tax Invoice & Notice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Meta */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Invoice Number</span>
                <strong className="text-gray-900 font-mono text-sm">{invoiceNumber}</strong>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Status</span>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                  OVERDUE / PENDING
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Billed To</span>
                <div className="font-bold text-gray-900">{society.societyName}</div>
                <div className="text-[11px] text-gray-500">{society.address}, {society.city}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Due Date</span>
                <div className="font-bold text-red-700">{dueDate}</div>
                <div className="text-[10px] text-gray-400">Issue Date: 2026-11-01</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-100/70 border-b border-gray-200 font-bold text-gray-700 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Service Description</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">
                        {society.subscriptionPlan || 'Enterprise'} Gated Security Platform License
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {society.totalFlats || 100} Flats Quota • {society.totalGates || 2} ANPR Boom Barriers
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                      ₹{pendingAmount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-purple-50/50 border-t border-purple-200 font-bold">
                  <tr>
                    <td className="py-2.5 px-3 text-purple-900">Total Outstanding Balance:</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-purple-900 text-sm">
                      ₹{pendingAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowInvoiceModal(false);
                  setShowPayModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to Pay Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
