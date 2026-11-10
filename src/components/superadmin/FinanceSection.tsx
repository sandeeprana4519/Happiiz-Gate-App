/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FinancialTransaction } from '../../types/admin';
import { exportToCsv } from '../../services/firebase/superadmin.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DollarSign,
  Search,
  Download,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  FileText,
  Filter,
  Building2,
  X,
  Eye,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface FinanceSectionProps {
  transactions: FinancialTransaction[];
  monthlyRevenue: number;
  yearlyRevenue: number;
}

export const FinanceSection: React.FC<FinanceSectionProps> = ({
  transactions,
  monthlyRevenue,
  yearlyRevenue,
}) => {
  // Search & Status filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');

  // KPI View Toggle: Monthly vs Yearly vs All-Time
  const [kpiViewMode, setKpiViewMode] = useState<'MONTHLY' | 'YEARLY' | 'ALL_TIME'>('MONTHLY');

  // Date Filters
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected Transaction for Invoice / Receipt Modal
  const [selectedTxn, setSelectedTxn] = useState<FinancialTransaction | null>(null);

  // Filter Transactions based on all active criteria
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Search Query
      const invoiceId = t.invoiceId || t.transactionNumber.replace('HPZ-TXN', 'INV');
      const matchesSearch =
        t.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.gatewayReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Status Filter
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

      // 3. Date Filters
      const txnDate = new Date(t.paymentDate);
      const txnYear = txnDate.getFullYear().toString();
      const txnMonth = (txnDate.getMonth() + 1).toString().padStart(2, '0');

      const matchesYear = selectedYear === 'ALL' || txnYear === selectedYear;
      const matchesMonth = selectedMonth === 'ALL' || txnMonth === selectedMonth;

      let matchesDateRange = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txnDate < start) matchesDateRange = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txnDate > end) matchesDateRange = false;
      }

      return matchesSearch && matchesStatus && matchesYear && matchesMonth && matchesDateRange;
    });
  }, [transactions, searchTerm, statusFilter, selectedYear, selectedMonth, startDate, endDate]);

  // Aggregate Calculations
  const totalAllTimeCollected = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalFilteredCollected = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalPendingAmount = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'PENDING')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Current Month Collection (November 2026 or active month)
  const currentMonthCollection = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();
    return transactions
      .filter((t) => {
        if (t.status !== 'SUCCESS') return false;
        const d = new Date(t.paymentDate);
        return d.getFullYear() === currYear && d.getMonth() === currMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Current Year Collection (2026)
  const currentYearCollection = useMemo(() => {
    const currYear = new Date().getFullYear();
    return transactions
      .filter((t) => {
        if (t.status !== 'SUCCESS') return false;
        const d = new Date(t.paymentDate);
        return d.getFullYear() === currYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSelectedYear('ALL');
    setSelectedMonth('ALL');
    setStartDate('');
    setEndDate('');
  };

  // Export CSV
  const handleExportCsv = () => {
    exportToCsv('happiiz_gate_revenue_ledger', filteredTransactions);
  };

  // Export PDF Report using jsPDF + AutoTable
  const handleExportPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      // Colors
      const primaryColor = [103, 58, 183]; // #673AB7
      const darkColor = [17, 17, 17];
      const grayColor = [100, 116, 139];

      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 842, 65, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('HAPPIIZ GATE MANAGEMENT PLATFORM', 36, 32);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(230, 230, 255);
      doc.text('Revenue & Collections Ledger Audit Statement', 36, 48);

      const generatedOn = new Date().toLocaleString();
      doc.setFontSize(9);
      doc.text(`Generated: ${generatedOn}`, 806, 48, { align: 'right' });

      // Filter summary metadata
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Report Scope & Filter Parameters', 36, 88);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      const filterSummary = `Period Filter: ${
        selectedYear !== 'ALL' ? `Year ${selectedYear}` : 'All Years'
      } ${selectedMonth !== 'ALL' ? `• Month ${selectedMonth}` : ''} ${
        startDate || endDate ? `• Date Range: ${startDate || 'Start'} to ${endDate || 'Now'}` : ''
      } | Status: ${statusFilter} | Search: "${searchTerm || 'All Records'}"`;
      doc.text(filterSummary, 36, 102);

      // KPI Metric Summary Bar in PDF
      const pdfTotalCollected = filteredTransactions
        .filter((t) => t.status === 'SUCCESS')
        .reduce((sum, t) => sum + t.amount, 0);
      const pdfTotalPending = filteredTransactions
        .filter((t) => t.status === 'PENDING')
        .reduce((sum, t) => sum + t.amount, 0);

      doc.setFillColor(245, 248, 252);
      doc.roundedRect(36, 115, 770, 40, 6, 6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`Total Records: ${filteredTransactions.length}`, 50, 138);
      doc.text(`Total Settled Revenue: INR ${pdfTotalCollected.toLocaleString()}`, 200, 138);
      doc.text(`Pending in Escrow: INR ${pdfTotalPending.toLocaleString()}`, 450, 138);
      doc.text(`Collection View: ${kpiViewMode}`, 680, 138);

      // AutoTable
      const tableData = filteredTransactions.map((t, idx) => {
        const invId = t.invoiceId || t.transactionNumber.replace('HPZ-TXN', 'INV');
        const formattedDate = new Date(t.paymentDate).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        });
        return [
          (idx + 1).toString(),
          formattedDate,
          invId,
          t.entityName,
          t.billingCycle || 'Monthly',
          t.paymentMethod || 'UPI',
          t.status,
          `INR ${t.amount.toLocaleString()}`,
        ];
      });

      autoTable(doc, {
        startY: 168,
        head: [['#', 'Payment Date', 'Invoice ID', 'Society / Corporate Client', 'Billing Cycle', 'Payment Mode', 'Status', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [103, 58, 183],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 70 },
          2: { cellWidth: 95 },
          3: { cellWidth: 200 },
          4: { cellWidth: 80 },
          5: { cellWidth: 85 },
          6: { cellWidth: 75 },
          7: { cellWidth: 90, halign: 'right', fontStyle: 'bold' },
        },
        foot: [[
          '',
          '',
          '',
          'TOTAL SETTLED SUM',
          '',
          '',
          `${filteredTransactions.filter((t) => t.status === 'SUCCESS').length} Settled`,
          `INR ${pdfTotalCollected.toLocaleString()}`,
        ]],
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [17, 17, 17],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'right',
        },
        didDrawPage: (data) => {
          // Footer
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          const pageStr = `Page ${data.pageNumber}`;
          doc.text(pageStr, 806, 575, { align: 'right' });
          doc.text('Happiiz Security & Financial Operations Ledger • Confidential Internal Document', 36, 575);
        },
      });

      // Save PDF directly to user download folder
      const filenameDate = new Date().toISOString().split('T')[0];
      doc.save(`Happiiz_Revenue_Report_${filenameDate}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Billing & Revenue Ledger
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            Multi-society collection reconciliation, gateway audit trails, and automated financial statements
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Download formatted revenue statement PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Export to PDF</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-[#673AB7]" />
            <span>CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS + VIEW TOGGLE SWITCH */}
      <div className="space-y-3">
        {/* View Toggle Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Revenue Analytics Horizon:
          </span>

          {/* Toggle Switch */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <button
              type="button"
              onClick={() => setKpiViewMode('MONTHLY')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                kpiViewMode === 'MONTHLY'
                  ? 'bg-white text-[#673AB7] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Monthly View
            </button>
            <button
              type="button"
              onClick={() => setKpiViewMode('YEARLY')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                kpiViewMode === 'YEARLY'
                  ? 'bg-white text-[#673AB7] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Yearly View
            </button>
            <button
              type="button"
              onClick={() => setKpiViewMode('ALL_TIME')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                kpiViewMode === 'ALL_TIME'
                  ? 'bg-white text-[#673AB7] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All-Time Aggregate
            </button>
          </div>
        </div>

        {/* 4 Required KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Total Collection (Kept as is) */}
          <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Total Collection
            </span>
            <div className="text-2xl font-black text-gray-900 font-mono">
              ₹{totalAllTimeCollected.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Settled Platform Revenue
            </span>
          </div>

          {/* 2. Monthly Collection (Renamed from Monthly Recurring) */}
          <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
            kpiViewMode === 'MONTHLY'
              ? 'bg-purple-50/40 border-purple-200 ring-2 ring-purple-100'
              : 'bg-white border-[#E6F1F5]'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Monthly Collection
              </span>
              {kpiViewMode === 'MONTHLY' && (
                <span className="text-[10px] font-bold text-[#673AB7] bg-purple-100 px-1.5 py-0.2 rounded">
                  Active Focus
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-[#673AB7] font-mono">
              ₹{(currentMonthCollection || monthlyRevenue).toLocaleString()}
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              Current Month Realized Volume
            </span>
          </div>

          {/* 3. Annual Collection (Renamed from Annual Run Rate) */}
          <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
            kpiViewMode === 'YEARLY'
              ? 'bg-indigo-50/40 border-indigo-200 ring-2 ring-indigo-100'
              : 'bg-white border-[#E6F1F5]'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Annual Collection
              </span>
              {kpiViewMode === 'YEARLY' && (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                  Active Focus
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-gray-900 font-mono">
              ₹{(currentYearCollection || yearlyRevenue).toLocaleString()}
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              Cumulative Year 2026 Volume
            </span>
          </div>

          {/* 4. Pending Collection (Kept as is) */}
          <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Pending Collection
            </span>
            <div className="text-2xl font-black text-amber-600 font-mono">
              ₹{totalPendingAmount.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-600 font-medium inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> In Invoicing & Escrow
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & DATE CONTROLS BAR */}
      <div className="p-4 bg-white rounded-2xl border border-[#E6F1F5] shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[#673AB7]" />
            <span className="text-xs font-bold text-gray-800">
              Filter Revenue Ledger ({filteredTransactions.length} of {transactions.length} records)
            </span>
          </div>

          {(searchTerm || statusFilter !== 'ALL' || selectedYear !== 'ALL' || selectedMonth !== 'ALL' || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Search Query */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Society, Invoice #, Ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-900 focus:bg-white focus:border-[#673AB7] focus:outline-none"
            />
          </div>

          {/* 2. Month-Wise Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:border-[#673AB7] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Months</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* 3. Year-Wise Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:bg-white focus:border-[#673AB7] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Years</option>
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
              <option value="2024">Year 2024</option>
            </select>
          </div>

          {/* 4. Specific Date Range (Start -> End) */}
          <div className="flex items-center gap-1.5 lg:col-span-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start Date"
              className="w-1/2 p-1.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-700 focus:bg-white focus:border-[#673AB7] focus:outline-none"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="End Date"
              className="w-1/2 p-1.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-700 focus:bg-white focus:border-[#673AB7] focus:outline-none"
            />
          </div>

          {/* 5. Status Filter */}
          <div className="flex items-center gap-1 bg-gray-100/70 p-1 rounded-xl">
            {(['ALL', 'SUCCESS', 'PENDING', 'FAILED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer text-center ${
                  statusFilter === st
                    ? 'bg-white text-[#673AB7] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* REVENUE BREAKDOWN & TRANSACTIONS TABLE */}
      <div className="rounded-2xl bg-white border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC] text-[#555555] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-[24%]">Society / Company Name</th>
                <th className="py-3 px-3 w-[15%]">Invoice ID & Txn #</th>
                <th className="py-3 px-3 w-[13%]">Amount</th>
                <th className="py-3 px-3 w-[14%]">Payment Date</th>
                <th className="py-3 px-3 w-[12%]">Billing Cycle</th>
                <th className="py-3 px-3 w-[11%]">Payment Mode</th>
                <th className="py-3 px-3 w-[8%] text-center">Status</th>
                <th className="py-3 px-3 w-[3%] text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No revenue records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const invoiceId = t.invoiceId || t.transactionNumber.replace('HPZ-TXN', 'INV');
                  return (
                    <tr key={t.id} className="hover:bg-[#F9FCFD] transition-colors">
                      {/* 1. Society / Company Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#673AB7] shrink-0" />
                          <span className="truncate">{t.entityName}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate pl-5">
                          {t.description}
                        </div>
                      </td>

                      {/* 2. Invoice ID & Txn Number */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-purple-900 text-xs">
                          {invoiceId}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {t.transactionNumber}
                        </div>
                      </td>

                      {/* 3. Amount */}
                      <td className="py-3 px-3 font-mono font-black text-xs text-gray-900">
                        ₹{t.amount.toLocaleString()}
                      </td>

                      {/* 4. Payment Date */}
                      <td className="py-3 px-3 text-gray-700">
                        <div className="font-mono text-xs">
                          {new Date(t.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {new Date(t.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* 5. Billing Cycle */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {t.billingCycle || 'Monthly'}
                        </span>
                      </td>

                      {/* 6. Payment Mode */}
                      <td className="py-3 px-3 font-medium text-gray-800 text-[11px]">
                        {t.paymentMethod}
                      </td>

                      {/* 7. Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : t.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.status === 'SUCCESS'
                                ? 'bg-emerald-500'
                                : t.status === 'PENDING'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                          {t.status}
                        </span>
                      </td>

                      {/* 8. Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTxn(t)}
                          className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#673AB7] transition cursor-pointer shadow-2xs"
                          title="View Invoice & Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Summary */}
            {filteredTransactions.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-900 text-xs">
                  <td colSpan={2} className="py-3 px-4">
                    Total Filtered Summary ({filteredTransactions.length} records)
                  </td>
                  <td className="py-3 px-3 font-mono font-black text-[#673AB7]">
                    ₹{totalFilteredCollected.toLocaleString()}
                  </td>
                  <td colSpan={5} className="py-3 px-3 text-right text-gray-500 font-medium">
                    Showing settled & pending collections
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: INVOICE & RECEIPT PREVIEW */}
      {/* ========================================================================= */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#673AB7] flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Payment Receipt & Invoice
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {selectedTxn.invoiceId || selectedTxn.transactionNumber.replace('HPZ-TXN', 'INV')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Client / Society:</span>
                <strong className="text-gray-900">{selectedTxn.entityName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction Ref:</span>
                <span className="font-mono text-gray-700">{selectedTxn.transactionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gateway Ref:</span>
                <span className="font-mono text-gray-700">{selectedTxn.gatewayReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Date:</span>
                <span className="text-gray-900 font-medium">
                  {new Date(selectedTxn.paymentDate).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Billing Cycle:</span>
                <span className="text-gray-900 font-medium">{selectedTxn.billingCycle || 'Monthly'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Mode:</span>
                <span className="text-gray-900 font-medium">{selectedTxn.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    selectedTxn.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedTxn.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedTxn.status}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                <span className="font-bold text-gray-900">Total Settled Amount:</span>
                <span className="text-xl font-black text-[#673AB7] font-mono">
                  ₹{selectedTxn.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
