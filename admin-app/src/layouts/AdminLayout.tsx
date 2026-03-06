import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Shield, Car, Activity, LogOut,
    Settings as SettingsIcon,
    TrendingUp, ClipboardList, Crown, UserCheck, Send, User, Globe,
    LayoutGrid, ChevronDown, ChevronUp, HelpCircle, Calendar
} from 'lucide-react';
import { auth } from '../firebaseConfig';
import { Toaster } from 'react-hot-toast';

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen] = useState(true);

    const handleLogout = () => {
        auth.signOut();
        navigate('/');
    };

    const menuItems = [
        { path: '/dashboard', label: 'Genel Bakış', icon: Activity },
        {
            label: 'Quiz Bölgesi',
            icon: LayoutGrid,
            subItems: [
                { path: '/categories', label: 'Kategoriler' },
                { path: '/sub-categories', label: 'Alt Kategoriler' },
            ]
        },
        { path: '/questions', label: 'Sorular', icon: HelpCircle },
        { path: '/daily-quiz', label: 'Günlük Test', icon: Calendar },
        { path: '/users-list', label: 'Kullanıcı Listesi', icon: User },
        { path: '/languages', label: 'Diller', icon: Globe },
        { path: '/analytics', label: 'Analitik', icon: TrendingUp },
        { path: '/subscriptions', label: 'Abonelikler', icon: Crown },
        { path: '/vehicles', label: 'Sistemdeki Araçlar', icon: Car },
        { path: '/audit-logs', label: 'Denetim Kayıtları', icon: ClipboardList },
        { path: '/users', label: 'Yönetici Hesapları', icon: UserCheck },
        { path: '/notifications', label: 'Bildirim Gönder', icon: Send },
        { path: '/settings', label: 'Sistem Ayarları', icon: SettingsIcon },
        { path: '/firebase-settings', label: 'Firebase Ayarları', icon: Shield },
    ];

    const [openMenus, setOpenMenus] = useState<string[]>(['Quiz Bölgesi']);

    const toggleMenu = (label: string) => {
        setOpenMenus(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    return (
        <div className="min-h-screen bg-[var(--bg-void)] flex text-[var(--text-primary)]">
            {/* Sidebar */}
            <aside className={`w-72 border-r border-white/5 bg-[var(--bg-void)]/50 backdrop-blur-xl p-6 transition-all duration-300 flex flex-col sticky top-0 h-screen ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="mb-10 flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                        <Shield className="text-[var(--bg-void)]" size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight text-white leading-none">CarSync</h1>
                        <span className="text-[10px] font-black tracking-[0.2em] text-gold uppercase opacity-80">Admin Pro</span>
                    </div>
                </div>

                <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {menuItems.map((item) => (
                        <div key={item.label}>
                            {item.subItems ? (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => toggleMenu(item.label)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:bg-white/5 text-[var(--text-secondary)]`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <item.icon size={20} />
                                            <span>{item.label}</span>
                                        </div>
                                        {openMenus.includes(item.label) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>

                                    {openMenus.includes(item.label) && (
                                        <div className="ml-12 space-y-1">
                                            {item.subItems.map(sub => (
                                                <button
                                                    key={sub.path}
                                                    onClick={() => navigate(sub.path)}
                                                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${location.pathname === sub.path ? 'text-gold font-bold' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                                                >
                                                    {sub.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => item.path && navigate(item.path)}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-gold-dim border border-gold/10 text-gold font-semibold' : 'hover:bg-white/5 text-[var(--text-secondary)]'}`}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </button>
                            )}
                        </div>
                    ))}
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-all font-medium mt-auto"
                >
                    <LogOut size={20} />
                    <span>Oturumu Kapat</span>
                </button>
            </aside >

            {/* Main Content */}
            < main className="flex-1 overflow-auto" >
                <Outlet />
            </main >
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#0a0a0a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        </div >
    );
};
