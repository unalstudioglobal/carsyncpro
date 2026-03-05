import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Fuel, AlertTriangle, CheckCircle2, Gauge,
  TrendingDown, TrendingUp, Minus, Calendar, Clock,
  Settings, RefreshCw, Navigation, Zap, Droplet,
  ChevronRight, Info, Car, BarChart2, Target
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, ReferenceLine } from 'recharts';
import { fetchVehicles, fetchLogs } from '../services/firestoreService';
import { Vehicle, ServiceLog } from '../types';
import { getSetting, saveSetting } from '../services/settingsService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FuelProfile {
  vehicleId: string;
  tankCapacity: number;       // litre
  avgConsumption: number;     // L/100km — otomatik veya manuel
  consumptionOverride: number | null;
  warningThresholdPct: number; // % — uyarı seviyesi (default 20)
  lastFillKm: number | null;
  lastFillDate: string | null;
  lastFillLiters: number | null;
}

interface FuelEstimate {
  estimatedRange: number;       // km kalan menzil
  estimatedRangePct: number;    // tahmini tank doluluk %
  daysSinceLastFill: number | null;
  kmSinceLastFill: number;
  avgConsumption: number | null;
  trend: 'improving' | 'worsening' | 'stable' | 'unknown';
  urgency: 'critical' | 'warning' | 'ok';
  fillSuggestionKm: number;    // kaç km sonra doldur
  consumptionHistory: { month: string; value: number }[];
}

const LS_KEY = 'carsync_fuel_profiles';
const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const loadProfiles = (): Record<string, FuelProfile> => {
  return getSetting<Record<string, FuelProfile>>('fuelPredictions', {});
};
const saveProfiles = (p: Record<string, FuelProfile>) =>
  saveSetting('fuelPredictions', p);

const defaultProfile = (vehicleId: string): FuelProfile => ({
  vehicleId,
  tankCapacity: 50,
  avgConsumption: 8,
  consumptionOverride: null,
  warningThresholdPct: 20,
  lastFillKm: null,
  lastFillDate: null,
  lastFillLiters: null,
});

const calcConsumptionHistory = (logs: ServiceLog[], vehicleId: string) => {
  const fuelLogs = logs
    .filter(l => l.vehicleId === vehicleId && l.type === 'Yakıt Alımı' && l.liters && l.liters > 0)
    .sort((a, b) => a.mileage - b.mileage);

  const byMonth: Record<string, { liters: number; km: number; prevKm: number }> = {};

  for (let i = 1; i < fuelLogs.length; i++) {
    const cur = fuelLogs[i];
    const prev = fuelLogs[i - 1];
    const km = cur.mileage - prev.mileage;
    if (km <= 0 || km > 5000) continue;
    const ym = cur.date.slice(0, 7);
    if (!byMonth[ym]) byMonth[ym] = { liters: 0, km: 0, prevKm: prev.mileage };
    byMonth[ym].liters += cur.liters!;
    byMonth[ym].km += km;
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([ym, d]) => ({
      month: MONTHS_TR[Number(ym.split('-')[1]) - 1],
      value: d.km > 0 ? Math.round((d.liters / d.km) * 100 * 10) / 10 : 0,
    }))
    .filter(d => d.value > 0 && d.value < 25);
};

const buildEstimate = (
  vehicle: Vehicle,
  logs: ServiceLog[],
  profile: FuelProfile
): FuelEstimate => {
  const fuelLogs = logs
    .filter(l => l.vehicleId === vehicle.id && l.type === 'Yakıt Alımı')
    .sort((a, b) => b.mileage - a.mileage);

  const lastFill = fuelLogs[0] || null;

  // Auto-calc average consumption from last 5 fill-ups
  let autoConsumption: number | null = null;
  const history = calcConsumptionHistory(logs, vehicle.id);
  if (history.length >= 2) {
    const avg = history.reduce((s, h) => s + h.value, 0) / history.length;
    autoConsumption = Math.round(avg * 10) / 10;
  }

  const effectiveConsumption = profile.consumptionOverride ?? autoConsumption ?? profile.avgConsumption;
  const kmSinceFill = lastFill ? vehicle.mileage - lastFill.mileage : vehicle.mileage;
  const daysSinceLastFill = lastFill
    ? Math.floor((Date.now() - new Date(lastFill.date + 'T00:00:00').getTime()) / 86400000)
    : null;

  // Estimate liters consumed since last fill
  const litersConsumedEst = (kmSinceFill / 100) * effectiveConsumption;
  const lastFillLiters = lastFill?.liters ?? profile.tankCapacity * 0.9;
  const remainingLiters = Math.max(0, lastFillLiters - litersConsumedEst);
  const estimatedRangePct = Math.min(100, Math.round((remainingLiters / profile.tankCapacity) * 100));
  const estimatedRange = Math.round((remainingLiters / effectiveConsumption) * 100);

  // Trend: compare last 3 months consumption
  let trend: FuelEstimate['trend'] = 'unknown';
  if (history.length >= 4) {
    const recent = history.slice(-2).reduce((s, h) => s + h.value, 0) / 2;
    const older = history.slice(-4, -2).reduce((s, h) => s + h.value, 0) / 2;
    if (recent < older - 0.3) trend = 'improving';
    else if (recent > older + 0.3) trend = 'worsening';
    else trend = 'stable';
  }

  // Urgency
  const urgency: FuelEstimate['urgency'] =
    estimatedRangePct <= 10 ? 'critical' :
      estimatedRangePct <= profile.warningThresholdPct ? 'warning' : 'ok';

  // Fill suggestion: when to refuel (km until warning threshold)
  const fillSuggestionKm = Math.max(0,
    estimatedRange - Math.round((profile.warningThresholdPct / 100) * profile.tankCapacity / effectiveConsumption * 100)
  );

  return {
    estimatedRange,
    estimatedRangePct,
    daysSinceLastFill,
    kmSinceLastFill: kmSinceFill,
    avgConsumption: autoConsumption,
    trend,
    urgency,
    fillSuggestionKm,
    consumptionHistory: history,
  };
};

// ─── Sub Components ──────────────────────────────────────────────────────────

const TankGauge: React.FC<{ pct: number; range: number; urgency: FuelEstimate['urgency']; t: any }> = ({ pct, range, urgency, t }) => {
  const color =
    urgency === 'critical' ? '#ef4444' :
      urgency === 'warning' ? '#f59e0b' : '#10b981';

  const segments = Array.from({ length: 10 }, (_, i) => {
    const segPct = (i + 1) * 10;
    return {
      filled: pct >= segPct - 5,
      color: segPct <= 20 ? '#ef4444' : segPct <= 40 ? '#f59e0b' : '#10b981',
    };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Gauge visualization */}
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {/* Background arc */}
          <circle cx="80" cy="80" r="62" fill="none" stroke="#1e293b" strokeWidth="14"
            strokeDasharray="290 400" strokeDashoffset="-55" strokeLinecap="round" />
          {/* Fill arc */}
          <circle cx="80" cy="80" r="62" fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={`${(pct / 100) * 290} 400`} strokeDashoffset="-55"
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease, stroke 0.5s' }} />
          {/* Warning marker at 20% */}
          <circle cx="80" cy="80" r="62" fill="none" stroke="#f59e0b" strokeWidth="3"
            strokeDasharray="2 398" strokeDashoffset={`${-55 - (0.20 * 290)}`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-white">{pct}%</p>
          <p className="text-slate-500 text-xs font-semibold">{t('fuelReminder.est_fill')}</p>
          <p className="text-sm font-bold mt-1" style={{ color }}>~{range} km</p>
        </div>
      </div>

      {/* Segment bar */}
      <div className="flex gap-1.5 w-full max-w-xs">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex-1 h-2.5 rounded-full transition-all duration-700"
            style={{
              background: seg.filled ? seg.color : '#1e293b',
              opacity: seg.filled ? 1 : 0.4,
              transitionDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between w-full max-w-xs text-xs text-slate-600">
        <span>{t('fuelReminder.empty')}</span>
        <span className="text-amber-500 text-[10px]">⚠ 20%</span>
        <span>{t('fuelReminder.full')}</span>
      </div>
    </div>
  );
};

const StatPill: React.FC<{ icon: React.ElementType; label: string; value: string; color?: string }> = ({
  icon: Icon, label, value, color = 'text-white'
}) => (
  <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 flex items-center gap-2.5">
    <Icon size={15} className="text-slate-500 flex-shrink-0" />
    <div>
      <p className="text-slate-500 text-[10px]">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

// Profile settings panel
const ProfilePanel: React.FC<{
  profile: FuelProfile;
  t: any;

  autoConsumption: number | null;
  onSave: (p: Partial<FuelProfile>) => void;
  onClose: () => void;
}> = ({ profile, autoConsumption, onSave, onClose, t }) => {
  const [tank, setTank] = useState(String(profile.tankCapacity));
  const [override, setOverride] = useState(
    profile.consumptionOverride !== null ? String(profile.consumptionOverride) : ''
  );
  const [threshold, setThreshold] = useState(String(profile.warningThresholdPct));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 rounded-t-3xl border-t border-slate-700 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{t('fuelReminder.settings')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <ChevronLeft size={15} className="text-slate-400 rotate-180" />
          </button>
        </div>

        {/* Tank capacity */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
            {t('fuelReminder.tank_cap')}
          </label>
          <div className="flex gap-2 mb-2">
            {[40, 45, 50, 55, 60, 70].map(v => (
              <button key={v} onClick={() => setTank(String(v))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${tank === String(v) ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >{v}L</button>
            ))}
          </div>
          <input type="number" value={tank} onChange={e => setTank(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm border border-slate-700 focus:outline-none focus:border-green-500" />
        </div>

        {/* Consumption override */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
            {t('fuelReminder.avg_cons')}
          </label>
          {autoConsumption && (
            <p className="text-slate-500 text-xs mb-2 flex items-center gap-1">
              <Zap size={10} className="text-green-400" />
              {t('fuelReminder.auto_calc')}: <span className="text-green-400 font-bold">{autoConsumption} L/100km</span>
              {!override && ' (aktif)'}
            </p>
          )}
          <input type="number" step="0.1" value={override}
            onChange={e => setOverride(e.target.value)}
            placeholder={autoConsumption ? t('fuelReminder.ph_auto', { a: autoConsumption }) : 'örn: 8.5'}
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm border border-slate-700 focus:outline-none focus:border-green-500 placeholder:text-slate-600" />
        </div>

        {/* Warning threshold */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
            {t('fuelReminder.warning_thr')} <span className="text-amber-400 font-bold">%{threshold}</span>
          </label>
          <input type="range" min={10} max={40} step={5}
            value={threshold} onChange={e => setThreshold(e.target.value)}
            className="w-full accent-amber-500" />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            {[10, 15, 20, 25, 30, 35, 40].map(v => <span key={v}>%{v}</span>)}
          </div>
        </div>

        <button
          onClick={() => {
            onSave({
              tankCapacity: Number(tank) || 50,
              consumptionOverride: override ? Number(override) : null,
              warningThresholdPct: Number(threshold) || 20,
            });
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 transition-all"
        >
          {t('fuelReminder.save')}
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const FuelReminder: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, FuelProfile>>({});
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [v, l] = await Promise.all([fetchVehicles(), fetchLogs()]);
      setVehicles(v);
      setLogs(l);
      const saved = loadProfiles();
      // Ensure all vehicles have a profile
      const merged: Record<string, FuelProfile> = {};
      v.forEach(veh => { merged[veh.id] = saved[veh.id] || defaultProfile(veh.id); });
      setProfiles(merged);
      if (v.length > 0) setSelectedId(v[0].id);
      setLoading(false);
    };
    load();
  }, []);

  const vehicle = useMemo(() => vehicles.find(v => v.id === selectedId), [vehicles, selectedId]);
  const profile = useMemo(() => profiles[selectedId] || defaultProfile(selectedId), [profiles, selectedId]);

  const estimate = useMemo(() =>
    vehicle ? buildEstimate(vehicle, logs, profile) : null,
    [vehicle, logs, profile]
  );

  const updateProfile = (data: Partial<FuelProfile>) => {
    const updated = { ...profiles, [selectedId]: { ...profile, ...data } };
    setProfiles(updated);
    saveProfiles(updated);
  };

  const trendIcon = estimate?.trend === 'improving' ? TrendingDown :
    estimate?.trend === 'worsening' ? TrendingUp : Minus;
  const trendColor = estimate?.trend === 'improving' ? 'text-emerald-400' :
    estimate?.trend === 'worsening' ? 'text-red-400' : 'text-slate-400';
  const trendLabel = estimate?.trend === 'improving' ? t('fuelReminder.tr_imp') :
    estimate?.trend === 'worsening' ? t('fuelReminder.tr_wor') :
      estimate?.trend === 'stable' ? t('fuelReminder.tr_stb') : t('fuelReminder.tr_no');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <Fuel className="text-green-400 animate-pulse" size={24} />
          </div>
          <p className="text-slate-400 text-sm">{t('fuelReminder.calculating')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <ChevronLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{t('fuelReminder.title')}</h1>
            <p className="text-slate-500 text-xs">{t('fuelReminder.subtitle')}</p>
          </div>
          <button onClick={() => setShowSettings(true)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <Settings size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Vehicle tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {vehicles.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${selectedId === v.id
                ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                }`}
            >
              <Car size={11} />
              {v.brand} {v.model}
            </button>
          ))}
        </div>
      </div>

      {estimate && vehicle ? (
        <div className="px-4 py-5 space-y-5">
          {/* Urgency banner */}
          {estimate.urgency !== 'ok' && (
            <div className={`rounded-2xl border p-4 flex items-center gap-3 ${estimate.urgency === 'critical'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${estimate.urgency === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'
                }`}>
                <AlertTriangle size={20} className={estimate.urgency === 'critical' ? 'text-red-400' : 'text-amber-400'} />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${estimate.urgency === 'critical' ? 'text-red-300' : 'text-amber-300'}`}>
                  {estimate.urgency === 'critical' ? t('fuelReminder.crit_title') : t('fuelReminder.warn_title')}
                </p>
                <p className={`text-xs mt-0.5 ${estimate.urgency === 'critical' ? 'text-red-400/70' : 'text-amber-400/70'}`}>
                  {estimate.urgency === 'critical'
                    ? t('fuelReminder.crit_desc', { r: estimate.estimatedRange })
                    : t('fuelReminder.warn_desc', { p: estimate.estimatedRangePct })}
                </p>
              </div>
              <button
                onClick={() => navigate('/fuel-finder')}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${estimate.urgency === 'critical'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
              >
                <Navigation size={11} />
                {t('fuelReminder.station')}
              </button>
            </div>
          )}

          {/* Main gauge card */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-800/20 border border-slate-700/40 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white font-bold">{vehicle.brand} {vehicle.model}</p>
                <p className="text-slate-500 text-xs">{vehicle.mileage.toLocaleString('tr-TR')} km • {profile.tankCapacity}L depo</p>
              </div>
              {estimate.urgency === 'ok' && (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="text-emerald-300 text-xs font-medium">{t('fuelReminder.enough_fuel')}</span>
                </div>
              )}
            </div>

            <TankGauge
              pct={estimate.estimatedRangePct}
              range={estimate.estimatedRange}
              urgency={estimate.urgency}
              t={t}
            />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatPill icon={Calendar} label={t('fuelReminder.last_fill')} value={
              estimate.daysSinceLastFill !== null
                ? estimate.daysSinceLastFill === 0 ? t('fuelReminder.d_today')
                  : estimate.daysSinceLastFill === 1 ? t('fuelReminder.d_yest')
                    : t('fuelReminder.d_days', { d: estimate.daysSinceLastFill })
                : t('fuelReminder.no_rec')
            } color={estimate.daysSinceLastFill && estimate.daysSinceLastFill > 20 ? 'text-amber-400' : 'text-white'} />
            <StatPill icon={Gauge} label={t('fuelReminder.km_since')} value={`${estimate.kmSinceLastFill.toLocaleString('tr-TR')} km`} />
            <StatPill icon={Droplet} label={t('fuelReminder.avg_c')} value={
              estimate.avgConsumption ? `${estimate.avgConsumption} L/100km` : `${profile.avgConsumption} L/100km ${t('fuelReminder.manual')}`
            } color="text-blue-400" />
            <StatPill icon={Target} label={t('fuelReminder.fill_rec')} value={
              estimate.fillSuggestionKm > 0
                ? t('fuelReminder.after_km', { k: estimate.fillSuggestionKm })
                : t('fuelReminder.fill_now')
            } color={estimate.fillSuggestionKm <= 0 ? 'text-red-400' : 'text-emerald-400'} />
          </div>

          {/* Consumption trend */}
          {estimate.consumptionHistory.length >= 2 && (
            <div className="rounded-2xl bg-slate-800/30 border border-slate-700/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 size={14} className="text-slate-400" />
                  <p className="text-white font-semibold text-sm">{t('fuelReminder.trend')}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${trendColor}`}>
                  {React.createElement(trendIcon, { size: 12 })}
                  {trendLabel}
                </div>
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={estimate.consumptionHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#020617', border: '1px solid #334155', borderRadius: 10, fontSize: 11 }}
                      formatter={(v: number) => [`${v} L/100km`, t('fuelReminder.tt_val')]}
                    />
                    <ReferenceLine y={8} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
                    <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2}
                      fill="url(#fuelGrad)" dot={{ r: 3, fill: '#22c55e' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-slate-600 text-[10px] text-right mt-1">{t('fuelReminder.ref_line', { v: 8 })}</p>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/30 p-4 space-y-2.5">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={13} className="text-green-400" />
              <p className="text-slate-300 text-xs font-semibold">{t('fuelReminder.tips_title')}</p>
            </div>
            {[t('fuelReminder.tip_1'), t('fuelReminder.tip_2'), t('fuelReminder.tip_3')].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-400 text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-slate-500 text-xs leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>

          {/* Quick action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('/add-record', { state: { serviceType: 'Yakıt Alımı', vehicleId: selectedId } })}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 transition-all shadow-lg shadow-green-500/15"
            >
              <Fuel size={16} />
              {t('fuelReminder.add_rec')}
            </button>
            <button
              onClick={() => navigate('/fuel-finder')}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-all"
            >
              <Navigation size={16} />
              {t('fuelReminder.find_station')}
            </button>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
            <Info size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-slate-500 text-xs leading-relaxed">
              {t('fuelReminder.disclaimer')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
            <Fuel size={36} className="text-slate-600" />
          </div>
          <p className="text-white font-bold text-lg mb-2">{t('fuelReminder.no_data_title')}</p>
          <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
            {t('fuelReminder.no_data_desc')}
          </p>
          <button
            onClick={() => navigate('/add-record', { state: { serviceType: 'Yakıt Alımı' } })}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-green-600 text-white font-bold text-sm"
          >
            <Fuel size={16} />
            {t('fuelReminder.first_rec')}
          </button>
        </div>
      )}

      {showSettings && vehicle && (
        <ProfilePanel
          profile={profile}
          autoConsumption={estimate?.avgConsumption ?? null}
          onSave={updateProfile}
          onClose={() => setShowSettings(false)}
          t={t}
        />
      )}
    </div>
  );
};
