/**
 * usageService.ts
 * -------------------------------------------------
 * Ücretsiz kullanıcılar için günlük AI kullanım limitlerini takip eder.
 * -------------------------------------------------
 */

import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const LIMITS = {
  FREE_AI_DAILY: 3,
};

interface UsageRecord {
  date: string; // YYYY-MM-DD
  aiCount: number;
}

export const checkAiUsage = async (): Promise<{ allowed: boolean; remaining: number }> => {
  const user = auth.currentUser;
  if (!user) return { allowed: true, remaining: 99 }; // Giriş yapmamış kullanıcı (demo)

  const today = new Date().toISOString().split('T')[0];
  const uid = user.uid;
  
  try {
    const ref = doc(db, 'users', uid, 'usage', today);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { allowed: true, remaining: LIMITS.FREE_AI_DAILY };
    }

    const data = snap.data() as UsageRecord;
    const count = data.aiCount || 0;
    
    return {
      allowed: count < LIMITS.FREE_AI_DAILY,
      remaining: Math.max(0, LIMITS.FREE_AI_DAILY - count)
    };
  } catch (err) {
    console.warn('Usage fetch error:', err);
    return { allowed: true, remaining: 1 };
  }
};

export const incrementAiUsage = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const today = new Date().toISOString().split('T')[0];
  const uid = user.uid;

  try {
    const ref = doc(db, 'users', uid, 'usage', today);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, { date: today, aiCount: 1 });
    } else {
      await updateDoc(ref, { aiCount: increment(1) });
    }
  } catch (err) {
    console.warn('Usage increment error:', err);
  }
};
