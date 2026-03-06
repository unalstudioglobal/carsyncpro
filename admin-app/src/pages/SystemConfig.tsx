import React, { useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCollectionConfig, updateCollectionConfig, purgeSystemCache } from '../services/adminService';

export const SystemConfig: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({
        appName: 'CarSync Pro',
        appVersion: '2.4.0',
        maintenanceMode: false,
        debugMode: true,
        supportEmail: 'support@carsyncpro.com'
    });

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const data = await getCollectionConfig<any>('system', 'config');
                if (data) setConfig(prev => ({ ...prev, ...data }));
            } catch (err) {
                toast.error('Gerekli yapılandırmalar yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        try {
            await updateCollectionConfig('system', 'config', config);
            toast.success('Sistem yapılandırması kaydedildi!');
        } catch (err) {
            toast.error('Kaydedilirken bir hata oluştu.');
        }
    };

    const handlePurgeCache = async () => {
        toast.promise(purgeSystemCache(), {
            loading: 'Önbellek temizleniyor...',
            success: 'Sistem önbelleği temizlendi!',
            error: 'Hata oluştu.'
        });
    };

    if (loading) return <div className="p-8 animate-pulse text-gold uppercase font-black tracking-widest">Yükleniyor...</div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Sistem Yapılandırması</h1>
                    <p className="text-white/30 text-sm font-medium">Global ortam değişkenleri ve uygulama durumu kontrolü.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> Kaydet
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-gold mb-2">
                        <SettingsIcon size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Genel Bilgiler</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Uygulama Adı</label>
                            <input
                                type="text"
                                value={config.appName}
                                onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Uygulama Versiyonu</label>
                            <input
                                type="text"
                                value={config.appVersion}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white/40 focus:outline-none cursor-not-allowed font-mono"
                                readOnly
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Destek E-postası</label>
                            <input
                                type="email"
                                value={config.supportEmail}
                                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-gold mb-2">
                        <Shield size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Sistem Durumu</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div>
                                <h4 className="text-sm font-bold text-white">Bakım Modu</h4>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Kullanıcı erişimini engeller</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                                className={`w-12 h-6 rounded-full transition-all relative ${config.maintenanceMode ? 'bg-amber-500' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.maintenanceMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div>
                                <h4 className="text-sm font-bold text-white">Hata Ayıklama (Debug)</h4>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Ayrıntılı logları etkinleştirir</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, debugMode: !config.debugMode })}
                                className={`w-12 h-6 rounded-full transition-all relative ${config.debugMode ? 'bg-gold' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.debugMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        <button
                            onClick={handlePurgeCache}
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                        >
                            <RefreshCw size={14} /> Sistem Önbelleğini Temizle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
