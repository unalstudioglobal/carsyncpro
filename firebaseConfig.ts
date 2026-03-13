import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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

// Analytics — hata verirse sessizce geç
let analytics: ReturnType<typeof getAnalytics> | undefined;
try {
  analytics = getAnalytics(app);
} catch {
  // Analytics bazı ortamlarda (localhost, private mod) çalışmayabilir
}
export { analytics };
