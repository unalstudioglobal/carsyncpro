import React, { useEffect, useState } from 'react';
import { Save, Play, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCollectionConfig, updateCollectionConfig } from '../services/adminService';

export const HowToPlaySettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [steps, setSteps] = useState([
        { id: '1', title: 'Aracınızı Bağlayın', description: 'OBD-II cihazınızı takın ve uygulama ile eşleştirin.' },
        { id: '2', title: 'Tanılama Yapın', description: 'Potansiyel sorunları belirlemek için AI taramasını başlatın.' },
        { id: '3', title: 'Ödüller Kazanın', description: 'Liderlik tablosuna tırmanmak için bakım günlüklerini tamamlayın.' }
    ]);

    useEffect(() => {
        const loadSteps = async () => {
            try {
                const data = await getCollectionConfig<any[]>('content', 'how_to_play');
                if (data && Array.isArray(data)) setSteps(data);
            } catch (err) {
                toast.error('Kılavuz yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        loadSteps();
    }, []);

    const handleSave = async () => {
        try {
            await updateCollectionConfig('content', 'how_to_play', steps);
            toast.success('Nasıl Oynanır kılavuzu güncellendi!');
        } catch (err) {
            toast.error('Kaydedilirken bir hata oluştu.');
        }
    };

    const addStep = () => {
        setSteps([...steps, { id: Date.now().toString(), title: '', description: '' }]);
    };

    const updateStep = (id: string, field: 'title' | 'description', value: string) => {
        setSteps(steps.map(step => step.id === id ? { ...step, [field]: value } : step));
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(step => step.id !== id));
    };

    if (loading) return <div className="p-8 animate-pulse text-gold uppercase font-black tracking-widest">Yükleniyor...</div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Platform Kılavuzu CMS</h1>
                    <p className="text-white/30 text-sm font-medium">Yeni kullanıcılar için "Nasıl Çalışır" talimatlarını özelleştirin.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> Kılavuzu Senkronize Et
                </button>
            </header>

            <div className="space-y-6">
                {steps.map((step, index) => (
                    <div key={step.id} className="glass p-8 rounded-[32px] border-white/5 flex gap-8 items-start relative group">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <span className="text-2xl font-black text-gold/40">{index + 1}</span>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Adım Başlığı</label>
                                    <input
                                        type="text"
                                        value={step.title}
                                        onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Adım Açıklaması</label>
                                    <input
                                        type="text"
                                        value={step.description}
                                        onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => removeStep(step.id)}
                            className="w-12 h-12 rounded-xl bg-red-500/10 hidden group-hover:flex items-center justify-center text-red-500 cursor-pointer transition-all border border-red-500/20"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="glass p-8 rounded-[32px] border-white/5 bg-white/[0.01] flex items-center justify-center border-dashed">
                <button
                    onClick={addStep}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-gold transition-all"
                >
                    <Play size={14} /> Kılavuza Yeni Adım Ekle
                </button>
            </div>
        </div>
    );
};
