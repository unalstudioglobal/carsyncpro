import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText, Search, X, Fuel, Wrench, Droplet, Disc, Battery,
  ClipboardCheck, Sparkles, RotateCw, ChevronRight, Trash2,
  Plus, Filter, Car, TrendingDown, Wallet, Calendar
} from 'lucide-react';
import { fetchVehicles, fetchLogs, deleteLog } from '../services/firestoreService';
import { Vehicle, ServiceLog } from '../types';
import { toast } from '../services/toast';
import { EmptyState } from '../components/EmptyState';
import { SwipeableItem } from '../components/SwipeableItem';

// ─── İkon & Renk Yardımcıları ───────────────────────────────────────────────

const SERVICE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'Yakıt Alımı': { icon: Fuel, color: 'text-green-400', bg: 'bg-green-500/15' },
  'Yağ Değişimi': { icon: Droplet, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  'Periyodik Bakım': { icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  'Lastik Değişimi': { icon: Disc, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  'Lastik Rotasyonu': { icon: RotateCw, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
  'Fren Servisi': { icon: Wrench, color: 'text-red-400', bg: 'bg-red-500/15' },
  'Akü Değişimi': { icon: Battery, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'Muayene': { icon: ClipboardCheck, color: 'text-teal-400', bg: 'bg-teal-500/15' },
  'Yıkama & Detay': { icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
};

const getMeta = (type: string) =>
  SERVICE_META[type] ?? { icon: Wrench, color: 'text-slate-400', bg: 'bg-slate-500/15' };

// Tarihe göre grupla: { "Şubat 2025": [...logs] }
const groupByMonth = (logs: ServiceLog[], t: any) => {
  const groups: Record<string, ServiceLog[]> = {};
  logs.forEach(log => {
    let label = log.date;
    // YYYY-MM-DD formatındaysa Türkçe ay adına çevir
    if (/^\d{4}-\d{2}-\d{2}$/.test(log.date)) {
      const d = new Date(log.date + 'T00:00:00');
      const months = t('logs.months', { returnObjects: true }) as string[];
      label = `${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(log);
  });
  return groups;
};

const formatDate = (dateStr: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
  return dateStr;
};

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export const Logs: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Veriyi Firestore'dan çek
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [v, l] = await Promise.all([fetchVehicles(), fetchLogs()]);
        setVehicles(v);
        // Tarihe göre sırala (yeniden eskiye)
        setLogs(l.sort((a, b) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(a.date) && /^\d{4}-\d{2}-\d{2}$/.test(b.date))
            return b.date.localeCompare(a.date);
          return 0;
        }));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Araç adı yardımcısı
  const vehicleName = (id: string, t: any) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.brand} ${v.model}` : t('logs.unknown_vehicle');
  };

  // Filtrele
  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (selectedVehicleId !== 'all' && log.vehicleId !== selectedVehicleId) return false;
      if (selectedType !== 'all' && log.type !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          log.type.toLowerCase().includes(q) ||
          log.notes?.toLowerCase().includes(q) ||
          vehicleName(log.vehicleId, t).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, selectedVehicleId, selectedType, searchQuery, vehicles]);

  // Özet istatistikler (filtrelenmiş veriden)
  const stats = useMemo(() => {
    const total = filtered.reduce((s, l) => s + (l.cost || 0), 0);
    const fuel = filtered.filter(l => l.type === 'Yakıt Alımı').reduce((s, l) => s + (l.cost || 0), 0);
    return { total, fuel, count: filtered.length };
  }, [filtered]);

  // Gruplara böl
  const grouped = useMemo(() => groupByMonth(filtered, t), [filtered, t]);
  const groupKeys = Object.keys(grouped);

  // Log sil
  const handleDelete = async (id: string) => {
    if (!window.confirm(t('logs.confirm_delete'))) return;
    setDeletingId(id);
    try {
      await deleteLog(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Silme hatası:', err);
      toast.error(t('logs.err_delete'));
    } finally {
      setDeletingId(null);
    }
  };

  // Benzersiz servis türleri
  const serviceTypes = useMemo(() => {
    return ['all', ...Array.from(new Set(logs.map(l => l.type)))];
  }, [logs]);

  // ─── Loading Skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-5 space-y-5">
        <div className="h-8 bg-slate-800 rounded-xl w-40 animate-pulse" />
        <div className="h-12 bg-slate-800 rounded-2xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 space-y-5 pb-32">

      {/* Header */}
      <header className="flex justify-between items-center pt-2">
        <div>
          <p className="text-xs text-slate-400">{t('logs.history')}</p>
          <h1 className="text-2xl font-bold">{t('logs.title')}</h1>
        </div>
        <button
          onClick={() => navigate('/add-record')}
          className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40 active:scale-95 transition"
        >
          <Plus size={22} className="text-white" />
        </button>
      </header>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 col-span-1">
          <Wallet size={16} className="text-blue-400 mb-2" />
          <div className="text-xs text-slate-400 mb-0.5">{t('logs.total')}</div>
          <div className="text-base font-bold text-white">₺{stats.total.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 col-span-1">
          <Fuel size={16} className="text-green-400 mb-2" />
          <div className="text-xs text-slate-400 mb-0.5">{t('logs.fuel')}</div>
          <div className="text-base font-bold text-white">₺{stats.fuel.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 col-span-1">
          <FileText size={16} className="text-purple-400 mb-2" />
          <div className="text-xs text-slate-400 mb-0.5">{t('logs.action_count')}</div>
          <div className="text-base font-bold text-white">{stats.count}</div>
        </div>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('logs.search_ph')}
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3.5 pl-11 pr-10 text-base text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-700 rounded-full text-slate-400"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filtreler */}
      <div className="space-y-2">
        {/* Araç filtresi */}
        {vehicles.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setSelectedVehicleId('all')}
              className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition active:scale-95 ${selectedVehicleId === 'all'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
            >
              <Car size={12} />
              <span>{t('logs.all_vehicles')}</span>
            </button>
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition active:scale-95 ${selectedVehicleId === v.id
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
              >
                <span>{v.brand} {v.model}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tür filtresi */}
        <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-1">
          {serviceTypes.map(typeStr => (
            <button
              key={typeStr}
              onClick={() => setSelectedType(typeStr)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition active:scale-95 ${selectedType === typeStr
                  ? 'bg-slate-600 border-slate-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
            >
              {typeStr === 'all' ? t('logs.all_types') : t(`add_record.type_${typeStr.replace(/\s|[&]/g, '').toLowerCase()}`, { defaultValue: typeStr })}
            </button>
          ))}
        </div>
      </div>

      {/* Log Listesi */}
      {groupKeys.length === 0 ? (
        <div className="py-12 animate-fadeIn">
          <EmptyState
            icon={FileText}
            title={t('logs.no_record')}
            description={searchQuery || selectedVehicleId !== 'all' || selectedType !== 'all'
              ? t('logs.no_record_filter')
              : t('logs.no_record_yet')}
            actionLabel="İlk Kaydı Ekle"
            onAction={() => navigate('/add-record')}
            accentColor="#3b82f6"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {groupKeys.map(monthLabel => (
            <div key={monthLabel}>
              {/* Ay Başlığı */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar size={13} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {monthLabel}
                  </span>
                </div>
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-500 font-mono">
                  ₺{grouped[monthLabel].reduce((s, l) => s + (l.cost || 0), 0).toLocaleString()}
                </span>
              </div>

              {/* Loglar */}
              <div className="space-y-3">
                {grouped[monthLabel].map(log => {
                  const { icon: Icon, color, bg } = getMeta(log.type);
                  const vehicle = vehicles.find(v => v.id === log.vehicleId);
                  return (
                    <SwipeableItem
                      key={log.id}
                      onDelete={() => handleDelete(log.id)}
                      deleteLabel={t('logs.delete')}
                    >
                      <div
                        className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex items-center space-x-4 group relative overflow-hidden active:scale-[0.99] transition-transform w-full"
                      >
                        {/* İkon */}
                        <div className={`${bg} p-3 rounded-xl flex-shrink-0`}>
                          <Icon size={22} className={color} />
                        </div>

                        {/* Bilgi */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between">
                            <h3 className="font-bold text-sm text-white truncate pr-2">{t(`add_record.type_${log.type.replace(/\s|[&]/g, '').toLowerCase()}`, { defaultValue: log.type })}</h3>
                            <span className="font-bold text-base text-white flex-shrink-0">
                              ₺{(log.cost || 0).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 mt-1">
                            {vehicle && (
                              <span className="text-[11px] text-blue-400 font-medium truncate max-w-[100px]">
                                {vehicle.brand} {vehicle.model}
                              </span>
                            )}
                            {vehicle && <span className="text-slate-600 text-[10px]">•</span>}
                            <span className="text-[11px] text-slate-400">
                              {formatDate(log.date)}
                            </span>
                            {log.mileage > 0 && (
                              <>
                                <span className="text-slate-600 text-[10px]">•</span>
                                <span className="text-[11px] text-slate-400">
                                  {log.mileage.toLocaleString()} km
                                </span>
                              </>
                            )}
                          </div>

                          {log.notes && (
                            <p className="text-[11px] text-slate-500 mt-1 truncate italic">
                              {log.notes}
                            </p>
                          )}
                        </div>

                        {/* Masaüstü Sil Butonu — hover'da görünür, mobilde swipe öncelikli ama bu da kalsın */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }}
                          disabled={deletingId === log.id}
                          className="hidden sm:flex opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-95 flex-shrink-0"
                        >
                          {deletingId === log.id
                            ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 size={16} />
                          }
                        </button>
                      </div>
                    </SwipeableItem>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
