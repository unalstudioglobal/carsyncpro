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
import { messaging, db } from "../firebaseConfig";
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

  if (!messaging) {
    return { granted: false, error: "Firebase Messaging bu ortamda desteklenmiyor (Safari private mod?)." };
  }

  try {
    // İzin iste
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return { granted: false, error: "Bildirim izni reddedildi." };
    }

    // Service worker'ın kayıtlı olduğundan emin ol
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      swRegistration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      );
      await navigator.serviceWorker.ready;
    }

    if (!VAPID_KEY) {
      console.warn("⚠️  VITE_VAPID_KEY tanımlı değil — token alınamayabilir");
    }

    // FCM token al
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY || undefined,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      return { granted: false, error: "FCM token alınamadı. VAPID key eksik olabilir." };
    }

    // Token'ı Firestore'a kaydet
    await saveFcmToken(token);

    // Foreground mesaj dinleyicisi başlat
    setupForegroundListener();

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

/** FCM token'ı kullanıcının Firestore kaydına yazar */
async function saveFcmToken(token: string): Promise<void> {
  const uid = getAuth().currentUser?.uid;
  if (!uid) return;

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
}

/** Mevcut push iznini sorgular */
export function getPushPermissionStatus(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// ── Foreground Listener ──────────────────────────────────

let foregroundListenerActive = false;

/** Uygulama açıkken gelen push mesajlarını toast olarak göster */
function setupForegroundListener(): void {
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
