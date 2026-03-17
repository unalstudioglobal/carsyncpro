import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, QrCode, Download, Share2, Car, Gauge, Calendar,
  Shield, Wrench, Fuel, CheckCircle2, AlertTriangle, Copy, Check,
  Printer, RefreshCw, Info, ChevronDown, Activity
} from 'lucide-react';
import { fetchVehicles, fetchLogs } from '../services/firestoreService';
import { Vehicle, ServiceLog } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CardData {
  vehicle: Vehicle;
  lastService: ServiceLog | null;
  totalServices: number;
  totalSpent: number;
  fuelCount: number;
}

type CardTheme = 'dark' | 'light' | 'carbon' | 'racing';

// ─── Constants ───────────────────────────────────────────────────────────────

const THEMES: Record<CardTheme, {
  labelKey: string;
  bg: string;
  text: string;
  subtext: string;
  border: string;
  accent: string;
  qrBg: string;
  qrFg: string;
}> = {
  dark: {
    labelKey: 'qr_card.theme_dark',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    text: '#f8fafc', subtext: '#94a3b8', border: '#334155',
    accent: '#6366f1', qrBg: '#1e293b', qrFg: '#f8fafc',
  },
  light: {
    labelKey: 'qr_card.theme_light',
    bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
    text: '#0f172a', subtext: '#64748b', border: '#cbd5e1',
    accent: '#6366f1', qrBg: '#f8fafc', qrFg: '#0f172a',
  },
  carbon: {
    labelKey: 'qr_card.theme_carbon',
    bg: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #18181b 100%)',
    text: '#fafafa', subtext: '#a1a1aa', border: '#3f3f46',
    accent: '#f59e0b', qrBg: '#27272a', qrFg: '#fafafa',
  },
  racing: {
    labelKey: 'qr_card.theme_racing',
    bg: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 30%, #1a1a2e 100%)',
    text: '#fff7ed', subtext: '#fca5a5', border: '#b91c1c',
    accent: '#ef4444', qrBg: '#1a1a2e', qrFg: '#fff7ed',
  },
};

const STATUS_LABELS: Record<string, { labelKey: string; icon: string; color: string }> = {
  'ok': { labelKey: 'qr_card.status_ok', icon: '✅', color: '#10b981' },
  'warn': { labelKey: 'qr_card.status_service', icon: '⚠️', color: '#f59e0b' },
  'urgent': { labelKey: 'qr_card.status_urgent', icon: '🚨', color: '#ef4444' },
  'sold': { labelKey: 'qr_card.status_sold', icon: '💰', color: '#64748b' },
};

// ─── QR Generator (using qrcode-svg via canvas) ──────────────────────────────

// Simple QR code generation using a public API (no npm needed)
const getQRUrl = (text: string, bg: string, fg: string, size = 200) => {
  const bgHex = bg.replace('#', '');
  const fgHex = fg.replace('#', '');
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=${bgHex}&color=${fgHex}&format=png&qzone=1`;
};

// ─── Card Component (rendered to canvas for download) ────────────────────────

const VehicleCardDisplay: React.FC<{
  data: CardData;
  theme: CardTheme;
  showQR: boolean;
  qrDataUrl: string | null;
  cardRef: React.RefObject<HTMLDivElement>;
}> = ({ data, theme, showQR, qrDataUrl, cardRef }) => {
  const { t, i18n } = useTranslation();
  const { vehicle, lastService, totalServices, totalSpent, fuelCount } = data;
  const themeCfg = THEMES[theme];
  const statusCfg = STATUS_LABELS[vehicle.status] || STATUS_LABELS['ok'];

  const lastServiceDate = lastService
    ? new Date(lastService.date + 'T00:00:00').toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    : t('qr_card.no_record');

  return (
    <div
      ref={cardRef}
      style={{
        background: themeCfg.bg,
        border: `1px solid ${themeCfg.border}`,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 380,
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 150, height: 150, borderRadius: '50%',
        background: themeCfg.accent, opacity: 0.08,
      }} />
      <div style={{
        position: 'absolute', bottom: -30, left: -30,
        width: 100, height: 100, borderRadius: '50%',
        background: themeCfg.accent, opacity: 0.05,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              background: themeCfg.accent, borderRadius: 8, padding: '4px 10px',
              fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 1,
            }}>
              CARSYNC PRO
            </div>
          </div>
          <h2 style={{ color: themeCfg.text, fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
            {vehicle.brand} {vehicle.model}
          </h2>
          <p style={{ color: themeCfg.subtext, fontSize: 13, margin: '4px 0 0' }}>
            {vehicle.year} • {vehicle.plate}
          </p>
        </div>
        {/* Health score badge */}
        <div style={{
          background: vehicle.healthScore >= 70 ? '#10b98120' : '#ef444420',
          border: `1px solid ${vehicle.healthScore >= 70 ? '#10b981' : '#ef4444'}40`,
          borderRadius: 12, padding: '8px 14px', textAlign: 'center',
        }}>
          <div style={{
            fontSize: 22, fontWeight: 800,
            color: vehicle.healthScore >= 70 ? '#10b981' : vehicle.healthScore >= 40 ? '#f59e0b' : '#ef4444',
          }}>
            {vehicle.healthScore}
          </div>
          <div style={{ fontSize: 9, color: themeCfg.subtext, fontWeight: 600, letterSpacing: 0.5 }}>{t('qr_card.health')}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: themeCfg.border, marginBottom: 16 }} />

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: t('mileage'), value: `${vehicle.mileage.toLocaleString(i18n.language)} km` },
          { label: t('maintenance'), value: t('qr_card.service_count', { count: totalServices }) },
          { label: t('fuel'), value: t('qr_card.fuel_count', { count: fuelCount }) },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: `${themeCfg.border}40`, borderRadius: 10,
            padding: '10px 8px', textAlign: 'center',
          }}>
            <div style={{ color: themeCfg.text, fontSize: 13, fontWeight: 700 }}>{value}</div>
            <div style={{ color: themeCfg.subtext, fontSize: 10, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Status + last service */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{
          flex: 1, background: `${themeCfg.border}40`, borderRadius: 10, padding: '8px 12px',
        }}>
          <div style={{ color: themeCfg.subtext, fontSize: 10, marginBottom: 3 }}>{t('qr_card.status')}</div>
          <div style={{ color: statusCfg.color, fontSize: 12, fontWeight: 700 }}>
            {statusCfg.icon} {t(statusCfg.labelKey)}
          </div>
        </div>
        <div style={{
          flex: 1, background: `${themeCfg.border}40`, borderRadius: 10, padding: '8px 12px',
        }}>
          <div style={{ color: themeCfg.subtext, fontSize: 10, marginBottom: 3 }}>{t('qr_card.last_service')}</div>
          <div style={{ color: themeCfg.text, fontSize: 11, fontWeight: 600 }}>{lastServiceDate}</div>
        </div>
      </div>

      {/* Total spent */}
      <div style={{
        background: `${themeCfg.accent}15`, border: `1px solid ${themeCfg.accent}30`,
        borderRadius: 10, padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: showQR ? 16 : 0,
      }}>
        <span style={{ color: themeCfg.subtext, fontSize: 11 }}>{t('qr_card.total_spent')}</span>
        <span style={{ color: themeCfg.text, fontSize: 16, fontWeight: 800 }}>
          ₺{totalSpent.toLocaleString(i18n.language)}
        </span>
      </div>

      {/* QR Code */}
      {showQR && qrDataUrl && (
        <>
          <div style={{ height: 1, background: themeCfg.border, marginBottom: 16 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src={qrDataUrl}
              alt="QR"
              style={{ width: 72, height: 72, borderRadius: 10, background: themeCfg.qrBg }}
            />
            <div>
              <p style={{ color: themeCfg.text, fontSize: 11, fontWeight: 700, margin: 0 }}>{t('qr_card.vehicle_history')}</p>
              <p style={{ color: themeCfg.subtext, fontSize: 10, margin: '3px 0 0' }}>
                {t('qr_card.history_subtitle')}
              </p>
              <p style={{ color: themeCfg.subtext, fontSize: 9, marginTop: 4, fontFamily: 'monospace' }}>
                CarSync Pro • {vehicle.plate}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const VehicleQRCard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [selectedId, setSelectedId] = useState<string>(id || '');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<CardTheme>('dark');
  const [showQR, setShowQR] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const load = async () => {
      const [v, l] = await Promise.all([fetchVehicles(), fetchLogs()]);
      setVehicles(v);
      setLogs(l);
      if (!selectedId && v.length > 0) setSelectedId(v[0].id);
      setLoading(false);
    };
    load();
  }, []);

  // Generate QR when vehicle changes
  useEffect(() => {
    if (!selectedId) return;
    const themeCfg = THEMES[theme];
    setQrLoading(true);
    const vehicle = vehicles.find(v => v.id === selectedId);
    if (!vehicle) return;

    const qrText = `CarSync Pro | ${vehicle.brand} ${vehicle.model} (${vehicle.year}) | ${vehicle.plate} | ${vehicle.mileage.toLocaleString(i18n.language)} km`;
    const url = getQRUrl(qrText, themeCfg.qrBg, themeCfg.qrFg, 200);

    // Preload image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Convert to data URL via canvas
      const canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      setQrDataUrl(canvas.toDataURL('image/png'));
      setQrLoading(false);
    };
    img.onerror = () => {
      // Fallback: use URL directly
      setQrDataUrl(url);
      setQrLoading(false);
    };
    img.src = url;
  }, [selectedId, theme, vehicles, i18n.language]);

  const cardData = (() => {
    const vehicle = vehicles.find(v => v.id === selectedId);
    if (!vehicle) return null;
    const vehicleLogs = logs.filter(l => l.vehicleId === selectedId);
    const sorted = [...vehicleLogs].sort((a, b) => b.date.localeCompare(a.date));
    return {
      vehicle,
      lastService: sorted[0] || null,
      totalServices: vehicleLogs.filter(l => l.type !== 'Yakıt Alımı').length,
      totalSpent: vehicleLogs.reduce((s, l) => s + l.cost, 0),
      fuelCount: vehicleLogs.filter(l => l.type === 'Yakıt Alımı').length,
    };
  })();

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || !cardData) return;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
        <html>
          <head>
            <title>${t('qr_card.vehicle_history')} - ${cardData.vehicle.brand} ${cardData.vehicle.model}</title>
            <style>
              body { margin: 0; padding: 20px; background: #000; display: flex; justify-content: center; }
              @media print { body { background: white; } }
            </style>
          </head>
          <body>
            ${cardRef.current.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [cardData, t]);

  const handleCopyLink = () => {
    if (!cardData) return;
    const text = t('qr_card.share_text', {
      brand: cardData.vehicle.brand,
      model: cardData.vehicle.model,
      year: cardData.vehicle.year,
      plate: cardData.vehicle.plate,
      mileage: cardData.vehicle.mileage.toLocaleString(i18n.language),
      score: cardData.vehicle.healthScore
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    if (!cardData) return;
    const text = t('qr_card.share_text', {
      brand: cardData.vehicle.brand,
      model: cardData.vehicle.model,
      year: cardData.vehicle.year,
      plate: cardData.vehicle.plate,
      mileage: cardData.vehicle.mileage.toLocaleString(i18n.language),
      score: cardData.vehicle.healthScore
    });
    if (navigator.share) {
      await navigator.share({ title: t('qr_card.title'), text });
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <QrCode className="text-indigo-400 animate-pulse" size={24} />
          </div>
          <p className="text-slate-400 text-sm">{t('common.loading')}</p>
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
            <h1 className="text-lg font-bold text-white">{t('qr_card.title')}</h1>
            <p className="text-slate-500 text-xs">{t('qr_card.subtitle')}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-1.5">
            <QrCode size={12} className="text-violet-400" />
            <span className="text-violet-300 text-xs font-medium">QR</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Vehicle selector */}
        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('qr_card.select_vehicle')}</label>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${selectedId === v.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                  }`}
              >
                <Car size={12} />
                {v.brand} {v.model}
              </button>
            ))}
          </div>
        </div>

        {/* Card preview */}
        {cardData && (
          <VehicleCardDisplay
            data={cardData}
            theme={theme}
            showQR={showQR}
            qrDataUrl={qrDataUrl}
            cardRef={cardRef}
          />
        )}

        {/* QR loading */}
        {qrLoading && showQR && (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-xs py-2">
            <RefreshCw size={12} className="animate-spin" />
            {t('qr_card.generating_qr')}
          </div>
        )}

        {/* Theme selector */}
        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('qr_card.card_theme')}</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(THEMES) as [CardTheme, typeof THEMES[CardTheme]][]).map(([key, themeCfg]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`rounded-xl overflow-hidden border-2 transition-all ${theme === key ? 'border-violet-500 scale-95' : 'border-transparent'
                  }`}
              >
                <div style={{ background: themeCfg.bg, height: 44 }} className="flex items-center justify-center">
                  <span style={{ color: themeCfg.text, fontSize: 9, fontWeight: 700 }}>{t(themeCfg.labelKey)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle QR */}
        <button
          onClick={() => setShowQR(!showQR)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${showQR
              ? 'bg-violet-500/10 border-violet-500/20 text-violet-300'
              : 'bg-slate-800/40 border-slate-700/30 text-slate-400'
            }`}
        >
          <div className="flex items-center gap-2">
            <QrCode size={16} />
            <span className="text-sm font-medium">{t('qr_card.show_qr')}</span>
          </div>
          <div className={`w-10 h-5 rounded-full transition-all relative ${showQR ? 'bg-violet-600' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showQR ? 'left-5' : 'left-0.5'}`} />
          </div>
        </button>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-slate-800/60 border border-slate-700/30 text-slate-300 hover:bg-slate-700/60 transition-all"
          >
            <Printer size={20} className="text-slate-400" />
            <span className="text-xs font-medium">{t('qr_card.print')}</span>
          </button>
          <button
            onClick={handleCopyLink}
            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${copied
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700/30 text-slate-300 hover:bg-slate-700/60'
              }`}
          >
            {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} className="text-slate-400" />}
            <span className="text-xs font-medium">{copied ? t('qr_card.copied') : t('qr_card.copy')}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-violet-600 border border-violet-500 text-white hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20"
          >
            <Share2 size={20} />
            <span className="text-xs font-medium">{t('qr_card.share')}</span>
          </button>
        </div>

        {/* Use cases */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 space-y-3">
          <p className="text-slate-300 text-xs font-semibold flex items-center gap-2">
            <Info size={13} className="text-violet-400" />
            {t('qr_card.how_to_use')}
          </p>
          {[
            { icon: Wrench, text: t('qr_card.use_case_1') },
            { icon: Shield, text: t('qr_card.use_case_2') },
            { icon: Activity, text: t('qr_card.use_case_3') },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={13} className="text-violet-400" />
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
