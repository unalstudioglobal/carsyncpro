import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Brain, Zap, Clock, AlertTriangle, CheckCircle2,
  Wrench, Droplet, Disc, Battery, RotateCw, Fuel, ClipboardCheck,
  Sparkles, TrendingUp, Calendar, Gauge, ArrowRight, RefreshCw,
  Shield, Timer, Info
} from 'lucide-react';
import { fetchVehicles, fetchLogs } from '../services/firestoreService';
import { Vehicle, ServiceLog } from '../types';
import { GoogleGenAI } from "@google/genai";
import { AdBanner } from '../components/AdBanner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MaintenancePrediction {
  item: string;
  icon: React.ElementType;
  iconColor: string;
  urgency: 'critical' | 'warning' | 'soon' | 'ok';
  estimatedDate: string;
  estimatedKm: number;
  currentKm: number;
  intervalKm: number;
  lastDoneKm: number | null;
  lastDoneDate: string | null;
  confidence: number; // 0-100
  aiReason: string;
}

interface AIPredictionResult {
  predictions: {
    item: string;
    urgencyLevel: 'critical' | 'warning' | 'soon' | 'ok';
    estimatedMonths: number;
    estimatedKm: number;
    reasoning: string;
    confidence: number;
  }[];
  overallRisk: 'Yüksek' | 'Orta' | 'Düşük';
  summary: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICE_INTERVALS: Record<string, { km: number; months: number; icon: React.ElementType; iconColor: string }> = {
  'oil_change': { km: 10000, months: 6, icon: Droplet, iconColor: 'text-amber-400' },
  'periodic': { km: 15000, months: 12, icon: Wrench, iconColor: 'text-blue-400' },
  'tire_change': { km: 40000, months: 36, icon: Disc, iconColor: 'text-purple-400' },
  'tire_rotation': { km: 10000, months: 6, icon: RotateCw, iconColor: 'text-indigo-400' },
  'brake': { km: 30000, months: 24, icon: Wrench, iconColor: 'text-red-400' },
  'battery': { km: 60000, months: 48, icon: Battery, iconColor: 'text-yellow-400' },
  'inspection': { km: 999999, months: 24, icon: ClipboardCheck, iconColor: 'text-teal-400' },
  'air_filter': { km: 20000, months: 12, icon: Sparkles, iconColor: 'text-cyan-400' },
  'pollen_filter': { km: 15000, months: 12, icon: Sparkles, iconColor: 'text-green-400' },
  'antifreeze': { km: 40000, months: 24, icon: Droplet, iconColor: 'text-blue-300' },
  'timing_belt': { km: 60000, months: 48, icon: Zap, iconColor: 'text-orange-400' },
};

const URGENCY_CONFIG = {
  critical: {
    bg: 'bg-red-500/15',
    border: 'border-red-500/40',
    text: 'text-red-400',
    dot: 'bg-red-500',
    badge: 'bg-red-500/20 text-red-300'
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/20 text-amber-300'
  },
  soon: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/20 text-blue-300'
  },
  ok: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-300'
  },
};

// ─── AI Service ──────────────────────────────────────────────────────────────

const getPredictiveMaintenance = async (
  vehicle: Vehicle,
  logs: ServiceLog[],
  lang: string
): Promise<AIPredictionResult | null> => {
  if (!navigator.onLine || !process.env.API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Summarize log history for AI
  const logSummary = logs
    .filter(l => l.vehicleId === vehicle.id)
    .sort((a, b) => b.mileage - a.mileage)
    .slice(0, 20)
    .map(l => `${l.type} - ${l.date} - ${l.mileage}km - ₺${l.cost}`)
    .join('\n');

  const prompt = lang === 'Turkish' || lang === 'Türkçe'
    ? `Sen bir uzman araç bakım mühendisisin. Aşağıdaki araç ve servis geçmişini analiz et.

ARAÇ BİLGİLERİ:
- Marka/Model: ${vehicle.brand} ${vehicle.model} (${vehicle.year})
- Güncel Kilometre: ${vehicle.mileage} km
- Sağlık Skoru: ${vehicle.healthScore}/100
- Durum: ${vehicle.status}

SERVİS GEÇMİŞİ (son kayıtlar):
${logSummary || 'Kayıt bulunamadı'}

Görev: Bu araca özgü bakım tahminleri oluştur. Aşağıdaki bakım kalemlerini analiz et (Item anahtarları: oil_change, periodic, tire_change, tire_rotation, brake, battery, air_filter, pollen_filter, timing_belt, antifreeze):

JSON formatında yanıt ver:
{
  "predictions": [
    {
      "item": "yukarıdaki anahtarlardan biri",
      "urgencyLevel": "critical|warning|soon|ok",
      "estimatedMonths": sayı,
      "estimatedKm": araca özel tahmini km (mevcut km + kalan),
      "reasoning": "kısa Türkçe açıklama, neden bu tahmini yaptın",
      "confidence": 0-100 arası güven skoru
    }
  ],
  "overallRisk": "Yüksek|Orta|Düşük",
  "summary": "Araç hakkında 1-2 cümle genel değerlendirme (Türkçe)"
}

Sadece JSON döndür, başka metin ekleme.`
    : `You are an expert vehicle maintenance engineer. Analyze the following vehicle and service history.

VEHICLE INFO:
- Make/Model: ${vehicle.brand} ${vehicle.model} (${vehicle.year})
- Current Mileage: ${vehicle.mileage} km
- Health Score: ${vehicle.healthScore}/100
- Status: ${vehicle.status}

SERVICE HISTORY (recent records):
${logSummary || 'No records found'}

Task: Generate specific maintenance predictions for this vehicle. Analyze the following items (Item keys: oil_change, periodic, tire_change, tire_rotation, brake, battery, air_filter, pollen_filter, timing_belt, antifreeze):

Respond in JSON format:
{
  "predictions": [
    {
      "item": "one of the keys above",
      "urgencyLevel": "critical|warning|soon|ok",
      "estimatedMonths": number,
      "estimatedKm": vehicle specific estimated km (current km + remaining),
      "reasoning": "short English explanation, why did you make this prediction",
      "confidence": confidence score between 0-100
    }
  ],
  "overallRisk": "High|Medium|Low",
  "summary": "1-2 sentence general assessment of the vehicle (English)"
}

Return ONLY JSON, do not add any other text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    let text = response.text || '{}';

    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?|\n?```/g, '').trim();

    // Extract just the JSON object if there's extra text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(text);
  } catch (err) {
    console.error('AI prediction error:', err);
    return null;
  }
};

// ─── Helper Utilities ────────────────────────────────────────────────────────

const getLastServiceInfo = (logs: ServiceLog[], vehicleId: string, type: string) => {
  const relevant = logs
    .filter(l => l.vehicleId === vehicleId && l.type === type)
    .sort((a, b) => b.mileage - a.mileage);
  if (relevant.length === 0) return { km: null, date: null };
  return { km: relevant[0].mileage, date: relevant[0].date };
};

const addMonths = (date: Date, months: number, i18n: any): string => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });
};

const formatKmValue = (km: number, i18n: any) => {
  return km.toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US') + ' km';
};

// ─── Sub Components ──────────────────────────────────────────────────────────

const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const { t } = useTranslation();
  const color = confidence >= 80 ? 'text-emerald-400' : confidence >= 60 ? 'text-amber-400' : 'text-slate-400';
  return (
    <div className={`flex items-center gap-1 text-xs ${color}`}>
      <Brain size={10} />
      <span>{t('predictive.confidence', { score: confidence })}</span>
    </div>
  );
};

const PredictionCard: React.FC<{
  prediction: MaintenancePrediction;
  onSchedule: (item: string) => void
}> = ({ prediction, onSchedule }) => {
  const { t } = useTranslation();
  const { icon: Icon, iconColor, urgency, item, estimatedDate, estimatedKm, currentKm, lastDoneKm, confidence, aiReason } = prediction;
  const cfg = URGENCY_CONFIG[urgency];
  const urgencyLabels: Record<string, string> = { critical: t('predictive.urg_critical'), warning: t('predictive.urg_warning'), soon: t('predictive.urg_soon'), ok: t('predictive.urg_ok') };
  const kmRemaining = estimatedKm - currentKm;
  const progressPct = lastDoneKm !== null
    ? Math.min(100, Math.round(((currentKm - lastDoneKm) / (prediction.intervalKm)) * 100))
    : urgency === 'ok' ? 20 : urgency === 'soon' ? 55 : urgency === 'warning' ? 80 : 100;

  return (
    <div className={`relative rounded-2xl border p-4 ${cfg.bg} ${cfg.border} transition-all duration-300`}>
      {/* Pulse for critical */}
      {urgency === 'critical' && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold text-sm">{t(`predictive.maintenance_items.${item}`)}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
              {urgencyLabels[urgency]}
            </span>
          </div>

          <p className="text-slate-400 text-xs mb-2 leading-relaxed">{aiReason}</p>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{t('predictive.last_service')}</span>
              <span>{lastDoneKm ? formatKmValue(lastDoneKm, { language: t('predictive.ai_prompt_lang') === 'Türkçe' ? 'tr' : 'en' }) : t('predictive.unknown')}</span>
            </div>
            <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${urgency === 'critical' ? 'bg-red-500' :
                  urgency === 'warning' ? 'bg-amber-500' :
                    urgency === 'soon' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Info row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar size={10} />
                <span>{estimatedDate}</span>
              </div>
              {kmRemaining > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Gauge size={10} />
                  <span>{t('predictive.remaining_km', { km: formatKmValue(kmRemaining, { language: t('predictive.ai_prompt_lang') === 'Türkçe' ? 'tr' : 'en' }) })}</span>
                </div>
              )}
            </div>
            <ConfidenceBadge confidence={confidence} />
          </div>
        </div>
      </div>

      {/* Schedule button for critical/warning */}
      {(urgency === 'critical' || urgency === 'warning') && (
        <button
          onClick={() => onSchedule(item)}
          className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${urgency === 'critical'
            ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
            : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
            }`}
        >
          <Calendar size={12} />
          {t('predictive.schedule_btn')}
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
};

const RiskMeter: React.FC<{ risk: 'Yüksek' | 'Orta' | 'Düşük' | 'High' | 'Medium' | 'Low' | null }> = ({ risk }) => {
  const { t } = useTranslation();
  const riskLabels: Record<string, string> = {
    'Yüksek': t('predictive.risk_high'), 'High': t('predictive.risk_high'),
    'Orta': t('predictive.risk_med'), 'Medium': t('predictive.risk_med'),
    'Düşük': t('predictive.risk_low'), 'Low': t('predictive.risk_low')
  };
  const config = {
    'Yüksek': { pct: 85, color: 'text-red-400', bg: 'bg-red-500' },
    'High': { pct: 85, color: 'text-red-400', bg: 'bg-red-500' },
    'Orta': { pct: 50, color: 'text-amber-400', bg: 'bg-amber-500' },
    'Medium': { pct: 50, color: 'text-amber-400', bg: 'bg-amber-500' },
    'Düşük': { pct: 20, color: 'text-emerald-400', bg: 'bg-emerald-500' },
    'Low': { pct: 20, color: 'text-emerald-400', bg: 'bg-emerald-500' },
  };
  if (!risk) return null;
  const c = (config as any)[risk];
  if (!c) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${c.bg} rounded-full transition-all duration-1000`} style={{ width: `${c.pct}%` }} />
      </div>
      <span className={`text-sm font-bold ${c.color}`}>{riskLabels[risk] || risk}</span>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const PredictiveMaintenance: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [aiResult, setAiResult] = useState<AIPredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'soon' | 'ok'>('all');

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [v, l] = await Promise.all([fetchVehicles(), fetchLogs()]);
      setVehicles(v);
      setLogs(l);
      if (v.length > 0) setSelectedVehicleId(v[0].id);
      setLoading(false);
    };
    load();
  }, []);

  // When vehicle changes, run AI analysis
  useEffect(() => {
    if (!selectedVehicleId || logs.length === 0) return;
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleId, logs]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const runAnalysis = async () => {
    if (!selectedVehicle) return;
    setAnalyzing(true);
    setPredictions([]);
    setAiResult(null);

    // Get AI predictions
    const result = await getPredictiveMaintenance(selectedVehicle, logs, t('predictive.ai_prompt_lang'));
    setAiResult(result);

    // Build prediction cards from AI result or fallback
    const now = new Date();
    const built: MaintenancePrediction[] = [];

    const itemsToShow = result?.predictions
      ? result.predictions.map(p => p.item)
      : Object.keys(SERVICE_INTERVALS);

    for (const itemName of itemsToShow) {
      const interval = SERVICE_INTERVALS[itemName];
      if (!interval) continue;

      const { km: lastKm, date: lastDate } = getLastServiceInfo(logs, selectedVehicleId, itemName);
      const aiPrediction = result?.predictions.find(p => p.item === itemName);

      const urgency = aiPrediction?.urgencyLevel || (() => {
        if (!lastKm) return 'warning';
        const kmSince = selectedVehicle.mileage - lastKm;
        const pct = kmSince / interval.km;
        if (pct >= 1.0) return 'critical';
        if (pct >= 0.85) return 'warning';
        if (pct >= 0.65) return 'soon';
        return 'ok';
      })();

      const estimatedKm = aiPrediction?.estimatedKm || (lastKm ? lastKm + interval.km : selectedVehicle.mileage + Math.round(interval.km * 0.3));
      const estimatedDate = addMonths(now, aiPrediction?.estimatedMonths ?? interval.months / 2, { language: t('predictive.ai_prompt_lang') === 'Türkçe' ? 'tr' : 'en' });

      built.push({
        item: itemName,
        icon: interval.icon,
        iconColor: interval.iconColor,
        urgency: urgency as MaintenancePrediction['urgency'],
        estimatedDate,
        estimatedKm,
        currentKm: selectedVehicle.mileage,
        intervalKm: interval.km,
        lastDoneKm: lastKm,
        lastDoneDate: lastDate,
        confidence: aiPrediction?.confidence ?? 60,
        aiReason: aiPrediction?.reasoning ?? t('predictive.reason_default'),
      });
    }

    // Sort: critical first, then warning, then soon, then ok
    const urgencyOrder = { critical: 0, warning: 1, soon: 2, ok: 3 };
    built.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
    setPredictions(built);
    setAnalyzing(false);
  };

  const handleSchedule = (item: string) => {
    navigate('/add-record', { state: { serviceType: item } });
  };

  const filtered = activeFilter === 'all'
    ? predictions
    : predictions.filter(p => p.urgency === activeFilter);

  const counts = {
    critical: predictions.filter(p => p.urgency === 'critical').length,
    warning: predictions.filter(p => p.urgency === 'warning').length,
    soon: predictions.filter(p => p.urgency === 'soon').length,
    ok: predictions.filter(p => p.urgency === 'ok').length,
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
            <Brain className="text-purple-400 animate-pulse" size={24} />
          </div>
          <p className="text-slate-400 text-sm">{t('predictive.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{t('predictive.title')}</h1>
            <p className="text-slate-500 text-xs">{t('predictive.subtitle')}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-1.5">
            <Brain size={12} className="text-purple-400" />
            <span className="text-purple-300 text-xs font-medium">AI</span>
          </div>
        </div>

        {/* Vehicle selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {vehicles.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${selectedVehicleId === v.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                }`}
            >
              <span>{v.brand} {v.model}</span>
              {selectedVehicleId === v.id && (
                <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px]">
                  {formatKmValue(v.mileage, { language: t('predictive.ai_prompt_lang') === 'Türkçe' ? 'tr' : 'en' })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* AI Analysis summary card */}
        {(analyzing || aiResult) && (
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/30 to-slate-800/30 border border-purple-500/20 p-5">
            {analyzing ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Brain size={20} className="text-purple-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t('predictive.ai_analyzing')}</p>
                  <p className="text-slate-400 text-xs">{t('predictive.ai_processing')}</p>
                </div>
              </div>
            ) : aiResult && (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Brain size={20} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold text-sm">{t('predictive.ai_evaluation')}</p>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{aiResult.summary}</p>
                  </div>
                </div>
                <RiskMeter risk={aiResult.overallRisk} />
              </>
            )}
          </div>
        )}

        {/* Stats row */}
        {!analyzing && predictions.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'critical', label: t('predictive.filter_critical_short'), color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
              { key: 'warning', label: t('predictive.filter_warning_short'), color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
              { key: 'soon', label: t('predictive.filter_soon_short'), color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { key: 'ok', label: t('predictive.filter_ok_short'), color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            ].map(({ key, label, color, bg, border }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(activeFilter === key ? 'all' : key as typeof activeFilter)}
                className={`rounded-xl ${bg} border ${border} p-2.5 text-center transition-all ${activeFilter === key ? 'ring-1 ring-white/20 scale-95' : ''
                  }`}
              >
                <p className={`text-xl font-bold ${color}`}>{counts[key as keyof typeof counts]}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{label}</p>
              </button>
            ))}
          </div>
        )}

        {/* Filter chips */}
        {!analyzing && predictions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {([
              { key: 'all', label: t('predictive.filter_all') },
              { key: 'critical', label: `🔴 ${t('predictive.filter_critical_short')}` },
              { key: 'warning', label: `🟡 ${t('predictive.filter_warning_short')}` },
              { key: 'soon', label: `🔵 ${t('predictive.filter_soon_short')}` },
              { key: 'ok', label: `🟢 ${t('predictive.filter_ok_short')}` },
            ] as const).map(({ key, label }) => (
              <button

                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === key
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Prediction cards */}
        {analyzing ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/30" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((pred, idx) => (
              <PredictionCard
                key={`${pred.item}-${idx}`}
                prediction={pred}
                onSchedule={handleSchedule}
              />
            ))}
          </div>
        )}

        {/* Refresh button */}
        {!analyzing && predictions.length > 0 && (
          <button
            onClick={runAnalysis}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800/40 border border-slate-700/30 text-slate-400 text-sm hover:bg-slate-700/40 transition-all"
          >
            <RefreshCw size={14} />
            {t('predictive.refresh_btn')}
          </button>
        )}

        {/* No vehicle */}
        {vehicles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
              <Brain size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400">{t('predictive.not_found')}</p>
            <button
              onClick={() => navigate('/add-vehicle')}
              className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium"
            >
              Araç Ekle
            </button>
          </div>
        )}

        {/* Info note */}
        {!analyzing && predictions.length > 0 && (
          <div className="flex items-start gap-2 bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
            <Info size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-slate-500 text-xs leading-relaxed">
              {t('predictive.disclaimer')}
            </p>
          </div>
        )}

        {/* Google Ad Placement */}
        <AdBanner slotId="7103291209" format="fluid" layoutKey="-gw-3+1f-3d+2z" />
      </div>
    </div>
  );
};
