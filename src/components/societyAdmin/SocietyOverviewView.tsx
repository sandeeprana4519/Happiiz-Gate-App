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
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
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
  const visitorPieColors = ['#673AB7', '#10B981', '#3B82F6', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* 13 Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Total Towers */}
        <div
          onClick={() => onNavigateTab('buildings')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[#F1F9FC] text-[#673AB7] group-hover:bg-[#673AB7] group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-[#673AB7] bg-purple-50 px-1.5 py-0.5 rounded">
              Wings
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{analytics.totalTowers}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Towers / Blocks</p>
        </div>

        {/* Total Flats */}
        <div
          onClick={() => onNavigateTab('flats')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[#F1F9FC] text-[#673AB7] group-hover:bg-[#673AB7] group-hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Units
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{analytics.totalFlats}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Total Flats</p>
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
            <span className="text-[10px] font-bold text-[#A9B0B8] bg-slate-50 px-1.5 py-0.5 rounded">
              Roster
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{analytics.totalResidents}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Total Residents</p>
        </div>

        {/* Active Owners */}
        <div
          onClick={() => onNavigateTab('residents')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-purple-50 text-[#673AB7]">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-[#673AB7] bg-purple-100 px-1.5 py-0.5 rounded">
              Owners
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{analytics.activeOwners}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Active Owners</p>
        </div>

        {/* Active Tenants */}
        <div
          onClick={() => onNavigateTab('residents')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
              Tenants
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{analytics.activeTenants}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Active Tenants</p>
        </div>

        {/* Security Guards */}
        <div
          onClick={() => onNavigateTab('guards')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              Roster
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{analytics.totalSecurityGuards}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Security Guards</p>
        </div>

        {/* Total Gates */}
        <div
          onClick={() => onNavigateTab('gates')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[#F1F9FC] text-[#673AB7]">
              <DoorOpen className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-[#673AB7] bg-purple-50 px-1.5 py-0.5 rounded">
              Posts
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{analytics.totalGates}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Active Gates</p>
        </div>

        {/* Visitors Today */}
        <div
          onClick={() => onNavigateTab('visitors')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <UserCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
              Today
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{analytics.visitorsToday}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Visitors Today</p>
        </div>

        {/* Visitors Inside */}
        <div
          onClick={() => onNavigateTab('visitors')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-emerald-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded animate-pulse">
              On Campus
            </span>
          </div>
          <div className="text-xl font-black text-emerald-600">{analytics.visitorsInside}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Currently Inside</p>
        </div>

        {/* Pending Visitor Approvals */}
        <div
          onClick={() => onNavigateTab('pre-approvals')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-amber-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Ticket className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              At Gate
            </span>
          </div>
          <div className="text-xl font-black text-amber-600">{analytics.pendingVisitorApprovals}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Pending Approvals</p>
        </div>

        {/* Open Complaints */}
        <div
          onClick={() => onNavigateTab('helpdesk')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-amber-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Headset className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              Triage
            </span>
          </div>
          <div className="text-xl font-black text-amber-600">{analytics.openComplaints}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Open Complaints</p>
        </div>

        {/* Pending Maintenance Invoices */}
        <div
          onClick={() => onNavigateTab('maintenance')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-red-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-red-50 text-red-600">
              <CreditCard className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
              Unpaid
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">
            ₹{(analytics.pendingInvoicesAmount || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Pending Dues</p>
        </div>

        {/* Upcoming Amenity Bookings */}
        <div
          onClick={() => onNavigateTab('amenities')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-[#673AB7]/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-purple-50 text-[#673AB7]">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
              Confirmed
            </span>
          </div>
          <div className="text-xl font-black text-[#111111]">{analytics.upcomingBookingsCount}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Amenity Bookings</p>
        </div>

        {/* Emergency SOS Alerts */}
        <div
          onClick={() => onNavigateTab('emergency')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] hover:border-red-400 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
              Safety
            </span>
          </div>
          <div className="text-xl font-black text-red-600">{analytics.activeEmergencyAlertsCount}</div>
          <p className="text-[11px] text-[#A9B0B8] font-medium truncate">Emergency SOS</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitor Activity Peak Hours */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#111111]">Daily Visitor Ingress by Hour</h3>
              <p className="text-xs text-[#A9B0B8]">Peak gate entries & security throughput</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F9FC] text-[#673AB7]">
              Live Gate Telemetry
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.visitorActivityChart}>
                <defs>
                  <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#673AB7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#673AB7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F9FC" />
                <XAxis dataKey="time" stroke="#A9B0B8" fontSize={11} />
                <YAxis stroke="#A9B0B8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`${val} visitors`, 'Entries']}
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
                  dataKey="visitors"
                  stroke="#673AB7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#visGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Dues Collection vs Pending */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#111111]">Monthly Maintenance Collection (₹)</h3>
              <p className="text-xs text-[#A9B0B8]">Collected dues vs outstanding receivables</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
              Society Treasury
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyCollectionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F9FC" />
                <XAxis dataKey="month" stroke="#A9B0B8" fontSize={11} />
                <YAxis stroke="#A9B0B8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E6F1F5',
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
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs">
          <h3 className="text-sm font-extrabold text-[#111111] mb-1">Visitor Category Breakdown</h3>
          <p className="text-xs text-[#A9B0B8] mb-4">Deliveries, cabs, guests & service staff</p>
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
          <div className="space-y-2 mt-2 pt-3 border-t border-[#E6F1F5]">
            {analytics.visitorCategoryBreakdown.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: visitorPieColors[idx % visitorPieColors.length] }}
                  />
                  <span className="text-[#111111] font-medium">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-[#111111]">{item.count} passes</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Society Tasks */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#111111]">Pending Admin Tasks</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                Action Items
              </span>
            </div>

            <div className="space-y-2.5">
              <div
                onClick={() => onNavigateTab('residents')}
                className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] hover:border-[#673AB7]/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[#111111] block">Resident Move-in Approvals</span>
                  <span className="text-[11px] text-[#A9B0B8]">2 pending verification requests</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#673AB7]" />
              </div>

              <div
                onClick={() => onNavigateTab('helpdesk')}
                className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] hover:border-[#673AB7]/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[#111111] block">HelpDesk Complaint Resolution</span>
                  <span className="text-[11px] text-[#A9B0B8]">{analytics.openComplaints} complaints awaiting reply</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#673AB7]" />
              </div>

              <div
                onClick={() => onNavigateTab('maintenance')}
                className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] hover:border-[#673AB7]/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[#111111] block">Monthly Maintenance Invoicing</span>
                  <span className="text-[11px] text-[#A9B0B8]">November invoice run ready</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#673AB7]" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E6F1F5] text-[11px] text-[#A9B0B8] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>All gate security shifts fully staffed</span>
          </div>
        </div>

        {/* Security & Gate Station Live Telemetry */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#111111]">Gate Sentinels on Duty</h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Active Shift
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl border border-[#E6F1F5] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111111] block">Gate #1 (North Main)</span>
                  <span className="text-[11px] text-[#A9B0B8]">Bahadur Singh (Chief Sentinel)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                  Online
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-[#E6F1F5] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111111] block">Gate #2 (East Deliveries)</span>
                  <span className="text-[11px] text-[#A9B0B8]">Ranjit Roy (Inspection)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                  Online
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-[#E6F1F5] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111111] block">Gate #3 (Clubhouse Turnstiles)</span>
                  <span className="text-[11px] text-[#A9B0B8]">Kalyan Das (Pedestrian)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E6F1F5] flex items-center justify-between text-[11px]">
            <span className="text-[#A9B0B8]">Boom Barriers:</span>
            <span className="font-bold text-emerald-600">Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};
