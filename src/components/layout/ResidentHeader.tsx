/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, User, LogOut, Shield, MoreVertical, ShieldAlert, Key } from 'lucide-react';
import { Modal } from '../common/Modal';
import { notificationEngine, EcosystemNotification } from '../../services/firebase/notification.service';
import { syncBus } from '../../services/firebase/sync.service';

interface ResidentHeaderProps {
  residentName?: string;
  flatNumber?: string;
  societyName?: string;
  onSosClick?: () => void;
  onOpenProfile?: (tab?: 'profile' | 'password') => void;
}

export const ResidentHeader: React.FC<ResidentHeaderProps> = ({
  residentName,
  flatNumber,
  societyName,
  onSosClick,
  onOpenProfile,
}) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<EcosystemNotification[]>([]);
  const navigate = useNavigate();

  const residentUid = user?.uid || 'usr_resident_04';
  const displayName = residentName || user?.displayName || 'Dr. Priya Varma';
  const displayFlat = flatNumber || user?.flatNumber || 'B-704';
  const displaySociety = societyName || user?.societyName || 'Emerald Heights Luxury Enclave';

  const loadNotifications = () => {
    const list = notificationEngine.getUserNotifications(residentUid);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
    const unsub = syncBus.subscribeAll(() => {
      loadNotifications();
    });
    return () => unsub();
  }, [residentUid]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    notificationEngine.markAllAsRead(residentUid);
    loadNotifications();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#050505] border-b border-white/10 px-4 sm:px-6 py-2.5 shadow-xl text-white">
        {/* Top Navigation Row: Bell (Left) | SOS Button (Center) | Three Dots Menu (Right) */}
        <div className="flex items-center justify-between">
          {/* Left: Notification Bell with Dynamic Unread Badge */}
          <div className="relative flex items-center">
            <button
              onClick={handleOpenNotifications}
              className="p-1.5 rounded-xl text-gray-300 hover:text-white transition-colors cursor-pointer relative"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 left-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#E53945] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Center: SOS Emergency Button (बीच में) */}
          <div className="flex items-center justify-center">
            <button
              onClick={onSosClick}
              type="button"
              className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(229,57,69,0.55)] transition-all active:scale-95 cursor-pointer ring-2 ring-red-400/50"
              title="Emergency SOS (आपातकालीन सहायता)"
            >
              <ShieldAlert className="w-4 h-4 fill-white shrink-0" />
              <span className="tracking-wider">SOS</span>
            </button>
          </div>

          {/* Right: Three Dots Menu Button (Replacing Circular Avatar) */}
          <div className="relative flex items-center">
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className="p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Open options menu"
              title="Options & Profile"
            >
              <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-2xl p-3 z-50 text-xs text-[#111111] animate-fade-in">
                  <div className="pb-2.5 mb-2 border-b border-[#E6F1F5]">
                    <p className="font-bold text-sm text-[#111111] truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-[#64748B] truncate">
                      Flat {displayFlat} · {displaySociety}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onOpenProfile) {
                          onOpenProfile('password');
                        } else {
                          navigate('/profile');
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#111111] hover:bg-[#F1F9FC] font-medium transition-colors cursor-pointer text-left"
                    >
                      <User className="w-4 h-4 text-[#673AB7]" />
                      <span>My Profile (माई प्रोफाइल)</span>
                    </button>
                    <Link
                      to="/select-society"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#111111] hover:bg-[#F1F9FC] font-medium transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-[#0EA5E9]" />
                      <span>Switch Society</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#E53945] hover:bg-red-50 font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resident Greeting & Flat Info inside the black header */}
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                Welcome, {displayName}
              </h1>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-full shrink-0">
                Happiiz User
              </span>
            </div>
            <p className="text-[11px] text-gray-300 font-medium truncate mt-0.5">
              Flat <strong className="text-purple-300 font-bold">{displayFlat}</strong> · {displaySociety}
            </p>
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
        description="Live visitor entries, service jobs & community alerts"
        maxWidth="sm"
      >
        <div className="space-y-2.5 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#A9B0B8]">
              No notifications yet. You are completely caught up!
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
