import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Car, Wrench, Fuel, BarChart2, Bell, Settings,
  FileText, ChevronRight, Clock, Droplet, RotateCw, Battery,
  ClipboardCheck, Sparkles, Disc, Shield, Calendar, Users,
  QrCode, Gauge, TrendingUp, Zap, Hash, ArrowUpRight,
  Navigation, MapPin
} from 'lucide-react';
import { fetchVehicles, fetchLogs } from '../services/firestoreService';
import { Vehicle, ServiceLog } from '../types';
import { getSetting, saveSetting, removeSetting } from '../services/settingsService';
import { useTranslation } from 'react-i18next';

// ─── Types ───────────────────────────────────────────────────────────────────

type ResultCategory = 'vehicle' | 'log' | 'page' | 'action';

interface SearchResult {
  id: string;
  category: ResultCategory;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  route: string;
  keywords: string[];
  badge?: string;
  badgeColor?: string;
}

// ─── Log Meta ─────────────────────────────────────────────────────────────────

// ─── Log Meta ─────────────────────────────────────────────────────────────────

const LOG_ICONS: Record<string, React.ElementType> = {
  'Yakıt Alımı': Fuel, 'Yağ Değişimi': Droplet, 'Periyodik Bakım': Wrench,
  'Lastik Değişimi': Disc, 'Lastik Rotasyonu': RotateCw,
  'Fren Servisi': Wrench, 'Akü Değişimi': Battery,
  'Muayene': ClipboardCheck, 'Yıkama & Detay': Sparkles,
};
const LOG_COLORS: Record<string, [string, string]> = {
  'Yakıt Alımı': ['#3b82f6', 'rgba(59,130,246,0.12)'],
  'Yağ Değişimi': ['#f59e0b', 'rgba(245,158,11,0.12)'],
  'Periyodik Bakım': ['#6366f1', 'rgba(99,102,241,0.12)'],
  'Lastik Değişimi': ['#8b5cf6', 'rgba(139,92,246,0.12)'],
  'Fren Servisi': ['#ef4444', 'rgba(239,68,68,0.12)'],
  'Akü Değişimi': ['#eab308', 'rgba(234,179,8,0.12)'],
  'Muayene': ['#14b8a6', 'rgba(20,184,166,0.12)'],
};

const formatDate = (d: string, locale: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
};

const normalize = (s: string) =>
  s.toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ş/g, 's')
    .replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u');

// ─── Recent Searches ─────────────────────────────────────────────────────────

const LS_RECENT = 'carsync_search_recent';
const loadRecent = (): string[] => {
  return getSetting<string[]>('recentSearches', []);
};
const addRecent = (q: string) => {
  const prev = loadRecent().filter(r => r !== q);
  saveSetting('recentSearches', [q, ...prev].slice(0, 8));
};
const clearRecent = () => removeSetting('recentSearches');

// ─── Main Component ──────────────────────────────────────────────────────────

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();

  const STATIC_RESULTS: SearchResult[] = useMemo(() => [
    // Pages
    { id: 'p-garage', category: 'page', title: t('nav.garage'), subtitle: t('nav.garage_subtitle', 'Tüm araçlarını görüntüle'), icon: Car, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.12)', route: '/', keywords: ['garaj', 'araç', 'home', 'anasayfa'] },
    { id: 'p-analytics', category: 'page', title: t('nav.analytics'), subtitle: t('nav.analytics_subtitle', 'Harcama analizi ve grafikler'), icon: BarChart2, iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.12)', route: '/analytics', keywords: ['analiz', 'harcama', 'grafik', 'rapor', 'para'] },
    { id: 'p-logs', category: 'page', title: t('nav.records'), subtitle: t('nav.records_subtitle', 'Tüm bakım ve yakıt kayıtları'), icon: FileText, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)', route: '/logs', keywords: ['kayıt', 'servis', 'bakım', 'yakıt', 'log'] },
    { id: 'p-settings', category: 'page', title: t('nav.settings'), subtitle: t('nav.settings_subtitle', 'Hesap ve uygulama ayarları'), icon: Settings, iconColor: '#64748b', iconBg: 'rgba(100,116,139,0.12)', route: '/settings', keywords: ['ayar', 'profil', 'hesap', 'şifre'] },
    { id: 'p-notif', category: 'page', title: t('nav.notifications'), subtitle: t('nav.notifications_subtitle', 'Uyarılar ve hatırlatmalar'), icon: Bell, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)', route: '/notifications', keywords: ['bildirim', 'uyarı', 'hatırlatma', 'alert'] },
    { id: 'p-budget', category: 'page', title: t('nav.budget'), subtitle: t('nav.budget_subtitle', 'Aylık harcama limitleri'), icon: Gauge, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)', route: '/budget-goals', keywords: ['bütçe', 'limit', 'harcama', 'para', 'hedef'] },
    { id: 'p-compare', category: 'page', title: t('comparison.title'), subtitle: t('comparison.subtitle'), icon: TrendingUp, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.12)', route: '/vehicle-comparison', keywords: ['karşılaştır', 'analiz', 'başabaş', 'araç'] },
    { id: 'p-calendar', category: 'page', title: t('nav.insurance_calendar'), subtitle: t('nav.insurance_calendar_subtitle', 'Sigorta ve muayene takibi'), icon: Calendar, iconColor: '#f43f5e', iconBg: 'rgba(244,63,94,0.12)', route: '/insurance-calendar', keywords: ['sigorta', 'muayene', 'takvim', 'kasko', 'tarih'] },
    { id: 'p-qr', category: 'page', title: t('nav.qr_card'), subtitle: t('nav.qr_card_subtitle', 'Paylaşılabilir araç kartı'), icon: QrCode, iconColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.12)', route: '/vehicle-qr', keywords: ['qr', 'kod', 'kart', 'paylaş', 'servis'] },
    { id: 'p-report', category: 'page', title: t('nav.pdf_report'), subtitle: t('nav.pdf_report_subtitle', 'Servis geçmişi PDF\'i'), icon: FileText, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)', route: '/service-report', keywords: ['pdf', 'rapor', 'indir', 'servis', 'geçmiş'] },
    { id: 'p-family', category: 'page', title: t('nav.family_garage'), subtitle: t('nav.family_garage_subtitle', 'Paylaşımlı araç yönetimi'), icon: Users, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)', route: '/family-garage', keywords: ['aile', 'paylaş', 'kullanıcı', 'ekip'] },
    { id: 'p-fuel', category: 'page', title: t('nav.fuel_tracking'), subtitle: t('nav.fuel_tracking_subtitle', 'Menzil tahmini ve tüketim'), icon: Fuel, iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.12)', route: '/fuel-reminder', keywords: ['yakıt', 'menzil', 'tüketim', 'litre', 'dolum'] },
    { id: 'p-appt', category: 'page', title: t('nav.service_appointments'), subtitle: t('nav.service_appointments_subtitle', 'Randevu planlama ve takibi'), icon: Calendar, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.12)', route: '/service-appointment', keywords: ['randevu', 'servis', 'tarih', 'plan', 'tamir'] },
    { id: 'p-fuelmap', category: 'page', title: t('nav.find_station'), subtitle: t('nav.find_station_subtitle', 'Yakın akaryakıt istasyonları'), icon: Navigation, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)', route: '/fuel-finder', keywords: ['istasyon', 'petrol', 'benzin', 'yakıt', 'harita'] },
    { id: 'p-theme', category: 'page', title: t('nav.theme_customization'), subtitle: t('nav.theme_customization_subtitle', 'Renk ve görünüm ayarları'), icon: Sparkles, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)', route: '/theme', keywords: ['tema', 'renk', 'görünüm', 'özelleştir', 'karanlık'] },
    { id: 'p-ai', category: 'page', title: t('nav.ai_maintenance'), subtitle: t('nav.ai_maintenance_subtitle', 'Yapay zeka ile bakım önerileri'), icon: Zap, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.12)', route: '/predictive-maintenance', keywords: ['yapay', 'zeka', 'ai', 'tahmin', 'bakım'] },
    { id: 'p-damage', category: 'page', title: t('nav.damage_detection'), subtitle: t('nav.damage_detection_subtitle', 'Fotoğraftan hasar analizi'), icon: Shield, iconColor: '#f43f5e', iconBg: 'rgba(244,63,94,0.12)', route: '/damage-detection', keywords: ['hasar', 'fotoğraf', 'tespit', 'kaza', 'analiz'] },
    { id: 'p-chat', category: 'page', title: t('nav.car_assistant'), subtitle: t('nav.car_assistant_subtitle', 'AI ile sohbet et'), icon: Zap, iconColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.12)', route: '/car-chat', keywords: ['sohbet', 'asistan', 'ai', 'soru', 'chat'] },
    // Actions
    { id: 'a-add-vehicle', category: 'action', title: t('nav.add_vehicle'), subtitle: t('nav.add_vehicle_subtitle', 'Garaja araç ekle'), icon: Car, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)', route: '/add-vehicle', keywords: ['ekle', 'yeni', 'araç', 'kayıt', 'oluştur'], badge: t('search.badge_action', 'Eylem'), badgeColor: '#10b981' },
    { id: 'a-add-log', category: 'action', title: t('nav.add_record'), subtitle: t('nav.add_record_subtitle', 'Bakım veya yakıt kaydı oluştur'), icon: Wrench, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)', route: '/add-record', keywords: ['bakım', 'kayıt', 'ekle', 'yakıt', 'servis'], badge: t('search.badge_action', 'Eylem'), badgeColor: '#f59e0b' },
    { id: 'a-add-appt', category: 'action', title: t('nav.create_appointment'), subtitle: t('nav.create_appointment_subtitle', 'Servis randevusu planla'), icon: Calendar, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)', route: '/service-appointment', keywords: ['randevu', 'oluştur', 'planla', 'servis'], badge: t('search.badge_action', 'Eylem'), badgeColor: '#8b5cf6' },
  ], [t]);

  const [query, setQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Load data once on open
  useEffect(() => {
    if (isOpen && !loaded) {
      Promise.all([fetchVehicles(), fetchLogs()]).then(([v, l]) => {
        setVehicles(v);
        setLogs(l);
        setLoaded(true);
      });
    }
    if (isOpen) {
      setRecent(loadRecent());
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Build vehicle results
  const vehicleResults: SearchResult[] = useMemo(() =>
    vehicles.map(v => ({
      id: `v-${v.id}`,
      category: 'vehicle' as const,
      title: `${v.brand} ${v.model}`,
      subtitle: `${v.plate} · ${v.mileage.toLocaleString(i18n.language)} km · ${t('comparison.health_score')}: ${v.healthScore}/100`,
      icon: Car,
      iconColor: '#6366f1',
      iconBg: 'rgba(99,102,241,0.12)',
      route: `/dashboard/${v.id}`,
      keywords: [v.brand, v.model, v.plate, String(v.year)].map(normalize),
      badge: v.status === 'Acil' ? t('dashboard.vehicle_status.urgent') : v.status === 'Servis Gerekli' ? t('dashboard.vehicle_status.service_required') : undefined,
      badgeColor: v.status === 'Acil' ? '#ef4444' : '#f59e0b',
    })),
    [vehicles]
  );

  // Build log results (show recent 200)
  const logResults: SearchResult[] = useMemo(() =>
    logs
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 200)
      .map(l => {
        const vehicle = vehicles.find(v => v.id === l.vehicleId);
        const [color, bg] = LOG_COLORS[l.type] || ['#64748b', 'rgba(100,116,139,0.12)'];
        const Icon = LOG_ICONS[l.type] || Wrench;
        return {
          id: `l-${l.id}`,
          category: 'log' as const,
          title: l.type,
          subtitle: `${vehicle?.brand || ''} ${vehicle?.model || ''} · ${formatDate(l.date, i18n.language)} · ₺${l.cost.toLocaleString(i18n.language)}`,
          icon: Icon,
          iconColor: color,
          iconBg: bg,
          route: '/logs',
          keywords: [l.type, vehicle?.brand || '', vehicle?.model || '', vehicle?.plate || '', l.date, l.notes || ''].map(normalize),
        };
      }),
    [logs, vehicles]
  );

  // All searchable results
  const allResults = useMemo(() =>
    [...vehicleResults, ...STATIC_RESULTS, ...logResults],
    [vehicleResults, logResults]
  );

  // Filter
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = normalize(query.trim());
    const words = q.split(/\s+/);
    return allResults
      .filter(r => {
        const haystack = [normalize(r.title), normalize(r.subtitle || ''), ...r.keywords].join(' ');
        return words.every(w => haystack.includes(w));
      })
      .slice(0, 24);
  }, [query, allResults]);

  // Group results
  const grouped = useMemo(() => {
    const g: Record<string, SearchResult[]> = {};
    results.forEach(r => {
      const key = r.category === 'vehicle' ? t('search.categories.vehicles') :
        r.category === 'log' ? t('search.categories.logs') :
          r.category === 'action' ? t('search.categories.actions') : t('search.categories.pages');
      if (!g[key]) g[key] = [];
      g[key].push(r);
    });
    return g;
  }, [results, t]);

  const flatResults = useMemo(() =>
    Object.values(grouped).flat(), [grouped]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatResults.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && flatResults[activeIdx]) {
        handleSelect(flatResults[activeIdx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, flatResults, activeIdx]);

  const handleSelect = useCallback((result: SearchResult) => {
    if (query.trim()) addRecent(query.trim());
    setRecent(loadRecent());
    navigate(result.route);
    onClose();
  }, [query, navigate, onClose]);

  const handleRecentClick = (q: string) => {
    setQuery(q);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  const CAT_ORDER = [
    t('search.categories.actions'),
    t('search.categories.vehicles'),
    t('search.categories.pages'),
    t('search.categories.logs')
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-slate-950/80 backdrop-blur-xl animate-fadeIn overflow-hidden"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Ambient Animated Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[100px] animate-float-blob pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 rounded-full blur-[120px] animate-float-blob-delayed pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[40%] bg-amber-500/10 rounded-full blur-[100px] animate-float-blob-slow pointer-events-none" />

      <div className="relative w-full max-w-2xl mx-auto h-full px-4 pt-16 flex flex-col pb-6">
        {/* Search input */}
        <div className="glass-panel-premium flex items-center gap-3 px-5 py-3 mb-4 relative z-10 transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-400/50">
          <Search size={18} className="text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent border-none outline-none text-slate-50 text-base py-1"
          />
          {query && (
            <button onClick={() => setQuery('')} className="bg-transparent border-none cursor-pointer p-1 text-slate-400 hover:text-slate-300 transition-colors">
              <X size={16} />
            </button>
          )}
          <kbd className="bg-slate-800/80 border border-slate-700/60 rounded-md px-2 py-1 text-slate-400 text-[11px] shrink-0 font-medium">ESC</kbd>
        </div>

        {/* Results */}
        <div className="glass-panel-premium flex-1 overflow-y-auto relative z-10 hide-scrollbar flex flex-col">
          {/* Empty state — show recent + shortcuts */}
          {!query && (
            <div style={{ padding: 20 }}>
              {recent.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-slate-500 text-xs font-bold tracking-wider">{t('search.recent')}</p>
                    <button onClick={() => { clearRecent(); setRecent([]); }} className="text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors">
                      {t('search.clear')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map(r => (
                      <button key={r} onClick={() => handleRecentClick(r)} className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600 rounded-xl px-3 py-1.5 text-slate-300 hover:text-white text-xs font-medium transition-all group">
                        <Clock size={12} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-slate-500 text-xs font-bold tracking-wider mb-3">{t('search.quick_access')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {STATIC_RESULTS.filter(r => r.category === 'action').concat(
                  STATIC_RESULTS.filter(r => ['p-garage', 'p-logs', 'p-analytics', 'p-notif'].includes(r.id))
                ).slice(0, 6).map((r, index) => {
                  const RIcon = r.icon;
                  return (
                    <button key={r.id} onClick={() => handleSelect(r)} className="group flex items-center gap-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 hover:border-indigo-500/50 rounded-2xl p-3 cursor-pointer text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-slideDown" style={{ animationDelay: `${index * 0.05}s` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: r.iconBg }}>
                        <RIcon size={18} color={r.iconColor} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-200 text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-white transition-colors">{r.title}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results */}
          {query && results.length > 0 && (
            <div style={{ padding: '8px 0' }}>
              {CAT_ORDER.filter(c => grouped[c]).map(cat => (
                <div key={cat}>
                  <p className="text-slate-500 text-xs font-bold tracking-wider px-4 py-2 pt-4">
                    {cat.toUpperCase()} ({grouped[cat].length})
                  </p>
                  {grouped[cat].map(r => {
                    const RIcon = r.icon;
                    const isActive = flatResults.indexOf(r) === activeIdx;
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleSelect(r)}
                        onMouseEnter={() => setActiveIdx(flatResults.indexOf(r))}
                        className={`w-full flex items-center gap-3 px-4 py-3 border-l-2 cursor-pointer text-left transition-all duration-200 ${isActive ? 'bg-indigo-500/10 border-indigo-500' : 'bg-transparent border-transparent hover:bg-slate-800/50'}`}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.iconBg }}>
                          <RIcon size={18} color={r.iconColor} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.title}
                            </p>
                            {r.badge && (
                              <span style={{ background: `${r.badgeColor}20`, border: `1px solid ${r.badgeColor}40`, borderRadius: 6, padding: '1px 7px', color: r.badgeColor, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                                {r.badge}
                              </span>
                            )}
                          </div>
                          {r.subtitle && (
                            <p style={{ color: '#64748b', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowUpRight size={14} color={isActive ? '#6366f1' : '#334155'} style={{ flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {query && results.length === 0 && loaded && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(30,41,59,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Search size={24} color="#334155" />
              </div>
              <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{t('search.no_results')}</p>
              <p style={{ color: '#475569', fontSize: 13 }}>
                {t('search.no_results_desc', { query })}
              </p>
            </div>
          )}

          {/* Footer hint */}
          {results.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderTop: '1px solid rgba(30,41,59,0.8)',
            }}>
              <div style={{ display: 'flex', gap: 16 }}>
                {[['↑↓', t('search.hint_nav')], ['↵', t('search.hint_open')], ['ESC', t('search.hint_close')]].map(([key, label]) => (
                  <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <kbd style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 5, padding: '2px 6px', color: '#475569', fontSize: 10 }}>{key}</kbd>
                    <span style={{ color: '#334155', fontSize: 11 }}>{label}</span>
                  </span>
                ))}
              </div>
              <span style={{ color: '#1e293b', fontSize: 11 }}>{t('search.count', { count: results.length })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Search Trigger Button ────────────────────────────────────────────────────

export const SearchTrigger: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 bg-slate-800/60 hover:bg-indigo-500/10 border border-slate-700/50 hover:border-indigo-500/50 rounded-xl px-3.5 py-2.5 cursor-pointer w-full text-left transition-all group"
    >
      <Search size={15} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
      <span className="flex-1 text-slate-400 text-sm group-hover:text-slate-300 transition-colors">{t('search.trigger_placeholder')}</span>
      <kbd className="bg-slate-900/80 border border-slate-700/50 rounded-md px-2 py-0.5 text-slate-500 text-[11px] font-medium group-hover:text-indigo-300 transition-colors">
        ⌘K
      </kbd>
    </button>
  );
};

// ─── useGlobalSearch Hook ─────────────────────────────────────────────────────

export const useGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
};
