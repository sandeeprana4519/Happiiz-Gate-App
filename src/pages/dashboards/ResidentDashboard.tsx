/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { VisitorEntryModal, VisitorCategory } from '../../components/common/VisitorEntryModal';
import {
  HelpDeskModal,
  NoticeBoardModal,
  SocietyPaymentModal,
  BookAmenitiesModal,
} from '../../components/common/CommunityModals';
import {
  Clock,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Wrench,
  Search,
  Phone,
  Shield,
  ArrowRight,
} from 'lucide-react';

export const ResidentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ResidentTab>('home');

  // Visitor Form Modal State
  const [selectedCategory, setSelectedCategory] = useState<VisitorCategory | null>(null);

  // Community Modals State
  const [openHelpDesk, setOpenHelpDesk] = useState(false);
  const [openNoticeBoard, setOpenNoticeBoard] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openAmenities, setOpenAmenities] = useState(false);

  // Recent Resident Activity Data
  const [recentPasses, setRecentPasses] = useState([
    {
      id: 'PASS-8921',
      name: 'Karan Mehra',
      type: 'Guest',
      code: '829415',
      time: 'Today, 04:30 PM',
      status: 'Approved',
    },
    {
      id: 'PASS-7732',
      name: 'Swiggy Food Courier',
      type: 'Delivery',
      code: '310928',
      time: 'Today, 01:15 PM',
      status: 'CheckedIn',
    },
    {
      id: 'PASS-6119',
      name: 'Urban Company Electrician',
      type: 'Service',
      code: '902144',
      time: 'Yesterday',
      status: 'Completed',
    },
  ]);

  const handleVisitorSubmit = (data: any) => {
    const newEntry = {
      id: `PASS-${Math.floor(1000 + Math.random() * 9000)}`,
      name: data.visitorName || data.category,
      type: data.category,
      code: data.passCode,
      time: 'Just now',
      status: 'Approved',
    };
    setRecentPasses([newEntry, ...recentPasses]);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] pb-24 select-none">
      {/* 1. TOP HEADER (Reference Screenshot 1) */}
      <ResidentHeader />

      <main className="max-w-lg mx-auto px-4 sm:px-6 pt-5 space-y-7">
        {/* TAB 1: HOME (Exact Recreation of Reference Screenshot 1) */}
        {activeTab === 'home' && (
          <>
            {/* SECTION: PRE APPROVE VISITOR */}
            <section className="space-y-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                  Pre Approve Visitor
                </h2>
                <p className="text-xs sm:text-sm text-[#A9B0B8] mt-0.5">
                  Add visitor details for quick entries
                </p>
              </div>

              {/* Horizontal Scrollable Visitor Category Cards */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                <VisitorCategoryCard
                  title={'Add\nGuest'}
                  illustration={<GuestIllustration3D size={105} />}
                  onClick={() => setSelectedCategory('Guest')}
                />
                <VisitorCategoryCard
                  title={'Add\nDelivery'}
                  illustration={<DeliveryIllustration3D size={105} />}
                  onClick={() => setSelectedCategory('Delivery')}
                />
                <VisitorCategoryCard
                  title={'Add\nService'}
                  illustration={<ServiceIllustration3D size={105} />}
                  onClick={() => setSelectedCategory('Service')}
                />
                <VisitorCategoryCard
                  title={'Add\nCab'}
                  illustration={<CabIllustration3D size={105} />}
                  onClick={() => setSelectedCategory('Cab')}
                />
              </div>
            </section>

            {/* SECTION: COMMUNITY */}
            <section className="space-y-3 pt-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                  Community
                </h2>
                <p className="text-xs sm:text-sm text-[#A9B0B8] mt-0.5">
                  Everything about society management
                </p>
              </div>

              {/* Vertically Stacked Wide Cards */}
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
          </>
        )}

        {/* TAB 2: ACTIVITY (Visitor History & Approvals) */}
        {activeTab === 'activity' && (
          <section className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                Gate & Visitor Activity
              </h2>
              <p className="text-xs sm:text-sm text-[#A9B0B8] mt-0.5">
                Passes generated for Flat {user?.flatNumber || 'B-704'}
              </p>
            </div>

            <div className="space-y-2.5">
              {recentPasses.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#111111]">{p.name}</h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                        {p.type}
                      </span>
                    </div>
                    <p className="text-xs text-[#A9B0B8] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{p.time}</span>
                      <span>·</span>
                      <span className="font-mono font-bold text-[#673AB7]">Code #{p.code}</span>
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      p.status === 'CheckedIn'
                        ? 'bg-blue-100 text-blue-700'
                        : p.status === 'Completed'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: SOCIAL (Community Feed & Directory) */}
        {activeTab === 'social' && (
          <section className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                Society Social
              </h2>
              <p className="text-xs sm:text-sm text-[#A9B0B8] mt-0.5">
                Emerald Heights Community Discussions
              </p>
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

        {/* TAB 4: SERVICE (Vendor & Domestic Staff Booking) */}
        {activeTab === 'service' && (
          <section className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                Home Services
              </h2>
              <p className="text-xs sm:text-sm text-[#A9B0B8] mt-0.5">
                Verified society service providers & daily help
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Electrician', rating: '4.8 ★', available: '3 active' },
                { title: 'Plumbing', rating: '4.9 ★', available: '2 active' },
                { title: 'House Cleaning', rating: '4.7 ★', available: '5 active' },
                { title: 'Carpentry', rating: '4.8 ★', available: '1 active' },
                { title: 'Appliance Repair', rating: '4.6 ★', available: '4 active' },
                { title: 'Pest Control', rating: '4.9 ★', available: '2 active' },
              ].map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => alert(`Connecting with verified ${s.title} partners for Emerald Heights...`)}
                  className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-left hover:border-[#673AB7] transition-all cursor-pointer group"
                >
                  <p className="font-bold text-sm text-[#111111] group-hover:text-[#673AB7]">
                    {s.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#A9B0B8] mt-1">
                    <span className="text-amber-500 font-bold">{s.rating}</span>
                    <span>{s.available}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FIXED BLACK BOTTOM NAVIGATION WITH ELEVATED PURPLE SECURITY BUTTON */}
      <ResidentBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* VISITOR ENTRY MODAL */}
      {selectedCategory && (
        <VisitorEntryModal
          isOpen={Boolean(selectedCategory)}
          onClose={() => setSelectedCategory(null)}
          category={selectedCategory}
          onSubmit={handleVisitorSubmit}
        />
      )}

      {/* COMMUNITY ACTION MODALS */}
      <HelpDeskModal isOpen={openHelpDesk} onClose={() => setOpenHelpDesk(false)} />
      <NoticeBoardModal isOpen={openNoticeBoard} onClose={() => setOpenNoticeBoard(false)} />
      <SocietyPaymentModal isOpen={openPayment} onClose={() => setOpenPayment(false)} />
      <BookAmenitiesModal isOpen={openAmenities} onClose={() => setOpenAmenities(false)} />
    </div>
  );
};
