/**
 * ThemeContext.tsx
 * ─────────────────────────────────────────────────
 * Uygulama genelinde tema ve özelleştirme yönetimi.
 * Tüm tercihler localStorage'a kaydedilir.
 * ─────────────────────────────────────────────────
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSetting, saveSetting } from '../services/settingsService';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ColorAccent = 'indigo' | 'blue' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'teal' | 'orange' | 'pink';
export type FontSize = 'small' | 'medium' | 'large';
export type CardStyle = 'rounded' | 'sharp' | 'minimal';
export type DashLayout = 'grid' | 'list' | 'compact';
export type AppTheme = 'dark' | 'midnight' | 'slate' | 'carbon' | 'light' | 'ocean';

export interface ThemeConfig {
  appTheme: AppTheme;
  colorAccent: ColorAccent;
  fontSize: FontSize;
  cardStyle: CardStyle;
  dashLayout: DashLayout;
  showHealthRing: boolean;
  showCostTrend: boolean;
  compactHeader: boolean;
  animationsEnabled: boolean;
  hapticFeedback: boolean;
}

const DEFAULT_CONFIG: ThemeConfig = {
  appTheme: 'dark',
  colorAccent: 'indigo',
  fontSize: 'medium',
  cardStyle: 'rounded',
  dashLayout: 'grid',
  showHealthRing: true,
  showCostTrend: true,
  compactHeader: false,
  animationsEnabled: true,
  hapticFeedback: true,
};

// ─── Theme CSS Variables ─────────────────────────────────────────────────────

export const ACCENT_VARS: Record<ColorAccent, {
  primary: string; light: string; bg: string; border: string; glow: string; hex: string;
}> = {
  indigo:  { primary: '#6366f1', light: '#818cf8', bg: 'rgba(99,102,241,0.1)',   border: 'rgba(99,102,241,0.25)',  glow: 'rgba(99,102,241,0.3)',  hex: '#6366f1' },
  blue:    { primary: '#3b82f6', light: '#60a5fa', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)',  glow: 'rgba(59,130,246,0.3)',  hex: '#3b82f6' },
  violet:  { primary: '#8b5cf6', light: '#a78bfa', bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.25)',  glow: 'rgba(139,92,246,0.3)',  hex: '#8b5cf6' },
  emerald: { primary: '#10b981', light: '#34d399', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.25)',  glow: 'rgba(16,185,129,0.3)',  hex: '#10b981' },
  rose:    { primary: '#f43f5e', light: '#fb7185', bg: 'rgba(244,63,94,0.1)',    border: 'rgba(244,63,94,0.25)',   glow: 'rgba(244,63,94,0.3)',   hex: '#f43f5e' },
  amber:   { primary: '#f59e0b', light: '#fbbf24', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)',  glow: 'rgba(245,158,11,0.3)',  hex: '#f59e0b' },
  cyan:    { primary: '#06b6d4', light: '#22d3ee', bg: 'rgba(6,182,212,0.1)',    border: 'rgba(6,182,212,0.25)',   glow: 'rgba(6,182,212,0.3)',   hex: '#06b6d4' },
  teal:    { primary: '#14b8a6', light: '#2dd4bf', bg: 'rgba(20,184,166,0.1)',   border: 'rgba(20,184,166,0.25)',  glow: 'rgba(20,184,166,0.3)',  hex: '#14b8a6' },
  orange:  { primary: '#f97316', light: '#fb923c', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.25)',  glow: 'rgba(249,115,22,0.3)',  hex: '#f97316' },
  pink:    { primary: '#ec4899', light: '#f472b6', bg: 'rgba(236,72,153,0.1)',   border: 'rgba(236,72,153,0.25)',  glow: 'rgba(236,72,153,0.3)',  hex: '#ec4899' },
};

export const THEME_VARS: Record<AppTheme, {
  bg: string; surface: string; surface2: string;
  border: string; text: string; subtext: string; label: string;
}> = {
  dark: {
    bg: '#0a0f1e', surface: '#1e293b', surface2: '#0f172a',
    border: '#334155', text: '#f8fafc', subtext: '#94a3b8', label: 'Gece Mavisi',
  },
  midnight: {
    bg: '#020617', surface: '#0f172a', surface2: '#020617',
    border: '#1e293b', text: '#f1f5f9', subtext: '#64748b', label: 'Gece Yarısı',
  },
  slate: {
    bg: '#0f172a', surface: '#1e293b', surface2: '#0f172a',
    border: '#475569', text: '#ffffff', subtext: '#94a3b8', label: 'Gri-Mavi',
  },
  carbon: {
    bg: '#0a0a0a', surface: '#18181b', surface2: '#09090b',
    border: '#27272a', text: '#fafafa', subtext: '#71717a', label: 'Karbon',
  },
  light: {
    bg: '#f8fafc', surface: '#ffffff', surface2: '#f1f5f9',
    border: '#e2e8f0', text: '#0f172a', subtext: '#64748b', label: 'Açık',
  },
  ocean: {
    bg: '#0c1a2e', surface: '#0f2744', surface2: '#091528',
    border: '#1e3a5f', text: '#e0f2fe', subtext: '#7dd3fc', label: 'Okyanus',
  },
};

export const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '13px', medium: '15px', large: '17px',
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  config: ThemeConfig;
  update: (partial: Partial<ThemeConfig>) => void;
  reset: () => void;
  accent: typeof ACCENT_VARS[ColorAccent];
  theme: typeof THEME_VARS[AppTheme];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  config: DEFAULT_CONFIG,
  update: () => { },
  reset: () => { },
  accent: ACCENT_VARS.indigo,
  theme: THEME_VARS.dark,
  isDarkMode: false,
  toggleDarkMode: () => { },
});

const loadConfig = (): ThemeConfig => {
  const saved = getSetting<Partial<ThemeConfig>>('themeConfig', {});
  return { ...DEFAULT_CONFIG, ...saved };
};

const applyCSS = (config: ThemeConfig) => {
  const root = document.documentElement;
  const acc = ACCENT_VARS[config.colorAccent];
  const thm = THEME_VARS[config.appTheme];

  root.style.setProperty('--accent', acc.primary);
  root.style.setProperty('--accent-light', acc.light);
  root.style.setProperty('--accent-bg', acc.bg);
  root.style.setProperty('--accent-border', acc.border);
  root.style.setProperty('--accent-glow', acc.glow);
  root.style.setProperty('--bg', thm.bg);
  root.style.setProperty('--bg-void', thm.bg);
  root.style.setProperty('--surface', thm.surface);
  root.style.setProperty('--surface2', thm.surface2);
  root.style.setProperty('--border', thm.border);
  root.style.setProperty('--text', thm.text);
  root.style.setProperty('--text-primary', thm.text);
  root.style.setProperty('--subtext', thm.subtext);
  root.style.setProperty('--font-size-base', FONT_SIZE_MAP[config.fontSize]);

  document.body.style.fontSize = FONT_SIZE_MAP[config.fontSize];
  document.body.style.background = thm.bg;
  document.body.style.color = thm.text;

  // Açık tema için dark sınıfını kaldır, diğerleri için ekle
  if (config.appTheme === 'light') {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ThemeConfig>(loadConfig);

  const isDarkMode = config.appTheme !== 'light';

  const toggleDarkMode = useCallback(() => {
    setConfig(prev => {
      const nextTheme = prev.appTheme === 'light' ? 'dark' : 'light';
      const next = { ...prev, appTheme: nextTheme as AppTheme };
      saveSetting('themeConfig', next);
      return next;
    });
  }, []);

  useEffect(() => {
    applyCSS(config);
  }, [config]);

  const update = useCallback((partial: Partial<ThemeConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...partial };
      saveSetting('themeConfig', next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    saveSetting('themeConfig', DEFAULT_CONFIG);
    setConfig(DEFAULT_CONFIG);
  }, []);

  return (
    <ThemeContext.Provider value={{
      config,
      update,
      reset,
      accent: ACCENT_VARS[config.colorAccent],
      theme: THEME_VARS[config.appTheme],
      isDarkMode,
      toggleDarkMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
