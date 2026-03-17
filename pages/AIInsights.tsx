import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Sparkles, Brain, AlertTriangle, CheckCircle2,
  Info, Zap, TrendingUp, TrendingDown, Minus, RefreshCw,
  Wrench, Fuel, Shield, DollarSign, FileText, Calendar,
  ChevronRight, Clock, Car
} from 'lucide-react';
import { fetchVehicles, fetchLogs, fetchAppointments, fetchOBDData } from '../services/firestoreService';
import { useData } from '../context/DataContext';
import {
  getProactiveAlerts, getDetailedHealthScore, getMaintenanceSchedule,
  type ProactiveAlert, type HealthScoreDetail, type MaintenanceScheduleItem,
} from '../services/geminiService';
import { Vehicle, ServiceLog, Appointment, OBDData } from '../types';
import { toast } from '../services/toast';

// ── Yardımcı bileşenler ───────────────────────────────────

const ALERT_CONFIG = {
  urgent:  { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    icon: AlertTriangle,  badge: 'bg-red-500/20 text-red-300' },
  warning: { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  icon: Zap,            badge: 'bg-amber-500/20 text-amber-300' },
  info:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   icon: Info,           badge: 'bg-blue-500/20 text-blue-300' },
  tip:     { bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-400',icon: CheckCircle2,   badge: 'bg-emerald-500/20 text-emerald-300' },
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  maintenance: Wrench,
  fuel:        Fuel,
  safety:      Shield,
  cost:        DollarSign,
  document:    FileText,
};

const HEALTH_COLORS = (score: number) => {
  if (score >= 85) return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
  if (score >= 65) return { bar: 'bg-amber-500',   text: 'text-amber-400' };
  return              { bar: 'bg-red-500',         text: 'text-red-400' };
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  const c = HEALTH_COLORS(score);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${c.text}`}>{score}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function LoadingCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 bg-white/5 rounded-2xl" />
      ))}
    </div>
  );
}

const MONTH_NAMES = [
  '', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const PRIORITY_CONFIG = {
  critical:    { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25',    label: 'Kritik' },
  recommended: { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  label: 'Önerilen' },
  optional:    { text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   label: 'İsteğe bağlı' },
};

// ── Ana Bileşen ───────────────────────────────────────────

export const AIInsights: React.FC = () => {
  const { vehicles, logs, appointments, loading } = useData();

  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [healthDetail, setHealthDetail] = useState<HealthScoreDetail | null>(null);
  const [schedule, setSchedule] = useState<MaintenanceScheduleItem[]>([]);

  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Araç ve log verilerini yükle
  useEffect(() => {
    if (!loading && vehicles.length > 0) {
      if (id) {
        const found = vehicles.find(v => v.id === id);
        setSelectedVehicle(found || vehicles[0]);
      } else {
        setSelectedVehicle(vehicles[0]);
      }
      setPageLoading(false);
    } else if (!loading && vehicles.length === 0) {
      setPageLoading(false);
    }
  }, [loading, vehicles, id]);

  // Araç değişince tüm AI analizlerini yenile
  const runAllAnalyses = useCallback(async () => {
    if (!selectedVehicle) return;

    setLoadingAlerts(true);
    setLoadingHealth(true);
    setLoadingSchedule(true);

    const [ls, as, os] = await Promise.all([
      fetchLogs(selectedVehicle.id),
      fetchAppointments(selectedVehicle.id),
      fetchOBDData(selectedVehicle.id)
    ]);

    // Paralel AI çağrıları
    const [alertsRes, healthRes, scheduleRes] = await Promise.allSettled([
      getProactiveAlerts(selectedVehicle, ls, as, os[0]),
      getDetailedHealthScore(selectedVehicle, ls, os[0]),
      getMaintenanceSchedule(selectedVehicle, ls),
    ]);

    if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value);
    setLoadingAlerts(false);

    if (healthRes.status === 'fulfilled') setHealthDetail(healthRes.value);
    setLoadingHealth(false);

    if (scheduleRes.status === 'fulfilled') setSchedule(scheduleRes.value);
    setLoadingSchedule(false);
  }, [selectedVehicle]);

  useEffect(() => {
    if (selectedVehicle) runAllAnalyses();
  }, [selectedVehicle]);

  const handleVehicleSwitch = async (v: Vehicle) => {
    setSelectedVehicle(v);
    setAlerts([]);
    setHealthDetail(null);
    setSchedule([]);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-purple-400" />
                <h1 className="font-bold text-lg">AI İçgörüler</h1>
              </div>
              <p className="text-xs text-slate-500">Proaktif analiz & kişisel takvim</p>
            </div>
          </div>
          <button
            onClick={runAllAnalyses}
            disabled={loadingAlerts || loadingHealth || loadingSchedule}
            className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center hover:bg-purple-500/30 transition disabled:opacity-40"
          >
            <RefreshCw size={16} className={`text-purple-400 ${(loadingAlerts || loadingHealth || loadingSchedule) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-6">

        {/* Araç Seçici */}
        {vehicles.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => handleVehicleSwitch(v)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition
                  ${selectedVehicle?.id === v.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                {v.brand} {v.model}
              </button>
            ))}
          </div>
        )}

        {/* Seçili araç başlığı */}
        {selectedVehicle && (
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Car size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="font-bold">{selectedVehicle.brand} {selectedVehicle.model}</p>
              <p className="text-xs text-slate-500">{selectedVehicle.year} · {selectedVehicle.mileage.toLocaleString('tr-TR')} km</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-black text-purple-400">{selectedVehicle.healthScore}</p>
              <p className="text-xs text-slate-500">Sağlık</p>
            </div>
          </div>
        )}

        {/* ── BÖLÜM 1: Proaktif Uyarılar ──────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <h2 className="font-bold text-base">Proaktif Uyarılar</h2>
              {alerts.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full">
                  {alerts.length}
                </span>
              )}
            </div>
          </div>

          {loadingAlerts ? (
            <LoadingCard rows={3} />
          ) : alerts.length === 0 ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-emerald-300">Her şey yolunda</p>
                <p className="text-xs text-slate-400 mt-0.5">Kritik bir uyarı tespit edilmedi.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => {
                const cfg = ALERT_CONFIG[alert.type];
                const AlertIcon = cfg.icon;
                const CatIcon = CATEGORY_ICON[alert.category] || Wrench;
                return (
                  <div
                    key={alert.id}
                    className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <AlertIcon size={16} className={`flex-shrink-0 ${cfg.text}`} />
                        <p className="font-bold text-sm leading-tight">{alert.title}</p>
                      </div>
                      <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.badge}`}>
                        <CatIcon size={10} />
                        {alert.category === 'maintenance' ? 'Bakım'
                          : alert.category === 'fuel'     ? 'Yakıt'
                          : alert.category === 'safety'   ? 'Güvenlik'
                          : alert.category === 'cost'     ? 'Maliyet'
                          : 'Belge'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3">
                        {alert.estimatedCost && (
                          <span className="text-xs text-slate-400">
                            ~{alert.estimatedCost.toLocaleString('tr-TR')} TL
                          </span>
                        )}
                        {alert.daysLeft !== undefined && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={10} />
                            {alert.daysLeft} gün
                          </span>
                        )}
                      </div>
                      {alert.actionLabel && alert.actionRoute && (
                        <button
                          onClick={() => navigate(alert.actionRoute!)}
                          className={`flex items-center gap-1 text-xs font-bold ${cfg.text} hover:opacity-80 transition`}
                        >
                          {alert.actionLabel}
                          <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── BÖLÜM 2: Detaylı Sağlık Skoru ────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-blue-400" />
            <h2 className="font-bold text-base">Sağlık Analizi</h2>
          </div>

          {loadingHealth ? (
            <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
          ) : healthDetail ? (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-5">

              {/* Trend + Özet */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {healthDetail.trend === 'improving' && <TrendingUp size={16} className="text-emerald-400" />}
                    {healthDetail.trend === 'declining' && <TrendingDown size={16} className="text-red-400" />}
                    {healthDetail.trend === 'stable'    && <Minus size={16} className="text-slate-400" />}
                    <span className="text-xs font-bold text-slate-400">
                      {healthDetail.trend === 'improving' ? 'İyileşiyor' :
                       healthDetail.trend === 'declining' ? 'Kötüleşiyor' : 'Stabil'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{healthDetail.summary}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-3xl font-black ${HEALTH_COLORS(healthDetail.overall).text}`}>
                    {healthDetail.overall}
                  </p>
                  <p className="text-xs text-slate-500">/100</p>
                </div>
              </div>

              {/* Kategori çubukları */}
              <div className="space-y-3">
                {Object.entries(healthDetail.categories).map(([key, cat]) => {
                  const labels: Record<string, string> = {
                    engine: 'Motor', fuel: 'Yakıt', safety: 'Güvenlik',
                    body: 'Kasa / Dış', documents: 'Belgeler',
                  };
                  return (
                    <div key={key}>
                      <ScoreBar score={cat.score} label={`${labels[key] || key} — ${cat.label}`} />
                      <p className="text-xs text-slate-500 mt-0.5 pl-0.5">{cat.note}</p>
                    </div>
                  );
                })}
              </div>

              {/* En kritik risk */}
              {healthDetail.topRisk && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{healthDetail.topRisk}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-16 bg-white/5 rounded-2xl flex items-center justify-center">
              <p className="text-xs text-slate-500">Analiz başlatılıyor…</p>
            </div>
          )}
        </section>

        {/* ── BÖLÜM 3: Kişisel Bakım Takvimi ───────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-emerald-400" />
            <h2 className="font-bold text-base">12 Aylık Bakım Takvimi</h2>
          </div>

          {loadingSchedule ? (
            <LoadingCard rows={4} />
          ) : schedule.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-sm text-slate-400">Takvim oluşturuluyor…</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((item, i) => {
                const pc = PRIORITY_CONFIG[item.priority];
                return (
                  <div
                    key={i}
                    className={`${pc.bg} border ${pc.border} rounded-2xl p-4 space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className={pc.text} />
                        <span className="font-bold text-sm">
                          {MONTH_NAMES[item.month]} {item.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${pc.text}`}>{pc.label}</span>
                        <span className="text-xs text-slate-400">
                          ~{item.estimatedCost.toLocaleString('tr-TR')} TL
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {item.tasks.map((task, j) => (
                        <li key={j} className="flex items-center gap-2 text-xs text-slate-300">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pc.text.replace('text-', 'bg-')}`} />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {/* Toplam maliyet özeti */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">12 Aylık Tahmini Toplam</span>
                </div>
                <span className="font-black text-white text-lg">
                  {schedule.reduce((s, x) => s + x.estimatedCost, 0).toLocaleString('tr-TR')} TL
                </span>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default AIInsights;
