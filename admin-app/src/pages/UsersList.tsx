import React, { useEffect, useState, useMemo } from 'react';
import { useAdminStore } from '../store/adminStore';
import {
    Search, Filter, Download, MoreVertical,
    Edit, Eye, Trash2, Mail, Phone,
    Database, Globe,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const UsersList: React.FC = () => {
    const { users, subscribeToUsers, deleteUser } = useAdminStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const unsubscribe = subscribeToUsers();
        return () => unsubscribe();
    }, [subscribeToUsers]);

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.uid.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const toggleSelectAll = () => {
        if (selectedUsers.length === paginatedUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(paginatedUsers.map(u => u.uid));
        }
    };

    const toggleSelectUser = (uid: string) => {
        if (selectedUsers.includes(uid)) {
            setSelectedUsers(selectedUsers.filter(id => id !== uid));
        } else {
            setSelectedUsers([...selectedUsers, uid]);
        }
    };

    const handleDelete = async (uid: string) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            try {
                await deleteUser(uid);
                toast.success('Kullanıcı başarıyla silindi');
            } catch (err) {
                toast.error('Silme işlemi başarısız');
            }
        }
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                        Users Details <span className="text-xs font-normal text-white/40 normal-case ml-2">View / Update / Delete</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all">
                        <Download size={14} /> Report This Page
                    </button>
                    <div className="h-8 w-[1px] bg-white/10 mx-2 hidden md:block" />
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                        <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Filter size={16} /></button>
                        <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Database size={16} /></button>
                        <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><MoreVertical size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="glass rounded-[32px] border-white/5 overflow-hidden flex flex-col shadow-2xl">
                {/* Search & Actions Bar */}
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.01]">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by Name, Email or UID..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-white/40">
                        {selectedUsers.length > 0 && (
                            <button className="text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest px-4 border-r border-white/10 mr-2 flex items-center gap-2">
                                <Trash2 size={12} /> Delete Selected ({selectedUsers.length})
                            </button>
                        )}
                        Showing <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="text-white">{filteredUsers.length}</span> users
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                                    />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">ID</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">Image</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">Email</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">Mobile</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider text-center">Points</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">Referral Code</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">FCM ID</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">IP Address</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">Register Date</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.uid)}
                                            onChange={() => toggleSelectUser(user.uid)}
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-mono text-white/40">{user.uid.slice(0, 5)}...</td>
                                    <td className="px-6 py-4">
                                        {user.avatar ? (
                                            <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/5 text-xs font-bold text-white/40">
                                                {user.name?.[0]}{user.surname?.[0]}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">{user.name} {user.surname}</td>
                                    <td className="px-6 py-4 text-xs text-white/60 font-medium">{user.email}</td>
                                    <td className="px-6 py-4 text-xs text-white/60 font-medium whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Phone size={12} className="text-white/20" />
                                            {user.phone || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                            {user.email?.includes('gmail') ? (
                                                <Globe className="text-red-400" size={14} />
                                            ) : (
                                                <Mail className="text-blue-400" size={14} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-black text-gold bg-gold/10 px-2 py-1 rounded-md">{user.totalPoints || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-white/40">{user.referralCode || 'N/A'}</td>
                                    <td className="px-6 py-4 max-w-[120px]">
                                        <div className="truncate text-[10px] text-white/20 hover:text-white/60 cursor-help transition-colors" title={user.fcmToken}>
                                            {user.fcmToken || 'No Token'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] font-mono text-white/40">{user.ipAddress || '0.0.0.0'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${user.status === 'inactive' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'inactive' ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`} />
                                            {user.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] text-white/40 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"><Eye size={14} /></button>
                                            <button className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"><Edit size={14} /></button>
                                            <button
                                                onClick={() => handleDelete(user.uid)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                            ><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.01]">
                    <div className="text-xs text-white/40 font-bold">
                        Showing {itemsPerPage} per page
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(v => v - 1)}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-white/10 transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(v => v + 1)}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-white/10 transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
