import React, { useState, useMemo } from 'react';
import { useAdminStore } from '../store/adminStore';
import {
    Crown, Search,
    Calendar, CreditCard,
    ArrowUpRight,
    ChevronRight, ShieldAlert,
    Clock
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

export const Subscriptions: React.FC = () => {
    const { users, loading } = useAdminStore();
    const [search, setSearch] = useState('');

    const premiumUsers = useMemo(() =>
        users.filter(u => u.isPremium).filter(u =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        )
        , [users, search]);

    const stats = useMemo(() => {
        const total = users.filter(u => u.isPremium).length;
        const totalValue = total * 125;
        const conversionRate = (total / users.length) * 100 || 0;

        return [
            { label: 'Aktif Abonelik', value: total, icon: Crown, color: 'text-gold' },
            { label: 'Aylık Tahmini', value: `₺${totalValue.toLocaleString('tr-TR')}`, icon: CreditCard, color: 'text-emerald-400' },
            { label: 'Dönüşüm Oranı', value: `%${conversionRate.toFixed(1)}`, icon: ArrowUpRight, color: 'text-blue-400' },
        ];
    }, [users]);

    return (
        <div className="p-10 space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Abonelik Yönetimi</h1>
                    <p className="text-[var(--text-secondary)]">Premium üyeleri ve gelir durumunu buradan yönetin.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input
                        type="text"
                        placeholder="Premium üye ara..."
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-gold/30 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="glass p-8 rounded-[40px] border-white/5 flex items-center justify-between group">
                        <div>
                            <p className="text-[var(--text-secondary)] text-sm mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} border border-white/5 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={28} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass rounded-[40px] border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <Crown size={24} className="text-gold" /> Premium Üye Listesi
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-white/5">
                    {loading && users.length === 0 ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="p-8"><Skeleton key={i} className="h-48 rounded-3xl" /></div>
                        ))
                    ) : premiumUsers.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <ShieldAlert size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
                            <p className="text-[var(--text-secondary)]">Arama kriterlerine uygun premium üye bulunamadı.</p>
                        </div>
                    ) : (
                        premiumUsers.map(user => (
                            <div key={user.uid} className="p-8 hover:bg-white/[0.02] transition-all group relative overflow-hidden">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gold-dim border border-gold/20 flex items-center justify-center text-gold font-bold text-xl overflow-hidden shadow-lg shadow-gold/10">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : (user.name?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div className="max-w-[120px]">
                                            <h4 className="font-bold text-white group-hover:text-gold transition-colors truncate">{user.name} {user.surname}</h4>
                                            <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                                        <Crown size={16} />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                            <Calendar size={14} /> Üyelik Tipi
                                        </div>
                                        <span className="font-bold text-emerald-400">Yıllık Pro</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                            <Clock size={14} /> Son Ödeme
                                        </div>
                                        <span className="text-white">12 Mar 2024</span>
                                    </div>
                                </div>

                                <button
                                    className="w-full mt-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-gold-dim hover:text-gold transition-all flex items-center justify-center gap-2"
                                >
                                    Detayları Görüntüle <ChevronRight size={14} />
                                </button>

                                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
