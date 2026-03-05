/**
 * geminiService.ts
 * ─────────────────────────────────────────────────────────
 * ⚠️  API anahtarı artık bu dosyada YOK.
 * Tüm Gemini çağrıları /api/gemini/* üzerinden server'a gider.
 * Server (server.ts) anahtarı güvenli şekilde kullanır.
 * ─────────────────────────────────────────────────────────
 */

const isOnline = () => navigator.onLine;

/** Sunucuya POST isteği gönderir */
async function apiPost<T>(endpoint: string, body: object): Promise<T> {
  if (!isOnline()) {
    throw Object.assign(new Error("offline"), { code: "OFFLINE" });
  }

  const res = await fetch(`/api/gemini/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error || `Sunucu hatası (${res.status})`;
    throw Object.assign(new Error(msg), {
      code: res.status === 429 ? "QUOTA" : "SERVER_ERROR",
      status: res.status,
    });
  }

  return data as T;
}

// ── 1. Fatura / Fiş Analizi ──────────────────────────────
export const analyzeInvoiceImage = async (
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<any> => {
  if (!isOnline()) return { error: "İnternet bağlantısı yok." };

  try {
    return await apiPost<any>("analyze-invoice", { base64Image, mimeType });
  } catch (err: any) {
    if (err.code === "OFFLINE") return { error: "İnternet bağlantısı yok." };
    if (err.code === "QUOTA")   return { error: "Günlük YZ analiz kotası doldu. Lütfen yarın tekrar deneyin." };
    return { error: "Görüntü analiz edilemedi. Lütfen daha net bir fotoğraf deneyin." };
  }
};

// ── 2. Araç Sağlık İçgörüsü ─────────────────────────────
export const getHealthInsight = async (
  vehicleModel: string,
  mileage: number,
  lastServiceDate: string
): Promise<string> => {
  if (!isOnline()) return "İnternet bağlantısı yok.";

  try {
    const data = await apiPost<{ insight: string }>("health-insight", {
      vehicleModel, mileage, lastServiceDate,
    });
    return data.insight || "İçgörü alınamadı.";
  } catch (err: any) {
    if (err.code === "QUOTA") return "YZ kotası doldu. Genel bakım takviminizi kontrol edin.";
    return "Şu anda içgörü oluşturulamıyor.";
  }
};

// ── 3. Bakım Önerileri ───────────────────────────────────
export const getMaintenanceRecommendations = async (
  vehicleInfo: string,
  mileage: number
): Promise<string[]> => {
  const FALLBACK = [
    "Sıvı seviyelerini kontrol edin.",
    "Lastik diş derinliğini ölçün.",
    "Aydınlatma sistemini kontrol edin.",
  ];

  if (!isOnline()) return FALLBACK;

  try {
    const data = await apiPost<{ recommendations: string[] }>("maintenance", {
      vehicleInfo, mileage,
    });
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
    return await apiPost<any>("dtc", { code, vehicleModel });
  } catch (err: any) {
    if (err.code === "QUOTA") {
      return {
        code,
        meaning: "YZ Servis Kotası Doldu",
        severity: "Bilinmiyor",
        causes: ["Günlük işlem limiti aşıldı"],
        solutions: ["Lütfen daha sonra tekrar deneyin."],
      };
    }
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
    const data = await apiPost<{ reply: string }>("chat", {
      message, vehicleContext, history: chatHistory, audioData,
    });
    return data.reply || "...";
  } catch {
    return "Motor boğuldu... Tekrar dener misin? 😅";
  }
};

// ── 6. Hasar Tespiti ─────────────────────────────────────
export const analyzeDamage = async (
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<any> => {
  if (!isOnline()) return { error: "İnternet bağlantısı yok." };

  try {
    return await apiPost<any>("damage-detection", { base64Image, mimeType });
  } catch (err: any) {
    if (err.code === "QUOTA") return { error: "YZ kotası doldu." };
    return { error: "Hasar tespiti yapılamadı." };
  }
};
