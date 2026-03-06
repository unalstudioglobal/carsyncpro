import React, { useEffect, useState, useMemo } from 'react';
import { fetchAllUsers } from '../services/adminService';
import {
    Trophy, Search, ArrowUp, ArrowDown,
    Medal, Star, User, Mail, Hash
} from 'lucide-react';
import type { UserProfile } from '../types';

export const Leaderboard: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const allUsers = await fetchAllUsers();
            // Default to points if available, otherwise 0
            const processedUsers = allUsers.map(u => ({
                ...u,
                totalPoints: u.totalPoints || 0
            }));
            setUsers(processedUsers);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const sortedAndFilteredUsers = useMemo(() => {
        return users
            .filter(user =>
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                const pointsA = a.totalPoints || 0;
                const pointsB = b.totalPoints || 0;
                return sortOrder === 'desc' ? pointsB - pointsA : pointsA - pointsB;
            });
    }, [users, searchQuery, sortOrder]);

    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1: return <div className="bg-gold/20 text-gold p-1.5 rounded-lg shadow-lg shadow-gold/10 border border-gold/20"><Medal size={16} /></div>;
            case 2: return <div className="bg-slate-300/20 text-slate-300 p-1.5 rounded-lg border border-slate-300/20"><Medal size={16} /></div>;
            case 3: return <div className="bg-amber-600/20 text-amber-600 p-1.5 rounded-lg border border-amber-600/20"><Medal size={16} /></div>;
            default: return <span className="text-[var(--text-muted)] font-mono text-xs">#{rank}</span>;
        }
    };

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
            <p className="text-[var(--text-secondary)]">Sıralama yükleniyor...</p>
        </div>
    );

    return (
        <div className="p-4 lg:p-10 space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                            <Trophy size={24} />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Küresel Liderlik Tablosu</h1>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm">Tüm kullanıcıların puan ve aktivite bazlı sıralaması.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-gold transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Kullanıcı ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white outline-none focus:border-gold/30 transition-all w-full md:w-80"
                    />
                </div>
            </header>

            {/* TOP 3 HIGHLIGHT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {sortedAndFilteredUsers.slice(0, 3).map((user, idx) => (
                    <div key={user.uid} className={`glass p-6 rounded-[32px] border-white/5 relative overflow-hidden group transition-all hover:scale-[1.02] ${idx === 0 ? 'bg-gold/5 border-gold/20 ring-1 ring-gold/10' : ''}`}>
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy size={100} className={idx === 0 ? 'text-gold' : 'text-white'} />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-2xl font-bold text-white border border-white/10">
                                    {user.name?.[0] || 'U'}
                                </div>
                                <div className="absolute -bottom-2 -right-2">
                                    {getRankBadge(idx + 1)}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white truncate max-w-[150px]">{user.name}</h3>
                                <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                                <div className="mt-2 flex items-center gap-1.5 text-gold font-bold">
                                    <Star size={14} fill="currentColor" />
                                    <span>{user.totalPoints} Puan</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* FULL LIST */}
            <div className="glass rounded-[32px] border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                                <div className="flex items-center gap-2">
                                    <Hash size={12} /> Sıra
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                                <div className="flex items-center gap-2">
                                    <User size={12} /> Kullanıcı
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                                <div className="flex items-center gap-2">
                                    <Mail size={12} /> E-posta
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                    className="flex items-center gap-2 hover:text-gold transition-colors"
                                >
                                    <Star size={12} /> Puan
                                    {sortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedAndFilteredUsers.map((user, index) => (
                            <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center w-8">
                                        {getRankBadge(index + 1)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white border border-white/5">
                                            {user.name?.[0] || 'U'}
                                        </div>
                                        <span className="text-sm font-medium text-white">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-[var(--text-muted)]">{user.email}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gold font-bold">
                                        <Star size={14} fill="currentColor" className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                        {user.totalPoints}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {sortedAndFilteredUsers.length === 0 && (
                    <div className="p-20 text-center">
                        <Trophy size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-[var(--text-secondary)]">Kullanıcı bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
