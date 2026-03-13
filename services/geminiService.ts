/**
 * geminiService.ts
 * Tüm Gemini çağrıları /api/gemini/* üzerinden server'a gider.
 * API anahtarı yalnızca server tarafında bulunur.
 */

import type { Vehicle, ServiceLog, Appointment } from '../types';

const isOnline = () => navigator.onLine;

async function apiPost<T>(endpoint: string, body: object): Promise<T> {
  if (!isOnline()) throw Object.assign(new Error('offline'), { code: 'OFFLINE' });

  const res = await fetch(`/api/gemini/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error || `Sunucu hatası (${res.status})`;
    throw Object.assign(new Error(msg), {
      code: res.status === 429 ? 'QUOTA' : 'SERVER_ERROR',
      status: res.status,
    });
  }
  return data as T;
}

// ── Tipler ────────────────────────────────────────────────

export interface ProactiveAlert {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'tip';
  category: 'maintenance' | 'fuel' | 'safety' | 'cost' | 'document';
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  estimatedCost?: number;
  daysLeft?: number;
}

export interface HealthScoreDetail {
  overall: number;
  categories: {
    engine: { score: number; label: string; note: string };
    fuel: { score: number; label: string; note: string };
    safety: { score: number; label: string; note: string };
    body: { score: number; label: string; note: string };
    documents: { score: number; label: string; note: string };
  };
  trend: 'improving' | 'stable' | 'declining';
  summary: string;
  topRisk: string;
}

export interface MaintenanceScheduleItem {
  month: number;
  year: number;
  label: string;
  tasks: string[];
  estimatedCost: number;
  priority: 'critical' | 'recommended' | 'optional';
}

// ── 1. Fatura / Fiş Analizi ──────────────────────────────
export const analyzeInvoiceImage = async (
  base64Image: string,
  mimeType = 'image/jpeg'
): Promise<any> => {
  if (!isOnline()) return { error: 'İnternet bağlantısı yok.' };
  try {
    return await apiPost<any>('analyze-invoice', { base64Image, mimeType });
  } catch (err: any) {
    if (err.code === 'OFFLINE') return { error: 'İnternet bağlantısı yok.' };
    if (err.code === 'QUOTA') return { error: 'Günlük YZ analiz kotası doldu.' };
    return { error: 'Görüntü analiz edilemedi.' };
  }
};

// ── 2. Araç Sağlık İçgörüsü ─────────────────────────────
export const getHealthInsight = async (
  vehicleModel: string,
  mileage: number,
  lastServiceDate: string
): Promise<string> => {
  if (!isOnline()) return 'İnternet bağlantısı yok.';
  try {
    const data = await apiPost<{ insight: string }>('health-insight', {
      vehicleModel, mileage, lastServiceDate,
    });
    return data.insight || 'İçgörü alınamadı.';
  } catch {
    return 'Şu anda içgörü oluşturulamıyor.';
  }
};

// ── 3. Bakım Önerileri ───────────────────────────────────
export const getMaintenanceRecommendations = async (
  vehicleInfo: string,
  mileage: number
): Promise<string[]> => {
  const FALLBACK = [
    'Sıvı seviyelerini kontrol edin.',
    'Lastik diş derinliğini ölçün.',
    'Aydınlatma sistemini kontrol edin.',
  ];
  if (!isOnline()) return FALLBACK;
  try {
    const data = await apiPost<{ recommendations: string[] }>('maintenance', { vehicleInfo, mileage });
    return data.recommendations?.length ? data.recommendations : FALLBACK;
  } catch {
    return FALLBACK;
  }
};

// ── 4. OBD-II Arıza Kodu ────────────────────────────────
export const explainTroubleCodes = async (
  code: string,
  vehicleModel: string
): Promise<any> => {
  if (!isOnline()) return null;
  try {
    return await apiPost<any>('dtc', { code, vehicleModel });
  } catch (err: any) {
    if (err.code === 'QUOTA') return {
      code, meaning: 'YZ Servis Kotası Doldu', severity: 'Bilinmiyor',
      causes: ['Günlük işlem limiti aşıldı'], solutions: ['Lütfen daha sonra tekrar deneyin.'],
    };
    return null;
  }
};

// ── 5. Araç Asistanı ─────────────────────────────────────
export const chatWithVehicle = async (
  message: string,
  vehicleContext: any,
  chatHistory: { role: string; parts: { text: string }[] }[],
  audioData?: string
): Promise<string> => {
  if (!isOnline()) return "Bağlantı yok. Şu an motoru çalıştıramıyorum 😴";
  try {
    const data = await apiPost<{ reply: string }>('chat', {
      message, vehicleContext, history: chatHistory, audioData,
    });
    return data.reply || '...';
  } catch {
    return 'Motor boğuldu... Tekrar dener misin? 😅';
  }
};

// ── 6. Hasar Tespiti ─────────────────────────────────────
export const analyzeDamage = async (
  base64Image: string,
  mimeType = 'image/jpeg'
): Promise<any> => {
  if (!isOnline()) return { error: 'İnternet bağlantısı yok.' };
  try {
    return await apiPost<any>('damage-detection', { base64Image, mimeType });
  } catch (err: any) {
    if (err.code === 'QUOTA') return { error: 'YZ kotası doldu.' };
    return { error: 'Hasar tespiti yapılamadı.' };
  }
};

// ── 7. YENİ: Proaktif Uyarılar ───────────────────────────
export const getProactiveAlerts = async (
  vehicle: Vehicle,
  logs: ServiceLog[],
  appointments: Appointment[]
): Promise<ProactiveAlert[]> => {
  if (!isOnline()) return [];
  try {
    const data = await apiPost<{ alerts: ProactiveAlert[] }>('proactive-alerts', {
      vehicle: {
        brand: vehicle.brand, model: vehicle.model, year: vehicle.year,
        mileage: vehicle.mileage, healthScore: vehicle.healthScore,
        status: vehicle.status, lastLogDate: vehicle.lastLogDate,
      },
      logs: logs.slice(0, 30).map(l => ({
        type: l.type, date: l.date, cost: l.cost,
        mileage: l.mileage, liters: l.liters, notes: l.notes,
      })),
      appointments: appointments.map(a => ({
        serviceType: a.serviceType, date: a.date, status: a.status,
      })),
    });
    return data.alerts || [];
  } catch {
    return [];
  }
};

// ── 8. YENİ: Detaylı Sağlık Skoru ────────────────────────
export const getDetailedHealthScore = async (
  vehicle: Vehicle,
  logs: ServiceLog[]
): Promise<HealthScoreDetail | null> => {
  if (!isOnline()) return null;
  try {
    return await apiPost<HealthScoreDetail>('detailed-health', {
      vehicle: {
        brand: vehicle.brand, model: vehicle.model, year: vehicle.year,
        mileage: vehicle.mileage, healthScore: vehicle.healthScore,
        status: vehicle.status, lastLogDate: vehicle.lastLogDate,
        damageReport: vehicle.damageReport,
      },
      logs: logs.slice(0, 40).map(l => ({
        type: l.type, date: l.date, cost: l.cost, mileage: l.mileage, liters: l.liters,
      })),
    });
  } catch {
    return null;
  }
};

// ── 9. YENİ: Kişisel Bakım Takvimi ───────────────────────
export const getMaintenanceSchedule = async (
  vehicle: Vehicle,
  logs: ServiceLog[]
): Promise<MaintenanceScheduleItem[]> => {
  if (!isOnline()) return [];
  try {
    const data = await apiPost<{ schedule: MaintenanceScheduleItem[] }>('maintenance-schedule', {
      vehicle: {
        brand: vehicle.brand, model: vehicle.model,
        year: vehicle.year, mileage: vehicle.mileage,
      },
      logs: logs.slice(0, 50).map(l => ({
        type: l.type, date: l.date, mileage: l.mileage, cost: l.cost,
      })),
    });
    return data.schedule || [];
  } catch {
    return [];
  }
};
