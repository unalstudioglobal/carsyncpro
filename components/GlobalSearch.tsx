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

// ─── Static Pages & Actions ──────────────────────────────────────────────────

const STATIC_RESULTS: SearchResult[] = [
  // Pages
  { id: 'p-garage', category: 'page', title: 'Garajım', subtitle: 'Tüm araçlarını görüntüle', icon: Car, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.12)', route: '/', keywords: ['garaj', 'araç', 'home', 'anasayfa'] },
  { id: 'p-analytics', category: 'page', title: 'Analitik & Raporlar', subtitle: 'Harcama analizi ve grafikler', icon: BarChart2, iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.12)', route: '/analytics', keywords: ['analiz', 'harcama', 'grafik', 'rapor', 'para'] },
  { id: 'p-logs', category: 'page', title: 'Servis Kayıtları', subtitle: 'Tüm bakım ve yakıt kayıtları', icon: FileText, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)', route: '/logs', keywords: ['kayıt', 'servis', 'bakım', 'yakıt', 'log'] },
  { id: 'p-settings', category: 'page', title: 'Ayarlar', subtitle: 'Hesap ve uygulama ayarları', icon: Settings, iconColor: '#64748b', iconBg: 'rgba(100,116,139,0.12)', route: '/settings', keywords: ['ayar', 'profil', 'hesap', 'şifre'] },
  { id: 'p-notif', category: 'page', title: 'Bildirimler', subtitle: 'Uyarılar ve hatırlatmalar', icon: Bell, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)', route: '/notifications', keywords: ['bildirim', 'uyarı', 'hatırlatma', 'alert'] },
  { id: 'p-budget', category: 'page', title: 'Bütçe Hedefleri', subtitle: 'Aylık harcama limitleri', icon: Gauge, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)', route: '/budget-goals', keywords: ['bütçe', 'limit', 'harcama', 'para', 'hedef'] },
  { id: 'p-compare', category: 'page', title: 'Araç Karşılaştırma', subtitle: 'İki aracı başa baş analiz et', icon: TrendingUp, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.12)', route: '/vehicle-comparison', keywords: ['karşılaştır', 'analiz', 'başabaş', 'araç'] },
  { id: 'p-calendar', category: 'page', title: 'Sigorta Takvimi', subtitle: 'Sigorta ve muayene takibi', icon: Calendar, iconColor: '#f43f5e', iconBg: 'rgba(244,63,94,0.12)', route: '/insurance-calendar', keywords: ['sigorta', 'muayene', 'takvim', 'kasko', 'tarih'] },
  { id: 'p-qr', category: 'page', title: 'QR Araç Kartı', subtitle: 'Paylaşılabilir araç kartı', icon: QrCode, iconColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.12)', route: '/vehicle-qr', keywords: ['qr', 'kod', 'kart', 'paylaş', 'servis'] },
  { id: 'p-report', category: 'page', title: 'PDF Rapor', subtitle: 'Servis geçmişi PDF\'i', icon: FileText, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)', route: '/service-report', keywords: ['pdf', 'rapor', 'indir', 'servis', 'geçmiş'] },
  { id: 'p-family', category: 'page', title: 'Aile Garajı', subtitle: 'Paylaşımlı araç yönetimi', icon: Users, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)', route: '/family-garage', keywords: ['aile', 'paylaş', 'kullanıcı', 'ekip'] },
  { id: 'p-fuel', category: 'page', title: 'Yakıt Takibi', subtitle: 'Menzil tahmini ve tüketim', icon: Fuel, iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.12)', route: '/fuel-reminder', keywords: ['yakıt', 'menzil', 'tüketim', 'litre', 'dolum'] },
  { id: 'p-appt', category: 'page', title: 'Servis Randevuları', subtitle: 'Randevu planlama ve takibi', icon: Calendar, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.12)', route: '/service-appointment', keywords: ['randevu', 'servis', 'tarih', 'plan', 'tamir'] },
  { id: 'p-fuelmap', category: 'page', title: 'İstasyon Bul', subtitle: 'Yakın akaryakıt istasyonları', icon: Navigation, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)', route: '/fuel-finder', keywords: ['istasyon', 'petrol', 'benzin', 'yakıt', 'harita'] },
  { id: 'p-theme', category: 'page', title: 'Tema & Özelleştirme', subtitle: 'Renk ve görünüm ayarları', icon: Sparkles, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)', route: '/theme', keywords: ['tema', 'renk', 'görünüm', 'özelleştir', 'karanlık'] },
  { id: 'p-ai', category: 'page', title: 'AI Bakım Tahmini', subtitle: 'Yapay zeka ile bakım önerileri', icon: Zap, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.12)', route: '/predictive-maintenance', keywords: ['yapay', 'zeka', 'ai', 'tahmin', 'bakım'] },
  { id: 'p-damage', category: 'page', title: 'Hasar Tespiti', subtitle: 'Fotoğraftan hasar analizi', icon: Shield, iconColor: '#f43f5e', iconBg: 'rgba(244,63,94,0.12)', route: '/damage-detection', keywords: ['hasar', 'fotoğraf', 'tespit', 'kaza', 'analiz'] },
  { id: 'p-chat', category: 'page', title: 'Araç Asistanı', subtitle: 'AI ile sohbet et', icon: Zap, iconColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.12)', route: '/car-chat', keywords: ['sohbet', 'asistan', 'ai', 'soru', 'chat'] },
  // Actions
  { id: 'a-add-vehicle', category: 'action', title: 'Yeni Araç Ekle', subtitle: 'Garaja araç ekle', icon: Car, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)', route: '/add-vehicle', keywords: ['ekle', 'yeni', 'araç', 'kayıt', 'oluştur'], badge: 'Eylem', badgeColor: '#10b981' },
  { id: 'a-add-log', category: 'action', title: 'Servis Kaydı Ekle', subtitle: 'Bakım veya yakıt kaydı oluştur', icon: Wrench, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)', route: '/add-record', keywords: ['bakım', 'kayıt', 'ekle', 'yakıt', 'servis'], badge: 'Eylem', badgeColor: '#f59e0b' },
  { id: 'a-add-appt', category: 'action', title: 'Randevu Oluştur', subtitle: 'Servis randevusu planla', icon: Calendar, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)', route: '/service-appointment', keywords: ['randevu', 'oluştur', 'planla', 'servis'], badge: 'Eylem', badgeColor: '#8b5cf6' },
];

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

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const formatDate = (d: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getDate()} ${MONTHS_TR[dt.getMonth()]} ${dt.getFullYear()}`;
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
      subtitle: `${v.plate} · ${v.mileage.toLocaleString('tr-TR')} km · Sağlık: ${v.healthScore}/100`,
      icon: Car,
      iconColor: '#6366f1',
      iconBg: 'rgba(99,102,241,0.12)',
      route: `/dashboard/${v.id}`,
      keywords: [v.brand, v.model, v.plate, String(v.year)].map(normalize),
      badge: v.status === 'Acil' ? 'Acil' : v.status === 'Servis Gerekli' ? 'Servis' : undefined,
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
          subtitle: `${vehicle?.brand || ''} ${vehicle?.model || ''} · ${formatDate(l.date)} · ₺${l.cost.toLocaleString('tr-TR')}`,
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
      const key = r.category === 'vehicle' ? 'Araçlar' :
        r.category === 'log' ? 'Servis Kayıtları' :
          r.category === 'action' ? 'Hızlı Eylemler' : 'Sayfalar';
      if (!g[key]) g[key] = [];
      g[key].push(r);
    });
    return g;
  }, [results]);

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

  const CAT_ORDER = ['Hızlı Eylemler', 'Araçlar', 'Sayfalar', 'Servis Kayıtları'];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'column',
        background: 'rgba(2,6,23,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 600, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        height: '100%', padding: '60px 16px 0',
      }}>
        {/* Search input */}
        <div style={{
          background: 'rgba(15,23,42,0.95)',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: 20, padding: '4px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 0 0 4px rgba(99,102,241,0.1), 0 20px 60px rgba(0,0,0,0.6)',
          marginBottom: 8,
        }}>
          <Search size={18} color="#6366f1" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            placeholder="Araç, kayıt veya sayfa ara..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#f8fafc', fontSize: 16, padding: '14px 0',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={16} color="#475569" />
            </button>
          )}
          <kbd style={{
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.6)',
            borderRadius: 6, padding: '3px 8px', color: '#475569', fontSize: 11,
            flexShrink: 0,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{
          flex: 1, overflowY: 'auto',
          background: 'rgba(15,23,42,0.92)',
          border: '1px solid rgba(30,41,59,0.8)',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          {/* Empty state — show recent + shortcuts */}
          {!query && (
            <div style={{ padding: 20 }}>
              {recent.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <p style={{ color: '#475569', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>SON ARAMALAR</p>
                    <button onClick={() => { clearRecent(); setRecent([]); }} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 11, cursor: 'pointer' }}>
                      Temizle
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {recent.map(r => (
                      <button key={r} onClick={() => handleRecentClick(r)} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.4)',
                        borderRadius: 10, padding: '6px 12px',
                        color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                      }}>
                        <Clock size={11} color="#475569" />
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p style={{ color: '#475569', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>HIZLI ERİŞİM</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {STATIC_RESULTS.filter(r => r.category === 'action').concat(
                  STATIC_RESULTS.filter(r => ['p-garage', 'p-logs', 'p-analytics', 'p-notif'].includes(r.id))
                ).slice(0, 6).map(r => {
                  const RIcon = r.icon;
                  return (
                    <button key={r.id} onClick={() => handleSelect(r)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(51,65,85,0.3)',
                      borderRadius: 14, padding: '12px 14px',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.5)')}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: r.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <RIcon size={14} color={r.iconColor} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</p>
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
                  <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, padding: '10px 16px 6px' }}>
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
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px', background: isActive ? 'rgba(99,102,241,0.12)' : 'none',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
                          transition: 'all 0.1s',
                        }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 11, background: r.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <RIcon size={16} color={r.iconColor} />
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
              <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Sonuç bulunamadı</p>
              <p style={{ color: '#475569', fontSize: 13 }}>
                "<span style={{ color: '#64748b' }}>{query}</span>" için eşleşme yok.
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
                {[['↑↓', 'Gezin'], ['↵', 'Aç'], ['ESC', 'Kapat']].map(([key, label]) => (
                  <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <kbd style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 5, padding: '2px 6px', color: '#475569', fontSize: 10 }}>{key}</kbd>
                    <span style={{ color: '#334155', fontSize: 11 }}>{label}</span>
                  </span>
                ))}
              </div>
              <span style={{ color: '#1e293b', fontSize: 11 }}>{results.length} sonuç</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Search Trigger Button ────────────────────────────────────────────────────

export const SearchTrigger: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)',
      borderRadius: 14, padding: '10px 14px', cursor: 'pointer',
      width: '100%', textAlign: 'left',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)'; e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; }}
  >
    <Search size={15} color="#475569" />
    <span style={{ flex: 1, color: '#475569', fontSize: 14 }}>Ara...</span>
    <kbd style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 6, padding: '2px 7px', color: '#334155', fontSize: 11 }}>
      ⌘K
    </kbd>
  </button>
);

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
