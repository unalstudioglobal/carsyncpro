import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Car, BarChart2, FileText, FileStack, Disc, Map, Brain, Scan,
  Target, ArrowRightLeft, Shield, Users, Search, Zap, Bell,
  ChevronRight, Sparkles, Navigation, Calendar, Settings, QrCode, X, Moon, Sun
} from 'lucide-react';
import { GlobalSearch, useGlobalSearch } from './GlobalSearch';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SyncIndicator } from './SyncIndicator';

const MENU_ITEMS = [
  // ── AI & Akıllı ──────────────────────────────────────
  { route: '/ai-insights', icon: Brain, label: 'AI İçgörüler', color: '#a855f7', badge: 'YENİ' },
  { route: '/predictive-maintenance', icon: Zap, label: 'AI Bakım Tahmini', color: '#8b5cf6' },
  { route: '/damage-detection', icon: Scan, label: 'Hasar Tespiti', color: '#ef4444' },
  { route: '/car-chat', icon: Sparkles, label: 'AI Asistan', color: '#a855f7' },
  // ── Araç & Yönetim ───────────────────────────────────
  { route: '/vehicle-qr', icon: QrCode, label: 'QR Araç Kartı', color: '#6366f1' },
  { route: '/tires', icon: Disc, label: 'Lastik Oteli', color: '#f59e0b' },
  { route: '/family-garage', icon: Users, label: 'Aile Garajı', color: '#6366f1' },
  { route: '/vehicle-comparison', icon: ArrowRightLeft, label: 'Araç Karşılaştır', color: '#06b6d4' },
  // ── Planlama & Finans ─────────────────────────────────
  { route: '/trip-planner', icon: Map, label: 'Rota Planlayıcı', color: '#10b981' },
  { route: '/budget-goals', icon: Target, label: 'Bütçe Hedefleri', color: '#6366f1' },
  { route: '/insurance-calendar', icon: Shield, label: 'Sigorta & Muayene', color: '#3b82f6' },
  { route: '/service-appointment', icon: Calendar, label: 'Servis Randevusu', color: '#8b5cf6' },
  // ── Araçlar ───────────────────────────────────────────
  { route: '/fuel-finder', icon: Navigation, label: 'İstasyon Bul', color: '#f59e0b' },
  { route: '/service-report', icon: FileText, label: 'PDF Raporu', color: '#06b6d4' },
  { route: '/notifications', icon: Bell, label: 'Bildirimler', color: '#f59e0b' },
  { route: '/settings', icon: Settings, label: 'Ayarlar', color: '#64748b' },
];

interface LayoutProps {
  children: React.ReactNode;
  announcement?: string;
}

const AnnouncementBanner = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="bg-gradient-to-r from-gold/90 to-gold-light/90 backdrop-blur-md py-2 px-4 shadow-lg flex items-center justify-between z-[100] relative">
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
        <Sparkles size={12} className="text-white" />
      </div>
      <p className="text-[11px] md:text-xs font-bold text-slate-900 truncate tracking-tight uppercase">
        {message}
      </p>
    </div>
    <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full transition-colors ml-4 bg-white/10">
      <X size={14} className="text-slate-900" />
    </button>
  </div>
);

export const Layout: React.FC<LayoutProps> = ({ children, announcement }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, open, close } = useGlobalSearch();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navBounce, setNavBounce] = useState<string | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  useEffect(() => {
    if (announcement) setShowAnnouncement(true);
  }, [announcement]);

  const NAV = [
    { path: '/analytics', icon: BarChart2, label: t('nav.analytics') },
    { path: '/logs', icon: FileText, label: t('nav.logs') },
    { path: '/documents', icon: FileStack, label: t('nav.documents') },
  ];

  const isActive = (p: string) => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p);

  const hideNav =
    location.pathname.includes('/add-vehicle') ||
    location.pathname.includes('/scan') ||
    location.pathname === '/login' ||
    location.pathname === '/onboarding';

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const go = useCallback((path: string) => {
    setNavBounce(path);
    setTimeout(() => setNavBounce(null), 450);
    navigate(path);
    setIsMenuOpen(false);
  }, [navigate]);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-void)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      <GlobalSearch isOpen={isOpen} onClose={close} />
      {showAnnouncement && announcement && (
        <AnnouncementBanner message={announcement} onClose={() => setShowAnnouncement(false)} />
      )}

      {!hideNav && (
        <aside className="web-sidebar">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-2 -ml-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-light to-gold flex items-center justify-center shadow-lg shadow-gold/20">
                <Car size={22} className="text-slate-950" strokeWidth={2.5} />
              </div>
              <p
                className="text-3xl tracking-[0.2em] animate-premium-shine transition-all duration-300 cursor-default logo-3d"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                CARSYNC PRO
              </p>
              <SyncIndicator variant="compact" className="ml-auto" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar px-4 space-y-8 pb-8">
            <nav className="space-y-1 px-2">
              {[
                { path: '/', icon: Car, label: t('nav.garage') },
                { path: '/analytics', icon: BarChart2, label: t('nav.analytics') },
                { path: '/logs', icon: FileText, label: t('nav.logs') },
                { path: '/documents', icon: FileStack, label: t('nav.documents') },
              ].map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-300 group ${active ? 'bg-gold/10 text-gold border border-gold/20' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
                  >
                    <item.icon size={20} className={active ? 'text-gold' : 'group-hover:text-white transition-colors'} strokeWidth={active ? 2.5 : 2} />
                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_var(--gold)]" />}
                  </button>
                );
              })}
            </nav>

            <div className="space-y-1.5 px-2">
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-3 pl-2">{t('nav.ai_tools')}</p>
              {[
                { route: '/car-chat', icon: Sparkles, label: t('nav.car_chat'), color: '#a855f7' },
                { route: '/predictive-maintenance', icon: Brain, label: t('nav.predictive_maintenance'), color: '#8b5cf6' },
              ].map((item) => {
                const active = isActive(item.route);
                return (
                  <button key={item.route} onClick={() => go(item.route)} className={`w-full flex items-center gap-4 py-2.5 px-2 rounded-xl transition-all ${active ? 'bg-white/5 shadow-sm' : 'hover:bg-white/5'}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10" style={{ color: active ? item.color : 'rgba(255,255,255,0.7)' }}><item.icon size={16} /></div>
                    <span className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 px-2">
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-3 pl-2">{t('nav.detection_field')}</p>
              {[
                { route: '/damage-detection', icon: Scan, label: t('nav.damage_detection'), color: '#ef4444' },
                { route: '/fuel-finder', icon: Navigation, label: t('nav.fuel_finder'), color: '#f59e0b' },
              ].map((item) => {
                const active = isActive(item.route);
                return (
                  <button key={item.route} onClick={() => go(item.route)} className={`w-full flex items-center gap-4 py-2.5 px-2 rounded-xl transition-all ${active ? 'bg-white/5 shadow-sm' : 'hover:bg-white/5'}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10" style={{ color: active ? item.color : 'rgba(255,255,255,0.7)' }}><item.icon size={16} /></div>
                    <span className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 px-2">
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-3 pl-2">{t('nav.vehicle_management')}</p>
              {[
                { route: '/vehicle-qr', icon: QrCode, label: t('nav.vehicle_qr'), color: '#6366f1' },
                { route: '/tires', icon: Disc, label: t('nav.tires'), color: '#f59e0b' },
                { route: '/insurance-calendar', icon: Shield, label: t('nav.insurance_calendar'), color: '#3b82f6' },
                { route: '/service-appointment', icon: Calendar, label: t('nav.service_appointment'), color: '#8b5cf6' },
                { route: '/vehicle-comparison', icon: ArrowRightLeft, label: t('nav.vehicle_comparison'), color: '#10b981' },
                { route: '/trip-planner', icon: Map, label: t('nav.trip_planner'), color: '#10b981' },
              ].map((item) => {
                const active = isActive(item.route);
                return (
                  <button key={item.route} onClick={() => go(item.route)} className={`w-full flex items-center gap-4 py-2.5 px-2 rounded-xl transition-all ${active ? 'bg-white/5 shadow-sm' : 'hover:bg-white/5'}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10" style={{ color: active ? item.color : 'rgba(255,255,255,0.7)' }}><item.icon size={16} /></div>
                    <span className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 px-2">
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-3 pl-2">{t('nav.finance_reports')}</p>
              {[
                { route: '/budget-goals', icon: Target, label: t('nav.budget_goals'), color: '#6366f1' },
                { route: '/service-report', icon: FileText, label: t('nav.service_report'), color: '#06b6d4' },
              ].map((item) => {
                const active = isActive(item.route);
                return (
                  <button key={item.route} onClick={() => go(item.route)} className={`w-full flex items-center gap-4 py-2.5 px-2 rounded-xl transition-all ${active ? 'bg-white/5 shadow-sm' : 'hover:bg-white/5'}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10" style={{ color: active ? item.color : 'rgba(255,255,255,0.7)' }}><item.icon size={16} /></div>
                    <span className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 px-2">
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-3 pl-2">{t('nav.social_system')}</p>
              {[
                { route: '/family-garage', icon: Users, label: t('nav.family_garage'), color: '#6366f1' },
                { route: '/notifications', icon: Bell, label: t('nav.notifications'), color: '#f59e0b' },
                { route: '/settings', icon: Settings, label: t('nav.settings'), color: '#64748b' },
              ].map((item) => {
                const active = isActive(item.route);
                return (
                  <button key={item.route} onClick={() => go(item.route)} className={`w-full flex items-center gap-4 py-2.5 px-2 rounded-xl transition-all ${active ? 'bg-white/5 shadow-sm' : 'hover:bg-white/5'}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10" style={{ color: active ? item.color : 'rgba(255,255,255,0.7)' }}><item.icon size={16} /></div>
                    <span className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-slate-800/40 bg-slate-900/20 space-y-2">
            {/* Dil değiştirici */}
            <LanguageSwitcher variant="compact" className="w-full justify-center" />

            <button
              onClick={toggleDarkMode}
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group overflow-hidden relative"
            >
              <div className="flex items-center gap-3 relative z-10">
                {isDarkMode ? <Moon size={18} className="text-violet-400" /> : <Sun size={18} className="text-amber-400" />}
                <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{t('settings.dark_mode')}</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors z-10 ${isDarkMode ? 'bg-violet-600' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
              </div>
            </button>
          </div>
        </aside>
      )}

      {/* Floating search */}
      {!hideNav && (
        <div className="fixed right-0 z-30 p-4 pointer-events-none top-1/2 -translate-y-1/2 md:top-0 md:translate-y-0">
          <button
            onClick={open}
            style={{
              pointerEvents: 'auto', width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <Search size={16} />
          </button>
        </div>
      )}

      {/* Main */}
      <main className={`flex-1 overflow-y-auto h-screen relative z-10 ${!hideNav ? 'main-content-web' : ''}`} style={{ paddingBottom: hideNav ? 0 : 96 }}>
        <div className={`${hideNav ? "" : "main-content-outer"} w-full mx-auto px-4 sm:px-6 lg:px-12 max-w-[1400px]`} style={{ maxWidth: hideNav ? 'none' : undefined }}>
          {children}
        </div>
      </main>

      {/* ── Full screen menu ──────────────────────────────── */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(4,4,8,0.98)',
            backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            display: 'flex', flexDirection: 'column',
            animation: 'menuSlideIn 0.32s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* ── Ambient light blobs ── */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', width: 500, height: 500, left: -100, top: -150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', width: 380, height: 380, right: -80, top: '30%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', width: 280, height: 280, left: '20%', bottom: '10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 65%)' }} />
            {/* Grid texture */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)' }} />
          </div>

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 22px 0', position: 'relative', zIndex: 2 }}>
            <div style={{ animation: 'fadeSlideRight 0.4s ease both' }}>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, letterSpacing: 3.5, marginBottom: 5, textTransform: 'uppercase' }}>
                {t('nav.quick_access')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #E8C96B, #C9A84C)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(201,168,76,0.35)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#050508" strokeWidth="2.5" strokeLinecap="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" /><rect x="9" y="11" width="14" height="10" rx="2" /><circle cx="12" cy="16" r="1" /></svg>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 2, background: 'linear-gradient(135deg, #F0E6C8, #C9A84C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  CARSYNC PRO
                </p>
                <SyncIndicator variant="compact" className="ml-2" />
              </div>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              style={{
                width: 42, height: 42, borderRadius: 13,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                transition: 'all 0.2s', animation: 'fadeSlideLeft 0.4s ease both',
              }}
            >
              <X size={17} />
            </button>
          </div>

          {/* ── Category filter pills ── */}
          <div style={{ padding: '18px 22px 0', overflowX: 'auto', animation: 'fadeSlideUp 0.4s 0.05s ease both', opacity: 0, animationFillMode: 'forwards' }} className="hide-scrollbar">
            <div style={{ display: 'flex', gap: 7, paddingBottom: 2 }}>
              {[
                { label: t('nav.all'), icon: '◈', active: true },
                { label: 'AI', icon: '✦', active: false },
                { label: t('nav.analytics'), icon: '▦', active: false },
                { label: t('nav.maintenance'), icon: '⬡', active: false },
                { label: t('nav.vehicle'), icon: '◉', active: false },
              ].map((cat) => (
                <div key={cat.label} style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                  background: cat.active ? 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${cat.active ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: cat.active ? '#E8C96B' : 'rgba(255,255,255,0.35)',
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5,
                  cursor: 'default',
                }}>
                  <span style={{ fontSize: 10 }}>{cat.icon}</span>
                  {cat.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Scrollable content ── */}
          <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 140px' }}>

            {/* ── Featured Row: AI Tools ── */}
            <div style={{ marginBottom: 10, animation: 'fadeSlideUp 0.4s 0.08s ease both', opacity: 0, animationFillMode: 'forwards' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                {t('nav.ai_tools')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {[
                  { route: '/car-chat', icon: Sparkles, label: t('nav.car_chat'), sub: t('nav.chat_sub'), color: '#a855f7', grad: 'rgba(168,85,247,' },
                  { route: '/predictive-maintenance', icon: Brain, label: t('nav.predictive_maintenance'), sub: t('nav.ai_sub'), color: '#8b5cf6', grad: 'rgba(139,92,246,' },
                ].map(({ route, icon: Icon, label, sub, color, grad }, idx) => {
                  const active = isActive(route);
                  return (
                    <button
                      key={route}
                      onClick={() => go(route)}
                      style={{
                        background: active
                          ? `linear-gradient(135deg, ${grad}0.22) 0%, ${grad}0.1) 100%)`
                          : `linear-gradient(135deg, ${grad}0.14) 0%, ${grad}0.05) 100%)`,
                        border: `1px solid ${active ? `${color}55` : `${color}28`}`,
                        borderRadius: 20, padding: '18px 16px',
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
                        cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
                        transition: 'all 0.22s',
                        boxShadow: active ? `0 8px 32px ${grad}0.2)` : 'none',
                      }}
                    >
                      {/* Glow top-right */}
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${grad}0.25), transparent 70%)`, pointerEvents: 'none' }} />
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: `linear-gradient(135deg, ${grad}0.3), ${grad}0.12))`,
                        border: `1px solid ${grad}0.35)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 14px ${grad}0.25)`,
                      }}>
                        <Icon size={20} color={color} />
                      </div>
                      <div>
                        <p style={{ color: active ? color : '#E8E6E0', fontSize: 13, fontWeight: 700, marginBottom: 3, fontFamily: 'var(--font-body)', lineHeight: 1.2 }}>{label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 500 }}>{sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Section: AI & Akıllı Özellikler ── */}
            <div style={{ marginBottom: 10, animation: 'fadeSlideUp 0.4s 0.08s ease both', opacity: 0, animationFillMode: 'forwards' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                Yapay Zeka
              </p>
              {/* AI Insights Hero Card */}
              <button
                onClick={() => go('/ai-insights')}
                style={{
                  width: '100%', background: isActive('/ai-insights') ? 'rgba(168,85,247,0.18)' : 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.06))',
                  border: `1px solid ${isActive('/ai-insights') ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.22)'}`,
                  borderRadius: 22, padding: '18px 20px', marginBottom: 9,
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden', transition: 'all 0.22s',
                }}
              >
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.15), transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(99,102,241,0.15))', border: '1px solid rgba(168,85,247,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(168,85,247,0.25)', flexShrink: 0 }}>
                  <Brain size={24} color="#a855f7" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ color: '#d8b4fe', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)' }}>AI İçgörüler</p>
                    <span style={{ background: 'rgba(168,85,247,0.25)', color: '#d8b4fe', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, letterSpacing: 1, textTransform: 'uppercase', border: '1px solid rgba(168,85,247,0.35)' }}>YENİ</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500, lineHeight: 1.4 }}>Proaktif uyarılar, sağlık analizi, 12 aylık bakım takvimi</p>
                </div>
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {[
                  { route: '/predictive-maintenance', icon: Zap, label: t('nav.predictive_maintenance') || 'AI Bakım', sub: 'Tahmine dayalı', color: '#8b5cf6', grad: 'rgba(139,92,246,' },
                  { route: '/car-chat', icon: Sparkles, label: t('nav.car_chat') || 'AI Asistan', sub: 'Araçla sohbet', color: '#a855f7', grad: 'rgba(168,85,247,' },
                ].map(({ route, icon: Icon, label, sub, color, grad }) => {
                  const active = isActive(route);
                  return (
                    <button key={route} onClick={() => go(route)} style={{ background: active ? `linear-gradient(135deg, ${grad}0.18), ${grad}0.07))` : `linear-gradient(135deg, ${grad}0.08), ${grad}0.03))`, border: `1px solid ${active ? `${color}50` : `${color}22`}`, borderRadius: 18, padding: '15px 14px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', textAlign: 'left', transition: 'all 0.22s' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg, ${grad}0.22), ${grad}0.08))`, border: `1px solid ${grad}0.28)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={17} color={color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: active ? color : '#D4D2CC', fontSize: 12, fontWeight: 700, marginBottom: 2, fontFamily: 'var(--font-body)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.27)', fontSize: 10, fontWeight: 500 }}>{sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Section: Hasar & Yakıt ── */}
            <div style={{ marginBottom: 10, animation: 'fadeSlideUp 0.4s 0.12s ease both', opacity: 0, animationFillMode: 'forwards' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                {t('nav.detection_field')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {[
                  { route: '/damage-detection', icon: Scan, label: t('nav.damage_detection'), sub: t('nav.damage_sub'), color: '#ef4444', grad: 'rgba(239,68,68,' },
                  { route: '/fuel-finder', icon: Navigation, label: t('nav.fuel_finder'), sub: t('nav.fuel_sub'), color: '#f59e0b', grad: 'rgba(245,158,11,' },
                ].map(({ route, icon: Icon, label, sub, color, grad }) => {
                  const active = isActive(route);
                  return (
                    <button
                      key={route}
                      onClick={() => go(route)}
                      style={{
                        background: active ? `linear-gradient(135deg, ${grad}0.18), ${grad}0.07))` : `linear-gradient(135deg, ${grad}0.1), ${grad}0.03))`,
                        border: `1px solid ${active ? `${color}50` : `${color}22`}`,
                        borderRadius: 20, padding: '18px 16px',
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
                        cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
                        transition: 'all 0.22s',
                      }}
                    >
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${grad}0.2), transparent 70%)`, pointerEvents: 'none' }} />
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${grad}0.25), ${grad}0.1))`, border: `1px solid ${grad}0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${grad}0.2)` }}>
                        <Icon size={20} color={color} />
                      </div>
                      <div>
                        <p style={{ color: active ? color : '#E8E6E0', fontSize: 13, fontWeight: 700, marginBottom: 3, fontFamily: 'var(--font-body)', lineHeight: 1.2 }}>{label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 500 }}>{sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Section: Araç & Kayıtlar ── */}
            <div style={{ marginBottom: 10, animation: 'fadeSlideUp 0.4s 0.16s ease both', opacity: 0, animationFillMode: 'forwards' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                {t('nav.vehicle_management')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {[
                  { route: '/vehicle-qr', icon: QrCode, label: t('nav.vehicle_qr'), sub: t('nav.qr_sub'), color: '#6366f1', grad: 'rgba(99,102,241,' },
                  { route: '/tires', icon: Disc, label: t('nav.tires'), sub: t('nav.tires_sub'), color: '#f59e0b', grad: 'rgba(245,158,11,' },
                  { route: '/insurance-calendar', icon: Shield, label: t('nav.insurance_calendar'), sub: t('nav.insurance_sub'), color: '#3b82f6', grad: 'rgba(59,130,246,' },
                  { route: '/service-appointment', icon: Calendar, label: t('nav.service_appointment'), sub: t('nav.service_sub'), color: '#8b5cf6', grad: 'rgba(139,92,246,' },
                  { route: '/vehicle-comparison', icon: ArrowRightLeft, label: t('nav.vehicle_comparison'), sub: t('nav.comparison_sub'), color: '#10b981', grad: 'rgba(16,185,129,' },
                  { route: '/trip-planner', icon: Map, label: t('nav.trip_planner'), sub: t('nav.trip_sub'), color: '#10b981', grad: 'rgba(6,182,212,' },
                ].map(({ route, icon: Icon, label, sub, color, grad }) => {
                  const active = isActive(route);
                  return (
                    <button
                      key={route}
                      onClick={() => go(route)}
                      style={{
                        background: active ? `rgba(255,255,255,0.06)` : 'rgba(255,255,255,0.028)',
                        border: `1px solid ${active ? `${color}45` : 'rgba(255,255,255,0.065)'}`,
                        borderRadius: 18, padding: '15px 14px',
                        display: 'flex', alignItems: 'center', gap: 13,
                        cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
                        transition: 'all 0.22s',
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: `linear-gradient(135deg, ${grad}0.22), ${grad}0.08))`, border: `1px solid ${grad}0.28)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${grad}0.18)` }}>
                        <Icon size={18} color={color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: active ? color : '#D4D2CC', fontSize: 12, fontWeight: 700, marginBottom: 2, fontFamily: 'var(--font-body)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.27)', fontSize: 10, fontWeight: 500 }}>{sub}</p>
                      </div>
                      {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Section: Finans & Raporlar ── */}
            <div style={{ marginBottom: 10, animation: 'fadeSlideUp 0.4s 0.2s ease both', opacity: 0, animationFillMode: 'forwards' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                {t('nav.finance_reports')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {[
                  { route: '/budget-goals', icon: Target, label: t('nav.budget_goals'), sub: t('nav.budget_sub'), color: '#6366f1', grad: 'rgba(99,102,241,' },
                  { route: '/service-report', icon: FileText, label: t('nav.service_report'), sub: t('nav.report_sub'), color: '#06b6d4', grad: 'rgba(6,182,212,' },
                ].map(({ route, icon: Icon, label, sub, color, grad }) => {
                  const active = isActive(route);
                  return (
                    <button
                      key={route}
                      onClick={() => go(route)}
                      style={{
                        background: active ? `rgba(255,255,255,0.06)` : 'rgba(255,255,255,0.028)',
                        border: `1px solid ${active ? `${color}45` : 'rgba(255,255,255,0.065)'}`,
                        borderRadius: 18, padding: '15px 14px',
                        display: 'flex', alignItems: 'center', gap: 13,
                        cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
                        transition: 'all 0.22s',
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: `linear-gradient(135deg, ${grad}0.22), ${grad}0.08))`, border: `1px solid ${grad}0.28)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${grad}0.18)` }}>
                        <Icon size={18} color={color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: active ? color : '#D4D2CC', fontSize: 12, fontWeight: 700, marginBottom: 2, fontFamily: 'var(--font-body)', lineHeight: 1.2 }}>{label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.27)', fontSize: 10, fontWeight: 500 }}>{sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Section: Sosyal & Ayarlar ── */}
            <div style={{ animation: 'fadeSlideUp 0.4s 0.24s ease both', opacity: 0, animationFillMode: 'forwards' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                {t('nav.social_system')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
                {[
                  { route: '/family-garage', icon: Users, label: t('nav.family_garage'), color: '#6366f1', grad: 'rgba(99,102,241,' },
                  { route: '/notifications', icon: Bell, label: t('nav.notifications'), color: '#f59e0b', grad: 'rgba(245,158,11,' },
                  { route: '/settings', icon: Settings, label: t('nav.settings'), color: '#64748b', grad: 'rgba(100,116,139,' },
                ].map(({ route, icon: Icon, label, color, grad }) => {
                  const active = isActive(route);
                  return (
                    <button
                      key={route}
                      onClick={() => go(route)}
                      style={{
                        background: active ? `${grad}0.1)` : 'rgba(255,255,255,0.028)',
                        border: `1px solid ${active ? `${color}40` : 'rgba(255,255,255,0.065)'}`,
                        borderRadius: 18, padding: '16px 10px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                        cursor: 'pointer', transition: 'all 0.22s',
                      }}
                    >
                      <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg, ${grad}0.22), ${grad}0.08))`, border: `1px solid ${grad}0.28)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 12px ${grad}0.2)` }}>
                        <Icon size={19} color={color} />
                      </div>
                      <p style={{ color: active ? color : 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)', lineHeight: 1.2, textAlign: 'center' }}>{label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Section: Tema ── */}
            <div style={{ marginTop: 24, paddingBottom: 20, animation: 'fadeSlideUp 0.4s 0.28s ease both', opacity: 0, animationFillMode: 'forwards' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => go('/theme')}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.028)',
                    border: '1px solid rgba(255,255,255,0.065)',
                    borderRadius: 18, padding: '16px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    cursor: 'pointer', transition: 'all 0.22s',
                  }}
                >
                  <Zap size={18} color="#06b6d4" />
                  <span style={{ color: '#E8E6E0', fontSize: 13, fontWeight: 600 }}>{t('nav.theme')}</span>
                </button>
                <button
                  onClick={toggleDarkMode}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.028)',
                    border: '1px solid rgba(255,255,255,0.065)',
                    borderRadius: 18, padding: '16px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', transition: 'all 0.22s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: isDarkMode ? 'rgba(168,85,247,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${isDarkMode ? 'rgba(168,85,247,0.3)' : 'rgba(245,158,11,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isDarkMode ? <Moon size={18} color="#a855f7" /> : <Sun size={18} color="#f59e0b" />}
                    </div>
                    <span style={{ color: '#E8E6E0', fontSize: 13, fontWeight: 600 }}>{t('settings.dark_mode')}</span>
                  </div>
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: isDarkMode ? '#a855f7' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.3s' }}>
                    <div style={{ position: 'absolute', top: 2, left: isDarkMode ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)' }} />
                  </div>
                </button>
              </div>

              {/* Dil değiştirici */}
              <div style={{ marginTop: 8 }}>
                <LanguageSwitcher variant="compact" className="justify-center" />
              </div>
            </div>

          </div>

          {/* ── Bottom fade ── */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 150, background: 'linear-gradient(to top, rgba(4,4,8,0.98) 30%, transparent)', pointerEvents: 'none' }} />
        </div>
      )}

      {/* ── Bottom Nav ─────────────────────────────────────── */}
      {!hideNav && (
        <nav
          className="hide-on-desktop"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
            background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,8,0.97) 28%)',
            backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          }}
        >
          {/* Gold accent line */}
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.25) 25%, rgba(201,168,76,0.5) 50%, rgba(201,168,76,0.25) 75%, transparent)',
          }} />

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            maxWidth: 500, margin: '0 auto',
            padding: '4px 8px',
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
            height: 76,
          }}>
            {/* Left 2 */}
            <div className="flex flex-1 justify-around">
              {NAV.slice(0, 2).map(({ path, icon: Icon, label }) => {
                const active = isActive(path);
                return (
                  <button
                    key={path}
                    onClick={() => go(path)}
                    className={`flex flex-col items-center justify-center gap-1 h-12 px-3 rounded-2xl transition-all duration-300 ${active ? 'bg-gold/15 border border-gold/20' : 'bg-transparent border-transparent'}`}
                    style={{
                      animation: navBounce === path ? 'navPop 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                    }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.5 : 2}
                      color={active ? 'var(--gold)' : 'var(--text-muted)'}
                    />
                    <span style={{
                      fontSize: 8, fontWeight: 800, letterSpacing: '0.05em',
                      color: active ? 'var(--gold)' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Center — Floating Add Button */}
            <div className="relative flex items-center justify-center w-20">
              <button
                onClick={() => navigate('/add-record')}
                className="absolute -top-10 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_8px_25px_rgba(59,130,246,0.5)] border-4 border-[var(--bg-card)] active:scale-90 transition-all duration-300 z-50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                <Navigation size={28} className="text-white rotate-45" />
              </button>
              <button
                onClick={() => go('/')}
                className={`flex flex-col items-center justify-center gap-1 h-12 px-3 rounded-2xl transition-all duration-300 mt-2 ${isActive('/') ? 'bg-gold/15 border border-gold/20' : 'bg-transparent'}`}
              >
                <Car size={18} color={isActive('/') ? 'var(--gold)' : 'var(--text-muted)'} strokeWidth={2.5} />
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-muted">{t('nav.garage')}</span>
              </button>
            </div>

            {/* Right Group (Doc + Menu) */}
            <div className="flex flex-1 justify-around">
              <button
                onClick={() => go('/documents')}
                className={`flex flex-col items-center justify-center gap-1 h-12 px-3 rounded-2xl transition-all duration-300 ${isActive('/documents') ? 'bg-gold/15 border border-gold/20' : 'bg-transparent'}`}
                style={{
                  animation: navBounce === '/documents' ? 'navPop 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                }}
              >
                <FileStack size={20} color={isActive('/documents') ? 'var(--gold)' : 'var(--text-muted)'} strokeWidth={2} />
                <span style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: '0.05em',
                  color: isActive('/documents') ? 'var(--gold)' : 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}>
                  {t('nav.documents')}
                </span>
              </button>

              <button
                onClick={() => setIsMenuOpen(v => !v)}
                className={`flex flex-col items-center justify-center gap-1 h-12 px-3 rounded-2xl transition-all duration-300 ${isMenuOpen ? 'bg-gold/15 border border-gold/20' : 'bg-transparent'}`}
              >
                <div style={{ width: 18, height: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      display: 'block', height: 1.5, borderRadius: 2,
                      background: isMenuOpen ? 'var(--gold)' : 'var(--text-muted)',
                      transformOrigin: 'center',
                      transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: isMenuOpen
                        ? i === 0 ? 'translateY(5.25px) rotate(45deg)'
                          : i === 2 ? 'translateY(-5.25px) rotate(-45deg)'
                            : 'scaleX(0)'
                        : 'none',
                      opacity: isMenuOpen && i === 1 ? 0 : 1,
                    }} />
                  ))}
                </div>
                <span style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: '0.05em',
                  color: isMenuOpen ? 'var(--gold)' : 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}>
                  {isMenuOpen ? t('nav.close') : t('nav.menu')}
                </span>
              </button>
            </div>
          </div>
        </nav>
      )}


      <style>{`
        @keyframes breathe {
          0%,100% { transform: scale(1);    opacity: 0.35; }
          50%      { transform: scale(1.14); opacity: 0.65; }
        }
        @keyframes navPop {
          0%   { transform: translateY(0) scale(1); }
          40%  { transform: translateY(-10px) scale(1.2); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes menuSlideIn {
          0%   { opacity: 0; transform: scale(0.97) translateY(8px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes fadeSlideUp {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeSlideRight {
          0%   { opacity: 0; transform: translateX(-12px); }
          100% { opacity: 1; transform: translateX(0);     }
        }
        @keyframes fadeSlideLeft {
          0%   { opacity: 0; transform: translateX(12px); }
          100% { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
    </div>
  );
};
