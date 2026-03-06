import React, { useState, useMemo } from 'react';
import { useAdminStore } from '../store/adminStore';
import {
    UserPlus, Mail, Lock,
    Trash2, Edit, Search, RefreshCw,
    UserCog, User, Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const UsersManagement: React.FC = () => {
    const { users, createAdminUser, deleteUser } = useAdminStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        surname: '',
        role: 'editor'
    });

    const filteredUsers = useMemo(() => {
        // Only show users with administrative roles (admin, editor) or all if needed.
        // The user's screenshot shows specifically admin/editor management.
        return users.filter(u =>
        (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [users, searchTerm]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast.error('Lütfen tüm zorunlu alanları doldurun');
            return;
        }

        setIsLoading(true);
        try {
            const result = await createAdminUser(formData);
            if (result.success) {
                toast.success('Kullanıcı başarıyla oluşturuldu');
                setFormData({ email: '', password: '', name: '', surname: '', role: 'editor' });
            } else {
                toast.error(result.error || 'Kullanıcı oluşturulamadı');
            }
        } catch (err) {
            toast.error('Bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (uid: string) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            try {
                await deleteUser(uid);
                toast.success('Kullanıcı silindi');
            } catch (err) {
                toast.error('Kullanıcı silinemedi');
            }
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Kullanıcı Hesapları ve Hakları</h2>
                    <p className="text-[var(--text-secondary)]">Sistem yöneticilerini ve yetkilerini yönetin.</p>
                </div>
            </div>

            {/* Create User Form */}
            <div className="glass p-8 rounded-[40px] border-white/5 mb-8">
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <UserPlus size={20} className="text-gold" /> Yeni Kullanıcı Ekle
                </h3>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">E-Posta Adresi</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="admin@carsync.pro"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Geçici Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Adı Soyadı</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => {
                                    const parts = e.target.value.split(' ');
                                    setFormData({ ...formData, name: parts[0], surname: parts.slice(1).join(' ') });
                                }}
                                placeholder="Örn: Ahmet Yılmaz"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Rol Seçin</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-gold/50 transition-all appearance-none"
                        >
                            <option value="editor" className="bg-[#0a0a0a]">Editör</option>
                            <option value="admin" className="bg-[#0a0a0a]">Yönetici (Full)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gold hover:bg-gold-light text-[var(--bg-void)] font-bold py-3.5 px-8 rounded-2xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Şimdi Ekle'}
                    </button>
                </form>
            </div>

            {/* User List Table */}
            <div className="glass rounded-[40px] border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Kullanıcı ara..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-all"
                        />
                    </div>
                    <div className="text-[var(--text-secondary)] text-sm">
                        Toplam <span className="text-white font-bold">{filteredUsers.length}</span> yönetici bulundu
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left bg-white/[0.01]">
                                <th className="px-8 py-5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Kullanıcı Bilgisi</th>
                                <th className="px-8 py-5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Rol</th>
                                <th className="px-8 py-5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Durum</th>
                                <th className="px-8 py-5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Kayıt Tarihi</th>
                                <th className="px-8 py-5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/5 text-gold group-hover:scale-110 transition-transform">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{user.name} {user.surname}</div>
                                                <div className="text-sm text-[var(--text-secondary)]">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-2 w-fit ${user.role === 'admin'
                                            ? 'bg-gold/10 text-gold border border-gold/20'
                                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                            {user.role === 'admin' ? <Shield size={12} /> : <UserCog size={12} />}
                                            {user.role === 'admin' ? 'Yönetici' : 'Editör'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                            <span className="text-emerald-400 font-medium">Aktif</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm text-[var(--text-secondary)]">2026-03-04</div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2.5 rounded-xl bg-white/5 hover:bg-gold/10 text-[var(--text-secondary)] hover:text-gold transition-all border border-transparent hover:border-gold/20">
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.uid)}
                                                className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
