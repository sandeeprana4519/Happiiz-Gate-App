/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SocietyAdminAnalytics } from '../../types/societyAdmin';
import {
  Layers,
  Home,
  Users,
  ShieldCheck,
  DoorOpen,
  UserCheck,
  Ticket,
  Headset,
  CreditCard,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Building2,
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

interface SocietyOverviewViewProps {
  analytics: SocietyAdminAnalytics;
  onNavigateTab: (tab: any) => void;
}

export const SocietyOverviewView: React.FC<SocietyOverviewViewProps> = ({
  analytics,
  onNavigateTab,
}) => {
  const visitorPieColors = ['#0D9488', '#10B981', '#0284C7', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Society Command Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F3D3B] via-[#115E59] to-[#0D9488] text-white p-5 sm:p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-200">
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              Society & Campus Command
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Community Operations, Gate Security & Treasury
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
              Live occupancy, visitor ingress throughput, guard coverage, and maintenance dues health at a glance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('visitors')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-teal-950 font-bold text-xs hover:bg-teal-50 transition cursor-pointer shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Visitors</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-teal-500" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('maintenance')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
              <span>Maintenance Dues</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('helpdesk')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs transition cursor-pointer"
            >
              <Headset className="w-3.5 h-3.5 text-amber-300" />
              <span>HelpDesk</span>
            </button>
          </div>
        </div>

        {/* Hero KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/15">
          <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-teal-100">Total Flats & Units</div>
            <div className="text-lg sm:text-xl font-extrabold text-white tabular-nums mt-0.5">
              {analytics.totalFlats}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-teal-100">Active Residents</div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-200 tabular-nums mt-0.5">
              {analytics.totalResidents}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-teal-100">Visitors Inside Now</div>
            <div className="text-lg sm:text-xl font-extrabold text-sky-200 tabular-nums mt-0.5">
              {analytics.visitorsInside} <span className="text-xs font-semibold text-teal-200">/ {analytics.visitorsToday} today</span>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-teal-100">Pending Dues</div>
            <div className="text-lg sm:text-xl font-extrabold text-amber-200 tabular-nums mt-0.5">
              ₹{(analytics.pendingInvoicesAmount || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 14 Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* Total Towers */}
        <div
          onClick={() => onNavigateTab('buildings')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded-md">
              Wings
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums">{analytics.totalTowers}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Towers / Blocks</p>
        </div>

        {/* Total Flats */}
        <div
          onClick={() => onNavigateTab('flats')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Units
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums">{analytics.totalFlats}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Total Flats</p>
        </div>

        {/* Total Residents */}
        <div
          onClick={() => onNavigateTab('residents')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
              Roster
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums">{analytics.totalResidents}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Total Residents</p>
        </div>

        {/* Active Owners */}
        <div
          onClick={() => onNavigateTab('residents')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-violet-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-md">
              Owners
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums">{analytics.activeOwners}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Active Owners</p>
        </div>

        {/* Active Tenants */}
        <div
          onClick={() => onNavigateTab('residents')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md">
              Tenants
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums">{analytics.activeTenants}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Active Tenants</p>
        </div>

        {/* Security Guards */}
        <div
          onClick={() => onNavigateTab('guards')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Sentinels
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums">{analytics.totalSecurityGuards}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Security Guards</p>
        </div>

        {/* Total Gates */}
        <div
          onClick={() => onNavigateTab('gates')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-cyan-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <DoorOpen className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded-md">
              Posts
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums">{analytics.totalGates}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Active Gates</p>
        </div>

        {/* Visitors Today */}
        <div
          onClick={() => onNavigateTab('visitors')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <UserCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md">
              Today
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums">{analytics.visitorsToday}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Visitors Today</p>
        </div>

        {/* Visitors Inside */}
        <div
          onClick={() => onNavigateTab('visitors')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <UserCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
              On Campus
            </span>
          </div>
          <div className="text-xl font-extrabold text-emerald-700 tabular-nums">{analytics.visitorsInside}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Currently Inside</p>
        </div>

        {/* Pending Visitor Approvals */}
        <div
          onClick={() => onNavigateTab('pre-approvals')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Ticket className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md">
              At Gate
            </span>
          </div>
          <div className="text-xl font-extrabold text-amber-700 tabular-nums">{analytics.pendingVisitorApprovals}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Pending Approvals</p>
        </div>

        {/* Open Complaints */}
        <div
          onClick={() => onNavigateTab('helpdesk')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Headset className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-1.5 py-0.5 rounded-md">
              Triage
            </span>
          </div>
          <div className="text-xl font-extrabold text-orange-700 tabular-nums">{analytics.openComplaints}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Open Complaints</p>
        </div>

        {/* Pending Maintenance Invoices */}
        <div
          onClick={() => onNavigateTab('maintenance')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
              Unpaid
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums">
            ₹{(analytics.pendingInvoicesAmount || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Pending Dues</p>
        </div>

        {/* Upcoming Amenity Bookings */}
        <div
          onClick={() => onNavigateTab('amenities')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
              Confirmed
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums">{analytics.upcomingBookingsCount}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Amenity Bookings</p>
        </div>

        {/* Emergency SOS Alerts */}
        <div
          onClick={() => onNavigateTab('emergency')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
              Safety
            </span>
          </div>
          <div className="text-xl font-extrabold text-rose-600 tabular-nums">{analytics.activeEmergencyAlertsCount}</div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Emergency SOS</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitor Activity Peak Hours */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Daily Visitor Ingress by Hour</h3>
              <p className="text-xs text-slate-500">Peak gate entries & security throughput</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200/60">
              Live Gate Telemetry
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.visitorActivityChart}>
                <defs>
                  <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`${val} visitors`, 'Entries']}
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
                  dataKey="visitors"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#visGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Dues Collection vs Pending */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Monthly Maintenance Collection (₹)</h3>
              <p className="text-xs text-slate-500">Collected dues vs outstanding receivables</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Society Treasury
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyCollectionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending Dues" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visitor Breakdown & Pending Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor Categories Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Visitor Category Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Deliveries, cabs, guests & service staff</p>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.visitorCategoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {analytics.visitorCategoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={visitorPieColors[index % visitorPieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-100">
            {analytics.visitorCategoryBreakdown.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: visitorPieColors[idx % visitorPieColors.length] }}
                  />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-slate-900 tabular-nums">{item.count} passes</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Society Tasks */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Pending Admin Tasks</h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                Action Items
              </span>
            </div>

            <div className="space-y-2.5">
              <div
                onClick={() => onNavigateTab('residents')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-teal-300 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Resident Move-in Approvals</span>
                  <span className="text-[11px] text-slate-500">2 pending verification requests</span>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-600" />
              </div>

              <div
                onClick={() => onNavigateTab('helpdesk')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-teal-300 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 block">HelpDesk Complaint Resolution</span>
                  <span className="text-[11px] text-slate-500 tabular-nums">{analytics.openComplaints} complaints awaiting reply</span>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-600" />
              </div>

              <div
                onClick={() => onNavigateTab('maintenance')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-teal-300 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Monthly Maintenance Invoicing</span>
                  <span className="text-[11px] text-slate-500">November invoice run ready</span>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>All gate security shifts fully staffed</span>
          </div>
        </div>

        {/* Security & Gate Station Live Telemetry */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Gate Sentinels on Duty</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                Active Shift
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Gate #1 (North Main)</span>
                  <span className="text-[11px] text-slate-500">Bahadur Singh · Chief Sentinel</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Online
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Gate #2 (East Deliveries)</span>
                  <span className="text-[11px] text-slate-500">Ranjit Roy · Inspection</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Online
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Gate #3 (Clubhouse Turnstiles)</span>
                  <span className="text-[11px] text-slate-500">Kalyan Das · Pedestrian</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Boom Barriers</span>
            <span className="font-bold text-emerald-700">Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};
