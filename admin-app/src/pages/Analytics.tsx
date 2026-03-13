import React, { useMemo } from 'react';
import { useAdminStore } from '../store/adminStore';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
    TrendingUp, Users, Crown, Car,
    DollarSign, ArrowUpRight, ArrowDownRight,
    Disc, FileText, Activity
} from 'lucide-react';

const COLORS = ['#D4AF37', '#ffffff20', '#10b981', '#ef4444', '#8b5cf6'];

export const Analytics: React.FC = () => {
    const { users, vehicles, appointments, tires, documents } = useAdminStore();

    // ── Tier fiyatları (Subscriptions sayfasıyla senkron) ──────
    const TIER_MRR: Record<string, number> = {
        individual: 49,  // aylık bireysel
        family:     99,  // aylık aile
        fleet:      699, // aylık filo
    };
    const userMRR = (u: typeof users[0]) => {
        if (!u.isPremium) return 0;
        const base = TIER_MRR[u.premiumTier ?? 'individual'] ?? 49;
        return u.premiumPlan === 'yearly' ? Math.round(base * 0.85) : base; // yıllıkta indirim
    };

    const totalMRR = useMemo(() => users.reduce((s, u) => s + userMRR(u), 0), [users]);

    const premiumStats = useMemo(() => {
        const tiers = ['individual', 'family', 'fleet'] as const;
        return [
            ...tiers.map(t => ({
                name: t === 'individual' ? 'Bireysel' : t === 'family' ? 'Aile' : 'Filo',
                value: users.filter(u => u.isPremium && (u.premiumTier ?? 'individual') === t).length,
            })),
            { name: 'Standart', value: users.filter(u => !u.isPremium).length },
        ];
    }, [users]);

    const vehicleBrandStats = useMemo(() => {
        const counts: Record<string, number> = {};
        vehicles.forEach(v => {
            counts[v.brand] = (counts[v.brand] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [vehicles]);

    const featureUsageStats = useMemo(() => [
        { name: 'Randevular', value: appointments.length },
        { name: 'Lastik Kayıtları', value: tires.length },
        { name: 'Belgeler', value: documents.length },
    ], [appointments, tires, documents]);

    const tireTypeStats = useMemo(() => {
        const counts: Record<string, number> = { 'Yaz': 0, 'Kış': 0, '4 Mevsim': 0 };
        tires.forEach(t => {
            if (t.type === 'Summer') counts['Yaz']++;
            else if (t.type === 'Winter') counts['Kış']++;
            else counts['4 Mevsim']++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [tires]);

    const documentTypeStats = useMemo(() => {
        const counts: Record<string, number> = {};
        documents.forEach(d => {
            counts[d.type] = (counts[d.type] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [documents]);

    // Mock trend data (since we don't have historical data in DB yet)
    const trendData = [
        { name: 'Oca', users: Math.floor(users.length * 0.4) },
        { name: 'Şub', users: Math.floor(users.length * 0.6) },
        { name: 'Mar', users: Math.floor(users.length * 0.8) },
        { name: 'Nis', users: users.length },
    ];

    const stats = [
        { label: 'Gerçek MRR', value: `₺${totalMRR.toLocaleString('tr')}`, trend: `${users.filter(u=>u.isPremium).length} abonelik`, icon: DollarSign, color: 'text-gold' },
        { label: 'Aktif Kullanıcılar', value: users.length, trend: '+5%', icon: Users, color: 'text-blue-400' },
        { label: 'Premium Oranı', value: `%${((users.filter(u => u.isPremium).length / users.length) * 100 || 0).toFixed(1)}`, trend: '+2%', icon: Crown, color: 'text-emerald-400' },
        { label: 'Araç Başı Ortalama', value: (vehicles.length / users.length || 0).toFixed(1), trend: '-1%', icon: Car, color: 'text-purple-400' },
    ];

    return (
        <div className="p-10 space-y-10">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Sistem Analitiği</h1>
                <p className="text-[var(--text-secondary)]">Platformun büyüme ve kullanım verilerini buradan takip edin.</p>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="glass p-6 rounded-[32px] border-white/5 relative overflow-hidden group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} border border-white/5`}>
                                <stat.icon size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                {stat.trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {stat.trend}
                            </div>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Growth */}
                <div className="glass p-8 rounded-[40px] border-white/5">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <TrendingUp size={20} className="text-gold" /> Büyüme Trendi
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                    itemStyle={{ color: '#D4AF37' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#D4AF37" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Premium Distribution */}
                <div className="glass p-8 rounded-[40px] border-white/5">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <Crown size={20} className="text-gold" /> Üyelik Dağılımı
                    </h3>
                    <div className="h-80 w-full flex flex-col md:flex-row items-center">
                        <div className="h-full w-full md:w-2/3">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={premiumStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {premiumStats.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/3 flex flex-col gap-4">
                            {premiumStats.map((stat, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                        <span className="text-sm text-[var(--text-secondary)]">{stat.name}</span>
                                    </div>
                                    <span className="font-bold text-white">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Brands */}
                <div className="glass p-8 rounded-[40px] border-white/5">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <Car size={20} className="text-gold" /> En Popüler Markalar
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vehicleBrandStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#ffffff05' }}
                                    contentStyle={{ background: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                />
                                <Bar dataKey="value" fill="#D4AF37" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Feature Usage Distribution */}
                <div className="glass p-8 rounded-[40px] border-white/5">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <Activity size={20} className="text-gold" /> Özellik Kullanım Dağılımı
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={featureUsageStats} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                                <XAxis type="number" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} width={100} />
                                <Tooltip
                                    cursor={{ fill: '#ffffff05' }}
                                    contentStyle={{ background: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tire Types Pie */}
                <div className="glass p-8 rounded-[40px] border-white/5">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <Disc size={20} className="text-gold" /> Lastik Tipleri
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={tireTypeStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {tireTypeStats.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '16px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Document Types Pie */}
                <div className="glass p-8 rounded-[40px] border-white/5">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <FileText size={20} className="text-gold" /> Belge Dağılımı
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={documentTypeStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {documentTypeStats.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '16px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
