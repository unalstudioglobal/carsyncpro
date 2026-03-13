import React, { useState, useMemo, useEffect } from 'react';
import { useAdminStore } from '../store/adminStore';
import {
  Crown, Search, Calendar, CreditCard, ArrowUpRight,
  TrendingUp, Users, Building2, Car, ChevronDown,
  BarChart2, RefreshCw, Download
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

// ── Fiyat tablosu (server.ts ile senkron) ────────────────────
const TIER_PRICES: Record<string, { monthly: number; yearly: number; label: string; color: string; icon: React.ElementType }> = {
  individual: { monthly: 49,  yearly: 499,  label: 'Bireysel', color: 'text-amber-400',  icon: Car        },
  family:     { monthly: 99,  yearly: 999,  label: 'Aile',     color: 'text-violet-400', icon: Users      },
  fleet:      { monthly: 699, yearly: 6999, label: 'Filo',     color: 'text-cyan-400',   icon: Building2  },
};

const tierColor = (tier?: string) => {
  if (tier === 'family') return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
  if (tier === 'fleet')  return 'bg-cyan-500/10  text-cyan-400  border-cyan-500/20';
  return                         'bg-amber-500/10 text-amber-400 border-amber-500/20';
};

const tierLabel = (tier?: string) => TIER_PRICES[tier ?? 'individual']?.label ?? 'Bireysel';

const userMonthlyRevenue = (u: { isPremium?: boolean; premiumTier?: string; premiumPlan?: string }) => {
  if (!u.isPremium) return 0;
  const t = TIER_PRICES[u.premiumTier ?? 'individual'] ?? TIER_PRICES.individual;
  return u.premiumPlan === 'yearly' ? Math.round(t.yearly / 12) : t.monthly;
};

// ─────────────────────────────────────────────────────────────

export const Subscriptions: React.FC = () => {
  const { users, loading, subscribeToUsers } = useAdminStore();
  const [search,      setSearch]      = useState('');
  const [tierFilter,  setTierFilter]  = useState<'all' | 'individual' | 'family' | 'fleet'>('all');
  const [sortBy,      setSortBy]      = useState<'name' | 'tier' | 'revenue' | 'expires'>('revenue');

  useEffect(() => {
    const unsub = subscribeToUsers();
    return unsub;
  }, []);

  const premiumUsers = useMemo(() =>
    users.filter(u => u.isPremium), [users]);

  // ── KPI hesapları ───────────────────────────────────────────
  const kpis = useMemo(() => {
    const mrr = premiumUsers.reduce((sum, u) => sum + userMonthlyRevenue(u), 0);
    const arr = premiumUsers.reduce((sum, u) => {
      const t = TIER_PRICES[u.premiumTier ?? 'individual'] ?? TIER_PRICES.individual;
      return sum + (u.premiumPlan === 'yearly' ? t.yearly : t.monthly * 12);
    }, 0);
    const conv = users.length > 0 ? (premiumUsers.length / users.length) * 100 : 0;
    const indCount = premiumUsers.filter(u => !u.premiumTier || u.premiumTier === 'individual').length;
    const famCount = premiumUsers.filter(u => u.premiumTier === 'family').length;
    const fltCount = premiumUsers.filter(u => u.premiumTier === 'fleet').length;
    return { mrr, arr, conv, indCount, famCount, fltCount };
  }, [premiumUsers, users]);

  // ── Tier dağılım çubuğu ─────────────────────────────────────
  const tierBreakdown = useMemo(() => {
    const total = premiumUsers.length || 1;
    return [
      { key: 'individual', pct: Math.round((kpis.indCount / total) * 100), count: kpis.indCount },
      { key: 'family',     pct: Math.round((kpis.famCount / total) * 100), count: kpis.famCount },
      { key: 'fleet',      pct: Math.round((kpis.fltCount / total) * 100), count: kpis.fltCount },
    ];
  }, [kpis, premiumUsers.length]);

  // ── Filtrelenmiş + sıralanmış liste ─────────────────────────
  const filtered = useMemo(() => {
    let list = premiumUsers.filter(u =>
      (tierFilter === 'all' || (u.premiumTier ?? 'individual') === tierFilter) &&
      (u.name?.toLowerCase().includes(search.toLowerCase()) ||
       u.email?.toLowerCase().includes(search.toLowerCase()))
    );
    list = [...list].sort((a, b) => {
      if (sortBy === 'tier')    return (a.premiumTier ?? 'z').localeCompare(b.premiumTier ?? 'z');
      if (sortBy === 'revenue') return userMonthlyRevenue(b) - userMonthlyRevenue(a);
      if (sortBy === 'expires') return (a.premiumExpiresAt ?? '').localeCompare(b.premiumExpiresAt ?? '');
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
    return list;
  }, [premiumUsers, search, tierFilter, sortBy]);

  // ── CSV dışa aktarma ────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Ad Soyad', 'Email', 'Tier', 'Plan', 'Aylık Gelir (₺)', 'Bitiş Tarihi'];
    const rows = filtered.map(u => [
      `${u.name ?? ''} ${u.surname ?? ''}`.trim(),
      u.email,
      tierLabel(u.premiumTier),
      u.premiumPlan === 'yearly' ? 'Yıllık' : 'Aylık',
      userMonthlyRevenue(u),
      u.premiumExpiresAt ? new Date(u.premiumExpiresAt).toLocaleDateString('tr-TR') : '-',
    ]);
    const csv = 'data:text/csv;charset=utf-8,'
      + headers.join(',') + '\n'
      + rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `carsync_subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-10 space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Abonelik Yönetimi</h1>
          <p className="text-[var(--text-secondary)]">3 plan · Bireysel, Aile, Filo — gerçek zamanlı gelir takibi.</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl glass border-white/5 text-sm font-semibold hover:text-gold hover:border-gold/20 transition-all"
        >
          <Download size={16} /> CSV Dışa Aktar
        </button>
      </header>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Aktif Abonelik',  value: premiumUsers.length,             icon: Crown,      color: 'text-gold'       },
          { label: 'MRR (aylık)',     value: `₺${kpis.mrr.toLocaleString('tr')}`, icon: CreditCard, color: 'text-emerald-400' },
          { label: 'ARR (yıllık)',    value: `₺${kpis.arr.toLocaleString('tr')}`, icon: TrendingUp, color: 'text-blue-400'    },
          { label: 'Dönüşüm',        value: `%${kpis.conv.toFixed(1)}`,       icon: ArrowUpRight,color: 'text-violet-400'  },
          { label: 'Bireysel',        value: kpis.indCount,                   icon: Car,         color: 'text-amber-400'  },
          { label: 'Aile / Filo',     value: `${kpis.famCount} / ${kpis.fltCount}`, icon: Building2, color: 'text-cyan-400' },
        ].map((kpi, i) => (
          <div key={i} className="glass p-6 rounded-[32px] border-white/5 flex flex-col gap-3 hover:border-gold/20 transition-all group">
            <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center ${kpi.color} border border-white/5 group-hover:scale-110 transition-transform`}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">{kpi.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tier dağılım çubuğu */}
      <div className="glass rounded-[32px] border-white/5 p-8 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BarChart2 size={16} className="text-gold" /> Plan Dağılımı
        </h3>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {tierBreakdown.map(({ key, pct }) => (
            <div
              key={key}
              style={{ width: `${pct}%`, minWidth: pct > 0 ? '4px' : 0 }}
              className={`transition-all ${
                key === 'fleet'  ? 'bg-cyan-500'   :
                key === 'family' ? 'bg-violet-500' : 'bg-amber-500'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-6">
          {tierBreakdown.map(({ key, pct, count }) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${key === 'fleet' ? 'bg-cyan-500' : key === 'family' ? 'bg-violet-500' : 'bg-amber-500'}`} />
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                {tierLabel(key)} — {count} (%{pct})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filtre + Arama */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input
            placeholder="İsim veya e-posta ara..."
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-gold/30 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'individual', 'family', 'fleet'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTierFilter(f)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                tierFilter === f
                  ? 'bg-gold text-black border-transparent'
                  : 'bg-white/5 text-[var(--text-secondary)] border-white/5 hover:border-gold/20 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Tümü' : tierLabel(f)}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="bg-white/5 border border-white/5 rounded-2xl py-2.5 px-4 text-sm text-white outline-none cursor-pointer"
        >
          <option value="revenue">Gelire göre</option>
          <option value="name">İsme göre</option>
          <option value="tier">Plan'a göre</option>
          <option value="expires">Bitiş tarihine göre</option>
        </select>
      </div>

      {/* Kullanıcı listesi */}
      <div className="glass rounded-[40px] border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[var(--text-muted)] text-[10px] uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 font-black">Kullanıcı</th>
                <th className="px-6 py-5 font-black">Plan</th>
                <th className="px-6 py-5 font-black">Dönem</th>
                <th className="px-6 py-5 font-black">Aylık Gelir</th>
                <th className="px-6 py-5 font-black">Bitiş</th>
                <th className="px-6 py-5 font-black">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && filtered.length === 0
                ? [1,2,3,4].map(i => (
                    <tr key={i}>
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} className="px-6 py-5"><Skeleton className="h-6 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : filtered.map(user => {
                    const tier    = user.premiumTier ?? 'individual';
                    const tPrices = TIER_PRICES[tier] ?? TIER_PRICES.individual;
                    const monthly = userMonthlyRevenue(user);
                    const expired = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) < new Date() : false;
                    const daysLeft = user.premiumExpiresAt
                      ? Math.ceil((new Date(user.premiumExpiresAt).getTime() - Date.now()) / 86400000)
                      : null;

                    return (
                      <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                              {user.avatar
                                ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                                : (user.name?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm group-hover:text-gold transition-colors">
                                {user.name} {user.surname ?? ''}
                              </p>
                              <p className="text-[10px] text-[var(--text-muted)]">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-lg border ${tierColor(tier)}`}>
                            {tPrices.label}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs text-[var(--text-secondary)] font-medium">
                            {user.premiumPlan === 'yearly' ? '📅 Yıllık' : '🔄 Aylık'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-emerald-400">₺{monthly.toLocaleString('tr')}</span>
                        </td>

                        <td className="px-6 py-4">
                          {user.premiumExpiresAt ? (
                            <span className={`text-xs font-medium ${expired ? 'text-red-400' : daysLeft && daysLeft <= 14 ? 'text-amber-400' : 'text-[var(--text-secondary)]'}`}>
                              {new Date(user.premiumExpiresAt).toLocaleDateString('tr-TR')}
                              {daysLeft !== null && !expired && (
                                <span className="ml-1 opacity-60">({daysLeft}g)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${expired ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                            <span className={`text-xs font-semibold ${expired ? 'text-red-400' : 'text-emerald-400'}`}>
                              {expired ? 'Süresi Dolmuş' : 'Aktif'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Crown size={48} className="text-gold/20 mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] text-sm">
              {search || tierFilter !== 'all' ? 'Arama kriterine uyan premium üye bulunamadı.' : 'Henüz premium üye yok.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
