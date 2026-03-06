import React, { useEffect, useState } from 'react';
import { Save, Lock, Smartphone, Mail, Globe, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCollectionConfig, updateCollectionConfig } from '../services/adminService';

export const AuthSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [providers, setProviders] = useState({
        google: true,
        email: true,
        phone: false,
        anonymous: false
    });
    const [policy, setPolicy] = useState({
        sessionTimeout: '24 Hours (Default)',
        passwordStrength: 'Strong'
    });

    useEffect(() => {
        const loadAuth = async () => {
            try {
                const data = await getCollectionConfig<any>('system', 'auth');
                if (data) {
                    if (data.providers) setProviders(data.providers);
                    if (data.policy) setPolicy(data.policy);
                }
            } catch (err) {
                toast.error('Kimlik doğrulama ayarları yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        loadAuth();
    }, []);

    const handleSave = async () => {
        try {
            await updateCollectionConfig('system', 'auth', { providers, policy });
            toast.success('Kimlik doğrulama ayarları güncellendi!');
        } catch (err) {
            toast.error('Kaydedilirken bir hata oluştu.');
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-gold uppercase font-black tracking-widest">Yükleniyor...</div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Kimlik ve Erişim</h1>
                    <p className="text-white/30 text-sm font-medium">Kimlik sağlayıcılarını ve güvenlik protokollerini yönetin.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> Ayarları Kaydet
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-gold mb-2">
                        <Lock size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Giriş Sağlayıcıları</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { id: 'google', label: 'Google ile Giriş', icon: Globe, color: 'text-blue-400' },
                            { id: 'email', label: 'E-posta ve Şifre', icon: Mail, color: 'text-emerald-400' },
                            { id: 'phone', label: 'Telefon Doğrulama', icon: Smartphone, color: 'text-amber-400' },
                            { id: 'anonymous', label: 'Misafir Erişimi', icon: ShieldCheck, color: 'text-purple-400' }
                        ].map((provider) => (
                            <div key={provider.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl bg-white/5 ${provider.color}`}>
                                        <provider.icon size={18} />
                                    </div>
                                    <h4 className="text-sm font-bold text-white">{provider.label}</h4>
                                </div>
                                <button
                                    onClick={() => setProviders({ ...providers, [provider.id]: !providers[provider.id as keyof typeof providers] })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${providers[provider.id as keyof typeof providers] ? 'bg-gold' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${providers[provider.id as keyof typeof providers] ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-gold mb-2">
                        <ShieldCheck size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Güvenlik Politikası</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Oturum Zaman Aşımı</h4>
                            <select
                                value={policy.sessionTimeout}
                                onChange={(e) => setPolicy({ ...policy, sessionTimeout: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none"
                            >
                                <option>24 Hours (Default)</option>
                                <option>7 Days</option>
                                <option>30 Days</option>
                                <option>Unlimited</option>
                            </select>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Minimum Şifre Gücü</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {['Weak', 'Medium', 'Strong'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setPolicy({ ...policy, passwordStrength: s })}
                                        className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${policy.passwordStrength === s ? 'border-gold bg-gold/10 text-gold shadow-lg shadow-gold/10' : 'border-white/5 text-white/20'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
