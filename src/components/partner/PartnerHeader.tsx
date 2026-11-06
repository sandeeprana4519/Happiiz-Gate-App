/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Power, 
  Wrench, 
  Star, 
  Bell, 
  User, 
  LogOut 
} from 'lucide-react';
import { ServicePartnerProfile } from '../../types/servicePartner';

interface PartnerHeaderProps {
  profile: ServicePartnerProfile;
  onToggleOnline: (isOnline: boolean) => void;
  onLogout: () => void;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({
  profile,
  onToggleOnline,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E6F1F5] px-4 sm:px-6 py-3 select-none">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Left: Avatar & Business Name */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={profile.photoUrl}
              alt={profile.businessName}
              className="w-11 h-11 rounded-2xl object-cover border border-[#E6F1F5] shadow-xs"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                profile.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
              title={profile.isOnline ? 'Online for Bookings' : 'Offline'}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black text-[#111111] truncate max-w-[170px] sm:max-w-[220px]">
                {profile.businessName}
              </h1>
              <span title="Verified Partner">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#A9B0B8] mt-0.5">
              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                <Star className="w-3 h-3 fill-amber-500" />
                {profile.rating} ({profile.totalReviews})
              </span>
              <span>·</span>
              <span className="font-semibold text-slate-700">{profile.contactPersonName}</span>
            </div>
          </div>
        </div>

        {/* Right: Online / Offline Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleOnline(!profile.isOnline)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              profile.isOnline
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Power className={`w-3.5 h-3.5 ${profile.isOnline ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{profile.isOnline ? 'Online' : 'Offline'}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
