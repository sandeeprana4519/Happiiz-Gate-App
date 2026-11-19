/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SuperAdminStats, AuditLog } from '../../types/admin';
import {
  Building2,
  Users,
  ShieldCheck,
  UserCog,
  Wrench,
  CreditCard,
  DollarSign,
  Headset,
  TrendingUp,
  FileCheck2,
  Clock,
  ShieldAlert,
  Briefcase,
  Siren,
  Activity,
  Eye,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface OverviewSectionProps {
  stats: SuperAdminStats;
  recentAuditLogs: AuditLog[];
  onNavigateTab: (tab: any) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  stats,
  recentAuditLogs,
  onNavigateTab,
}) => {
  const activeEmergencyCount = stats.activeEmergencyAlerts ?? stats.activeEmergencies ?? 0;

  // Subscription Pie Data
  const subscriptionData = [
    { name: 'Active Paid', value: stats.activeSubscriptions || 2, color: '#10B981' },
    { name: 'Evaluation Trial', value: stats.trialSubscriptions || 1, color: '#6366F1' },
    { name: 'Expired / Pending', value: stats.expiredSubscriptions || 0, color: '#F59E0B' },
  ];

  // Revenue Streams Data
  const revenueStreams = [
    { name: 'Enterprise SaaS', amount: Math.round(stats.monthlyRevenue * 0.7), barColor: 'bg-indigo-600', textColor: 'text-indigo-700' },
    { name: 'Starter Gate Plans', amount: Math.round(stats.monthlyRevenue * 0.2), barColor: 'bg-emerald-500', textColor: 'text-emerald-700' },
    { name: 'Vendor Commission', amount: Math.round(stats.monthlyRevenue * 0.1), barColor: 'bg-cyan-500', textColor: 'text-cyan-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Command Hero Strip */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white p-5 sm:p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Platform Command Overview
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Multi-Tenant SaaS & Security Operations
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/85 max-w-2xl">
              Monitor active communities, corporate tenants, recurring revenue, and live SOS incidents across the Happiiz Gate network.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('societies')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition cursor-pointer shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Societies</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('services')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs transition cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-300" />
              <span>Service Catalog</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs transition cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Analytics & Reports</span>
            </button>
          </div>
        </div>

        {/* Hero KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/15">
          <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-indigo-200">Active Societies</div>
            <div className="text-lg sm:text-xl font-extrabold text-white tabular-nums mt-0.5">
              {stats.activeSocieties} <span className="text-xs font-semibold text-indigo-200">/ {stats.totalSocieties}</span>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-indigo-200">Monthly MRR</div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-300 tabular-nums mt-0.5">
              ₹{(stats.monthlyRevenue || 0).toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-indigo-200">Platform Users</div>
            <div className="text-lg sm:text-xl font-extrabold text-sky-200 tabular-nums mt-0.5">
              {stats.totalPlatformUsers ?? 16}
            </div>
          </div>
          <div className={`rounded-xl px-3.5 py-2.5 ${activeEmergencyCount > 0 ? 'bg-rose-500/25 border border-rose-300/40' : 'bg-white/10'}`}>
            <div className="text-[11px] font-medium text-indigo-200">Active SOS Alerts</div>
            <div className={`text-lg sm:text-xl font-extrabold tabular-nums mt-0.5 ${activeEmergencyCount > 0 ? 'text-rose-200' : 'text-emerald-300'}`}>
              {activeEmergencyCount}
            </div>
          </div>
        </div>
      </div>

      {/* 12 Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
        {/* Total Societies */}
        <div
          onClick={() => onNavigateTab('societies')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md tabular-nums">
              +{stats.activeSocieties} Live
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.totalSocieties}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Total Societies</p>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => onNavigateTab('approvals')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </span>
            {stats.pendingSocieties > 0 && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                Action Req
              </span>
            )}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.pendingSocieties}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Pending Society Apps</p>
        </div>

        {/* Total Residents */}
        <div
          onClick={() => onNavigateTab('residents')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-violet-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
              Units
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.totalResidents}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Total Residents</p>
        </div>

        {/* Total Guards */}
        <div
          onClick={() => onNavigateTab('guards')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              Sentinels
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.totalSecurityGuards}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Security Guards</p>
        </div>

        {/* Total Society Admins */}
        <div
          onClick={() => onNavigateTab('society-admins')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <UserCog className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              Committee
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.totalSocietyAdmins}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Society Admins</p>
        </div>

        {/* Service Partners */}
        <div
          onClick={() => onNavigateTab('partners')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Wrench className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md tabular-nums">
              {stats.pendingServicePartners} KYC
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.totalServicePartners}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Service Partners</p>
        </div>

        {/* Active Subscriptions */}
        <div
          onClick={() => onNavigateTab('subscriptions')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md tabular-nums">
              {stats.trialSubscriptions} Trials
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.activeSubscriptions}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Active Subscriptions</p>
        </div>

        {/* Monthly Revenue */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              MRR
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            ₹{(stats.monthlyRevenue || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Monthly Revenue</p>
        </div>

        {/* Yearly ARR Projections */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              ARR Run-Rate
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            ₹{(stats.yearlyRevenue || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Annualized Run Rate</p>
        </div>

        {/* Support Tickets */}
        <div
          onClick={() => onNavigateTab('support')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <Headset className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
              Helpdesk
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.pendingSupportTickets}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Pending Support Tickets</p>
        </div>

        {/* Suspended Communities */}
        <div
          onClick={() => onNavigateTab('societies')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
              Locked
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.suspendedSocieties}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Suspended Societies</p>
        </div>

        {/* Expired Plans */}
        <div
          onClick={() => onNavigateTab('subscriptions')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              Overdue
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.expiredSubscriptions}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Expired Subscriptions</p>
        </div>
      </div>

      {/* Master Operational KPIs Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Managed Companies */}
        <div
          onClick={() => onNavigateTab('companies')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Briefcase className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              Corporate
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.totalCompanies ?? 4}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Managed Companies</p>
        </div>

        {/* Onboarding Pipeline */}
        <div
          onClick={() => onNavigateTab('onboarding')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              Pipeline
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.pendingOnboardingCases ?? 2}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Pending Onboarding</p>
        </div>

        {/* Global Directory */}
        <div
          onClick={() => onNavigateTab('global-users')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              Global
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.totalPlatformUsers ?? 16}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">All Platform Users</p>
        </div>

        {/* Gate Visitors Today */}
        <div
          onClick={() => onNavigateTab('guards')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-cyan-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Eye className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md">
              Today
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.visitorsToday ?? 142}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Gate Visitors Today</p>
        </div>

        {/* Active Emergencies */}
        <div
          onClick={() => onNavigateTab('emergencies')}
          className={`p-4 rounded-2xl border shadow-xs transition-all cursor-pointer group ${
            activeEmergencyCount > 0
              ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span
              className={`p-2 rounded-xl ${
                activeEmergencyCount > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Siren className="w-4 h-4" />
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                activeEmergencyCount > 0
                  ? 'text-rose-800 bg-rose-200/80 font-extrabold'
                  : 'text-emerald-700 bg-emerald-50'
              }`}
            >
              {activeEmergencyCount > 0 ? 'CRITICAL' : 'Clear'}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {activeEmergencyCount}
          </div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Active SOS Emergencies</p>
        </div>

        {/* System Health */}
        <div
          onClick={() => onNavigateTab('system-health')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Activity className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md tabular-nums">
              99.98%
            </span>
          </div>
          <div className="text-xl font-extrabold text-emerald-700">HEALTHY</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Platform Node Status</p>
        </div>
      </div>

      {/* Analytics Section A & B: Society & User Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Society & Monthly Revenue Growth */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Platform Scale & Monthly SaaS Revenue
              </h3>
              <p className="text-xs text-slate-500">Monthly recurring subscription metrics (₹)</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Live Telemetry
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.growthChartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B. User Growth by Role */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                User Growth by Network Role
              </h3>
              <p className="text-xs text-slate-500">
                Active residents, security sentinels & field guards
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Active Roster
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.growthChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="residents" name="Residents (Units)" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="guards" name="Security Sentinels" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analytics Section C, D & E */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* C. Subscription Status Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Subscription Health</h3>
          <p className="text-xs text-slate-500 mb-4">Community tenant license allocation</p>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-100">
            {subscriptionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-slate-900 tabular-nums">{item.value} societies</span>
              </div>
            ))}
          </div>
        </div>

        {/* D. Revenue Channels Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Revenue Channels</h3>
          <p className="text-xs text-slate-500 mb-4">Direct subscriptions & partner fees</p>
          <div className="space-y-3.5">
            {revenueStreams.map((stream) => {
              const pct = stats.monthlyRevenue > 0 ? Math.round((stream.amount / stats.monthlyRevenue) * 100) : 33;
              return (
                <div key={stream.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{stream.name}</span>
                    <span className={`font-bold font-mono tabular-nums ${stream.textColor}`}>
                      ₹{stream.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${stream.barColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 text-right tabular-nums">{pct}% of total billing</div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Next Payout / Settlement</span>
              <span className="font-bold text-slate-900">Nov 15, 2026</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Gateway Status</span>
              <span className="font-bold text-emerald-700 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational
              </span>
            </div>
          </div>
        </div>

        {/* E. Recent Administrative Activities */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent Activity Feed</h3>
              <p className="text-xs text-slate-500">Audit operations across societies</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('audit-logs')}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-800 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-72 pr-1">
            {recentAuditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-1 hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 truncate">{log.action}</span>
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700 font-medium truncate">{log.reason}</p>
                <div className="text-[11px] text-slate-500">
                  {log.actorName} · <span className="font-mono">{log.actorRole}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
