import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Car, Wrench, BarChart2, Bell, Shield, ChevronRight,
  Check, Sparkles, Zap, Users, QrCode, Fuel,
  ArrowRight, Star, Lock, ChevronLeft
} from 'lucide-react';
import { addVehicle } from '../services/firestoreService';
import { getSetting, saveSetting } from '../services/settingsService';

// ─── Types ───────────────────────────────────────────────────────────────────

type OnboardStep =
  | 'welcome'
  | 'features'
  | 'add-vehicle'
  | 'notifications'
  | 'complete';

interface QuickVehicle {
  brand: string;
  model: string;
  year: string;
  plate: string;
  mileage: string;
}

const LS_KEY = 'carsync_onboarding_done';

// ─── Popular Brands ──────────────────────────────────────────────────────────

const POPULAR_BRANDS = [
  'Toyota', 'Volkswagen', 'Renault', 'Ford', 'Hyundai',
  'Fiat', 'Honda', 'BMW', 'Mercedes', 'Opel',
  'Peugeot', 'Dacia', 'Kia', 'Nissan', 'Volvo',
];

const BRAND_EMOJIS: Record<string, string> = {
  Toyota: '🇯🇵', Volkswagen: '🇩🇪', Renault: '🇫🇷', Ford: '🇺🇸',
  Hyundai: '🇰🇷', Fiat: '🇮🇹', Honda: '🇯🇵', BMW: '🇩🇪',
  Mercedes: '🇩🇪', Opel: '🇩🇪', Peugeot: '🇫🇷', Dacia: '🇷🇴',
  Kia: '🇰🇷', Nissan: '🇯🇵', Volvo: '🇸🇪',
};

// ─── Feature Highlights ──────────────────────────────────────────────────────

// FEATURES array generation is moved inside component or uses t()

// ─── Animated Background ─────────────────────────────────────────────────────

const FloatingOrbs: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[
      { size: 300, x: -80, y: -60, color: 'rgba(99,102,241,0.12)', delay: 0 },
      { size: 200, x: '60%', y: '30%', color: 'rgba(139,92,246,0.10)', delay: 1.5 },
      { size: 250, x: '10%', y: '60%', color: 'rgba(6,182,212,0.08)', delay: 3 },
      { size: 180, x: '75%', y: '70%', color: 'rgba(16,185,129,0.08)', delay: 0.8 },
    ].map((orb, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          width: orb.size,
          height: orb.size,
          left: orb.x,
          top: orb.y,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
          animation: `float ${6 + i * 0.8}s ease-in-out infinite`,
          animationDelay: `${orb.delay}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-20px) scale(1.05); }
      }
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.8); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes shimmerSlide {
        from { transform: translateX(-100%); }
        to   { transform: translateX(100%); }
      }
      .anim-fade-up { animation: fadeSlideUp 0.5s ease-out both; }
      .anim-scale   { animation: scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
    `}</style>
  </div>
);

// ─── Step: Welcome ───────────────────────────────────────────────────────────

const WelcomeStep: React.FC<{ onNext: () => void; t: any }> = ({ onNext, t }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 text-center relative">
      <FloatingOrbs />

      {/* Logo mark */}
      <div
        className="anim-scale relative mb-8"
        style={{ animationDelay: '0.1s', opacity: visible ? undefined : 0 }}
      >
        <div style={{
          width: 100, height: 100,
          borderRadius: 28,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 60px rgba(99,102,241,0.4), 0 20px 40px rgba(0,0,0,0.4)',
          position: 'relative', overflow: 'hidden',
        }}>
          <Car size={48} color="white" />
          {/* Shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
            animation: 'shimmerSlide 2.5s ease-in-out infinite',
          }} />
        </div>
        {/* Pulse rings */}
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: -i * 14,
            borderRadius: 28 + i * 4,
            border: `1px solid rgba(99,102,241,${0.15 - i * 0.04})`,
            animation: `float ${2 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>

      {/* Text */}
      <div className="anim-fade-up relative" style={{ animationDelay: '0.3s' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 100, padding: '4px 14px', marginBottom: 20,
        }}>
          <Sparkles size={11} color="#a5b4fc" />
          <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{t('onboarding.w_tag')}</span>
        </div>

        <h1 style={{
          color: '#f8fafc', fontWeight: 800, fontSize: 34, lineHeight: 1.1,
          marginBottom: 16, letterSpacing: -1,
        }}>
          CarSync
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            display: 'block',
          }}>{t('onboarding.w_welcome')}</span>
        </h1>

        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, marginBottom: 40, maxWidth: 280 }}>
          Aracını takip et, bakımlarını yönet, maliyetlerini analiz et. Her şey tek yerde.
        </p>
      </div>

      {/* CTA */}
      <div className="anim-fade-up relative w-full max-w-xs" style={{ animationDelay: '0.5s' }}>
        <button
          onClick={onNext}
          style={{
            width: '100%', padding: '16px 24px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontWeight: 800, fontSize: 16,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <span>{t('onboarding.w_btn')}</span>
          <ArrowRight size={18} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
            animation: 'shimmerSlide 2s ease-in-out infinite',
          }} />
        </button>

        <p style={{ color: '#475569', fontSize: 11, marginTop: 14, textAlign: 'center' }}>
          Kurulum 2 dakikadan az sürer
        </p>
      </div>
    </div>
  );
};

// ─── Step: Features ──────────────────────────────────────────────────────────

const FeaturesStep: React.FC<{ onNext: () => void; onBack: () => void; t: any }> = ({ onNext, onBack, t }) => {
  const [revealed, setRevealed] = useState(0);
  
  const FEATURES = [
    { icon: Wrench, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', title: t('onboarding.f_1_title'), desc: t('onboarding.f_1_desc') },
    { icon: BarChart2, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', title: t('onboarding.f_2_title'), desc: t('onboarding.f_2_desc') },
    { icon: Sparkles, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', title: t('onboarding.f_3_title'), desc: t('onboarding.f_3_desc') },
    { icon: QrCode, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', title: t('onboarding.f_4_title'), desc: t('onboarding.f_4_desc') },
    { icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.12)', title: t('onboarding.f_5_title'), desc: t('onboarding.f_5_desc') },
    { icon: Fuel, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', title: t('onboarding.f_6_title'), desc: t('onboarding.f_6_desc') },
  ];

  useEffect(() => {
    FEATURES.forEach((_, i) => {
      setTimeout(() => setRevealed(i + 1), i * 120);
    });
  }, []);

  return (
    <div className="flex flex-col flex-1 px-4">
      <div className="px-2 pt-4 pb-5">
        <p style={{ color: '#6366f1', fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>{t('onboarding.f_tag')}</p>
        <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: 26, lineHeight: 1.2 }}>
          Aracın için her şey
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pb-4">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="anim-fade-up"
              style={{
                animationDelay: `${i * 0.1}s`,
                opacity: revealed > i ? undefined : 0,
                background: 'rgba(30,41,59,0.5)',
                border: '1px solid rgba(51,65,85,0.5)',
                borderRadius: 18, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: f.bg,
                border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={20} color={f.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{f.title}</p>
                <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.4 }}>{f.desc}</p>
              </div>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: f.color, flexShrink: 0, opacity: 0.7,
              }} />
            </div>
          );
        })}
      </div>

      <div className="pb-6 pt-2 flex gap-3">
        <button onClick={onBack} style={{
          width: 48, height: 52, borderRadius: 16,
          background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)',
          color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ChevronLeft size={20} />
        </button>
        <button onClick={onNext} style={{
          flex: 1, padding: '16px', borderRadius: 18,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white', fontWeight: 700, fontSize: 15,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
        }}>
          {t('onboarding.f_btn')} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

// ─── Step: Add Vehicle ───────────────────────────────────────────────────────

const AddVehicleStep: React.FC<{
  onNext: (vehicle: QuickVehicle | null) => void;
  onBack: () => void;
  t: any;
}> = ({ onNext, onBack, t }) => {
  const [vehicle, setVehicle] = useState<QuickVehicle>({ brand: '', model: '', year: '', plate: '', mileage: '' });
  const [step, setStep] = useState<'brand' | 'details'>('brand');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof QuickVehicle, val: string) => setVehicle(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!vehicle.brand || !vehicle.model || !vehicle.plate) {
      setError(t('onboarding.av_err_req'));
      return;
    }
    setSaving(true);
    try {
      await addVehicle({
        brand: vehicle.brand,
        model: vehicle.model,
        year: Number(vehicle.year) || new Date().getFullYear(),
        plate: vehicle.plate.toUpperCase(),
        mileage: Number(vehicle.mileage) || 0,
        image: '',
        status: 'Sorun Yok',
        healthScore: 100,
        lastLogDate: '',
        marketValueMin: 0,
        marketValueMax: 0,
      });
      onNext(vehicle);
    } catch (e) {
      setError(t('onboarding.av_err'));
    } finally {
      setSaving(false);
    }
  };

  if (step === 'brand') {
    return (
      <div className="flex flex-col flex-1 px-4">
        <div className="px-2 pt-4 pb-5">
          <p style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>{t('onboarding.av_1_tag')}</p>
          <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: 26, lineHeight: 1.2 }}>{t('onboarding.av_1_title')}</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>{t('onboarding.av_1_desc')}</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            value={vehicle.brand}
            onChange={e => set('brand', e.target.value)}
            placeholder={t('onboarding.av_1_search')}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: 16, padding: '14px 16px',
              color: '#f8fafc', fontSize: 15, outline: 'none',
            }}
          />
        </div>

        {/* Brand grid */}
        <div className="flex-1 overflow-y-auto">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, paddingBottom: 16 }}>
            {POPULAR_BRANDS
              .filter(b => !vehicle.brand || b.toLowerCase().includes(vehicle.brand.toLowerCase()))
              .map(brand => (
                <button
                  key={brand}
                  onClick={() => { set('brand', brand); setStep('details'); }}
                  style={{
                    background: vehicle.brand === brand ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.5)',
                    border: `1px solid ${vehicle.brand === brand ? 'rgba(99,102,241,0.5)' : 'rgba(51,65,85,0.4)'}`,
                    borderRadius: 14, padding: '12px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{BRAND_EMOJIS[brand] || '🚗'}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>{brand}</span>
                </button>
              ))}
          </div>
        </div>

        <div className="pb-6 pt-2 flex gap-3">
          <button onClick={onBack} style={{
            width: 48, height: 52, borderRadius: 16,
            background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)',
            color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => vehicle.brand && setStep('details')}
            disabled={!vehicle.brand}
            style={{
              flex: 1, padding: 16, borderRadius: 18,
              background: vehicle.brand ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(30,41,59,0.6)',
              color: vehicle.brand ? 'white' : '#475569', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: vehicle.brand ? 'pointer' : 'not-allowed',
              boxShadow: vehicle.brand ? '0 8px 24px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            {t('onboarding.av_1_btn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-4 overflow-y-auto">
      <div className="px-2 pt-4 pb-5">
        <p style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>{t('onboarding.av_2_tag')}</p>
        <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: 26, lineHeight: 1.2 }}>
          {t('onboarding.av_2_title', { b: vehicle.brand })}
        </h2>
      </div>

      <div className="space-y-3 flex-1 pb-4">
        {[
          { key: 'model', label: 'Model', placeholder: 'Corolla, Golf, Clio...', type: 'text' },
          { key: 'year', label: 'Yıl', placeholder: new Date().getFullYear().toString(), type: 'number' },
          { key: 'plate', label: 'Plaka', placeholder: '34 ABC 123', type: 'text' },
          { key: 'mileage', label: 'Kilometre', placeholder: '0', type: 'number' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
              {label.toUpperCase()}{key !== 'mileage' && key !== 'year' && ' *'}
            </label>
            <input
              type={type}
              value={(vehicle as any)[key]}
              onChange={e => set(key as keyof QuickVehicle, e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)',
                borderRadius: 14, padding: '14px 16px',
                color: '#f8fafc', fontSize: 15, outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.5)'}
            />
          </div>
        ))}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '10px 14px', color: '#fca5a5', fontSize: 13,
          }}>
            {error}
          </div>
        )}
      </div>

      <div className="pb-6 pt-2 flex gap-3">
        <button onClick={() => setStep('brand')} style={{
          width: 48, height: 52, borderRadius: 16,
          background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)',
          color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ChevronLeft size={20} />
        </button>
        <button onClick={handleSave} disabled={saving || !vehicle.brand || !vehicle.model || !vehicle.plate} style={{
          flex: 1, padding: 16, borderRadius: 18,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white', fontWeight: 700, fontSize: 15,
          border: 'none', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          opacity: (saving || !vehicle.model || !vehicle.plate) ? 0.6 : 1,
        }}>
          {saving ? 'Kaydediliyor...' : 'Aracımı Kaydet 🚗'}
        </button>
      </div>
    </div>
  );
};

// ─── Step: Notifications ─────────────────────────────────────────────────────

const NotificationsStep: React.FC<{
  vehicleName: string;
  onNext: () => void;
  onBack: () => void;
  t: any;
}> = ({ vehicleName, onNext, onBack, t }) => {
  const [permState, setPermState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  const requestPermission = async () => {
    setPermState('requesting');
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermState(result === 'granted' ? 'granted' : 'denied');
      if (result === 'granted') {
        setTimeout(() => {
          new Notification('CarSync Pro', {
            body: t('onboarding.n_body', { v: vehicleName || 'Aracın' }),
          });
        }, 500);
      }
    } else {
      setPermState('denied');
    }
  };

  return (
    <div className="flex flex-col flex-1 px-4">
      <div className="px-2 pt-4 pb-6">
        <p style={{ color: '#8b5cf6', fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>{t('onboarding.n_tag')}</p>
        <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: 26, lineHeight: 1.2, marginBottom: 10 }}>
          Hiçbir bakımı kaçırma
        </h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
          Önemli tarihleri ve bakım zamanlarını sana hatırlatalım.
        </p>
      </div>

      {/* Notification preview cards */}
      <div className="flex-1 space-y-3">
        {[
          { icon: Wrench, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', title: 'Yağ Değişimi Zamanı', body: 'Son değişimden 9.800 km geçti — yakında servis gerekiyor.' },
          { icon: Shield, color: '#10b981', bg: 'rgba(16,185,129,0.12)', title: 'Sigorta Yenileme', body: 'Trafik sigortanızın bitimine 14 gün kaldı.' },
          { icon: Bell, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', title: 'Servis Randevusu', body: 'Yarın saat 10:00 — Oto Servis Kurumsal randevunuz var.' },
        ].map((n, i) => {
          const NIcon = n.icon;
          return (
            <div
              key={i}
              className="anim-fade-up"
              style={{
                animationDelay: `${i * 0.15}s`,
                background: n.bg,
                border: `1px solid ${n.color}25`,
                borderRadius: 18, padding: 14,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${n.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <NIcon size={16} color={n.color} />
              </div>
              <div>
                <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{n.title}</p>
                <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.4 }}>{n.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission button */}
      <div className="pb-6 pt-4 space-y-3">
        {permState !== 'granted' && permState !== 'denied' ? (
          <button
            onClick={requestPermission}
            disabled={permState === 'requesting'}
            style={{
              width: '100%', padding: 16, borderRadius: 18,
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: 'white', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
            }}
          >
            <Bell size={18} />
            {permState === 'requesting' ? t('onboarding.n_btn_req') : t('onboarding.n_btn_allow')}
          </button>
        ) : permState === 'granted' ? (
          <div style={{
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 18, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Check size={20} color="#10b981" />
            <span style={{ color: '#34d399', fontWeight: 700 }}>{t('onboarding.n_active')}</span>
          </div>
        ) : (
          <div style={{
            background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)',
            borderRadius: 18, padding: 14, textAlign: 'center',
          }}>
            <p style={{ color: '#64748b', fontSize: 13 }}>{t('onboarding.n_denied')}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onBack} style={{
            width: 48, height: 52, borderRadius: 16,
            background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)',
            color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={onNext} style={{
            flex: 1, padding: 16, borderRadius: 18,
            background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.4)',
            color: '#94a3b8', fontWeight: 600, fontSize: 14,
            cursor: 'pointer',
          }}>
            {permState === 'granted' ? t('onboarding.n_next') + ' →' : t('onboarding.n_skip') + ' →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Step: Complete ──────────────────────────────────────────────────────────

const CompleteStep: React.FC<{ vehicleName: string; onFinish: () => void; t: any }> = ({ vehicleName, onFinish, t }) => {
  const [tick, setTick] = useState(false);
  useEffect(() => { const t = setTimeout(() => setTick(true), 200); return () => clearTimeout(t); }, []);

  const nextSteps = [
    { icon: Wrench, color: '#f59e0b', text: t('onboarding.c_1') },
    { icon: BarChart2, color: '#6366f1', text: t('onboarding.c_2') },
    { icon: Sparkles, color: '#8b5cf6', text: t('onboarding.c_3') },
  ];

  return (
    <div className="flex flex-col flex-1 px-4 items-center text-center relative">
      <FloatingOrbs />

      {/* Success animation */}
      <div style={{ marginTop: 48, marginBottom: 32, position: 'relative' }}>
        <div
          className="anim-scale"
          style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 60px rgba(16,185,129,0.4)',
            margin: '0 auto',
          }}
        >
          {tick && <Check size={48} color="white" strokeWidth={3} />}
        </div>
        {/* Celebration dots */}
        {tick && [0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: 8, height: 8, borderRadius: '50%',
            background: ['#6366f1', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4', '#f59e0b', '#6366f1'][i],
            top: 50, left: 50,
            transform: `rotate(${i * 45}deg) translateY(-60px)`,
            animation: `float 1.5s ease-out both`,
            animationDelay: `${i * 0.05}s`,
          }} />
        ))}
      </div>

      <h2 style={{
        color: '#f8fafc', fontWeight: 800, fontSize: 30, lineHeight: 1.1, marginBottom: 12,
      }}>
        {t('onboarding.c_title')}
      </h2>
      {vehicleName && (
        <p style={{ color: '#10b981', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          {t('onboarding.c_added', { v: vehicleName })}
        </p>
      )}
      <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, maxWidth: 260, marginBottom: 36 }}>
        CarSync Pro artık senin. İşte ilk yapabileceğin birkaç şey:
      </p>

      <div className="w-full max-w-xs space-y-2.5 mb-auto">
        {nextSteps.map(({ icon: Icon, color, text }, i) => (
          <div key={i} className="anim-fade-up" style={{
            animationDelay: `${0.3 + i * 0.1}s`,
            background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(51,65,85,0.4)',
            borderRadius: 14, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{text}</p>
            <ChevronRight size={14} color="#475569" style={{ marginLeft: 'auto' }} />
          </div>
        ))}
      </div>

      <div className="w-full max-w-xs pb-8 pt-6">
        <button
          onClick={onFinish}
          style={{
            width: '100%', padding: 16, borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontWeight: 800, fontSize: 16,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}
        >
          {t('onboarding.c_btn')} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const STEPS: OnboardStep[] = ['welcome', 'features', 'add-vehicle', 'notifications', 'complete'];

const ProgressBar: React.FC<{ step: OnboardStep }> = ({ step }) => {
  const idx = STEPS.indexOf(step);
  if (idx === 0) return null;
  const total = STEPS.length - 1;
  return (
    <div style={{ padding: '16px 20px 0', display: 'flex', gap: 6 }}>
      {STEPS.slice(1).map((s, i) => (
        <div key={s} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i < idx ? '#6366f1' : 'rgba(51,65,85,0.6)',
          transition: 'background 0.4s ease',
        }} />
      ))}
    </div>
  );
};

// ─── Main Onboarding Component ───────────────────────────────────────────────

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<OnboardStep>('welcome');
  const [addedVehicle, setAddedVehicle] = useState<QuickVehicle | null>(null);

  const vehicleName = addedVehicle
    ? `${addedVehicle.brand} ${addedVehicle.model}`
    : '';

  const finish = () => {
    saveSetting('onboardingCompleted', true);
    navigate('/');
  };

  // Skip if already done
  useEffect(() => {
    if (getSetting('onboardingCompleted', false)) navigate('/');
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0f1e',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', inset: 0, zIndex: 100,
      overflowY: 'hidden',
    }}>
      {/* Progress */}
      <ProgressBar step={step} />

      {/* Skip button (only on features step) */}
      {step === 'features' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 20px 0' }}>
          <button onClick={finish} style={{
            color: '#475569', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
          }}>
            {t('onboarding.skip')}
          </button>
        </div>
      )}

      {/* Step content */}
      {step === 'welcome' && (
        <WelcomeStep onNext={() => setStep('features')} t={t} />
      )}
      {step === 'features' && (
        <FeaturesStep onNext={() => setStep('add-vehicle')} onBack={() => setStep('welcome')} t={t} />
      )}
      {step === 'add-vehicle' && (
        <AddVehicleStep
          onNext={v => { setAddedVehicle(v); setStep('notifications'); }}
          onBack={() => setStep('features')}
          t={t}
        />
      )}
      {step === 'notifications' && (
        <NotificationsStep
          vehicleName={vehicleName}
          onNext={() => setStep('complete')}
          onBack={() => setStep('add-vehicle')}
          t={t}
        />
      )}
      {step === 'complete' && (
        <CompleteStep vehicleName={vehicleName} onFinish={finish} t={t} />
      )}
    </div>
  );
};

// ─── Helper: check and redirect ───────────────────────────────────────────────

export const checkOnboarding = () =>
  !getSetting('onboardingCompleted', false);
