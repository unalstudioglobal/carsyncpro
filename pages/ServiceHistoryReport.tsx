import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, FileText, Download, Car, Fuel, Wrench, Shield,
  MoreHorizontal, Droplet, Disc, Battery, ClipboardCheck, Sparkles,
  RotateCw, Zap, Calendar, Gauge, Wallet, TrendingUp, CheckCircle2,
  AlertTriangle, Clock, BarChart2, Loader2, Eye
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchVehicles, fetchLogs } from '../services/firestoreService';
import { Vehicle, ServiceLog } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

type ReportSection = 'all' | 'fuel' | 'maintenance' | 'financial';
type DateRange = '3A' | '6A' | '1Y' | '2Y' | 'Tümü';

interface ReportConfig {
  vehicleId: string;
  dateRange: DateRange;
  sections: ReportSection[];
  includeCharts: boolean;
  includeSummary: boolean;
  includeLogDetails: boolean;
}

interface ReportStats {
  totalCost: number;
  fuelCost: number;
  maintenanceCost: number;
  otherCost: number;
  totalLogs: number;
  fuelLogs: number;
  totalLiters: number;
  avgConsumption: number | null;
  costPerKm: number;
  kmTraveled: number;
  firstLog: ServiceLog | null;
  lastLog: ServiceLog | null;
  byMonth: Record<string, { cost: number; fuel: number; maintenance: number; count: number }>;
  byType: Record<string, { count: number; cost: number }>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LOG_META: Record<string, { category: 'fuel' | 'maintenance' | 'other'; color: [number, number, number] }> = {
  'Yakıt Alımı': { category: 'fuel', color: [59, 130, 246] },
  'Yağ Değişimi': { category: 'maintenance', color: [245, 158, 11] },
  'Periyodik Bakım': { category: 'maintenance', color: [245, 158, 11] },
  'Lastik Değişimi': { category: 'maintenance', color: [139, 92, 246] },
  'Lastik Rotasyonu': { category: 'maintenance', color: [99, 102, 241] },
  'Fren Servisi': { category: 'maintenance', color: [239, 68, 68] },
  'Akü Değişimi': { category: 'maintenance', color: [234, 179, 8] },
  'Muayene': { category: 'other', color: [20, 184, 166] },
  'Yıkama & Detay': { category: 'other', color: [6, 182, 212] },
};

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const DATE_RANGE_MONTHS: Record<DateRange, number | null> = {
  '3A': 3, '6A': 6, '1Y': 12, '2Y': 24, 'Tümü': null
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDateRangeStart = (range: DateRange): Date | null => {
  const m = DATE_RANGE_MONTHS[range];
  if (!m) return null;
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return d;
};

const formatDate = (dateStr: string, t: any) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr + 'T00:00:00');
  const months = t('smart_notifs.months', { returnObjects: true }) as string[];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const buildStats = (logs: ServiceLog[], vehicleId: string, range: DateRange): ReportStats => {
  const start = getDateRangeStart(range);
  const filtered = logs
    .filter(l => l.vehicleId === vehicleId)
    .filter(l => {
      if (!start) return true;
      return new Date(l.date + 'T00:00:00') >= start;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  let fuelCost = 0, maintenanceCost = 0, otherCost = 0;
  let totalLiters = 0, fuelLogs = 0;
  const byMonth: ReportStats['byMonth'] = {};
  const byType: ReportStats['byType'] = {};

  filtered.forEach(l => {
    const meta = LOG_META[l.type] || { category: 'other' };
    if (meta.category === 'fuel') { fuelCost += l.cost; fuelLogs++; }
    else if (meta.category === 'maintenance') maintenanceCost += l.cost;
    else otherCost += l.cost;
    if (l.liters) totalLiters += l.liters;

    if (/^\d{4}-\d{2}/.test(l.date)) {
      const ym = l.date.slice(0, 7);
      if (!byMonth[ym]) byMonth[ym] = { cost: 0, fuel: 0, maintenance: 0, count: 0 };
      byMonth[ym].cost += l.cost;
      byMonth[ym].count++;
      if (meta.category === 'fuel') byMonth[ym].fuel += l.cost;
      if (meta.category === 'maintenance') byMonth[ym].maintenance += l.cost;
    }

    if (!byType[l.type]) byType[l.type] = { count: 0, cost: 0 };
    byType[l.type].count++;
    byType[l.type].cost += l.cost;
  });

  const sorted = [...filtered].sort((a, b) => b.mileage - a.mileage);
  const maxKm = sorted[0]?.mileage ?? 0;
  const minKm = sorted[sorted.length - 1]?.mileage ?? 0;
  const kmTraveled = maxKm - minKm;
  const totalCost = fuelCost + maintenanceCost + otherCost;

  let avgConsumption: number | null = null;
  if (totalLiters > 0 && kmTraveled > 100) {
    avgConsumption = Math.round((totalLiters / kmTraveled) * 100 * 10) / 10;
  }

  return {
    totalCost, fuelCost, maintenanceCost, otherCost,
    totalLogs: filtered.length, fuelLogs, totalLiters,
    avgConsumption, kmTraveled,
    costPerKm: kmTraveled > 0 ? Math.round((totalCost / kmTraveled) * 100) / 100 : 0,
    firstLog: filtered[0] || null,
    lastLog: filtered[filtered.length - 1] || null,
    byMonth, byType,
  };
};

// ─── PDF Generator ───────────────────────────────────────────────────────────

const generatePDF = (vehicle: Vehicle, logs: ServiceLog[], stats: ReportStats, config: ReportConfig, t: any) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;
  const margin = 14;
  let y = 0;

  // ── Helper functions ──
  const addPage = () => {
    doc.addPage();
    y = 20;
    // Page header stripe
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(t('report.pdf_header'), margin, 8);
    doc.text(`${vehicle.brand} ${vehicle.model} • ${vehicle.plate}`, W - margin, 8, { align: 'right' });
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > H - 20) addPage();
  };

  const sectionTitle = (title: string, icon?: string) => {
    checkPageBreak(14);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, W - margin * 2, 9, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${icon ? icon + '  ' : ''}${title}`, margin + 4, y + 6);
    y += 14;
  };

  // ── COVER PAGE ──
  // Dark header block
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 70, 'F');

  // Accent bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 67, W, 3, 'F');

  // Logo area
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('CARSYNC PRO', margin, 18);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(t('report.pdf_sys'), margin, 23);

  // Report title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(248, 250, 252);
  doc.text(t('report.pdf_r1'), margin, 42);
  doc.text(t('report.pdf_r2'), margin, 52);

  // Vehicle plate badge
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(W - 60, 14, 46, 16, 3, 3, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(248, 250, 252);
  doc.text(vehicle.plate, W - 37, 25, { align: 'center' });

  // Vehicle info block
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 73, W, 48, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${vehicle.brand} ${vehicle.model}`, margin, 90);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${vehicle.year} Model  •  ${vehicle.mileage.toLocaleString('tr-TR')} km`, margin, 100);

  // Health score circle
  const hx = W - 35, hy = 90, hr = 14;
  const hColor: [number, number, number] = vehicle.healthScore >= 70 ? [16, 185, 129] : vehicle.healthScore >= 40 ? [245, 158, 11] : [239, 68, 68];
  doc.setDrawColor(...hColor); doc.setLineWidth(2);
  doc.circle(hx, hy, hr, 'S');
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hColor);
  doc.text(String(vehicle.healthScore), hx, hy + 2, { align: 'center' });
  doc.setFontSize(6); doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(t('report.pdf_health'), hx, hy + 8, { align: 'center' });

  // Report metadata
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, 108, W - margin * 2, 18, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const now = new Date();
  doc.text(`${t('report.pdf_date')}: ${now.getDate()} ${t('smart_notifs.months', { returnObjects: true })[now.getMonth()]} ${now.getFullYear()}`, margin + 4, 118);
  doc.text(`${t('report.pdf_period')}: ${config.dateRange === 'Tümü' ? t('report.range_all') : config.dateRange}  •  ${t('report.pdf_tot_log')}: ${stats.totalLogs}`, margin + 4, 124);
  doc.text(`${t('report.pdf_created')}: ${now.toLocaleTimeString(t('common.locale', { defaultValue: 'tr-TR' }))}`, W - margin - 4, 118, { align: 'right' });

  // ── SUMMARY BOX ──
  y = 140;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(t('report.pdf_sum_title'), margin, y); y += 8;

  const summaryItems = [
    [t('report.tot_spent'), `₺${stats.totalCost.toLocaleString('tr-TR')}`, [99, 102, 241] as [number, number, number]],
    [t('report.fuel_spent'), `₺${stats.fuelCost.toLocaleString('tr-TR')}`, [59, 130, 246] as [number, number, number]],
    [t('report.maint_spent'), `₺${stats.maintenanceCost.toLocaleString('tr-TR')}`, [245, 158, 11] as [number, number, number]],
    [t('report.pdf_tot_log'), `${stats.totalLogs} ${t('report.pdf_unit_count')}`, [16, 185, 129] as [number, number, number]],
    [t('report.log_fuel'), `${stats.fuelLogs} ${t('report.pdf_unit_times')} / ${stats.totalLiters.toFixed(1)} L`, [59, 130, 246] as [number, number, number]],
    [t('report.cost_per_km'), `₺${stats.costPerKm.toFixed(2)}/km`, [139, 92, 246] as [number, number, number]],
  ];

  const colW = (W - margin * 2) / 3;
  summaryItems.forEach(([label, value, color], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = margin + col * colW;
    const by = y + row * 24;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(bx, by, colW - 3, 20, 2, 2, 'F');
    doc.setDrawColor(...(color as [number, number, number]));
    doc.setLineWidth(0.5);
    doc.line(bx, by, bx, by + 20);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(color as [number, number, number]));
    doc.text(value as string, bx + 4, by + 11);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label as string, bx + 4, by + 17);
  });

  y += 54;

  // Avg consumption if available
  if (stats.avgConsumption !== null) {
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y, W - margin * 2, 12, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(`${t('report.pdf_avg_cons')} ${stats.avgConsumption} L/100km`, margin + 4, y + 8);
    y += 18;
  }

  // ── BY TYPE TABLE ──
  addPage();
  sectionTitle(t('report.pdf_type_title'));

  const typeRows = Object.entries(stats.byType)
    .sort(([, a], [, b]) => b.cost - a.cost)
    .map(([type, d]) => [
      t(`add_record.type_${type.replace(/\\s|[&]/g, '').toLowerCase()}`, { defaultValue: type }),
      String(d.count),
      `₺${d.cost.toLocaleString('tr-TR')}`,
      `%${stats.totalCost > 0 ? ((d.cost / stats.totalCost) * 100).toFixed(1) : '0.0'}`,
    ]);

  autoTable(doc, {
    startY: y,
    head: [[t('report.pdf_t_type'), t('report.pdf_t_count'), t('report.pdf_t_tot'), t('report.pdf_t_ratio')]],
    body: typeRows,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: [248, 250, 252], fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 45 },
      3: { halign: 'right', cellWidth: 30 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // ── MONTHLY SUMMARY TABLE ──
  sectionTitle(t('report.pdf_mo_title'));

  const monthRows = Object.entries(stats.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, d]) => {
      const [yr, mo] = ym.split('-');
      return [
        `${t('smart_notifs.months', { returnObjects: true })[Number(mo) - 1]} ${yr}`,
        String(d.count),
        `₺${d.fuel.toLocaleString('tr-TR')}`,
        `₺${d.maintenance.toLocaleString('tr-TR')}`,
        `₺${d.cost.toLocaleString('tr-TR')}`,
      ];
    });

  autoTable(doc, {
    startY: y,
    head: [[t('report.pdf_t_mo'), t('report.pdf_t_rec'), t('report.pdf_t_fuel'), t('report.pdf_t_maint'), t('report.pdf_t_tot')]],
    body: monthRows,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: [248, 250, 252], fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 38 },
      3: { halign: 'right', cellWidth: 38 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 38 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // ── DETAILED LOG TABLE ──
  if (config.includeLogDetails) {
    addPage();
    sectionTitle(t('report.pdf_det_title'));

    const allLogs = logs
      .filter(l => l.vehicleId === config.vehicleId)
      .filter(l => {
        const start = getDateRangeStart(config.dateRange);
        if (!start) return true;
        return new Date(l.date + 'T00:00:00') >= start;
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const logRows = allLogs.map(l => [
      formatDate(l.date, t),
      t(`add_record.type_${l.type.replace(/\\s|[&]/g, '').toLowerCase()}`, { defaultValue: l.type }),
      `${l.mileage.toLocaleString('tr-TR')} km`,
      l.liters ? `${l.liters}L` : '—',
      `₺${l.cost.toLocaleString('tr-TR')}`,
      l.notes ? (l.notes.length > 30 ? l.notes.slice(0, 27) + '...' : l.notes) : '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [[t('report.pdf_t_date'), t('report.pdf_t_type'), t('report.pdf_t_km'), t('report.pdf_t_L'), t('report.pdf_t_cost'), t('report.pdf_t_note')]],
      body: logRows,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: [248, 250, 252], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 38 },
        2: { halign: 'right', cellWidth: 28 },
        3: { halign: 'right', cellWidth: 18 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
        5: { cellWidth: 40, fontSize: 7 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        // Re-draw page header on each new page
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, W, 12, 'F');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(t('report.pdf_header'), margin, 8);
        doc.text(`${vehicle.brand} ${vehicle.model} • ${vehicle.plate}`, W - margin, 8, { align: 'right' });
      }
    });
  }

  // ── FOOTER on each page ──
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(241, 245, 249);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(t('report.pdf_header'), margin, H - 5);
    doc.text(`${t('report.pdf_page')} ${i} / ${pageCount}`, W / 2, H - 5, { align: 'center' });
    doc.text(`${t('report.pdf_created')}: ${now.toLocaleDateString(t('common.locale', { defaultValue: 'tr-TR' }))}`, W - margin, H - 5, { align: 'right' });
  }

  const filename = `carsync_${vehicle.brand}_${vehicle.model}_${vehicle.plate}_rapor.pdf`
    .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
  doc.save(filename);
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const ServiceHistoryReport: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [config, setConfig] = useState<ReportConfig>({
    vehicleId: '',
    dateRange: '1Y',
    sections: ['all'],
    includeCharts: false,
    includeSummary: true,
    includeLogDetails: true,
  });

  useEffect(() => {
    const load = async () => {
      const [v, l] = await Promise.all([fetchVehicles(), fetchLogs()]);
      setVehicles(v);
      setLogs(l);
      if (v.length > 0) setConfig(c => ({ ...c, vehicleId: v[0].id }));
      setLoading(false);
    };
    load();
  }, []);

  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === config.vehicleId), [vehicles, config.vehicleId]);
  const stats = useMemo(() =>
    selectedVehicle ? buildStats(logs, config.vehicleId, config.dateRange) : null,
    [logs, config.vehicleId, config.dateRange, selectedVehicle]
  );

  const handleGenerate = async () => {
    if (!selectedVehicle || !stats) return;
    setGenerating(true);
    // Small delay for UX
    await new Promise(r => setTimeout(r, 400));
    try {
      generatePDF(selectedVehicle, logs, stats, config, t);
    } finally {
      setGenerating(false);
    }
  };

  const updateConfig = (key: keyof ReportConfig, value: any) =>
    setConfig(c => ({ ...c, [key]: value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <FileText className="text-blue-400 animate-pulse" size={24} />
          </div>
          <p className="text-slate-400 text-sm">{t('report.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <ChevronLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{t('report.title')}</h1>
            <p className="text-slate-500 text-xs">{t('report.subtitle')}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-1.5">
            <FileText size={12} className="text-blue-400" />
            <span className="text-blue-300 text-xs font-medium">{t('report.pdf')}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Vehicle selector */}
        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('report.vehicle')}</label>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => updateConfig('vehicleId', v.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${config.vehicleId === v.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                  }`}
              >
                <Car size={12} />
                {v.brand} {v.model}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('report.date_range')}</label>
          <div className="grid grid-cols-5 gap-2">
            {(['3A', '6A', '1Y', '2Y', 'Tümü'] as DateRange[]).map(r => {
              const mapped = r === '3A' ? 'range_3m' : r === '6A' ? 'range_6m' : r === '1Y' ? 'range_1y' : r === '2Y' ? 'range_2y' : 'range_all'; return (
                <button
                  key={r}
                  onClick={() => updateConfig('dateRange', r)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${config.dateRange === r
                    ? 'bg-slate-200 text-slate-900'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                    }`}
                >
                  {t('report.' + mapped)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Report options */}
        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 block">{t('report.report_content')}</label>
          <div className="space-y-2">
            {[
              { key: 'includeSummary', label: t('report.pdf_sum_title'), desc: 'Toplam harcama, km analizi, yakıt tüketimi' },
              { key: 'includeLogDetails', label: 'Detaylı Kayıt Tablosu', desc: 'Tüm servis kayıtları tarih sıralı' },
            ].map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => updateConfig(key as keyof ReportConfig, !(config as any)[key])}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-left ${(config as any)[key]
                  ? 'bg-blue-500/10 border-blue-500/20'
                  : 'bg-slate-800/40 border-slate-700/30'
                  }`}
              >
                <div>
                  <p className={`text-sm font-medium ${(config as any)[key] ? 'text-white' : 'text-slate-400'}`}>{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ml-3 ${(config as any)[key] ? 'bg-blue-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${(config as any)[key] ? 'left-5' : 'left-0.5'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats preview */}
        {stats && selectedVehicle && (
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
              <Eye size={14} className="text-slate-400" />
              <p className="text-slate-300 text-sm font-semibold">{t('report.preview')}</p>
              <span className="text-slate-500 text-xs">· {t('report.records_count', { c: stats.totalLogs })}</span>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-slate-700/30">
              {[
                { label: t('report.tot_spent'), value: `₺${stats.totalCost.toLocaleString('tr-TR')}`, color: 'text-indigo-400' },
                { label: t('report.fuel_spent'), value: `₺${stats.fuelCost.toLocaleString('tr-TR')}`, color: 'text-blue-400' },
                { label: t('report.maint_spent'), value: `₺${stats.maintenanceCost.toLocaleString('tr-TR')}`, color: 'text-amber-400' },
                { label: t('report.cost_per_km'), value: stats.costPerKm > 0 ? `₺${stats.costPerKm}/km` : '—', color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-4">
                  <p className={`text-base font-bold ${color}`}>{value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {stats.avgConsumption !== null && (
              <div className="px-4 py-3 border-t border-slate-700/30 flex items-center gap-2">
                <Fuel size={13} className="text-blue-400" />
                <span className="text-slate-400 text-xs">{t('report.avg_cons')}</span>
                <span className="text-white text-xs font-bold">{stats.avgConsumption} L/100km</span>
              </div>
            )}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !config.vehicleId || stats?.totalLogs === 0}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all ${generating
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : stats?.totalLogs === 0
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20'
            }`}
        >
          {generating ? (
            <><Loader2 size={18} className="animate-spin" /> {t('report.generating')}</>
          ) : (
            <><Download size={18} /> {t('report.download')}</>
          )}
        </button>

        {stats?.totalLogs === 0 && (
          <p className="text-slate-500 text-xs text-center">
            Bu araç ve dönem için kayıt bulunamadı.
          </p>
        )}

        {/* What's in the PDF */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 space-y-3">
          <p className="text-slate-300 text-xs font-semibold">{t('report.pdf_content_title')}</p>
          {[
            { icon: FileText, text: t('report.pdf_c1') },
            { icon: BarChart2, text: t('report.pdf_c2') },
            { icon: Calendar, text: t('report.pdf_c3') },
            { icon: Wrench, text: t('report.pdf_c4') },
            { icon: TrendingUp, text: t('report.pdf_c5') },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Icon size={12} className="text-blue-400" />
              </div>
              <p className="text-slate-500 text-xs">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
