/**
 * SyncIndicator.tsx
 * ─────────────────────────────────────────────────────────────
 * DataContext'in sync durumunu kullanıcıya gösterir.
 * Layout'un sağ üst köşesinde ya da inline kullanılabilir.
 *
 * Durumlar:
 *   live    → yeşil nokta (canlı)
 *   offline → turuncu uyarı
 *   loading → dönen halka
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';

interface Props {
  /** compact = sadece ikon+nokta; full = açıklama metni de */
  variant?: 'compact' | 'full';
  className?: string;
}

export const SyncIndicator: React.FC<Props> = ({ variant = 'compact', className = '' }) => {
  const { syncStatus, synced, loading, refetch } = useData();
  const [showTooltip, setShowTooltip] = useState(false);
  const [retrying,    setRetrying]    = useState(false);

  // Genel durum: en kötü kanalı baz al
  const overallStatus = (() => {
    const statuses = Object.values(syncStatus);
    if (statuses.some(s => s === 'loading')) return 'loading';
    if (statuses.every(s => s === 'live'))   return 'live';
    if (statuses.some(s => s === 'offline')) return 'offline';
    return 'idle';
  })();

  const handleRetry = async () => {
    setRetrying(true);
    await refetch();
    setTimeout(() => setRetrying(false), 1500);
  };

  // live ise gösterme (minimal UI)
  if (overallStatus === 'live' && variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`} title="Gerçek zamanlı senkronize">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>
    );
  }

  if (overallStatus === 'loading' || loading) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <RefreshCw size={11} className="text-blue-400 animate-spin" />
        {variant === 'full' && <span className="text-[10px] text-blue-400 font-medium">Yükleniyor…</span>}
      </div>
    );
  }

  if (overallStatus === 'offline') {
    return (
      <div className={`relative flex items-center gap-1.5 ${className}`}>
        <button
          onClick={() => variant === 'compact' ? setShowTooltip(!showTooltip) : handleRetry()}
          className="flex items-center gap-1.5 group"
        >
          <CloudOff size={13} className="text-amber-400" />
          {variant === 'full' && (
            <span className="text-[10px] text-amber-400 font-medium">Çevrimdışı</span>
          )}
        </button>

        {variant === 'full' && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="ml-1 text-[10px] text-blue-400 underline font-medium disabled:opacity-50"
          >
            {retrying ? 'Deneniyor…' : 'Yeniden dene'}
          </button>
        )}

        {/* Compact tooltip */}
        {variant === 'compact' && showTooltip && (
          <div className="absolute right-0 top-full mt-2 z-50 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white whitespace-nowrap shadow-xl">
            <p className="font-bold text-amber-400 mb-1">Çevrimdışı mod</p>
            <p className="text-slate-400">Önbellek kullanılıyor</p>
            <button
              onClick={handleRetry}
              className="mt-1.5 text-blue-400 underline block"
            >
              {retrying ? 'Deneniyor…' : 'Yeniden bağlan'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // idle veya live+full
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      {variant === 'full' && <span className="text-[10px] text-emerald-400 font-medium">Canlı</span>}
    </div>
  );
};
