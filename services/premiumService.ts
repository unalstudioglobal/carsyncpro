/**
 * premiumService.ts
 * -------------------------------------------------
 * Premium durumunun tek gerçek kaynağı burasıdır.
 *
 * Güvenlik katmanları (düşükten yükseğe):
 *   1. localStorage cache  — hızlı, bypass edilebilir (UI hint için)
 *   2. Firestore           — kullanıcı profili, auth rule korumalı
 *   3. Firebase Functions  — (production'da) ödeme sağlayıcısı webhook'u
 *
 * Client-side'da tam güvenlik mümkün değildir; asıl güvenlik
 * Firestore Security Rules + backend webhook ile sağlanır.
 * Bu dosya o altyapıyı hazırlar.
 * -------------------------------------------------
 */

import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs, limit, serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { getSetting, saveSetting, removeSetting } from './settingsService';

// ─── Tipler ──────────────────────────────────────────────────────────────────

export interface PremiumProfile {
  isPremium: boolean;
  plan: 'free' | 'monthly' | 'yearly';
  /** Yenileme tarihi (ISO string) */
  expiresAt: string | null;
  /** Ödeme referansı — backend'den gelir */
  subscriptionId: string | null;
  /** Son doğrulama zamanı */
  verifiedAt: string | null;
}

const DEFAULT_PROFILE: PremiumProfile = {
  isPremium: false,
  plan: 'free',
  expiresAt: null,
  subscriptionId: null,
  verifiedAt: null,
};

// ─── Cache key ────────────────────────────────────────────────────────────────

const LS_KEY = 'premium_cache_v1';
const LS_TTL = 1000 * 60 * 15; // 15 dakika — sonra Firestore'a tekrar sor

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getUid = () => auth.currentUser?.uid ?? null;

/** localStorage'daki profil TTL içindeyse döndürür, yoksa null */
const getCachedProfile = (): PremiumProfile | null => {
  try {
    const raw = getSetting<any>(LS_KEY, null);
    if (!raw || typeof raw !== 'object' || !raw.profile) return null;
    const { profile, ts } = raw;
    if (Date.now() - ts > LS_TTL) return null;
    return profile as PremiumProfile;
  } catch {
    return null;
  }
};

const setCachedProfile = (profile: PremiumProfile) => {
  try {
    saveSetting(LS_KEY, { profile, ts: Date.now() });
  } catch { /* storage dolu olabilir */ }
};

/** Eski dönemden kalan ham `is_premium` key'ini temizle */
const migrateLegacyKey = (userUid?: string | null) => {
  const legacy = getSetting<boolean>('isPremium', false);
  if (!userUid) {
    if (!getSetting(LS_KEY, null) && legacy === true) {
      removeSetting('isPremium');
    }
    return legacy === true;
  }

  // Clear legacy
  if (legacy === true) {
    removeSetting('isPremium');
  }
};

// ─── Ana Fonksiyonlar ─────────────────────────────────────────────────────────

/**
 * Kullanıcının premium profilini getirir.
 * Önce cache'e bakar, bulamazsa Firestore'a gider.
 */
export const fetchPremiumProfile = async (): Promise<PremiumProfile> => {
  migrateLegacyKey();

  // 1. Cache hit
  const cached = getCachedProfile();
  if (cached) return cached;

  const uid = getUid();
  if (!uid) return DEFAULT_PROFILE;

  // 2. Firestore
  try {
    const ref = doc(db, 'users', uid, 'profile', 'premium');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setCachedProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }

    const data = snap.data() as PremiumProfile;

    // Sona erme kontrolü
    if (data.isPremium && data.expiresAt) {
      const expired = new Date(data.expiresAt) < new Date();
      if (expired) {
        const expired_profile = { ...data, isPremium: false, plan: 'free' as const };
        await setDoc(ref, { isPremium: false, plan: 'free' }, { merge: true });
        setCachedProfile(expired_profile);
        return expired_profile;
      }
    }

    setCachedProfile(data);
    return data;
  } catch (err) {
    console.warn('Firestore premium fetch hatası:', err);
    return DEFAULT_PROFILE;
  }
};

/**
 * Premium'u aktif eder.
 * Production'da bu doğrudan çağrılmamalı —
 * ödeme tamamlanınca Firebase Functions webhook'u bu işlemi yapmalı.
 * Buradaki implementasyon demo/geliştirme içindir.
 */
export const activatePremium = async (
  plan: 'monthly' | 'yearly',
  subscriptionId = 'demo_' + Date.now()
): Promise<void> => {
  const uid = getUid();
  // if (!uid) throw new Error('Kullanıcı oturumu yok'); 
  // Demo modu veya misafir kullanıcılar için hata fırlatma, sadece lokal cache güncelle.

  const months = plan === 'yearly' ? 12 : 1;
  const expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();

  const profile: PremiumProfile = {
    isPremium: true,
    plan,
    expiresAt,
    subscriptionId,
    verifiedAt: new Date().toISOString(),
  };

  if (uid) {
    try {
      const ref = doc(db, 'users', uid, 'profile', 'premium');
      await setDoc(ref, { ...profile, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn('Firestore premium yazma hatası — sadece cache\'e yazılıyor:', err);
    }
  }

  // Cache'e yaz (Firestore başarısız olsa bile UI güncellenir)
  setCachedProfile(profile);
};

/**
 * Premium'u iptal eder.
 * Production'da ödeme sağlayıcısı webhook'u bu işlemi yapmalı.
 */
export const cancelPremium = async (): Promise<void> => {
  const uid = getUid();
  const profile = { ...DEFAULT_PROFILE };
  setCachedProfile(profile);

  if (!uid) return;
  try {
    const ref = doc(db, 'users', uid, 'profile', 'premium');
    await setDoc(ref, { isPremium: false, plan: 'free', updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore premium iptal hatası:', err);
  }
};

/** Cache'i temizle — kullanıcı çıkış yaptığında çağır */
export const clearPremiumCache = () => {
  removeSetting(LS_KEY);
};
