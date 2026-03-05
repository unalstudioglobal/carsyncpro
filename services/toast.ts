/**
 * toast.ts
 * ─────────────────────────────────────────────────────────
 * Lightweight toast sistemi — hiç bağımlılık yok.
 * Kullanım:
 *   import { toast } from '../services/toast';
 *   toast.error('Kayıt silinemedi');
 *   toast.success('Araç eklendi!');
 *   toast.info('Çevrimdışı mod — veriler yerel önbellekten');
 *   toast.warning('Kota dolmak üzere');
 * ─────────────────────────────────────────────────────────
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;   // ms, varsayılan: 3500
  id?:      string;    // aynı id tekrar gösterilmez (debounce)
}

// ── DOM Setup ────────────────────────────────────────────
function getContainer(): HTMLElement {
  let el = document.getElementById('toast-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-root';
    Object.assign(el.style, {
      position:      'fixed',
      bottom:        '90px',     // bottom nav'ın üstü
      left:          '50%',
      transform:     'translateX(-50%)',
      zIndex:        '9999',
      display:       'flex',
      flexDirection: 'column-reverse',
      gap:           '8px',
      alignItems:    'center',
      pointerEvents: 'none',
      width:         'min(92vw, 380px)',
    });
    document.body.appendChild(el);
  }
  return el;
}

// ── Icons (SVG string) ───────────────────────────────────
const ICONS: Record<ToastType, string> = {
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(0,232,120,0.12)',  border: 'rgba(0,232,120,0.3)',  icon: '#00E878' },
  error:   { bg: 'rgba(255,59,59,0.12)',  border: 'rgba(255,59,59,0.3)',  icon: '#FF3B3B' },
  info:    { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', icon: '#818CF8' },
  warning: { bg: 'rgba(255,154,0,0.12)',  border: 'rgba(255,154,0,0.3)',  icon: '#FF9A00' },
};

const activeIds = new Set<string>();

function show(type: ToastType, message: string, opts: ToastOptions = {}) {
  const { duration = 3500, id } = opts;

  // Debounce: aynı id zaten gösteriliyorsa atla
  if (id) {
    if (activeIds.has(id)) return;
    activeIds.add(id);
  }

  const container = getContainer();
  const c = COLORS[type];

  const el = document.createElement('div');
  el.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: ${c.bg};
    border: 1px solid ${c.border};
    border-radius: 14px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    color: #F0EEE8;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    pointer-events: auto;
    cursor: pointer;
    max-width: 100%;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    transform: translateY(20px) scale(0.95);
    opacity: 0;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
  `;

  el.innerHTML = `
    <span style="color:${c.icon};flex-shrink:0">${ICONS[type]}</span>
    <span style="flex:1">${message}</span>
    <span style="color:rgba(255,255,255,0.3);font-size:18px;line-height:1;flex-shrink:0">×</span>
  `;

  container.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(0) scale(1)';
      el.style.opacity   = '1';
    });
  });

  const dismiss = () => {
    el.style.transform = 'translateY(10px) scale(0.95)';
    el.style.opacity   = '0';
    if (id) activeIds.delete(id);
    setTimeout(() => el.remove(), 300);
  };

  el.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
}

// ── Public API ───────────────────────────────────────────
export const toast = {
  success: (msg: string, opts?: ToastOptions) => show('success', msg, opts),
  error:   (msg: string, opts?: ToastOptions) => show('error',   msg, opts),
  info:    (msg: string, opts?: ToastOptions) => show('info',    msg, opts),
  warning: (msg: string, opts?: ToastOptions) => show('warning', msg, opts),
};

// ── Offline / Online otomatik bildirimi ──────────────────
let wasOffline = false;

window.addEventListener('offline', () => {
  wasOffline = true;
  toast.warning('Çevrimdışı — veriler yerel önbellekten gösteriliyor', {
    id:       'offline-notice',
    duration: 5000,
  });
});

window.addEventListener('online', () => {
  if (wasOffline) {
    wasOffline = false;
    toast.success('Bağlantı yeniden kuruldu', {
      id:       'online-notice',
      duration: 3000,
    });
  }
});
