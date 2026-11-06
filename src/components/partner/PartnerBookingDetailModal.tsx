/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Clock, 
  Phone, 
  ShieldCheck, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Receipt,
  Star,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { PartnerJobBooking, PartnerTechnician } from '../../types/servicePartner';

interface PartnerBookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PartnerJobBooking | null;
  technicians: PartnerTechnician[];
  onAccept: (bookingId: string, technicianId?: string) => Promise<void>;
  onReject: (bookingId: string, reason: string) => Promise<void>;
  onStartJob: (bookingId: string) => Promise<void>;
  onCompleteJob: (
    bookingId: string,
    details: { partsCost: number; laborCost: number; completionNotes: string; paymentMethod?: any }
  ) => Promise<void>;
  onReplyReview?: (bookingId: string, replyText: string) => Promise<void>;
}

export const PartnerBookingDetailModal: React.FC<PartnerBookingDetailModalProps> = ({
  isOpen,
  onClose,
  booking,
  technicians,
  onAccept,
  onReject,
  onStartJob,
  onCompleteJob,
  onReplyReview,
}) => {
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [laborCost, setLaborCost] = useState(200);
  const [partsCost, setPartsCost] = useState(150);
  const [completionNotes, setCompletionNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [replyText, setReplyText] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !booking) return null;

  const handleAcceptClick = async () => {
    setProcessing(true);
    try {
      await onAccept(booking.id, selectedTechId);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = async () => {
    if (!rejectionReason.trim()) {
      alert('Please specify a reason for rejecting the booking.');
      return;
    }
    setProcessing(true);
    try {
      await onReject(booking.id, rejectionReason);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const handleStartJobClick = async () => {
    setProcessing(true);
    try {
      await onStartJob(booking.id);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteJobClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await onCompleteJob(booking.id, {
        laborCost,
        partsCost,
        completionNotes: completionNotes || 'Work completed to customer satisfaction.',
        paymentMethod,
      });
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const handleReplyReviewSubmit = async () => {
    if (!replyText.trim() || !onReplyReview) return;
    await onReplyReview(booking.id, replyText);
    alert('Reply published for customer!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#673AB7]">
                #{booking.bookingCode}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  booking.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : booking.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800'
                    : booking.status === 'ACCEPTED'
                    ? 'bg-purple-100 text-purple-800'
                    : booking.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {booking.status}
              </span>
            </div>
            <h2 className="text-base font-black text-[#111111] mt-0.5">
              {booking.category} Service
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Customer & Location Card */}
          <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#673AB7] text-white flex items-center justify-center font-bold text-xs">
                  {booking.residentName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#111111]">{booking.residentName}</h4>
                  <p className="text-[10px] text-[#A9B0B8]">
                    Flat <strong className="text-[#111111]">{booking.flatNumber}</strong> · {booking.building}
                  </p>
                </div>
              </div>

              {booking.residentPhone && (
                <a
                  href={`tel:${booking.residentPhone}`}
                  className="p-2 rounded-xl bg-white border border-[#E6F1F5] text-[#673AB7] hover:bg-[#673AB7] hover:text-white transition-all"
                  title="Call Resident"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>

            <p className="text-[11px] text-[#64748B] flex items-center gap-1 pt-1 border-t border-[#E6F1F5]">
              <MapPin className="w-3.5 h-3.5 text-[#673AB7] shrink-0" />
              <span>{booking.societyName}</span>
            </p>
          </div>

          {/* Problem Description */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E6F1F5] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#A9B0B8]">Problem Description</span>
            <p className="text-xs font-medium text-[#111111] leading-relaxed">
              {booking.problemDescription}
            </p>
          </div>

          {/* Schedule & Estimates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5]">
              <span className="text-[10px] font-bold text-[#A9B0B8] uppercase">Scheduled Time</span>
              <p className="text-xs font-extrabold text-[#111111] mt-0.5">{booking.scheduledTime}</p>
              <p className="text-[10px] text-[#64748B]">{booking.scheduledDate}</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5]">
              <span className="text-[10px] font-bold text-[#A9B0B8] uppercase">Estimated Cost</span>
              <p className="text-xs font-black text-emerald-700 mt-0.5">
                ₹{booking.finalCost || booking.estimatedCost}
              </p>
              <p className="text-[10px] text-[#64748B]">
                {booking.paymentStatus === 'PAID' ? 'Paid via ' + booking.paymentMethod : 'Payment Pending'}
              </p>
            </div>
          </div>

          {/* Guard App Gate Clearance Info */}
          {booking.gatePassId && (
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-700 uppercase">
                  Guard App GatePass Clearance
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-900">
                  {booking.gatePassId}
                </span>
              </div>
              <p className="text-[11px] text-purple-800">
                🛡️ Verified service visit synchronized with Gate A security terminal.
              </p>
            </div>
          )}

          {/* Assigned Technician Banner */}
          {booking.assignedTechnicianName && (
            <div className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#A9B0B8] uppercase">Assigned Technician</span>
                <p className="text-xs font-black text-[#111111]">{booking.assignedTechnicianName}</p>
              </div>
              {booking.assignedTechnicianPhone && (
                <span className="font-mono text-xs text-[#673AB7] font-bold">
                  {booking.assignedTechnicianPhone}
                </span>
              )}
            </div>
          )}

          {/* Customer Review if completed */}
          {booking.customerReview && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-800 uppercase">Customer Review</span>
                <div className="flex items-center gap-0.5 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{booking.customerRating} / 5</span>
                </div>
              </div>
              <p className="text-xs italic text-amber-950">"{booking.customerReview}"</p>

              {booking.partnerReply ? (
                <div className="p-2 rounded-xl bg-white border border-amber-200 text-[11px] text-[#673AB7]">
                  <strong>Your Reply:</strong> {booking.partnerReply}
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Reply to customer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-xs"
                  />
                  <button
                    onClick={handleReplyReviewSubmit}
                    className="px-3 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          )}

          {/* REJECT FORM */}
          {showRejectForm && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5">
              <h4 className="font-bold text-xs text-rose-900">Reason for Rejection *</h4>
              <textarea
                rows={2}
                required
                placeholder="e.g. All AC technicians currently occupied on prior bookings..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-rose-300 text-xs focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleRejectClick}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {/* COMPLETE JOB FORM */}
          {showCompleteForm && (
            <form onSubmit={handleCompleteJobClick} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <h4 className="font-black text-xs text-emerald-950">Complete Job & Generate Invoice</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Labor Cost (₹)</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Parts Cost (₹)</label>
                  <input
                    type="number"
                    value={partsCost}
                    onChange={(e) => setPartsCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['UPI', 'Cash', 'Card'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        paymentMethod === m ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Work Completion Notes</label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Replaced capacitor and cleaned filter..."
                  className="w-full p-2 rounded-xl bg-white border border-emerald-300 text-xs"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Total Invoice Amount:</span>
                <span className="font-black text-emerald-800 text-sm">₹{laborCost + partsCost}</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteForm(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Confirm & Close Job
                </button>
              </div>
            </form>
          )}

          {/* TECHNICIAN ASSIGNMENT SELECTOR (When booking is REQUESTED) */}
          {booking.status === 'REQUESTED' && !showRejectForm && (
            <div className="space-y-1.5">
              <label className="block font-bold text-[#111111]">Assign Technician</label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.specialization})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 border-t border-[#E6F1F5] bg-white flex gap-2">
          {booking.status === 'REQUESTED' && !showRejectForm && (
            <>
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                className="flex-1 py-3 rounded-2xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Reject Request
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleAcceptClick}
                className="flex-1 py-3 rounded-2xl bg-[#673AB7] text-white font-black text-xs hover:bg-[#512DA8] shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Booking</span>
              </button>
            </>
          )}

          {booking.status === 'ACCEPTED' && (
            <button
              type="button"
              disabled={processing}
              onClick={handleStartJobClick}
              className="w-full py-3 rounded-2xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Technician Arrived — Start Job</span>
            </button>
          )}

          {booking.status === 'IN_PROGRESS' && !showCompleteForm && (
            <button
              type="button"
              onClick={() => setShowCompleteForm(true)}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>Mark Job Completed & Invoice</span>
            </button>
          )}

          {booking.status === 'COMPLETED' && (
            <button
              type="button"
              onClick={() => alert(`Official Invoice PDF generated for Booking #${booking.bookingCode}.`)}
              className="w-full py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>Download Invoice Receipt</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
