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
  ArrowRight,
  Check,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Layers,
  FileText,
  UserCheck,
} from 'lucide-react';
import { MarketplaceService, MarketplaceBooking } from '../../types/marketplace';
import { marketplaceService } from '../../services/firebase/marketplace.service';
import { syncBus } from '../../services/firebase/sync.service';

interface ResidentServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentUid: string;
  residentName: string;
  flatNumber: string;
}

const TIME_SLOTS = [
  '09:00 AM - 10:30 AM',
  '11:00 AM - 12:30 PM',
  '02:00 PM - 03:30 PM',
  '04:00 PM - 05:30 PM',
  '06:00 PM - 07:30 PM',
];

export const ResidentServicesModal: React.FC<ResidentServicesModalProps> = ({
  isOpen,
  onClose,
  residentUid,
  residentName,
  flatNumber,
}) => {
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [bookings, setBookings] = useState<MarketplaceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'MY_BOOKINGS'>('SERVICES');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Booking Flow State
  const [bookingService, setBookingService] = useState<MarketplaceService | null>(null);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState(TIME_SLOTS[1]);
  const [problemDescription, setProblemDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvs, bks] = await Promise.all([
        marketplaceService.getServices(),
        marketplaceService.getResidentBookings(residentUid),
      ]);
      setServices(srvs.filter((s) => s.status === 'ACTIVE'));
      setBookings(bks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();

      const unsubscribe = syncBus.subscribeAll(() => {
        loadData();
      });

      return () => unsubscribe();
    }
  }, [isOpen, residentUid]);

  if (!isOpen) return null;

  const categories = ['ALL', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter(
    (s) => selectedCategory === 'ALL' || s.category === selectedCategory
  );

  const handleOpenBooking = (svc: MarketplaceService) => {
    setBookingService(svc);
    setProblemDescription('');
    setScheduledDate(new Date().toISOString().slice(0, 10));
    setScheduledTime(TIME_SLOTS[1]);
    setConfirmationNotice(null);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingService) return;

    setSubmitting(true);
    try {
      const newBooking = await marketplaceService.createResidentBooking({
        serviceId: bookingService.id,
        residentUid,
        residentName,
        residentPhone: '+91 99554 43322',
        societyId: 'soc_emerald_heights',
        societyName: 'Emerald Heights Luxury Enclave',
        building: 'Tower B',
        flatNumber,
        scheduledDate,
        scheduledTime,
        problemDescription: problemDescription.trim() || `Doorstep service booking for Flat ${flatNumber}`,
      });

      setConfirmationNotice(
        `🎉 Booking #${newBooking.bookingCode} requested! Eligible verified partners have received your request.`
      );
      setBookingService(null);
      await loadData();
      setActiveTab('MY_BOOKINGS');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#673AB7] text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#111111]">
                Home Services Marketplace
              </h2>
              <p className="text-xs text-[#64748B]">
                On-Demand doorstep maintenance & repairs for <strong>Flat {flatNumber}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2.5 bg-white border-b border-[#E6F1F5] gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('SERVICES')}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SERVICES'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            Browse Catalog ({services.length} Services)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MY_BOOKINGS')}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MY_BOOKINGS'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            My Bookings & Invoices ({bookings.length})
          </button>
        </div>

        {/* Global Notification Banner */}
        {confirmationNotice && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center justify-between">
            <span>{confirmationNotice}</span>
            <button
              type="button"
              onClick={() => setConfirmationNotice(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'SERVICES' ? (
            <div className="space-y-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#673AB7] text-white shadow-xs'
                        : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Services' : cat}
                  </button>
                ))}
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="rounded-2xl border border-[#E6F1F5] bg-white overflow-hidden shadow-xs hover:border-[#673AB7]/50 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="relative h-32 bg-slate-100 overflow-hidden">
                        <img
                          src={svc.imageUrl}
                          alt={svc.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                            {svc.category}
                          </span>
                          {svc.popularBadge && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white">
                              ★ Best Seller
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 flex items-baseline justify-between text-white">
                          <div>
                            <span className="text-base font-black">₹{svc.basePrice}</span>
                            <span className="text-[10px] text-white/80 ml-1">
                              {svc.pricingType === 'FIXED' ? 'flat fee' : 'starts at'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-white/90">
                            ⏱ {svc.estimatedDuration}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3.5 space-y-2">
                        <h4 className="font-extrabold text-sm text-[#111111] line-clamp-1">{svc.name}</h4>
                        <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                          {svc.description}
                        </p>

                        <div className="space-y-1 pt-1">
                          {(svc.whatIsIncluded || []).slice(0, 2).map((inc, i) => (
                            <p key={i} className="text-[11px] text-[#334155] flex items-center gap-1.5 truncate">
                              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span className="truncate">{inc}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 pt-0">
                      <button
                        type="button"
                        onClick={() => handleOpenBooking(svc)}
                        className="w-full py-2.5 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] active:bg-[#512DA8] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Book Service</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* MY BOOKINGS TAB */
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2">
                  <Wrench className="w-8 h-8 text-[#A9B0B8] mx-auto" />
                  <p className="font-bold text-[#111111]">No Bookings Yet</p>
                  <p className="text-xs text-[#64748B]">
                    Browse our on-demand services catalog above to book car wash, plumbing, or repairs.
                  </p>
                </div>
              ) : (
                bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs space-y-3 hover:border-[#673AB7]/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.serviceImageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop'}
                          alt={b.serviceName}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-[#673AB7]">
                              {b.bookingCode}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                b.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-800'
                                  : b.status === 'ACCEPTED'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-[#111111] mt-0.5">{b.serviceName}</h4>
                          <p className="text-[11px] text-[#64748B]">
                            {b.scheduledDate} · {b.scheduledTime}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-[#111111]">
                          ₹{b.totalAmount || b.baseCost}
                        </span>
                        <span className="block text-[10px] text-emerald-600 font-bold">
                          {b.paymentStatus === 'PAID' ? '✓ Paid' : 'Payment on completion'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Track / Technician info */}
                    <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[11px] space-y-1.5">
                      {b.status === 'ACCEPTED' && (
                        <div className="flex items-center gap-2 text-purple-900 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-[#673AB7] shrink-0" />
                          <span>
                            Confirmed! <strong>{b.partnerName}</strong> assigned technician{' '}
                            <strong>{b.assignedTechnicianName || 'Suresh Kumar'}</strong>.
                          </span>
                        </div>
                      )}

                      {b.status === 'IN_PROGRESS' && (
                        <div className="flex items-center gap-2 text-blue-900 font-medium">
                          <Clock className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
                          <span>Technician on-site. Work order execution underway.</span>
                        </div>
                      )}

                      {b.status === 'COMPLETED' && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Service completed successfully.</span>
                          </div>
                          {b.completionNotes && (
                            <p className="text-[#64748B] pl-6 text-[10px]">
                              Notes: {b.completionNotes}
                            </p>
                          )}
                          {b.transactionId && (
                            <p className="text-[#A9B0B8] pl-6 text-[10px] font-mono">
                              Txn Ref: {b.transactionId} · Method: {b.paymentMethod || 'UPI'}
                            </p>
                          )}
                        </div>
                      )}

                      {b.status === 'REQUESTED' && (
                        <div className="flex items-center gap-2 text-amber-800">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Dispatching to verified community partners in your zone...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* BOOKING MODAL STEP (URBAN COMPANY STYLE)                     */}
        {/* ============================================================ */}
        {bookingService && (
          <div className="absolute inset-0 z-20 bg-white flex flex-col animate-fade-in">
            <div className="p-4 sm:p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-purple-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#111111]">
                    Book {bookingService.name}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Doorstep service for Flat {flatNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingService(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Service Summary Card */}
              <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#673AB7] text-white">
                    {bookingService.category}
                  </span>
                  <h4 className="font-extrabold text-sm text-[#111111] mt-1">{bookingService.name}</h4>
                  <p className="text-[11px] text-[#64748B]">Duration: ~{bookingService.estimatedDuration}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#64748B] block">Base Cost</span>
                  <span className="text-lg font-black text-[#673AB7]">₹{bookingService.basePrice}</span>
                </div>
              </div>

              {/* Slot Scheduling */}
              <div className="space-y-3">
                <label className="block font-bold text-[#111111]">1. Select Service Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] font-semibold text-[#111111]"
                />

                <label className="block font-bold text-[#111111] pt-1">2. Choose Preferred Arrival Slot</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setScheduledTime(slot)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                        scheduledTime === slot
                          ? 'border-[#673AB7] bg-purple-50 text-[#673AB7]'
                          : 'border-[#E6F1F5] bg-white text-slate-700 hover:bg-[#F1F9FC]'
                      }`}
                    >
                      <span>{slot}</span>
                      {scheduledTime === slot && <Check className="w-4 h-4 text-[#673AB7]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem / Instructions */}
              <div>
                <label className="block font-bold text-[#111111] mb-1">
                  3. Requirements / Specific Issues / Bay Location
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Car parked in B2-14 (White Honda City). Keys available with security or at flat."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111]"
                />
              </div>

              {/* Verification & Trust Guarantee */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-[#1e3a8a]">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Happiiz Verified Partner Guarantee:</strong> Background verified, police clearance certified, and automatic gate pass provisioned for seamless entry.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-2xl bg-[#673AB7] hover:bg-[#5E35B1] active:bg-[#512DA8] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{submitting ? 'Dispatching Request...' : `Confirm & Request Service (₹${bookingService.basePrice})`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
