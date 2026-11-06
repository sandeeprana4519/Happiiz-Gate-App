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
  ArrowUpRight,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Siren,
  Activity,
  Eye,
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
  // Subscription Pie Data
  const subscriptionData = [
    { name: 'Active Paid', value: stats.activeSubscriptions || 2, color: '#10B981' },
    { name: 'Evaluation Trial', value: stats.trialSubscriptions || 1, color: '#673AB7' },
    { name: 'Expired/Pending', value: stats.expiredSubscriptions || 0, color: '#F59E0B' },
  ];

  // Revenue Streams Data
  const revenueStreams = [
    { name: 'Enterprise SaaS', amount: Math.round(stats.monthlyRevenue * 0.7) },
    { name: 'Starter Gate Plans', amount: Math.round(stats.monthlyRevenue * 0.2) },
    { name: 'Vendor Commission', amount: Math.round(stats.monthlyRevenue * 0.1) },
  ];

  return (
    <div className="space-y-6">
      {/* 12 Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {/* Total Societies */}
        <div
          onClick={() => onNavigateTab('societies')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[#F1F9FC] text-[#673AB7] group-hover:bg-[#673AB7] group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +{stats.activeSocieties} Live
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.totalSocieties}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Total Societies</p>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => onNavigateTab('approvals')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-amber-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </span>
            {stats.pendingSocieties > 0 && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded animate-pulse">
                Action Req
              </span>
            )}
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.pendingSocieties}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Pending Society Apps</p>
        </div>

        {/* Total Residents */}
        <div
          onClick={() => onNavigateTab('residents')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[#F1F9FC] text-[#673AB7] group-hover:bg-[#673AB7] group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-[#673AB7] bg-purple-50 px-1.5 py-0.5 rounded">
              Units
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.totalResidents}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Total Residents</p>
        </div>

        {/* Total Guards */}
        <div
          onClick={() => onNavigateTab('guards')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[#F1F9FC] text-[#673AB7] group-hover:bg-[#673AB7] group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Sentinels
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.totalSecurityGuards}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Security Guards</p>
        </div>

        {/* Total Society Admins */}
        <div
          onClick={() => onNavigateTab('society-admins')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[#F1F9FC] text-[#673AB7] group-hover:bg-[#673AB7] group-hover:text-white transition-colors">
              <UserCog className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-[#A9B0B8] bg-slate-50 px-1.5 py-0.5 rounded">
              Committee
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.totalSocietyAdmins}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Society Admins</p>
        </div>

        {/* Service Partners */}
        <div
          onClick={() => onNavigateTab('partners')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[#F1F9FC] text-[#673AB7] group-hover:bg-[#673AB7] group-hover:text-white transition-colors">
              <Wrench className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {stats.pendingServicePartners} KYC
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.totalServicePartners}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Service Partners</p>
        </div>

        {/* Active Subscriptions */}
        <div
          onClick={() => onNavigateTab('subscriptions')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {stats.trialSubscriptions} Trials
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.activeSubscriptions}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Active Subscriptions</p>
        </div>

        {/* Monthly Revenue */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-emerald-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              MRR
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">
            ₹{(stats.monthlyRevenue || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Monthly Revenue</p>
        </div>

        {/* Yearly ARR Projections */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-emerald-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[#F1F9FC] text-[#673AB7] group-hover:bg-[#673AB7] group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
              ARR Run-Rate
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">
            ₹{(stats.yearlyRevenue || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Annualized Run Rate</p>
        </div>

        {/* Support Tickets */}
        <div
          onClick={() => onNavigateTab('support')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-amber-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <Headset className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
              Helpdesk
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.pendingSupportTickets}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Pending Support Tickets</p>
        </div>

        {/* Suspended Communities */}
        <div
          onClick={() => onNavigateTab('societies')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-red-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
              Locked
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.suspendedSocieties}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Suspended Societies</p>
        </div>

        {/* Expired Plans */}
        <div
          onClick={() => onNavigateTab('subscriptions')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-amber-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              Overdue
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.expiredSubscriptions}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Expired Subscriptions</p>
        </div>
      </div>

      {/* Phase 10 Master Operational KPIs Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Managed Companies */}
        <div
          onClick={() => onNavigateTab('companies')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Briefcase className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              Corporate
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.totalCompanies ?? 4}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Managed Companies</p>
        </div>

        {/* Onboarding Pipeline */}
        <div
          onClick={() => onNavigateTab('onboarding')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              Pipeline
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.pendingOnboardingCases ?? 2}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Pending Onboarding</p>
        </div>

        {/* Global Directory */}
        <div
          onClick={() => onNavigateTab('global-users')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
              Global
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.totalPlatformUsers ?? 16}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">All Platform Users</p>
        </div>

        {/* Gate Visitors Today */}
        <div
          onClick={() => onNavigateTab('guards')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Eye className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
              Today
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{stats.visitorsToday ?? 142}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Gate Visitors Today</p>
        </div>

        {/* Active Emergencies */}
        <div
          onClick={() => onNavigateTab('emergencies')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
            (stats.activeEmergencyAlerts ?? stats.activeEmergencies ?? 0) > 0
              ? 'bg-rose-50 border-rose-200 hover:border-rose-400'
              : 'bg-[#FFFFFF] border-[#E6F1F5] hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`p-2 rounded-xl ${
                (stats.activeEmergencyAlerts ?? stats.activeEmergencies ?? 0) > 0
                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Siren className="w-4 h-4" />
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                (stats.activeEmergencyAlerts ?? stats.activeEmergencies ?? 0) > 0
                  ? 'text-rose-700 bg-rose-100 font-black animate-pulse'
                  : 'text-emerald-700 bg-emerald-50'
              }`}
            >
              {(stats.activeEmergencyAlerts ?? stats.activeEmergencies ?? 0) > 0 ? 'CRITICAL' : 'Clear'}
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">
            {stats.activeEmergencyAlerts ?? stats.activeEmergencies ?? 0}
          </div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Active SOS Emergencies</p>
        </div>

        {/* System Health */}
        <div
          onClick={() => onNavigateTab('system-health')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-emerald-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Activity className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              99.98%
            </span>
          </div>
          <div className="text-xl font-black text-emerald-600">HEALTHY</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Platform Node Status</p>
        </div>
      </div>

      {/* Analytics Section A & B: Society & User Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Society & Monthly Revenue Growth */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#111111]">
                Platform Scale & Monthly SaaS Revenue
              </h3>
              <p className="text-xs text-[#A9B0B8]">Monthly recurring subscription metrics (₹)</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F9FC] text-[#673AB7]">
              Live Telemetry
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.growthChartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#673AB7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#673AB7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F9FC" />
                <XAxis dataKey="month" stroke="#A9B0B8" fontSize={11} />
                <YAxis stroke="#A9B0B8" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E6F1F5',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#673AB7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B. User Growth by Role */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#111111]">
                User Growth by Network Role
              </h3>
              <p className="text-xs text-[#A9B0B8]">
                Active residents, security sentinels & field guards
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
              Active Roster
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.growthChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F9FC" />
                <XAxis dataKey="month" stroke="#A9B0B8" fontSize={11} />
                <YAxis stroke="#A9B0B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E6F1F5',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="residents" name="Residents (Units)" fill="#673AB7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="guards" name="Security Sentinels" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analytics Section C & D: Subscription Breakdown & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* C. Subscription Status Breakdown */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <h3 className="text-sm font-extrabold text-[#111111] mb-1">Subscription Health</h3>
          <p className="text-xs text-[#A9B0B8] mb-4">Community tenant license allocation</p>
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
          <div className="space-y-2 mt-2 pt-3 border-t border-[#E6F1F5]">
            {subscriptionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#111111] font-medium">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-[#111111]">{item.value} societies</span>
              </div>
            ))}
          </div>
        </div>

        {/* D. Revenue Channels Breakdown */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <h3 className="text-sm font-extrabold text-[#111111] mb-1">Revenue Channels</h3>
          <p className="text-xs text-[#A9B0B8] mb-4">Direct subscriptions & partner fees</p>
          <div className="space-y-3">
            {revenueStreams.map((stream) => {
              const pct = stats.monthlyRevenue > 0 ? Math.round((stream.amount / stats.monthlyRevenue) * 100) : 33;
              return (
                <div key={stream.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111111]">{stream.name}</span>
                    <span className="font-bold font-mono text-[#673AB7]">₹{stream.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-[#F1F9FC] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#673AB7] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#A9B0B8] text-right">{pct}% of total billing</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#A9B0B8]">Next Payout / Settlement</span>
              <span className="font-bold text-[#111111]">Nov 15, 2026</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A9B0B8]">Gateway Status</span>
              <span className="font-bold text-emerald-600 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational
              </span>
            </div>
          </div>
        </div>

        {/* E. Recent Administrative Activities */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#111111]">Recent Activity Feed</h3>
              <p className="text-xs text-[#A9B0B8]">Audit operations across societies</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('audit-logs')}
              className="text-[11px] text-[#673AB7] font-bold hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
            {recentAuditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-[#F1F9FC]/60 border border-[#E6F1F5] text-xs space-y-1 hover:border-[#673AB7]/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111111] truncate">{log.action}</span>
                  <span className="text-[10px] text-[#A9B0B8] shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-[#673AB7] font-medium truncate">{log.reason}</p>
                <div className="text-[10px] text-[#A9B0B8]">
                  By: {log.actorName} ({log.actorRole})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
