/**
 * exportService.ts
 * ─────────────────────────────────────────────────────────
 * Araç verileri için CSV + JSON yedekleme.
 * Hiç bağımlılık yok — saf tarayıcı API'leri kullanır.
 * ─────────────────────────────────────────────────────────
 */

import { fetchVehicles, fetchLogs } from './firestoreService';
import { Vehicle, ServiceLog } from '../types';

// ── Yardımcı: dosya indirme ───────────────────────────────
function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: `${mime};charset=utf-8` });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── CSV yardımcıları ──────────────────────────────────────
function escapeCsv(val: any): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(row: any[]): string {
  return row.map(escapeCsv).join(',');
}

// ── 1. Servis Kayıtları CSV ───────────────────────────────
export async function exportLogsCsv(vehicleId?: string): Promise<void> {
  const [vehicles, logs] = await Promise.all([fetchVehicles(), fetchLogs()]);
  const vehicleMap: Record<string, string> = {};
  vehicles.forEach(v => { vehicleMap[v.id] = `${v.brand} ${v.model} (${v.plate})`; });

  const filtered = vehicleId ? logs.filter(l => l.vehicleId === vehicleId) : logs;
  const sorted   = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const header = ['Tarih', 'Araç', 'İşlem Türü', 'Kilometre', 'Maliyet (TL)', 'Yakıt (L)', 'Notlar', 'Ödeme Durumu'];
  const rows = sorted.map(log => [
    log.date,
    vehicleMap[log.vehicleId] ?? log.vehicleId,
    log.type,
    log.mileage,
    log.cost,
    log.liters ?? '',
    (log.notes ?? '').replace(/\n/g, ' '),
    log.paymentStatus === 'Paid' ? 'Ödendi' : 'Bekliyor',
  ]);

  const csv = [header, ...rows].map(rowToCsv).join('\n');
  const label = vehicleId ? vehicleMap[vehicleId]?.split('(')[0].trim().replace(/\s+/g, '_') : 'tum_araclar';
  downloadFile(csv, `carsync_kayitlar_${label}_${today()}.csv`, 'text/csv');
}

// ── 2. Araç Listesi CSV ───────────────────────────────────
export async function exportVehiclesCsv(): Promise<void> {
  const vehicles = await fetchVehicles();

  const header = ['Marka', 'Model', 'Yıl', 'Plaka', 'Kilometre', 'Durum', 'Sağlık Puanı', 'Son İşlem'];
  const rows = vehicles.map(v => [
    v.brand, v.model, v.year, v.plate, v.mileage,
    v.status, v.healthScore, v.lastLogDate,
  ]);

  const csv = [header, ...rows].map(rowToCsv).join('\n');
  downloadFile(csv, `carsync_araclar_${today()}.csv`, 'text/csv');
}

// ── 3. Tam Yedek JSON ─────────────────────────────────────
export async function exportFullBackupJson(): Promise<void> {
  const [vehicles, logs] = await Promise.all([fetchVehicles(), fetchLogs()]);

  const backup = {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0',
    vehicles,
    logs,
  };

  downloadFile(JSON.stringify(backup, null, 2), `carsync_yedek_${today()}.json`, 'application/json');
}

// ── 4. Aylık Özet CSV ─────────────────────────────────────
export async function exportMonthlySummaryCsv(): Promise<void> {
  const [vehicles, logs] = await Promise.all([fetchVehicles(), fetchLogs()]);
  const vehicleMap: Record<string, string> = {};
  vehicles.forEach(v => { vehicleMap[v.id] = `${v.brand} ${v.model}`; });

  const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

  // Group by year-month
  const monthly: Record<string, { yakıt: number; bakım: number; sigorta: number; diğer: number; kayıt: number }> = {};

  logs.forEach(log => {
    if (!/^\d{4}-\d{2}/.test(log.date)) return;
    const [year, month] = log.date.split('-');
    const key  = `${year}-${month}`;
    if (!monthly[key]) monthly[key] = { yakıt: 0, bakım: 0, sigorta: 0, diğer: 0, kayıt: 0 };
    const t = log.type;
    if (t === 'Yakıt Alımı') monthly[key].yakıt += log.cost;
    else if (['Yağ Değişimi','Periyodik Bakım','Lastik Değişimi','Fren Servisi','Akü Değişimi'].includes(t))
      monthly[key].bakım += log.cost;
    else if (t === 'Sigorta') monthly[key].sigorta += log.cost;
    else monthly[key].diğer += log.cost;
    monthly[key].kayıt++;
  });

  const header = ['Yıl', 'Ay', 'Yakıt (TL)', 'Bakım (TL)', 'Sigorta (TL)', 'Diğer (TL)', 'Toplam (TL)', 'Kayıt Sayısı'];
  const rows = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const [yr, mo] = key.split('-');
      const total = v.yakıt + v.bakım + v.sigorta + v.diğer;
      return [yr, TR_MONTHS[parseInt(mo) - 1], v.yakıt.toFixed(2), v.bakım.toFixed(2), v.sigorta.toFixed(2), v.diğer.toFixed(2), total.toFixed(2), v.kayıt];
    });

  const csv = [header, ...rows].map(rowToCsv).join('\n');
  downloadFile(csv, `carsync_aylik_ozet_${today()}.csv`, 'text/csv');
}

// ── Yardımcı ──────────────────────────────────────────────
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
