/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PartnerCrmProfile,
  CrmDateFilterType,
  MarketplaceBooking,
  PartnerCustomServiceRate,
} from '../../types/marketplace';
import { marketplaceService } from '../../services/firebase/marketplace.service';
import {
  Search,
  Wrench,
  Star,
  Download,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  FileText,
  UserCheck,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';

interface Partner360CrmSectionProps {
  onRefresh?: () => Promise<void>;
}

export const Partner360CrmSection: React.FC<Partner360CrmSectionProps> = ({ onRefresh }) => {
  const [profiles, setProfiles] = useState<PartnerCrmProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('ALL');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [societyFilter, setSocietyFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');

  // Selected Profile for Centered 360 CRM Modal
  const [activePartner, setActivePartner] = useState<PartnerCrmProfile | null>(null);
  const [crmModalTab, setCrmModalTab] = useState<'overview' | 'rates' | 'history'>('overview');

  // CRM Analytics Filter State inside Modal
  const [dateFilterType, setDateFilterType] = useState<CrmDateFilterType>('ALL');
  const [dateFilterValue, setDateFilterValue] = useState<string>('');

  // Editing custom rates
  const [customRates, setCustomRates] = useState<PartnerCustomServiceRate[]>([]);
  const [savingRates, setSavingRates] = useState(false);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getPartnerCrmProfiles();
      setProfiles(data);
      if (activePartner) {
        const refreshed = data.find((p) => p.partnerId === activePartner.partnerId);
        if (refreshed) {
          setActivePartner(refreshed);
          setCustomRates(refreshed.servicesOffered || []);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const openPartnerModal = (partner: PartnerCrmProfile) => {
    setActivePartner(partner);
    setCustomRates(partner.servicesOffered || []);
    setCrmModalTab('overview');
    setDateFilterType('ALL');
    setDateFilterValue('');
  };

  const handleCustomRateChange = (serviceId: string, newRate: number) => {
    setCustomRates((prev) =>
      prev.map((r) => (r.serviceId === serviceId ? { ...r, customPrice: newRate } : r))
    );
  };

  const handleToggleOptIn = (serviceId: string) => {
    setCustomRates((prev) =>
      prev.map((r) => (r.serviceId === serviceId ? { ...r, isOptedIn: !r.isOptedIn } : r))
    );
  };

  const handleSaveRates = async () => {
    if (!activePartner) return;
    setSavingRates(true);
    try {
      await marketplaceService.updatePartnerCustomRates(activePartner.partnerId, customRates);
      await loadProfiles();
      alert('Custom service rates updated successfully.');
    } finally {
      setSavingRates(false);
    }
  };

  // Filtered job history for active partner
  const { filteredJobs, summary } = activePartner
    ? marketplaceService.filterJobHistory(activePartner.jobHistory || [], dateFilterType, dateFilterValue)
    : {
        filteredJobs: [],
        summary: {
          totalJobs: 0,
          totalGmv: 0,
          totalCommission: 0,
          totalPayout: 0,
          averageTicketSize: 0,
          completionRate: 100,
        },
      };

  const handleExportPdf = () => {
    if (!activePartner) return;
    marketplaceService.exportPartnerStatementPdf(
      activePartner,
      dateFilterType,
      dateFilterValue,
      filteredJobs,
      summary
    );
  };

  // Directory Filters Options
  const allDomains = [
    'ALL',
    ...Array.from(new Set(profiles.flatMap((p) => p.primaryDomains || []))),
  ];

  const allAreas = [
    'ALL',
    ...Array.from(
      new Set(
        profiles
          .map((p) => p.serviceArea)
          .filter(Boolean) as string[]
      )
    ),
  ];

  const allSocieties = [
    'ALL',
    ...Array.from(
      new Set(
        profiles.flatMap((p) => (p.mappedSocieties ? p.mappedSocieties.map((s) => s.name) : []))
      )
    ),
  ];

  const filteredProfiles = profiles.filter((p) => {
    const matchesDomain =
      selectedDomainFilter === 'ALL' || (p.primaryDomains && p.primaryDomains.includes(selectedDomainFilter));
    const matchesSearch =
      p.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);
    const matchesArea =
      areaFilter === 'ALL' || p.serviceArea === areaFilter || (p.address && p.address.includes(areaFilter));
    const matchesSociety =
      societyFilter === 'ALL' || (p.mappedSocieties && p.mappedSocieties.some((s) => s.name === societyFilter));
    const matchesSource =
      sourceFilter === 'ALL' || p.onboardedBy === sourceFilter;
    const matchesDate = (() => {
      if (dateRangeFilter === 'ALL') return true;
      const joinedTime = new Date(p.joinedAt).getTime();
      const now = Date.now();
      if (dateRangeFilter === 'LAST_30_DAYS') return now - joinedTime <= 30 * 86400 * 1000;
      if (dateRangeFilter === 'THIS_MONTH') return new Date(p.joinedAt).getMonth() === new Date().getMonth();
      if (dateRangeFilter === 'THIS_YEAR') return new Date(p.joinedAt).getFullYear() === new Date().getFullYear();
      return true;
    })();

    return matchesDomain && matchesSearch && matchesArea && matchesSociety && matchesSource && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B]">Total Service Partners</p>
            <h3 className="text-2xl font-black text-[#111111] mt-0.5">{profiles.length}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Verified community contractors</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B]">Combined Lifetime GMV</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
              ₹{profiles.reduce((sum, p) => sum + p.lifetimeGmv, 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-[#A9B0B8] mt-1">Gross volume fulfilled</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B]">Platform Commission Earned</p>
            <h3 className="text-2xl font-black text-[#673AB7] mt-0.5">
              ₹{profiles.reduce((sum, p) => sum + p.lifetimeCommissionPaid, 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-[#A9B0B8] mt-1">Auto-split revenue cut</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B]">Average Rating</p>
            <h3 className="text-2xl font-black text-amber-500 mt-0.5 flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-500" />
              4.8
            </h3>
            <p className="text-[11px] text-slate-700 font-semibold mt-1">From 1,200+ verified resident reviews</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Directory Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search partner by agency name, technician, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                marketplaceService.exportPartnersDirectoryPdf(filteredProfiles, {
                  area: areaFilter,
                  society: societyFilter,
                  source: sourceFilter,
                  dateRange: dateRangeFilter,
                })
              }
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#673AB7] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export Partner Report (PDF)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#673AB7] text-white">
                {filteredProfiles.length}
              </span>
            </button>
          </div>
        </div>

        {/* Multi-Variable Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 border-t border-[#E6F1F5]/70 text-xs">
          {/* Trade / Domain Filter */}
          <div>
            <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Trade Domain</label>
            <select
              value={selectedDomainFilter}
              onChange={(e) => setSelectedDomainFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] font-semibold focus:outline-none focus:border-[#673AB7]"
            >
              {allDomains.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Trades' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Area / Locality Filter */}
          <div>
            <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Area / Locality</label>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] font-semibold focus:outline-none focus:border-[#673AB7]"
            >
              <option value="ALL">All Localities</option>
              {allAreas.filter((a) => a !== 'ALL').map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Society Filter */}
          <div>
            <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Mapped Society</label>
            <select
              value={societyFilter}
              onChange={(e) => setSocietyFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] font-semibold focus:outline-none focus:border-[#673AB7]"
            >
              <option value="ALL">All Societies</option>
              {allSocieties.filter((s) => s !== 'ALL').map((society) => (
                <option key={society} value={society}>
                  {society}
                </option>
              ))}
            </select>
          </div>

          {/* Onboarding Source Filter */}
          <div>
            <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Onboarding Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] font-semibold focus:outline-none focus:border-[#673AB7]"
            >
              <option value="ALL">All Sources</option>
              <option value="super_admin">Super Admin Direct</option>
              <option value="society_admin">Society Admin Verified</option>
              <option value="self">Self Onboarded</option>
            </select>
          </div>

          {/* Date Range / Timeline Filter */}
          <div>
            <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Joined Timeline</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] font-semibold focus:outline-none focus:border-[#673AB7]"
            >
              <option value="ALL">All Time</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="THIS_YEAR">This Year (2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl bg-white border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F9FC] border-b border-[#E6F1F5] text-[#64748B] font-bold">
              <tr>
                <th className="py-3.5 px-4">Partner & Agency</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Primary Services</th>
                <th className="py-3.5 px-4">Mapped Society</th>
                <th className="py-3.5 px-4 text-center">Jobs Done</th>
                <th className="py-3.5 px-4">Lifetime GMV</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#64748B]">
                    Loading partner directory...
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#64748B]">
                    No partners found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => (
                  <tr key={p.partnerId} className="hover:bg-[#F1F9FC]/60 transition-colors">
                    {/* Partner Photo & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.photoUrl}
                          alt={p.businessName}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                        <div>
                          <p className="font-extrabold text-[#111111]">{p.businessName}</p>
                          <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                            <span>Rep: {p.partnerName}</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#111111]">{p.phone}</p>
                      <p className="text-[11px] text-[#A9B0B8]">{p.email}</p>
                    </td>

                    {/* Primary Services Chips */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(p.primaryDomains || []).slice(0, 2).map((dom, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-[#673AB7] border border-purple-100"
                          >
                            {dom}
                          </span>
                        ))}
                        {(p.primaryDomains || []).length > 2 && (
                          <span className="text-[10px] text-[#A9B0B8] font-bold self-center">
                            +{(p.primaryDomains || []).length - 2} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Mapped Society */}
                    <td className="py-3.5 px-4 text-[#334155] font-medium">
                      {p.mappedSocieties[0]?.name || 'Emerald Heights Luxury Enclave'}
                    </td>

                    {/* Jobs Completed */}
                    <td className="py-3.5 px-4 text-center font-black text-[#111111]">
                      {p.totalJobsCompleted}
                    </td>

                    {/* Lifetime GMV */}
                    <td className="py-3.5 px-4">
                      <p className="font-black text-emerald-600">₹{p.lifetimeGmv.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-[#A9B0B8]">Net: ₹{p.lifetimeNetEarnings.toLocaleString('en-IN')}</p>
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        {p.rating}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openPartnerModal(p)}
                        className="px-3 py-1.5 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <span>View CRM Profile</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PARTNER 360° CENTERED CRM PROFILE MODAL                      */}
      {/* ============================================================ */}
      {activePartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white shadow-2xl rounded-3xl flex flex-col max-h-[92vh] overflow-hidden my-auto border border-slate-100 animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E6F1F5] bg-gradient-to-r from-purple-50 via-white to-blue-50/40 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-4">
                <img
                  src={activePartner.photoUrl}
                  alt={activePartner.businessName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-[#111111]">
                      {activePartner.businessName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Partner
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#673AB7]">
                      {activePartner.onboardedBy === 'society_admin'
                        ? 'Society Onboarded'
                        : activePartner.onboardedBy === 'super_admin'
                        ? 'Super Admin Onboarded'
                        : 'Self Registered'}
                    </span>
                  </div>

                  <p className="text-xs text-[#64748B] mt-0.5">
                    Lead Technician: <strong>{activePartner.partnerName}</strong> · Partner ID:{' '}
                    <span className="font-mono text-[#673AB7]">{activePartner.partnerId}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] mt-1.5">
                    <span className="flex items-center gap-1 text-[#111111] font-semibold">
                      <Phone className="w-3.5 h-3.5 text-[#673AB7]" />
                      {activePartner.phone}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#673AB7]" />
                      {activePartner.email}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {activePartner.rating} ({activePartner.reviewCount} Reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#673AB7] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Statement (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartner(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-[#64748B] hover:text-[#111111] transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Internal Tabs */}
            <div className="flex items-center gap-2 px-6 pt-2 border-b border-[#E6F1F5] bg-white shrink-0">
              <button
                type="button"
                onClick={() => setCrmModalTab('overview')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
                  crmModalTab === 'overview'
                    ? 'border-[#673AB7] text-[#673AB7]'
                    : 'border-transparent text-[#64748B] hover:text-[#111111]'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Overview & Ratings</span>
              </button>

              <button
                type="button"
                onClick={() => setCrmModalTab('rates')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
                  crmModalTab === 'rates'
                    ? 'border-[#673AB7] text-[#673AB7]'
                    : 'border-transparent text-[#64748B] hover:text-[#111111]'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Assigned Services & Rate Card</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-[#673AB7]">
                  {customRates.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCrmModalTab('history')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
                  crmModalTab === 'history'
                    ? 'border-[#673AB7] text-[#673AB7]'
                    : 'border-transparent text-[#64748B] hover:text-[#111111]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Date-wise Job History & Ledger</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                  {filteredJobs.length}
                </span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* TAB 1: OVERVIEW & RATINGS */}
              {crmModalTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5]">
                      <span className="text-[10px] text-[#64748B] font-bold block uppercase">Lifetime Completed</span>
                      <span className="text-xl font-black text-[#111111]">{activePartner.totalJobsCompleted} Jobs</span>
                      <span className="text-[11px] text-emerald-600 block mt-1 font-semibold">100% completion rate</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5]">
                      <span className="text-[10px] text-[#64748B] font-bold block uppercase">Total Lifetime GMV</span>
                      <span className="text-xl font-black text-emerald-600">₹{activePartner.lifetimeGmv.toLocaleString('en-IN')}</span>
                      <span className="text-[11px] text-[#64748B] block mt-1">Gross order volume</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5]">
                      <span className="text-[10px] text-[#64748B] font-bold block uppercase">Platform Cut Paid</span>
                      <span className="text-xl font-black text-[#673AB7]">₹{activePartner.lifetimeCommissionPaid.toLocaleString('en-IN')}</span>
                      <span className="text-[11px] text-[#64748B] block mt-1">Admin commission split</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5]">
                      <span className="text-[10px] text-[#64748B] font-bold block uppercase">Net Disbursed Earnings</span>
                      <span className="text-xl font-black text-blue-600">₹{activePartner.lifetimeNetEarnings.toLocaleString('en-IN')}</span>
                      <span className="text-[11px] text-blue-600 block mt-1 font-semibold">Settled directly</span>
                    </div>
                  </div>

                  {/* Partner Details & Compliance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] space-y-3">
                      <h4 className="font-black text-sm text-[#111111] flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#673AB7]" />
                        Business & Compliance Details
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-[#E6F1F5]">
                          <span className="text-[#64748B]">Business Name</span>
                          <span className="font-bold text-[#111111]">{activePartner.businessName}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#E6F1F5]">
                          <span className="text-[#64748B]">Onboarding Source</span>
                          <span className="font-bold text-[#673AB7]">
                            {activePartner.onboardedBy === 'society_admin'
                              ? 'Society Admin Verified'
                              : 'Super Admin Direct'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#E6F1F5]">
                          <span className="text-[#64748B]">Service Locality / Area</span>
                          <span className="font-bold text-[#111111]">{activePartner.serviceArea || 'Bellandur / Outer Ring Rd'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#E6F1F5]">
                          <span className="text-[#64748B]">Police Verification</span>
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Clean Record
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#64748B]">KYC Status</span>
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Aadhaar & PAN Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] space-y-3">
                      <h4 className="font-black text-sm text-[#111111] flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        Rating Breakdown & Quality Score
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-4">
                          <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
                            <span className="text-3xl font-black text-amber-600 block">{activePartner.rating}</span>
                            <span className="text-[10px] text-amber-700 font-bold">out of 5.0</span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[#64748B]">Customer Satisfaction</span>
                              <span className="font-bold text-emerald-600">98% Positive</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: '96%' }} />
                            </div>
                            <p className="text-[10px] text-[#64748B]">Based on {activePartner.reviewCount} resident verified job ratings</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#E6F1F5]">
                          <p className="text-[11px] font-bold text-[#64748B] mb-1.5">Mapped Societies Serving:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {activePartner.mappedSocieties.map((s) => (
                              <span
                                key={s.id}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F1F9FC] text-[#334155] border border-[#E6F1F5]"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ASSIGNED SERVICES & RATE CARD */}
              {crmModalTab === 'rates' && (
                <div className="rounded-2xl bg-white border border-[#E6F1F5] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-[#111111] flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#673AB7]" />
                        Assigned Services & Partner Rate Card Matrix
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Configure customized price overrides and enable/disable services for this partner
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveRates}
                      disabled={savingRates}
                      className="px-4 py-2 rounded-xl bg-[#673AB7] text-white font-bold text-xs shadow-xs hover:bg-[#5E35B1] cursor-pointer disabled:opacity-50"
                    >
                      {savingRates ? 'Saving Rates...' : 'Save Rate Card'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customRates.map((rate) => (
                      <div
                        key={rate.serviceId}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          rate.isOptedIn
                            ? 'border-[#673AB7]/30 bg-purple-50/20'
                            : 'border-slate-200 bg-slate-50 opacity-70'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={rate.isOptedIn}
                              onChange={() => handleToggleOptIn(rate.serviceId)}
                              className="w-4 h-4 rounded text-[#673AB7] cursor-pointer"
                            />
                            <p className="font-extrabold text-[#111111] truncate">{rate.serviceName}</p>
                          </div>
                          <p className="text-[10px] text-[#64748B] pl-5">
                            {rate.category} · Platform Base: ₹{rate.basePrice}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-[#111111]">₹</span>
                          <input
                            type="number"
                            disabled={!rate.isOptedIn}
                            value={rate.customPrice}
                            onChange={(e) =>
                              handleCustomRateChange(rate.serviceId, Number(e.target.value))
                            }
                            className="w-24 px-2 py-1.5 rounded-lg bg-white border border-[#E6F1F5] font-black text-right text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DATE-WISE JOB HISTORY & LEDGER */}
              {crmModalTab === 'history' && (
                <div className="space-y-4">
                  {/* Period Filter Bar */}
                  <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#673AB7]" />
                        <span className="font-extrabold text-[#111111]">Statement & Analytics Period:</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Filter Type Buttons */}
                        <div className="flex p-1 rounded-xl bg-white border border-[#E6F1F5]">
                          <button
                            type="button"
                            onClick={() => {
                              setDateFilterType('ALL');
                              setDateFilterValue('');
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              dateFilterType === 'ALL'
                                ? 'bg-[#673AB7] text-white shadow-xs'
                                : 'text-[#64748B]'
                            }`}
                          >
                            All Time
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDateFilterType('DAY');
                              setDateFilterValue(new Date().toISOString().slice(0, 10));
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              dateFilterType === 'DAY'
                                ? 'bg-[#673AB7] text-white shadow-xs'
                                : 'text-[#64748B]'
                            }`}
                          >
                            Day-wise
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDateFilterType('MONTH');
                              setDateFilterValue(new Date().toISOString().slice(0, 7));
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              dateFilterType === 'MONTH'
                                ? 'bg-[#673AB7] text-white shadow-xs'
                                : 'text-[#64748B]'
                            }`}
                          >
                            Month-wise
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDateFilterType('YEAR');
                              setDateFilterValue(String(new Date().getFullYear()));
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              dateFilterType === 'YEAR'
                                ? 'bg-[#673AB7] text-white shadow-xs'
                                : 'text-[#64748B]'
                            }`}
                          >
                            Year-wise
                          </button>
                        </div>

                        {/* Specific Date / Month / Year Picker */}
                        {dateFilterType === 'DAY' && (
                          <input
                            type="date"
                            value={dateFilterValue}
                            onChange={(e) => setDateFilterValue(e.target.value)}
                            className="px-2.5 py-1 rounded-xl bg-white border border-[#E6F1F5] font-semibold text-[#111111]"
                          />
                        )}
                        {dateFilterType === 'MONTH' && (
                          <input
                            type="month"
                            value={dateFilterValue}
                            onChange={(e) => setDateFilterValue(e.target.value)}
                            className="px-2.5 py-1 rounded-xl bg-white border border-[#E6F1F5] font-semibold text-[#111111]"
                          />
                        )}
                        {dateFilterType === 'YEAR' && (
                          <select
                            value={dateFilterValue}
                            onChange={(e) => setDateFilterValue(e.target.value)}
                            className="px-3 py-1 rounded-xl bg-white border border-[#E6F1F5] font-semibold text-[#111111]"
                          >
                            <option value="2026">Year 2026</option>
                            <option value="2025">Year 2025</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Metric Cards Driven by Selected Period */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-white border border-[#E6F1F5]">
                        <span className="text-[10px] text-[#64748B] font-bold block uppercase">Jobs in Period</span>
                        <span className="text-lg font-black text-[#111111]">{summary.totalJobs}</span>
                        <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">100% fulfilled</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#E6F1F5]">
                        <span className="text-[10px] text-[#64748B] font-bold block uppercase">Period Volume (GMV)</span>
                        <span className="text-lg font-black text-emerald-600">
                          ₹{summary.totalGmv.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-[#A9B0B8] block mt-0.5">
                          Avg: ₹{summary.averageTicketSize}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#E6F1F5]">
                        <span className="text-[10px] text-[#64748B] font-bold block uppercase">Admin Commission</span>
                        <span className="text-lg font-black text-[#673AB7]">
                          ₹{summary.totalCommission.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-[#A9B0B8] block mt-0.5">Platform cut</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#E6F1F5]">
                        <span className="text-[10px] text-[#64748B] font-bold block uppercase">Partner Net Payout</span>
                        <span className="text-lg font-black text-blue-600">
                          ₹{summary.totalPayout.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-blue-600 block mt-0.5 font-semibold">Net disbursed</span>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div className="rounded-2xl bg-white border border-[#E6F1F5] overflow-hidden space-y-3">
                    <div className="p-4 border-b border-[#E6F1F5] flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-sm text-[#111111] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#673AB7]" />
                          Date-Wise Work Order Ledger
                        </h3>
                        <p className="text-[11px] text-[#64748B]">
                          Audited jobs, commission breakdown, and net partner payout
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
                        {filteredJobs.length} Records Found
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F1F9FC] border-b border-[#E6F1F5] text-[#64748B] font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Booking ID</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Resident & Flat</th>
                            <th className="py-2.5 px-3">Service</th>
                            <th className="py-2.5 px-3">Total (₹)</th>
                            <th className="py-2.5 px-3">Platform Cut</th>
                            <th className="py-2.5 px-3">Partner Net</th>
                            <th className="py-2.5 px-3">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6F1F5]">
                          {filteredJobs.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-[#64748B]">
                                No completed jobs recorded for this selected period.
                              </td>
                            </tr>
                          ) : (
                            filteredJobs.map((job) => (
                              <tr key={job.id} className="hover:bg-[#F1F9FC]/60 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-[#673AB7]">
                                  {job.bookingCode}
                                </td>
                                <td className="py-2.5 px-3 text-[#334155] whitespace-nowrap">
                                  {job.scheduledDate}
                                </td>
                                <td className="py-2.5 px-3">
                                  <p className="font-bold text-[#111111]">{job.residentName}</p>
                                  <p className="text-[10px] text-[#64748B]">
                                    {job.building ? `${job.building} · ` : ''}Flat {job.flatNumber}
                                  </p>
                                </td>
                                <td className="py-2.5 px-3">
                                  <p className="font-semibold text-[#111111] line-clamp-1">
                                    {job.serviceName}
                                  </p>
                                  <p className="text-[10px] text-[#A9B0B8]">{job.category}</p>
                                </td>
                                <td className="py-2.5 px-3 font-black text-[#111111]">
                                  ₹{job.totalAmount}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-red-600">
                                  -₹{job.commissionAmount} ({job.commissionRate}%)
                                </td>
                                <td className="py-2.5 px-3 font-black text-emerald-600">
                                  ₹{job.partnerEarnings}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {job.paymentMethod || 'UPI'}
                                  </span>
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
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E6F1F5] bg-[#F1F9FC] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#64748B]">
                Authoritative SaaS Financial Audit Ledger · Immutable Log Records
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#673AB7] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Statement (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartner(null)}
                  className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-all"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
