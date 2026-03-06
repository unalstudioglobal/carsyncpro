import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { usePremium } from '../context/PremiumContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Crown, Zap, Shield, Car, BarChart2, Star, X, Users, Lock, ArrowRightLeft, FileDown, Sparkles } from 'lucide-react';
import { toast } from '../services/toast';

export const Premium: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const { isPremium, activate, cancel: cancelPremium } = usePremium();

  const handleSubscribe = async () => {
    if (isPremium) { navigate(-1); return; }
    setIsLoading(true);
    try {
      await activate(billingCycle);
      navigate('/');
    } catch (err) {
      console.error('Premium activation error:', err);
      toast.error(t('dashboard.msg_err'));
    } finally {
      setIsLoading(false);
    }
  };

  const MONTHLY_PRICE = 49;
  const YEARLY_PRICE = 499;
  const monthlyEquiv = Math.round(YEARLY_PRICE / 12);
  const savingsPct = Math.round((1 - monthlyEquiv / MONTHLY_PRICE) * 100);

  const rows = [
    { label: t('premium.feat1'), free: t('premium.feat1_free'), pro: t('premium.feat1_pro'), icon: Car },
    { label: t('premium.feat2'), free: t('premium.feat2_free'), pro: t('premium.feat1_pro'), icon: FileDown },
    { label: t('premium.feat3'), free: `3${t('premium.per_month')}`, pro: t('premium.feat1_pro'), icon: Sparkles },
    { label: t('premium.feat4'), free: false, pro: true, icon: ArrowRightLeft },
    { label: t('premium.feat5'), free: false, pro: true, icon: FileDown },
    { label: t('premium.feat6'), free: false, pro: true, icon: BarChart2 },
    { label: t('premium.feat7'), free: false, pro: true, icon: Shield },
    { label: t('premium.feat8'), free: false, pro: true, icon: Star },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col">
      <div className="absolute top-0 inset-x-0 h-[420px] bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-24 w-56 h-56 bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-10 p-5 pt-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition active:scale-95">
          <ChevronLeft size={24} />
        </button>
        {isPremium && (
          <span className="flex items-center space-x-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <Crown size={12} className="fill-amber-400" />
            <span>{t('premium.active_plan')}</span>
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-44 relative z-10 space-y-7">

        {/* Hero */}
        <div className="text-center pt-2 space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-300 to-amber-600 shadow-2xl shadow-amber-500/40 mb-1 rotate-3">
            <Crown size={38} className="text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white via-amber-200 to-amber-500 bg-clip-text text-transparent">CarSync Premium</h1>
            <p className="text-slate-400 text-sm mt-1.5 max-w-[260px] mx-auto leading-relaxed">{t('premium.desc')}</p>
          </div>
          <div className="flex items-center justify-center space-x-4 pt-1">
            <div className="flex -space-x-2">
              {['Felix', 'Sara', 'Max', 'Anna'].map(s => (
                <img key={s} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`} className="w-8 h-8 rounded-full border-2 border-slate-900" />
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-0.5">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5"><span className="text-white font-bold">12.000+</span> {t('premium.trusted_by')}</p>
            </div>
          </div>
        </div>

        {/* Toggle */}
        <div className="bg-slate-900/80 p-1.5 rounded-xl flex border border-white/5 max-w-xs mx-auto">
          <button onClick={() => setBillingCycle('monthly')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${billingCycle === 'monthly' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            {t('premium.monthly')}
          </button>
          <button onClick={() => setBillingCycle('yearly')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all relative ${billingCycle === 'yearly' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            {t('premium.yearly')}
            <span className="absolute -top-3 -right-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full border border-slate-900 font-black">{t('premium.discount', { pct: savingsPct })}</span>
          </button>
        </div>

        {/* Fiyat kartı */}
        <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-amber-500/25 rounded-3xl p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          {billingCycle === 'yearly' && (
            <div className="inline-flex items-center space-x-1.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
              <Check size={11} />
              <span>{t('premium.save_yearly', { amount: MONTHLY_PRICE * 12 - YEARLY_PRICE })}</span>
            </div>
          )}
          <div className="flex items-baseline justify-center space-x-1">
            <span className="text-lg text-slate-400 self-start mt-2">₺</span>
            <span className="text-6xl font-black text-white tracking-tight leading-none">{billingCycle === 'yearly' ? YEARLY_PRICE : MONTHLY_PRICE}</span>
            <span className="text-slate-400 text-sm font-medium self-end mb-1">{billingCycle === 'yearly' ? t('premium.per_year') : t('premium.per_month')}</span>
          </div>
          <p className="text-xs text-amber-400/80 mt-2 font-medium">
            {billingCycle === 'yearly' ? t('premium.yearly_desc', { amt: monthlyEquiv }) : t('premium.monthly_desc')}
          </p>
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-center space-x-2 text-xs text-slate-400">
            <Shield size={13} className="text-green-400" />
            <Trans i18nKey="premium.refund_notice" components={{ 1: <span className="text-green-400 font-bold" /> }} />
          </div>
        </div>

        {/* Karşılaştırma tablosu */}
        <div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-4">{t('premium.compare_title')}</h2>
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-900/80">
              <div className="p-3 text-xs text-slate-500 font-bold">{t('premium.feature')}</div>
              <div className="p-3 text-xs text-slate-500 font-bold text-center border-l border-slate-800">{t('premium.free')}</div>
              <div className="p-3 text-xs text-amber-400 font-bold text-center border-l border-slate-800 bg-amber-500/5">{t('premium.premium')}</div>
            </div>
            {rows.map((row, idx) => (
              <div key={idx} className={`grid grid-cols-3 border-b border-slate-800/60 last:border-0 ${idx % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
                <div className="p-3 flex items-center space-x-2">
                  <row.icon size={13} className="text-slate-500 flex-shrink-0" />
                  <span className="text-xs text-slate-300 font-medium leading-tight">{row.label}</span>
                </div>
                <div className="p-3 flex items-center justify-center border-l border-slate-800">
                  {row.free === false
                    ? <X size={15} className="text-slate-600" />
                    : <span className="text-xs text-slate-400 font-medium text-center">{row.free}</span>
                  }
                </div>
                <div className="p-3 flex items-center justify-center border-l border-slate-800 bg-amber-500/5">
                  {row.pro === true
                    ? <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center"><Check size={11} className="text-amber-400" /></div>
                    : <span className="text-xs text-amber-300 font-bold">{String(row.pro)}</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* {t('premium.trusted_by').split(' ')[0]} yorumu */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 relative">
          <div className="absolute -top-3 left-5 flex">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mt-1 italic">"{t('premium.testimonial')}"</p>
          <div className="flex items-center space-x-2 mt-3">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mehmet" className="w-7 h-7 rounded-full border border-slate-700" />
            <div>
              <p className="text-xs font-bold text-white">{t('premium.user_name')}</p>
              <p className="text-[10px] text-slate-500">{t('premium.user_desc')}</p>
            </div>
          </div>
        </div>

        {/* Güven rozetleri */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: Shield, label: t('premium.badge_refund'), color: 'text-green-400' },
            { icon: Lock, label: t('premium.badge_ssl'), color: 'text-blue-400' },
            { icon: Users, label: `12.000+\n${t('premium.trusted_by').split(' ')[0]}`, color: 'text-amber-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
              <Icon size={20} className={`${color} mx-auto mb-1.5`} />
              <p className="text-[10px] text-slate-400 font-medium leading-tight whitespace-pre-line">{label}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Sticky alt buton */}
      <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-20 pb-8">
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className={`w-full font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 ${isPremium ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-900/50'
            }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('premium.processing')}</span>
            </div>
          ) : isPremium ? (
            <><Crown size={18} className="fill-amber-400 text-amber-400" /><span>{t('premium.already_active')}</span></>
          ) : (
            <>
              <Zap size={20} className="fill-white" />
              <span>
                {billingCycle === 'yearly'
                  ? t('premium.upgrade_btn_year', { amt: YEARLY_PRICE })
                  : t('premium.upgrade_btn_month', { amt: MONTHLY_PRICE })}
              </span>
            </>
          )}
        </button>
        <p className="text-[10px] text-center text-slate-600 mt-2.5">{t('premium.terms')}</p>
      </div>
    </div>
  );
};
