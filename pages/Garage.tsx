import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePremium } from '../context/PremiumContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Settings, MoreVertical, Edit2, Archive, Tag, Wallet, CheckCircle, AlertTriangle, AlertCircle, Search, X, Filter, Car, LayoutGrid, PlusCircle, ChevronRight, QrCode, Copy, RefreshCw, Share2, Calendar, Crown, Trash2, Plus, LayoutDashboard, Scan } from 'lucide-react';
import { OnboardingGuide } from '../components/OnboardingGuide';
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
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Premium Check
  const { isPremium, activate, cancel: cancelPremium } = usePremium();
  const FREE_VEHICLE_LIMIT = 2;

  // State for Archive Confirmation Dialog
  const [archiveConfirmationId, setArchiveConfirmationId] = useState<string | null>(null);

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
                {vehicles.length} araç
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

        {/* Vehicles */}
        {!vehiclesLoading && filteredVehicles.length > 0 && filteredVehicles.map((vehicle, idx) => {
          const totalCost = calculateTotalCost(vehicle.id);
          const sm = getStatusMeta(vehicle.status);
          const isUrgent = vehicle.status === 'Acil';
          const isWarning = vehicle.status === 'Servis Gerekli';
          const isSold = vehicle.status === 'Satıldı';

          return (
            <div
              key={vehicle.id}
              className={`card-premium shimmer-card animate-fadeUp ${sm.cardClass}`}
              style={{ animationDelay: `${idx * 0.07}s` }}
            >
              {/* Context Menu */}
              {activeMenuId === vehicle.id && (
                <div
                  className="animate-fadeIn"
                  style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.88)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', borderRadius: 24 }}
                  onClick={() => setActiveMenuId(null)}
                >
                  <div style={{ background: 'var(--bg-raised)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, overflow: 'hidden', width: 260 }} onClick={e => e.stopPropagation()}>
                    {[
                      { label: t('garage.edit_details'), icon: Edit2, action: () => handleEditVehicle(vehicle), color: '#6366f1' },
                      { label: t('garage.transfer_history'), icon: QrCode, action: () => handleOpenTransfer(vehicle), color: '#a855f7' },
                      { label: t('garage.mark_sold'), icon: Tag, action: () => handleSellVehicle(vehicle.id), color: '#f59e0b' },
                    ].map(({ label, icon: Icon, action, color }) => (
                      <button
                        key={label}
                        onClick={action}
                        style={{ width: '100%', textAlign: 'left', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' }}
                      >
                        <span style={{ display: 'flex', flexGrow: 1 }}>{label}</span>
                        <Icon size={16} color={color} />
                      </button>
                    ))}
                    <button onClick={() => setActiveMenuId(null)} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-body)' }}>{t('garage.close')}</button>
                  </div>
                </div>
              )
              }

              {/* ── Image ── */}
              < div style={{ height: 200, position: 'relative', overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
                {vehicle.image ? (
                  <img src={vehicle.image} alt={vehicle.model} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isSold ? 'grayscale(1) brightness(0.5)' : 'none', transition: 'transform 0.6s ease', transform: 'scale(1.02)' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={52} color="var(--bg-surface)" strokeWidth={1} />
                  </div>
                )}

                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(5,5,8,0) 40%, rgba(5,5,8,0.7) 80%, rgba(5,5,8,0.95) 100%)' }} />

                {/* SATILDI stamp */}
                {isSold && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 4, color: 'white', border: '2px solid rgba(255,255,255,0.4)', padding: '6px 18px', borderRadius: 6, transform: 'rotate(-12deg)', background: 'rgba(5,5,8,0.7)', backdropFilter: 'blur(4px)' }}>
                      {t('garage.sold_stamp')}
                    </div>
                  </div>
                )}

                {/* Top overlay row */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Status badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(5,5,8,0.7)', border: `1px solid ${sm.labelColor}30`, borderRadius: 100, padding: '5px 10px 5px 8px', backdropFilter: 'blur(12px)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: sm.dot, boxShadow: `0 0 6px ${sm.dot}`, animation: isUrgent ? 'goldPulse 1s ease-in-out infinite' : 'none' }} />
                    <span style={{ color: sm.labelColor, fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>{sm.label}</span>
                  </div>

                  {/* Menu btn */}
                  <button
                    onClick={e => { e.stopPropagation(); setActiveMenuId(vehicle.id); }}
                    style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(5,5,8,0.6)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(12px)', color: 'white' }}
                  >
                    <MoreVertical size={15} />
                  </button>
                </div>

                {/* Bottom plate overlay */}
                <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
                  <div className="tr-plate">
                    <div className="tr-plate-flag">
                      <span>★</span>
                      <span>TR</span>
                    </div>
                    {vehicle.plate}
                  </div>
                </div>

                {/* Health arc (top right on image) */}
                <div style={{ position: 'absolute', bottom: 10, right: 14 }}>
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                    <circle
                      cx="22" cy="22" r="18"
                      fill="none"
                      stroke={vehicle.healthScore >= 80 ? 'var(--green)' : vehicle.healthScore >= 50 ? 'var(--amber)' : 'var(--red)'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(vehicle.healthScore / 100) * 113} 113`}
                      transform="rotate(-90 22 22)"
                      style={{ transition: 'stroke-dasharray 0.8s ease' }}
                    />
                    <text x="22" y="26" textAnchor="middle" style={{ fontSize: 11, fontWeight: 800, fill: 'white', fontFamily: 'var(--font-mono)' }}>
                      {vehicle.healthScore}
                    </text>
                  </svg>
                </div>
              </div>

              {/* ── Content ── */}
              <div style={{ padding: '16px 18px 18px', position: 'relative' }}>
                {/* Name row */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: 0.5, color: isSold ? 'var(--text-muted)' : 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
                      {vehicle.brand.toUpperCase()}
                    </h2>
                    <span style={{ color: 'var(--gold)', fontSize: 15, fontWeight: 700 }}>{vehicle.model}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 6px' }}>
                      {vehicle.year}
                    </span>
                  </div>
                  {vehicle.lastLogDate && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {t('garage.last_log')}: {vehicle.lastLogDate}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: t('garage.mileage'), value: `${vehicle.mileage.toLocaleString('tr-TR')} km`, color: 'var(--text-primary)' },
                    { label: t('garage.cost'), value: `₺${totalCost.toLocaleString('tr-TR')}`, color: '#00E878' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 14px' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 8.5, fontWeight: 700, letterSpacing: 1.2, fontFamily: 'var(--font-mono)', marginBottom: 6, textTransform: 'uppercase' }}>
                        {label}
                      </p>
                      <p style={{ color, fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: -0.5 }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Damage Detection Summary */}
                {vehicle.damageReport && (
                  <div
                    onClick={() => navigate(`/damage-detection?vehicleId=${vehicle.id}`)}
                    style={{
                      background: vehicle.damageReport.severity === 'Critical' ? 'rgba(255, 59, 59, 0.1)' : 'rgba(255,255,255,0.025)',
                      border: `1px solid ${vehicle.damageReport.severity === 'Critical' ? 'rgba(255, 59, 59, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 14,
                      padding: '12px 14px',
                      marginBottom: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                    className="hover:bg-white/5"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'relative', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 32 32" style={{ position: 'absolute', inset: 0 }}>
                          <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                          <circle
                            cx="16" cy="16" r="14"
                            fill="none"
                            stroke={vehicle.damageReport.severity === 'Critical' ? 'var(--red)' : vehicle.damageReport.severity === 'Moderate' ? 'var(--amber)' : 'var(--green)'}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="87.96"
                            strokeDashoffset={vehicle.damageReport.severity === 'Critical' ? '20' : vehicle.damageReport.severity === 'Moderate' ? '40' : '60'}
                            transform="rotate(-90 16 16)"
                          />
                        </svg>
                        <Scan size={14} color={vehicle.damageReport.severity === 'Critical' ? 'var(--red)' : vehicle.damageReport.severity === 'Moderate' ? 'var(--amber)' : 'var(--green)'} />
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                          AI Hasar Tespiti
                        </p>
                        <p style={{ color: vehicle.damageReport.severity === 'Critical' ? 'var(--red)' : 'var(--text-muted)', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                          {vehicle.damageReport.severity === 'Critical' ? 'Kritik Hasar' : vehicle.damageReport.severity === 'Moderate' ? 'Orta Seviye' : 'Hafif Hasar'}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 700, letterSpacing: 0.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                        {t('garage.estimated')}
                      </p>
                      <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        ₺{vehicle.damageReport.cost.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {!isSold ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: t('garage.details'), icon: LayoutDashboard, action: () => navigate(`/dashboard/${vehicle.id}`), accent: '#6366f1' },
                      { label: t('garage.add_record'), icon: Plus, action: () => navigate('/add-record', { state: { vehicleId: vehicle.id } }), accent: '#00E878' },
                      { label: t('garage.delete'), icon: Trash2, action: () => setArchiveConfirmationId(vehicle.id), accent: '#FF3B3B' },
                    ].map(({ label, icon: Icon, action, accent }) => (
                      <button
                        key={label}
                        onClick={action}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          padding: '11px 8px', borderRadius: 14,
                          background: `${accent}0D`,
                          border: `1px solid ${accent}20`,
                          cursor: 'pointer', transition: 'all 0.2s',
                          fontFamily: 'var(--font-body)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${accent}18`; e.currentTarget.style.borderColor = `${accent}40`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${accent}0D`; e.currentTarget.style.borderColor = `${accent}20`; }}
                      >
                        <Icon size={16} color={accent} />
                        <span style={{ color: accent, fontSize: 10, fontWeight: 700 }}>{label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(`/dashboard/${vehicle.id}`)}
                    style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {t('garage.view_sold_vehicle')} <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {
          !vehiclesLoading && filteredVehicles.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Car size={36} color="var(--bg-surface)" strokeWidth={1} />
              </div>
              <h3 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 8 }}>
                {searchQuery ? t('garage.no_vehicle_found') : t('garage.garage_empty')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 220, margin: '0 auto 24px', lineHeight: 1.6 }}>
                {searchQuery ? t('garage.search_no_match') : t('garage.no_vehicle_yet')}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 700, background: 'var(--gold-dim)', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '10px 20px', cursor: 'pointer' }}>
                  {t('garage.clear_search')}
                </button>
              )}
            </div>
          )
        }

        {/* ── Add Vehicle CTA ─── */}
        <button
          onClick={handleAddVehicle}
          style={{
            width: '100%', padding: '22px', borderRadius: 24,
            border: '1px dashed rgba(201,168,76,0.25)',
            background: 'rgba(201,168,76,0.03)',
            cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            position: 'relative', overflow: 'hidden',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'; e.currentTarget.style.background = 'rgba(201,168,76,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.background = 'rgba(201,168,76,0.03)'; }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--gold-dim)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={18} color="var(--gold)" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 1, color: 'var(--gold)', opacity: 0.8 }}>
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
                    <h3 className="text-xl font-bold text-white">Geçmişi Aktar</h3>
                    <p className="text-slate-400 text-xs mt-1">Bu kodu yeni araç sahibine gösterin.</p>
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
                    onClick={() => { navigator.clipboard.writeText(transferModal.code); toast.success('Kod kopyalandı!'); }}
                    className="bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 transition active:scale-95 text-xs text-white"
                  >
                    <Copy size={16} /> <span>Kopyala</span>
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 text-white shadow-lg shadow-blue-900/40 transition active:scale-95 text-xs">
                    <Share2 size={16} /> <span>Paylaş</span>
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
              <h3 className="text-xl font-bold text-center mb-2">Aracı Arşivle?</h3>
              <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed px-2">
                <span className="font-bold text-white">{vehicleToArchive.model}</span> aracını ana listenizden kaldırmak üzeresiniz. Geçmiş kayıtlara "Ayarlar" menüsünden erişmeye devam edebilirsiniz.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setArchiveConfirmationId(null)}
                  className="py-3.5 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition active:scale-95"
                >
                  İptal
                </button>
                <button
                  onClick={handleArchiveConfirm}
                  className="py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition active:scale-95 shadow-lg shadow-blue-900/30"
                >
                  Arşivle
                </button>
              </div>
            </div>
          </div>
        )
      }

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fadeIn {
            animation: fadeIn 0.2s ease-out forwards;
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
