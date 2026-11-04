/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, User, LogOut, Shield } from 'lucide-react';
import { Modal } from '../common/Modal';

export const ResidentHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 w-full bg-[#FFFFFF] border-b border-[#E6F1F5] px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Notification Bell with Red Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(true)}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#111111] transition-colors cursor-pointer relative"
            aria-label="View notifications"
          >
            <Bell className="w-6 h-6 stroke-[2]" />
            <span className="absolute top-1 left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E53945] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              2
            </span>
          </button>
        </div>

        {/* Center: Branding */}
        <div className="flex items-center justify-center">
          <Link
            to="/dashboard/resident"
            className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] hover:text-[#673AB7] transition-colors"
          >
            Happiiz Gate
          </Link>
        </div>

        {/* Right: Circular Resident Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu((v) => !v)}
            className="w-10 h-10 rounded-full ring-2 ring-[#F472B6]/60 p-0.5 hover:ring-[#673AB7] transition-all overflow-hidden flex items-center justify-center bg-gradient-to-tr from-[#FCE7F3] to-[#F3E8FF] cursor-pointer"
            aria-label="Open resident profile"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Resident'}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-sm font-bold text-[#673AB7]">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'R'}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xl p-3 z-50 text-xs text-[#111111] animate-fade-in">
                <div className="pb-2.5 mb-2 border-b border-[#E6F1F5]">
                  <p className="font-bold text-sm text-[#111111] truncate">
                    {user?.displayName || 'Resident'}
                  </p>
                  <p className="text-[11px] text-[#A9B0B8] truncate">
                    Flat {user?.flatNumber || 'B-704'} · {user?.societyName || 'Emerald Heights'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#111111] hover:bg-[#F1F9FC] font-medium transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#673AB7]" />
                    <span>My Profile</span>
                  </Link>
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
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
        description="Society announcements & gate notices"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs">
            <div className="flex items-center justify-between font-bold text-[#673AB7] mb-1">
              <span>Visitor at Main Gate</span>
              <span className="text-[10px] text-[#A9B0B8]">5m ago</span>
            </div>
            <p className="text-[#111111]">
              Swiggy delivery agent #4928 checked in at North Gate.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs">
            <div className="flex items-center justify-between font-bold text-[#111111] mb-1">
              <span>Society Maintenance Due</span>
              <span className="text-[10px] text-[#A9B0B8]">Today</span>
            </div>
            <p className="text-[#64748B]">
              Monthly maintenance charges of ₹4,200 due on 10th. Tap "Do Society Payment" to pay instantly.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
