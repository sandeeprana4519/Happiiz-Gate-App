/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Power, 
  Wrench, 
  Star, 
  Bell, 
  LogOut,
  MoreVertical,
  Users,
  FileCheck,
  HelpCircle,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { ServicePartnerProfile } from '../../types/servicePartner';
import { Modal } from '../common/Modal';
import { notificationEngine, EcosystemNotification } from '../../services/firebase/notification.service';
import { syncBus } from '../../services/firebase/sync.service';

interface PartnerHeaderProps {
  profile: ServicePartnerProfile;
  onToggleOnline: (isOnline: boolean) => void;
  onLogout: () => void;
  onOpenTeam?: () => void;
  onOpenServices?: () => void;
  onOpenKyc?: () => void;
  onOpenSupport?: () => void;
  newRequestsCount?: number;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({
  profile,
  onToggleOnline,
  onLogout,
  onOpenTeam,
  onOpenServices,
  onOpenKyc,
  onOpenSupport,
  newRequestsCount = 0,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<EcosystemNotification[]>([]);

  // Load notifications for this partner
  const partnerUid = profile.partnerId || 'sp_1';

  const loadNotifications = () => {
    const list = notificationEngine.getUserNotifications(partnerUid);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
    const unsub = syncBus.subscribeAll(() => {
      loadNotifications();
    });
    return () => unsub();
  }, [partnerUid]);

  const unreadCount = notifications.filter((n) => !n.isRead).length + (newRequestsCount > 0 ? newRequestsCount : 0);

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    notificationEngine.markAllAsRead(partnerUid);
    loadNotifications();
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#050505] border-b border-white/10 px-3 sm:px-4 py-2.5 select-none text-white shadow-2xl">
        <div className="w-full max-w-lg mx-auto">
          {/* Top Bar: Notification Bell (Left) | Online/Offline Status (Center) | Three Dots Menu (Right) */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Notification Bell with Unread Badge */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={handleOpenNotifications}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer relative"
                aria-label="View notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#E53945] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-black animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Center: Online / Offline Status Toggle (बीच में) */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => onToggleOnline(!profile.isOnline)}
                className={`px-4 py-1.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md ${
                  profile.isOnline
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/20'
                    : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/15'
                }`}
                title={profile.isOnline ? 'Online - Receiving Service Requests' : 'Offline - Not Receiving Requests'}
              >
                <Power className={`w-4 h-4 ${profile.isOnline ? 'text-emerald-400 animate-pulse' : 'text-gray-400'}`} />
                <span className="tracking-wider">{profile.isOnline ? 'Online' : 'Offline'}</span>
              </button>
            </div>

            {/* Right: Three Dots Menu Button (तीन डॉट) */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Partner options menu"
                title="Partner Menu"
              >
                <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-[#E6F1F5] shadow-2xl p-2.5 z-50 text-xs text-[#111111] animate-fade-in">
                    <div className="pb-2 mb-2 border-b border-[#E6F1F5] px-1">
                      <p className="font-extrabold text-xs text-gray-900 truncate">
                        {profile.businessName}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {profile.contactPersonName} · #{profile.partnerId}
                      </p>
                    </div>

                    <div className="space-y-1">
                      {onOpenTeam && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onOpenTeam();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-gray-800 hover:bg-[#F1F9FC] font-semibold transition cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-[#673AB7]" />
                          <span>Technicians Team</span>
                        </button>
                      )}

                      {onOpenServices && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onOpenServices();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-gray-800 hover:bg-[#F1F9FC] font-semibold transition cursor-pointer"
                        >
                          <Wrench className="w-4 h-4 text-blue-600" />
                          <span>Services & Rates</span>
                        </button>
                      )}

                      {onOpenKyc && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onOpenKyc();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-gray-800 hover:bg-[#F1F9FC] font-semibold transition cursor-pointer"
                        >
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span>KYC & Compliance</span>
                        </button>
                      )}

                      {onOpenSupport && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onOpenSupport();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-gray-800 hover:bg-[#F1F9FC] font-semibold transition cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4 text-amber-600" />
                          <span>Support & Help Desk</span>
                        </button>
                      )}

                      <div className="pt-1 mt-1 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#E53945] hover:bg-red-50 font-bold transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lower Row: Partner Info (नाम को थोड़ा नीचे कर दो) */}
          <div className="mt-2.5 pt-2.5 border-t border-white/10">
            <div className="flex items-center justify-between gap-2.5">
              {/* Partner Avatar + Business Name & Identity */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <img
                    src={profile.photoUrl}
                    alt={profile.businessName}
                    className="w-11 h-11 rounded-2xl object-cover border border-white/20 shadow-xs"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#050505] ${
                      profile.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                    }`}
                    title={profile.isOnline ? 'Online for Bookings' : 'Offline'}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-full shrink-0">
                      Happiiz Partner
                    </span>
                    <span title="Verified Partner" className="shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  </div>
                  <h1 className="text-sm font-black text-white truncate mt-0.5 tracking-tight">
                    {profile.businessName}
                  </h1>
                  <p className="text-[11px] text-gray-300 truncate">
                    {profile.contactPersonName} · #{profile.partnerId}
                  </p>
                </div>
              </div>

              {/* Rating & Wallet Chips */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-500/30 text-[11px]">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{profile.rating}</span>
                  <span className="text-gray-400 font-normal">({profile.totalReviews})</span>
                </span>
                <span className="text-emerald-400 font-extrabold text-[11px] bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  ₹{profile.walletBalance.toLocaleString()} Wallet
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Partner Notifications"
        description="Booking requests, payments, ratings & society broadcasts"
        maxWidth="sm"
      >
        <div className="space-y-2.5 max-h-96 overflow-y-auto">
          {newRequestsCount > 0 && (
            <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-50 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  New Booking Alert
                </span>
                <span className="text-[10px] text-amber-700 font-medium">Just now</span>
              </div>
              <p className="text-amber-900 leading-relaxed">
                You have {newRequestsCount} pending service request(s) awaiting your acceptance.
              </p>
            </div>
          )}

          {notifications.length === 0 && newRequestsCount === 0 ? (
            <div className="py-8 text-center text-xs text-[#A9B0B8]">
              No new notifications. You are completely caught up!
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-2xl border text-xs transition-all ${
                  !n.isRead
                    ? 'bg-[#F1F9FC] border-[#673AB7]/30'
                    : 'bg-[#FFFFFF] border-[#E6F1F5]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                    {n.priority === 'CRITICAL' && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                    <span className={n.priority === 'CRITICAL' ? 'text-rose-600' : 'text-[#673AB7]'}>
                      {n.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#A9B0B8]">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[#334155] leading-relaxed">{n.body}</p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
};
