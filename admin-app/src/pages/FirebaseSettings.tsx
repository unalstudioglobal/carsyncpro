import React, { useEffect, useState } from 'react';
import { getSystemConfig, updateSystemConfig } from '../services/adminService';
import {
    Shield, Save, Key, Globe, Database, Box,
    MessageSquare, Terminal, Facebook, Chrome,
    RefreshCw
} from 'lucide-react';
import type { SystemConfig } from '../types';
import { toast } from 'react-hot-toast';

export const FirebaseSettings: React.FC = () => {
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
                storeLinks: { playStore: '', appStore: '', moreAppsAndroid: '', moreAppsIos: '' },
                rewards: { referralPoints: 0, dailyLoginPoints: 0, hintCoinCost: 0 },
                ads: { enabled: false, provider: 'admob', android: {} as any, ios: {} as any },
                social: { instagram: '', facebook: '', youtube: '', website: '' },
                features: { showCategories: true, showLearningZone: true, showDailyQuiz: true },
                firebase: {
                    apiKey: '',
                    authDomain: '',
                    databaseURL: '',
                    projectId: '',
                    storageBucket: '',
                    messagingSenderId: '',
                    appId: ''
                },
                auth: {
                    facebookAppId: '',
                    googleClientId: ''
                }
            };

            setConfig({
                ...defaultConfig,
                ...data,
                firebase: data?.firebase ? { ...defaultConfig.firebase, ...data.firebase } : defaultConfig.firebase,
                auth: data?.auth ? { ...defaultConfig.auth, ...data.auth } : defaultConfig.auth
            });
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
            toast.success('Firebase ayarları başarıyla kaydedildi!');
        } catch (err: any) {
            console.error('Error saving config:', err);
            toast.error('Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-10 h-10 text-gold animate-spin" />
            <p className="text-white/50">Ayarlar yükleniyor...</p>
        </div>
    );

    if (!config) return null;

    const InputGroup = ({ label, value, onChange, icon: Icon }: any) => (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                {Icon && <Icon size={12} className="text-gold/50" />} {label}
            </label>
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`Enter ${label}...`}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-gold/40 focus:bg-white/5 outline-none transition-all placeholder:text-white/10"
            />
        </div>
    );

    return (
        <div className="p-10 space-y-10 max-w-6xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center border border-gold/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                            <Shield size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Web Firebase Ayarları</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-1">Bu ayarların doğrudan Web uygulaması yapılandırmasına yansıyacağını unutmayın.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-10 py-4 rounded-2xl bg-gold text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-gold/20"
                >
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                    {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </button>
            </header>

            <div className="glass-card p-10 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent rounded-[32px] space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <InputGroup
                        label="API Anahtarı (apiKey)"
                        value={config.firebase?.apiKey}
                        onChange={(v: string) => setConfig({ ...config, firebase: { ...config.firebase!, apiKey: v } })}
                        icon={Key}
                    />
                    <InputGroup
                        label="Kimlik Doğrulama Alanı (authDomain)"
                        value={config.firebase?.authDomain}
                        onChange={(v: string) => setConfig({ ...config, firebase: { ...config.firebase!, authDomain: v } })}
                        icon={Globe}
                    />
                    <InputGroup
                        label="Veritabanı URL (databaseURL)"
                        value={config.firebase?.databaseURL}
                        onChange={(v: string) => setConfig({ ...config, firebase: { ...config.firebase!, databaseURL: v } })}
                        icon={Database}
                    />
                    <InputGroup
                        label="Proje ID (projectId)"
                        value={config.firebase?.projectId}
                        onChange={(v: string) => setConfig({ ...config, firebase: { ...config.firebase!, projectId: v } })}
                        icon={Terminal}
                    />
                    <InputGroup
                        label="Depolama Kovası (storageBucket)"
                        value={config.firebase?.storageBucket}
                        onChange={(v: string) => setConfig({ ...config, firebase: { ...config.firebase!, storageBucket: v } })}
                        icon={Box}
                    />
                    <InputGroup
                        label="Mesajlaşma Gönderici ID (messagingSenderId)"
                        value={config.firebase?.messagingSenderId}
                        onChange={(v: string) => setConfig({ ...config, firebase: { ...config.firebase!, messagingSenderId: v } })}
                        icon={MessageSquare}
                    />
                    <InputGroup
                        label="Uygulama ID (appId)"
                        value={config.firebase?.appId}
                        onChange={(v: string) => setConfig({ ...config, firebase: { ...config.firebase!, appId: v } })}
                        icon={Terminal}
                    />
                    <InputGroup
                        label="Facebook Uygulama ID"
                        value={config.auth?.facebookAppId}
                        onChange={(v: string) => setConfig({ ...config, auth: { ...config.auth!, facebookAppId: v } })}
                        icon={Facebook}
                    />
                </div>

                <div className="pt-4 border-t border-white/5">
                    <InputGroup
                        label="Google İstemci ID (Client Id)"
                        value={config.auth?.googleClientId}
                        onChange={(v: string) => setConfig({ ...config, auth: { ...config.auth!, googleClientId: v } })}
                        icon={Chrome}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-blue-400">
                <Shield size={20} className="shrink-0" />
                <p className="text-xs font-medium leading-relaxed">
                    Burada yapılan değişiklikler tüm istemci (client) uygulamalarındaki Firebase yapılandırmasını güncelleyecektir.
                    Değerlerin doğruluğundan emin olmadan kaydetmeyiniz.
                </p>
            </div>
        </div>
    );
};

export default FirebaseSettings;
