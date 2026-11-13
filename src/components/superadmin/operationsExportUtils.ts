/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Society } from '../../types/society';

export type OperationsPeriodMode = 'ALL' | 'DAY' | 'MONTH' | 'YEAR';

export const normalizeIsoDate = (raw?: string): string => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return raw.slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
};

export const matchesOperationsPeriod = (
  rawDate: string | undefined,
  mode: OperationsPeriodMode,
  dayValue: string,
  monthValue: string,
  yearValue: string
): boolean => {
  if (mode === 'ALL') return true;
  const iso = normalizeIsoDate(rawDate);
  if (!iso) return false;
  if (mode === 'DAY') return !dayValue || iso === dayValue;
  if (mode === 'MONTH') return !monthValue || iso.startsWith(monthValue);
  if (mode === 'YEAR') return !yearValue || iso.startsWith(yearValue);
  return true;
};

export const getUniqueSocietyAreas = (societies: Society[]): string[] => {
  const areas = new Set<string>();
  for (const s of societies) {
    if (s.city?.trim()) {
      areas.add(s.city.trim());
    }
    if (s.address?.trim()) {
      const parts = s.address
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 2 && !/^\d+$/.test(p));
      if (parts.length > 0) {
        const lastArea = parts[parts.length - 1];
        if (lastArea && lastArea.toLowerCase() !== s.city?.trim().toLowerCase()) {
          areas.add(`${lastArea} (${s.city || 'Area'})`);
        }
      }
    }
  }
  return Array.from(areas).sort((a, b) => a.localeCompare(b));
};

export const findMappedSociety = (
  societies: Society[],
  societyId?: string,
  societyName?: string
): Society | undefined => {
  if (societyId) {
    const byId = societies.find((s) => s.id === societyId);
    if (byId) return byId;
  }
  if (societyName) {
    const target = societyName.trim().toLowerCase();
    const byName = societies.find(
      (s) =>
        s.societyName.toLowerCase() === target ||
        s.societyName.toLowerCase().includes(target) ||
        target.includes(s.societyName.toLowerCase())
    );
    if (byName) return byName;
  }
  return undefined;
};

export const getSocietyAreaLabel = (
  societies: Society[],
  societyId?: string,
  societyName?: string
): string => {
  const soc = findMappedSociety(societies, societyId, societyName);
  if (!soc) return 'Platform-Wide';
  return soc.city || soc.address || 'General Area';
};

export const matchesSocietyAndArea = ({
  societies,
  societyId,
  societyName,
  societyFilter,
  areaFilter,
}: {
  societies: Society[];
  societyId?: string;
  societyName?: string;
  societyFilter: string;
  areaFilter: string;
}): boolean => {
  const mappedSoc = findMappedSociety(societies, societyId, societyName);

  if (societyFilter && societyFilter !== 'ALL') {
    const selectedSoc = societies.find((s) => s.id === societyFilter);
    const idMatch = societyId === societyFilter || mappedSoc?.id === societyFilter;
    const nameMatch =
      Boolean(selectedSoc && societyName) &&
      societyName!.toLowerCase().includes(selectedSoc!.societyName.toLowerCase());
    if (!idMatch && !nameMatch) {
      return false;
    }
  }

  if (areaFilter && areaFilter !== 'ALL') {
    if (!mappedSoc) return false;
    const rawArea = areaFilter.toLowerCase();
    const cityMatch = mappedSoc.city?.toLowerCase() === rawArea;
    const localityKeyword = areaFilter.split('(')[0].trim().toLowerCase();
    const addressMatch = Boolean(
      localityKeyword && mappedSoc.address?.toLowerCase().includes(localityKeyword)
    );
    const stateMatch = mappedSoc.state?.toLowerCase() === rawArea;
    if (!cityMatch && !addressMatch && !stateMatch) {
      return false;
    }
  }

  return true;
};

export const buildPeriodLabel = (
  mode: OperationsPeriodMode,
  dayValue: string,
  monthValue: string,
  yearValue: string
): { label: string; slug: string } => {
  switch (mode) {
    case 'DAY':
      return { label: `Day-wise (${dayValue})`, slug: `day_${dayValue}` };
    case 'MONTH':
      return { label: `Month-wise (${monthValue})`, slug: `month_${monthValue}` };
    case 'YEAR':
      return { label: `Year-wise (${yearValue})`, slug: `year_${yearValue}` };
    default:
      return { label: 'All Time', slug: 'all_time' };
  }
};

export const buildFilterSummaryText = ({
  societies,
  societyFilter,
  areaFilter,
  mode,
  dayValue,
  monthValue,
  yearValue,
  searchTerm,
  recordCount,
}: {
  societies: Society[];
  societyFilter: string;
  areaFilter: string;
  mode: OperationsPeriodMode;
  dayValue: string;
  monthValue: string;
  yearValue: string;
  searchTerm?: string;
  recordCount: number;
}): string => {
  const socLabel =
    societyFilter && societyFilter !== 'ALL'
      ? societies.find((s) => s.id === societyFilter)?.societyName || societyFilter
      : 'All Societies';
  const areaLabel = areaFilter && areaFilter !== 'ALL' ? areaFilter : 'All Areas';
  const period = buildPeriodLabel(mode, dayValue, monthValue, yearValue).label;
  const searchPart = searchTerm?.trim() ? ` | Search: "${searchTerm.trim()}"` : '';
  return `Period: ${period} | Society: ${socLabel} | Area: ${areaLabel}${searchPart} | Records: ${recordCount}`;
};

export const exportOperationsPdf = ({
  title,
  subtitle,
  filename,
  columns,
  rows,
  filterSummary,
}: {
  title: string;
  subtitle: string;
  filename: string;
  columns: string[];
  rows: Record<string, any>[];
  filterSummary: string;
}): void => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [103, 58, 183];
  const darkColor: [number, number, number] = [17, 17, 17];
  const grayColor: [number, number, number] = [100, 116, 139];

  // Branded Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 842, 66, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text(`HAPPIIZ GATE • ${title.toUpperCase()}`, 36, 31);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(235, 232, 255);
  doc.text(subtitle, 36, 49);

  doc.setFontSize(8.5);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 806, 49, { align: 'right' });

  // Filter Metadata Bar
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Applied Operations Filter Scope', 36, 88);

  doc.setFillColor(244, 248, 252);
  doc.roundedRect(36, 96, 770, 34, 6, 6, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  doc.text(filterSummary, 48, 117);

  const sanitize = (v: any) => String(v ?? '').replace(/₹/g, 'INR ');

  const body =
    rows.length > 0
      ? rows.map((row) => columns.map((col) => sanitize(row[col])))
      : [['No matching records found for the selected Society, Area, or Period filters.']];

  autoTable(doc, {
    startY: 144,
    head: [columns],
    body,
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
      doc.text(`Happiiz Gate Operations Console • ${title}`, 36, 572);
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, 806, 572, { align: 'right' });
    },
  });

  doc.save(`${filename}.pdf`);
};

export const exportOperationsExcel = (
  filename: string,
  columns: string[],
  rows: Record<string, any>[]
): void => {
  const escapeCsvCell = (raw: any): string => {
    const val = raw === null || raw === undefined ? '' : String(raw);
    const escaped = val.replace(/"/g, '""');
    return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
  };

  const headerLine = columns.map(escapeCsvCell).join(',');
  const bodyLines = rows.map((row) =>
    columns.map((col) => escapeCsvCell(row[col])).join(',')
  );
  // Prepend UTF-8 BOM so Microsoft Excel opens Unicode/INR characters cleanly
  const csvContent = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
