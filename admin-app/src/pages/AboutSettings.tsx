import React, { useEffect, useState } from 'react';
import { Save, Globe, Type, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCollectionConfig, updateCollectionConfig } from '../services/adminService';

export const AboutSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState({
        title: 'About CarSync Pro',
        subtitle: 'The ultimate car management solution',
        description: 'CarSync Pro was born from a passion for automotive excellence...',
        vision: 'To redefine how people interact with their vehicles.'
    });

    useEffect(() => {
        const loadAbout = async () => {
            try {
                const data = await getCollectionConfig<any>('content', 'about');
                if (data) setContent(prev => ({ ...prev, ...data }));
            } catch (err) {
                toast.error('Hakkımızda içeriği yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        loadAbout();
    }, []);

    const handleSave = async () => {
        try {
            await updateCollectionConfig('content', 'about', content);
            toast.success('Hakkımızda içeriği güncellendi!');
        } catch (err) {
            toast.error('Kaydedilirken bir hata oluştu.');
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-gold uppercase font-black tracking-widest">Yükleniyor...</div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Hakkımızda CMS</h1>
                    <p className="text-white/30 text-sm font-medium">Şirket tarihçesini, vizyonunu ve ekip detaylarını yönetin.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> İçeriği Güncelle
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                        <div className="flex items-center gap-3 text-gold">
                            <Type size={20} />
                            <h2 className="text-sm font-black uppercase tracking-widest">Ana İçerik</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Ana Başlık</label>
                                <input
                                    type="text"
                                    value={content.title}
                                    onChange={(e) => setContent({ ...content, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Açıklama Metni</label>
                                <textarea
                                    value={content.description}
                                    onChange={(e) => setContent({ ...content, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium min-h-[200px] resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                        <div className="flex items-center gap-3 text-gold">
                            <Globe size={20} />
                            <h2 className="text-sm font-black uppercase tracking-widest">Vizyon Bildirimi</h2>
                        </div>
                        <textarea
                            value={content.vision}
                            onChange={(e) => setContent({ ...content, vision: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium min-h-[100px] resize-none border-dashed"
                        />
                    </div>

                    <div className="glass p-8 rounded-[32px] border-white/5 bg-gold/5 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/10 border-dashed">
                            <ImageIcon size={32} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Kapak Görseli</h4>
                            <p className="text-[10px] text-white/20 font-medium">Çözünürlük: 1920x1080px</p>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-gold hover:text-white transition-colors">Görseli Değiştir</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
