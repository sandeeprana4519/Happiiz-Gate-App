/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Society } from '../../types/society';
import { exportToCsv } from '../../services/firebase/superadmin.service';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';

interface ReportsSectionProps {
  societies: Society[];
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({ societies }) => {
  const [selectedReport, setSelectedReport] = useState<string>('REVENUE');
  const [selectedSociety, setSelectedSociety] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-11-30');

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

  // Sample verified data generator based on selected report
  const generateSampleData = () => {
    switch (selectedReport) {
      case 'REVENUE':
        return [
          { TxnNo: 'TXN-9811', Entity: 'Emerald Heights', Amount: '₹9,999', Status: 'SUCCESS', Date: '2026-11-01', Method: 'UPI' },
          { TxnNo: 'TXN-9812', Entity: 'Silver Oak', Amount: '₹11,397', Status: 'SUCCESS', Date: '2026-09-01', Method: 'NetBanking' },
          { TxnNo: 'TXN-9813', Entity: 'Vertex Clean', Amount: '₹1,450', Status: 'SUCCESS', Date: '2026-11-02', Method: 'Bank Transfer' },
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
        }));
      case 'GUARD_SHIFT':
        return [
          { Name: 'Bahadur Singh', Agency: 'SIS', Gate: 'Gate #1', Shift: 'DAY', Society: 'Emerald Heights', Status: 'ACTIVE' },
          { Name: 'Manoj Kumar', Agency: 'SIS', Gate: 'Gate #2', Shift: 'NIGHT', Society: 'Emerald Heights', Status: 'ACTIVE' },
          { Name: 'Dilip Rathi', Agency: 'Black Belt', Gate: 'East Gate', Shift: 'ROTATIONAL', Society: 'Silver Oak', Status: 'ACTIVE' },
        ];
      case 'PARTNER_KYC':
        return [
          { Business: 'Vertex Facilities', Categories: 'Cleaning, Pest Control', Status: 'ACTIVE', VerifiedDate: '2026-02-21' },
          { Business: 'Apex Electro HVAC', Categories: 'Electrical, AC', Status: 'PENDING', VerifiedDate: 'Pending' },
        ];
      default:
        return [
          { Field1: 'Record A', Value: 'Verified', Timestamp: '2026-11-04' },
          { Field1: 'Record B', Value: 'Active', Timestamp: '2026-11-05' },
        ];
    }
  };

  const previewData = generateSampleData();

  const handleExport = () => {
    exportToCsv(`happiiz_${selectedReport.toLowerCase()}_report`, previewData);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">Platform Analytics & Intelligence Reports</h2>
          <p className="text-xs text-[#A9B0B8]">
            Generate compliance exports, financial summaries, and society operational metrics
          </p>
        </div>

        <div className="flex gap-2">
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
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1">Select Report Category</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
            >
              {reportTypes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1">Filter by Society</label>
            <select
              value={selectedSociety}
              onChange={(e) => setSelectedSociety(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
            >
              <option value="">All Tenant Societies</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.societyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E6F1F5] bg-[#F1F9FC]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#673AB7]" />
            <span className="font-extrabold text-xs text-[#111111]">
              Report Preview ({previewData.length} records generated)
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#A9B0B8]">
            Date Window: {startDate} to {endDate}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC]/40 text-[#A9B0B8] font-bold uppercase tracking-wider">
                {Object.keys(previewData[0] || {}).map((col) => (
                  <th key={col} className="py-3 px-4">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {previewData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F1F9FC]/40 transition-colors">
                  {Object.values(row).map((val: any, vIdx) => (
                    <td key={vIdx} className="py-3.5 px-4 font-medium text-[#111111]">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
