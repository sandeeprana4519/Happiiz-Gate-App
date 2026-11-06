import React, { useState } from 'react';
import { FeatureFlagItem } from '../../types/admin';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Shield,
  Smartphone,
  CreditCard,
  Bell,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { updateFeatureFlag } from '../../services/firebase/superadmin.service';

interface FeatureFlagsSectionProps {
  flags: FeatureFlagItem[];
  onRefresh: () => void;
}

export const FeatureFlagsSection: React.FC<FeatureFlagsSectionProps> = ({
  flags,
  onRefresh,
}) => {
  const [updatingFlagId, setUpdatingFlagId] = useState<string | null>(null);

  const handleToggle = async (flag: FeatureFlagItem) => {
    setUpdatingFlagId(flag.id);
    try {
      await updateFeatureFlag(flag.id, { globallyEnabled: !flag.globallyEnabled });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingFlagId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Central Feature Management & Module Control
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            Dynamically toggle tenant features, SaaS plan gating, and application modules without service downtime
          </p>
        </div>
      </div>

      {/* Safety Info Callout */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
        <Layers className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Non-Destructive Zero-Loss Guarantee</strong>
          Toggling a module OFF disables its UI endpoints and mobile client routes across tenant instances, while strictly preserving all underlying database collections, historical logs, and financial records.
        </div>
      </div>

      {/* Feature Flags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flags.map((flag) => {
          const isBusy = updatingFlagId === flag.id;
          return (
            <div
              key={flag.id}
              className={`p-5 rounded-2xl border transition-all shadow-xs ${
                flag.globallyEnabled
                  ? 'bg-white border-[#E6F1F5] hover:border-[#673AB7]/30'
                  : 'bg-gray-50/70 border-gray-200 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-[#111111]">{flag.name}</h3>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F1F9FC] text-[#673AB7] border border-[#E6F1F5]">
                      {flag.moduleKey}
                    </span>
                  </div>
                  <p className="text-xs text-[#A9B0B8] leading-relaxed">{flag.description}</p>
                </div>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleToggle(flag)}
                  className="cursor-pointer shrink-0"
                  title={flag.globallyEnabled ? 'Click to Disable' : 'Click to Enable'}
                >
                  {flag.globallyEnabled ? (
                    <ToggleRight className="w-8 h-8 text-[#673AB7] hover:text-[#5E35B1] transition" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400 hover:text-gray-500 transition" />
                  )}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E6F1F5] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-[11px]">Minimum Tier:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {flag.minPlanRequired}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-semibold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      flag.globallyEnabled ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className={flag.globallyEnabled ? 'text-emerald-700' : 'text-gray-500'}>
                    {flag.globallyEnabled ? 'Globally Active' : 'Suspended'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
