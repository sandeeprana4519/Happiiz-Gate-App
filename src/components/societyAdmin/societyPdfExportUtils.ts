/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Society } from '../../types/society';

export type SocietyPeriodMode = 'ALL' | 'DAY' | 'MONTH' | 'YEAR';

export const normalizeSocietyIsoDate = (raw?: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return trimmed.slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
};

export const matchesSocietyPeriod = (
  rawDate: string | undefined,
  mode: SocietyPeriodMode,
  dayValue: string,
  monthValue: string,
  yearValue: string
): boolean => {
  if (mode === 'ALL') return true;
  const iso = normalizeSocietyIsoDate(rawDate);
  if (!iso) return false;
  if (mode === 'DAY') return !dayValue || iso === dayValue;
  if (mode === 'MONTH') return !monthValue || iso.startsWith(monthValue);
  if (mode === 'YEAR') return !yearValue || iso.startsWith(yearValue);
  return true;
};

export const buildSocietyPeriodLabel = (
  mode: SocietyPeriodMode,
  dayValue: string,
  monthValue: string,
  yearValue: string
): { label: string; slug: string } => {
  switch (mode) {
    case 'DAY':
      return { label: `Day-wise (${dayValue || 'All'})`, slug: `day_${dayValue || 'all'}` };
    case 'MONTH':
      return { label: `Month-wise (${monthValue || 'All'})`, slug: `month_${monthValue || 'all'}` };
    case 'YEAR':
      return { label: `Year-wise (${yearValue || 'All'})`, slug: `year_${yearValue || 'all'}` };
    default:
      return { label: 'All Time', slug: 'all_time' };
  }
};

export const buildSocietySlug = (society: Society): string => {
  const base = (society.societyName || society.societyCode || 'society')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return base || 'society';
};

export interface SocietyPdfExportSection {
  sectionTitle: string;
  columns: string[];
  rows: Record<string, any>[];
}

export const exportSocietyPdf = ({
  society,
  title,
  subtitle,
  filename,
  columns,
  rows,
  filterSummary,
  extraSections,
}: {
  society: Society;
  title: string;
  subtitle: string;
  filename: string;
  columns: string[];
  rows: Record<string, any>[];
  filterSummary: string;
  extraSections?: SocietyPdfExportSection[];
}): void => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  // Forest-Teal palette matching Society Admin Console
  const primaryColor: [number, number, number] = [13, 148, 136]; // #0D9488 teal-600
  const darkHeaderColor: [number, number, number] = [11, 37, 36]; // #0B2524
  const darkTextColor: [number, number, number] = [15, 23, 42];
  const mutedTextColor: [number, number, number] = [71, 85, 105];

  const societyTitle = society.societyName || 'Residential Society';
  const societyCode = society.societyCode || society.id || '';

  // Top Header Banner
  doc.setFillColor(...darkHeaderColor);
  doc.rect(0, 0, 842, 70, 'F');

  doc.setFillColor(...primaryColor);
  doc.rect(0, 66, 842, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${societyTitle.toUpperCase()} • ${title.toUpperCase()}`, 36, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(204, 251, 241); // teal-100
  doc.text(
    societyCode ? `Society Code: ${societyCode}  |  ${subtitle}` : subtitle,
    36,
    49
  );

  doc.setFontSize(8.5);
  doc.setTextColor(153, 246, 228); // teal-200
  doc.text(`Generated: ${new Date().toLocaleString()}`, 806, 49, { align: 'right' });

  // Applied Filter Scope Bar
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Applied Filter & Export Scope', 36, 90);

  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(204, 251, 241); // teal-100
  doc.roundedRect(36, 98, 770, 32, 6, 6, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(filterSummary, 48, 118, { maxWidth: 746 });

  const sanitize = (v: any) => String(v ?? '—').replace(/₹/g, 'INR ');

  const renderFooter = (pageNumber: number) => {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`${societyTitle} (${societyCode}) • ${title}`, 36, 572);
    doc.text(`Page ${pageNumber} of ${pageCount}`, 806, 572, { align: 'right' });
  };

  const primaryBody =
    rows.length > 0
      ? rows.map((row) => columns.map((col) => sanitize(row[col])))
      : [['No matching records found for the selected period or filter criteria.']];

  autoTable(doc, {
    startY: 144,
    head: [columns],
    body: primaryBody,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 36, right: 36 },
    didDrawPage: (data) => {
      renderFooter(data.pageNumber);
    },
  });

  if (extraSections && extraSections.length > 0) {
    for (const sec of extraSections) {
      const lastY = (doc as any).lastAutoTable?.finalY ?? 160;
      const startY = lastY > 470 ? 48 : lastY + 28;
      if (lastY > 470) {
        doc.addPage();
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...darkTextColor);
      doc.text(sec.sectionTitle, 36, startY);

      const secBody =
        sec.rows.length > 0
          ? sec.rows.map((row) => sec.columns.map((col) => sanitize(row[col])))
          : [['No matching records found for the selected criteria.']];

      autoTable(doc, {
        startY: startY + 10,
        head: [sec.columns],
        body: secBody,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8.5,
          cellPadding: 6,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: 5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 36, right: 36 },
        didDrawPage: (data) => {
          renderFooter(data.pageNumber);
        },
      });
    }
  }

  doc.save(`${filename}.pdf`);
};
