/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Society } from '../../types/society';
import {
  FinancialTransaction,
  GlobalUserRecord,
  SocietySubscription,
  SupportTicket,
} from '../../types/admin';
import { ServicePartnerProfile } from '../../types/auth';
import {
  exportToCsv,
  GuardRecord,
  ResidentRecord,
} from '../../services/firebase/superadmin.service';
import {
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  FileText,
  Search,
  RotateCcw,
} from 'lucide-react';

export type ReportPeriodMode = 'ALL' | 'DAY' | 'MONTH' | 'YEAR' | 'RANGE';

interface ReportsSectionProps {
  societies: Society[];
  transactions?: FinancialTransaction[];
  societySubs?: SocietySubscription[];
  partners?: ServicePartnerProfile[];
  guards?: GuardRecord[];
  residents?: ResidentRecord[];
  globalUsers?: GlobalUserRecord[];
  tickets?: SupportTicket[];
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  societies,
  transactions = [],
  societySubs = [],
  partners = [],
  guards = [],
  residents = [],
  globalUsers = [],
  tickets = [],
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentMonthIso = todayIso.slice(0, 7);
  const currentYear = todayIso.slice(0, 4);

  const [selectedReport, setSelectedReport] = useState<string>('REVENUE');
  const [selectedSociety, setSelectedSociety] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [periodMode, setPeriodMode] = useState<ReportPeriodMode>('ALL');
  const [dayFilter, setDayFilter] = useState<string>(todayIso);
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthIso);
  const [yearFilter, setYearFilter] = useState<string>(currentYear);
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');

  const reportTypes = [
    { id: 'REVENUE', label: '1. Revenue & Ledger Report' },
    { id: 'SOCIETY_REG', label: '2. Society Registration Report' },
    { id: 'USER_REG', label: '3. Platform User Accounts Report' },
    { id: 'RESIDENT_DEMO', label: '4. Resident Unit Demographics' },
    { id: 'GUARD_SHIFT', label: '5. Guard & Gate Shift Roster' },
    { id: 'PARTNER_KYC', label: '6. Service Partner KYC Report' },
    { id: 'SUBSCRIPTION_RENEWAL', label: '7. Subscription Renewal Report' },
    { id: 'PAYMENT_GATEWAY', label: '8. Payment Gateway Settlement' },
    { id: 'SUPPORT_SLA', label: '9. Support Ticket SLA Report' },
  ];

  const activeReportLabel =
    reportTypes.find((r) => r.id === selectedReport)?.label || 'Platform Report';

  const toDateStr = (raw?: string): string => {
    if (!raw) return todayIso;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      return raw.slice(0, 10);
    }
    return d.toISOString().slice(0, 10);
  };

  // Build normalized rows with Date & Society context for each report category
  const rawRows: Record<string, any>[] = useMemo(() => {
    switch (selectedReport) {
      case 'REVENUE':
        if (transactions.length > 0) {
          return transactions.map((t) => ({
            TxnNo: t.transactionNumber,
            Entity: t.entityName,
            Type: t.type,
            Amount: `₹${Number(t.amount || 0).toLocaleString('en-IN')}`,
            Status: t.status,
            Method: t.paymentMethod || 'UPI',
            Date: toDateStr(t.paymentDate),
          }));
        }
        return [
          { TxnNo: 'TXN-9811', Entity: 'Emerald Heights', Type: 'SUBSCRIPTION', Amount: '₹9,999', Status: 'SUCCESS', Method: 'UPI', Date: '2026-11-01' },
          { TxnNo: 'TXN-9812', Entity: 'Silver Oak', Type: 'SUBSCRIPTION', Amount: '₹11,397', Status: 'SUCCESS', Method: 'NetBanking', Date: '2026-10-15' },
          { TxnNo: 'TXN-9813', Entity: 'Vertex Clean', Type: 'PARTNER_COMMISSION', Amount: '₹1,450', Status: 'SUCCESS', Method: 'Bank Transfer', Date: '2026-11-02' },
        ];

      case 'SOCIETY_REG':
        return societies.map((s) => ({
          SocietyName: s.societyName,
          Code: s.societyCode,
          City: s.city,
          Units: s.totalFlats,
          Occupancy: s.occupiedFlats,
          Status: s.status,
          Tier: s.subscriptionPlan,
          Date: toDateStr((s as any).createdAt || (s as any).registeredAt || '2026-01-15'),
        }));

      case 'USER_REG':
        if (globalUsers.length > 0) {
          return globalUsers.map((u) => ({
            Name: u.fullName,
            Role: u.role,
            Phone: u.phoneNumber,
            Society: u.societyName || 'Platform',
            Status: u.status,
            Date: toDateStr(u.registeredAt),
          }));
        }
        return [
          { Name: 'Rajesh Sharma', Role: 'SOCIETY_ADMIN', Phone: '+91 9876543210', Society: 'Emerald Heights', Status: 'ACTIVE', Date: '2026-11-04' },
          { Name: 'Anita Desai', Role: 'RESIDENT', Phone: '+91 9811122233', Society: 'Silver Oak', Status: 'ACTIVE', Date: '2026-11-05' },
        ];

      case 'RESIDENT_DEMO':
        if (residents.length > 0) {
          return residents.map((r) => ({
            Name: r.fullName,
            Society: r.societyName,
            Unit: `${r.tower}-${r.flat}`,
            Type: r.occupantType,
            Phone: r.phoneNumber,
            Status: r.status,
            Date: toDateStr(r.joinedAt),
          }));
        }
        return [
          { Name: 'Vikram Patel', Society: 'Emerald Heights', Unit: 'A-402', Type: 'OWNER', Phone: '+91 9822011223', Status: 'ACTIVE', Date: '2026-10-12' },
          { Name: 'Neha Kulkarni', Society: 'Silver Oak', Unit: 'B-108', Type: 'TENANT', Phone: '+91 9890098900', Status: 'ACTIVE', Date: '2026-11-03' },
        ];

      case 'GUARD_SHIFT':
        if (guards.length > 0) {
          return guards.map((g) => ({
            Name: g.fullName,
            Agency: g.agencyName,
            Gate: g.assignedGate,
            Shift: g.shift,
            Society: g.societyName,
            Status: g.status,
            Date: toDateStr(g.joinedAt),
          }));
        }
        return [
          { Name: 'Bahadur Singh', Agency: 'SIS', Gate: 'Gate #1', Shift: 'DAY', Society: 'Emerald Heights', Status: 'ACTIVE', Date: '2026-11-01' },
          { Name: 'Manoj Kumar', Agency: 'SIS', Gate: 'Gate #2', Shift: 'NIGHT', Society: 'Emerald Heights', Status: 'ACTIVE', Date: '2026-11-02' },
          { Name: 'Dilip Rathi', Agency: 'Black Belt', Gate: 'East Gate', Shift: 'ROTATIONAL', Society: 'Silver Oak', Status: 'ACTIVE', Date: '2026-10-20' },
        ];

      case 'PARTNER_KYC':
        if (partners.length > 0) {
          return partners.map((p) => ({
            Business: p.businessName || p.name,
            Partner: p.name,
            Categories: (p.serviceDomain || p.serviceCategories || []).join(', ') || 'General',
            Society: p.assignedSocietyName || 'All Societies',
            Status: p.verificationStatus,
            Date: toDateStr(p.documents?.policeVerificationDate || (p as any).createdAt || todayIso),
          }));
        }
        return [
          { Business: 'Vertex Facilities', Partner: 'Suresh Nair', Categories: 'Cleaning, Pest Control', Society: 'Emerald Heights', Status: 'ACTIVE', Date: '2026-02-21' },
          { Business: 'Apex Electro HVAC', Partner: 'Ramesh Verma', Categories: 'Electrical, AC', Society: 'All Societies', Status: 'PENDING', Date: '2026-11-08' },
        ];

      case 'SUBSCRIPTION_RENEWAL':
        if (societySubs.length > 0) {
          return societySubs.map((sub) => ({
            Society: sub.societyName,
            Plan: sub.planName,
            Cycle: sub.billingCycle,
            Amount: `₹${Number(sub.amountPaid || 0).toLocaleString('en-IN')}`,
            Status: sub.status,
            Date: toDateStr(sub.nextBillingDate || sub.endDate),
          }));
        }
        return [
          { Society: 'Emerald Heights', Plan: 'Enterprise Annual', Cycle: 'Yearly', Amount: '₹99,999', Status: 'ACTIVE', Date: '2026-12-01' },
          { Society: 'Silver Oak', Plan: 'Growth Monthly', Cycle: 'Monthly', Amount: '₹9,999', Status: 'PENDING_RENEWAL', Date: '2026-11-28' },
        ];

      case 'PAYMENT_GATEWAY':
        if (transactions.length > 0) {
          return transactions.map((t) => ({
            GatewayRef: t.gatewayReference,
            Entity: t.entityName,
            Mode: t.paymentMethod,
            Amount: `₹${Number(t.amount || 0).toLocaleString('en-IN')}`,
            Status: t.status,
            Date: toDateStr(t.paymentDate),
          }));
        }
        return [
          { GatewayRef: 'RZP-883401', Entity: 'Emerald Heights', Mode: 'UPI', Amount: '₹9,999', Status: 'SUCCESS', Date: '2026-11-01' },
          { GatewayRef: 'RZP-883402', Entity: 'Silver Oak', Mode: 'NetBanking', Amount: '₹11,397', Status: 'SUCCESS', Date: '2026-11-06' },
        ];

      case 'SUPPORT_SLA':
        if (tickets.length > 0) {
          return tickets.map((tk) => ({
            TicketNo: tk.ticketNumber,
            Subject: tk.subject,
            Society: tk.societyName || 'General',
            Priority: tk.priority,
            Status: tk.status,
            Date: toDateStr(tk.createdAt),
          }));
        }
        return [
          { TicketNo: 'TKT-1042', Subject: 'Gate RFID Scanner Sync', Society: 'Emerald Heights', Priority: 'HIGH', Status: 'RESOLVED', Date: '2026-11-05' },
          { TicketNo: 'TKT-1043', Subject: 'Monthly Invoice Copy Request', Society: 'Silver Oak', Priority: 'LOW', Status: 'OPEN', Date: '2026-11-10' },
        ];

      default:
        return [];
    }
  }, [selectedReport, societies, transactions, societySubs, partners, guards, residents, globalUsers, tickets, todayIso]);

  // Apply Society, Period Granularity (Day/Month/Year/Range), and Search Filters
  const filteredData = useMemo(() => {
    const selectedSocietyObj = societies.find((s) => s.id === selectedSociety);
    const selectedSocietyName = selectedSocietyObj?.societyName?.toLowerCase() || '';
    const q = searchTerm.trim().toLowerCase();

    return rawRows.filter((row) => {
      // 1. Society filter
      if (selectedSocietyName) {
        const rowText = Object.values(row)
          .map((v) => String(v ?? '').toLowerCase())
          .join(' ');
        if (!rowText.includes(selectedSocietyName)) {
          return false;
        }
      }

      // 2. Date / Period filter
      const rowDate = String(row.Date || '');
      if (periodMode === 'DAY' && dayFilter) {
        if (rowDate !== dayFilter) return false;
      } else if (periodMode === 'MONTH' && monthFilter) {
        if (!rowDate.startsWith(monthFilter)) return false;
      } else if (periodMode === 'YEAR' && yearFilter) {
        if (!rowDate.startsWith(yearFilter)) return false;
      } else if (periodMode === 'RANGE') {
        if (startDate && rowDate < startDate) return false;
        if (endDate && rowDate > endDate) return false;
      }

      // 3. Search term filter across all columns
      if (q) {
        const match = Object.values(row).some((val) =>
          String(val ?? '')
            .toLowerCase()
            .includes(q)
        );
        if (!match) return false;
      }

      return true;
    });
  }, [
    rawRows,
    societies,
    selectedSociety,
    periodMode,
    dayFilter,
    monthFilter,
    yearFilter,
    startDate,
    endDate,
    searchTerm,
  ]);

  const columns = useMemo(() => {
    if (filteredData.length > 0) return Object.keys(filteredData[0]);
    if (rawRows.length > 0) return Object.keys(rawRows[0]);
    return [];
  }, [filteredData, rawRows]);

  const getPeriodDescription = (): string => {
    switch (periodMode) {
      case 'DAY':
        return `Day-wise: ${dayFilter}`;
      case 'MONTH':
        return `Monthly: ${monthFilter}`;
      case 'YEAR':
        return `Yearly: ${yearFilter}`;
      case 'RANGE':
        return `Date Range: ${startDate || 'Start'} to ${endDate || 'Present'}`;
      default:
        return 'All Time';
    }
  };

  const getPeriodSlug = (): string => {
    switch (periodMode) {
      case 'DAY':
        return `day_${dayFilter}`;
      case 'MONTH':
        return `monthly_${monthFilter}`;
      case 'YEAR':
        return `yearly_${yearFilter}`;
      case 'RANGE':
        return `${startDate}_to_${endDate}`;
      default:
        return 'all_time';
    }
  };

  const handleExportCsv = () => {
    exportToCsv(`happiiz_${selectedReport.toLowerCase()}_${getPeriodSlug()}`, filteredData);
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      const primaryColor: [number, number, number] = [103, 58, 183]; // #673AB7
      const darkColor: [number, number, number] = [17, 17, 17];
      const grayColor: [number, number, number] = [100, 116, 139];

      // Brand Header Banner
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 842, 66, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('HAPPIIZ GATE MANAGEMENT PLATFORM', 36, 32);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(235, 232, 255);
      doc.text(`Intelligence & Analytics Report: ${activeReportLabel}`, 36, 50);

      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 806, 50, { align: 'right' });

      // Scope & Filter Summary Card
      const selectedSocietyName =
        societies.find((s) => s.id === selectedSociety)?.societyName || 'All Tenant Societies';

      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('Applied Search & Time Filter Parameters', 36, 90);

      doc.setFillColor(244, 248, 252);
      doc.roundedRect(36, 98, 770, 38, 6, 6, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...grayColor);
      doc.text(
        `Period: ${getPeriodDescription()}   |   Society: ${selectedSocietyName}   |   Search Query: "${
          searchTerm.trim() || 'All Records'
        }"   |   Total Rows: ${filteredData.length}`,
        48,
        120
      );

      // Sanitize currency symbols for standard Helvetica font
      const sanitizeCell = (value: any) =>
        String(value ?? '').replace(/₹/g, 'INR ');

      const head = [columns];
      const body = filteredData.map((row) =>
        columns.map((col) => sanitizeCell(row[col]))
      );

      autoTable(doc, {
        startY: 150,
        head,
        body:
          body.length > 0
            ? body
            : [['No matching records found for the selected search or period filters.']],
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        margin: { left: 36, right: 36 },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Happiiz Gate Super Admin Intelligence • ${activeReportLabel}`,
            36,
            572
          );
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            806,
            572,
            { align: 'right' }
          );
        },
      });

      doc.save(`happiiz_${selectedReport.toLowerCase()}_${getPeriodSlug()}.pdf`);
    } catch (err) {
      console.error('[ReportsSection] PDF generation failed:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setSelectedSociety('');
    setSearchTerm('');
    setPeriodMode('ALL');
    setDayFilter(todayIso);
    setMonthFilter(currentMonthIso);
    setYearFilter(currentYear);
    setStartDate('2026-01-01');
    setEndDate('2026-12-31');
  };

  const availableYears = Array.from(
    new Set([currentYear, '2026', '2025', '2024'])
  ).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">
            Platform Analytics & Intelligence Reports
          </h2>
          <p className="text-xs text-[#A9B0B8]">
            Search, filter by Day / Month / Year, and export compliance reports as PDF or CSV
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6F1F5] hover:bg-[#F1F9FC] text-xs font-bold text-[#111111] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#A9B0B8]" />
            <span>Print Report</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#673AB7]/30 bg-purple-50 hover:bg-purple-100 text-[#673AB7] text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition-colors cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Matrix */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Search Input */}
          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1">
              Search Report Records
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search entity, ID, name, status, city..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#673AB7]"
              />
            </div>
          </div>

          {/* Report Category */}
          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1">
              Select Report Category
            </label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none focus:border-[#673AB7]"
            >
              {reportTypes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Society Filter */}
          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1">
              Filter by Society
            </label>
            <select
              value={selectedSociety}
              onChange={(e) => setSelectedSociety(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none focus:border-[#673AB7]"
            >
              <option value="">All Tenant Societies</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.societyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Period Granularity Bar: All Time / Day-wise / Monthly / Yearly / Custom Range */}
        <div className="pt-3 border-t border-[#E6F1F5] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#673AB7]" />
              Report Period:
            </span>
            {(
              [
                { id: 'ALL', label: 'All Time' },
                { id: 'DAY', label: 'Day-wise' },
                { id: 'MONTH', label: 'Monthly' },
                { id: 'YEAR', label: 'Yearly' },
                { id: 'RANGE', label: 'Custom Range' },
              ] as { id: ReportPeriodMode; label: string }[]
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setPeriodMode(mode.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodMode === mode.id
                    ? 'bg-[#673AB7] text-white shadow-xs'
                    : 'bg-[#F1F9FC] text-[#64748B] hover:text-[#111111] border border-[#E6F1F5]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {periodMode === 'DAY' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#64748B]">Select Date:</span>
                <input
                  type="date"
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E6F1F5] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            )}

            {periodMode === 'MONTH' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#64748B]">Select Month:</span>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E6F1F5] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            )}

            {periodMode === 'YEAR' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#64748B]">Select Year:</span>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E6F1F5] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#673AB7]"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Year {yr}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {periodMode === 'RANGE' && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E6F1F5] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
                <span className="text-xs text-[#94A3B8] font-bold">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E6F1F5] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E6F1F5] hover:bg-[#F1F9FC] text-[11px] font-bold text-[#64748B] cursor-pointer"
              title="Reset Search & Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E6F1F5] bg-[#F1F9FC]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#673AB7]" />
            <span className="font-extrabold text-xs text-[#111111]">
              {activeReportLabel} ({filteredData.length} records matched)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#64748B]">
              {getPeriodDescription()}
            </span>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-[#673AB7] text-[11px] font-bold cursor-pointer transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Save Filtered PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC]/40 text-[#64748B] font-bold uppercase tracking-wider">
                {columns.map((col) => (
                  <th key={col} className="py-3 px-4 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(columns.length, 1)}
                    className="py-10 px-4 text-center text-[#64748B]"
                  >
                    No records match your current search or period filter. Try switching to{' '}
                    <button
                      type="button"
                      onClick={() => setPeriodMode('ALL')}
                      className="text-[#673AB7] font-bold underline cursor-pointer"
                    >
                      All Time
                    </button>{' '}
                    or clearing the search box.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F1F9FC]/40 transition-colors">
                    {columns.map((col, vIdx) => (
                      <td key={vIdx} className="py-3.5 px-4 font-medium text-[#111111] whitespace-nowrap">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
