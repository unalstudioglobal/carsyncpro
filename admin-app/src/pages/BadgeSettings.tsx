import React, { useEffect, useState } from 'react';
import { Save, Award, Star, Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCollectionConfig, updateCollectionConfig } from '../services/adminService';

export const BadgeSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [badges, setBadges] = useState([
        { id: '1', name: 'Elite Driver', description: 'Complete 100 maintenance logs', icon: 'Award', color: '#D4AF37' },
        { id: '2', name: 'Safe Pilot', description: 'Zero damage detected for 1 year', icon: 'Shield', color: '#10B981' },
        { id: '3', name: 'Community Star', description: 'Earn 1000 likes on social', icon: 'Star', color: '#6366F1' },
    ]);

    useEffect(() => {
        const loadBadges = async () => {
            try {
                const data = await getCollectionConfig<any[]>('content', 'badges');
                if (data && Array.isArray(data)) setBadges(data);
            } catch (err) {
                toast.error('Rozetler yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        loadBadges();
    }, []);

    const handleSave = async () => {
        try {
            await updateCollectionConfig('content', 'badges', badges);
            toast.success('Rozet sistemi güncellendi!');
        } catch (err) {
            toast.error('Kaydedilirken bir hata oluştu.');
        }
    };

    const addBadge = () => {
        setBadges([...badges, { id: Date.now().toString(), name: 'Yeni Rozet', description: '', icon: 'Award', color: '#D4AF37' }]);
    };

    const removeBadge = (id: string) => {
        setBadges(badges.filter(badge => badge.id !== id));
    };

    const updateBadge = (id: string, updates: any) => {
        setBadges(badges.map(badge => badge.id === id ? { ...badge, ...updates } : badge));
    };

    if (loading) return <div className="p-8 animate-pulse text-gold uppercase font-black tracking-widest">Yükleniyor...</div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Kullanıcı Rozetleri & Ödülleri</h1>
                    <p className="text-white/30 text-sm font-medium">Başarı simgelerini ve kilometre taşı ödüllerini yönetin.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={addBadge}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Yeni Rozet
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                    >
                        <Save size={18} /> Değişiklikleri Kaydet
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map(badge => (
                    <div key={badge.id} className="glass p-8 rounded-[32px] border-white/5 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gold/10 to-transparent -mr-8 -mt-8 rounded-full transition-all group-hover:scale-110" />

                        <div className="flex justify-between items-start relative">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10" style={{ color: badge.color }}>
                                {badge.icon === 'Award' && <Award size={28} />}
                                {badge.icon === 'Shield' && <Shield size={28} />}
                                {badge.icon === 'Star' && <Star size={28} />}
                            </div>
                            <div className="flex gap-1">
                                <button className="p-2 hover:bg-white/5 text-white/20 hover:text-white rounded-lg transition-all"><Edit2 size={14} /></button>
                                <button
                                    onClick={() => removeBadge(badge.id)}
                                    className="p-2 hover:bg-red-500/10 text-white/20 hover:text-red-400 rounded-lg transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <input
                                className="bg-transparent text-lg font-black text-white uppercase tracking-tight w-full focus:outline-none"
                                value={badge.name}
                                onChange={(e) => updateBadge(badge.id, { name: e.target.value })}
                            />
                            <textarea
                                className="bg-transparent text-xs text-white/40 font-medium leading-relaxed w-full focus:outline-none resize-none"
                                value={badge.description}
                                onChange={(e) => updateBadge(badge.id, { description: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 flex items-center gap-4 relative">
                            <input
                                type="color"
                                value={badge.color}
                                onChange={(e) => updateBadge(badge.id, { color: e.target.value })}
                                className="w-6 h-6 rounded bg-transparent border-none cursor-pointer"
                            />
                            <select
                                value={badge.icon}
                                onChange={(e) => updateBadge(badge.id, { icon: e.target.value })}
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gold border-none focus:outline-none"
                            >
                                <option value="Award">Award</option>
                                <option value="Shield">Shield</option>
                                <option value="Star">Star</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
