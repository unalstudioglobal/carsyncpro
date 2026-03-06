import React, { useEffect, useState } from 'react';
import { getSystemConfig, updateSystemConfig } from '../services/adminService';
import {
    Settings as SettingsIcon, Save,
    Globe, Share2, Target, Trophy, Smartphone, AppWindow,
    Layout, Megaphone, Facebook, Youtube, Instagram
} from 'lucide-react';
import type { SystemConfig } from '../types';
import { toast } from 'react-hot-toast';

export const Settings: React.FC = () => {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const data = await getSystemConfig();
            const defaultConfig: SystemConfig = {
                announcement: '',
                maintenanceMode: false,
                appVersion: { android: '1.0.0', ios: '1.0.0' },
                storeLinks: {
                    playStore: '', appStore: '',
                    moreAppsAndroid: '', moreAppsIos: ''
                },
                rewards: {
                    referralPoints: 50,
                    dailyLoginPoints: 10,
                    hintCoinCost: 5
                },
                ads: {
                    enabled: false,
                    provider: 'admob',
                    android: { appId: '', bannerId: '', interstitialId: '', rewardedId: '', nativeId: '', openAppId: '' },
                    ios: { appId: '', bannerId: '', interstitialId: '', rewardedId: '', nativeId: '', openAppId: '' }
                },
                social: { instagram: '', facebook: '', youtube: '', website: '' },
                features: { showCategories: true, showLearningZone: true, showDailyQuiz: true }
            };
            setConfig(data || defaultConfig);
        } catch (err) {
            console.error('Error fetching config:', err);
            toast.error('Ayarlar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await updateSystemConfig(config);
            toast.success('Ayarlar başarıyla kaydedildi!');
        } catch (err: any) {
            console.error('Error saving config:', err);
            toast.error('Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
            <p className="text-[var(--text-secondary)]">Ayarlar yükleniyor...</p>
        </div>
    );

    if (!config) return null;

    const InputGroup = ({ label, value, onChange, placeholder, type = "text" }: any) => (
        <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-gold/30 outline-none transition-all"
            />
        </div>
    );

    const Toggle = ({ active, onToggle, label, sublabel }: any) => (
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div>
                <h4 className="text-sm font-semibold text-white">{label}</h4>
                {sublabel && <p className="text-[10px] text-[var(--text-muted)]">{sublabel}</p>}
            </div>
            <button
                onClick={onToggle}
                className={`w-12 h-6 rounded-full transition-all relative ${active ? 'bg-gold' : 'bg-white/10'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );

    return (
        <div className="p-4 lg:p-10 space-y-10 max-w-7xl mx-auto pb-24 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                            <SettingsIcon size={24} />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Sistem Ayarları</h1>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm ml-15">Uygulama genelindeki tüm teknik ve finansal parametreleri buradan yönetin.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3.5 rounded-2xl bg-gold text-[var(--bg-void)] font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 shadow-lg shadow-gold/20"
                >
                    {saving ? <div className="w-5 h-5 border-2 border-[var(--bg-void)]/20 border-t-[var(--bg-void)] rounded-full animate-spin" /> : <Save size={20} />}
                    {saving ? 'Kaydediliyor...' : 'Tüm Değişiklikleri Kaydet'}
                </button>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* 1. APP & MAINTENANCE */}
                <div className="space-y-8">
                    <section className="glass rounded-[32px] p-8 border-white/5">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center">
                                <AppWindow size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Genel Uygulama Ayarları</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold flex items-center gap-2">
                                    <Megaphone size={12} /> Duyuru Banner Metni
                                </label>
                                <textarea
                                    value={config.announcement}
                                    onChange={(v) => setConfig({ ...config, announcement: v.target.value })}
                                    placeholder="Hoş geldiniz! Yeni kampanyalarımıza göz atın."
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white h-24 focus:border-gold/30 outline-none resize-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup
                                    label="Android Versiyon"
                                    value={config.appVersion.android}
                                    onChange={(v: string) => setConfig({ ...config, appVersion: { ...config.appVersion, android: v } })}
                                />
                                <InputGroup
                                    label="iOS Versiyon"
                                    value={config.appVersion.ios}
                                    onChange={(v: string) => setConfig({ ...config, appVersion: { ...config.appVersion, ios: v } })}
                                />
                            </div>

                            <Toggle
                                label="Bakım Modu"
                                sublabel="Uygulamayı admin dışındaki tüm kullanıcılara kapatır."
                                active={config.maintenanceMode}
                                onToggle={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                            />
                        </div>
                    </section>

                    {/* 2. STORE LINKS */}
                    <section className="glass rounded-[32px] p-8 border-white/5">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
                                <Smartphone size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Mağaza ve Uygulama Linkleri</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Play Store URL" value={config.storeLinks.playStore} placeholder="https://play.google.com..." onChange={(v: string) => setConfig({ ...config, storeLinks: { ...config.storeLinks, playStore: v } })} />
                            <InputGroup label="App Store URL" value={config.storeLinks.appStore} placeholder="https://apps.apple.com..." onChange={(v: string) => setConfig({ ...config, storeLinks: { ...config.storeLinks, appStore: v } })} />
                            <InputGroup label="Daha Fazla Uygulama (G)" value={config.storeLinks.moreAppsAndroid} placeholder="Developer sayfanız" onChange={(v: string) => setConfig({ ...config, storeLinks: { ...config.storeLinks, moreAppsAndroid: v } })} />
                            <InputGroup label="Daha Fazla Uygulama (iOS)" value={config.storeLinks.moreAppsIos} placeholder="Developer sayfanız" onChange={(v: string) => setConfig({ ...config, storeLinks: { ...config.storeLinks, moreAppsIos: v } })} />
                        </div>
                    </section>

                    {/* 3. GAMIFICATION */}
                    <section className="glass rounded-[32px] p-8 border-white/5 bg-gold/5 border-gold/10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                                <Trophy size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Oyunlaştırma (Coin & Puan)</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <InputGroup label="Referans Ödülü (Puan)" type="number" value={config.rewards.referralPoints} onChange={(v: string) => setConfig({ ...config, rewards: { ...config.rewards, referralPoints: parseInt(v) } })} />
                            <InputGroup label="Günlük Giriş (Puan)" type="number" value={config.rewards.dailyLoginPoints} onChange={(v: string) => setConfig({ ...config, rewards: { ...config.rewards, dailyLoginPoints: parseInt(v) } })} />
                            <InputGroup label="İpucu Bedeli (Coin)" type="number" value={config.rewards.hintCoinCost} onChange={(v: string) => setConfig({ ...config, rewards: { ...config.rewards, hintCoinCost: parseInt(v) } })} />
                        </div>
                    </section>
                </div>

                {/* COLUMN 2 */}
                <div className="space-y-8">
                    {/* 4. ADS CONFIG */}
                    <section className="glass rounded-[32px] p-8 border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-400/10 text-purple-400 flex items-center justify-center">
                                    <Target size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-white">Reklam Yönetimi</h3>
                            </div>
                            <Toggle active={config.ads.enabled} onToggle={() => setConfig({ ...config, ads: { ...config.ads, enabled: !config.ads.enabled } })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={() => setConfig({ ...config, ads: { ...config.ads, provider: 'admob' } })}
                                className={`py-3 rounded-xl text-xs font-bold transition-all ${config.ads.provider === 'admob' ? 'bg-gold text-[var(--bg-void)] shadow-lg' : 'bg-white/5 text-white border border-white/5'}`}
                            >
                                Google Admob
                            </button>
                            <button
                                onClick={() => setConfig({ ...config, ads: { ...config.ads, provider: 'facebook' } })}
                                className={`py-3 rounded-xl text-xs font-bold transition-all ${config.ads.provider === 'facebook' ? 'bg-[#1877F2] text-white shadow-lg' : 'bg-white/5 text-white border border-white/5'}`}
                            >
                                Facebook Audience
                            </button>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] uppercase font-bold text-gold/60 tracking-[3px]">Android Reklam Birimleri</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="App ID (G)" value={config.ads.android.appId} onChange={(v: string) => setConfig({ ...config, ads: { ...config.ads, android: { ...config.ads.android, appId: v } } })} />
                                <InputGroup label="Banner ID" value={config.ads.android.bannerId} onChange={(v: string) => setConfig({ ...config, ads: { ...config.ads, android: { ...config.ads.android, bannerId: v } } })} />
                                <InputGroup label="Interstitial ID" value={config.ads.android.interstitialId} onChange={(v: string) => setConfig({ ...config, ads: { ...config.ads, android: { ...config.ads.android, interstitialId: v } } })} />
                                <InputGroup label="Rewarded ID" value={config.ads.android.rewardedId} onChange={(v: string) => setConfig({ ...config, ads: { ...config.ads, android: { ...config.ads.android, rewardedId: v } } })} />
                            </div>

                            <h4 className="text-[10px] uppercase font-bold text-gold/60 tracking-[3px] mt-8">iOS Reklam Birimleri</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="App ID (G)" value={config.ads.ios.appId} onChange={(v: string) => setConfig({ ...config, ads: { ...config.ads, ios: { ...config.ads.ios, appId: v } } })} />
                                <InputGroup label="Banner ID" value={config.ads.ios.bannerId} onChange={(v: string) => setConfig({ ...config, ads: { ...config.ads, ios: { ...config.ads.ios, bannerId: v } } })} />
                                <InputGroup label="Interstitial ID" value={config.ads.ios.interstitialId} onChange={(v: string) => setConfig({ ...config, ads: { ...config.ads, ios: { ...config.ads.ios, interstitialId: v } } })} />
                                <InputGroup label="Rewarded ID" value={config.ads.ios.rewardedId} onChange={(v: string) => setConfig({ ...config, ads: { ...config.ads, ios: { ...config.ads.ios, rewardedId: v } } })} />
                            </div>
                        </div>
                    </section>

                    {/* 5. SOCIAL MEDIA */}
                    <section className="glass rounded-[32px] p-8 border-white/5">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-pink-400/10 text-pink-400 flex items-center justify-center">
                                <Share2 size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Sosyal Medya ve Web</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-2">
                                    <Instagram size={12} /> Instagram
                                </label>
                                <input value={config.social.instagram} onChange={(e) => setConfig({ ...config, social: { ...config.social, instagram: e.target.value } })} className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-2">
                                    <Youtube size={12} /> Youtube
                                </label>
                                <input value={config.social.youtube} onChange={(e) => setConfig({ ...config, social: { ...config.social, youtube: e.target.value } })} className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-2">
                                    <Facebook size={12} /> Facebook
                                </label>
                                <input value={config.social.facebook} onChange={(e) => setConfig({ ...config, social: { ...config.social, facebook: e.target.value } })} className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-2">
                                    <Globe size={12} /> Web Sitesi
                                </label>
                                <input value={config.social.website} onChange={(e) => setConfig({ ...config, social: { ...config.social, website: e.target.value } })} className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white" />
                            </div>
                        </div>
                    </section>

                    {/* 6. FEATURE CONTROLS */}
                    <section className="glass rounded-[32px] p-8 border-white/5">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-orange-400/10 text-orange-400 flex items-center justify-center">
                                <Layout size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Özellik Kontrolleri</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Toggle label="Kategori Menüsünü Göster" active={config.features.showCategories} onToggle={() => setConfig({ ...config, features: { ...config.features, showCategories: !config.features.showCategories } })} />
                            <Toggle label="Öğrenme Alanı Aktif" active={config.features.showLearningZone} onToggle={() => setConfig({ ...config, features: { ...config.features, showLearningZone: !config.features.showLearningZone } })} />
                            <Toggle label="Günlük Yarışma Sistemi" active={config.features.showDailyQuiz} onToggle={() => setConfig({ ...config, features: { ...config.features, showDailyQuiz: !config.features.showDailyQuiz } })} />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

