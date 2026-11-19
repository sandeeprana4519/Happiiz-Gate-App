import React, { useState } from 'react';
import { 
  Download, 
  FileDown,
  Printer, 
  Settings, 
  Bell, 
  Globe, 
  Check, 
  CheckCircle2, 
  Shield, 
  CreditCard 
} from 'lucide-react';
import { SocietyDetailedSettings, SocietyAuditLogEntry } from '../../types/societyAdmin';
import { Society } from '../../types/society';
import { exportSocietyReportToCSV } from '../../services/firebase/societyAdmin.service';
import { SocietyPdfExportToolbar } from './SocietyPdfExportToolbar';
import {
  SocietyPeriodMode,
  matchesSocietyPeriod,
  buildSocietyPeriodLabel,
  buildSocietySlug,
  exportSocietyPdf,
  normalizeSocietyIsoDate,
} from './societyPdfExportUtils';

// -------------------------------------------------------------
// MODULE 18: REPORTS & EXPORTS
// -------------------------------------------------------------
interface ReportsViewProps {
  society: Society;
  data: {
    residents: any[];
    flats: any[];
    visitors: any[];
    invoices: any[];
    complaints: any[];
    guards: any[];
    amenities: any[];
    vehicles?: any[];
    helpers?: any[];
    bookings?: any[];
    notices?: any[];
    emergencyAlerts?: any[];
    auditLogs?: SocietyAuditLogEntry[];
  };
}

export const SocietyReportsView: React.FC<ReportsViewProps> = ({
  society,
  data
}) => {
  const [reportType, setReportType] = useState<string>('VISITOR_LOG');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [auditSearch, setAuditSearch] = useState('');

  const auditLogs = data.auditLogs || [];
  const vehiclesList = data.vehicles || [];
  const helpersList = data.helpers || [];
  const bookingsList = data.bookings || [];
  const emergencyList = data.emergencyAlerts || [];

  const matchesReportDate = (rawDate?: string): boolean => {
    if (periodMode !== 'ALL') {
      return matchesSocietyPeriod(rawDate, periodMode, dayValue, monthValue, yearValue);
    }
    if (useCustomRange) {
      const iso = normalizeSocietyIsoDate(rawDate);
      if (!iso) return false;
      if (startDate && iso < startDate) return false;
      if (endDate && iso > endDate) return false;
      return true;
    }
    return true;
  };

  const getFilteredDataset = (typeId: string) => {
    switch (typeId) {
      case 'VISITOR_LOG':
        return data.visitors.filter((v) =>
          matchesReportDate(v.checkInTime || v.expectedTime || v.createdAt)
        );
      case 'OVERSTAY_REPORT':
        return data.visitors.filter(
          (v) =>
            (v.status === 'CheckedIn' || v.status === 'CHECKED_IN' || v.status === 'INSIDE') &&
            matchesReportDate(v.checkInTime || v.expectedTime || v.createdAt)
        );
      case 'RESIDENT_ROSTER':
        return data.residents.filter((r) => matchesReportDate(r.joinedAt || r.moveInDate));
      case 'MAINTENANCE_DUES':
        return data.invoices.filter((i) =>
          matchesReportDate(i.dueDate || i.paidDate || i.createdAt)
        );
      case 'FINANCIAL_SUMMARY':
        return data.invoices.filter(
          (i) => i.status === 'PAID' && matchesReportDate(i.paidDate || i.dueDate || i.createdAt)
        );
      case 'HELPDESK_REPORT':
        return data.complaints.filter((c) => matchesReportDate(c.createdAt || c.updatedAt));
      case 'GUARD_ATTENDANCE':
        return data.guards.filter((g) => matchesReportDate(g.createdAt));
      case 'AMENITY_UTILIZATION':
        if (bookingsList.length > 0) {
          return bookingsList.filter((b) => matchesReportDate(b.bookingDate || b.createdAt));
        }
        return data.amenities;
      case 'VEHICLE_DIRECTORY':
        return vehiclesList.filter((v) =>
          matchesReportDate(v.createdAt || v.updatedAt || v.lastEntryAt)
        );
      case 'DOMESTIC_STAFF':
        return helpersList.filter((h) => matchesReportDate(h.createdAt || h.updatedAt));
      case 'EMERGENCY_LOG':
        return emergencyList.filter((e) => matchesReportDate(e.timestamp || e.resolvedAt));
      case 'AUDIT_TRAIL':
        return auditLogs.filter((l) => matchesReportDate(l.timestamp));
      default:
        return [];
    }
  };

  const buildReportExportSpec = (
    typeId: string
  ): {
    title: string;
    subtitle: string;
    columns: string[];
    rows: Record<string, any>[];
  } => {
    const items = getFilteredDataset(typeId);
    switch (typeId) {
      case 'VISITOR_LOG':
      case 'OVERSTAY_REPORT': {
        const columns = ['Visitor ID', 'Visitor Name', 'Phone', 'Category', 'Flat No', 'Status', 'Check-In Time'];
        const rows = items.map((v) => ({
          'Visitor ID': v.id,
          'Visitor Name': v.visitorName || 'Guest',
          Phone: v.visitorPhone || '—',
          Category: v.visitorType || 'Visitor',
          'Flat No': v.hostFlat || '—',
          Status: v.status,
          'Check-In Time': normalizeSocietyIsoDate(v.checkInTime || v.createdAt) || '—',
        }));
        return {
          title: typeId === 'OVERSTAY_REPORT' ? 'Visitor Overstay & Security Audit' : 'Daily & Monthly Visitor Ingress Log',
          subtitle: 'Security & Gate Operations • Verified Guest, Cab & Delivery Ingress Audit',
          columns,
          rows,
        };
      }
      case 'RESIDENT_ROSTER': {
        const columns = ['Resident UID', 'Full Name', 'Phone', 'Building', 'Flat No', 'Type', 'Membership', 'Joined Date'];
        const rows = items.map((r) => ({
          'Resident UID': r.uid,
          'Full Name': r.fullName,
          Phone: r.phoneNumber || '—',
          Building: r.buildingName || '—',
          'Flat No': r.flatNumber,
          Type: r.occupantType,
          Membership: r.membershipStatus,
          'Joined Date': normalizeSocietyIsoDate(r.joinedAt || r.moveInDate) || '—',
        }));
        return {
          title: 'Complete Resident & Flat Directory',
          subtitle: 'People & Households • Verified Flat Owners & Tenant Directory',
          columns,
          rows,
        };
      }
      case 'MAINTENANCE_DUES':
      case 'FINANCIAL_SUMMARY': {
        const columns = ['Invoice No', 'Flat No', 'Resident Name', 'Category', 'Amount', 'Due Date', 'Status', 'Receipt / UTR', 'Paid Date'];
        const rows = items.map((i) => ({
          'Invoice No': i.invoiceNumber,
          'Flat No': i.flatNumber,
          'Resident Name': i.residentName,
          Category: i.category || 'Monthly Maintenance',
          Amount: `INR ${Number(i.amount || 0).toLocaleString('en-IN')}`,
          'Due Date': i.dueDate || '—',
          Status: i.status,
          'Receipt / UTR': i.receiptNumber || '—',
          'Paid Date': normalizeSocietyIsoDate(i.paidDate) || '—',
        }));
        return {
          title:
            typeId === 'FINANCIAL_SUMMARY'
              ? 'Society Financial Collections Summary'
              : 'Society Maintenance Dues & Arrears',
          subtitle: 'Finance & Administration • Maintenance Billing & Bank Reconciliation Ledger',
          columns,
          rows,
        };
      }
      case 'GUARD_ATTENDANCE': {
        const columns = ['Guard ID', 'Name', 'Phone', 'Badge No', 'Assigned Gate', 'Shift', 'Status', 'Added Date'];
        const rows = items.map((g) => ({
          'Guard ID': g.id,
          Name: g.name,
          Phone: g.phoneNumber || '—',
          'Badge No': g.badgeNumber || '—',
          'Assigned Gate': g.gateAssigned || 'Main Gate',
          Shift: g.shift || 'DAY',
          Status: g.status,
          'Added Date': normalizeSocietyIsoDate(g.createdAt) || '—',
        }));
        return {
          title: 'Security Guard Duty & Gate Coverage',
          subtitle: 'Security & Access Gates • Roster Assignments & Shift Coverage',
          columns,
          rows,
        };
      }
      case 'AMENITY_UTILIZATION': {
        if (bookingsList.length > 0) {
          const columns = ['Amenity Name', 'Booked By', 'Flat No', 'Booking Date', 'Time Slot', 'Charge', 'Status'];
          const rows = items.map((b) => ({
            'Amenity Name': b.amenityName,
            'Booked By': b.bookedByName,
            'Flat No': b.flatNumber,
            'Booking Date': normalizeSocietyIsoDate(b.bookingDate) || b.bookingDate || '—',
            'Time Slot': b.timeSlot,
            Charge: b.amount === 0 ? 'Free' : `INR ${b.amount}`,
            Status: b.status,
          }));
          return {
            title: 'Amenity Bookings & Club Utilization',
            subtitle: 'Community & Facilities • Facility Reservations & Usage Audit',
            columns,
            rows,
          };
        }
        const columns = ['Amenity ID', 'Name', 'Operating Hours', 'Hourly Charge', 'Max Capacity', 'Status'];
        const rows = items.map((a) => ({
          'Amenity ID': a.id,
          Name: a.name,
          'Operating Hours': a.operatingHours,
          'Hourly Charge': a.hourlyCharge === 0 ? 'Free' : `INR ${a.hourlyCharge}`,
          'Max Capacity': String(a.maxCapacity),
          Status: a.status,
        }));
        return {
          title: 'Amenity Catalog & Facility Utilization',
          subtitle: 'Community & Facilities • Registered Society Amenities Overview',
          columns,
          rows,
        };
      }
      case 'VEHICLE_DIRECTORY': {
        const columns = ['Plate Number', 'Vehicle Type', 'Make & Model', 'Flat No', 'Parking Slot', 'Registered Date'];
        const rows = items.map((v) => ({
          'Plate Number': v.plateNumber || v.registrationNumber || '—',
          'Vehicle Type': v.vehicleType || 'Car',
          'Make & Model': v.makeModel || '—',
          'Flat No': v.flatNumber || '—',
          'Parking Slot': v.parkingSlot || 'P-OPEN',
          'Registered Date': normalizeSocietyIsoDate(v.createdAt || v.updatedAt) || '—',
        }));
        return {
          title: 'Registered Vehicles & Parking Slots Directory',
          subtitle: 'Security & Access Gates • Society Vehicle & ANPR Authorization Register',
          columns,
          rows,
        };
      }
      case 'DOMESTIC_STAFF': {
        const columns = ['Helper ID', 'Gate Pass No', 'Name', 'Role', 'Phone', 'Flat No', 'Guard OTP', 'Police Verified', 'Status'];
        const rows = items.map((h) => ({
          'Helper ID': h.helperId || h.id,
          'Gate Pass No': h.gatePassNumber || `GP-HLP-${h.passCode}`,
          Name: h.name,
          Role: h.role,
          Phone: h.phone,
          'Flat No': h.flatNumber,
          'Guard OTP': h.passCode,
          'Police Verified': h.policeVerificationVerified ? 'Verified' : 'Pending',
          Status: h.status,
        }));
        return {
          title: 'Domestic Helpers & GatePass Audit',
          subtitle: 'People & Households • Verified Staff & Digital Gate Pass Register',
          columns,
          rows,
        };
      }
      case 'EMERGENCY_LOG': {
        const columns = ['Alert Type', 'Flat No', 'Reported By', 'Phone', 'Timestamp', 'Status', 'Resolution Notes'];
        const rows = items.map((e) => ({
          'Alert Type': e.alertType,
          'Flat No': e.flatNumber,
          'Reported By': e.reportedByName,
          Phone: e.reportedByPhone || '—',
          Timestamp: normalizeSocietyIsoDate(e.timestamp) || e.timestamp || '—',
          Status: e.status,
          'Resolution Notes': e.responseNotes || '—',
        }));
        return {
          title: 'Emergency SOS Panic Button Incidents',
          subtitle: 'Security & Emergency • Historical SOS Alerts & Response Resolution Log',
          columns,
          rows,
        };
      }
      case 'AUDIT_TRAIL': {
        const columns = ['Timestamp', 'Action Type', 'Actor Name', 'Role', 'Description', 'IP Address'];
        const rows = items.map((l) => ({
          Timestamp: normalizeSocietyIsoDate(l.timestamp) || l.timestamp,
          'Action Type': l.actionType,
          'Actor Name': l.actorName,
          Role: l.actorRole,
          Description: l.targetDescription,
          'IP Address': l.ipAddress || '192.168.1.1',
        }));
        return {
          title: 'System Audit Trail & Activity Log',
          subtitle: 'Compliance & Security • Immutable Administrative Action History',
          columns,
          rows,
        };
      }
      case 'HELPDESK_REPORT':
      default: {
        const columns = ['Ticket No', 'Subject', 'Resident', 'Flat No', 'Category', 'Priority', 'Status', 'Created Date'];
        const rows = items.map((c) => ({
          'Ticket No': c.complaintNumber || c.id,
          Subject: c.subject,
          Resident: c.submittedByName,
          'Flat No': c.flatNumber,
          Category: c.category,
          Priority: c.priority,
          Status: c.status,
          'Created Date': normalizeSocietyIsoDate(c.createdAt || c.updatedAt) || '—',
        }));
        return {
          title: 'HelpDesk Tickets & Resolution Report',
          subtitle: 'Community & Facilities • Resident Complaints & Service SLA Log',
          columns,
          rows,
        };
      }
    }
  };

  const reportDefinitions = [
    { id: 'VISITOR_LOG', name: '1. Daily & Monthly Visitor Ingress Log', count: getFilteredDataset('VISITOR_LOG').length, desc: 'Complete logs of guests, cabs, deliveries and service entries' },
    { id: 'OVERSTAY_REPORT', name: '2. Visitor Overstay & Security Audit', count: getFilteredDataset('OVERSTAY_REPORT').length, desc: 'Visitors exceeding typical durations on society grounds' },
    { id: 'RESIDENT_ROSTER', name: '3. Complete Resident & Flat Directory', count: getFilteredDataset('RESIDENT_ROSTER').length, desc: 'All owners, tenants, and unallocated flats' },
    { id: 'MAINTENANCE_DUES', name: '4. Society Maintenance Dues & Arrears', count: getFilteredDataset('MAINTENANCE_DUES').length, desc: 'Paid, pending, overdue invoices, and bank transaction refs' },
    { id: 'FINANCIAL_SUMMARY', name: '5. Society Financial Collections Summary', count: getFilteredDataset('FINANCIAL_SUMMARY').length, desc: 'Total realized maintenance, bank transfers, offline receipts' },
    { id: 'HELPDESK_REPORT', name: '6. HelpDesk Tickets & Resolution Times', count: getFilteredDataset('HELPDESK_REPORT').length, desc: 'Open, in progress, resolved maintenance tickets' },
    { id: 'GUARD_ATTENDANCE', name: '7. Security Guard Duty & Gate Coverage', count: getFilteredDataset('GUARD_ATTENDANCE').length, desc: 'Guard shift logs, assigned gates, attendance audit' },
    { id: 'AMENITY_UTILIZATION', name: '8. Amenity Bookings & Club Utilization', count: getFilteredDataset('AMENITY_UTILIZATION').length, desc: 'Clubhouse, tennis courts, swimming pool reservation metrics' },
    { id: 'VEHICLE_DIRECTORY', name: '9. Registered Vehicles & Parking Slots', count: getFilteredDataset('VEHICLE_DIRECTORY').length, desc: '4-wheelers, 2-wheelers, EVs, parking numbers' },
    { id: 'DOMESTIC_STAFF', name: '10. Domestic Helpers & GatePass Audit', count: getFilteredDataset('DOMESTIC_STAFF').length, desc: 'Active maids, cooks, drivers, gate pass codes' },
    { id: 'EMERGENCY_LOG', name: '11. Emergency SOS Panic Button Incidents', count: getFilteredDataset('EMERGENCY_LOG').length, desc: 'Historical fire, lift entrapment, medical alerts' },
    { id: 'AUDIT_TRAIL', name: '12. System Audit Trail & Activity Log', count: getFilteredDataset('AUDIT_TRAIL').length, desc: 'Immutable log of administrative approvals, overrides, and security events' }
  ];

  const getActivePeriodDescriptor = () => {
    if (periodMode !== 'ALL') {
      return buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    }
    if (useCustomRange) {
      return {
        label: `Custom Range (${startDate} to ${endDate})`,
        slug: `range_${startDate}_to_${endDate}`,
      };
    }
    return buildSocietyPeriodLabel('ALL', dayValue, monthValue, yearValue);
  };

  const handleExportCSV = () => {
    const spec = buildReportExportSpec(reportType);
    const period = getActivePeriodDescriptor();
    exportSocietyReportToCSV(`${society.societyCode}_${reportType}_${period.slug}`, spec.rows);
    setDownloadSuccess(`CSV report (${spec.title} • ${period.label}) generated and downloaded.`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleExportPDF = () => {
    const spec = buildReportExportSpec(reportType);
    const period = getActivePeriodDescriptor();
    const socSlug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: spec.title,
      subtitle: spec.subtitle,
      filename: `${socSlug}_${reportType.toLowerCase()}_${period.slug}`,
      columns: spec.columns,
      rows: spec.rows,
      filterSummary: `Period: ${period.label} · Report: ${spec.title} · Matching Records: ${spec.rows.length}`,
    });
    setDownloadSuccess(`PDF report (${spec.title} • ${period.label}) downloaded cleanly.`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleExportAllReportsPdf = () => {
    const period = getActivePeriodDescriptor();
    const socSlug = buildSocietySlug(society);
    const primary = buildReportExportSpec(reportType);
    const summaryColumns = ['Report ID', 'Report Name', 'Period Scope', 'Matching Records', 'Description'];
    const summaryRows = reportDefinitions.map((r) => ({
      'Report ID': r.id,
      'Report Name': r.name,
      'Period Scope': period.label,
      'Matching Records': String(r.count),
      Description: r.desc,
    }));

    exportSocietyPdf({
      society,
      title: 'Society Comprehensive Audit & Compliance Pack',
      subtitle: 'Finance & Administration • All-Module Activity Summary & Selected Detail',
      filename: `${socSlug}_complete_audit_pack_${period.slug}`,
      columns: summaryColumns,
      rows: summaryRows,
      filterSummary: `Period: ${period.label} · Primary Detail: ${primary.title} (${primary.rows.length} records)`,
      extraSections: [
        {
          sectionTitle: `${primary.title} (${primary.rows.length} records)`,
          columns: primary.columns,
          rows: primary.rows,
        },
      ],
    });
    setDownloadSuccess(`Comprehensive Audit Pack PDF (${period.label}) downloaded cleanly.`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedDef = reportDefinitions.find((r) => r.id === reportType);
  const periodInfo = getActivePeriodDescriptor();

  const filteredAuditLogs = auditLogs.filter((l) => {
    if (!matchesReportDate(l.timestamp)) return false;
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      l.actorName.toLowerCase().includes(q) ||
      l.actionType.toLowerCase().includes(q) ||
      l.targetDescription.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports, Exports & Audits</h2>
          <p className="text-sm text-gray-500">Generate monthly, yearly, or date-wise compliance PDF reports, CSV exports and audit statements</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 bg-white rounded-xl text-gray-700 text-xs font-semibold hover:bg-gray-50 transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 border border-purple-200 bg-purple-50 text-[#673AB7] rounded-xl text-xs font-semibold hover:bg-purple-100 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition shadow-xs cursor-pointer"
          >
            <FileDown className="w-4 h-4" /> Download Report PDF
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {downloadSuccess}
        </div>
      )}

      {/* Monthly / Yearly / Day-wise PDF Export Toolbar */}
      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={(mode) => {
          setPeriodMode(mode);
          if (mode !== 'ALL') setUseCustomRange(false);
        }}
        dayValue={dayValue}
        onDayValueChange={(v) => {
          setDayValue(v);
          setUseCustomRange(false);
        }}
        monthValue={monthValue}
        onMonthValueChange={(v) => {
          setMonthValue(v);
          setUseCustomRange(false);
        }}
        yearValue={yearValue}
        onYearValueChange={(v) => {
          setYearValue(v);
          setUseCustomRange(false);
        }}
        matchedCount={selectedDef?.count ?? 0}
        onExportPdf={handleExportPDF}
        pdfButtonLabel="Download Report PDF"
        secondaryExportLabel="Full Audit Pack PDF"
        onSecondaryExportPdf={handleExportAllReportsPdf}
        onResetPeriod={() => {
          setPeriodMode('ALL');
          setUseCustomRange(false);
        }}
      />

      {/* Date filter & Report Selector */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Select Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
          >
            {reportDefinitions.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Custom From Date {useCustomRange && <span className="text-teal-700 font-bold">(Active)</span>}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPeriodMode('ALL');
              setUseCustomRange(true);
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Custom To Date {useCustomRange && <span className="text-teal-700 font-bold">(Active)</span>}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPeriodMode('ALL');
              setUseCustomRange(true);
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
          />
        </div>
      </div>

      {/* Report Info Card */}
      <div className="bg-[#F1F9FC] p-5 rounded-2xl border border-[#BEE3F8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-900 text-base mb-1">{selectedDef?.name}</h3>
          <p className="text-xs text-gray-600">{selectedDef?.desc}</p>
          <p className="text-xs text-purple-700 font-semibold mt-2">
            Audit Scope: {society.societyName || society.name} ({society.societyCode}) • Period: {periodInfo.label}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-xs text-gray-500 block">Matching Records</span>
            <span className="text-2xl font-black text-[#673AB7] tabular-nums">{selectedDef?.count}</span>
          </div>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap"
          >
            <FileDown className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Report Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportDefinitions.map(rep => (
          <div
            key={rep.id}
            onClick={() => setReportType(rep.id)}
            className={`cursor-pointer p-4 rounded-2xl border transition ${
              reportType === rep.id
                ? 'border-[#673AB7] bg-purple-50/20 shadow-xs ring-1 ring-[#673AB7]'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-xs">{rep.name}</h4>
              <span className="text-xs font-mono font-bold text-[#673AB7] bg-[#F1F9FC] px-2 py-0.5 rounded-md tabular-nums">
                {rep.count}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">{rep.desc}</p>
          </div>
        ))}
      </div>

      {/* Live Immutable Audit Trail Viewer */}
      {reportType === 'AUDIT_TRAIL' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Immutable Audit Trail</h3>
              <p className="text-xs text-gray-500">Every privileged administrative action is cryptographically timestamped and attributed</p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter by actor, action or note..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-[#F1F9FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F1F9FC] text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Actor / Admin</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Description / Audit Notes</th>
                  <th className="py-2.5 px-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400">
                      No audit events matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-purple-50/20 transition">
                      <td className="py-3 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#673AB7] text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-100">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-800">
                        {log.actorName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-700 max-w-xs truncate" title={log.targetDescription}>
                        {log.targetDescription}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-gray-400">
                        {log.ipAddress || '192.168.1.100'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 20: SOCIETY SETTINGS
// -------------------------------------------------------------
interface SettingsViewProps {
  society: Society;
  settings: SocietyDetailedSettings;
  onUpdateSettings: (s: Partial<SocietyDetailedSettings>) => Promise<boolean>;
}

export const SocietySettingsView: React.FC<SettingsViewProps> = ({
  society,
  settings,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'SECURITY' | 'FINANCE' | 'NOTIFICATIONS' | 'GENERAL'>('SECURITY');
  const [localSettings, setLocalSettings] = useState<SocietyDetailedSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateSettings(localSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Society Rules & Operational Settings</h2>
          <p className="text-sm text-gray-500">Fine-tune visitor verification rules, automated billing days, and gate access protocols</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm"
        >
          <Check className="w-4 h-4" />
          {saving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> Settings updated and applied to society operations.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'SECURITY'
              ? 'border-[#673AB7] text-[#673AB7]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" /> Security & Gate Rules
        </button>
        <button
          onClick={() => setActiveTab('FINANCE')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'FINANCE'
              ? 'border-[#673AB7] text-[#673AB7]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Finance & Invoicing
        </button>
        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'NOTIFICATIONS'
              ? 'border-[#673AB7] text-[#673AB7]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Bell className="w-4 h-4" /> Notification Preferences
        </button>
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'GENERAL'
              ? 'border-[#673AB7] text-[#673AB7]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Globe className="w-4 h-4" /> General Info
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        {activeTab === 'SECURITY' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Gate Security & Visitor Verification Protocols</h3>
            
            <div className="flex items-center justify-between p-4 bg-[#F1F9FC] rounded-xl">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Cab & Taxi Resident Verification</h4>
                <p className="text-xs text-gray-500">Require resident approval before opening boom barrier for Uber / Ola</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.security.requireVisitorApprovalForCabs}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  security: { ...localSettings.security, requireVisitorApprovalForCabs: e.target.checked }
                })}
                className="w-4 h-4 rounded text-[#673AB7] focus:ring-[#673AB7]"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F1F9FC] rounded-xl">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Mandatory Delivery Gate Pass</h4>
                <p className="text-xs text-gray-500">Require digital OTP verification for Zomato, Swiggy, Amazon delivery executives</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.security.requireDeliveryGatePass}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  security: { ...localSettings.security, requireDeliveryGatePass: e.target.checked }
                })}
                className="w-4 h-4 rounded text-[#673AB7] focus:ring-[#673AB7]"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F1F9FC] rounded-xl">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Allow Late Night Deliveries</h4>
                <p className="text-xs text-gray-500">Permit food & pharmacy deliveries after 11:00 PM</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.security.allowNightDeliveries}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  security: { ...localSettings.security, allowNightDeliveries: e.target.checked }
                })}
                className="w-4 h-4 rounded text-[#673AB7] focus:ring-[#673AB7]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pass Auto-Expiry (Hours)</label>
                <input
                  type="number"
                  value={localSettings.security.autoExpirePassHours}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    security: { ...localSettings.security, autoExpirePassHours: Number(e.target.value) }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Emergency Security Hotline</label>
                <input
                  type="text"
                  value={localSettings.security.emergencyHotline}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    security: { ...localSettings.security, emergencyHotline: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'FINANCE' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Maintenance Billing Cycles & Late Fees</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Due Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={localSettings.finance.dueDayOfMonth}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    finance: { ...localSettings.finance, dueDayOfMonth: Number(e.target.value) }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Grace Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={localSettings.finance.gracePeriodDays}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    finance: { ...localSettings.finance, gracePeriodDays: Number(e.target.value) }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fixed Monthly Dues (₹)</label>
                <input
                  type="number"
                  value={localSettings.finance.fixedMonthlyDues}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    finance: { ...localSettings.finance, fixedMonthlyDues: Number(e.target.value) }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={localSettings.finance.bankAccountNumber || ''}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    finance: { ...localSettings.finance, bankAccountNumber: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  value={localSettings.finance.bankIfscCode || ''}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    finance: { ...localSettings.finance, bankIfscCode: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'NOTIFICATIONS' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Automated Alerts & Channels</h3>

            <div className="flex items-center justify-between p-4 bg-[#F1F9FC] rounded-xl">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">SMS Alerts for Visitor Arrival</h4>
                <p className="text-xs text-gray-500">Send SMS text alert in addition to mobile push when visitors check in</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.notifications.sendSmsForVisitorArrival}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  notifications: { ...localSettings.notifications, sendSmsForVisitorArrival: e.target.checked }
                })}
                className="w-4 h-4 rounded text-[#673AB7] focus:ring-[#673AB7]"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F1F9FC] rounded-xl">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Push Notifications for GatePass Approvals</h4>
                <p className="text-xs text-gray-500">Instant notification when guard scans resident-generated pass</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.notifications.sendPushForGatePassApproval}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  notifications: { ...localSettings.notifications, sendPushForGatePassApproval: e.target.checked }
                })}
                className="w-4 h-4 rounded text-[#673AB7] focus:ring-[#673AB7]"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F1F9FC] rounded-xl">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Emergency Siren Broadcast</h4>
                <p className="text-xs text-gray-500">Sound loud audible alert on resident phones for Fire and SOS triggers</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.notifications.emergencySirenEnabled}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  notifications: { ...localSettings.notifications, emergencySirenEnabled: e.target.checked }
                })}
                className="w-4 h-4 rounded text-[#673AB7] focus:ring-[#673AB7]"
              />
            </div>
          </div>
        )}

        {activeTab === 'GENERAL' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Registered Society Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={localSettings.general.registrationNumber}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    general: { ...localSettings.general, registrationNumber: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Society Name</label>
                <input
                  type="text"
                  value={localSettings.general.societyName}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    general: { ...localSettings.general, societyName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
