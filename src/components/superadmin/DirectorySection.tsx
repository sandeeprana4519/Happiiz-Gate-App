/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Society } from '../../types/society';
import {
  SocietyAdminRecord,
  ResidentRecord,
  GuardRecord,
} from '../../services/firebase/superadmin.service';
import { SocietyAdminsSection } from './SocietyAdminsSection';
import { ResidentsSection } from './ResidentsSection';
import { GuardsSection } from './GuardsSection';
import { UserCog, Users, ShieldCheck } from 'lucide-react';
import { OperationsExportToolbar } from './OperationsExportToolbar';
import {
  OperationsPeriodMode,
  buildFilterSummaryText,
  buildPeriodLabel,
  exportOperationsExcel,
  exportOperationsPdf,
  getSocietyAreaLabel,
  matchesOperationsPeriod,
  matchesSocietyAndArea,
} from './operationsExportUtils';

interface DirectorySectionProps {
  societyAdmins: SocietyAdminRecord[];
  residents: ResidentRecord[];
  guards: GuardRecord[];
  societies: Society[];
  onRefresh: () => Promise<void>;
}

export const DirectorySection: React.FC<DirectorySectionProps> = ({
  societyAdmins,
  residents,
  guards,
  societies,
  onRefresh,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [activeSubTab, setActiveSubTab] = useState<'admins' | 'residents' | 'guards'>('admins');

  // Operations Period, Society-wise & Area-wise Filters
  const [periodMode, setPeriodMode] = useState<OperationsPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(todayIso);
  const [monthValue, setMonthValue] = useState<string>(todayIso.slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(todayIso.slice(0, 4));
  const [societyFilter, setSocietyFilter] = useState<string>('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');

  const filteredAdmins = useMemo(
    () =>
      societyAdmins.filter(
        (a) =>
          matchesOperationsPeriod(a.joinedAt, periodMode, dayValue, monthValue, yearValue) &&
          matchesSocietyAndArea({
            societies,
            societyId: a.societyId,
            societyName: a.societyName,
            societyFilter,
            areaFilter,
          })
      ),
    [societyAdmins, societies, periodMode, dayValue, monthValue, yearValue, societyFilter, areaFilter]
  );

  const filteredResidents = useMemo(
    () =>
      residents.filter(
        (r) =>
          matchesOperationsPeriod(r.joinedAt, periodMode, dayValue, monthValue, yearValue) &&
          matchesSocietyAndArea({
            societies,
            societyId: r.societyId,
            societyName: r.societyName,
            societyFilter,
            areaFilter,
          })
      ),
    [residents, societies, periodMode, dayValue, monthValue, yearValue, societyFilter, areaFilter]
  );

  const filteredGuards = useMemo(
    () =>
      guards.filter(
        (g) =>
          matchesOperationsPeriod(g.joinedAt, periodMode, dayValue, monthValue, yearValue) &&
          matchesSocietyAndArea({
            societies,
            societyId: g.societyId,
            societyName: g.societyName,
            societyFilter,
            areaFilter,
          })
      ),
    [guards, societies, periodMode, dayValue, monthValue, yearValue, societyFilter, areaFilter]
  );

  const handleResetFilters = () => {
    setPeriodMode('ALL');
    setDayValue(todayIso);
    setMonthValue(todayIso.slice(0, 7));
    setYearValue(todayIso.slice(0, 4));
    setSocietyFilter('ALL');
    setAreaFilter('ALL');
  };

  const buildActiveExportPayload = () => {
    if (activeSubTab === 'admins') {
      const columns = [
        'Full Name',
        'Designation',
        'Phone',
        'Email',
        'Society',
        'Area',
        'Status',
        'Joined Date',
      ];
      const rows = filteredAdmins.map((a) => ({
        'Full Name': a.fullName,
        Designation: a.designation,
        Phone: a.phoneNumber,
        Email: a.email || '-',
        Society: a.societyName,
        Area: getSocietyAreaLabel(societies, a.societyId, a.societyName),
        Status: a.status,
        'Joined Date': new Date(a.joinedAt).toLocaleDateString(),
      }));
      return {
        label: 'Society Admins Directory',
        slugPrefix: 'directory_society_admins',
        columns,
        rows,
      };
    }

    if (activeSubTab === 'residents') {
      const columns = [
        'Full Name',
        'Phone',
        'Email',
        'Society',
        'Area',
        'Tower & Flat',
        'Occupant Type',
        'Status',
        'Joined Date',
      ];
      const rows = filteredResidents.map((r) => ({
        'Full Name': r.fullName,
        Phone: r.phoneNumber,
        Email: r.email || '-',
        Society: r.societyName,
        Area: getSocietyAreaLabel(societies, r.societyId, r.societyName),
        'Tower & Flat': `${r.tower} - ${r.flat}`,
        'Occupant Type': r.occupantType,
        Status: r.status,
        'Joined Date': new Date(r.joinedAt).toLocaleDateString(),
      }));
      return {
        label: 'Residents Directory',
        slugPrefix: 'directory_residents',
        columns,
        rows,
      };
    }

    const columns = [
      'Guard Name',
      'Emp ID',
      'Phone',
      'Agency',
      'Assigned Gate',
      'Shift',
      'Society',
      'Area',
      'Status',
      'Joined Date',
    ];
    const rows = filteredGuards.map((g) => ({
      'Guard Name': g.fullName,
      'Emp ID': g.employmentId,
      Phone: g.phoneNumber,
      Agency: g.agencyName,
      'Assigned Gate': g.assignedGate,
      Shift: g.shift,
      Society: g.societyName,
      Area: getSocietyAreaLabel(societies, g.societyId, g.societyName),
      Status: g.status,
      'Joined Date': new Date(g.joinedAt).toLocaleDateString(),
    }));
    return {
      label: 'Security Guards Directory',
      slugPrefix: 'directory_security_guards',
      columns,
      rows,
    };
  };

  const activeMatchedCount =
    activeSubTab === 'admins'
      ? filteredAdmins.length
      : activeSubTab === 'residents'
      ? filteredResidents.length
      : filteredGuards.length;

  const handleExportPdf = () => {
    const payload = buildActiveExportPayload();
    const { slug } = buildPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    exportOperationsPdf({
      title: payload.label,
      subtitle: 'Community Operations Registry & Personnel Directory',
      filename: `happiiz_${payload.slugPrefix}_${slug}`,
      columns: payload.columns,
      rows: payload.rows,
      filterSummary: buildFilterSummaryText({
        societies,
        societyFilter,
        areaFilter,
        mode: periodMode,
        dayValue,
        monthValue,
        yearValue,
        recordCount: payload.rows.length,
      }),
    });
  };

  const handleExportExcel = () => {
    const payload = buildActiveExportPayload();
    const { slug } = buildPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    exportOperationsExcel(
      `happiiz_${payload.slugPrefix}_${slug}`,
      payload.columns,
      payload.rows
    );
  };

  return (
    <div className="space-y-5">
      {/* Unified Directory Sub-Navigation */}
      <div className="p-2 bg-white rounded-2xl border border-[#E6F1F5] shadow-xs flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('admins')}
          className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'admins'
              ? 'bg-[#673AB7] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#F1F9FC] hover:text-[#111111]'
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>Society Admins</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSubTab === 'admins' ? 'bg-white/20 text-white' : 'bg-[#F1F9FC] text-[#673AB7]'
            }`}
          >
            {filteredAdmins.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('residents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'residents'
              ? 'bg-[#673AB7] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#F1F9FC] hover:text-[#111111]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Residents</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSubTab === 'residents' ? 'bg-white/20 text-white' : 'bg-[#F1F9FC] text-[#673AB7]'
            }`}
          >
            {filteredResidents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('guards')}
          className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'guards'
              ? 'bg-[#673AB7] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#F1F9FC] hover:text-[#111111]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security Guards</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSubTab === 'guards' ? 'bg-white/20 text-white' : 'bg-[#F1F9FC] text-[#673AB7]'
            }`}
          >
            {filteredGuards.length}
          </span>
        </button>
      </div>

      {/* Period, Society-wise & Area-wise Filter + PDF & Excel Export Toolbar */}
      <OperationsExportToolbar
        societies={societies}
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        societyFilter={societyFilter}
        onSocietyFilterChange={setSocietyFilter}
        areaFilter={areaFilter}
        onAreaFilterChange={setAreaFilter}
        matchedCount={activeMatchedCount}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
        showExcelExport={true}
        pdfButtonLabel="Download Directory PDF"
        excelButtonLabel="Download Excel Sheet"
        onResetFilters={handleResetFilters}
      />

      {/* Active Directory Panel */}
      {activeSubTab === 'admins' && (
        <SocietyAdminsSection
          admins={filteredAdmins}
          societies={societies}
          onRefresh={onRefresh}
        />
      )}

      {activeSubTab === 'residents' && (
        <ResidentsSection
          residents={filteredResidents}
          societies={societies}
          onRefresh={onRefresh}
        />
      )}

      {activeSubTab === 'guards' && (
        <GuardsSection
          guards={filteredGuards}
          societies={societies}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
