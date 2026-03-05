import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Camera, Upload, X, Scan, AlertTriangle,
  CheckCircle2, Info, ZoomIn, RotateCw, TrendingUp,
  Wrench, ShieldAlert, CircleDollarSign, Eye, RefreshCw,
  ChevronDown, ChevronUp, Sparkles, ImagePlus, FileImage
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// ─── Types ───────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'major' | 'minor' | 'none';

interface DamageItem {
  area: string;
  description: string;
  severity: Severity;
  estimatedCostMin: number;
  estimatedCostMax: number;
  repairType: 'paintwork' | 'bodywork' | 'glass' | 'mechanical' | 'cosmetic' | 'none';
  repairTimeHours: number;
  diyPossible: boolean;
}

interface DamageReport {
  overallCondition: 'Mükemmel' | 'İyi' | 'Orta' | 'Kötü' | 'Hasarlı';
  conditionScore: number; // 0-100
  damages: DamageItem[];
  totalCostMin: number;
  totalCostMax: number;
  priorityAction: string;
  safetyRisk: boolean;
  summary: string;
  recommendations: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = (t: any): Record<Severity, {
  label: string; bg: string; border: string; text: string; badge: string; icon: React.ElementType
}> => ({
  critical: { label: t('damageDetect.sev_crit'), bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300', icon: AlertTriangle },
  major: { label: t('damageDetect.sev_maj'), bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300', icon: ShieldAlert },
  minor: { label: t('damageDetect.sev_min'), bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300', icon: Info },
  none: { label: t('damageDetect.sev_none'), bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', icon: CheckCircle2 },
});

const REPAIR_TYPE_LABELS = (t: any): Record<string, string> => ({
  paintwork: t('damageDetect.rep_paint'),
  bodywork: t('damageDetect.rep_body'),
  glass: t('damageDetect.rep_glass'),
  mechanical: t('damageDetect.rep_mech'),
  cosmetic: t('damageDetect.rep_cosm'),
  none: t('damageDetect.rep_none'),
});

// ─── AI Analysis ─────────────────────────────────────────────────────────────

const analyzeDamageFromImage = async (base64Image: string, mimeType: string): Promise<DamageReport | null> => {
  if (!navigator.onLine || !process.env.API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Sen bir uzman araç hasar değerlendirme uzmanısın. Bu araç fotoğrafını dikkatlice incele.

Görüntüdeki her türlü hasarı, çizik, göçük, pas, cam kırığı, boya hasarı, kaporta deformasyonu ve diğer sorunları tespit et.

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "overallCondition": "Mükemmel|İyi|Orta|Kötü|Hasarlı",
  "conditionScore": 0-100 arası sayı,
  "damages": [
    {
      "area": "hasar bölgesi (örn: Ön tampon sol köşe)",
      "description": "hasarın kısa Türkçe açıklaması",
      "severity": "critical|major|minor|none",
      "estimatedCostMin": minimum onarım maliyeti TL olarak (sayı),
      "estimatedCostMax": maksimum onarım maliyeti TL olarak (sayı),
      "repairType": "paintwork|bodywork|glass|mechanical|cosmetic|none",
      "repairTimeHours": tahmini onarım süresi saat olarak (sayı),
      "diyPossible": true veya false
    }
  ],
  "totalCostMin": toplam minimum maliyet TL,
  "totalCostMax": toplam maksimum maliyet TL,
  "priorityAction": "önce yapılması gereken işlem (Türkçe, 1 cümle)",
  "safetyRisk": true veya false (güvenlik riski var mı),
  "summary": "genel değerlendirme özeti (Türkçe, 2-3 cümle)",
  "recommendations": ["öneri 1", "öneri 2", "öneri 3"]
}

Önemli notlar:
- Türkiye piyasa fiyatlarını kullan
- Eğer hasar göremiyorsan damages dizisi boş olabilir ama en az 1 eleman olmalı (none severity ile)
- conditionScore: 90-100 mükemmel, 70-89 iyi, 50-69 orta, 30-49 kötü, 0-29 çok hasarlı
- Sadece JSON döndür`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
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
  } catch (err: any) {
    console.error('Damage analysis error:', err);
    return null;
  }
};

// ─── Sub Components ──────────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="text-center">
        <p className="text-2xl font-bold text-white">{score}</p>
        <p className="text-slate-500 text-[10px]">/ 100</p>
      </div>
    </div>
  );
};

const DamageCard: React.FC<{ damage: DamageItem; index: number; t: any }> = ({ damage, index, t }) => {
  const [expanded, setExpanded] = useState(index === 0);
  const cfgRaw = SEVERITY_CONFIG(t)[damage.severity];
  const cfg = {
    ...cfgRaw,
    label: cfgRaw.label
  };
  const SevIcon = cfg.icon;

  return (
    <div className={`rounded-2xl border ${cfg.bg} ${cfg.border} overflow-hidden transition-all duration-300`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
          <SevIcon size={16} className={cfg.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-semibold text-sm truncate">{damage.area}</p>
            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-slate-400 text-xs truncate">{damage.description}</p>
        </div>
        <div className="flex-shrink-0 ml-2">
          {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/30 pt-3">
          {/* Repair type & DIY */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-slate-700/60 text-slate-300 px-2.5 py-1 rounded-full">
              {REPAIR_TYPE_LABELS(t)[damage.repairType]}
            </span>
            <span className="text-xs bg-slate-700/60 text-slate-300 px-2.5 py-1 rounded-full">
              ⏱ {t('damageDetect.hours', { h: damage.repairTimeHours })}
            </span>
            {damage.diyPossible && (
              <span className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                {t('damageDetect.diy')}
              </span>
            )}
          </div>

          {/* Cost estimate */}
          {damage.severity !== 'none' && (
            <div className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleDollarSign size={14} className="text-slate-400" />
                <p className="text-slate-400 text-xs">{t('damageDetect.est_cost')}</p>
              </div>
              <p className="text-white font-bold text-sm">
                ₺{damage.estimatedCostMin.toLocaleString('tr-TR')}
                <span className="text-slate-400 font-normal"> – </span>
                ₺{damage.estimatedCostMax.toLocaleString('tr-TR')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const DamageDetection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<DamageReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllDamages, setShowAllDamages] = useState(false);

  const [showJson, setShowJson] = useState(false);

  const processFile = useCallback((file: File) => {
    setReport(null);
    setError(null);
    setImageMime(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      // Extract base64 data part
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) processFile(file);
  }, [processFile]);

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setAnalyzing(true);
    setError(null);
    setReport(null);

    const result = await analyzeDamageFromImage(imageBase64, imageMime);
    if (result) {
      setReport(result);
    } else {
      setError(t('damageDetect.err_title'));
    }
    setAnalyzing(false);
  };

  const reset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setReport(null);
    setError(null);
    setShowAllDamages(false);
  };

  const conditionColor = report
    ? report.conditionScore >= 80 ? 'text-emerald-400'
      : report.conditionScore >= 60 ? 'text-amber-400'
        : report.conditionScore >= 40 ? 'text-orange-400'
          : 'text-red-400'
    : '';

  const visibleDamages = showAllDamages ? report?.damages : report?.damages.slice(0, 3);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <ChevronLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{t('damageDetect.title')}</h1>
            <p className="text-slate-500 text-xs">{t('damageDetect.subtitle')}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-1.5">
            <Eye size={12} className="text-rose-400" />
            <span className="text-rose-300 text-xs font-medium">AI Vision</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Upload area */}
        {!imagePreview ? (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="rounded-3xl border-2 border-dashed border-slate-700 bg-slate-800/20 p-8 text-center transition-all hover:border-slate-600 hover:bg-slate-800/30 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-700/60 flex items-center justify-center mx-auto mb-4">
              <ImagePlus size={28} className="text-slate-400" />
            </div>
            <p className="text-white font-semibold mb-1">{t('damageDetect.upload_title')}</p>
            <p className="text-slate-500 text-sm mb-4">{t('damageDetect.upload_desc')}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600 transition-all"
              >
                <Upload size={14} />
                {t('damageDetect.gallery')}
              </button>
              <button
                onClick={e => { e.stopPropagation(); cameraRef.current?.click(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-500 transition-all"
              >
                <Camera size={14} />
                {t('damageDetect.camera')}
              </button>
            </div>
            <p className="text-slate-600 text-xs mt-4">{t('damageDetect.reqs')}</p>
          </div>
        ) : (
          /* Image preview */
          <div className="relative rounded-2xl overflow-hidden flex items-center justify-center bg-slate-900 min-h-[200px]">
            {imagePreview ? (
              <img src={imagePreview} alt="Araç" className="w-full max-h-72 object-cover rounded-2xl" />
            ) : (
              <FileImage size={48} className="text-slate-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent rounded-2xl" />
            <button
              onClick={reset}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center"
            >
              <X size={16} className="text-white" />
            </button>
            {!report && !analyzing && (
              <div className="absolute bottom-3 left-3 right-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-full"
                >
                  <RotateCw size={11} />
                  {t('damageDetect.diff_photo')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hidden inputs */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

        {/* Analyze button */}
        {imagePreview && !report && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-sm transition-all ${analyzing
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-rose-600 to-orange-600 text-white hover:from-rose-500 hover:to-orange-500 shadow-lg shadow-rose-500/20'
              }`}
          >
            {analyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
                {t('damageDetect.analyzing_ai')}
              </>
            ) : (
              <>
                <Scan size={18} />
                {t('damageDetect.btn_detect')}
              </>
            )}
          </button>
        )}

        {/* Analyzing skeleton */}
        {analyzing && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-gradient-to-br from-rose-900/20 to-slate-800/20 border border-rose-500/20 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <Eye size={18} className="text-rose-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t('damageDetect.analyzing_img')}</p>
                  <p className="text-slate-400 text-xs">{t('damageDetect.analyzing_scan')}</p>
                </div>
              </div>
              <div className="space-y-2">
                {[t('damageDetect.step_1'), t('damageDetect.step_2'), t('damageDetect.step_3')].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                    <p className="text-slate-400 text-xs">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/30" />)}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium text-sm mb-1">{t('damageDetect.err_title')}</p>
              <p className="text-red-400/70 text-xs">{error}</p>
              <button onClick={handleAnalyze} className="mt-2 flex items-center gap-1.5 text-xs text-red-300 hover:text-red-200">
                <RefreshCw size={11} /> {t('damageDetect.err_retry')}
              </button>
            </div>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="space-y-5">
            <div className="flex justify-end">
              <button
                onClick={() => setShowJson(!showJson)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 transition-colors"
              >
                {showJson ? t('damageDetect.show_visual') : t('damageDetect.show_json')}
              </button>
            </div>

            {showJson ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700/50 p-4 overflow-x-auto">
                <pre className="text-emerald-400 text-xs font-mono leading-relaxed">
                  {JSON.stringify(report, null, 2)}
                </pre>
              </div>
            ) : (
              <>
                {/* Overall condition card */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-800/20 border border-slate-700/40 p-5">
                  <div className="flex items-center gap-5">
                    <ScoreRing score={report.conditionScore} />
                    <div className="flex-1">
                      <p className={`text-xl font-bold ${conditionColor} mb-1`}>{report.overallCondition}</p>
                      <p className="text-slate-400 text-xs leading-relaxed mb-3">{report.summary}</p>
                      {report.safetyRisk && (
                        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1.5">
                          <AlertTriangle size={12} className="text-red-400" />
                          <p className="text-red-300 text-xs font-medium">{t('damageDetect.safety_risk')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total cost */}
                {report.totalCostMax > 0 && (
                  <div className="rounded-2xl bg-slate-800/40 border border-slate-700/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                        <CircleDollarSign size={18} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">{t('damageDetect.total_cost')}</p>
                        <p className="text-white font-bold">
                          ₺{report.totalCostMin.toLocaleString('tr-TR')} – ₺{report.totalCostMax.toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Priority action */}
                {report.priorityAction && (
                  <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-start gap-3">
                    <ShieldAlert size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-rose-300 text-xs font-semibold mb-0.5">{t('damageDetect.priority_action')}</p>
                      <p className="text-slate-300 text-sm">{report.priorityAction}</p>
                    </div>
                  </div>
                )}

                {/* Damage list */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-bold text-sm">
                      {t('damageDetect.detected_damages')}
                      <span className="ml-2 text-xs text-slate-500 font-normal">({report.damages.length})</span>
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {visibleDamages?.map((d, i) => (
                      <DamageCard key={i} damage={d} index={i} t={t} />
                    ))}
                  </div>
                  {report.damages.length > 3 && (
                    <button
                      onClick={() => setShowAllDamages(!showAllDamages)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30 text-slate-400 text-xs"
                    >
                      {showAllDamages ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {showAllDamages ? t('damageDetect.show_less') : t('damageDetect.show_more', { c: report.damages.length - 3 })}
                    </button>
                  )}
                </div>

                {/* Recommendations */}
                {report.recommendations.length > 0 && (
                  <div className="rounded-2xl bg-slate-800/40 border border-slate-700/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-purple-400" />
                      <p className="text-white font-semibold text-sm">{t('damageDetect.ai_recs')}</p>
                    </div>
                    <div className="space-y-2">
                      {report.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-purple-400 text-[9px] font-bold">{i + 1}</span>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New analysis button */}
                <button
                  onClick={reset}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 text-white font-semibold text-sm hover:from-rose-500 hover:to-orange-500 transition-all shadow-lg shadow-rose-500/15"
                >
                  <Camera size={16} />
                  {t('damageDetect.new_analysis')}
                </button>

                {/* Disclaimer */}
                <div className="flex items-start gap-2 bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                  <Info size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    {t('damageDetect.disclaimer')}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
