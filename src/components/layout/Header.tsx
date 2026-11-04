/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { RoleBadge } from './RoleBadge';
import { SecurityShield3D } from '../visuals/SecurityShield3D';
import { Bell, LogOut, Shield, User, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';

export const Header: React.FC = () => {
  const { user, logout, isFirebaseConfigured } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 w-full bg-[#FFFFFF] border-b border-[#E6F1F5] px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark with 3D emblem */}
        <Link
          to="/"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group focus-visible:outline-none"
        >
          <SecurityShield3D size={32} />
          <span className="text-base sm:text-lg font-bold tracking-tight text-[#111111] group-hover:text-[#673AB7] transition-colors">
            Happiiz Gate
          </span>
        </Link>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-[#64748B]">
          <Link
            to="/dashboard/guard"
            className="hover:text-[#673AB7] transition-colors whitespace-nowrap"
          >
            Gate Sentinel
          </Link>
          <Link
            to="/dashboard/resident"
            className="hover:text-[#673AB7] transition-colors whitespace-nowrap"
          >
            Resident Portal
          </Link>
          <Link
            to="/dashboard/society-admin"
            className="hover:text-[#673AB7] transition-colors whitespace-nowrap"
          >
            Society Admin
          </Link>
          <Link
            to="/dashboard/super-admin"
            className="hover:text-[#673AB7] transition-colors whitespace-nowrap"
          >
            Super Admin
          </Link>
        </nav>

        {/* Zone 3: Primary Actions & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Role Badge with preview switcher */}
          <RoleBadge />

          {/* Notifications Icon with active badge */}
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-xl text-[#64748B] hover:text-[#111111] bg-[#F1F9FC] border border-[#E6F1F5] transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E53945] ring-2 ring-white" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile / Logout Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((v) => !v)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F1F9FC] transition-colors cursor-pointer"
                aria-label="User profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#673AB7] to-[#9333EA] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xl p-3 z-50 text-xs text-[#111111] animate-fade-in">
                    <div className="pb-2.5 mb-2 border-b border-[#E6F1F5]">
                      <p className="font-bold text-sm text-[#111111] truncate">
                        {user.displayName}
                      </p>
                      <p className="text-[11px] text-[#A9B0B8] truncate">
                        {user.phoneNumber || user.email || 'Verified User'}
                      </p>
                      {user.societyName && (
                        <p className="text-[11px] text-[#673AB7] font-semibold mt-1 truncate">
                          {user.societyName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#111111] hover:bg-[#F1F9FC] font-medium transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#673AB7]" />
                        <span>Profile & Security</span>
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
          ) : (
            <Link
              to="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#673AB7] text-white hover:bg-[#512DA8] transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Notifications Drawer Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Gate & Society Alerts"
        description="Real-time security and visitor notifications"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs">
            <div className="flex items-center justify-between font-semibold text-sky-400 mb-1">
              <span>Visitor Approved</span>
              <span className="text-[10px] text-slate-400">10m ago</span>
            </div>
            <p className="text-slate-300">
              Karan Mehra (Guest for B-704) cleared entry via North Gate #1.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-300 mb-1">
              <span>Delivery Entry Pass</span>
              <span className="text-[10px] text-slate-400">24m ago</span>
            </div>
            <p className="text-slate-400">
              Swiggy food delivery checked in with pass code #1839.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-300 mb-1">
              <span>Firebase Status</span>
              <span className="text-[10px] text-slate-400">System</span>
            </div>
            <p className="text-slate-400">
              {isFirebaseConfigured
                ? 'Production Firestore & Auth connected.'
                : 'Running in Local Development Preview Mode. Sample data enabled.'}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
