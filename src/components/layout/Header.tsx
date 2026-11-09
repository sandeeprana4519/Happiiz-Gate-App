/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SecurityShield3D } from '../visuals/SecurityShield3D';
import { Menu, X, LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setShowProfileMenu(false);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Gate Guard', path: '/dashboard/guard' },
    { label: 'Resident Portal', path: '/dashboard/resident' },
    { label: 'Service Partner', path: '/dashboard/service-partner' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F19] text-white border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between shadow-md">
      {/* 1. Happiiz Gate Logo and Brand Name */}
      <Link
        to="/"
        className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        <SecurityShield3D size={32} />
        <span className="text-base sm:text-lg font-extrabold tracking-tight text-white group-hover:text-purple-400 transition-colors">
          Happiiz Gate
        </span>
      </Link>

      {/* Desktop Navigation: Exactly Gate Sentinel | Resident Portal | Service Partner */}
      <nav className="hidden md:flex items-center gap-2 text-sm font-semibold">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`transition-all whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold ${
                isActive
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Action: Clean User Status / Sign In / Mobile Toggle */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((v) => !v)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#673AB7] to-[#9333EA] text-white font-bold text-xs flex items-center justify-center ring-2 ring-purple-400/30 shadow-xs">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#111827] border border-white/10 shadow-2xl p-2.5 z-50 text-xs text-gray-200 animate-fade-in">
                  <div className="px-2 py-1.5 border-b border-white/10 mb-1.5">
                    <p className="font-bold text-white truncate">{user.displayName || 'Verified User'}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user.phoneNumber || user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-purple-400" />
                    <span>Profile Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-red-400 hover:bg-red-500/10 font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="hidden sm:inline-flex text-xs font-bold px-4 py-2 rounded-xl bg-[#673AB7] text-white hover:bg-[#582cb5] shadow-md shadow-purple-900/30 transition-all"
          >
            Login
          </Link>
        )}

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="md:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown: Only Gate Guard, Resident Portal, Service Partner */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[#0B0F19] border-b border-white/10 shadow-2xl p-4 space-y-2 animate-fade-in z-50">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                      : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {!user && (
            <div className="pt-2 border-t border-white/10">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold flex items-center justify-center hover:bg-[#582cb5] transition-colors"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
