import React, { useState } from 'react';
import { Save, Award, Star, Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const BadgeSettings: React.FC = () => {
    const [badges] = useState([
        { id: '1', name: 'Elite Driver', description: 'Complete 100 maintenance logs', icon: 'Award', color: '#D4AF37' },
        { id: '2', name: 'Safe Pilot', description: 'Zero damage detected for 1 year', icon: 'Shield', color: '#10B981' },
        { id: '3', name: 'Community Star', description: 'Earn 1000 likes on social', icon: 'Star', color: '#6366F1' },
    ]);

    const handleSave = () => {
        toast.success('Badge system updated!');
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">User Badges & Rewards</h1>
                    <p className="text-white/30 text-sm font-medium">Manage achievement icons and milestone rewards.</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2">
                        <Plus size={18} /> New Badge
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                    >
                        <Save size={18} /> Save Changes
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
                                <button className="p-2 hover:bg-red-500/10 text-white/20 hover:text-red-400 rounded-lg transition-all"><Trash2 size={14} /></button>
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{badge.name}</h3>
                            <p className="text-xs text-white/40 font-medium leading-relaxed">{badge.description}</p>
                        </div>

                        <div className="pt-4 flex items-center gap-4 relative">
                            <div className="h-[2px] flex-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gold" style={{ width: '40%' }} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gold opacity-60">450 Users</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
