/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Header & Navigation
import { PartnerHeader } from '../../components/partner/PartnerHeader';
import { PartnerBottomNav, PartnerTab } from '../../components/partner/PartnerBottomNav';

// Modals
import { PartnerBookingDetailModal } from '../../components/partner/PartnerBookingDetailModal';
import { PartnerTeamModal } from '../../components/partner/PartnerTeamModal';
import { PartnerServicesModal } from '../../components/partner/PartnerServicesModal';
import { PartnerEarningsModal } from '../../components/partner/PartnerEarningsModal';
import { PartnerKycModal } from '../../components/partner/PartnerKycModal';
import { PartnerSupportModal } from '../../components/partner/PartnerSupportModal';

import { servicePartnerService } from '../../services/firebase/servicePartner.service';
import { syncBus } from '../../services/firebase/sync.service';
import { 
  ServicePartnerProfile, 
  PartnerJobBooking, 
  PartnerTechnician, 
  PartnerServiceOffering, 
  PartnerEarningRecord 
} from '../../types/servicePartner';
import { soundAlert } from '../../utils/soundAlert';

import { 
  Briefcase, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Users, 
  Wrench, 
  Wallet, 
  Star, 
  ChevronRight, 
  ArrowRight, 
  Power,
  Search,
  Phone,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const ServicePartnerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<PartnerTab>('home');

  // Partner Identity
  const partnerId = user?.partnerId || 'sp_1';

  // Live Data Stores
  const [profile, setProfile] = useState<ServicePartnerProfile | null>(null);
  const [bookings, setBookings] = useState<PartnerJobBooking[]>([]);
  const [technicians, setTechnicians] = useState<PartnerTechnician[]>([]);
  const [services, setServices] = useState<PartnerServiceOffering[]>([]);
  const [earnings, setEarnings] = useState<PartnerEarningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Booking for Modal
  const [selectedBooking, setSelectedBooking] = useState<PartnerJobBooking | null>(null);

  // Modal Open States
  const [openTeamModal, setOpenTeamModal] = useState(false);
  const [openServicesModal, setOpenServicesModal] = useState(false);
  const [openEarningsModal, setOpenEarningsModal] = useState(false);
  const [openKycModal, setOpenKycModal] = useState(false);
  const [openSupportModal, setOpenSupportModal] = useState(false);

  // Bookings Filter State
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all live partner data
  const loadData = useCallback(async () => {
    try {
      const [prof, bks, techs, srvs, earns] = await Promise.all([
        servicePartnerService.getPartnerProfile(partnerId),
        servicePartnerService.getPartnerBookings(partnerId),
        servicePartnerService.getTechnicians(partnerId),
        servicePartnerService.getServiceOfferings(partnerId),
        servicePartnerService.getEarnings(partnerId),
      ]);
      setProfile(prof);
      setBookings(bks);
      setTechnicians(techs);
      setServices(srvs);
      setEarnings(earns);
    } catch (err) {
      console.error('[ServicePartnerDashboard] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    loadData();

    // Instant real-time updates across portals
    const unsubscribeSync = syncBus.subscribeAll(() => {
      loadData();
    });

    const interval = setInterval(() => {
      loadData();
    }, 6000);

    return () => {
      clearInterval(interval);
      unsubscribeSync();
    };
  }, [loadData]);

  // Online Availability Toggle
  const handleToggleOnline = async (isOnline: boolean) => {
    await servicePartnerService.toggleOnlineAvailability(partnerId, isOnline);
    if (isOnline) soundAlert.playApprovalChime();
    await loadData();
  };

  // Booking Lifecycle Actions
  const handleAcceptBooking = async (bookingId: string, technicianId?: string) => {
    await servicePartnerService.acceptBooking(partnerId, bookingId, technicianId);
    soundAlert.playApprovalChime();
    await loadData();
  };

  const handleRejectBooking = async (bookingId: string, reason: string) => {
    await servicePartnerService.rejectBooking(partnerId, bookingId, reason);
    await loadData();
  };

  const handleStartJob = async (bookingId: string) => {
    await servicePartnerService.startJob(partnerId, bookingId);
    soundAlert.playApprovalChime();
    await loadData();
  };

  const handleCompleteJob = async (
    bookingId: string,
    details: { partsCost: number; laborCost: number; completionNotes: string; paymentMethod?: any }
  ) => {
    await servicePartnerService.completeJob(partnerId, bookingId, details);
    soundAlert.playApprovalChime();
    await loadData();
  };

  const handleReplyReview = async (bookingId: string, replyText: string) => {
    await servicePartnerService.replyToCustomerReview(partnerId, bookingId, replyText);
    await loadData();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Payout Feedback State (avoids window.alert)
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center select-none">
        <div className="space-y-3">
          <Wrench className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <p className="font-extrabold text-sm text-slate-900">Loading Service Partner Hub...</p>
        </div>
      </div>
    );
  }

  // Derived Counts for Dashboard
  const newRequests = bookings.filter((b) => b.status === 'REQUESTED');
  const acceptedBookings = bookings.filter((b) => b.status === 'ACCEPTED');
  const inProgressJobs = bookings.filter((b) => b.status === 'IN_PROGRESS');

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = bookingFilter === 'ALL' || b.status === bookingFilter;
    const matchesSearch =
      searchTerm === '' ||
      b.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full max-w-full select-none relative font-sans antialiased min-h-screen pb-24 overflow-x-hidden bg-[#F8FAFC] text-slate-900 no-scrollbar">
      {/* 1. MOBILE SAPPHIRE HEADER (Brand, Online Toggle, Three Dots Menu & Profile Card) */}
      <PartnerHeader
        profile={profile}
        onToggleOnline={handleToggleOnline}
        onLogout={handleLogout}
        onOpenTeam={() => setOpenTeamModal(true)}
        onOpenServices={() => setOpenServicesModal(true)}
        onOpenKyc={() => setOpenKycModal(true)}
        onOpenSupport={() => setOpenSupportModal(true)}
        newRequestsCount={newRequests.length}
      />

      <main className="w-full max-w-lg mx-auto min-w-0 px-3 sm:px-4 pt-4 pb-6 space-y-5">
        {/* ======================================================== */}
        {/* TAB 1: HOME DASHBOARD */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-5 animate-fade-in">
            {/* NEW BOOKING REQUESTS ALERT BANNER */}
            {newRequests.length > 0 && (
              <div
                onClick={() => {
                  setBookingFilter('REQUESTED');
                  setActiveTab('bookings');
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md flex items-center justify-between cursor-pointer active:scale-98 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-xs sm:text-sm truncate tabular-nums">
                      {newRequests.length} New Service Request{newRequests.length > 1 ? 's' : ''}!
                    </h3>
                    <p className="text-[11px] text-amber-50 truncate">
                      Tap to review customer issue & accept job
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-white text-amber-950 font-extrabold text-xs shrink-0 shadow-xs">
                  View
                </span>
              </div>
            )}

            {/* OPERATIONS & WORKLOAD KPI STRIP */}
            <section className="space-y-2.5">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-0.5">
                Operations & Workload Overview
              </h2>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div
                  onClick={() => {
                    setBookingFilter('REQUESTED');
                    setActiveTab('bookings');
                  }}
                  className="py-3 px-1.5 rounded-2xl bg-white border border-amber-200/80 cursor-pointer hover:border-amber-400 transition-all min-w-0 flex flex-col items-center justify-center shadow-xs active:scale-95"
                >
                  <p className="text-lg font-extrabold text-amber-600 leading-tight tabular-nums">{newRequests.length}</p>
                  <p className="text-[10px] font-bold text-slate-600 mt-1 truncate w-full">Requests</p>
                </div>

                <div
                  onClick={() => {
                    setBookingFilter('ACCEPTED');
                    setActiveTab('bookings');
                  }}
                  className="py-3 px-1.5 rounded-2xl bg-white border border-indigo-200/80 cursor-pointer hover:border-indigo-400 transition-all min-w-0 flex flex-col items-center justify-center shadow-xs active:scale-95"
                >
                  <p className="text-lg font-extrabold text-indigo-600 leading-tight tabular-nums">{acceptedBookings.length}</p>
                  <p className="text-[10px] font-bold text-slate-600 mt-1 truncate w-full">Accepted</p>
                </div>

                <div
                  onClick={() => {
                    setBookingFilter('IN_PROGRESS');
                    setActiveTab('bookings');
                  }}
                  className="py-3 px-1.5 rounded-2xl bg-white border border-sky-200/80 cursor-pointer hover:border-sky-400 transition-all min-w-0 flex flex-col items-center justify-center shadow-xs active:scale-95"
                >
                  <p className="text-lg font-extrabold text-sky-600 leading-tight tabular-nums">{inProgressJobs.length}</p>
                  <p className="text-[10px] font-bold text-slate-600 mt-1 truncate w-full">In Progress</p>
                </div>

                <div
                  onClick={() => setActiveTab('earnings')}
                  className="py-3 px-1.5 rounded-2xl bg-white border border-emerald-200/80 cursor-pointer hover:border-emerald-400 transition-all min-w-0 flex flex-col items-center justify-center shadow-xs active:scale-95"
                >
                  <p
                    className="text-xs sm:text-sm font-extrabold text-emerald-700 leading-tight truncate w-full tracking-tight tabular-nums"
                    title={`₹${profile.totalEarnings.toLocaleString()}`}
                  >
                    ₹{profile.totalEarnings >= 100000 ? `${(profile.totalEarnings / 1000).toFixed(1)}k` : profile.totalEarnings.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-600 mt-1 truncate w-full">Earnings</p>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS GRID */}
            <section className="space-y-2.5">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-0.5">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setBookingFilter('REQUESTED');
                    setActiveTab('bookings');
                  }}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-left hover:border-amber-300 transition-all cursor-pointer flex items-center gap-3 active:scale-95 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">Bookings</h4>
                    <p className="text-[11px] text-slate-500 truncate tabular-nums">{newRequests.length} waiting</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOpenTeamModal(true)}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-left hover:border-indigo-300 transition-all cursor-pointer flex items-center gap-3 active:scale-95 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">Team Staff</h4>
                    <p className="text-[11px] text-slate-500 truncate tabular-nums">{technicians.length} field staff</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOpenServicesModal(true)}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-left hover:border-sky-300 transition-all cursor-pointer flex items-center gap-3 active:scale-95 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">Services & Rates</h4>
                    <p className="text-[11px] text-slate-500 truncate tabular-nums">{services.length} categories</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOpenEarningsModal(true)}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-left hover:border-emerald-300 transition-all cursor-pointer flex items-center gap-3 active:scale-95 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">Wallet & Payout</h4>
                    <p className="text-[11px] text-slate-500 truncate tabular-nums">₹{profile.walletBalance.toLocaleString()} balance</p>
                  </div>
                </button>
              </div>
            </section>

            {/* RECENT WORK ORDERS STREAM */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Recent Society Work Orders
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer tabular-nums"
                >
                  View All ({bookings.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {bookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-indigo-300 transition-all cursor-pointer active:scale-98"
                  >
                    <div className="space-y-1 min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">{b.residentName}</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0">
                          {b.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate">
                        Flat <strong className="text-slate-900">{b.flatNumber}</strong> · {b.societyName}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{b.scheduledTime}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                            : b.status === 'IN_PROGRESS'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200/70'
                            : b.status === 'ACCEPTED'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/70'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/70'
                        }`}
                      >
                        {b.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: BOOKINGS LIST (Filterable & Searchable) */}
        {/* ======================================================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-4 animate-fade-in">
            <div className="px-0.5">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Work Orders & Bookings
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Service visits for Emerald Heights residents (सोसायटी सेवा कार्य)
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, flat, booking code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5">
              {(['ALL', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setBookingFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95 tabular-nums ${
                    bookingFilter === f
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f === 'ALL'
                    ? 'All'
                    : f === 'REQUESTED'
                    ? `New (${newRequests.length})`
                    : f === 'ACCEPTED'
                    ? 'Accepted'
                    : f === 'IN_PROGRESS'
                    ? 'In Progress'
                    : 'Completed'}
                </button>
              ))}
            </div>

            {/* Bookings Stream */}
            <div className="space-y-2.5">
              {filteredBookings.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-500">
                  No bookings found under this filter.
                </div>
              ) : (
                filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5 hover:border-indigo-300 transition-all cursor-pointer active:scale-98"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-indigo-700">
                            #{b.bookingCode}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            {b.category}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1 truncate">{b.residentName}</h4>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md shrink-0 ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                            : b.status === 'IN_PROGRESS'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200/70'
                            : b.status === 'ACCEPTED'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/70'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/70'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{b.problemDescription}</p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100">
                      <span className="truncate">
                        Flat <strong className="text-slate-900">{b.flatNumber}</strong> · {b.scheduledTime}
                      </span>
                      <span className="font-extrabold text-emerald-700 shrink-0 tabular-nums">
                        ₹{b.finalCost || b.estimatedCost}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CALENDAR (Scheduled Jobs Schedule) */}
        {/* ======================================================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 animate-fade-in">
            <div className="px-0.5">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Job Schedule & Calendar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upcoming confirmed visits for your field staff
              </p>
            </div>

            <div className="space-y-2.5">
              {bookings
                .filter((b) => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS')
                .map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-indigo-300 cursor-pointer active:scale-98 transition"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">{b.scheduledTime}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {b.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 truncate">
                        {b.residentName} · Flat <strong className="text-slate-900">{b.flatNumber}</strong>
                      </p>
                      {b.assignedTechnicianName && (
                        <p className="text-[11px] font-bold text-indigo-700 mt-0.5 truncate">
                          Assigned: {b.assignedTechnicianName}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shrink-0 shadow-xs"
                    >
                      View Job
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: EARNINGS & FINANCIAL OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === 'earnings' && (
          <div className="space-y-4 animate-fade-in">
            <div className="px-0.5">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Earnings & Financial Ledger
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Net earnings after 10% platform commission (कुल कमाई व वॉलेट)
              </p>
            </div>

            {payoutNotice && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
                <span>{payoutNotice}</span>
                <button
                  type="button"
                  onClick={() => setPayoutNotice(null)}
                  className="text-emerald-700 font-bold underline cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Wallet Hero Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#1E3A8A] text-white flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] text-sky-200 uppercase font-bold tracking-wider">Available Wallet Payout</p>
                <p className="text-2xl sm:text-3xl font-extrabold mt-1 tabular-nums">
                  ₹{profile.walletBalance.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  Settles automatically to registered bank account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayoutNotice('Withdrawal request queued! Funds will be deposited within 24 hours.')}
                className="px-4 py-2 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-md hover:bg-sky-50 transition-colors cursor-pointer shrink-0"
              >
                Withdraw
              </button>
            </div>

            {/* Payout Breakdown */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Completed Jobs</span>
                <span className="font-bold text-slate-900 tabular-nums">{profile.totalCompletedJobs} jobs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Lifetime Net Earnings</span>
                <span className="font-extrabold text-emerald-700 tabular-nums">₹{profile.totalEarnings.toLocaleString()}</span>
              </div>
            </div>

            {/* Transactions Ledger */}
            <div className="space-y-2.5">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider px-0.5">Settled Invoices</h4>
              {earnings.map((e) => (
                <div
                  key={e.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-900">{e.residentName}</p>
                    <p className="text-[11px] text-slate-500">{e.serviceCategory} · Ref #{e.bookingCode}</p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-extrabold text-xs text-emerald-700">+₹{e.netPayout}</p>
                    <p className="text-[10px] text-slate-400">Fee: ₹{e.platformFee}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: PROFILE & BUSINESS SETTINGS */}
        {/* ======================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-fade-in">
            <div className="px-0.5">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Partner Profile & Settings
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Business details, KYC compliance, and team management
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <img
                src={profile.photoUrl}
                alt={profile.businessName}
                className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-sm text-slate-900 truncate">{profile.businessName}</h3>
                <p className="text-xs text-slate-600 truncate">{profile.contactPersonName} · {profile.phoneNumber}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-bold text-[10px]">
                    Verified Vendor
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">ID: #{profile.partnerId}</span>
                </div>
              </div>
            </div>

            {/* Settings Links */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setOpenKycModal(true)}
                className="w-full p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between text-left hover:border-emerald-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">KYC & Compliance Documents</h4>
                    <p className="text-[11px] text-slate-500">PAN, GSTIN, and Trade License verified</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setOpenTeamModal(true)}
                className="w-full p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between text-left hover:border-indigo-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Users className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Technicians & Field Engineers</h4>
                    <p className="text-[11px] text-slate-500 tabular-nums">{technicians.length} registered staff</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setOpenServicesModal(true)}
                className="w-full p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between text-left hover:border-sky-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <Wrench className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Manage Services & Pricing</h4>
                    <p className="text-[11px] text-slate-500">Base rates & inspection charges</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setOpenSupportModal(true)}
                className="w-full p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between text-left hover:border-amber-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <HelpCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Support & Help Desk</h4>
                    <p className="text-[11px] text-slate-500">Contact platform administration</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 2. MOBILE BOTTOM NAVIGATION (Home, Bookings, Calendar, Earnings, Profile) */}
      <PartnerBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        newRequestsCount={newRequests.length}
      />

      {/* 3. MODALS */}
      {/* Booking Details Modal */}
      <PartnerBookingDetailModal
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        technicians={technicians}
        onAccept={handleAcceptBooking}
        onReject={handleRejectBooking}
        onStartJob={handleStartJob}
        onCompleteJob={handleCompleteJob}
        onReplyReview={handleReplyReview}
      />

      {/* Team Management Modal */}
      <PartnerTeamModal
        isOpen={openTeamModal}
        onClose={() => setOpenTeamModal(false)}
        partnerId={partnerId}
        technicians={technicians}
        onRefresh={loadData}
      />

      {/* Services & Pricing Modal */}
      <PartnerServicesModal
        isOpen={openServicesModal}
        onClose={() => setOpenServicesModal(false)}
        partnerId={partnerId}
        services={services}
        onRefresh={loadData}
      />

      {/* Earnings & Invoices Modal */}
      <PartnerEarningsModal
        isOpen={openEarningsModal}
        onClose={() => setOpenEarningsModal(false)}
        profile={profile}
        earnings={earnings}
      />

      {/* KYC Compliance Modal */}
      <PartnerKycModal
        isOpen={openKycModal}
        onClose={() => setOpenKycModal(false)}
        profile={profile}
      />

      {/* Support & Admin Desk Modal */}
      <PartnerSupportModal
        isOpen={openSupportModal}
        onClose={() => setOpenSupportModal(false)}
        partnerId={partnerId}
      />
    </div>
  );
};
