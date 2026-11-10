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
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
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
  Trash2,
  X,
  ArrowRight,
  Building2,
  AlertCircle,
  Check,
  Search,
  Filter,
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
  // Navigation tabs for the 3 distinct color-coded sections
  const [activeSubTab, setActiveSubTab] = useState<'ASSIGNED' | 'PLANS' | 'ASSIGN'>('ASSIGNED');

  // Search & Filter state for Active Subscriptions
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'EXPIRED'>('ALL');

  // Modal States
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalMode, setPlanModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);

  // Assign Plan Form State (for both in-tab and modal view)
  const [assignSocietyId, setAssignSocietyId] = useState(societies[0]?.id || '');
  const [assignPlanId, setAssignPlanId] = useState(plans[0]?.id || '');
  const [assignDurationMonths, setAssignDurationMonths] = useState(12);

  // Plan Form State (Create / Edit)
  const [planFormData, setPlanFormData] = useState<{
    name: string;
    price: number;
    billingCycle: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
    maxResidents: number;
    maxGuards: number;
    maxGates: number;
    maxAdmins: number;
    trialDays: number;
    status: 'ACTIVE' | 'INACTIVE';
    description: string;
    features: string[];
  }>({
    name: '',
    price: 9999,
    billingCycle: 'Monthly',
    maxResidents: 300,
    maxGuards: 8,
    maxGates: 3,
    maxAdmins: 4,
    trialDays: 14,
    status: 'ACTIVE',
    description: '',
    features: [
      'Multi-Gate ANPR Camera Sentinel',
      'Automated WhatsApp Visitor Passes',
      'Emergency SOS Broadcast Center',
      'Resident Maintenance Dues Portal',
    ],
  });

  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Open Create Plan Modal
  const openCreatePlanModal = () => {
    setPlanModalMode('CREATE');
    setEditingPlanId(null);
    setPlanFormData({
      name: '',
      price: 12999,
      billingCycle: 'Monthly',
      maxResidents: 500,
      maxGuards: 10,
      maxGates: 4,
      maxAdmins: 5,
      trialDays: 14,
      status: 'ACTIVE',
      description: 'Full-featured enterprise gate access and amenities management package',
      features: [
        'Multi-Gate ANPR Camera Sentinel',
        'Automated WhatsApp Visitor Passes',
        'Emergency SOS Broadcast Center',
        'Resident Maintenance Dues Portal',
        'Facility & Clubhouse Reservations',
      ],
    });
    setNewFeatureInput('');
    setFormError('');
    setShowPlanModal(true);
  };

  // Open Edit Plan Modal
  const openEditPlanModal = (plan: SubscriptionPlan) => {
    setPlanModalMode('EDIT');
    setEditingPlanId(plan.id);
    setPlanFormData({
      name: plan.name,
      price: plan.price,
      billingCycle: plan.billingCycle,
      maxResidents: plan.maxResidents,
      maxGuards: plan.maxGuards,
      maxGates: plan.maxGates,
      maxAdmins: plan.maxAdmins,
      trialDays: plan.trialDays || 14,
      status: plan.status,
      description: plan.description || '',
      features: [...plan.features],
    });
    setNewFeatureInput('');
    setFormError('');
    setShowPlanModal(true);
  };

  // Add Feature Chip
  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    if (planFormData.features.includes(newFeatureInput.trim())) return;
    setPlanFormData((prev) => ({
      ...prev,
      features: [...prev.features, newFeatureInput.trim()],
    }));
    setNewFeatureInput('');
  };

  // Remove Feature Chip
  const handleRemoveFeature = (feat: string) => {
    setPlanFormData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== feat),
    }));
  };

  // Save (Create / Update) Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormData.name.trim()) {
      setFormError('Plan Name is required.');
      return;
    }
    if (planFormData.price < 0) {
      setFormError('Price must be a valid positive amount.');
      return;
    }
    if (planFormData.features.length === 0) {
      setFormError('Please add at least one feature or capability.');
      return;
    }

    setLoading(true);
    setFormError('');
    try {
      if (planModalMode === 'CREATE') {
        await createSubscriptionPlan({
          name: planFormData.name.trim(),
          price: Number(planFormData.price),
          billingCycle: planFormData.billingCycle,
          maxResidents: Number(planFormData.maxResidents),
          maxGuards: Number(planFormData.maxGuards),
          maxGates: Number(planFormData.maxGates),
          maxAdmins: Number(planFormData.maxAdmins),
          trialDays: Number(planFormData.trialDays),
          status: planFormData.status,
          description: planFormData.description.trim(),
          features: planFormData.features,
        });
      } else if (editingPlanId) {
        await updateSubscriptionPlan(editingPlanId, {
          name: planFormData.name.trim(),
          price: Number(planFormData.price),
          billingCycle: planFormData.billingCycle,
          maxResidents: Number(planFormData.maxResidents),
          maxGuards: Number(planFormData.maxGuards),
          maxGates: Number(planFormData.maxGates),
          maxAdmins: Number(planFormData.maxAdmins),
          trialDays: Number(planFormData.trialDays),
          status: planFormData.status,
          description: planFormData.description.trim(),
          features: planFormData.features,
        });
      }
      setShowPlanModal(false);
      await onRefresh();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save subscription tier.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Delete Plan
  const handleDeletePlanConfirm = async () => {
    if (!planToDelete) return;
    setLoading(true);
    try {
      await deleteSubscriptionPlan(planToDelete.id);
      setShowDeleteModal(false);
      setPlanToDelete(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Assign Plan Submit
  const handleAssignPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const socId = assignSocietyId || societies[0]?.id;
    const pId = assignPlanId || plans[0]?.id;
    if (!socId || !pId) return;

    setLoading(true);
    try {
      await assignSubscriptionToSociety(socId, pId, assignDurationMonths);
      await onRefresh();
      setActiveSubTab('ASSIGNED');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter Active Society Subscriptions
  const filteredSubs = societySubscriptions.filter((sub) => {
    const matchesSearch =
      sub.societyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && sub.status === 'ACTIVE') ||
      (statusFilter === 'TRIAL' && sub.status === 'TRIAL') ||
      (statusFilter === 'EXPIRED' && (sub.status === 'EXPIRED' || sub.status === 'PENDING_RENEWAL'));
    return matchesSearch && matchesStatus;
  });

  // Calculate selected society and plan for the Assign UI preview
  const currentAssignSoc = societies.find((s) => s.id === (assignSocietyId || societies[0]?.id));
  const currentAssignPlan = plans.find((p) => p.id === (assignPlanId || plans[0]?.id));
  const calculatedTotal = (currentAssignPlan?.price || 0) * (assignDurationMonths || 12);

  return (
    <div className="space-y-6">
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Subscription & Licensing Management
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            Configure multi-tenant licensing packages, tenant renewals, and gate security quotas
          </p>
        </div>

        {/* 3 Distinct Navigation Modules */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Active Society Subscriptions - Emerald/Green Reassuring Accent */}
          <button
            type="button"
            onClick={() => setActiveSubTab('ASSIGNED')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeSubTab === 'ASSIGNED'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Active Subscriptions ({societySubscriptions.length})</span>
          </button>

          {/* 2. Subscription Tiers / Plans - Indigo/Violet Modern Primary Accent */}
          <button
            type="button"
            onClick={() => setActiveSubTab('PLANS')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeSubTab === 'PLANS'
                ? 'bg-[#673AB7] text-white border-[#673AB7] shadow-sm'
                : 'bg-white hover:bg-purple-50 text-[#673AB7] border-purple-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Subscription Tiers ({plans.length})</span>
          </button>

          {/* 3. Assign / Upgrade Plan - Action-Oriented Blue Accent */}
          <button
            type="button"
            onClick={() => {
              if (societies.length > 0 && !assignSocietyId) setAssignSocietyId(societies[0].id);
              if (plans.length > 0 && !assignPlanId) setAssignPlanId(plans[0].id);
              setActiveSubTab('ASSIGN');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeSubTab === 'ASSIGN'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Assign / Upgrade Plan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ACTIVE SOCIETY SUBSCRIPTIONS (Reassuring Emerald/Green Theme) */}
      {/* ========================================================================= */}
      {activeSubTab === 'ASSIGNED' && (
        <div className="space-y-4 animate-fade-in">
          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                Active Tenant Licenses
              </span>
              <div className="text-2xl font-black text-emerald-950">
                {societySubscriptions.filter((s) => s.status === 'ACTIVE').length}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium inline-flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fully Operational
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Trial / Evaluation
              </span>
              <div className="text-2xl font-black text-[#673AB7]">
                {societySubscriptions.filter((s) => s.status === 'TRIAL').length}
              </div>
              <span className="text-[11px] text-gray-400 font-medium">SaaS Evaluation Tenants</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Renewals Due Soon
              </span>
              <div className="text-2xl font-black text-amber-600">
                {societySubscriptions.filter((s) => s.status === 'PENDING_RENEWAL' || s.status === 'EXPIRED').length}
              </div>
              <span className="text-[11px] text-amber-600 font-medium">Pending or Overdue</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Total Subscription Value
              </span>
              <div className="text-2xl font-black text-gray-900">
                ₹{societySubscriptions.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Cumulative Active Billing</span>
            </div>
          </div>

          {/* Search and Status Filters */}
          <div className="p-3 bg-white rounded-2xl border border-emerald-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search society or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-emerald-100 bg-emerald-50/20 text-xs text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 self-stretch sm:self-auto">
              {(['ALL', 'ACTIVE', 'TRIAL', 'EXPIRED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  {st === 'ALL' ? 'All Statuses' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-2xl bg-white border border-emerald-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-emerald-100 bg-emerald-50/40 text-emerald-900 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-[28%]">Society / Tenant</th>
                    <th className="py-3 px-4 w-[20%]">Plan & Tier</th>
                    <th className="py-3 px-4 w-[14%]">Billing Cycle</th>
                    <th className="py-3 px-4 w-[16%]">Validity Period</th>
                    <th className="py-3 px-4 w-[12%] text-center">License Status</th>
                    <th className="py-3 px-4 w-[10%] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                        No active subscriptions found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-gray-900 text-xs flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{sub.societyName}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5 pl-6 font-mono">
                            Sub ID: {sub.id}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {sub.planName}
                          </span>
                          <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                            Paid: <strong className="text-gray-800 font-mono">₹{sub.amountPaid.toLocaleString()}</strong>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-700">
                          {sub.billingCycle}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-gray-900 text-[11px] font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Expires: {new Date(sub.endDate).toLocaleDateString()}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Started: {new Date(sub.startDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : sub.status === 'TRIAL'
                                ? 'bg-purple-50 text-[#673AB7] border border-purple-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                sub.status === 'ACTIVE'
                                  ? 'bg-emerald-600'
                                  : sub.status === 'TRIAL'
                                  ? 'bg-[#673AB7]'
                                  : 'bg-amber-600'
                              }`}
                            />
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setAssignSocietyId(sub.societyId);
                              setAssignPlanId(sub.planId);
                              setActiveSubTab('ASSIGN');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition cursor-pointer shadow-2xs"
                          >
                            <span>Renew / Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: SUBSCRIPTION TIERS / PLANS (Modern Primary/Indigo Theme) */}
      {/* ========================================================================= */}
      {activeSubTab === 'PLANS' && (
        <div className="space-y-5 animate-fade-in">
          {/* Header Action Bar */}
          <div className="p-4 bg-white rounded-2xl border border-purple-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                SaaS Subscription Tiers & Feature Matrix
              </h3>
              <p className="text-xs text-gray-500">
                Define community pricing tiers, gate access quotas, and hardware integration licenses
              </p>
            </div>

            <button
              type="button"
              onClick={openCreatePlanModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl bg-white border border-purple-200/80 shadow-2xs hover:shadow-md hover:border-[#673AB7] transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Plan Header */}
                <div className="p-5 pb-3 border-b border-purple-100/60 bg-gradient-to-b from-purple-50/40 to-transparent">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-[#673AB7]">
                      {plan.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        plan.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-gray-900">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                  )}

                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-2xl font-black text-[#673AB7]">₹{plan.price.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 font-semibold">/ {plan.billingCycle}</span>
                  </div>
                </div>

                {/* Quota Specifications */}
                <div className="p-5 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                      <span className="text-[10px] text-gray-500 block">Flats / Units</span>
                      <strong className="text-xs text-gray-900">{plan.maxResidents} Units</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                      <span className="text-[10px] text-gray-500 block">Security Gates</span>
                      <strong className="text-xs text-gray-900">{plan.maxGates} Gates</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                      <span className="text-[10px] text-gray-500 block">Guard Sentinels</span>
                      <strong className="text-xs text-gray-900">{plan.maxGuards} Guards</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                      <span className="text-[10px] text-gray-500 block">Admin Seats</span>
                      <strong className="text-xs text-gray-900">{plan.maxAdmins} Seats</strong>
                    </div>
                  </div>

                  {/* Included Features List */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Included Capabilities ({plan.features.length})
                    </span>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {plan.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-xs text-gray-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Plan Card Actions */}
                <div className="p-4 pt-3 bg-purple-50/30 border-t border-purple-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditPlanModal(plan)}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-[#673AB7] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlanToDelete(plan);
                      setShowDeleteModal(true);
                    }}
                    className="p-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 transition cursor-pointer shadow-2xs"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignPlanId(plan.id);
                      if (societies.length > 0 && !assignSocietyId) setAssignSocietyId(societies[0].id);
                      setActiveSubTab('ASSIGN');
                    }}
                    className="p-1.5 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white transition cursor-pointer shadow-2xs"
                    title="Assign This Plan to a Society"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ASSIGN / UPGRADE PLAN (Action-Oriented Blue/Cyan Theme) */}
      {/* ========================================================================= */}
      {activeSubTab === 'ASSIGN' && (
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-md overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Assign or Upgrade Society Subscription
                  </h3>
                  <p className="text-xs text-blue-100">
                    Provision new SaaS licensing, extend validity duration, and configure gate quotas
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAssignPlanSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Target Society */}
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1.5">
                    Target Society / Community *
                  </label>
                  <select
                    value={assignSocietyId}
                    onChange={(e) => setAssignSocietyId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/20 text-xs font-semibold text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    required
                  >
                    {societies.map((soc) => (
                      <option key={soc.id} value={soc.id}>
                        {soc.societyName} ({soc.city}) — {soc.societyCode}
                      </option>
                    ))}
                  </select>
                  {currentAssignSoc && (
                    <div className="text-[11px] text-gray-500 mt-1 pl-1">
                      Currently: {currentAssignSoc.totalFlats || 100} Flats • {currentAssignSoc.totalGates || 2} Gates
                    </div>
                  )}
                </div>

                {/* 2. Target Plan */}
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1.5">
                    Subscription Tier / Plan *
                  </label>
                  <select
                    value={assignPlanId}
                    onChange={(e) => setAssignPlanId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/20 text-xs font-semibold text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    required
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.price.toLocaleString()} / {p.billingCycle}
                      </option>
                    ))}
                  </select>
                  {currentAssignPlan && (
                    <div className="text-[11px] text-blue-700 font-semibold mt-1 pl-1">
                      Includes: Up to {currentAssignPlan.maxResidents} flats • {currentAssignPlan.maxGates} gates
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Duration Selector */}
              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1.5">
                  Subscription Duration & Term
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: '1 Month', val: 1 },
                    { label: '3 Months', val: 3 },
                    { label: '6 Months', val: 6 },
                    { label: '1 Year (12 Mo)', val: 12 },
                    { label: '2 Years (24 Mo)', val: 24 },
                  ].map((dur) => (
                    <button
                      key={dur.val}
                      type="button"
                      onClick={() => setAssignDurationMonths(dur.val)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                        assignDurationMonths === dur.val
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-blue-200 bg-white text-gray-700 hover:bg-blue-50'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary / Calculation Box */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                  Licensing & Billing Summary
                </span>
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <span>Selected Tenant:</span>
                  <strong className="text-gray-900">{currentAssignSoc?.societyName || 'Selected Society'}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <span>Selected Tier:</span>
                  <strong className="text-blue-700">{currentAssignPlan?.name || 'Selected Plan'}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <span>Duration Term:</span>
                  <strong className="text-gray-900">{assignDurationMonths} Months</strong>
                </div>
                <div className="pt-2 border-t border-blue-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-900">Total License Value:</span>
                  <span className="text-lg font-black text-blue-900 font-mono">
                    ₹{calculatedTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('ASSIGNED')}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Activating License...' : 'Confirm & Activate Subscription'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT SUBSCRIPTION PLAN (Full CRUD) */}
      {/* ========================================================================= */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl border border-purple-200 shadow-2xl w-full max-w-xl my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-bold">
                  {planModalMode === 'CREATE' ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">
                    {planModalMode === 'CREATE' ? 'Create New Subscription Tier' : `Edit Plan: ${planFormData.name}`}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Configure tier pricing, quotas, limits, and included capabilities
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlan} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Plan Name & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Gated Community"
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Status
                  </label>
                  <select
                    value={planFormData.status}
                    onChange={(e) =>
                      setPlanFormData({ ...planFormData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Price, Billing Cycle & Trial Days */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData({ ...planFormData, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-mono font-bold text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={planFormData.billingCycle}
                    onChange={(e) =>
                      setPlanFormData({
                        ...planFormData,
                        billingCycle: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Trial Period (Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planFormData.trialDays}
                    onChange={(e) => setPlanFormData({ ...planFormData, trialDays: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Quota Limits (Residents, Gates, Guards, Admins) */}
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 space-y-2">
                <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                  Tenant Quota & Capacity Limits
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Max Flats</label>
                    <input
                      type="number"
                      min={1}
                      value={planFormData.maxResidents}
                      onChange={(e) =>
                        setPlanFormData({ ...planFormData, maxResidents: Number(e.target.value) })
                      }
                      className="w-full p-2 rounded-lg border border-purple-200 bg-white text-xs font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Security Gates</label>
                    <input
                      type="number"
                      min={1}
                      value={planFormData.maxGates}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxGates: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-purple-200 bg-white text-xs font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Active Guards</label>
                    <input
                      type="number"
                      min={1}
                      value={planFormData.maxGuards}
                      onChange={(e) =>
                        setPlanFormData({ ...planFormData, maxGuards: Number(e.target.value) })
                      }
                      className="w-full p-2 rounded-lg border border-purple-200 bg-white text-xs font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Admin Seats</label>
                    <input
                      type="number"
                      min={1}
                      value={planFormData.maxAdmins}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxAdmins: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-purple-200 bg-white text-xs font-semibold text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Plan Description */}
              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1">
                  Plan Description / Marketing Summary
                </label>
                <textarea
                  rows={2}
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  placeholder="Short description highlighting who this tier is for..."
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                />
              </div>

              {/* Row 5: Dynamic Features List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-900 block">
                  Included Features & Capabilities ({planFormData.features.length})
                </label>

                {/* Feature Input with Add Button */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a new feature (e.g. 24/7 Siren SOS Broadcast)..."
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 p-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#673AB7] text-xs font-bold transition cursor-pointer"
                  >
                    Add Feature
                  </button>
                </div>

                {/* Feature Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {planFormData.features.map((feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-[#673AB7] border border-purple-200"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feat)}
                        className="text-gray-400 hover:text-red-500 cursor-pointer ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {loading ? 'Saving...' : planModalMode === 'CREATE' ? 'Create Plan' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {showDeleteModal && planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">
                Delete Subscription Tier?
              </h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete <strong className="text-gray-900">{planToDelete.name}</strong>?
                This plan will no longer be available for tenant assignment.
              </p>
            </div>

            <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 text-xs text-red-800 space-y-1">
              <div>Plan ID: <span className="font-mono">{planToDelete.id}</span></div>
              <div>Price: ₹{planToDelete.price.toLocaleString()} / {planToDelete.billingCycle}</div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setPlanToDelete(null);
                }}
                className="w-1/2 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlanConfirm}
                disabled={loading}
                className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {loading ? 'Deleting...' : 'Delete Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
