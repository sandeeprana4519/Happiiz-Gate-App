/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SubscriptionPlan,
  SocietySubscription,
} from '../../types/admin';
import { Society } from '../../types/society';
import {
  saveSubscriptionPlan,
  assignSubscriptionToSociety,
} from '../../services/firebase/superadmin.service';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Edit2,
  X,
  ArrowRight,
} from 'lucide-react';

interface SubscriptionsSectionProps {
  plans: SubscriptionPlan[];
  societySubscriptions: SocietySubscription[];
  societies: Society[];
  onRefresh: () => Promise<void>;
}

export const SubscriptionsSection: React.FC<SubscriptionsSectionProps> = ({
  plans,
  societySubscriptions,
  societies,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PLANS' | 'ASSIGNED'>('ASSIGNED');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [durationMonths, setDurationMonths] = useState(12);
  const [loading, setLoading] = useState(false);

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSocietyId || !selectedPlanId) return;
    setLoading(true);
    try {
      await assignSubscriptionToSociety(selectedSocietyId, selectedPlanId, durationMonths);
      setShowAssignModal(false);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">SaaS Subscription & Plan Management</h2>
          <p className="text-xs text-[#A9B0B8]">
            Configure multi-tenant licensing tiers, renewal validity, and gate quotas
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Sub Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <button
              type="button"
              onClick={() => setActiveSubTab('ASSIGNED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'ASSIGNED' ? 'bg-[#673AB7] text-white shadow-xs' : 'text-[#111111]'
              }`}
            >
              Active Society Subscriptions
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('PLANS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'PLANS' ? 'bg-[#673AB7] text-white shadow-xs' : 'text-[#111111]'
              }`}
            >
              Subscription Tiers ({plans.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (societies.length > 0) setSelectedSocietyId(societies[0].id);
              if (plans.length > 0) setSelectedPlanId(plans[0].id);
              setShowAssignModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition-colors cursor-pointer shadow-xs"
          >
            Assign / Upgrade Plan
          </button>
        </div>
      </div>

      {activeSubTab === 'ASSIGNED' ? (
        /* Society Subscriptions Table */
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC]/60 text-[#A9B0B8] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Society Name</th>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Billing Cycle</th>
                  <th className="py-3 px-4">Validity End Date</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">License Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F1F5]">
                {societySubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F1F9FC]/40 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-[#111111]">
                      {sub.societyName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#673AB7]">
                      {sub.planName}
                    </td>
                    <td className="py-3.5 px-4 text-[#111111]">
                      {sub.billingCycle}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#111111]">
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                      ₹{sub.amountPaid.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : sub.status === 'TRIAL'
                            ? 'bg-purple-50 text-[#673AB7]'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : sub.status === 'TRIAL'
                              ? 'bg-[#673AB7]'
                              : 'bg-amber-500'
                          }`}
                        />
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSocietyId(sub.societyId);
                          setSelectedPlanId(sub.planId);
                          setShowAssignModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-[#E6F1F5] hover:bg-[#F1F9FC] text-xs font-bold text-[#673AB7] cursor-pointer"
                      >
                        Extend / Change
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Plans Configurator Cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#673AB7]/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-[#111111]">{plan.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    {plan.status}
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#111111]">₹{plan.price.toLocaleString()}</span>
                  <span className="text-xs text-[#A9B0B8]">/ {plan.billingCycle}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-1 text-xs font-medium text-[#111111]">
                  <div>Max Units: {plan.maxResidents} flats</div>
                  <div>Security Gates: {plan.maxGates} boom barriers</div>
                  <div>Guard Sentinels: {plan.maxGuards} roster limit</div>
                  <div>Admin Seats: {plan.maxAdmins} committee seats</div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-[#A9B0B8] font-bold uppercase tracking-wider block">
                    Included Capabilities:
                  </span>
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-[#111111]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  if (societies.length > 0) setSelectedSocietyId(societies[0].id);
                  setShowAssignModal(true);
                }}
                className="w-full py-2 rounded-xl bg-[#F1F9FC] hover:bg-[#673AB7] text-[#673AB7] hover:text-white text-xs font-bold transition-all cursor-pointer border border-[#E6F1F5]"
              >
                Assign This Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assign / Extend Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <form
            onSubmit={handleAssignPlan}
            className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E6F1F5] pb-3">
              <h3 className="text-sm font-extrabold text-[#111111]">Assign Society Subscription Plan</h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-[#A9B0B8] hover:text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Target Society *</label>
                <select
                  value={selectedSocietyId}
                  onChange={(e) => setSelectedSocietyId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
                >
                  {societies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.societyName} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Subscription Tier *</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price.toLocaleString()} / {p.billingCycle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Duration Validity</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value) || 12)}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months (Quarterly)</option>
                  <option value={6}>6 Months (Half-Yearly)</option>
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={24}>24 Months (2 Years)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-[#E6F1F5]">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="w-1/2 py-2 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#111111] hover:bg-[#F1F9FC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] cursor-pointer"
              >
                {loading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
