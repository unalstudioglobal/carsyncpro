import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Palette, Type, Layout, Sliders, RotateCcw,
  Check, Moon, Zap, Smartphone, Eye, Grid3x3, List, AlignJustify,
  Minus, Square, Circle, ChevronRight, Sparkles, Monitor,
  ToggleLeft, ToggleRight, Info
} from 'lucide-react';
import {
  useTheme, ThemeConfig,
  ACCENT_VARS, THEME_VARS, ColorAccent, AppTheme, FontSize, CardStyle, DashLayout
} from '../context/ThemeContext';

// ─── Section wrapper ─────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({
  title, icon: Icon, children
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center">
        <Icon size={14} className="text-slate-400" />
      </div>
      <p className="text-white font-bold text-sm">{title}</p>
    </div>
    {children}
  </div>
);

// ─── Toggle Row ──────────────────────────────────────────────────────────────

const ToggleRow: React.FC<{
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accentColor: string;
}> = ({ label, description, value, onChange, accentColor }) => (
  <button
    onClick={() => onChange(!value)}
    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/40 border border-slate-700/30 transition-all"
  >
    <div className="text-left">
      <p className="text-white text-sm font-medium">{label}</p>
      {description && <p className="text-slate-500 text-xs mt-0.5">{description}</p>}
    </div>
    <div
      className="w-11 h-6 rounded-full transition-all relative flex-shrink-0 ml-3"
      style={{ background: value ? accentColor : '#334155' }}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </div>
  </button>
);

// ─── Live Preview Card ───────────────────────────────────────────────────────

const PreviewCard: React.FC<{ t: any }> = ({ t }) => {
  const { config, accent, theme } = useTheme();

  const borderRadius = config.cardStyle === 'rounded' ? 20 : config.cardStyle === 'sharp' ? 8 : 16;

  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius,
        padding: 16,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: borderRadius * 0.6,
            background: accent.bg, border: `1px solid ${accent.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: accent.primary }} />
          </div>
          <div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 13 }}>Toyota Corolla</div>
            <div style={{ color: theme.subtext, fontSize: 11 }}>34 ABC 123</div>
          </div>
        </div>
        <div style={{
          background: accent.bg, border: `1px solid ${accent.border}`,
          borderRadius: 10, padding: '4px 10px',
          color: accent.primary, fontSize: 11, fontWeight: 700,
        }}>
          87/100
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[['125,400', 'km'], ['₺2,450', t('theme.prev_this_month')], ['12', t('theme.prev_record')]].map(([val, label]) => (
          <div key={label} style={{
            background: theme.surface2, borderRadius: borderRadius * 0.5,
            padding: '8px 6px', textAlign: 'center',
          }}>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 13 }}>{val}</div>
            <div style={{ color: theme.subtext, fontSize: 10 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Accent button */}
      <div style={{
        marginTop: 10, background: accent.primary,
        borderRadius: borderRadius * 0.5, padding: '8px 12px',
        textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 12,
        boxShadow: `0 4px 14px ${accent.glow}`,
        transition: 'all 0.3s',
      }}>
        {t('theme.prev_add')}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const ThemeCustomizer: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { config, update, reset, accent } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const accentOptions: { key: ColorAccent; label: string }[] = [
    { key: 'indigo',  label: t('theme.acc_indigo')  },
    { key: 'blue',    label: t('theme.acc_blue')  },
    { key: 'violet',  label: t('theme.acc_violet')  },
    { key: 'emerald', label: t('theme.acc_emerald') },
    { key: 'rose',    label: t('theme.acc_rose') },
    { key: 'amber',   label: t('theme.acc_amber') },
    { key: 'cyan',    label: t('theme.acc_cyan') },
  ];

  const themeOptions: { key: AppTheme; label: string; desc: string }[] = [
    { key: 'dark',     label: t('theme.thm_dark'), desc: t('theme.thm_dark_desc') },
    { key: 'midnight', label: t('theme.thm_midnight'), desc: t('theme.thm_midnight_desc') },
    { key: 'slate',    label: t('theme.thm_slate'),   desc: t('theme.thm_slate_desc') },
    { key: 'carbon',   label: t('theme.thm_carbon'),  desc: t('theme.thm_carbon_desc') },
  ];

  const fontOptions: { key: FontSize; label: string; preview: string }[] = [
    { key: 'small',  label: t('theme.font_small'),   preview: 'Aa' },
    { key: 'medium', label: t('theme.font_medium'),  preview: 'Aa' },
    { key: 'large',  label: t('theme.font_large'),   preview: 'Aa' },
  ];

  const cardStyleOptions: { key: CardStyle; label: string; icon: React.ElementType }[] = [
    { key: 'rounded', label: t('theme.card_rounded'), icon: Circle  },
    { key: 'sharp',   label: t('theme.card_sharp'),  icon: Square  },
    { key: 'minimal', label: t('theme.card_minimal'), icon: Minus   },
  ];

  const dashLayoutOptions: { key: DashLayout; label: string; icon: React.ElementType }[] = [
    { key: 'grid',    label: t('theme.lay_grid'),    icon: Grid3x3     },
    { key: 'list',    label: t('theme.lay_list'),   icon: List        },
    { key: 'compact', label: t('theme.lay_compact'), icon: AlignJustify },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0f1e' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4" style={{ background: 'rgba(10,15,30,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <ChevronLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{t('theme.title')}</h1>
            <p className="text-slate-500 text-xs">{t('theme.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/30 text-slate-400 text-xs hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all"
          >
            <RotateCcw size={12} />
            {t('theme.reset')}
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-7">

        {/* Live Preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Eye size={14} className="text-slate-400" />
            <p className="text-white font-bold text-sm">{t('theme.preview')}</p>
          </div>
          <PreviewCard t={t} />
        </div>

        {/* ── App Theme ── */}
        <Section title={t('theme.sec_theme')} icon={Moon}>
          <div className="grid grid-cols-2 gap-2">
            {themeOptions.map(({ key, label, desc }) => {
              const thm = THEME_VARS[key];
              const isActive = config.appTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => update({ appTheme: key })}
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all p-3 text-left ${
                    isActive ? 'border-slate-300/50 scale-[0.97]' : 'border-slate-700/30'
                  }`}
                  style={{ background: thm.bg }}
                >
                  {/* Mini card preview */}
                  <div
                    className="w-full h-10 rounded-lg mb-2.5 flex items-center px-2 gap-1.5"
                    style={{ background: thm.surface, border: `1px solid ${thm.border}` }}
                  >
                    <div className="w-5 h-5 rounded" style={{ background: accent.primary }} />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 rounded-full w-3/4" style={{ background: thm.text, opacity: 0.7 }} />
                      <div className="h-1 rounded-full w-1/2" style={{ background: thm.subtext, opacity: 0.5 }} />
                    </div>
                  </div>
                  <p className="text-white text-xs font-bold">{label}</p>
                  <p className="text-slate-500 text-[10px]">{desc}</p>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <Check size={11} className="text-slate-900" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Accent Color ── */}
        <Section title={t('theme.sec_accent')} icon={Palette}>
          <div className="flex gap-2.5 flex-wrap">
            {accentOptions.map(({ key, label }) => {
              const acc = ACCENT_VARS[key];
              const isActive = config.colorAccent === key;
              return (
                <button
                  key={key}
                  onClick={() => update({ colorAccent: key })}
                  className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? 'scale-110' : 'opacity-70 hover:opacity-90'}`}
                >
                  <div
                    className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{
                      background: acc.primary,
                      boxShadow: isActive ? `0 0 16px ${acc.glow}` : 'none',
                    }}
                  >
                    {isActive && <Check size={16} className="text-white" />}
                  </div>
                  <span className="text-[10px] text-slate-400">{label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Font Size ── */}
        <Section title={t('theme.sec_font')} icon={Type}>
          <div className="flex gap-2">
            {fontOptions.map(({ key, label, preview }) => (
              <button
                key={key}
                onClick={() => update({ fontSize: key })}
                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                  config.fontSize === key
                    ? 'border-slate-300/40 bg-slate-700/40'
                    : 'border-slate-700/30 bg-slate-800/30'
                }`}
              >
                <span
                  className="font-bold text-white"
                  style={{ fontSize: key === 'small' ? 18 : key === 'medium' ? 24 : 30 }}
                >
                  {preview}
                </span>
                <span className="text-slate-400 text-xs">{label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ── Card Style ── */}
        <Section title={t('theme.sec_card')} icon={Layout}>
          <div className="flex gap-2">
            {cardStyleOptions.map(({ key, label, icon: Icon }) => {
              const radius = key === 'rounded' ? 20 : key === 'sharp' ? 4 : 12;
              return (
                <button
                  key={key}
                  onClick={() => update({ cardStyle: key })}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 border-2 transition-all ${
                    config.cardStyle === key
                      ? 'border-slate-300/40 bg-slate-700/40'
                      : 'border-slate-700/30 bg-slate-800/30'
                  }`}
                  style={{ borderRadius: radius }}
                >
                  <div
                    className="w-10 h-6 bg-slate-600"
                    style={{ borderRadius: radius * 0.6 }}
                  />
                  <span className="text-slate-400 text-xs">{label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Dashboard Layout ── */}
        <Section title={t('theme.sec_layout')} icon={Grid3x3}>
          <div className="flex gap-2">
            {dashLayoutOptions.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => update({ dashLayout: key })}
                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                  config.dashLayout === key
                    ? 'border-slate-300/40 bg-slate-700/40'
                    : 'border-slate-700/30 bg-slate-800/30'
                }`}
              >
                <Icon size={20} className={config.dashLayout === key ? 'text-white' : 'text-slate-500'} />
                <span className="text-slate-400 text-xs">{label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ── Display Options ── */}
        <Section title={t('theme.sec_display')} icon={Monitor}>
          <div className="space-y-2">
            <ToggleRow
              label={t('theme.opt_health')}
              description={t('theme.opt_health_desc')}
              value={config.showHealthRing}
              onChange={v => update({ showHealthRing: v })}
              accentColor={accent.primary}
            />
            <ToggleRow
              label={t('theme.opt_cost')}
              description={t('theme.opt_cost_desc')}
              value={config.showCostTrend}
              onChange={v => update({ showCostTrend: v })}
              accentColor={accent.primary}
            />
            <ToggleRow
              label={t('theme.opt_header')}
              description={t('theme.opt_header_desc')}
              value={config.compactHeader}
              onChange={v => update({ compactHeader: v })}
              accentColor={accent.primary}
            />
          </div>
        </Section>

        {/* ── Performance ── */}
        <Section title={t('theme.sec_perf')} icon={Zap}>
          <div className="space-y-2">
            <ToggleRow
              label={t('theme.opt_anim')}
              description={t('theme.opt_anim_desc')}
              value={config.animationsEnabled}
              onChange={v => update({ animationsEnabled: v })}
              accentColor={accent.primary}
            />
            <ToggleRow
              label={t('theme.opt_haptic')}
              description={t('theme.opt_haptic_desc')}
              value={config.hapticFeedback}
              onChange={v => {
                update({ hapticFeedback: v });
                if (v && navigator.vibrate) navigator.vibrate(30);
              }}
              accentColor={accent.primary}
            />
          </div>
        </Section>

        {/* Current config summary */}
        <div className="rounded-2xl bg-slate-800/30 border border-slate-700/30 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Info size={13} className="text-slate-500" />
            <p className="text-slate-400 text-xs font-semibold">{t('theme.active_settings')}</p>
          </div>
          {[
            [t('theme.lbl_theme'),         THEME_VARS[config.appTheme].label ?? config.appTheme],
            [t('theme.lbl_accent'),  config.colorAccent],
            [t('theme.lbl_font'),  config.fontSize === 'small' ? t('theme.font_small') : config.fontSize === 'medium' ? t('theme.font_medium') : t('theme.font_large')],
            [t('theme.lbl_card'),   config.cardStyle === 'rounded' ? t('theme.card_rounded') : config.cardStyle === 'sharp' ? t('theme.card_sharp') : t('theme.card_minimal')],
            [t('theme.lbl_dash'),    config.dashLayout === 'grid' ? t('theme.lay_grid') : config.dashLayout === 'list' ? t('theme.lay_list') : t('theme.lay_compact')],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-300 font-semibold capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset confirm overlay */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                <RotateCcw size={24} className="text-red-400" />
              </div>
              <p className="text-white font-bold text-lg">{t('theme.reset_title')}</p>
              <p className="text-slate-500 text-sm mt-1">{t('theme.reset_desc')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 font-semibold text-sm"
              >
                {t('theme.reset_cancel')}
              </button>
              <button
                onClick={() => { reset(); setShowResetConfirm(false); }}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm"
              >
                {t('theme.reset_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
