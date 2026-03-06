import React, { useEffect } from 'react';
import { useAdminStore } from '../store/adminStore';
import {
    Clock, Shield, User, Info,
    AlertCircle, Trash2, Settings
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

const ActionIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
        case 'DELETE_USER':
        case 'DELETE_VEHICLE':
            return <Trash2 className="text-red-400" size={18} />;
        case 'ROLE_CHANGE':
            return <Shield className="text-emerald-400" size={18} />;
        case 'CONFIG_UPDATE':
            return <Settings className="text-blue-400" size={18} />;
        default:
            return <Info className="text-gold" size={18} />;
    }
};

export const AuditLogs: React.FC = () => {
    const { auditLogs, loading, subscribeToAuditLogs } = useAdminStore();

    useEffect(() => {
        const unsub = subscribeToAuditLogs();
        return () => unsub();
    }, [subscribeToAuditLogs]);

    return (
        <div className="p-10">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-white mb-2">Denetim Kayıtları</h1>
                <p className="text-[var(--text-secondary)]">Sistem yöneticileri tarafından gerçekleştirilen tüm kritik işlemler.</p>
            </header>

            <div className="glass rounded-[40px] border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-widest border-b border-white/5">
                                <th className="px-8 py-6 font-black">Zaman Damgası</th>
                                <th className="px-8 py-6 font-black">Yönetici</th>
                                <th className="px-8 py-6 font-black">İşlem</th>
                                <th className="px-8 py-6 font-black">Hedef</th>
                                <th className="px-8 py-6 font-black">Detaylar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading && auditLogs.length === 0 ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}>
                                        <td className="px-8 py-6"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-8 py-6"><Skeleton className="h-4 w-40" /></td>
                                        <td className="px-8 py-6"><Skeleton className="h-6 w-24" /></td>
                                        <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-8 py-6"><Skeleton className="h-4 w-48" /></td>
                                    </tr>
                                ))
                            ) : auditLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
                                            <AlertCircle size={32} />
                                        </div>
                                        <p className="text-[var(--text-secondary)] italic">Kayıtlı işlem kaydı bulunamadı.</p>
                                    </td>
                                </tr>
                            ) : auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                                            <Clock size={14} className="text-gold opacity-50" />
                                            {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString('tr-TR') : 'Şimdi'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gold border border-white/5 group-hover:scale-110 transition-transform">
                                                <User size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-white group-hover:text-gold transition-colors">{log.adminName}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <ActionIcon type={log.action} />
                                            <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[var(--text-muted)]">
                                                {log.action.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-medium text-[var(--text-secondary)]">{log.targetId || '-'}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs text-white/80 line-clamp-1 group-hover:line-clamp-none transition-all pr-4">{log.details}</p>
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
