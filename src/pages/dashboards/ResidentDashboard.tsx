/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ResidentHeader } from '../../components/layout/ResidentHeader';
import { ResidentBottomNav, ResidentTab } from '../../components/layout/ResidentBottomNav';
import { VisitorCategoryCard } from '../../components/common/VisitorCategoryCard';
import { CommunityActionCard } from '../../components/common/CommunityActionCard';
import { GuestIllustration3D } from '../../components/illustrations/GuestIllustration3D';
import { DeliveryIllustration3D } from '../../components/illustrations/DeliveryIllustration3D';
import { ServiceIllustration3D } from '../../components/illustrations/ServiceIllustration3D';
import { CabIllustration3D } from '../../components/illustrations/CabIllustration3D';
import { HelpDeskIllustration3D } from '../../components/illustrations/HelpDeskIllustration3D';
import { NoticeBoardIllustration3D } from '../../components/illustrations/NoticeBoardIllustration3D';
import { PaymentIllustration3D } from '../../components/illustrations/PaymentIllustration3D';
import { AmenitiesIllustration3D } from '../../components/illustrations/AmenitiesIllustration3D';

// Modals
import { ResidentVisitorPreApprovalModal } from '../../components/resident/ResidentVisitorPreApprovalModal';
import { ResidentAllowCabModal } from '../../components/resident/ResidentAllowCabModal';
import { ResidentDigitalGatePassModal } from '../../components/resident/ResidentDigitalGatePassModal';
import { ResidentIncomingApprovalCallModal } from '../../components/resident/ResidentIncomingApprovalCallModal';
import { ResidentEmergencySosModal } from '../../components/resident/ResidentEmergencySosModal';
import { ResidentHouseholdModal } from '../../components/resident/ResidentHouseholdModal';
import { ResidentHelpDeskModal } from '../../components/resident/ResidentHelpDeskModal';
import { ResidentNoticeBoardModal } from '../../components/resident/ResidentNoticeBoardModal';
import { ResidentPaymentsModal } from '../../components/resident/ResidentPaymentsModal';
import { ResidentAmenitiesModal } from '../../components/resident/ResidentAmenitiesModal';
import { ResidentServicesModal } from '../../components/resident/ResidentServicesModal';
import { ResidentCommunityModal } from '../../components/resident/ResidentCommunityModal';
import { ResidentMessageSecurityModal } from '../../components/resident/ResidentMessageSecurityModal';
import { ResidentProfileModal } from '../../components/resident/ResidentProfileModal';

import { residentService } from '../../services/firebase/resident.service';
import { syncBus } from '../../services/firebase/sync.service';
import { ResidentGatePass } from '../../types/resident';
import { GuardVisitor, VisitorCategoryType } from '../../types/guard';
import { 
  Clock, 
  CheckCircle2, 
  QrCode, 
  Users, 
  ShieldAlert, 
  MessageSquare, 
  Send, 
  Car, 
  CreditCard, 
  Wrench,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const ResidentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ResidentTab>('home');

  // Resident Metadata
  const societyId = user?.societyId || 'soc_emerald_heights';
  const societyName = user?.societyName || 'Emerald Heights Luxury Enclave';
  const building = user?.buildingName || 'Tower B';
  const flatNumber = user?.flatNumber || 'B-704';
  const residentUid = user?.uid || 'res_priya';
  const residentName = user?.displayName || user?.fullName || 'Dr. Priya Varma';
  const residentPhone = user?.phoneNumber || '+91 98201 12345';

  // Live Data Stores
  const [passes, setPasses] = useState<ResidentGatePass[]>([]);
  const [incomingVisitor, setIncomingVisitor] = useState<GuardVisitor | null>(null);
  const [selectedPassForView, setSelectedPassForView] = useState<ResidentGatePass | null>(null);

  // Modal Open States
  const [preApproveCategory, setPreApproveCategory] = useState<VisitorCategoryType | null>(null);
  const [openAllowCab, setOpenAllowCab] = useState(false);
  const [openHelpDesk, setOpenHelpDesk] = useState(false);
  const [openNoticeBoard, setOpenNoticeBoard] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openAmenities, setOpenAmenities] = useState(false);
  const [openHousehold, setOpenHousehold] = useState(false);
  const [openServices, setOpenServices] = useState(false);
  const [openCommunity, setOpenCommunity] = useState(false);
  const [openMessageSecurity, setOpenMessageSecurity] = useState(false);
  const [openEmergencySos, setOpenEmergencySos] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'password'>('password');

  // Activity filter state
  const [activityFilter, setActivityFilter] = useState<'TODAY' | 'UPCOMING' | 'HISTORY'>('TODAY');

  // Fetch resident passes & poll for incoming doorbell requests
  const loadResidentData = useCallback(async () => {
    try {
      const pList = await residentService.getResidentPasses(societyId, residentUid);
      setPasses(pList);

      // Check for incoming doorbell approval from guard terminal
      const incoming = await residentService.checkForIncomingApprovals(societyId, flatNumber);
      if (incoming && incoming.id !== incomingVisitor?.id) {
        setIncomingVisitor(incoming);
      }
    } catch (err) {
      console.error('[ResidentDashboard] Data fetch error:', err);
    }
  }, [societyId, residentUid, flatNumber, incomingVisitor]);

  useEffect(() => {
    loadResidentData();

    // Instant real-time updates across portals
    const unsubscribeSync = syncBus.subscribeAll((event) => {
      if (event.societyId === societyId || event.societyId === 'all') {
        loadResidentData();
      }
    });

    const interval = setInterval(() => {
      loadResidentData();
    }, 6000);

    return () => {
      clearInterval(interval);
      unsubscribeSync();
    };
  }, [loadResidentData, societyId]);

  // Handle incoming approval actions
  const handleAcceptIncoming = async (visitorId: string) => {
    await residentService.respondToIncomingApproval(societyId, visitorId, 'ACCEPT');
    setIncomingVisitor(null);
    await loadResidentData();
  };

  const handleDenyIncoming = async (visitorId: string) => {
    await residentService.respondToIncomingApproval(societyId, visitorId, 'DENY');
    setIncomingVisitor(null);
    await loadResidentData();
  };

  const handlePassCreated = (newPass: ResidentGatePass) => {
    setPasses((prev) => [newPass, ...prev]);
    setSelectedPassForView(newPass);
  };

  const handleCancelPass = async (passId: string) => {
    await residentService.cancelPreApprovedPass(societyId, passId);
    await loadResidentData();
  };

  // Activity Filter Logic
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredPasses = passes.filter((p) => {
    if (activityFilter === 'TODAY') {
      return p.expectedDate === todayStr || p.status === 'INSIDE';
    }
    if (activityFilter === 'UPCOMING') {
      return p.expectedDate > todayStr || p.status === 'PRE_APPROVED';
    }
    return true; // HISTORY
  });

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] pb-24 select-none relative font-sans antialiased">
      {/* 1. TOP HEADER (Black Header: Bell, Centered SOS, Three Dots, Welcome & Resident Details) */}
      <ResidentHeader
        residentName={residentName}
        flatNumber={flatNumber}
        societyName={societyName}
        onSosClick={() => setOpenEmergencySos(true)}
        onOpenProfile={(tab) => {
          setProfileTab(tab || 'password');
          setOpenProfile(true);
        }}
      />

      <main className="max-w-lg mx-auto px-3 sm:px-4 pt-3 space-y-4">
        {/* INCOMING VISITOR ALERT BANNER (If a visitor is waiting at gate) */}
        {incomingVisitor && (
          <div
            onClick={() => {}}
            className="p-4 rounded-3xl bg-amber-500 text-white shadow-xl flex items-center justify-between animate-pulse cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-white animate-ping" />
              <div>
                <p className="font-black text-sm">{incomingVisitor.visitorName} is at Gate!</p>
                <p className="text-xs text-amber-100">
                  {incomingVisitor.gateName} · Tap to Authorize
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAcceptIncoming(incomingVisitor.id)}
              className="px-3.5 py-1.5 rounded-xl bg-white text-amber-950 font-black text-xs shadow-sm hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Approve
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: HOME (Compact 4-Tile Row matching Gate Guard)      */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-fade-in">

            {/* SECTION 1: PRE APPROVE VISITOR (Compact 4-Tile Row matching Gate Guard) */}
            <section className="space-y-2 w-full min-w-0">
              <div className="flex items-center justify-between px-0.5">
                <div>
                  <h2 className="text-xs sm:text-sm font-extrabold text-[#111111] tracking-wider uppercase">
                    PRE APPROVE VISITOR
                  </h2>
                  <p className="text-[11px] text-[#64748B]">
                    Add visitor details for quick entries (त्वरित प्रवेश)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreApproveCategory('Guest')}
                  className="text-xs font-bold text-[#673AB7] hover:underline cursor-pointer"
                >
                  + Fast Entry
                </button>
              </div>

              {/* 4 Visitor Cards in ONE SINGLE ROW on mobile: Guest | Delivery | Service | Cab */}
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full min-w-0">
                <VisitorCategoryCard
                  title="Guest"
                  illustration={<GuestIllustration3D size={38} />}
                  onClick={() => setPreApproveCategory('Guest')}
                />
                <VisitorCategoryCard
                  title="Delivery"
                  illustration={<DeliveryIllustration3D size={38} />}
                  onClick={() => setPreApproveCategory('Delivery')}
                />
                <VisitorCategoryCard
                  title="Service"
                  illustration={<ServiceIllustration3D size={38} />}
                  onClick={() => setPreApproveCategory('Service')}
                />
                <VisitorCategoryCard
                  title="Cab"
                  illustration={<CabIllustration3D size={38} />}
                  onClick={() => setPreApproveCategory('Cab')}
                />
              </div>
            </section>

            {/* QUICK STATS TICKER */}
            <section className="grid grid-cols-3 gap-2.5">
              <div
                onClick={() => setActiveTab('activity')}
                className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-center cursor-pointer hover:border-[#673AB7] transition-all"
              >
                <p className="text-xl font-extrabold text-[#673AB7]">
                  {passes.filter((p) => p.status === 'INSIDE').length}
                </p>
                <p className="text-[10px] font-bold text-[#64748B] mt-0.5">Inside Campus</p>
              </div>
              <div
                onClick={() => setActiveTab('activity')}
                className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-center cursor-pointer hover:border-[#673AB7] transition-all"
              >
                <p className="text-xl font-extrabold text-emerald-600">
                  {passes.filter((p) => p.status === 'PRE_APPROVED').length}
                </p>
                <p className="text-[10px] font-bold text-[#64748B] mt-0.5">Pre-Approved</p>
              </div>
              <div
                onClick={() => setOpenPayment(true)}
                className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-center cursor-pointer hover:border-[#673AB7] transition-all"
              >
                <p className="text-xl font-extrabold text-amber-600">₹4.2k</p>
                <p className="text-[10px] font-bold text-[#64748B] mt-0.5">Dues Pending</p>
              </div>
            </section>

            {/* SECTION 2: COMMUNITY (Reference Screenshot 1) */}
            <section className="space-y-3 pt-1">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                  Community
                </h2>
                <p className="text-xs sm:text-sm text-[#A9B0B8] mt-0.5">
                  Everything about society management
                </p>
              </div>

              {/* Vertically Stacked Wide Cards matching Reference Screenshot 1 */}
              <div className="space-y-3">
                <CommunityActionCard
                  title="HelpDesk"
                  subtitle="Complaint & suggestion"
                  illustration={<HelpDeskIllustration3D size={84} />}
                  onClick={() => setOpenHelpDesk(true)}
                />

                <CommunityActionCard
                  title="Notice Board"
                  subtitle="Society announcements"
                  badgeCount={2}
                  illustration={<NoticeBoardIllustration3D size={84} />}
                  onClick={() => setOpenNoticeBoard(true)}
                />

                <CommunityActionCard
                  title="Do society payment"
                  subtitle="Direct payment of society dues"
                  illustration={<PaymentIllustration3D size={84} />}
                  onClick={() => setOpenPayment(true)}
                />

                <CommunityActionCard
                  title="Book Amenities"
                  subtitle="Pre book society amenities"
                  illustration={<AmenitiesIllustration3D size={84} />}
                  onClick={() => setOpenAmenities(true)}
                />
              </div>
            </section>

            {/* MORE RESIDENT QUICK ACTIONS */}
            <section className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOpenHousehold(true)}
                className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-left hover:border-[#673AB7] transition-all cursor-pointer flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#673AB7]/10 text-[#673AB7] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#111111]">Household & Staff</h4>
                  <p className="text-[10px] text-[#A9B0B8]">Family, maids, vehicles</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOpenMessageSecurity(true)}
                className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-left hover:border-[#673AB7] transition-all cursor-pointer flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#111111]">Gate Instructions</h4>
                  <p className="text-[10px] text-[#A9B0B8]">Message guard cabin</p>
                </div>
              </button>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ACTIVITY (Visitor History, Pre-Approved & Passes) */}
        {/* ======================================================== */}
        {activeTab === 'activity' && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                  Gate & Visitor Activity
                </h2>
                <p className="text-xs sm:text-sm text-[#A9B0B8] mt-0.5">
                  Visitor passes & clearances for Flat {flatNumber}
                </p>
              </div>
              <button
                onClick={() => setPreApproveCategory('Guest')}
                className="px-3 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
              >
                + New Pass
              </button>
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-3 gap-2">
              {(['TODAY', 'UPCOMING', 'HISTORY'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActivityFilter(f)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                    activityFilter === f
                      ? 'bg-[#673AB7] text-white shadow-xs'
                      : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
                  }`}
                >
                  {f === 'TODAY' ? 'Today' : f === 'UPCOMING' ? 'Upcoming' : 'History'}
                </button>
              ))}
            </div>

            {/* Passes List */}
            <div className="space-y-2.5">
              {filteredPasses.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-[#A9B0B8]">
                  No passes found under {activityFilter.toLowerCase()}.
                </div>
              ) : (
                filteredPasses.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPassForView(p)}
                    className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between hover:border-[#673AB7] transition-all cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-[#111111]">{p.visitorName}</h4>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                          {p.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#A9B0B8] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{p.expectedTime}</span>
                        <span>·</span>
                        <span className="font-mono font-bold text-[#673AB7]">Code #{p.passCode}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.status === 'INSIDE'
                            ? 'bg-blue-100 text-blue-800'
                            : p.status === 'CHECKED_OUT'
                            ? 'bg-slate-200 text-slate-700'
                            : p.status === 'PRE_APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                      <QrCode className="w-4 h-4 text-[#673AB7]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SOCIAL (Community Posts, Discussions & Directory) */}
        {/* ======================================================== */}
        {activeTab === 'social' && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                  Society Social
                </h2>
                <p className="text-xs sm:text-sm text-[#A9B0B8] mt-0.5">
                  Emerald Heights Community Discussions
                </p>
              </div>
              <button
                onClick={() => setOpenCommunity(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
              >
                Directory & Posts
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#673AB7] text-white font-bold text-xs flex items-center justify-center">
                    A
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#111111]">Anand Joshi (Tower A-302)</p>
                    <p className="text-[10px] text-[#A9B0B8]">2 hours ago · General Discussion</p>
                  </div>
                </div>
                <p className="text-xs text-[#111111] leading-relaxed">
                  Anyone interested in joining morning badminton sessions at the Clubhouse from 7:00 AM?
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#EC4899] text-white font-bold text-xs flex items-center justify-center">
                    S
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#111111]">Shalini Rao (Tower B-1102)</p>
                    <p className="text-[10px] text-[#A9B0B8]">Yesterday · Society Event</p>
                  </div>
                </div>
                <p className="text-xs text-[#111111] leading-relaxed">
                  Reminder: Yoga workshop by certified instructor this Saturday at 6:30 AM in the amphitheatre garden.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 4: SERVICE (Vendor & Domestic Staff Booking) */}
        {/* ======================================================== */}
        {activeTab === 'service' && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                  Home Services
                </h2>
                <p className="text-xs sm:text-sm text-[#A9B0B8] mt-0.5">
                  Verified society service providers & daily help
                </p>
              </div>
              <button
                onClick={() => setOpenServices(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
              >
                View Marketplace
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Electrician', rating: '4.8 ★', available: '3 active', price: '₹199' },
                { title: 'Plumbing', rating: '4.9 ★', available: '2 active', price: '₹249' },
                { title: 'House Cleaning', rating: '4.7 ★', available: '5 active', price: '₹599' },
                { title: 'Carpentry', rating: '4.8 ★', available: '1 active', price: '₹299' },
                { title: 'Appliance Repair', rating: '4.6 ★', available: '4 active', price: '₹349' },
                { title: 'Pest Control', rating: '4.9 ★', available: '2 active', price: '₹899' },
              ].map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setOpenServices(true)}
                  className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-left hover:border-[#673AB7] transition-all cursor-pointer group"
                >
                  <p className="font-bold text-sm text-[#111111] group-hover:text-[#673AB7]">
                    {s.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#A9B0B8] mt-1">
                    <span className="text-amber-500 font-bold">{s.rating}</span>
                    <span className="font-semibold text-slate-800">From {s.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FIXED BLACK BOTTOM NAVIGATION WITH ELEVATED PURPLE SECURITY SHIELD BUTTON */}
      <ResidentBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onSecurityClick={() => setOpenEmergencySos(true)}
      />

      {/* ======================================================== */}
      {/* 2. MODALS */}
      {/* ======================================================== */}
      {/* Pre-Approve Visitor Modal */}
      {preApproveCategory && (
        <ResidentVisitorPreApprovalModal
          isOpen={Boolean(preApproveCategory)}
          onClose={() => setPreApproveCategory(null)}
          initialCategory={preApproveCategory}
          societyId={societyId}
          societyName={societyName}
          building={building}
          flatNumber={flatNumber}
          residentUid={residentUid}
          residentName={residentName}
          onSuccess={handlePassCreated}
        />
      )}

      {/* Allow My Cab Modal */}
      <ResidentAllowCabModal
        isOpen={openAllowCab}
        onClose={() => setOpenAllowCab(false)}
        societyId={societyId}
        societyName={societyName}
        building={building}
        flatNumber={flatNumber}
        residentUid={residentUid}
        residentName={residentName}
        onSuccess={handlePassCreated}
      />

      {/* Digital GatePass Modal */}
      <ResidentDigitalGatePassModal
        isOpen={Boolean(selectedPassForView)}
        onClose={() => setSelectedPassForView(null)}
        pass={selectedPassForView}
        onCancelPass={handleCancelPass}
      />

      {/* Incoming Doorbell Visitor Approval Call */}
      <ResidentIncomingApprovalCallModal
        visitor={incomingVisitor}
        onAccept={handleAcceptIncoming}
        onDeny={handleDenyIncoming}
        onDismiss={() => setIncomingVisitor(null)}
      />

      {/* Emergency SOS Center */}
      <ResidentEmergencySosModal
        isOpen={openEmergencySos}
        onClose={() => setOpenEmergencySos(false)}
        societyId={societyId}
        building={building}
        flatNumber={flatNumber}
        residentUid={residentUid}
        residentName={residentName}
        residentPhone={residentPhone}
      />

      {/* Household & Staff */}
      <ResidentHouseholdModal
        isOpen={openHousehold}
        onClose={() => setOpenHousehold(false)}
        residentUid={residentUid}
        flatNumber={flatNumber}
      />

      {/* HelpDesk */}
      <ResidentHelpDeskModal
        isOpen={openHelpDesk}
        onClose={() => setOpenHelpDesk(false)}
        societyId={societyId}
        residentUid={residentUid}
        residentName={residentName}
        building={building}
        flatNumber={flatNumber}
      />

      {/* Notice Board */}
      <ResidentNoticeBoardModal
        isOpen={openNoticeBoard}
        onClose={() => setOpenNoticeBoard(false)}
        societyId={societyId}
        residentUid={residentUid}
        residentName={residentName}
        flatNumber={flatNumber}
      />

      {/* Society Payments */}
      <ResidentPaymentsModal
        isOpen={openPayment}
        onClose={() => setOpenPayment(false)}
        societyId={societyId}
        residentUid={residentUid}
        flatNumber={flatNumber}
      />

      {/* Book Amenities */}
      <ResidentAmenitiesModal
        isOpen={openAmenities}
        onClose={() => setOpenAmenities(false)}
        societyId={societyId}
        residentUid={residentUid}
        residentName={residentName}
        flatNumber={flatNumber}
      />

      {/* Home Services */}
      <ResidentServicesModal
        isOpen={openServices}
        onClose={() => setOpenServices(false)}
        residentUid={residentUid}
        residentName={residentName}
        flatNumber={flatNumber}
      />

      {/* Community Social & Directory */}
      <ResidentCommunityModal
        isOpen={openCommunity}
        onClose={() => setOpenCommunity(false)}
        societyId={societyId}
        residentUid={residentUid}
        residentName={residentName}
        flatNumber={flatNumber}
      />

      {/* Message Security */}
      <ResidentMessageSecurityModal
        isOpen={openMessageSecurity}
        onClose={() => setOpenMessageSecurity(false)}
        societyId={societyId}
        building={building}
        flatNumber={flatNumber}
        residentUid={residentUid}
        residentName={residentName}
      />

      {/* In-App Mobile Profile & Password Security Modal */}
      <ResidentProfileModal
        isOpen={openProfile}
        onClose={() => setOpenProfile(false)}
        initialTab={profileTab}
      />
    </div>
  );
};
