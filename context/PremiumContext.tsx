/**
 * PremiumContext.tsx
 * -------------------------------------------------
 * Uygulama genelinde tek bir premium kaynak noktası.
 * Artık hiçbir bileşen doğrudan localStorage'a bakmamalı —
 * bunun yerine `usePremium()` hook'u kullanılmalı.
 * -------------------------------------------------
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  fetchPremiumProfile,
  activatePremium,
  cancelPremium,
  clearPremiumCache,
  PremiumProfile,
} from '../services/premiumService';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// ─── Context Tipi ─────────────────────────────────────────────────────────────

interface PremiumContextValue {
  isPremium: boolean;
  profile: PremiumProfile | null;
  loading: boolean;
  /** Premium aktif et (demo/dev için) */
  activate: (plan: 'monthly' | 'yearly') => Promise<void>;
  /** Premium iptal et */
  cancel: () => Promise<void>;
  /** Durumu yeniden Firestore'dan yükle */
  refresh: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue>({
  isPremium: false,
  profile: null,
  loading: true,
  activate: async () => {},
  cancel: async () => {},
  refresh: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<PremiumProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await fetchPremiumProfile();
      setProfile(p);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth değişince (login/logout) yeniden yükle
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        load();
      } else {
        clearPremiumCache();
        setProfile(null);
        setLoading(false);
      }
    });
    return unsub;
  }, [load]);

  const activate = async (plan: 'monthly' | 'yearly') => {
    await activatePremium(plan);
    await load();
  };

  const cancel = async () => {
    await cancelPremium();
    await load();
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium: profile?.isPremium ?? false,
        profile,
        loading,
        activate,
        cancel,
        refresh: load,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const usePremium = () => useContext(PremiumContext);
