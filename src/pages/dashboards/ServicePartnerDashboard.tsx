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

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center select-none">
        <div className="space-y-3">
          <Wrench className="w-10 h-10 text-[#673AB7] animate-spin mx-auto" />
          <p className="font-extrabold text-sm text-[#111111]">Loading Service Partner Hub...</p>
        </div>
      </div>
    );
  }

  // Derived Counts for Dashboard
  const newRequests = bookings.filter((b) => b.status === 'REQUESTED');
  const acceptedBookings = bookings.filter((b) => b.status === 'ACCEPTED');
  const inProgressJobs = bookings.filter((b) => b.status === 'IN_PROGRESS');
  const completedJobs = bookings.filter((b) => b.status === 'COMPLETED');

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
    <div className="w-full max-w-full select-none relative font-sans antialiased min-h-screen pb-24 overflow-x-hidden bg-[#FFFFFF] text-[#111111] no-scrollbar">
      {/* 1. MOBILE BLACK HEADER (Brand, Online Toggle, Three Dots Menu & Profile Card) */}
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

      <main className="w-full max-w-lg mx-auto min-w-0 px-3 sm:px-4 pt-3 pb-6 space-y-4">
        {/* ======================================================== */}
        {/* TAB 1: HOME DASHBOARD */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-fade-in">
            {/* NEW BOOKING REQUESTS ALERT BANNER */}
            {newRequests.length > 0 && (
              <div
                onClick={() => {
                  setBookingFilter('REQUESTED');
                  setActiveTab('bookings');
                }}
                className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-md flex items-center justify-between cursor-pointer animate-pulse active:scale-98 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-black text-xs sm:text-sm truncate">
                      {newRequests.length} New Service Request{newRequests.length > 1 ? 's' : ''}!
                    </h3>
                    <p className="text-[11px] text-amber-100 truncate">
                      Tap to review customer problem & accept
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-white text-amber-950 font-black text-xs shrink-0 shadow-xs">
                  View
                </span>
              </div>
            )}

            {/* 8 DASHBOARD STATISTICS */}
            <section className="space-y-2">
              <h2 className="text-xs font-bold text-[#A9B0B8] uppercase tracking-wider">
                Operations & Workload Overview
              </h2>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs">
                <div
                  onClick={() => {
                    setBookingFilter('REQUESTED');
                    setActiveTab('bookings');
                  }}
                  className="py-2.5 px-1 sm:px-2 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] cursor-pointer hover:border-[#673AB7] transition-all min-w-0 flex flex-col items-center justify-center shadow-2xs active:scale-95"
                >
                  <p className="text-base sm:text-lg font-black text-amber-600 leading-tight">{newRequests.length}</p>
                  <p className="text-[10px] font-bold text-[#64748B] mt-1 truncate w-full">Requests</p>
                </div>

                <div
                  onClick={() => {
                    setBookingFilter('ACCEPTED');
                    setActiveTab('bookings');
                  }}
                  className="py-2.5 px-1 sm:px-2 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] cursor-pointer hover:border-[#673AB7] transition-all min-w-0 flex flex-col items-center justify-center shadow-2xs active:scale-95"
                >
                  <p className="text-base sm:text-lg font-black text-[#673AB7] leading-tight">{acceptedBookings.length}</p>
                  <p className="text-[10px] font-bold text-[#64748B] mt-1 truncate w-full">Accepted</p>
                </div>

                <div
                  onClick={() => {
                    setBookingFilter('IN_PROGRESS');
                    setActiveTab('bookings');
                  }}
                  className="py-2.5 px-1 sm:px-2 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] cursor-pointer hover:border-[#673AB7] transition-all min-w-0 flex flex-col items-center justify-center shadow-2xs active:scale-95"
                >
                  <p className="text-base sm:text-lg font-black text-blue-600 leading-tight">{inProgressJobs.length}</p>
                  <p className="text-[10px] font-bold text-[#64748B] mt-1 truncate w-full">In Progress</p>
                </div>

                <div
                  onClick={() => setActiveTab('earnings')}
                  className="py-2.5 px-1 sm:px-2 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] cursor-pointer hover:border-[#673AB7] transition-all min-w-0 flex flex-col items-center justify-center shadow-2xs active:scale-95"
                >
                  <p
                    className="text-[11.5px] sm:text-sm font-black text-emerald-700 leading-tight truncate w-full tracking-tight"
                    title={`₹${profile.totalEarnings.toLocaleString()}`}
                  >
                    ₹{profile.totalEarnings >= 100000 ? `${(profile.totalEarnings / 1000).toFixed(1)}k` : profile.totalEarnings.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-[#64748B] mt-1 truncate w-full">Earnings</p>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS GRID */}
            <section className="space-y-2">
              <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider px-0.5">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setBookingFilter('REQUESTED');
                    setActiveTab('bookings');
                  }}
                  className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-left hover:border-[#673AB7] transition-all cursor-pointer flex items-center gap-2.5 active:scale-95 shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-[#111111] truncate">Bookings</h4>
                    <p className="text-[10px] text-[#64748B] truncate">{newRequests.length} waiting</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOpenTeamModal(true)}
                  className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-left hover:border-[#673AB7] transition-all cursor-pointer flex items-center gap-2.5 active:scale-95 shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#673AB7] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-[#111111] truncate">Team Staff</h4>
                    <p className="text-[10px] text-[#64748B] truncate">{technicians.length} field staff</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOpenServicesModal(true)}
                  className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-left hover:border-[#673AB7] transition-all cursor-pointer flex items-center gap-2.5 active:scale-95 shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-[#111111] truncate">Services & Rates</h4>
                    <p className="text-[10px] text-[#64748B] truncate">{services.length} categories</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOpenEarningsModal(true)}
                  className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-left hover:border-[#673AB7] transition-all cursor-pointer flex items-center gap-2.5 active:scale-95 shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-[#111111] truncate">Wallet & Payout</h4>
                    <p className="text-[10px] text-[#64748B] truncate">₹{profile.walletBalance} balance</p>
                  </div>
                </button>
              </div>
            </section>

            {/* RECENT WORK ORDERS STREAM */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Recent Society Work Orders
                </h3>
                <span
                  onClick={() => setActiveTab('bookings')}
                  className="text-[11px] font-bold text-[#673AB7] hover:underline cursor-pointer"
                >
                  View All ({bookings.length})
                </span>
              </div>

              <div className="space-y-2">
                {bookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between hover:border-[#673AB7] transition-all cursor-pointer active:scale-98"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-xs sm:text-sm text-[#111111] truncate">{b.residentName}</h4>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-white text-[#673AB7] border border-[#E6F1F5] shrink-0">
                          {b.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate">
                        Flat <strong className="text-[#111111]">{b.flatNumber}</strong> · {b.societyName}
                      </p>
                      <p className="text-[10px] text-[#A9B0B8] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{b.scheduledTime}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
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
                      <ChevronRight className="w-4 h-4 text-[#A9B0B8]" />
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
              <h2 className="text-base sm:text-lg font-black text-[#111111] tracking-tight">
                Work Orders & Bookings
              </h2>
              <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5">
                Service visits for Emerald Heights residents (सोसायटी सेवा कार्य)
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#A9B0B8]" />
              <input
                type="text"
                placeholder="Search by customer, flat, booking code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5">
              {(['ALL', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setBookingFilter(f)}
                  className={`px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
                    bookingFilter === f
                      ? 'bg-[#673AB7] text-white shadow-xs'
                      : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
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
                <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-[#A9B0B8]">
                  No bookings found under this filter.
                </div>
              ) : (
                filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2 hover:border-[#673AB7] transition-all cursor-pointer active:scale-98"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-[#673AB7]">
                            #{b.bookingCode}
                          </span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-white text-[#673AB7] border border-[#E6F1F5]">
                            {b.category}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs sm:text-sm text-[#111111] mt-0.5 truncate">{b.residentName}</h4>
                      </div>

                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
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

                    <p className="text-[11px] text-[#64748B] line-clamp-2">{b.problemDescription}</p>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#E6F1F5]">
                      <span className="truncate">
                        Flat <strong className="text-[#111111]">{b.flatNumber}</strong> · {b.scheduledTime}
                      </span>
                      <span className="font-black text-emerald-700 shrink-0">
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
              <h2 className="text-base sm:text-lg font-black text-[#111111] tracking-tight">
                Job Schedule & Calendar
              </h2>
              <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5">
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
                    className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between hover:border-[#673AB7] cursor-pointer active:scale-98 transition"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-[#111111]">{b.scheduledTime}</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-white text-[#673AB7] border border-[#E6F1F5]">
                          {b.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                        {b.residentName} · Flat <strong className="text-[#111111]">{b.flatNumber}</strong>
                      </p>
                      {b.assignedTechnicianName && (
                        <p className="text-[10px] font-bold text-[#673AB7] mt-0.5 truncate">
                          Assigned: {b.assignedTechnicianName}
                        </p>
                      )}
                    </div>

                    <button className="px-3 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] shrink-0">
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
              <h2 className="text-base sm:text-lg font-black text-[#111111] tracking-tight">
                Earnings & Financial Ledger
              </h2>
              <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5">
                Net earnings after 10% platform commission (कुल कमाई व वॉलेट)
              </p>
            </div>

            {/* Big Wallet Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#673AB7] to-[#512DA8] text-white flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] text-purple-200 uppercase font-semibold">Available Wallet Payout</p>
                <p className="text-2xl sm:text-3xl font-black mt-0.5">₹{profile.walletBalance.toLocaleString()}</p>
                <p className="text-[10px] text-purple-200 mt-1">
                  Settles automatically to registered bank account
                </p>
              </div>
              <button
                onClick={() => alert('Withdrawal request queued! Funds will be deposited within 24 hours.')}
                className="px-3.5 py-2 rounded-xl bg-white text-[#673AB7] font-black text-xs shadow-md hover:bg-purple-50 transition-colors cursor-pointer shrink-0"
              >
                Withdraw
              </button>
            </div>

            {/* Payout Breakdown */}
            <div className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Total Completed Jobs:</span>
                <span className="font-bold text-[#111111]">{profile.totalCompletedJobs} jobs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Lifetime Net Earnings:</span>
                <span className="font-black text-emerald-700">₹{profile.totalEarnings.toLocaleString()}</span>
              </div>
            </div>

            {/* Transactions Ledger */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#111111] px-0.5">Settled Invoices</h4>
              {earnings.map((e) => (
                <div
                  key={e.id}
                  className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs text-[#111111]">{e.residentName}</p>
                    <p className="text-[10px] text-[#A9B0B8]">{e.serviceCategory} · Ref #{e.bookingCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xs text-emerald-700">+₹{e.netPayout}</p>
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
              <h2 className="text-base sm:text-lg font-black text-[#111111] tracking-tight">
                Partner Profile & Settings
              </h2>
              <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5">
                Business details, KYC compliance, and team management
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center gap-3">
              <img
                src={profile.photoUrl}
                alt={profile.businessName}
                className="w-14 h-14 rounded-2xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-sm text-[#111111] truncate">{profile.businessName}</h3>
                <p className="text-xs text-[#64748B] truncate">{profile.contactPersonName} · {profile.phoneNumber}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Verified Vendor
                  </span>
                  <span className="text-[10px] text-[#A9B0B8]">ID: #{profile.partnerId}</span>
                </div>
              </div>
            </div>

            {/* Settings Links */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setOpenKycModal(true)}
                className="w-full p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between text-left hover:border-[#673AB7] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-xs text-[#111111]">KYC & Compliance Documents</h4>
                    <p className="text-[10px] text-[#A9B0B8]">PAN, GSTIN, and Trade License verified</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A9B0B8]" />
              </button>

              <button
                type="button"
                onClick={() => setOpenTeamModal(true)}
                className="w-full p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between text-left hover:border-[#673AB7] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#673AB7]" />
                  <div>
                    <h4 className="font-bold text-xs text-[#111111]">Technicians & Field Engineers</h4>
                    <p className="text-[10px] text-[#A9B0B8]">{technicians.length} registered staff</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A9B0B8]" />
              </button>

              <button
                type="button"
                onClick={() => setOpenServicesModal(true)}
                className="w-full p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between text-left hover:border-[#673AB7] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-bold text-xs text-[#111111]">Manage Services & Pricing</h4>
                    <p className="text-[10px] text-[#A9B0B8]">Base rates & inspection charges</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A9B0B8]" />
              </button>

              <button
                type="button"
                onClick={() => setOpenSupportModal(true)}
                className="w-full p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between text-left hover:border-[#673AB7] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <div>
                    <h4 className="font-bold text-xs text-[#111111]">Support & Help Desk</h4>
                    <p className="text-[10px] text-[#A9B0B8]">Contact platform administration</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A9B0B8]" />
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
