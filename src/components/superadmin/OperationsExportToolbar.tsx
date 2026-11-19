/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Society } from '../../types/society';
import {
  OperationsPeriodMode,
  getUniqueSocietyAreas,
} from './operationsExportUtils';
import {
  Calendar,
  Building2,
  MapPin,
  FileText,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';

interface OperationsExportToolbarProps {
  societies: Society[];
  periodMode: OperationsPeriodMode;
  onPeriodModeChange: (mode: OperationsPeriodMode) => void;
  dayValue: string;
  onDayValueChange: (val: string) => void;
  monthValue: string;
  onMonthValueChange: (val: string) => void;
  yearValue: string;
  onYearValueChange: (val: string) => void;
  societyFilter: string;
  onSocietyFilterChange: (val: string) => void;
  areaFilter: string;
  onAreaFilterChange: (val: string) => void;
  matchedCount: number;
  onExportPdf: () => void;
  onExportExcel?: () => void;
  showExcelExport?: boolean;
  pdfButtonLabel?: string;
  excelButtonLabel?: string;
  onResetFilters: () => void;
}

export const OperationsExportToolbar: React.FC<OperationsExportToolbarProps> = ({
  societies,
  periodMode,
  onPeriodModeChange,
  dayValue,
  onDayValueChange,
  monthValue,
  onMonthValueChange,
  yearValue,
  onYearValueChange,
  societyFilter,
  onSocietyFilterChange,
  areaFilter,
  onAreaFilterChange,
  matchedCount,
  onExportPdf,
  onExportExcel,
  showExcelExport = false,
  pdfButtonLabel = 'Download PDF',
  excelButtonLabel = 'Download Excel',
  onResetFilters,
}) => {
  const areas = getUniqueSocietyAreas(societies);
  const currentYear = new Date().toISOString().slice(0, 4);
  const years = Array.from(new Set([currentYear, '2026', '2025', '2024'])).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs space-y-3">
      {/* Row 1: Period Mode + Date Picker + Export Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] mr-1">
            <Calendar className="w-3.5 h-3.5 text-[#673AB7]" />
            <span>Period:</span>
          </span>

          {(
            [
              { id: 'ALL', label: 'All Time' },
              { id: 'DAY', label: 'Day-wise' },
              { id: 'MONTH', label: 'Month-wise' },
              { id: 'YEAR', label: 'Year-wise' },
            ] as { id: OperationsPeriodMode; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onPeriodModeChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodMode === tab.id
                  ? 'bg-[#673AB7] text-white shadow-xs'
                  : 'bg-[#F1F9FC] text-[#64748B] hover:text-[#111111] border border-[#E6F1F5]'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {periodMode === 'DAY' && (
            <input
              type="date"
              value={dayValue}
              onChange={(e) => onDayValueChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#673AB7]"
            />
          )}

          {periodMode === 'MONTH' && (
            <input
              type="month"
              value={monthValue}
              onChange={(e) => onMonthValueChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#673AB7]"
            />
          )}

          {periodMode === 'YEAR' && (
            <select
              value={yearValue}
              onChange={(e) => onYearValueChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#673AB7]"
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-[#F1F9FC] border border-[#E6F1F5] text-[11px] font-bold text-[#64748B]">
            {matchedCount} records matched
          </span>

          {showExcelExport && onExportExcel && (
            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{excelButtonLabel}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>{pdfButtonLabel}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Society-wise & Area-wise Selectors */}
      <div className="pt-2.5 border-t border-[#E6F1F5]/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 items-center">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#673AB7] shrink-0" />
          <select
            value={societyFilter}
            onChange={(e) => onSocietyFilterChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#673AB7]"
          >
            <option value="ALL">Society-wise: All Societies</option>
            {societies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.societyName} ({s.city})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#673AB7] shrink-0" />
          <select
            value={areaFilter}
            onChange={(e) => onAreaFilterChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#673AB7]"
          >
            <option value="ALL">Area-wise: All Areas & Cities</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6F1F5] hover:bg-[#F1F9FC] text-xs font-bold text-[#64748B] hover:text-[#111111] cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Period & Area Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
