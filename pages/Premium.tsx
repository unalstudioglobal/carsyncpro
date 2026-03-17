import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { usePremium } from '../context/PremiumContext';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Check, Crown, Zap, Shield, Car, BarChart2,
  Star, X, Users, Lock, ArrowRightLeft, FileDown, Sparkles,
  AlertCircle, Brain, Wrench, Bell, Building2, ChevronRight,
  Infinity as InfinityIcon, CheckCircle2
} from 'lucide-react';
import { toast } from '../services/toast';
import { initializeIyzicoPayment, type PlanKey } from '../services/premiumService';

// ── Fiyat & Plan tanımları ────────────────────────────────

type Billing = 'monthly' | 'yearly';
type Tier    = 'individual' | 'family' | 'fleet';

interface PlanDef {
  tier: Tier;
  label: string;
  description: string;
  monthlyPrice: number;  // aylık fiyat
  yearlyPrice: number;   // yıllık fiyat (toplam)
  icon: React.ElementType;
  color: string;
  gradient: string;
  ring: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  limits: {
    vehicles: string;
    users: string;
    aiCalls: string;
    reports: string;
    storage: string;
  };
}

const getPlans = (t: any): PlanDef[] => [
  {
    tier: 'individual',
    label: t('premium_plans.individual_label'),
    description: t('premium_plans.individual_desc'),
    monthlyPrice: 99,
    yearlyPrice: 999,
    icon: Car,
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-600',
    ring: 'ring-amber-500/40',
    highlight: true,
    badge: t('premium_plans.popular_badge'),
    limits: { 
      vehicles: t('premium_plans.limits_vehicles', { count: 10 }), 
      users: t('premium_plans.limits_users', { count: 1 }), 
      aiCalls: t('premium_plans.unlimited'), 
      reports: t('premium_plans.unlimited'), 
      storage: t('premium_plans.limits_storage', { count: 5 }) 
    },
    features: [
      t('premium_plans.feat_ai_unlimited'),
      t('premium_plans.feat_predictive'),
      t('premium_plans.feat_obd'),
      t('premium_plans.feat_acoustic'),
      t('premium_plans.feat_pdf'),
      t('premium_plans.feat_insurance'),
      t('premium_plans.feat_smart_notif'),
      t('premium_plans.feat_ai_insight_full'),
    ],
  },
  {
    tier: 'family',
    label: t('premium_plans.family_label'),
    description: t('premium_plans.family_desc'),
    monthlyPrice: 199,
    yearlyPrice: 1999,
    icon: Users,
    color: 'text-violet-400',
    gradient: 'from-violet-500 to-purple-600',
    ring: 'ring-violet-500/40',
    badge: t('premium_plans.users_badge', { count: 5 }),
    limits: { 
      vehicles: t('premium_plans.limits_vehicles', { count: 20 }), 
      users: t('premium_plans.limits_users', { count: 5 }), 
      aiCalls: t('premium_plans.limits_ai', { count: 300 }), 
      reports: t('premium_plans.unlimited'), 
      storage: t('premium_plans.limits_storage', { count: 15 }) 
    },
    features: [
      t('premium_plans.feat_individual_all'),
      t('premium_plans.feat_family_garage'),
      t('premium_plans.feat_user_accounts', { count: 5 }),
      t('premium_plans.feat_vehicle_support', { count: 20 }),
      t('premium_plans.feat_budget_tracking'),
      t('premium_plans.feat_personal_notif'),
      t('premium_plans.feat_roles'),
      t('premium_plans.feat_docs'),
    ],
  },
  {
    tier: 'fleet',
    label: t('premium_plans.fleet_label'),
    description: t('premium_plans.fleet_desc'),
    monthlyPrice: 699,
    yearlyPrice: 6999,
    icon: Building2,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-600',
    ring: 'ring-cyan-500/40',
    limits: { 
      vehicles: t('premium_plans.unlimited'), 
      users: t('premium_plans.limits_users', { count: 10 }), 
      aiCalls: t('premium_plans.unlimited'), 
      reports: t('premium_plans.unlimited'), 
      storage: t('premium_plans.limits_storage', { count: 100 }) 
    },
    features: [
      t('premium_plans.feat_family_all'),
      t('premium_plans.feat_fleet_unlimited'),
      t('premium_plans.feat_fleet_dashboard'),
      t('premium_plans.feat_bulk_pdf'),
      t('premium_plans.feat_driver_mgt'),
      t('premium_plans.feat_sla_service'),
      t('premium_plans.feat_api_soon'),
      t('premium_plans.feat_priority_support'),
      t('premium_plans.feat_onboarding'),
    ],
  },
];

const getComparisonRows = (t: any) => [
  { label: t('premium_plans.vehicles_limit'), individual: '10',  family: '20', fleet: t('premium_plans.unlimited'), icon: Car },
  { label: t('premium_plans.users_limit'),    individual: '1',   family: '5',  fleet: '10+', icon: Users },
  { label: t('premium_plans.ai_calls'),       individual: t('premium_plans.unlimited'), family: t('premium_plans.unlimited'), fleet: t('premium_plans.unlimited'), icon: Brain },
  { label: t('premium_plans.compare_service_record'), individual: '✓', family: '✓', fleet: '✓', icon: Wrench },
  { label: t('premium_plans.compare_damage_ai'),      individual: '✓', family: '✓', fleet: '✓', icon: Sparkles },
  { label: t('premium_plans.compare_pdf_report'),     individual: '✓', family: '✓', fleet: '✓', icon: FileDown },
  { label: t('premium_plans.compare_family_garage'),  individual: '✗', family: '✓', fleet: '✓', icon: Users },
  { label: t('premium_plans.compare_fleet_dashboard'), individual: '✗', family: '✗', fleet: '✓', icon: BarChart2 },
  { label: t('premium_plans.compare_api_access'),      individual: '✗', family: '✗', fleet: t('premium_plans.compare_soon'), icon: Zap },
];

// ── Yardımcı bileşenler ───────────────────────────────────

const FeatureRow: React.FC<{ label: string; individual: string; family: string; fleet: string; icon: React.ElementType; activeCol: Tier }> = ({
  label, individual, family, fleet, icon: Icon, activeCol
}) => {
  const cell = (val: string, col: Tier) => {
    const active = col === activeCol;
    if (val === '✓') return <div className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto ${active ? 'bg-amber-500/20' : 'bg-white/5'}`}><Check size={11} className={active ? 'text-amber-400' : 'text-white/40'} /></div>;
    if (val === '✗') return <X size={13} className="text-white/20 mx-auto" />;
    return <span className={`text-xs font-bold ${active ? 'text-white' : 'text-white/50'}`}>{val}</span>;
  };
  return (
    <div className="grid grid-cols-4 border-b border-white/5 last:border-0">
      <div className="p-3 flex items-center gap-2">
        <Icon size={12} className="text-white/30 flex-shrink-0" />
        <span className="text-[11px] text-white/60">{label}</span>
      </div>
      <div className="p-3 flex items-center justify-center border-l border-white/5">{cell(individual, 'individual')}</div>
      <div className="p-3 flex items-center justify-center border-l border-white/5 bg-white/[0.02]">{cell(family, 'family')}</div>
      <div className="p-3 flex items-center justify-center border-l border-white/5">{cell(fleet, 'fleet')}</div>
    </div>
  );
};

// ── Ana Bileşen ───────────────────────────────────────────

export const Premium: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [billing, setBilling]     = useState<Billing>('yearly');
  const [selected, setSelected]   = useState<Tier>('individual');
  const [isLoading, setIsLoading] = useState(false);
  const [showIyzico, setShowIyzico] = useState(false);
  const { isPremium, profile, refresh } = usePremium();

  // Callback URL'inden durum yakala
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const status = params.get('status');
    const plan   = params.get('plan') || '';
    if (status === 'success') {
      const tierKey = plan.startsWith('family') ? 'family' : plan.startsWith('fleet') ? 'fleet' : 'individual';
      const tierLabel = t(`premium_plans.${tierKey}_label`);
      toast.success(t(`premium_plans.success_${tierKey}`));
      refresh();
      navigate('/');
    } else if (status === 'failed') {
      toast.error(t('premium_plans.failed'));
    }
  }, [refresh, navigate, t]);

  const plans      = getPlans(t);
  const comparisonRows = getComparisonRows(t);
  const activePlan = plans.find(p => p.tier === selected)!;
  const price      = billing === 'yearly' ? activePlan.yearlyPrice : activePlan.monthlyPrice;
  const monthlyEq  = billing === 'yearly' ? Math.round(activePlan.yearlyPrice / 12) : activePlan.monthlyPrice;
  const savings    = Math.round((1 - activePlan.yearlyPrice / 12 / activePlan.monthlyPrice) * 100);
  const planKey: PlanKey = `${selected}-${billing}` as PlanKey;

  const handleSubscribe = async () => {
    if (isPremium) { navigate(-1); return; }
    setIsLoading(true);
    try {
      const { checkoutFormContent } = await initializeIyzicoPayment(planKey);
      const container = document.getElementById('iyzico-form-container');
      if (container) {
        setShowIyzico(true);
        container.innerHTML = checkoutFormContent;
        const scripts = container.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
          const s = document.createElement('script');
          s.text = scripts[i].text;
          document.body.appendChild(s);
        }
      }
    } catch (err: any) {
      toast.error(err.message || t('premium_plans.redirecting')); // Fallback to redirecting if no msg
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col">

      {/* Arka plan efektleri */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-amber-500/15 via-violet-500/5 to-transparent pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-24 w-64 h-64 bg-violet-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-5 pt-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>
        {isPremium && (
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <Crown size={12} className="fill-amber-400" />
            <span>{profile?.plan ? t('premium_plans.active_btn') : t('premium_plans.active_btn')}</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-48 relative z-10 space-y-8">

        {/* Hero */}
        <div className="text-center pt-2 space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-300 to-amber-600 shadow-2xl shadow-amber-500/40 mb-1 rotate-3">
            <Crown size={38} className="text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white via-amber-200 to-amber-500 bg-clip-text text-transparent">
              CarSync Pro
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 max-w-[280px] mx-auto leading-relaxed">
              {t('premium_plans.hero_desc')}
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="flex -space-x-2">
              {['Felix', 'Sara', 'Max', 'Anna'].map(s => (
                <img key={s} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`} className="w-8 h-8 rounded-full border-2 border-slate-900" />
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5"><Trans i18nKey="premium_plans.users_count" components={{ b: <span className="text-white font-bold" /> }} /></p>
            </div>
          </div>
        </div>

        {/* Fatura döngüsü toggle */}
        <div className="bg-slate-900/80 p-1.5 rounded-xl flex border border-white/5 max-w-xs mx-auto">
          <button
            onClick={() => setBilling('monthly')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${billing === 'monthly' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t('premium_plans.billing_monthly')}
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all relative ${billing === 'yearly' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t('premium_plans.billing_yearly')}
            <span className="absolute -top-3 -right-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full border border-slate-900 font-black">
              {t('premium_plans.save_badge', { pct: savings })}
            </span>
          </button>
        </div>

        {/* Plan kartları */}
        <div className="space-y-3">
          {plans.map(plan => {
            const isSelected = selected === plan.tier;
            const planPrice  = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const perMonth   = billing === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
            const Icon = plan.icon;

            return (
              <button
                key={plan.tier}
                onClick={() => setSelected(plan.tier)}
                className={`w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? `ring-2 ${plan.ring} border-transparent bg-white/5`
                    : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                {/* Gradient top line when selected */}
                {isSelected && (
                  <div className={`h-0.5 w-full bg-gradient-to-r ${plan.gradient}`} />
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? `bg-gradient-to-br ${plan.gradient}` : 'bg-white/8'}`}>
                        <Icon size={20} className={isSelected ? 'text-white' : 'text-white/50'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-base ${isSelected ? 'text-white' : 'text-white/70'}`}>{plan.label}</p>
                          {plan.badge && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? `bg-gradient-to-r ${plan.gradient} text-white` : 'bg-white/10 text-white/50'}`}>
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5 leading-tight">{plan.description}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xs text-white/40">₺</span>
                        <span className={`text-2xl font-black leading-none ${isSelected ? 'text-white' : 'text-white/60'}`}>
                          {billing === 'yearly' ? perMonth : planPrice}
                        </span>
                        <span className="text-[10px] text-white/30">{t('premium_plans.per_month')}</span>
                      </div>
                      {billing === 'yearly' && (
                        <p className="text-[10px] text-white/30 mt-0.5">₺{planPrice}{t('premium_plans.per_year')}</p>
                      )}
                    </div>
                  </div>

                  {/* Sınırlar özeti */}
                  <div className={`mt-3 flex flex-wrap gap-2 ${isSelected ? '' : 'opacity-50'}`}>
                    {Object.entries(plan.limits).map(([k, v]) => (
                      <span key={k} className="text-[10px] bg-white/8 rounded-full px-2 py-0.5 text-white/60 font-medium">
                        {v}
                      </span>
                    ))}
                  </div>

                  {/* Özellikler (sadece seçiliyse) */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-1 gap-1.5">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 size={13} className={plan.color} />
                          <span className="text-xs text-white/70">{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Karşılaştırma tablosu */}
        <div>
          <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center mb-4">
            {t('premium_plans.compare_title')}
          </h2>
          <div className="rounded-2xl border border-white/8 overflow-hidden bg-white/[0.02]">
            {/* Başlık satırı */}
            <div className="grid grid-cols-4 border-b border-white/8 bg-white/[0.03]">
              <div className="p-3 text-[10px] text-white/30 font-bold uppercase tracking-wide">{t('premium_plans.vehicles_limit')}</div>
              {plans.map(p => (
                <button
                  key={p.tier}
                  onClick={() => setSelected(p.tier)}
                  className={`p-3 text-[10px] font-bold text-center border-l border-white/8 transition ${selected === p.tier ? p.color : 'text-white/30 hover:text-white/50'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {comparisonRows.map((row, i) => (
              <FeatureRow key={i} {...row} activeCol={selected} />
            ))}
          </div>
        </div>

        {/* Seçilen plan fiyat özeti */}
        <div className={`bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 text-center relative overflow-hidden ring-1 ${activePlan.ring}`}>
          <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${activePlan.gradient}`} />

          {billing === 'yearly' && (
            <div className="inline-flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
              <Check size={11} />
              <span>{t('premium_plans.savings_note', { amount: activePlan.monthlyPrice * 12 - activePlan.yearlyPrice })}</span>
            </div>
          )}

          <p className="text-xs text-white/40 mb-1">{activePlan.label} Plan · {billing === 'yearly' ? t('premium_plans.billing_yearly') : t('premium_plans.billing_monthly')}</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-lg text-white/40 self-start mt-2">₺</span>
            <span className="text-6xl font-black text-white tracking-tight leading-none">{price}</span>
            <span className="text-white/40 text-sm font-medium self-end mb-1">
              {billing === 'yearly' ? t('premium_plans.per_year') : t('premium_plans.per_month')}
            </span>
          </div>
          {billing === 'yearly' && (
            <p className="text-xs text-amber-400/80 mt-2 font-medium">
              {t('premium_plans.yearly_equiv', { amount: monthlyEq, pct: savings })}
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-center gap-2 text-xs text-white/40">
            <Shield size={13} className="text-green-400" />
            <span>{t('premium_plans.guarantee')}</span>
          </div>
        </div>

        {/* Güven rozetleri */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: Shield,   label: t('premium_plans.guarantee').replace(' ', '\n'),       color: 'text-green-400' },
            { icon: Lock,     label: `${t('premium_plans.ssl')}\nSSL`,       color: 'text-blue-400'  },
            { icon: Star,     label: t('premium_plans.users_count'), color: 'text-amber-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-3">
              <Icon size={20} className={`${color} mx-auto mb-1.5`} />
              <p className="text-[10px] text-white/40 font-medium leading-tight whitespace-pre-line">{label}</p>
            </div>
          ))}
        </div>

        {/* Iyzico ödeme modalı */}
        {showIyzico && (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col p-5 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Shield className="text-amber-500" />
                <span>{t('settings.payment_redirect')}</span>
              </h2>
              <button
                onClick={() => { setShowIyzico(false); const c = document.getElementById('iyzico-form-container'); if (c) c.innerHTML = ''; }}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"
              >
                <X />
              </button>
            </div>
            <div id="iyzico-form-container" className="flex-1 overflow-y-auto bg-white rounded-2xl p-2 min-h-[400px]" />
          </div>
        )}

        {!showIyzico && <div id="iyzico-form-container" className="hidden" />}
      </div>

      {/* Sticky alt CTA */}
      <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-20 pb-8 space-y-3">

        {/* Plan özet satırı */}
        {!isPremium && (
          <div className="flex items-center justify-between bg-white/5 border border-white/8 rounded-2xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <activePlan.icon size={16} className={activePlan.color} />
              <span className="text-sm font-bold text-white">{activePlan.label}</span>
              <span className="text-xs text-white/40">{billing === 'yearly' ? t('premium_plans.billing_yearly') : t('premium_plans.billing_monthly')}</span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xs text-white/40">₺</span>
              <span className="text-xl font-black text-white">{price}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className={`w-full font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
            isPremium
              ? 'bg-slate-800 text-slate-300 border border-slate-700'
              : `bg-gradient-to-r ${activePlan.gradient} text-white`
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('premium_plans.redirecting')}</span>
            </>
          ) : isPremium ? (
            <><Crown size={18} className="fill-amber-400 text-amber-400" /><span>{t('premium_plans.active_btn')}</span></>
          ) : (
            <><Zap size={20} className="fill-white" /><span>{t('premium_plans.start_btn')}</span></>
          )}
        </button>
        <p className="text-[10px] text-center text-slate-600">
          {t('premium_plans.footer_note')}
        </p>
      </div>
    </div>
  );
};
