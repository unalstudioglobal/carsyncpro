import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, ArrowRightLeft, Fuel, Wrench, Shield, MoreHorizontal,
  TrendingUp, TrendingDown, Minus, Gauge, Wallet, Calendar,
  Droplet, RotateCw, Zap, Trophy, AlertTriangle, CheckCircle2,
  BarChart2, ChevronDown, Car, Info
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { fetchVehicles, fetchLogs } from '../services/firestoreService';
import { Vehicle, ServiceLog } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = '3A' | '6A' | '1Y' | 'Tümü';

interface VehicleStats {
  totalCost: number;
  fuelCost: number;
  maintenanceCost: number;
  insuranceCost: number;
  otherCost: number;
  totalLogs: number;
  avgMonthlyCost: number;
  costPerKm: number;
  fuelLiters: number;
  avgConsumption: number | null; // L/100km
  lastServiceDays: number | null;
  healthScore: number;
  monthlyData: { month: string; cost: number; fuel: number; maintenance: number }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VEHICLE_COLORS = ['#6366f1', '#f59e0b'] as const;

const LOG_CATEGORY_MAP: Record<string, 'fuel' | 'maintenance' | 'insurance' | 'other'> = {
  'Yakıt Alımı': 'fuel',
  'Yağ Değişimi': 'maintenance',
  'Periyodik Bakım': 'maintenance',
  'Lastik Değişimi': 'maintenance',
  'Lastik Rotasyonu': 'maintenance',
  'Fren Servisi': 'maintenance',
  'Akü Değişimi': 'maintenance',
  'Muayene': 'insurance',
  'Yıkama & Detay': 'other',
};

const PERIOD_MONTHS: Record<Period, { count: number | null; labelKey: string }> = {
  '3A': { count: 3, labelKey: 'comparison.period_3m' },
  '6A': { count: 6, labelKey: 'comparison.period_6m' },
  '1Y': { count: 12, labelKey: 'comparison.period_1y' },
  'Tümü': { count: null, labelKey: 'comparison.period_all' }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPeriodStart = (period: Period): Date | null => {
  const m = PERIOD_MONTHS[period].count;
  if (!m) return null;
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return d;
};

const buildStats = (vehicle: Vehicle, logs: ServiceLog[], period: Period, lang: string): VehicleStats => {
  const start = getPeriodStart(period);
  const filtered = logs
    .filter(l => l.vehicleId === vehicle.id)
    .filter(l => {
      if (!start) return true;
      const d = new Date(l.date + 'T00:00:00');
      return d >= start;
    });

  const byCategory = { fuel: 0, maintenance: 0, insurance: 0, other: 0 };
  let fuelLiters = 0;
  const byMonth: Record<string, { cost: number; fuel: number; maintenance: number }> = {};

  filtered.forEach(l => {
    const cat = LOG_CATEGORY_MAP[l.type] || 'other';
    byCategory[cat] += l.cost;
    if (cat === 'fuel' && l.liters) fuelLiters += l.liters;

    if (/^\d{4}-\d{2}/.test(l.date)) {
      const ym = l.date.slice(0, 7);
      if (!byMonth[ym]) byMonth[ym] = { cost: 0, fuel: 0, maintenance: 0 };
      byMonth[ym].cost += l.cost;
      if (cat === 'fuel') byMonth[ym].fuel += l.cost;
      if (cat === 'maintenance') byMonth[ym].maintenance += l.cost;
    }
  });

  const totalCost = Object.values(byCategory).reduce((a, b) => a + b, 0);
  const months = Object.keys(byMonth).length || 1;

  // km estimate: difference in mileage logs
  const sortedByMileage = [...filtered].sort((a, b) => a.mileage - b.mileage);
  const kmInPeriod = sortedByMileage.length >= 2
    ? sortedByMileage[sortedByMileage.length - 1].mileage - sortedByMileage[0].mileage
    : vehicle.mileage;

  // Last service days ago
  const lastLog = [...filtered].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastServiceDays = lastLog
    ? Math.floor((Date.now() - new Date(lastLog.date + 'T00:00:00').getTime()) / 86400000)
    : null;

  // Avg fuel consumption
  const fuelLogs = filtered.filter(l => l.type === 'Yakıt Alımı' && l.liters);
  let avgConsumption: number | null = null;
  if (fuelLogs.length >= 2 && kmInPeriod > 100) {
    avgConsumption = Math.round((fuelLiters / kmInPeriod) * 100 * 10) / 10;
  }

  const monthlyData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([ym, v]) => {
      const [year, month] = ym.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return {
        month: d.toLocaleDateString(lang, { month: 'short' }),
        ...v
      };
    });

  return {
    totalCost,
    fuelCost: byCategory.fuel,
    maintenanceCost: byCategory.maintenance,
    insuranceCost: byCategory.insurance,
    otherCost: byCategory.other,
    totalLogs: filtered.length,
    avgMonthlyCost: Math.round(totalCost / months),
    costPerKm: kmInPeriod > 0 ? Math.round((totalCost / kmInPeriod) * 100) / 100 : 0,
    fuelLiters: Math.round(fuelLiters * 10) / 10,
    avgConsumption,
    lastServiceDays,
    healthScore: vehicle.healthScore,
    monthlyData,
  };
};

// ─── Sub Components ──────────────────────────────────────────────────────────

const WinnerBadge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
    <Trophy size={9} />
    {label}
  </span>
);

const StatRow: React.FC<{
  label: string;
  v1: number | string | null;
  v2: number | string | null;
  unit?: string;
  lowerIsBetter?: boolean;
  format?: 'currency' | 'number' | 'text';
  icon?: React.ElementType;
}> = ({ label, v1, v2, unit = '', lowerIsBetter = false, format = 'currency', icon: Icon }) => {
  const { t, i18n } = useTranslation();

  const fmt = (v: number | string | null) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string') return v;
    if (format === 'currency') return `₺${Number(v).toLocaleString(i18n.language)}`;
    if (format === 'number') return Number(v).toLocaleString(i18n.language);
    return String(v);
  };

  const n1 = typeof v1 === 'number' ? v1 : null;
  const n2 = typeof v2 === 'number' ? v2 : null;
  const winner = n1 !== null && n2 !== null
    ? lowerIsBetter
      ? n1 < n2 ? 1 : n1 > n2 ? 2 : 0
      : n1 > n2 ? 1 : n1 < n2 ? 2 : 0
    : 0;

  const diff = n1 !== null && n2 !== null && n2 !== 0
    ? Math.round(Math.abs(((n1 - n2) / n2) * 100))
    : null;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-800/60 last:border-0">
      <div className="w-8 flex justify-center flex-shrink-0">
        {Icon && <Icon size={14} className="text-slate-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs">{label}</p>
        {diff !== null && diff > 0 && (
          <p className="text-slate-600 text-[10px]">{t('comparison.diff_prefix', { diff })}</p>
        )}
      </div>

      {/* V1 value */}
      <div className="text-right w-28 flex-shrink-0">
        <p className={`text-sm font-bold ${winner === 1 ? 'text-white' : 'text-slate-400'}`}>
          {fmt(v1)}{unit && v1 !== null ? ` ${unit}` : ''}
        </p>
        {winner === 1 && <div className="w-full h-0.5 bg-indigo-500 rounded-full mt-0.5" />}
      </div>

      {/* VS divider */}
      <div className="flex-shrink-0 w-6 flex justify-center">
        {winner === 0
          ? <Minus size={10} className="text-slate-700" />
          : winner === 1
            ? <TrendingUp size={10} className="text-indigo-400" />
            : <TrendingUp size={10} className="text-amber-400 rotate-180" />
        }
      </div>

      {/* V2 value */}
      <div className="text-left w-28 flex-shrink-0">
        <p className={`text-sm font-bold ${winner === 2 ? 'text-white' : 'text-slate-400'}`}>
          {fmt(v2)}{unit && v2 !== null ? ` ${unit}` : ''}
        </p>
        {winner === 2 && <div className="w-full h-0.5 bg-amber-500 rounded-full mt-0.5" />}
      </div>
    </div>
  );
};

const VehicleSelector: React.FC<{
  vehicles: Vehicle[];
  selectedId: string;
  onChange: (id: string) => void;
  color: string;
}> = ({ vehicles, selectedId, onChange, color }) => {
  const selected = vehicles.find(v => v.id === selectedId);
  return (
    <div className="relative flex-1">
      <select
        value={selectedId}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none rounded-2xl border text-white text-sm font-semibold py-3 pl-4 pr-10 focus:outline-none bg-slate-800/60 border-slate-700/50"
        style={{ borderColor: `${color}50` }}
      >
        {vehicles.map(v => (
          <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.year})</option>
        ))}
      </select>
      <div
        className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
        style={{ background: color }}
      />
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const VehicleComparison: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [v1Id, setV1Id] = useState('');
  const [v2Id, setV2Id] = useState('');
  const [period, setPeriod] = useState<Period>('6A');
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'radar'>('overview');

  useEffect(() => {
    const load = async () => {
      const [v, l] = await Promise.all([fetchVehicles(), fetchLogs()]);
      setVehicles(v);
      setLogs(l);
      if (v.length > 0) setV1Id(v[0].id);
      if (v.length > 1) setV2Id(v[1].id);
      else if (v.length === 1) setV2Id(v[0].id);
      setLoading(false);
    };
    load();
  }, []);

  const v1 = useMemo(() => vehicles.find(v => v.id === v1Id), [vehicles, v1Id]);
  const v2 = useMemo(() => vehicles.find(v => v.id === v2Id), [vehicles, v2Id]);

  const stats1 = useMemo(() => v1 ? buildStats(v1, logs, period, i18n.language) : null, [v1, logs, period, i18n.language]);
  const stats2 = useMemo(() => v2 ? buildStats(v2, logs, period, i18n.language) : null, [v2, logs, period, i18n.language]);

  // Radar data: normalize to 0-100
  const radarData = useMemo(() => {
    if (!stats1 || !stats2 || !v1 || !v2) return [];
    const maxCost = Math.max(stats1.totalCost, stats2.totalCost, 1);
    const maxFuel = Math.max(stats1.fuelCost, stats2.fuelCost, 1);
    const maxMaint = Math.max(stats1.maintenanceCost, stats2.maintenanceCost, 1);

    return [
      { subject: t('comparison.radar_health'), A: v1.healthScore, B: v2.healthScore },
      { subject: t('comparison.radar_cost'), A: 100 - Math.round((stats1.totalCost / maxCost) * 100), B: 100 - Math.round((stats2.totalCost / maxCost) * 100) },
      { subject: t('comparison.radar_fuel'), A: 100 - Math.round((stats1.fuelCost / maxFuel) * 100), B: 100 - Math.round((stats2.fuelCost / maxFuel) * 100) },
      { subject: t('comparison.radar_maintenance'), A: 100 - Math.round((stats1.maintenanceCost / maxMaint) * 100), B: 100 - Math.round((stats2.maintenanceCost / maxMaint) * 100) },
      { subject: t('comparison.radar_logs'), A: Math.min(stats1.totalLogs * 10, 100), B: Math.min(stats2.totalLogs * 10, 100) },
    ];
  }, [stats1, stats2, v1, v2, t]);

  // Monthly cost chart data
  const barData = useMemo(() => {
    if (!stats1 || !stats2) return [];
    const months = new Set([
      ...stats1.monthlyData.map(m => m.month),
      ...stats2.monthlyData.map(m => m.month),
    ]);
    return Array.from(months).map(month => ({
      month,
      [v1?.brand + ' ' + v1?.model]: stats1.monthlyData.find(m => m.month === month)?.cost || 0,
      [v2?.brand + ' ' + v2?.model]: stats2.monthlyData.find(m => m.month === month)?.cost || 0,
    }));
  }, [stats1, stats2, v1, v2]);

  // Overall winner
  const overallWinner = useMemo(() => {
    if (!stats1 || !stats2 || !v1 || !v2) return null;
    let score1 = 0, score2 = 0;
    if (stats1.totalCost < stats2.totalCost) score1++; else score2++;
    if (stats1.avgMonthlyCost < stats2.avgMonthlyCost) score1++; else score2++;
    if (stats1.healthScore > stats2.healthScore) score1++; else score2++;
    if (stats1.avgConsumption !== null && stats2.avgConsumption !== null) {
      if (stats1.avgConsumption < stats2.avgConsumption) score1++; else score2++;
    }
    if (score1 === score2) return null;
    return score1 > score2
      ? { vehicle: v1, color: VEHICLE_COLORS[0] }
      : { vehicle: v2, color: VEHICLE_COLORS[1] };
  }, [stats1, stats2, v1, v2]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <ArrowRightLeft className="text-indigo-400 animate-pulse" size={24} />
          </div>
          <p className="text-slate-400 text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (vehicles.length < 2) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
              <ChevronLeft size={20} className="text-slate-300" />
            </button>
            <h1 className="text-lg font-bold text-white">{t('comparison.title')}</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-center px-8 pb-24">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
            <ArrowRightLeft size={32} className="text-slate-500" />
          </div>
          <p className="text-white font-bold text-lg mb-2">{t('comparison.min_two_vehicles')}</p>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {t('comparison.min_two_desc')}
          </p>
          <button
            onClick={() => navigate('/add-vehicle')}
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-sm"
          >
            {t('comparison.add_vehicle')}
          </button>
        </div>
      </div>
    );
  }

  const v1Label = v1 ? `${v1.brand} ${v1.model}` : '—';
  const v2Label = v2 ? `${v2.brand} ${v2.model}` : '—';

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <ChevronLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{t('comparison.title')}</h1>
            <p className="text-slate-500 text-xs">{t('comparison.subtitle')}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1.5">
            <BarChart2 size={12} className="text-indigo-400" />
            <span className="text-indigo-300 text-xs font-medium">{t('comparison.analysis')}</span>
          </div>
        </div>

        {/* Vehicle selectors */}
        <div className="flex items-center gap-2">
          <VehicleSelector vehicles={vehicles} selectedId={v1Id} onChange={setV1Id} color={VEHICLE_COLORS[0]} />
          <button
            onClick={() => { const tmp = v1Id; setV1Id(v2Id); setV2Id(tmp); }}
            className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700"
          >
            <ArrowRightLeft size={14} className="text-slate-400" />
          </button>
          <VehicleSelector vehicles={vehicles} selectedId={v2Id} onChange={setV2Id} color={VEHICLE_COLORS[1]} />
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Period selector */}
        <div className="flex gap-2">
          {(['3A', '6A', '1Y', 'Tümü'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${period === p
                ? 'bg-slate-200 text-slate-900'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                }`}
            >
              {t(PERIOD_MONTHS[p].labelKey)}
            </button>
          ))}
        </div>

        {/* Winner banner */}
        {overallWinner && (
          <div
            className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: `${overallWinner.color}10`, borderColor: `${overallWinner.color}30` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${overallWinner.color}20` }}>
              <Trophy size={20} style={{ color: overallWinner.color }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{overallWinner.vehicle.brand} {overallWinner.vehicle.model}</p>
              <p className="text-slate-400 text-xs">{t('comparison.economic_vehicle')}</p>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex bg-slate-800/40 rounded-2xl p-1 border border-slate-700/30">
          {([
            { key: 'overview', label: t('comparison.overview') },
            { key: 'chart', label: t('comparison.chart') },
            { key: 'radar', label: t('comparison.radar') },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === key ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Vehicle headers */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-800/40 rounded-xl px-3 py-2 border-l-2" style={{ borderColor: VEHICLE_COLORS[0] }}>
            <div className="w-2 h-2 rounded-full" style={{ background: VEHICLE_COLORS[0] }} />
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">{v1Label}</p>
              <p className="text-slate-500 text-[10px]">{v1?.year} • {v1?.mileage.toLocaleString(i18n.language)} km</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-slate-800/40 rounded-xl px-3 py-2 border-l-2" style={{ borderColor: VEHICLE_COLORS[1] }}>
            <div className="w-2 h-2 rounded-full" style={{ background: VEHICLE_COLORS[1] }} />
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">{v2Label}</p>
              <p className="text-slate-500 text-[10px]">{v2?.year} • {v2?.mileage.toLocaleString(i18n.language)} km</p>
            </div>
          </div>
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && stats1 && stats2 && (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden">
            <div className="px-4">
              <StatRow label={t('comparison.total_expense')} v1={stats1.totalCost} v2={stats2.totalCost} lowerIsBetter icon={Wallet} format="currency" />
              <StatRow label={t('comparison.monthly_average')} v1={stats1.avgMonthlyCost} v2={stats2.avgMonthlyCost} lowerIsBetter icon={Calendar} format="currency" />
              <StatRow label={t('comparison.cost_per_km')} v1={stats1.costPerKm} v2={stats2.costPerKm} lowerIsBetter icon={Gauge} format="number" unit="₺/km" />
              <StatRow label={t('comparison.fuel_expense')} v1={stats1.fuelCost} v2={stats2.fuelCost} lowerIsBetter icon={Fuel} format="currency" />
              <StatRow label={t('comparison.maintenance_expense')} v1={stats1.maintenanceCost} v2={stats2.maintenanceCost} lowerIsBetter icon={Wrench} format="currency" />
              <StatRow label={t('comparison.fuel_consumption')} v1={stats1.avgConsumption} v2={stats2.avgConsumption} lowerIsBetter icon={Droplet} format="number" unit="L/100km" />
              <StatRow label={t('comparison.health_score')} v1={stats1.healthScore} v2={stats2.healthScore} lowerIsBetter={false} icon={CheckCircle2} format="number" unit="/100" />
              <StatRow label={t('comparison.total_logs')} v1={stats1.totalLogs} v2={stats2.totalLogs} lowerIsBetter={false} icon={BarChart2} format="number" />
              <StatRow label={t('comparison.last_service')} v1={stats1.lastServiceDays !== null ? t('comparison.days_ago', { count: stats1.lastServiceDays }) : null}
                v2={stats2.lastServiceDays !== null ? t('comparison.days_ago', { count: stats2.lastServiceDays }) : null}
                lowerIsBetter icon={Calendar} format="text" />
            </div>
          </div>
        )}

        {/* ── CHART TAB ── */}
        {activeTab === 'chart' && (
          <div className="space-y-4">
            {/* Cost breakdown bars */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
              <p className="text-white font-semibold text-sm mb-4">{t('comparison.expense_distribution')}</p>
              {stats1 && stats2 && [
                { label: t('comparison.category_fuel'), s1: stats1.fuelCost, s2: stats2.fuelCost, color: '#3b82f6' },
                { label: t('comparison.category_maintenance'), s1: stats1.maintenanceCost, s2: stats2.maintenanceCost, color: '#f59e0b' },
                { label: t('comparison.category_insurance'), s1: stats1.insuranceCost, s2: stats2.insuranceCost, color: '#8b5cf6' },
                { label: t('comparison.category_other'), s1: stats1.otherCost, s2: stats2.otherCost, color: '#64748b' },
              ].map(({ label, s1, s2, color }) => {
                const max = Math.max(s1, s2, 1);
                return (
                  <div key={label} className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-24 text-right truncate">₺{s1.toLocaleString(i18n.language)}</span>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(s1 / max) * 100}%`, background: VEHICLE_COLORS[0] }} />
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(s2 / max) * 100}%`, background: VEHICLE_COLORS[1] }} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-24 truncate">₺{s2.toLocaleString(i18n.language)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Monthly bar chart */}
            {barData.length > 0 && (
              <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
                <p className="text-white font-semibold text-sm mb-4">{t('comparison.monthly_comparison_title')}</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#020617', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }}
                        formatter={(v: number) => [`₺${v.toLocaleString(i18n.language)}`]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey={v1Label} fill={VEHICLE_COLORS[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey={v2Label} fill={VEHICLE_COLORS[1]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RADAR TAB ── */}
        {activeTab === 'radar' && radarData.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
            <p className="text-white font-semibold text-sm mb-1">{t('comparison.multidimensional_comparison')}</p>
            <p className="text-slate-500 text-xs mb-4">{t('comparison.radar_desc')}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Radar name={v1Label} dataKey="A" stroke={VEHICLE_COLORS[0]} fill={VEHICLE_COLORS[0]} fillOpacity={0.2} strokeWidth={2} />
                  <Radar name={v2Label} dataKey="B" stroke={VEHICLE_COLORS[1]} fill={VEHICLE_COLORS[1]} fillOpacity={0.2} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#020617', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar legend note */}
            <div className="flex items-start gap-2 mt-3 bg-slate-800/40 rounded-xl p-3">
              <Info size={12} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-slate-500 text-xs">{t('comparison.radar_legend_note')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
