/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlatformSettings } from '../../types/admin';
import { updatePlatformSettings } from '../../services/firebase/superadmin.service';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Globe,
  Sliders,
  Power,
  ShieldCheck,
} from 'lucide-react';

interface SettingsSectionProps {
  initialSettings: PlatformSettings;
  onRefresh: () => Promise<void>;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  initialSettings,
  onRefresh,
}) => {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessNotice(null);
    try {
      await updatePlatformSettings(settings);
      setSuccessNotice('Platform parameters and registration policies successfully updated!');
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">Platform Global Configurations</h2>
          <p className="text-xs text-[#A9B0B8]">
            Configure multi-tenant gate policies, self-registration gates, and maintenance switches
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* A. General Settings */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-extrabold text-sm text-[#111111] pb-2 border-b border-[#E6F1F5]">
            <Globe className="w-4 h-4 text-[#673AB7]" />
            <span>A. Platform Branding & General Defaults</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={settings.general.platformName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, platformName: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Support Email</label>
              <input
                type="email"
                value={settings.general.supportEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, supportEmail: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Support Helpdesk Hotline</label>
              <input
                type="text"
                value={settings.general.supportPhone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, supportPhone: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Default Country</label>
              <input
                type="text"
                value={settings.general.defaultCountry}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, defaultCountry: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Default Currency</label>
              <input
                type="text"
                value={settings.general.defaultCurrency}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, defaultCurrency: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Platform Time Zone</label>
              <input
                type="text"
                value={settings.general.timeZone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, timeZone: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* B. Registration Settings */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-extrabold text-sm text-[#111111] pb-2 border-b border-[#E6F1F5]">
            <Sliders className="w-4 h-4 text-[#673AB7]" />
            <span>B. Network Registration Policies & Onboarding Gates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label className="p-3.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/40 flex items-center justify-between cursor-pointer hover:border-[#673AB7]/30">
              <div>
                <span className="font-bold text-[#111111] block">Allow Society Applications</span>
                <span className="text-[11px] text-[#A9B0B8]">
                  Permit new gated communities to apply through public onboarding
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.registration.allowSocietyApplications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    registration: { ...settings.registration, allowSocietyApplications: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-[#673AB7] cursor-pointer"
              />
            </label>

            <label className="p-3.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/40 flex items-center justify-between cursor-pointer hover:border-[#673AB7]/30">
              <div>
                <span className="font-bold text-[#111111] block">Allow Resident Self-Registration</span>
                <span className="text-[11px] text-[#A9B0B8]">
                  Permit flat owners and tenants to request wing access
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.registration.allowResidentRegistration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    registration: { ...settings.registration, allowResidentRegistration: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-[#673AB7] cursor-pointer"
              />
            </label>

            <label className="p-3.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/40 flex items-center justify-between cursor-pointer hover:border-[#673AB7]/30">
              <div>
                <span className="font-bold text-[#111111] block">Allow Guard Registration</span>
                <span className="text-[11px] text-[#A9B0B8]">
                  Permit deputed security sentinels to submit agency credentials
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.registration.allowGuardRegistration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    registration: { ...settings.registration, allowGuardRegistration: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-[#673AB7] cursor-pointer"
              />
            </label>

            <label className="p-3.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/40 flex items-center justify-between cursor-pointer hover:border-[#673AB7]/30">
              <div>
                <span className="font-bold text-[#111111] block">Allow Service Partner Registration</span>
                <span className="text-[11px] text-[#A9B0B8]">
                  Permit commercial contractors and daily help to apply
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.registration.allowServicePartnerRegistration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    registration: {
                      ...settings.registration,
                      allowServicePartnerRegistration: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 accent-[#673AB7] cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* C. Maintenance Settings */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-extrabold text-sm text-[#111111] pb-2 border-b border-[#E6F1F5]">
            <Power className="w-4 h-4 text-red-600" />
            <span>C. Maintenance Mode & Emergency Lock</span>
          </div>

          <div className="space-y-3">
            <label className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold text-red-900 block">Platform Maintenance Mode</span>
                <span className="text-[11px] text-red-700">
                  When enabled, non-emergency administrative operations display the maintenance advisory
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenance.isMaintenanceMode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maintenance: { ...settings.maintenance, isMaintenanceMode: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-red-600 cursor-pointer"
              />
            </label>

            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Maintenance Advisory Message</label>
              <textarea
                rows={2}
                value={settings.maintenance.maintenanceMessage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maintenance: { ...settings.maintenance, maintenanceMessage: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
