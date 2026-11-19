/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Home, Calendar, Users, Wrench, Shield, AlertTriangle } from 'lucide-react';
import { SecurityShieldIllustration3D } from '../illustrations/SecurityShieldIllustration3D';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export type ResidentTab = 'home' | 'activity' | 'social' | 'service';

interface ResidentBottomNavProps {
  activeTab: ResidentTab;
  onTabChange: (tab: ResidentTab) => void;
  onSecurityClick?: () => void;
}

export const ResidentBottomNav: React.FC<ResidentBottomNavProps> = ({
  activeTab,
  onTabChange,
  onSecurityClick,
}) => {
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const tabs: { id: ResidentTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'activity', label: 'Activity', icon: Calendar },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'service', label: 'Service', icon: Wrench },
  ];

  const handleSecurity = () => {
    if (onSecurityClick) {
      onSecurityClick();
    } else {
      setShowSecurityModal(true);
    }
  };

  return (
    <>
      <nav
        aria-label="Resident Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#050505] pb-safe select-none shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      >
        <div className="relative max-w-lg mx-auto h-16 flex items-center justify-between px-6">
          {/* 4 Tabs on Left/Center */}
          <div className="flex items-center gap-7 sm:gap-9">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  type="button"
                  className={`flex flex-col items-center justify-center min-w-[48px] py-1 transition-colors cursor-pointer ${
                    isActive ? 'text-[#FFFFFF]' : 'text-[#9DA3AD] hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  <span className={`text-[11px] tracking-tight mt-1 font-medium ${isActive ? 'text-white' : 'text-[#9DA3AD]'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Elevated Floating Circular Purple Security Button on Right */}
          <div className="absolute -top-5 right-5">
            <button
              onClick={handleSecurity}
              type="button"
              className="relative rounded-full focus:outline-none transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-[0_8px_20px_rgba(103,58,183,0.45)] ring-4 ring-white"
              title="Security & Emergency Access"
              aria-label="Security Access"
            >
              <SecurityShieldIllustration3D size={58} />
            </button>
          </div>
        </div>
      </nav>

      {/* Security & SOS Modal */}
      <Modal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        title="Security & Guard Intercom"
        description="Direct line to security post & emergency response"
        maxWidth="sm"
      >
        <div className="space-y-3.5">
          <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-[#111111]">Main Gate Intercom</p>
              <p className="text-xs text-[#A9B0B8]">Duty Guard: Ramesh Singh (Gate #1)</p>
            </div>
            <button
              onClick={() => alert('Dialing Gate Intercom extension #101...')}
              className="px-3.5 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
            >
              Call Guard
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-[#E53945]" />
              <p className="font-bold text-sm text-[#E53945]">Emergency SOS Alert</p>
            </div>
            <p className="text-xs text-[#64748B] mb-3">
              Broadcasts immediate emergency alert with flat location to all security posts and quick response team.
            </p>
            <button
              onClick={() => {
                setShowSecurityModal(false);
                alert('🚨 EMERGENCY SOS SENT: Security guards have been alerted with your location.');
              }}
              className="w-full py-2.5 rounded-xl bg-[#E53945] text-white font-bold text-xs hover:bg-red-700 transition-colors cursor-pointer"
            >
              Trigger Instant SOS
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
