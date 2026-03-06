import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import { useNavigate } from 'react-router-dom';
import {
    Users, Shield, Crown, Search,
    Car, X,
    ShieldAlert, Trash2, Clock,
    ChevronRight, AlertCircle,
    Download, CheckSquare, Square
} from 'lucide-react';
import type { UserProfile, Vehicle } from '../types';
import { fetchUserVehicles, fetchUserFullActivity } from '../services/adminService';
import { Skeleton } from '../components/Skeleton';

export const Dashboard: React.FC = () => {
    const {
        users, loading, vehicles,
        subscribeToUsers, subscribeToVehicles,
        changeUserRole, deleteUser, bulkDeleteUsers
    } = useAdminStore();
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
    const [userLogs, setUserLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'vehicles' | 'logs'>('vehicles');
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubUsers = subscribeToUsers();
        const unsubVehicles = subscribeToVehicles();
        return () => {
            unsubUsers();
            unsubVehicles();
        };
    }, [subscribeToUsers, subscribeToVehicles]);

    const handleUserSelect = async (user: UserProfile) => {
        setSelectedUser(user);
        setLoadingDetails(true);
        setActiveTab('vehicles');
        try {
            const [v, logs] = await Promise.all([
                fetchUserVehicles(user.uid),
                fetchUserFullActivity(user.uid)
            ]);
            setUserVehicles(v);
            setUserLogs(logs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDeleteUser = async (uid: string) => {
        try {
            await deleteUser(uid);
            setConfirmDelete(null);
            if (selectedUser?.uid === uid) setSelectedUser(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUserIds.length === 0) return;
        if (!window.confirm(`${selectedUserIds.length} kullanıcı kalıcı olarak silinecek. Emin misiniz?`)) return;

        try {
            await bulkDeleteUsers(selectedUserIds);
            setSelectedUserIds([]);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSelectAll = () => {
        if (selectedUserIds.length === filteredUsers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredUsers.map(u => u.uid));
        }
    };

    const toggleSelectUser = (e: React.MouseEvent, uid: string) => {
        e.stopPropagation();
        setSelectedUserIds(prev =>
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    const exportToCSV = () => {
        const headers = ["Ad/Soyad", "Email", "Rol", "Premium", "Araç Sayısı"];
        const rows = users.map(u => [
            `${u.name || ''} ${u.surname || ''}`.trim(),
            u.email,
            u.role || 'user',
            u.isPremium ? 'Evet' : 'Hayır',
            vehicles.filter(v => v.userId === u.uid).length
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `carsync_users_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = [
        { label: 'Toplam Kullanıcı', value: users.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Premium Üye', value: users.filter(u => u.isPremium).length, icon: Crown, color: 'text-gold', bg: 'bg-gold-dim' },
        { label: 'Yöneticiler', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'Kayıtlı Araç', value: vehicles.length, icon: Car, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    ];

    return (
        <div className="p-10">
            <header className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Yönetim Paneli</h2>
                    <p className="text-[var(--text-secondary)]">Platformunuzun genel durumuna ve kullanıcılara buradan göz atın.</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl glass hover:bg-gold/10 hover:text-gold transition-all font-semibold text-sm border-white/5"
                >
                    <Download size={18} />
                    Veriyi Dışa Aktar (.CSV)
                </button>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {loading ? (
                    [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-[32px]" />)
                ) : stats.map((stat, i) => (
                    <div
                        key={i}
                        onClick={() => stat.label === 'Kayıtlı Araç' && navigate('/vehicles')}
                        className={`glass p-8 rounded-[32px] border-white/5 relative overflow-hidden group hover:border-gold/20 transition-all ${stat.label === 'Kayıtlı Araç' ? 'cursor-pointer' : ''}`}
                    >
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-[var(--text-secondary)] text-sm mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                        <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${stat.bg} blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                    </div>
                ))}
            </div>

            {/* Users Table */}
            <div className="glass rounded-[40px] border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <h3 className="text-xl font-bold text-white">Sistem Kullanıcıları</h3>
                        {selectedUserIds.length > 0 && (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                                <span className="text-sm font-bold text-gold">{selectedUserIds.length} seçildi</span>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold border border-red-500/20"
                                >
                                    <Trash2 size={14} /> Toplu Sil
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                        <input
                            type="text"
                            placeholder="Kullanıcı ara..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white outline-none focus:border-gold/30 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-widest border-b border-white/5">
                                <th className="px-8 py-5 font-black w-10">
                                    <button onClick={toggleSelectAll} className="text-[var(--text-muted)] hover:text-gold transition-colors">
                                        {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
                                </th>
                                <th className="px-8 py-5 font-black">Kullanıcı Bilgisi</th>
                                <th className="px-8 py-5 font-black">Rol</th>
                                <th className="px-8 py-5 font-black">Durum</th>
                                <th className="px-8 py-5 font-black text-right">Eylemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading && users.length === 0 ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}>
                                        <td className="px-8 py-5"><Skeleton className="h-5 w-5" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-10 w-48" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-6 w-20" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-6 w-24" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-9 w-9 float-right" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.map((user) => (
                                <tr
                                    key={user.uid}
                                    onClick={() => handleUserSelect(user)}
                                    className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${selectedUserIds.includes(user.uid) ? 'bg-gold/5' : ''}`}
                                >
                                    <td className="px-8 py-5" onClick={(e) => toggleSelectUser(e, user.uid)}>
                                        <div className="text-[var(--text-muted)] group-hover:text-gold transition-colors">
                                            {selectedUserIds.includes(user.uid) ? <CheckSquare size={18} className="text-gold" /> : <Square size={18} />}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gold font-bold overflow-hidden">
                                                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : (user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-gold transition-colors">{user.name || 'İsimsiz'} {user.surname || ''}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-lg border ${user.role === 'admin' ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-white/5 border-white/10 text-[var(--text-secondary)]'}`}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${user.isPremium ? 'bg-gold' : 'bg-white/20'}`} />
                                            <span className="text-xs font-semibold">{user.isPremium ? 'Premium' : 'Standart'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    changeUserRole(user.uid, user.role === 'admin' ? 'user' : 'admin');
                                                }}
                                                className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-gold-dim hover:text-gold border border-white/5 transition-all"
                                                title={user.role === 'admin' ? 'Yönetici Yetkisini Al' : 'Yönetici Yap'}
                                            >
                                                {user.role === 'admin' ? <ShieldAlert size={16} /> : <Shield size={16} />}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmDelete(user.uid);
                                                }}
                                                className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 border border-red-500/10 transition-all"
                                                title="Kullanıcıyı Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setConfirmDelete(null)} />
                    <div className="relative glass p-8 rounded-[40px] border-red-500/20 max-w-md w-full text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Kullanıcı Siliniyor</h3>
                        <p className="text-[var(--text-secondary)] text-sm mb-8">Bu işlemi geri alamazsınız. Kullanıcının tüm verileri platformdan kaldırılacaktır.</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => handleDeleteUser(confirmDelete)}
                                className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:scale-105 active:scale-95 transition-all"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Slide-over (Unchanged but ensuring it works with selection) */}
            {selectedUser && (
                <div className="fixed inset-0 z-[90] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />

                    <div className="relative w-full max-w-2xl h-full bg-[var(--bg-void)] border-l border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <header className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gold-dim border border-gold/20 flex items-center justify-center text-gold font-bold text-2xl overflow-hidden">
                                    {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" alt="" /> : (selectedUser.name?.[0] || selectedUser.email?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white leading-none mb-1">{selectedUser.name || 'İsimsiz'} {selectedUser.surname || ''}</h3>
                                    <p className="text-[var(--text-secondary)] text-sm">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-[var(--text-muted)] transition-colors">
                                <X size={24} />
                            </button>
                        </header>

                        <div className="px-8 mt-6">
                            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl">
                                <button
                                    onClick={() => setActiveTab('vehicles')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'vehicles' ? 'bg-gold text-void shadow-lg shadow-gold/20' : 'text-[var(--text-secondary)] hover:text-white'}`}
                                >
                                    <Car size={18} /> Araçlar ({userVehicles.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('logs')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'logs' ? 'bg-gold text-void shadow-lg shadow-gold/20' : 'text-[var(--text-secondary)] hover:text-white'}`}
                                >
                                    <Clock size={18} /> Aktivite Günlüğü
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-8">
                            {activeTab === 'vehicles' ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="glass p-6 rounded-3xl border-white/5">
                                            <p className="text-[var(--text-muted)] text-[10px] font-black tracking-widest uppercase mb-1">Hesap Türü</p>
                                            <div className="flex items-center gap-2 text-gold">
                                                <Crown size={20} />
                                                <span className="font-bold">{selectedUser.isPremium ? 'Premium' : 'Standart'}</span>
                                            </div>
                                        </div>
                                        <div className="glass p-6 rounded-3xl border-white/5">
                                            <p className="text-[var(--text-muted)] text-[10px] font-black tracking-widest uppercase mb-1">Kayıt Tarihi</p>
                                            <div className="flex items-center gap-2 text-white">
                                                <ChevronRight size={18} className="text-gold" />
                                                <span className="font-bold text-sm">Üye</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <Car size={18} className="text-gold" /> Kayıtlı Araçlar
                                        </h4>
                                        {loadingDetails ? (
                                            <div className="space-y-4">
                                                {[1, 2].map(i => <div key={i} className="h-24 glass rounded-2xl animate-pulse" />)}
                                            </div>
                                        ) : userVehicles.length === 0 ? (
                                            <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                                <p className="text-[var(--text-secondary)] text-sm italic">Henüz araç eklenmemiş.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {userVehicles.map(vehicle => (
                                                    <div key={vehicle.id} className="glass p-5 rounded-2xl border-white/5 flex items-center justify-between group hover:border-gold/20 transition-all">
                                                        <div>
                                                            <p className="font-bold text-white group-hover:text-gold transition-colors">{vehicle.brand} {vehicle.model}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">{vehicle.plate}</span>
                                                                <span className="text-xs text-[var(--text-muted)]">{vehicle.year}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-bold text-white">{vehicle.mileage?.toLocaleString()} km</p>
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mt-2 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                                                                <ChevronRight size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <Clock size={18} className="text-gold" /> Son İşlemler
                                    </h4>
                                    {loadingDetails ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                                        </div>
                                    ) : userLogs.length === 0 ? (
                                        <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                            <p className="text-[var(--text-secondary)] text-sm italic">Aktivite günlüğü boş.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                                            {userLogs.map((log, index) => (
                                                <div key={log.id || index} className="relative pl-12">
                                                    <div className="absolute left-4 top-2 w-4 h-4 rounded-full bg-[var(--bg-void)] border-2 border-gold z-10" />
                                                    <div className="glass p-4 rounded-2xl border-white/5">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-sm font-bold text-white capitalize">{log.type?.replace('_', ' ') || 'İşlem'}</p>
                                                            <span className="text-[10px] text-[var(--text-muted)]">
                                                                {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString('tr-TR') : 'Şimdi'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{log.details || log.message || 'Detay belirtilmemiş.'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <footer className="p-8 border-t border-white/5 flex gap-4">
                            <button
                                onClick={() => changeUserRole(selectedUser.uid, selectedUser.role === 'admin' ? 'user' : 'admin')}
                                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-gold-dim hover:text-gold transition-all flex items-center justify-center gap-2 group"
                            >
                                <Shield size={18} className="group-hover:rotate-12 transition-transform" />
                                {selectedUser.role === 'admin' ? 'Yetkiyi Kaldır' : 'Yönetici Yap'}
                            </button>
                            <button
                                onClick={() => setConfirmDelete(selectedUser.uid)}
                                className="px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all"
                            >
                                <Trash2 size={20} />
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};
