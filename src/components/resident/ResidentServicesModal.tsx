/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wrench, 
  Star, 
  Clock, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { HomeServicePartner, ServiceJobBooking } from '../../types/resident';
import { residentService } from '../../services/firebase/resident.service';

interface ResidentServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentUid: string;
  residentName: string;
  flatNumber: string;
}

export const ResidentServicesModal: React.FC<ResidentServicesModalProps> = ({
  isOpen,
  onClose,
  residentUid,
  residentName,
  flatNumber,
}) => {
  const [partners, setPartners] = useState<HomeServicePartner[]>([]);
  const [bookings, setBookings] = useState<ServiceJobBooking[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<HomeServicePartner | null>(null);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState('02:00 PM - 04:00 PM');
  const [problemDescription, setProblemDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'PARTNERS' | 'MY_JOBS'>('PARTNERS');

  const loadData = async () => {
    const [pts, bks] = await Promise.all([
      residentService.getServicePartners(),
      residentService.getServiceBookings(residentUid),
    ]);
    setPartners(pts);
    setBookings(bks);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, residentUid]);

  if (!isOpen) return null;

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || !problemDescription.trim()) return;

    setSubmitting(true);
    try {
      await residentService.bookServiceJob(residentUid, residentName, flatNumber, {
        partnerId: selectedPartner.id,
        partnerName: selectedPartner.partnerName,
        category: selectedPartner.category,
        scheduledDate,
        scheduledTime,
        problemDescription,
        estimatedCost: selectedPartner.startingPrice,
      });
      alert(`🎉 Service request sent to ${selectedPartner.partnerName}! The partner has been notified.`);
      setSelectedPartner(null);
      setProblemDescription('');
      await loadData();
      setActiveTab('MY_JOBS');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-blue-50">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#111111]">
              Home Services Marketplace
            </h2>
            <p className="text-xs text-[#A9B0B8]">
              Verified technicians and doorstep maintenance for Flat {flatNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-3 bg-white border-b border-[#E6F1F5] gap-2">
          <button
            onClick={() => setActiveTab('PARTNERS')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PARTNERS'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            Find Service Providers
          </button>
          <button
            onClick={() => setActiveTab('MY_JOBS')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MY_JOBS'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            My Service Requests ({bookings.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'PARTNERS' && (
            <div className="space-y-3">
              {partners.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between gap-3 hover:border-[#673AB7] transition-all"
                >
                  <img
                    src={p.photoUrl}
                    alt={p.partnerName}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs text-[#111111] truncate">{p.partnerName}</h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    </div>
                    <p className="text-[11px] font-bold text-[#673AB7]">{p.category}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#A9B0B8] mt-0.5">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-500" />
                        {p.rating} ({p.reviewsCount})
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-slate-800">Starts ₹{p.startingPrice}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPartner(p)}
                    className="px-3 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer shrink-0"
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'MY_JOBS' && (
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-slate-500 font-medium">
                  No active service requests. Select a verified technician to schedule a visit.
                </div>
              ) : (
                bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#111111]">{b.partnerName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B]">{b.problemDescription}</p>
                    <div className="text-[11px] text-[#A9B0B8] flex items-center justify-between pt-1 border-t border-[#E6F1F5]">
                      <span>{b.scheduledDate} ({b.scheduledTime})</span>
                      <span className="font-bold text-[#111111]">Est: ₹{b.estimatedCost}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* BOOKING MODAL OVERLAY */}
        {selectedPartner && (
          <form
            onSubmit={handleBookService}
            className="p-5 border-t border-[#E6F1F5] bg-white space-y-3 animate-slide-up text-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-[#111111]">Book {selectedPartner.partnerName}</h4>
                <p className="text-[11px] text-[#A9B0B8]">Starts at ₹{selectedPartner.startingPrice}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPartner(null)}
                className="text-xs font-bold text-[#64748B]"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block font-bold text-[#111111] mb-1">Problem Description</label>
              <textarea
                rows={2}
                required
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe what needs repair or servicing..."
                className="w-full p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs focus:outline-none focus:border-[#673AB7]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs focus:outline-none focus:border-[#673AB7]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Preferred Slot</label>
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  placeholder="e.g. 02:00 PM"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] shadow-md transition-colors cursor-pointer"
            >
              {submitting ? 'Confirming...' : 'Dispatch Booking Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
