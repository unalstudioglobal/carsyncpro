import React, { useEffect, useState } from 'react';
import { Save, Mail, MapPin, Phone, MessageSquare, Twitter, Instagram, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCollectionConfig, updateCollectionConfig } from '../services/adminService';

export const ContactSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [social, setSocial] = useState({
        email: 'contact@carsyncpro.com',
        phone: '+90 (212) 555 0122',
        address: 'Levent, Istanbul, Turkey',
        twitter: '@CarSyncPro',
        instagram: '@carsyncpro_official'
    });

    useEffect(() => {
        const loadSocial = async () => {
            try {
                const data = await getCollectionConfig<any>('content', 'contact');
                if (data) setSocial(prev => ({ ...prev, ...data }));
            } catch (err) {
                toast.error('İletişim bilgileri yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        loadSocial();
    }, []);

    const handleSave = async () => {
        try {
            await updateCollectionConfig('content', 'contact', social);
            toast.success('İletişim bilgileri güncellendi!');
        } catch (err) {
            toast.error('Kaydedilirken bir hata oluştu.');
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-gold uppercase font-black tracking-widest">Yükleniyor...</div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">İletişim & Sosyal Medya</h1>
                    <p className="text-white/30 text-sm font-medium">Destek kanallarını ve sosyal medya bağlantılarını yönetin.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> Kanalları Güncelle
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-gold">
                        <MessageSquare size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Doğrudan Destek</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Destek E-postası</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={social.email}
                                    onChange={(e) => setSocial({ ...social, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all"
                                />
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Telefon Numarası</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={social.phone}
                                    onChange={(e) => setSocial({ ...social, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-mono"
                                />
                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Ofis Adresi</label>
                            <div className="relative">
                                <textarea
                                    value={social.address}
                                    onChange={(e) => setSocial({ ...social, address: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all min-h-[100px] resize-none"
                                />
                                <MapPin size={16} className="absolute left-4 top-12 -translate-y-1/2 text-white/20" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-gold">
                        <Globe size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Sosyal Medya</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Twitter (X) URL</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={social.twitter}
                                    onChange={(e) => setSocial({ ...social, twitter: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium"
                                />
                                <Twitter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1DA1F2]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Instagram URL</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={social.instagram}
                                    onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium"
                                />
                                <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E1306C]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
