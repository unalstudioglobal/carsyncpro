import React, { useEffect, useState } from 'react';
import { Save, FileText, Shield, Scale, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCollectionConfig, updateCollectionConfig } from '../services/adminService';

export const PrivacySettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('privacy');
    const [policy, setPolicy] = useState({
        effectiveDate: '2026-03-01',
        content: 'At CarSync Pro, we take your privacy seriously. This document outlines...'
    });

    useEffect(() => {
        const loadPolicy = async () => {
            try {
                const data = await getCollectionConfig<any>('content', selectedTab);
                if (data) setPolicy(data);
                else setPolicy({ effectiveDate: new Date().toISOString().split('T')[0], content: '' });
            } catch (err) {
                toast.error('İçerik yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        loadPolicy();
    }, [selectedTab]);

    const handleSave = async () => {
        try {
            await updateCollectionConfig('content', selectedTab, policy);
            toast.success('İçerik başarıyla güncellendi!');
        } catch (err) {
            toast.error('Kaydedilirken hata oluştu.');
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-gold uppercase font-black tracking-widest">Yükleniyor...</div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Yasal ve Uyumluluk</h1>
                    <p className="text-white/30 text-sm font-medium">Gizlilik politikası, kullanım şartları ve GDPR uyumluluğunu yönetin.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> Güncellemeyi Yayınla
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    {[
                        { id: 'privacy', name: 'Gizlilik Politikası', icon: Shield },
                        { id: 'terms', name: 'Kullanım Şartları', icon: Scale },
                        { id: 'gdpr', name: 'GDPR Ayarları', icon: FileText }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedTab(item.id)}
                            className={`w-full p-6 rounded-[24px] border border-white/5 flex items-center justify-between group transition-all ${selectedTab === item.id ? 'bg-gold/10 border-gold/20 text-gold' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={18} />
                                <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                            </div>
                            <ChevronRight size={14} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-3 glass p-8 rounded-[32px] border-white/5 space-y-6">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Yürürlük Tarihi</span>
                        <input
                            type="date"
                            value={policy.effectiveDate}
                            onChange={(e) => setPolicy({ ...policy, effectiveDate: e.target.value })}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Politika İçeriği (Markdown Desteklenir)</label>
                        <textarea
                            value={policy.content}
                            onChange={(e) => setPolicy({ ...policy, content: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-6 text-sm text-white/80 focus:outline-none focus:border-gold/50 transition-all font-medium min-h-[500px] resize-none leading-loose shadow-inner"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
