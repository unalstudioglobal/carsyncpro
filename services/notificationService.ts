/**
 * notificationService.ts
 * ─────────────────────────────────────────────────────────
 * Firebase Cloud Messaging entegrasyonu.
 *
 * Sorumluluklar:
 *  1. Push izni isteme
 *  2. FCM token alıp Firestore'a kaydetme
 *  3. Token yenileme listener'ı
 *  4. Server'a push gönderme isteği
 *  5. Foreground (uygulama açıkken) bildirim handler
 *  6. Bakım/sigorta hatırlatıcı tetikleyicisi
 * ─────────────────────────────────────────────────────────
 */

import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessagingInstance, db } from "../firebaseConfig";
import { toast } from "./toast";

// ── VAPID key ────────────────────────────────────────────
// Firebase Console → Proje → Cloud Messaging → Web Push Sertifikaları
// "Anahtar çifti oluştur" → Public key'i buraya yapıştır
const VAPID_KEY = import.meta.env.VITE_VAPID_KEY || "";

// ── Types ────────────────────────────────────────────────
export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  actionRoute?: string;
  actionLabel?: string;
  vehicleId?: string;
  icon?: string;
}

export interface ScheduledReminder {
  vehicleId: string;
  vehicleName: string;
  type: "maintenance" | "insurance" | "muayene" | "tire" | "fuel";
  dueDate: string;   // ISO date
  daysUntil: number;
}

// ── İzin & Token ─────────────────────────────────────────

/** 
 * Uygulama başladığında bildirimleri ilklendirir.
 * Eğer izin zaten verilmişse token'ı yeniler ve dinleyiciyi başlatır.
 */
export async function initNotifications(): Promise<void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  const status = getPushPermissionStatus();
  if (status === "granted") {
    try {
      // Service worker kaydını al/yap
      let swRegistration: ServiceWorkerRegistration | undefined;
      if ("serviceWorker" in navigator) {
        swRegistration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );
        // SW'nin hazır olmasını bekle
        await navigator.serviceWorker.ready;
      }

      console.log("FCM: Token alınıyor (VAPID Key:", VAPID_KEY ? "Mevcut" : "Eksik", ")");

      // Auth kontrolü (Token kaydetmek için UID lazım)
      const user = getAuth().currentUser;
      if (!user) {
        console.warn("FCM: Kullanıcı oturum açmamış, token alma ertelendi.");
        return;
      }

      // Token'ı al
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY || undefined,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        console.log("FCM: Token başarıyla alındı.");
        await saveFcmToken(token);
      } else {
        console.warn("FCM: Token boş döndü.");
      }

      // Foreground dinleyiciyi başlat
      setupForegroundListener(messaging);
    } catch (err: any) {
      console.error("Notification init error:", err);
      // Hataları toast ile göster (geçici olarak hata ayıkla)
      if (err.message?.includes("messaging/invalid-vapid-key")) {
        toast.error("Hata: Geçersiz VAPID Key! Lütfen .env dosyasındaki anahtarı kontrol edin.");
      }
    }
  }
}

/** Bildirim iznini ister, FCM token'ı alır ve Firestore'a kaydeder */
export async function requestPushPermission(): Promise<{
  granted: boolean;
  token?: string;
  error?: string;
}> {
  // Tarayıcı desteği kontrolü
  if (!("Notification" in window)) {
    return { granted: false, error: "Tarayıcınız push bildirimlerini desteklemiyor." };
  }

  const messaging = await getMessagingInstance();
  if (!messaging) {
    return { granted: false, error: "Firebase Messaging bu ortamda desteklenmiyor (Safari private mod?)." };
  }

  try {
    // İzin iste
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return { granted: false, error: "Bildirim izni reddedildi." };
    }

    // Başarılıysa init'i çağır
    await initNotifications();

    // Token'ı tekrar alıp döndürmek için (opsiyonel)
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    return { granted: true, token };
  } catch (err: any) {
    console.error("Push permission hatası:", err);
    return {
      granted: false,
      error: err.message?.includes("messaging/unsupported-browser")
        ? "Bu tarayıcıda push bildirimler desteklenmiyor."
        : "Push bildirimleri etkinleştirilemedi.",
    };
  }
}

/** FCM token'ı kullanıcının Firestore kaydına yazar ve topiclere abone eder */
async function saveFcmToken(token: string): Promise<void> {
  const uid = getAuth().currentUser?.uid;
  if (!uid) return;

  try {
    // 1. Firestore'a kaydet
    await setDoc(
      doc(db, "users", uid, "fcmTokens", token.substring(0, 40)),
      {
        token,
        platform: "web",
        userAgent: navigator.userAgent.substring(0, 200),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Genel duyuru topic'ine abone ol
    await subscribeToTopic(token, "all_users");

    // 3. Kişiye özel topic'e abone ol (Admin panelinden tekli gönderim için)
    await subscribeToTopic(token, `user-${uid}`);
  } catch (err) {
    console.error("FCM token kaydetme/abone olma hatası:", err);
  }
}

/** Server tarafında token'ı bir topic'e bağlar */
async function subscribeToTopic(token: string, topic: string): Promise<void> {
  try {
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, topic }),
    });
  } catch (err) {
    console.warn(`Topic (${topic}) abonelik hatası:`, err);
  }
}

/** Mevcut push iznini sorgular */
export function getPushPermissionStatus(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// ── Foreground Listener ──────────────────────────────────

let foregroundListenerActive = false;

/** Uygulama açıkken gelen push mesajlarını toast olarak göster */
function setupForegroundListener(messaging: any): void {
  if (foregroundListenerActive || !messaging) return;
  foregroundListenerActive = true;

  onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {};
    const msg = `${title ? title + ": " : ""}${body || "Yeni bildirim"}`;

    // Kritiklik seviyesine göre toast tipi
    const data = payload.data || {};
    if (data.type === "critical") toast.error(msg, { duration: 6000 });
    else if (data.type === "warning") toast.warning(msg, { duration: 5000 });
    else toast.info(msg, { duration: 4000 });
  });
}

// ── Server Push API ──────────────────────────────────────

/** Server'a push gönderme isteği gönderir (token'lara veya topic'e) */
export async function sendPushViaServer(
  payload: PushPayload,
  targets: { tokens?: string[]; topic?: string }
): Promise<boolean> {
  try {
    const res = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, ...targets }),
    });
    return res.ok;
  } catch (err) {
    console.error("Push gönderme hatası:", err);
    return false;
  }
}

/** Mevcut kullanıcının tüm FCM tokenlarını döndürür */
export async function getUserFcmTokens(): Promise<string[]> {
  try {
    const user = getAuth().currentUser;
    if (!user) return [];

    const idToken = await user.getIdToken();
    const res = await fetch("/api/notifications/my-tokens", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.tokens || [];
  } catch {
    return [];
  }
}

// ── Hatırlatıcı Engine ───────────────────────────────────

/** Yaklaşan bakım/sigorta için bildirim gönder */
export async function sendMaintenanceReminder(
  reminder: ScheduledReminder
): Promise<void> {
  const { vehicleName, type, daysUntil } = reminder;

  const LABELS: Record<ScheduledReminder["type"], string> = {
    maintenance: "Periyodik Bakım",
    insurance: "Sigorta Yenileme",
    muayene: "Araç Muayenesi",
    tire: "Lastik Kontrolü",
    fuel: "Yakıt Hatırlatıcısı",
  };

  const label = LABELS[type];

  let title: string;
  let body: string;

  if (daysUntil <= 0) {
    title = `⚠️ ${label} Vadesi Geçti`;
    body = `${vehicleName} aracınızın ${label.toLowerCase()} süresi doldu!`;
  } else if (daysUntil <= 3) {
    title = `🔴 ${label} — ${daysUntil} Gün Kaldı`;
    body = `${vehicleName} aracınız için ${label.toLowerCase()} ${daysUntil} gün içinde yapılmalı.`;
  } else if (daysUntil <= 7) {
    title = `🟡 ${label} Yaklaşıyor`;
    body = `${vehicleName}: ${label} için ${daysUntil} gün kaldı.`;
  } else {
    title = `📅 ${label} Hatırlatıcısı`;
    body = `${vehicleName}: ${daysUntil} gün sonra ${label.toLowerCase()} zamanı.`;
  }

  // Önce foreground toast göster
  if (daysUntil <= 3) {
    toast.warning(`${title}: ${body}`, { duration: 6000 });
  } else {
    toast.info(body, { duration: 4000 });
  }

  // Arka plan push da gönder (uygulama kapalıyken görülür)
  await sendPushViaServer(
    {
      title,
      body,
      tag: `reminder-${reminder.vehicleId}-${type}`,
      actionRoute: `/dashboard/${reminder.vehicleId}`,
      actionLabel: "Detaylara Git",
      vehicleId: reminder.vehicleId,
      icon: "/icon-192.png",
    },
    { topic: `user-${getAuth().currentUser?.uid}` }
  );
}

/** Tüm araçların yaklaşan bakımlarını kontrol eder ve gerekirse bildirim gönderir */
export function checkAndNotifyReminders(
  reminders: ScheduledReminder[]
): void {
  const NOTIFY_AT_DAYS = [30, 7, 3, 1, 0]; // Bu gün sayılarında bildirim gönder

  for (const reminder of reminders) {
    if (NOTIFY_AT_DAYS.includes(reminder.daysUntil)) {
      sendMaintenanceReminder(reminder).catch(console.error);
    }
  }
}
