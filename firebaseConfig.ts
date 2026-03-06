import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB4Yoni2gKfDudbkIJa0b5OT7QlUhzODW4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "car-sync-pro.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://car-sync-pro-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "car-sync-pro",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "car-sync-pro.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "893696369365",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:893696369365:web:1a460e80ef6997e6eeb85c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PZ06Q7LDVC",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

/**
 * Offline Persistence Aktif
 * ─────────────────────────
 * persistentLocalCache → veriler IndexedDB'de saklanır.
 * Kullanıcı internet olmadan da araçlarını, kayıtlarını görebilir.
 * persistentMultipleTabManager → birden fazla sekme desteklenir.
 *
 * Tarayıcı desteği yoksa (Safari private mod vb.) graceful fallback.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Messaging — push notification desteği varsa başlat
let messagingPromise: Promise<ReturnType<typeof getMessaging> | null> | null = null;

export async function getMessagingInstance(): Promise<ReturnType<typeof getMessaging> | null> {
  if (messagingPromise) return messagingPromise;

  messagingPromise = (async () => {
    try {
      const supported = await isMessagingSupported();
      if (supported) {
        return getMessaging(app);
      }
      return null;
    } catch {
      return null;
    }
  })();

  return messagingPromise;
}

// Legacy export for backward compatibility
export let messaging: ReturnType<typeof getMessaging> | null = null;
getMessagingInstance().then(m => messaging = m);

// Analytics — hata verirse sessizce geç
let analytics: ReturnType<typeof getAnalytics> | undefined;
try {
  analytics = getAnalytics(app);
} catch {
  // Analytics bazı ortamlarda (localhost, private mod) çalışmayabilir
}
export { analytics };
