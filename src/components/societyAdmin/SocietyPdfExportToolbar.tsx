/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, FileDown, Layers, RotateCcw } from 'lucide-react';
import { SocietyPeriodMode } from './societyPdfExportUtils';

interface SocietyPdfExportToolbarProps {
  periodMode: SocietyPeriodMode;
  onPeriodModeChange: (mode: SocietyPeriodMode) => void;
  dayValue: string;
  onDayValueChange: (val: string) => void;
  monthValue: string;
  onMonthValueChange: (val: string) => void;
  yearValue: string;
  onYearValueChange: (val: string) => void;
  matchedCount: number;
  onExportPdf: () => void;
  pdfButtonLabel?: string;
  secondaryExportLabel?: string;
  onSecondaryExportPdf?: () => void;
  onResetPeriod?: () => void;
  availableYears?: string[];
  helperHint?: string;
}

export const SocietyPdfExportToolbar: React.FC<SocietyPdfExportToolbarProps> = ({
  periodMode,
  onPeriodModeChange,
  dayValue,
  onDayValueChange,
  monthValue,
  onMonthValueChange,
  yearValue,
  onYearValueChange,
  matchedCount,
  onExportPdf,
  pdfButtonLabel = 'Download PDF',
  secondaryExportLabel,
  onSecondaryExportPdf,
  onResetPeriod,
  availableYears,
  helperHint,
}) => {
  const currentYear = new Date().toISOString().slice(0, 4);
  const years = Array.from(
    new Set([currentYear, '2026', '2025', '2024', ...(availableYears || [])])
  )
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  return (
    <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
      {/* Single-row aligned bar */}
      <div className="flex flex-nowrap items-center justify-between gap-2.5 overflow-x-auto no-scrollbar">
        {/* Left: Period Filter Controls */}
        <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 mr-0.5 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>PDF Period:</span>
          </span>

          {(
            [
              { id: 'ALL', label: 'All Time' },
              { id: 'DAY', label: 'Day-wise' },
              { id: 'MONTH', label: 'Month-wise' },
              { id: 'YEAR', label: 'Year-wise' },
            ] as { id: SocietyPeriodMode; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onPeriodModeChange(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                periodMode === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-[#F4F8F7] text-slate-600 hover:text-slate-900 border border-slate-200/80'
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
              aria-label="Select day for PDF export"
              className="px-2 py-1 rounded-lg border border-teal-200 bg-[#F4F8F7] text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 shrink-0"
            />
          )}

          {periodMode === 'MONTH' && (
            <input
              type="month"
              value={monthValue}
              onChange={(e) => onMonthValueChange(e.target.value)}
              aria-label="Select month for PDF export"
              className="px-2 py-1 rounded-lg border border-teal-200 bg-[#F4F8F7] text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 shrink-0"
            />
          )}

          {periodMode === 'YEAR' && (
            <select
              value={yearValue}
              onChange={(e) => onYearValueChange(e.target.value)}
              aria-label="Select year for PDF export"
              className="px-2.5 py-1 rounded-lg border border-teal-200 bg-[#F4F8F7] text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 shrink-0"
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          )}

          {periodMode !== 'ALL' && onResetPeriod && (
            <button
              type="button"
              onClick={onResetPeriod}
              title="Reset period to All Time"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right: Record Count + PDF Download Buttons */}
        <div className="flex flex-nowrap items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-[#F4F8F7] border border-slate-200/80 text-[11px] font-bold text-slate-600 tabular-nums whitespace-nowrap">
            {matchedCount} {matchedCount === 1 ? 'record' : 'records'}
          </span>

          {secondaryExportLabel && onSecondaryExportPdf && (
            <button
              type="button"
              onClick={onSecondaryExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>{secondaryExportLabel}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5 shrink-0" />
            <span>{pdfButtonLabel}</span>
          </button>
        </div>
      </div>

      {helperHint && (
        <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">{helperHint}</p>
      )}
    </div>
  );
};
