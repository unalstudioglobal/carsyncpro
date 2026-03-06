import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePremium } from '../context/PremiumContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Settings, MoreVertical, Edit2, Archive, Tag, Wallet, CheckCircle, AlertTriangle, AlertCircle, Search, X, Filter, Car, LayoutGrid, PlusCircle, ChevronRight, QrCode, Copy, RefreshCw, Share2, Calendar, Crown, Trash2, Plus, LayoutDashboard, Scan, Activity } from 'lucide-react';
import { OnboardingGuide } from '../components/OnboardingGuide';
import { EmptyState } from '../components/EmptyState';
import { Vehicle } from '../types';
import { AdBanner } from '../components/AdBanner';
import { toast } from '../services/toast';
import { fetchVehicles, deleteVehicle, updateVehicle, archiveVehicle, fetchLogs } from '../services/firestoreService';
import { getSetting } from '../services/settingsService';

export const Garage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [logCosts, setLogCosts] = useState<Record<string, number>>({});

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'brand' | 'model'>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Premium Check
  const { isPremium, activate, cancel: cancelPremium } = usePremium();
  const FREE_VEHICLE_LIMIT = 2;

  // State for Archive Confirmation Dialog
  const [archiveConfirmationId, setArchiveConfirmationId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // State for Transfer Modal
  const [transferModal, setTransferModal] = useState<{ vehicle: Vehicle, code: string } | null>(null);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);

  // İlk yüklemede Firestore'dan araçları çek
  useEffect(() => {
    const loadData = async () => {
      setVehiclesLoading(true);
      try {
        const [loadedVehicles, allLogs] = await Promise.all([
          fetchVehicles(),
          fetchLogs(),
        ]);
        // Arşivlenmiş araçları filtrele
        const archivedIds = getSetting<string[]>('archivedVehicles', []);
        setVehicles(loadedVehicles.filter(v => !archivedIds.includes(v.id)));

        // Her araç için toplam maliyeti hesapla
        const costs: Record<string, number> = {};
        allLogs.forEach(log => {
          costs[log.vehicleId] = (costs[log.vehicleId] || 0) + log.cost;
        });
        setLogCosts(costs);
      } catch (err) {
        console.error('Garaj yükleme hatası:', err);
      } finally {
        setVehiclesLoading(false);
      }
    };
    loadData();
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Firestore'dan gelen gerçek maliyet
  const calculateTotalCost = (vehicleId: string) => logCosts[vehicleId] || 0;

  const handleAddVehicle = () => {
    if (!isPremium && vehicles.length >= FREE_VEHICLE_LIMIT) {
      if (window.confirm(t('garage.free_plan_limit'))) {
        navigate('/premium');
      }
      return;
    }
    navigate('/add-vehicle');
  };

  // Enhanced Status Configuration for Better UI
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Sorun Yok':
        return {
          icon: CheckCircle,
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-md',
          cardBorder: 'border-slate-700 hover:border-emerald-500/30',
          shadow: 'shadow-lg hover:shadow-emerald-900/10',
          glow: '',
          iconAnim: ''
        };
      case 'Servis Gerekli':
        return {
          icon: AlertTriangle,
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30 backdrop-blur-md',
          cardBorder: 'border-amber-500/60',
          shadow: 'shadow-[0_0_20px_-5px_rgba(245,158,11,0.25)]',
          glow: 'ring-1 ring-amber-500/20',
          iconAnim: 'animate-bounce' // Bouncing icon for attention
        };
      case 'Acil':
        return {
          icon: AlertCircle,
          // Solid red background for maximum urgency visibility
          badgeClass: 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-900/50 backdrop-blur-md',
          cardBorder: 'border-rose-500',
          shadow: 'shadow-[0_0_30px_-5px_rgba(244,63,94,0.5)]',
          glow: 'animate-pulse',
          iconAnim: 'animate-pulse' // Pulsing icon
        };
      case 'Satıldı':
        return {
          icon: Tag,
          badgeClass: 'bg-slate-700/50 text-slate-400 border-slate-600',
          cardBorder: 'border-slate-800 opacity-60 grayscale',
          shadow: 'shadow-none',
          glow: '',
          iconAnim: ''
        };
      default:
        return {
          icon: CheckCircle,
          badgeClass: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
          cardBorder: 'border-slate-700',
          shadow: 'shadow-lg',
          glow: '',
          iconAnim: ''
        };
    }
  };

  // Enhanced Search Logic
  const filteredVehicles = vehicles.filter(vehicle => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    const searchTerms = query.split(/\s+/).filter(term => term.length > 0);
    const searchableText = `${vehicle.brand} ${vehicle.model} ${vehicle.plate}`.toLowerCase();

    if (filterMode === 'brand') {
      return searchTerms.every(term => vehicle.brand.toLowerCase().includes(term));
    }
    if (filterMode === 'model') {
      return searchTerms.every(term => vehicle.model.toLowerCase().includes(term));
    }

    // Default: Check if ALL terms are present in the searchable text
    return searchTerms.every(term => searchableText.includes(term));
  });

  // Autocomplete Suggestions
  const { suggestedVehicles, suggestedTerms } = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return { suggestedVehicles: [], suggestedTerms: [] };

    const query = searchQuery.toLowerCase();
    const terms = new Set<string>();

    // 1. Find matching vehicles directly
    const vehiclesMatch = vehicles.filter(v =>
      v.brand.toLowerCase().includes(query) ||
      v.model.toLowerCase().includes(query) ||
      v.plate.toLowerCase().includes(query)
    ).slice(0, 3); // Limit to 3 vehicles

    // 2. Find matching terms
    vehicles.forEach(v => {
      const brand = v.brand;
      const model = v.model;
      const full = `${brand} ${model}`;

      if (brand.toLowerCase().includes(query)) terms.add(brand);
      if (model.toLowerCase().includes(query)) terms.add(model);
      if (full.toLowerCase().includes(query)) terms.add(full);
    });

    // Remove exact match from terms to avoid redundancy if user typed full name
    const filteredTerms = Array.from(terms)
      .filter(term => term.toLowerCase() !== query)
      .slice(0, 3); // Limit to 3 terms

    return { suggestedVehicles: vehiclesMatch, suggestedTerms: filteredTerms };
  }, [vehicles, searchQuery]);

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const vehicleToArchive = vehicles.find(v => v.id === archiveConfirmationId);

  const handleArchiveConfirm = async () => {
    if (vehicleToArchive) {
      setVehicles(prev => prev.filter(v => v.id !== vehicleToArchive.id));
      try {
        await archiveVehicle(vehicleToArchive.id);
      } catch (err) {
        console.error('Arşivleme hatası:', err);
      }
    }
    setArchiveConfirmationId(null);
  };

  const vehicleToDelete = vehicles.find(v => v.id === deleteConfirmationId);

  const handleDeleteConfirm = async () => {
    if (vehicleToDelete) {
      const id = vehicleToDelete.id;
      setVehicles(prev => prev.filter(v => v.id !== id));
      try {
        await deleteVehicle(id);
      } catch (err) {
        console.error('Silme hatası:', err);
      }
    }
    setDeleteConfirmationId(null);
  };

  const handleSellVehicle = async (id: string) => {
    setVehicles(prev => prev.map(v =>
      v.id === id ? { ...v, status: 'Satıldı' } : v
    ));
    try {
      await updateVehicle(id, { status: 'Satıldı' });
    } catch (err) {
      console.error('Satıldı güncelleme hatası:', err);
    }
    setActiveMenuId(null);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    navigate(`/edit-vehicle/${vehicle.id}`, { state: { vehicle } });
    setActiveMenuId(null);
  };

  // --- Transfer Logic ---
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const part1 = Array(3).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    const part2 = Array(3).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `TR-${part1}-${part2}`;
  };

  const handleOpenTransfer = (vehicle: Vehicle) => {
    setTransferModal({
      vehicle,
      code: generateCode()
    });
    setActiveMenuId(null);
  };

  const regenerateTransferCode = () => {
    if (!transferModal) return;
    setIsRegeneratingCode(true);
    setTimeout(() => {
      setTransferModal(prev => prev ? { ...prev, code: generateCode() } : null);
      setIsRegeneratingCode(false);
    }, 500);
  };

  const onboardingSteps = [
    {
      title: 'Garajınıza Hoş Geldiniz',
      description: 'Tüm araçlarınızı tek bir yerden yönetin. Durumlarını, maliyetlerini ve bakım zamanlarını takip edin.',
      icon: Car
    },
    {
      title: 'Hızlı İşlemler',
      description: 'Her aracın altındaki butonları kullanarak "Detaylar"a gidebilir, "Kayıt Ekle"yebilir veya aracı "Sil"ebilirsiniz.',
      icon: LayoutGrid
    },
    {
      title: 'Transfer & Paylaşım',
      description: 'Sağ üstteki menüden (•••) aracın transfer kodunu oluşturabilir ve paylaşabilirsiniz.',
      icon: QrCode
    },
    {
      title: 'Yeni Araç Ekle',
      description: 'Listenin en altındaki "Araç Ekle" butonu ile yeni bir araç tanımlayarak takibe başlayın.',
      icon: PlusCircle
    }
  ];

  // ── STATUS CONFIG (premium) ────────────────────────────
  // (used inside card render below)

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'Sorun Yok': return { cardClass: 'card-ok', dot: 'var(--green)', label: 'Sorun Yok', labelColor: '#00E878' };
      case 'Servis Gerekli': return { cardClass: 'card-warning', dot: 'var(--amber)', label: 'Servis Gerekli', labelColor: '#FF9A00' };
      case 'Acil': return { cardClass: 'card-critical', dot: 'var(--red)', label: 'ACİL', labelColor: '#FF3B3B' };
      case 'Satıldı': return { cardClass: 'card-sold', dot: '#555', label: 'Satıldı', labelColor: '#555' };
      default: return { cardClass: '', dot: '#555', label: status, labelColor: '#8A8899' };
    }
  };

  return (
    <div style={{ paddingBottom: 8 }}>
      <OnboardingGuide tourKey="tour_garage_v1" steps={onboardingSteps} />

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{ padding: '52px 20px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* ambient glows */}
        <div style={{ position: 'absolute', top: -50, left: -50, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -20, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, color: 'var(--gold)', letterSpacing: 2.5, marginBottom: 6, textTransform: 'uppercase' }}>
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 1.5, lineHeight: 0.92, color: 'var(--text-primary)', margin: 0 }}>
              {t('garage.title')}
            </h1>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 1, background: 'var(--gold)', opacity: 0.5 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                {vehicles.length} {t('nav.vehicle_management').toLowerCase().split(' ')[1]}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/notifications')} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', position: 'relative' }}>
              <Bell size={16} />
              <div style={{ position: 'absolute', top: 9, right: 9, width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', border: '1.5px solid var(--bg-void)' }} />
            </button>
            <button onClick={() => navigate('/settings')} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── SEARCH ─────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 16px' }} ref={searchContainerRef}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setShowSuggestions(true)}
            onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
            placeholder={t('garage.search_placeholder')}
            className="input-premium"
            style={{ paddingLeft: 40, paddingRight: searchQuery ? 36 : 16, fontSize: 14 }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
              <X size={14} />
            </button>
          )}

          {/* Autocomplete */}
          {showSuggestions && (suggestedVehicles.length > 0 || suggestedTerms.length > 0) && (
            <div className="animate-slideDown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: 'var(--bg-raised)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, zIndex: 50, overflow: 'hidden' }}>
              {suggestedVehicles.map(v => (
                <button key={v.id} onClick={() => navigate(`/dashboard/${v.id}`)} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {v.image ? <img src={v.image} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={14} color="var(--text-muted)" /></div>}
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>{v.brand} {v.model}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{v.plate}</p>
                  </div>
                </button>
              ))}
              {suggestedTerms.map((t, i) => (
                <button key={i} onClick={() => handleSuggestionClick(t)} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
                  <Search size={13} />
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflow: 'hidden' }}>
          {['all', 'brand', 'model'].map(mode => (
            <button key={mode} onClick={() => setFilterMode(mode as any)} style={{
              padding: '6px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s', letterSpacing: 0.5,
              background: filterMode === mode ? 'var(--gold-dim)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterMode === mode ? 'var(--border-gold)' : 'rgba(255,255,255,0.07)'}`,
              color: filterMode === mode ? 'var(--gold)' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
            }}>
              {mode === 'all' ? t('garage.filter_all') : mode === 'brand' ? t('garage.filter_brand') : t('garage.filter_model')}
            </button>
          ))}
        </div>
      </div>

      {/* ── VEHICLE GRID ───────────────────────────────────── */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }} className="stagger">

        {/* Skeleton */}
        {vehiclesLoading && [1, 2].map(i => (
          <div key={i} className="card-premium animate-fadeUp" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="skeleton" style={{ height: 200, borderRadius: '24px 24px 0 0' }} />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="skeleton" style={{ height: 20, width: '55%' }} />
              <div className="skeleton" style={{ height: 14, width: '35%' }} />
              <div className="skeleton" style={{ height: 64, borderRadius: 14 }} />
            </div>
          </div>
        ))}

        {/* Vehicles Layout: Hero + Horizontal Others */}
        {!vehiclesLoading && filteredVehicles.length > 0 && (
          <div className="flex flex-col gap-6">
            {/* 1. HERO VEHICLE (First one or explicitly main) */}
            <div className="perspective-1000 group">
              <div
                onClick={() => navigate(`/dashboard/${filteredVehicles[0].id}`)}
                className={`card-premium shimmer-card animate-fadeUp relative transition-all duration-500 card-inner cursor-pointer hover:shadow-2xl hover:shadow-gold/10`}
                style={{ animationDelay: '0.05s', minHeight: 380 }}
              >
                {/* Hero Specific Content (Larger image, more details) */}
                <div style={{ height: 260, position: 'relative', overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
                  {filteredVehicles[0].image ? (
                    <img
                      src={filteredVehicles[0].image}
                      alt={filteredVehicles[0].model}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                      className="group-hover:scale-105 transition-transform duration-700"
                      onClick={(e) => { e.stopPropagation(); setSelectedImage(filteredVehicles[0].image!); }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Car size={64} color="var(--bg-surface)" strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

                  {/* Floating badge */}
                  <div className="absolute top-4 left-4 bg-gold/20 backdrop-blur-md border border-gold/30 rounded-full px-3 py-1 flex items-center gap-2">
                    <Crown size={12} className="text-gold" />
                    <span className="text-[10px] font-bold text-gold uppercase tracking-tighter">{t('garage.main_vehicle')}</span>
                  </div>

                  {/* Delete button for Hero */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmationId(filteredVehicles[0].id); }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-black/60 transition-all z-10"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="absolute bottom-4 left-4">
                    <div className="tr-plate">{filteredVehicles[0].plate}</div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-3xl font-display font-black text-black dark:text-white leading-none mb-1">
                        {filteredVehicles[0].brand.toUpperCase()}
                      </h2>
                      <p className="text-gold font-bold text-lg">{filteredVehicles[0].model}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity size={14} className="text-green-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SAĞLIK SKORU</span>
                      </div>
                      <span className="text-3xl font-mono font-black text-black dark:text-white">{filteredVehicles[0].healthScore}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3">
                      <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Kilometre</p>
                      <p className="text-lg font-mono font-bold text-black dark:text-white">{filteredVehicles[0].mileage.toLocaleString()} km</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3">
                      <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Bakım Durumu</p>
                      <p className="text-lg font-bold text-green-500 dark:text-green-400">SORUN YOK</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. OTHERS (Horizontal Scroll) */}
            {filteredVehicles.length > 1 && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('garage.other_vehicles')}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">{filteredVehicles.length - 1} {t('nav.vehicle_management').toLowerCase().split(' ')[1]}</span>
                </div>

                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 pt-1 px-1">
                  {filteredVehicles.slice(1).map((vehicle, idx) => (
                    <div
                      key={vehicle.id}
                      onClick={() => navigate(`/dashboard/${vehicle.id}`)}
                      className="min-w-[280px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden animate-fadeRight active:scale-95 transition-all cursor-pointer group hover:border-gold/50 shadow-lg"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="h-32 relative">
                        {vehicle.image ? (
                          <img
                            src={vehicle.image}
                            alt={vehicle.model}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            style={{ cursor: 'zoom-in' }}
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(vehicle.image!); }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><Car size={32} className="text-slate-400 dark:text-slate-700" /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <span className="text-xs font-black text-white uppercase">{vehicle.brand}</span>
                          <span className="text-xs font-bold text-gold">{vehicle.model}</span>
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm">
                        <div className="flex flex-col">
                          <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">{vehicle.plate}</div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmationId(vehicle.id); }}
                            className="mt-1 flex items-center gap-1 text-[9px] font-bold text-red-500/60 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={10} /> {t('common.delete').toUpperCase()}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                          <span className="text-[11px] font-bold text-slate-800 dark:text-white">%{vehicle.healthScore}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Shortcut in scroller */}
                  <div
                    onClick={handleAddVehicle}
                    className="min-w-[140px] rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-gold hover:border-gold/30 transition-all cursor-pointer"
                  >
                    <Plus size={32} />
                    <span className="text-[10px] font-bold uppercase">{t('garage.add_new_vehicle')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!vehiclesLoading && filteredVehicles.length === 0 && (
          <div className="py-8 animate-fadeIn">
            {searchQuery ? (
              <EmptyState
                icon={Search}
                title={t('garage.no_vehicle_found')}
                description={t('garage.search_no_match')}
                actionLabel={t('garage.clear_search')}
                onAction={() => setSearchQuery('')}
                accentColor="#94a3b8"
              />
            ) : (
              <EmptyState
                icon={Car}
                title={t('garage.garage_empty')}
                description={t('garage.no_vehicle_yet')}
                actionLabel={t('garage.add_new_vehicle')}
                onAction={handleAddVehicle}
                accentColor="#c9a84c"
              />
            )}
          </div>
        )}

        {/* ── Add Vehicle CTA ─── */}
        <button
          onClick={handleAddVehicle}
          className="btn-premium-3d w-full"
          style={{ padding: '22px' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Plus size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {t('garage.add_new_vehicle')}
          </span>
          {!isPremium && vehicles.length >= FREE_VEHICLE_LIMIT && (
            <div style={{ position: 'absolute', top: 10, right: 12, background: 'linear-gradient(135deg, #E8C96B, #C9A84C)', color: '#050508', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, letterSpacing: 0.8 }}>
              PREMIUM
            </div>
          )}
        </button>

        <AdBanner slotId="3991102196" format="fluid" layoutKey="-gw-3+1f-3d+2z" />
      </div >

      {/* ── inject keyframes ─── */}
      < style > {`
        @keyframes goldPulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .animate-slideDown { animation: slideDown 0.25s ease-out both; }
      `}</style >

      {/* Modals omitted for brevity, structure remains same */}
      {
        transferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setTransferModal(null)}>
            {/* Existing Transfer Modal Logic */}
            <div className="bg-slate-800 rounded-3xl border border-slate-700 w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"></div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{t('garage.transfer_history')}</h3>
                    <p className="text-slate-400 text-xs mt-1">{t('garage.transfer_desc')}</p>
                  </div>
                  <button onClick={() => setTransferModal(null)} className="p-2 bg-slate-700/50 rounded-full hover:bg-slate-700 text-slate-400 transition">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex items-center space-x-3 mb-6 bg-slate-900/50 p-3 rounded-2xl border border-slate-700/50">
                  <img src={transferModal.vehicle.image} className="w-12 h-12 rounded-xl object-cover" alt="Vehicle" />
                  <div>
                    <div className="font-bold text-sm text-white">{transferModal.vehicle.brand} {transferModal.vehicle.model}</div>
                    <div className="text-xs text-slate-500 font-mono">{transferModal.vehicle.plate}</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-inner mb-6 flex flex-col items-center">
                  <div className="w-48 h-48 mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${transferModal.code}&bgcolor=ffffff`}
                      alt="Transfer QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center space-x-2 w-full">
                    <div className="bg-slate-100 flex-1 py-3 px-4 rounded-xl text-center font-mono font-bold text-xl tracking-widest text-slate-800 border-2 border-slate-200">
                      {isRegeneratingCode ? '...' : transferModal.code}
                    </div>
                    <button onClick={regenerateTransferCode} disabled={isRegeneratingCode} className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 active:scale-95 transition">
                      <RefreshCw size={20} className={isRegeneratingCode ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { navigator.clipboard.writeText(transferModal.code); toast.success(t('garage.copied')); }}
                    className="btn-premium-3d !p-3 !bg-slate-700 !shadow-slate-900/40 text-xs"
                  >
                    <Copy size={16} /> <span>{t('garage.copy_c').split(' ')[0]}</span>
                  </button>
                  <button className="btn-premium-3d !p-3 !bg-blue-600 !shadow-blue-900/40 text-xs">
                    <Share2 size={16} /> <span>{t('garage.share_l').split(' ')[0]}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        archiveConfirmationId && vehicleToArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={() => setArchiveConfirmationId(null)}>
            <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-5 mx-auto text-amber-500 border border-amber-500/20">
                <Archive size={28} />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">{t('garage.archive_confirm_title')}</h3>
              <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed px-2">
                {t('garage.archive_confirm_desc', { model: vehicleToArchive.model })}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setArchiveConfirmationId(null)}
                  className="btn-premium-3d !p-3.5 !bg-slate-700 !shadow-slate-900/40"
                >
                  {t('garage.cancel')}
                </button>
                <button
                  onClick={handleArchiveConfirm}
                  className="btn-premium-3d !p-3.5 !bg-red-600 !shadow-red-900/40"
                >
                  {t('garage.archive')}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        deleteConfirmationId && vehicleToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setDeleteConfirmationId(null)}>
            <div className="bg-slate-900 rounded-3xl border border-red-500/30 p-8 w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 mx-auto text-red-500 border border-red-500/20">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-display font-bold text-center mb-3 text-white">{t('garage.delete_confirm_title')}</h3>
              <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed">
                {t('garage.delete_confirm_desc', { model: `${vehicleToDelete.brand} ${vehicleToDelete.model}` })}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDeleteConfirm}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-900/20"
                >
                  {t('garage.btn_delete')}
                </button>
                <button
                  onClick={() => setDeleteConfirmationId(null)}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
                >
                  {t('garage.cancel')}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ── IMAGE LIGHTBOX ─── */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[110]"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          <div
            className="relative max-w-5xl w-full max-h-[85vh] flex items-center justify-center animate-scaleUp z-100"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Selected Vehicle"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleUp {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scaleUp {
            animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div >
  );
};

const PlusCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);
