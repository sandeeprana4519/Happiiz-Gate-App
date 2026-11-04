/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MoreVertical, ShieldCheck, LogOut, RefreshCw, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GuardHeaderProps {
  gateName: string;
  onSelectGate?: (gate: string) => void;
}

export const GuardHeader: React.FC<GuardHeaderProps> = ({
  gateName,
  onSelectGate,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const gates = [
    'Gate A, West Corner',
    'Gate B, East Main',
    'North Service Gate #3',
    'South Pedestrian Gate',
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-[#000000] text-white pt-3 pb-2 px-4 sm:px-6 select-none relative">
      <div className="flex items-center justify-between h-10 max-w-lg mx-auto">
        {/* Empty left spacer for perfect centering */}
        <div className="w-8 flex items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Terminal Online" />
        </div>

        {/* Centered Gate Name */}
        <div className="flex items-center justify-center">
          <h1 className="text-sm sm:text-base font-semibold text-white tracking-wide text-center">
            {gateName}
          </h1>
        </div>

        {/* Right: Three Dots Menu */}
        <div className="relative w-8 flex justify-end">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="p-1 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Gate Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-8 w-56 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-2xl p-3 z-50 text-xs text-[#111111] animate-fade-in">
                <div className="pb-2 mb-2 border-b border-[#E6F1F5]">
                  <p className="font-bold text-xs text-[#111111]">Switch Active Gate</p>
                  <p className="text-[10px] text-[#A9B0B8]">Terminal Station</p>
                </div>

                <div className="space-y-1 mb-2">
                  {gates.map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        onSelectGate?.(g);
                        setShowMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        gateName === g
                          ? 'bg-[#F1F9FC] text-[#673AB7] font-bold'
                          : 'text-[#111111] hover:bg-slate-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E6F1F5]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#E53945] hover:bg-red-50 font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Guard Handover / Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
