import React, { useEffect, useState } from 'react';
import { getSystemConfig, updateSystemConfig } from '../services/adminService';
import {
    Bell,
    Save, AlertTriangle, CheckCircle2
} from 'lucide-react';

export const Settings: React.FC = () => {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        console.log('Settings component mounted');
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            console.log('Fetching config...');
            const data = await getSystemConfig();
            console.log('Config data received:', data);
            setConfig(data || { announcement: '', maintenanceMode: false });
        } catch (err) {
            console.error('Error fetching config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await updateSystemConfig(config);
            setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi!' });
        } catch (err: any) {
            console.error('Error saving config:', err);
            setMessage({ type: 'error', text: 'Hata: ' + err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
            <p className="text-[var(--text-secondary)] animate-pulse">Ayarlar yükleniyor...</p>
        </div>
    );

    // Fallback if config is still null for some reason
    const safeConfig = config || { announcement: '', maintenanceMode: false };

    return (
        <div className="p-4 lg:p-10 max-w-4xl animate-in fade-in duration-500">
            {/* Debug Marker (Hidden in production if needed, but useful now) */}
            <div className="mb-4 px-3 py-1 bg-white/5 rounded text-[10px] text-[var(--text-muted)] uppercase tracking-widest inline-block">
                Sistem Ayarları Modülü Aktif
            </div>

            <header className="mb-12">
                <h1 className="text-3xl font-bold text-white">Sistem Ayarları</h1>
                <p className="text-[var(--text-secondary)]">Uygulama genelindeki konfigürasyonları buradan yönetin.</p>
            </header>

            <div className="space-y-8">
                {/* Announcement Banner */}
                <section className="glass p-8 rounded-[32px] border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                            <Bell size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Duyuru Bannerı</h3>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs text-[var(--text-secondary)]">Tüm kullanıcıların ana sayfasında görünecek mesajı buraya yazın. Boş bırakırsanız banner gizlenir.</p>
                        <textarea
                            value={safeConfig.announcement || ''}
                            onChange={(e) => setConfig({ ...safeConfig, announcement: e.target.value })}
                            placeholder="Örn: Yeni güncelleme yayınlandı! Hemen göz atın..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-gold/30 transition-all min-h-[120px] resize-none"
                        />
                    </div>
                </section>

                {/* Maintenance Mode */}
                <section className="glass p-8 rounded-[32px] border-white/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-400/10 text-red-400 flex items-center justify-center">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Bakım Modu</h3>
                                <p className="text-xs text-[var(--text-muted)]">Uygulama sadece adminlere açık olur.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setConfig({ ...safeConfig, maintenanceMode: !safeConfig.maintenanceMode })}
                            className={`w-14 h-8 rounded-full transition-all relative ${safeConfig.maintenanceMode ? 'bg-red-500' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${safeConfig.maintenanceMode ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </section>

                {/* Status Message */}
                {message && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${message.type === 'success' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-10 py-4 rounded-2xl bg-gold text-[var(--bg-void)] font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : <Save size={20} />}
                        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
};
