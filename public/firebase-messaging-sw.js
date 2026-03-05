// firebase-messaging-sw.js
// ─────────────────────────────────────────────────────────────────
// Bu dosya PUBLIC klasöründe olmalı (/public/firebase-messaging-sw.js)
// Tarayıcı bu service worker'ı domain root'undan okur.
// Background (uygulama kapalıyken) push bildirimleri için gerekli.
// ─────────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging-compat.js');

// Firebase config — service worker'da process.env yok, değerler hardcoded olmalı
firebase.initializeApp({
  apiKey: "AIzaSyB4Yoni2gKfDudbkIJa0b5OT7QlUhzODW4",
  authDomain: "car-sync-pro.firebaseapp.com",
  projectId: "car-sync-pro",
  storageBucket: "car-sync-pro.firebasestorage.app",
  messagingSenderId: "893696369365",
  appId: "1:893696369365:web:1a460e80ef6997e6eeb85c",
});

const messaging = firebase.messaging();

// ── Background mesaj handler ──────────────────────────────────────
// Uygulama arka planda veya kapalıyken gelen push'ları göster
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background mesaj alındı:', payload);

  const { title, body, icon, badge, data } = payload.notification || {};

  const notificationOptions = {
    body: body || 'Yeni bir bildiriminiz var.',
    icon: icon || '/icon-192.png',
    badge: badge || '/badge-72.png',
    tag: data?.tag || 'carsync-notification',
    data: data || {},
    vibrate: [200, 100, 200],
    actions: data?.actionLabel ? [
      { action: 'open', title: data.actionLabel },
      { action: 'close', title: 'Kapat' },
    ] : [],
  };

  return self.registration.showNotification(
    title || 'CarSync Pro',
    notificationOptions
  );
});

// ── Bildirime tıklanınca ──────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const actionRoute = event.notification.data?.actionRoute || '/';
  const urlToOpen = new URL(`/#${actionRoute}`, self.location.origin).href;

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Zaten açık pencere varsa odaklan
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Yoksa yeni sekme aç
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ── Service Worker aktivasyonu ────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
