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
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E6F1F5] px-4 sm:px-8 h-16 flex items-center justify-between">
      {/* 1. Happiiz Gate Logo and Brand Name */}
      <Link
        to="/"
        className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        <SecurityShield3D size={32} />
        <span className="text-base sm:text-lg font-bold tracking-tight text-[#111111] group-hover:text-[#673AB7] transition-colors">
          Happiiz Gate
        </span>
      </Link>

      {/* Desktop Navigation: Exactly Gate Sentinel | Resident Portal | Service Partner */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#64748B]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
                isActive
                  ? 'text-[#673AB7] border-[#673AB7] font-bold'
                  : 'border-transparent hover:text-[#673AB7]'
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
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F1F9FC] transition-colors cursor-pointer"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#673AB7] to-[#9333EA] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xl p-2.5 z-50 text-xs text-[#111111] animate-fade-in">
                  <div className="px-2 py-1.5 border-b border-[#E6F1F5] mb-1.5">
                    <p className="font-bold text-[#111111] truncate">{user.displayName || 'Verified User'}</p>
                    <p className="text-[11px] text-[#A9B0B8] truncate">{user.phoneNumber || user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#111111] hover:bg-[#F1F9FC] font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-[#673AB7]" />
                    <span>Profile Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#E53945] hover:bg-red-50 font-medium transition-colors cursor-pointer"
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
            className="hidden sm:inline-flex text-xs font-semibold px-4 py-1.5 rounded-xl bg-[#673AB7] text-white hover:bg-[#512DA8] shadow-xs transition-colors"
          >
            Login
          </Link>
        )}

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="md:hidden p-2 rounded-xl text-[#64748B] hover:text-[#111111] hover:bg-[#F1F9FC] transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-[#111111]" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown: Only Gate Guard, Resident Portal, Service Partner */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[#FFFFFF] border-b border-[#E6F1F5] shadow-lg p-4 space-y-2 animate-fade-in z-50">
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
                      ? 'bg-[#F1F9FC] text-[#673AB7]'
                      : 'text-[#111111] hover:bg-[#F1F9FC]'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {!user && (
            <div className="pt-2 border-t border-[#E6F1F5]">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold flex items-center justify-center hover:bg-[#512DA8] transition-colors"
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
