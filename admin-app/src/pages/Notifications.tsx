import React, { useState, useMemo, useEffect } from 'react';
import { useAdminStore } from '../store/adminStore';
import {
    Send, Bell, Users, Search,
    History, Info, AlertTriangle,
    CheckCircle, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Notifications: React.FC = () => {
    const {
        users, notificationHistory, subscribeToUsers,
        subscribeToNotificationHistory, sendPush
    } = useAdminStore();

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState('info');
    const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const unsubUsers = subscribeToUsers();
        const unsubHistory = subscribeToNotificationHistory();
        return () => {
            unsubUsers();
            unsubHistory();
        };
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const handleSelectUser = (uid: string) => {
        setSelectedUserIds(prev =>
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    const handleSelectAll = () => {
        if (selectedUserIds.length === filteredUsers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredUsers.map(u => u.uid));
        }
    };

    const handleSend = async () => {
        if (!title || !body) {
            toast.error('Lütfen başlık ve mesaj girin');
            return;
        }

        if (targetType === 'selected' && selectedUserIds.length === 0) {
            toast.error('Lütfen en az bir kullanıcı seçin');
            return;
        }

        setSending(true);
        try {
            const payload = { title, body, type };

            if (targetType === 'all') {
                await sendPush({ payload, topic: 'all_users' });
                toast.success('Bildirim tüm kullanıcılara gönderildi!', { id: 'push-sending' });
            } else {
                toast.loading(`${selectedUserIds.length} kullanıcıya gönderiliyor...`, { id: 'push-sending' });

                // Seçili her kullanıcıya kendi topic'i üzerinden gönder
                let successCount = 0;
                for (const uid of selectedUserIds) {
                    const res = await sendPush({ payload, topic: `user-${uid}` });
                    if (res.success) successCount++;
                }

                toast.success(`${successCount} kullanıcıya başarıyla iletildi.`, { id: 'push-sending' });
            }

            setTitle('');
            setBody('');
            setSelectedUserIds([]);
        } catch (err) {
            console.error('Push error:', err);
            toast.error('Bir hata oluştu', { id: 'push-sending' });
        } finally {
            setSending(false);
        }
    };

    const getTypeIcon = (t: string) => {
        switch (t) {
            case 'warning': return <AlertTriangle size={14} className="text-amber-400" />;
            case 'success': return <CheckCircle size={14} className="text-emerald-400" />;
            default: return <Info size={14} className="text-blue-400" />;
        }
    };

    return (
        <div className="p-8 pb-24">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
                        <Bell className="text-gold" size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight uppercase">Bildirim Merkezi</h1>
                        <p className="text-[var(--text-secondary)] text-sm">Kullanıcılara anlık bildirim gönderin ve geçmişi takip edin.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Area */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="glass-card p-6 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Send size={80} />
                        </div>

                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Send size={18} className="text-gold" />
                            Yeni Bildirim
                        </h2>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2 opacity-60">Hedef Kitle</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setTargetType('all')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${targetType === 'all'
                                            ? 'bg-gold/10 border-gold/40 text-gold shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                                            : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10'
                                            }`}
                                    >
                                        <Users size={16} />
                                        <span className="text-sm font-bold">Tüm Kullanıcılar</span>
                                    </button>
                                    <button
                                        onClick={() => setTargetType('selected')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${targetType === 'selected'
                                            ? 'bg-gold/10 border-gold/40 text-gold shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                                            : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10'
                                            }`}
                                    >
                                        <UserPlus size={16} />
                                        <span className="text-sm font-bold">Seçili Kişiler</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2 opacity-60">Bildirim Tipi</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"
                                >
                                    <option value="info">Bilgilendirme (Mavi)</option>
                                    <option value="warning">Uyarı (Turuncu)</option>
                                    <option value="success">Başarı (Yeşil)</option>
                                    <option value="premium">Premium Duyurusu (Altın)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2 opacity-60">Başlık</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Bildirim başlığı..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2 opacity-60">Mesaj</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Bildirim içeriği..."
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="w-full bg-gradient-to-r from-gold to-yellow-600 text-black font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {sending ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                                {sending ? 'Gönderiliyor...' : 'Bildirimi Gönder'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* User Selection or Info Area */}
                <div className="lg:col-span-7 space-y-6">
                    {targetType === 'selected' ? (
                        <div className="glass-card border border-white/5 overflow-hidden flex flex-col h-[600px]">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Users size={18} className="text-gold" />
                                    Kullanıcı Seçimi
                                    <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-black ml-2">
                                        {selectedUserIds.length} Seçili
                                    </span>
                                </h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Kullanıcı ara..."
                                        className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-gold/30 w-64"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-[#0f0f0f] z-10">
                                        <tr className="border-b border-white/5">
                                            <th className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-gold transition-all"
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider opacity-60">Kullanıcı</th>
                                            <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider opacity-60">Email</th>
                                            <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider opacity-60">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.map(user => (
                                            <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.includes(user.uid)}
                                                        onChange={() => handleSelectUser(user.uid)}
                                                        className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-gold transition-all"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white text-sm">{user.name} {user.surname}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-[var(--text-secondary)]">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${user.isPremium ? 'bg-gold/10 text-gold' : 'bg-white/10 text-white/40'
                                                        }`}>
                                                        {user.isPremium ? 'PREMIUM' : 'FREE'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 h-[600px] bg-gradient-to-br from-gold/5 to-transparent">
                            <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20 animate-pulse">
                                <Users size={40} className="text-gold" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Tüm Kullanıcılara Gönderim</h3>
                                <p className="text-[var(--text-secondary)] max-w-sm mx-auto">
                                    "Tüm Kullanıcılar" seçeneğiyle gönderilen bildirimler, uygulamayı kullanan ve bildirim izni vermiş olan tüm cihazlara anında iletilir.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="text-[10px] text-gold font-black uppercase mb-1">Kapsam</div>
                                    <div className="text-lg font-bold text-white">Genel Duyuru</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="text-[10px] text-gold font-black uppercase mb-1">Tahmini Alıcı</div>
                                    <div className="text-lg font-bold text-white">{users.length}+ Cihaz</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* History Table */}
            <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                        <History size={24} className="text-gold" />
                        Bildirim Geçmişi
                    </h2>
                </div>

                <div className="glass-card border border-white/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.03] border-b border-white/5">
                                <th className="px-8 py-5 text-xs font-bold text-white uppercase tracking-wider opacity-60">Tip & Başlık</th>
                                <th className="px-8 py-5 text-xs font-bold text-white uppercase tracking-wider opacity-60">Mesaj</th>
                                <th className="px-8 py-5 text-xs font-bold text-white uppercase tracking-wider opacity-60">Hedef</th>
                                <th className="px-8 py-5 text-xs font-bold text-white uppercase tracking-wider opacity-60 text-right">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {notificationHistory.map(log => (
                                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                                {getTypeIcon(log.type)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{log.title}</div>
                                                <div className="text-[10px] font-black uppercase tracking-tighter text-gold/60">{log.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 max-w-md">
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{log.body}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-white/30" />
                                            <span className="text-xs font-bold text-white/50">
                                                {log.topic === 'all_users' ? 'Herkes' : `${log.recipientCount} Kişi`}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className="text-sm font-medium text-white">
                                                {log.sentAt?.toDate ? log.sentAt.toDate().toLocaleDateString('tr-TR') : 'Bugün'}
                                            </div>
                                            <div className="text-xs text-[var(--text-secondary)] opacity-50 flex items-center gap-1">
                                                <Clock size={10} />
                                                {log.sentAt?.toDate ? log.sentAt.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {notificationHistory.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-[var(--text-secondary)] opacity-30 italic">
                                        Henüz gönderilmiş bildirim bulunmuyor.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const UserPlus = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24" height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" />
    </svg>
);

const RefreshCw = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24" height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
    </svg>
);
