import React, { useState } from 'react';
import { 
  Download, 
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
    auditLogs?: SocietyAuditLogEntry[];
  };
}

export const SocietyReportsView: React.FC<ReportsViewProps> = ({
  society,
  data
}) => {
  const [reportType, setReportType] = useState<string>('VISITOR_LOG');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2026-04-30');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  const auditLogs = data.auditLogs || [];

  const reportDefinitions = [
    { id: 'VISITOR_LOG', name: '1. Daily & Monthly Visitor Ingress Log', count: data.visitors.length, desc: 'Complete logs of guests, cabs, deliveries and service entries' },
    { id: 'OVERSTAY_REPORT', name: '2. Visitor Overstay & Security Audit', count: data.visitors.filter(v => v.status === 'CheckedIn').length, desc: 'Visitors exceeding typical durations on society grounds' },
    { id: 'RESIDENT_ROSTER', name: '3. Complete Resident & Flat Directory', count: data.residents.length, desc: 'All owners, tenants, and unallocated flats' },
    { id: 'MAINTENANCE_DUES', name: '4. Society Maintenance Dues & Arrears', count: data.invoices.length, desc: 'Paid, pending, overdue invoices, and bank transaction refs' },
    { id: 'FINANCIAL_SUMMARY', name: '5. Society Financial Collections Summary', count: data.invoices.filter(i => i.status === 'PAID').length, desc: 'Total realized maintenance, bank transfers, offline receipts' },
    { id: 'HELPDESK_REPORT', name: '6. HelpDesk Tickets & Resolution Times', count: data.complaints.length, desc: 'Open, in progress, resolved maintenance tickets' },
    { id: 'GUARD_ATTENDANCE', name: '7. Security Guard Duty & Gate Coverage', count: data.guards.length, desc: 'Guard shift logs, assigned gates, attendance audit' },
    { id: 'AMENITY_UTILIZATION', name: '8. Amenity Bookings & Club Utilization', count: data.amenities.length, desc: 'Clubhouse, tennis courts, swimming pool reservation metrics' },
    { id: 'VEHICLE_DIRECTORY', name: '9. Registered Vehicles & Parking Slots', count: 12, desc: '4-wheelers, 2-wheelers, EVs, parking numbers, RFID' },
    { id: 'DOMESTIC_STAFF', name: '10. Domestic Helpers & GatePass Audit', count: 8, desc: 'Active maids, cooks, drivers, gate pass codes' },
    { id: 'EMERGENCY_LOG', name: '11. Emergency SOS Panic Button Incidents', count: 2, desc: 'Historical fire, lift entrapment, medical alerts' },
    { id: 'AUDIT_TRAIL', name: '12. System Audit Trail & Activity Log', count: auditLogs.length, desc: 'Immutable log of administrative approvals, overrides, and security events' }
  ];

  const handleExportCSV = () => {
    let dataset: any[] = [];
    if (reportType === 'VISITOR_LOG' || reportType === 'OVERSTAY_REPORT') {
      dataset = data.visitors.map(v => ({
        ID: v.id,
        Visitor: v.visitorName,
        Phone: v.visitorPhone,
        Category: v.visitorType,
        Flat: v.hostFlat,
        Status: v.status,
        CheckIn: v.checkInTime || 'N/A'
      }));
    } else if (reportType === 'RESIDENT_ROSTER') {
      dataset = data.residents.map(r => ({
        UID: r.uid,
        Name: r.fullName,
        Phone: r.phoneNumber,
        Flat: r.flatNumber,
        Type: r.occupantType,
        Status: r.membershipStatus
      }));
    } else if (reportType === 'MAINTENANCE_DUES' || reportType === 'FINANCIAL_SUMMARY') {
      dataset = data.invoices.map(i => ({
        InvoiceNo: i.invoiceNumber,
        Flat: i.flatNumber,
        Resident: i.residentName,
        Amount: i.amount,
        Status: i.status,
        Receipt: i.receiptNumber || 'N/A'
      }));
    } else if (reportType === 'GUARD_ATTENDANCE') {
      dataset = data.guards.map(g => ({
        GuardID: g.id,
        Name: g.name,
        Phone: g.phoneNumber,
        BadgeNumber: g.badgeNumber || 'N/A',
        AssignedGate: g.gateAssigned || 'Main Gate',
        Shift: g.shift || 'DAY',
        Status: g.status
      }));
    } else if (reportType === 'AMENITY_UTILIZATION') {
      dataset = data.amenities.map(a => ({
        AmenityID: a.id,
        Name: a.name,
        OperatingHours: a.operatingHours,
        HourlyCharge: a.hourlyCharge,
        MaxCapacity: a.maxCapacity,
        Status: a.status
      }));
    } else if (reportType === 'AUDIT_TRAIL') {
      dataset = auditLogs.map(l => ({
        LogID: l.id,
        Timestamp: l.timestamp,
        ActorName: l.actorName,
        ActorRole: l.actorRole,
        ActionType: l.actionType,
        TargetRecord: l.targetRecordId || 'N/A',
        Description: l.targetDescription,
        IPAddress: l.ipAddress || '192.168.1.1'
      }));
    } else {
      dataset = data.complaints.map(c => ({
        TicketID: c.id,
        Subject: c.subject,
        Resident: c.submittedByName,
        Flat: c.flatNumber,
        Category: c.category,
        Priority: c.priority,
        Status: c.status
      }));
    }

    exportSocietyReportToCSV(`${society.societyCode}_${reportType}`, dataset);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedDef = reportDefinitions.find(r => r.id === reportType);

  const filteredAuditLogs = auditLogs.filter(l => 
    !auditSearch ||
    l.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.actionType.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.targetDescription.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports, Exports & Audits</h2>
          <p className="text-sm text-gray-500">Generate compliance reports, visitor security audits and financial statements</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-gray-700 text-sm font-semibold hover:bg-gray-50 transition shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-semibold hover:bg-[#5E35B1] transition shadow-xs"
          >
            <Download className="w-4 h-4" /> Export CSV Spreadsheet
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> CSV Report generated and downloaded to your device.
        </div>
      )}

      {/* Date filter & Report Selector */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <label className="block text-xs font-semibold text-gray-600 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
          />
        </div>
      </div>

      {/* Report Info Card */}
      <div className="bg-[#F1F9FC] p-5 rounded-2xl border border-[#BEE3F8] flex items-start justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-base mb-1">{selectedDef?.name}</h3>
          <p className="text-xs text-gray-600">{selectedDef?.desc}</p>
          <p className="text-xs text-purple-700 font-semibold mt-2">
            Audit Scope: {society.societyName || society.name} ({society.societyCode}) • Date Window: {startDate} to {endDate}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 block">Matching Records</span>
          <span className="text-2xl font-black text-[#673AB7]">{selectedDef?.count}</span>
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
              <span className="text-xs font-mono font-bold text-[#673AB7] bg-[#F1F9FC] px-2 py-0.5 rounded-md">
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
