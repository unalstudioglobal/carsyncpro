/**
 * LanguageSwitcher.tsx
 * Kompakt dil değiştirici — Layout hamburger menüsünde ve Settings'te kullanılır.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { toast } from '../services/toast';

interface Props {
  variant?: 'compact' | 'full';   // compact: ikon+badge, full: açıklama satırı
  className?: string;
}

const LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export const LanguageSwitcher: React.FC<Props> = ({ variant = 'compact', className = '' }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === i18n.language.split('-')[0]) ?? LANGUAGES[0];

  const change = (code: string) => {
    if (code === current.code) { setOpen(false); return; }
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    toast.success(code === 'tr' ? 'Dil değiştirildi — Türkçe' : 'Language changed — English');
    setOpen(false);
  };

  if (variant === 'full') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/40 border border-slate-700/30 transition hover:bg-slate-700/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center">
              <Globe size={16} className="text-slate-400" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-semibold">Dil / Language</p>
              <p className="text-slate-500 text-xs">{current.flag} {current.label}</p>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center transition-transform ${open ? 'rotate-180' : ''}`}>
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
              <path d="M1 1L4 4L7 1" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => change(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition hover:bg-white/5 ${lang.code === current.code ? 'bg-white/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-white text-sm font-medium">{lang.label}</span>
                </div>
                {lang.code === current.code && <Check size={14} className="text-indigo-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Compact variant — küçük toggle, menüde kullanılır
  return (
    <div className={`flex items-center gap-1 bg-white/5 rounded-full p-0.5 border border-white/10 ${className}`}>
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => change(lang.code)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
            lang.code === current.code
              ? 'bg-white/15 text-white'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <span>{lang.flag}</span>
          <span>{lang.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
};
