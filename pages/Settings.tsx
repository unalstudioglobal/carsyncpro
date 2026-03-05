import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Mail, Camera, Save, LogOut, Bell, Shield, Moon, Lock, Key, Smartphone, ChevronRight, Fuel, Image, FileText, Zap, MessageSquare, Clock, Droplet, RotateCw, ClipboardCheck, Activity, Wallet, Trash2, Info, Globe, ScrollText, ExternalLink, Car, Type, FileDown, Lock as LockIcon, Crown, Archive, RefreshCcw, Star, CreditCard, CheckCircle2, Wrench, AlertTriangle, FileSpreadsheet, Table, AlertOctagon, Palette } from 'lucide-react';
import { Vehicle, ServiceLog } from '../types';
import { AdBanner } from '../components/AdBanner';
import { auth } from '../firebaseConfig';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchVehicles, fetchLogs, getUserProfile, updateUserProfile } from '../services/firestoreService';
import { toast } from '../services/toast';
import { getSetting, saveSetting, removeSetting, clearSettings } from '../services/settingsService';
import { useTranslation, Trans } from 'react-i18next';

export const Settings: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const PRIVACY_POLICY_URL = "https://policies.google.com/privacy";
    const TERMS_OF_USE_URL = "https://policies.google.com/terms";

    // Check Premium Status
    const isPremiumStored = getSetting('isPremium', false);

    // Background Theme State
    const [backgroundTheme, setBackgroundTheme] = useState<'default' | 'blue' | 'mesh'>('default');

    useEffect(() => {
        const savedTheme = getSetting<'default' | 'blue' | 'mesh'>('backgroundTheme', 'default');
        if (savedTheme) setBackgroundTheme(savedTheme);
    }, []);

    const handleBackgroundChange = (theme: 'default' | 'blue' | 'mesh') => {
        setBackgroundTheme(theme);
        saveSetting('backgroundTheme', theme);
        window.dispatchEvent(new Event('theme-change'));
    };

    // User State
    const [user, setUser] = useState({
        name: 'Kullanıcı',
        surname: '',
        email: 'kullanici@ornek.com',
        phone: '',
        department: '',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        isPremium: isPremiumStored
    });

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [logs, setLogs] = useState<ServiceLog[]>([]);

    // Security State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

    // Load User Data from Firebase and Fetch Real Data
    useEffect(() => {
        const firebaseUser = auth.currentUser;

        const loadData = async () => {
            try {
                const [v, l, profile] = await Promise.all([fetchVehicles(), fetchLogs(), getUserProfile()]);
                setVehicles(v);
                setLogs(l);

                if (firebaseUser) {
                    setUser(prev => ({
                        ...prev,
                        name: profile?.name || firebaseUser.displayName || 'Kullanıcı',
                        surname: profile?.surname || '',
                        email: profile?.email || firebaseUser.email || '',
                        phone: profile?.phone || '',
                        department: profile?.department || '',
                        avatar: profile?.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
                    }));
                }
            } catch (error) {
                console.error("Error loading data for settings:", error);
            }
        };
        loadData();
    }, []);

    // Modal States
    const [showWipeModal, setShowWipeModal] = useState(false);

    // Sync state if settings changes
    useEffect(() => {
        const checkPremium = getSetting('isPremium', false);
        if (checkPremium !== user.isPremium) {
            setUser(prev => ({ ...prev, isPremium: checkPremium }));
        }
    }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [tempUser, setTempUser] = useState(user);
    const [view, setView] = useState<'main' | 'security' | 'notifications' | 'reminders' | 'legal' | 'archived' | 'premium'>('main');
    const [archivedVehicles, setArchivedVehicles] = useState<Vehicle[]>([]);

    // Font Size State
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
        return getSetting<'small' | 'medium' | 'large'>('fontSize', 'medium');
    });

    // Notification Preferences State (Persisted)
    const [notifications, setNotifications] = useState(() => {
        return getSetting('notifications', {
            service: true,
            fuel: true,
            insurance: true,
            news: false,
            push: true,
            email: true,
            sms: false,
            dtc: true,
            tax: true
        });
    });

    // Default Reminder Intervals State
    const [reminderSettings, setReminderSettings] = useState({
        oilChange: { km: '10000', months: '12' },
        tireRotation: { km: '20000', months: '12' },
        inspection: { km: '', months: '24' },
    });

    // Dark Mode State
    const [darkMode, setDarkMode] = useState(() => {
        const stored = getSetting<string>('theme', '');
        if (stored) return stored === 'dark';
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            saveSetting('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            saveSetting('theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        if (view === 'archived') {
            const archivedIds = getSetting<string[]>('archivedVehicles', []);
            // Use real vehicles state instead of MOCK_VEHICLES
            // Note: fetchVehicles returns all vehicles, including those that might be considered "archived" if we filter them in UI
            // But here we are filtering from the full list based on ID.
            // If fetchVehicles only returns active vehicles, we might need a different approach.
            // Assuming fetchVehicles returns ALL vehicles for the user.
            const foundVehicles = vehicles.filter(v => archivedIds.includes(v.id));
            setArchivedVehicles(foundVehicles);
        }
    }, [view, vehicles]);

    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
        setFontSize(size);
        saveSetting('fontSize', size);

        const root = document.documentElement;
        if (size === 'small') {
            root.style.fontSize = '14px';
        } else if (size === 'large') {
            root.style.fontSize = '18px';
        } else {
            root.style.fontSize = '16px';
        }
    };

    // --- Export Functions ---

    const downloadFile = (content: string, fileName: string, type: string) => {
        const blob = new Blob(['\uFEFF' + content], { type: `${type};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportLogsCSV = () => {
        if (!user.isPremium) return navigate('/premium');

        const headers = ["Arac ID", "Marka", "Model", "Plaka", "Yil", "Mevcut KM", "Islem Tarihi", "Islem Turu", "Maliyet", "Islem KM", "Notlar"];
        const rows = logs.map(log => {
            const vehicle = vehicles.find(v => v.id === log.vehicleId);
            return [
                vehicle?.id || 'Bilinmiyor',
                vehicle?.brand || '-',
                vehicle?.model || '-',
                vehicle?.plate || '-',
                vehicle?.year || '-',
                vehicle?.mileage || '-',
                log.date,
                log.type,
                log.cost,
                log.mileage,
                log.notes ? `"${log.notes}"` : ''
            ];
        });

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        downloadFile(csvContent, `carsync_service_history_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    };

    const handleExportVehiclesCSV = () => {
        if (!user.isPremium) return navigate('/premium');

        const headers = ["ID", "Marka", "Model", "Yil", "Plaka", "KM", "Durum", "Saglik Puani", "Piyasa Degeri Min", "Piyasa Degeri Max"];
        const rows = vehicles.map(v => [
            v.id,
            v.brand,
            v.model,
            v.year,
            v.plate,
            v.mileage,
            v.status,
            v.healthScore,
            v.marketValueMin,
            v.marketValueMax
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        downloadFile(csvContent, `carsync_garage_list_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    };

    const handleExportPDF = () => {
        if (!user.isPremium) return navigate('/premium');

        const doc = new jsPDF();

        // Title
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("CarSync Pro - Garaj Raporu", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Olusturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 28);

        doc.setLineWidth(0.5);
        doc.line(14, 32, 196, 32);

        // Vehicles Table
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Arac Listesi", 14, 42);

        const vehicleRows = vehicles.map(v => [
            `${v.brand} ${v.model}`,
            v.year.toString(),
            v.plate,
            `${v.mileage.toLocaleString()} km`,
            v.status
        ]);

        autoTable(doc, {
            startY: 46,
            head: [['Arac', 'Yil', 'Plaka', 'KM', 'Durum']],
            body: vehicleRows,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        // Logs Table
        // @ts-ignore
        let finalY = doc.lastAutoTable.finalY || 50;

        if (finalY > 230) {
            doc.addPage();
            finalY = 20;
        } else {
            finalY += 15;
        }

        doc.setFontSize(14);
        doc.text("Servis Gecmisi", 14, finalY);

        const logRows = logs.map(log => {
            const car = vehicles.find(v => v.id === log.vehicleId);
            return [
                log.date,
                car ? car.plate : '-',
                log.type,
                `${log.cost.toLocaleString()} TL`,
                `${log.mileage.toLocaleString()} km`
            ];
        });

        autoTable(doc, {
            startY: finalY + 4,
            head: [['Tarih', 'Plaka', 'Islem', 'Tutar', 'KM']],
            body: logRows,
            theme: 'striped',
            headStyles: { fillColor: [75, 85, 99] }
        });

        // Footer
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('CarSync Pro ile olusturulmustur.', 14, doc.internal.pageSize.height - 10);
            doc.text(`Sayfa ${i} / ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
        }

        doc.save("carsync_garaj_raporu.pdf");
    };

    const handleSave = async () => {
        try {
            await updateUserProfile({
                name: tempUser.name,
                surname: tempUser.surname,
                email: tempUser.email,
                phone: tempUser.phone,
                department: tempUser.department,
                avatar: tempUser.avatar
            });
            setUser(tempUser);
            setIsEditing(false);
            toast.success(t('settings.msg_saved'));
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error(t('settings.msg_err'));
        }
    };

    const handleReminderSave = () => {
        setView('main');
        toast.success(t('settings.reminders_saved'));
    };

    const handleNotificationSave = () => {
        saveSetting('notifications', notifications);
        setView('main');

        if (notifications.service && notifications.fuel) {
            toast.success('Ayarlar kaydedildi. "Yaklaşan Servis" ve "Yakıt Uyarıları" aktif!');
        } else {
            toast.success(t('settings.notif_saved'));
        }
    };

    // Replaces the simple window.confirm with a state change to show the modal
    const handleUpdatePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error(t('settings.pass_mismatch'));
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error(t('settings.pass_short'));
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const user = auth.currentUser;
            if (user && user.email) {
                const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, passwordForm.newPassword);
                setShowPasswordSuccess(true);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setShowPasswordSuccess(false), 3000);
            } else {
                toast.error('Oturum açmış kullanıcı bulunamadı.');
            }
        } catch (error: any) {
            console.error('Şifre güncelleme hatası:', error);
            if (error.code === 'auth/wrong-password') {
                toast.error(t('settings.pass_err_wrong'));
            } else {
                toast.error(t('settings.pass_err_general') + error.message);
            }
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleToggle2FA = async () => {
        const newState = !twoFactorEnabled;
        setTwoFactorEnabled(newState);
        try {
            await updateUserProfile({ twoFactorEnabled: newState });
        } catch (error) {
            console.error('2FA güncelleme hatası:', error);
        }
    };

    const handleDataWipeRequest = () => {
        setShowWipeModal(true);
    };

    const confirmDataWipe = () => {
        clearSettings();
        // Optionally re-set some defaults if needed, or just reload to login
        // For a "wipe", we want a full reset.

        // Close modal
        setShowWipeModal(false);

        // Navigate to login (effectively logging out)
        auth.signOut();

        // Force reload to ensure all memory states are cleared
        window.location.reload();
    };

    const handleCancelSubscription = () => {
        if (window.confirm("t('settings.sub_cancel_confirm') Premium özelliklere erişiminizi kaybedeceksiniz.")) {
            saveSetting('isPremium', false);
            setUser(prev => ({ ...prev, isPremium: false }));
            toast.info("t('settings.sub_cancelled')");
            setView('main');
        }
    };

    const handleRestoreVehicle = (id: string) => {
        // Direct restore logic without complex confirmation dialogs for better UX
        const archivedIds = getSetting<string[]>('archivedVehicles', []);
        const newIds = archivedIds.filter((aid: string) => aid !== id);
        saveSetting('archivedVehicles', newIds);

        // Update local state immediately
        setArchivedVehicles(prev => prev.filter(v => v.id !== id));

        // Notify and offer navigation
        const shouldNavigate = window.confirm("t('settings.restore_confirm')");
        if (shouldNavigate) {
            navigate('/');
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempUser(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleRemoveAvatar = () => {
        setTempUser(prev => ({
            ...prev,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${prev.name}`
        }));
    };

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const openLink = (url: string) => {
        window.open(url, '_blank');
    };

    const handleLogout = async () => {
        if (window.confirm(t('settings.logout_confirm'))) {
            try {
                await signOut(auth);
                removeSetting('isAuthenticated');
                removeSetting('isDemoMode');
                navigate('/login');
                window.location.reload();
            } catch (error) {
                console.error('Error signing out:', error);
                removeSetting('isAuthenticated');
                removeSetting('isDemoMode');
                navigate('/login');
                window.location.reload();
            }
        }
    };

    const commonCardClass = "bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 transition-colors duration-300 shadow-sm";
    const commonHeaderBtnClass = "w-11 h-11 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-100 active:scale-95";
    const commonInputClass = "flex items-center bg-slate-100 dark:bg-slate-900/50 rounded-xl px-4 py-4 border border-slate-200 dark:border-slate-600 focus-within:border-blue-500 transition-colors";


    // Render Archived Vehicles View
    if (view === 'archived') {
        return (
            <div className="p-5 space-y-6 animate-fadeIn">
                <header className="flex items-center space-x-3 pt-2">
                    <button onClick={() => setView('main')} className={commonHeaderBtnClass}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">{t('settings.archived')}</h1>
                </header>
                <div className="space-y-4">
                    {archivedVehicles.length > 0 ? (
                        archivedVehicles.map(vehicle => (
                            <div key={vehicle.id} className={`${commonCardClass} flex items-center space-x-4 animate-fadeIn`}>
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center bg-slate-800">
                                    {vehicle.image ? (
                                        <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover grayscale opacity-70" />
                                    ) : (
                                        <Car size={24} className="text-slate-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-300">{vehicle.brand} {vehicle.model}</h3>
                                    <p className="text-xs text-slate-500">{vehicle.plate} • {vehicle.year}</p>
                                </div>
                                <button
                                    onClick={() => handleRestoreVehicle(vehicle.id)}
                                    className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 transition-all active:scale-95 flex flex-col items-center justify-center"
                                    title="Geri Yükle"
                                >
                                    <RefreshCcw size={20} />
                                    <span className="text-[10px] font-bold mt-1">{t('settings.lbl_restore')}</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-500">
                            <Archive size={40} className="mx-auto mb-3 opacity-30" />
                            <p>{t('settings.msg_no_archived')}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Premium Management View
    if (view === 'premium') {
        return (
            <div className="p-5 space-y-6 animate-fadeIn">
                <header className="flex items-center space-x-3 pt-2">
                    <button onClick={() => setView('main')} className={commonHeaderBtnClass}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">{t('settings.prem_title')}</h1>
                </header>

                {user.isPremium ? (
                    // PREMIUM STATE
                    <>
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl shadow-orange-900/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                                <Crown size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                        <Crown size={18} className="fill-white" />
                                    </div>
                                    <span className="font-bold text-sm tracking-wide bg-white/10 px-2 py-0.5 rounded text-amber-100">{t('settings.prem_active_badge')}</span>
                                </div>
                                <h2 className="text-2xl font-black mb-1">{t('settings.prem_plan_name')}</h2>
                                <p className="text-orange-100 text-sm mb-6">{t('settings.prem_all_active')}</p>

                                <div className="flex items-center space-x-2 text-xs font-medium bg-black/20 rounded-lg p-3 backdrop-blur-sm w-fit">
                                    <Clock size={14} className="text-amber-200" />
                                    <span><Trans i18nKey="settings.prem_renew">Yenilenme: <strong>12 Ekim 2024</strong></Trans></span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">{t('settings.prem_payment')}</h3>
                            <div className={`${commonCardClass} flex items-center justify-between`}>
                                <div className="flex items-center space-x-3">
                                    <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg text-slate-600 dark:text-slate-300">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-800 dark:text-white">•••• •••• •••• 4242</div>
                                        <div className="text-xs text-slate-500">{t('settings.prem_card_exp')}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toast.info("Ödeme sağlayıcı paneli açılıyor...")}
                                    className="text-blue-500 text-xs font-bold px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                >
                                    Değiştir
                                </button>
                            </div>

                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2 pt-2">{t('settings.prem_active_feats')}</h3>
                            <div className={`${commonCardClass} space-y-3`}>
                                {[
                                    "t('settings.feat_unlimited')",
                                    "t('settings.feat_ai')",
                                    "t('settings.feat_reports')",
                                    "t('settings.feat_no_ads')",
                                    "t('settings.feat_support')"
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center space-x-3">
                                        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                                        <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleCancelSubscription}
                                    className="w-full py-4 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
                                >
                                    Üyeliği İptal Et
                                </button>
                                <p className="text-[10px] text-slate-400 text-center mt-2 px-6">
                                    {t('settings.prem_cancel_desc')}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    // FREE STATE
                    <div className="flex flex-col h-full">
                        <div className={`${commonCardClass} text-center mb-6 border-amber-500/20 shadow-amber-500/5`}>
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                                <Star size={32} className="text-white fill-white" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('settings.free_title')}</h2>
                            <p className="text-slate-500 text-sm mt-1 mb-6 px-4">
                                {t('settings.free_desc')}
                            </p>
                            <button
                                onClick={() => navigate('/premium')}
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2"
                            >
                                <Zap size={16} />
                                <span>{t('settings.free_btn')}</span>
                            </button>
                        </div>

                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2 mb-3">{t('settings.free_missing')}</h3>
                        <div className={`${commonCardClass} space-y-4`}>
                            <div className="flex items-start space-x-3 opacity-50">
                                <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-full"><Car size={16} /></div>
                                <div><div className="text-sm font-bold">{t('settings.free_max2')}</div><div className="text-xs text-slate-500">{t('settings.free_in_free')}</div></div>
                            </div>
                            <div className="flex items-center justify-center py-2">
                                <ChevronLeft className="rotate-90 text-slate-300" />
                            </div>
                            <div className="flex items-start space-x-3 text-amber-600 dark:text-amber-500">
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-full"><Crown size={16} /></div>
                                <div><div className="text-sm font-bold">{t('settings.free_unlimited')}</div><div className="text-xs opacity-80">{t('settings.free_in_pro')}</div></div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-700 my-2"></div>

                            {[
                                { title: t('settings.free_ai'), sub: t('settings.free_ai_desc') },
                                { title: t('settings.free_rep'), sub: t('settings.free_rep_desc') },
                                { title: t('settings.free_ads'), sub: t('settings.free_ads_desc') }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start space-x-3">
                                    <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full text-green-600 dark:text-green-500 mt-0.5">
                                        <CheckCircle2 size={14} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{item.title}</div>
                                        <div className="text-xs text-slate-500">{item.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (view === 'legal') {
        return (
            <div className="p-5 space-y-6 animate-fadeIn">
                <header className="flex items-center space-x-3 pt-2">
                    <button onClick={() => setView('main')} className={commonHeaderBtnClass}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">{t('settings.legal')}</h1>
                </header>
                <div className={`${commonCardClass} text-center`}>
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-900/40 mb-4">
                        <Car size={40} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold">CarSync Pro</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('settings.legal_version')} (Build 2024)</p>
                    <p className="text-slate-500 text-xs mt-4 px-4">{t('settings.legal_desc')}</p>
                </div>
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">{t('settings.legal_texts')}</h3>
                    <button
                        onClick={() => openLink(PRIVACY_POLICY_URL)}
                        className={`w-full ${commonCardClass} p-4 flex items-center justify-between group active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700/80`}
                        aria-label="Gizlilik Politikasını harici sekmede aç"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg text-slate-600 dark:text-slate-300">
                                <Globe size={18} />
                            </div>
                            <span className="font-medium text-sm">{t('settings.legal_privacy')}</span>
                        </div>
                        <ExternalLink size={16} className="text-slate-500" />
                    </button>
                    <button
                        onClick={() => openLink(TERMS_OF_USE_URL)}
                        className={`w-full ${commonCardClass} p-4 flex items-center justify-between group active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700/80`}
                        aria-label="Kullanım Koşullarını harici sekmede aç"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg text-slate-600 dark:text-slate-300">
                                <ScrollText size={18} />
                            </div>
                            <span className="font-medium text-sm">{t('settings.legal_terms')}</span>
                        </div>
                        <ExternalLink size={16} className="text-slate-500" />
                    </button>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-start space-x-3">
                        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            <strong className="text-slate-700 dark:text-slate-300 block mb-2">{t('settings.legal_data')}</strong>
                            <p className="mb-2"><Trans i18nKey="settings.legal_data_desc"><Trans i18nKey="settings.legal_data_desc">CarSync Pro, fatura analizi ve araç arıza tahmini gibi özellikler sunmak için <strong>Google Gemini API</strong> kullanır.</Trans></Trans></p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'reminders') {
        return (
            <div className="p-5 space-y-6 animate-fadeIn">
                <header className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setView('main')} className={commonHeaderBtnClass}><ChevronLeft size={24} /></button>
                        <h1 className="text-xl font-bold">{t('settings.rem_title')}</h1>
                    </div>
                    <button onClick={handleReminderSave} className="bg-blue-600 px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 active:scale-95 transition text-white"><Save size={14} /><span>{t('settings.save')}</span></button>
                </header>
                <div className="space-y-4">
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{t('settings.rem_desc')}</p>
                    {/* Simplified Reminder UI for brevity */}
                    <div className={`${commonCardClass} space-y-4`}>
                        <div className="flex items-center space-x-3 text-amber-500 mb-2"><Droplet size={20} /><span className="font-bold text-sm text-slate-800 dark:text-white">{t('settings.rem_oil')}</span></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold ml-1">{t('settings.rem_every_km')}</label><div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 flex items-center"><input type="number" value={reminderSettings.oilChange.km} onChange={(e) => setReminderSettings({ ...reminderSettings, oilChange: { ...reminderSettings.oilChange, km: e.target.value } })} className="bg-transparent w-full outline-none text-slate-900 dark:text-white text-sm" /><span className="text-xs text-slate-500 ml-1">km</span></div></div>
                            <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold ml-1">{t('settings.rem_every_mo')}</label><div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 flex items-center"><input type="number" value={reminderSettings.oilChange.months} onChange={(e) => setReminderSettings({ ...reminderSettings, oilChange: { ...reminderSettings.oilChange, months: e.target.value } })} className="bg-transparent w-full outline-none text-slate-900 dark:text-white text-sm" /><span className="text-xs text-slate-500 ml-1">ay</span></div></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'notifications') {
        return (
            <div className="p-5 space-y-6 animate-fadeIn">
                <header className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setView('main')} className={commonHeaderBtnClass}><ChevronLeft size={24} /></button>
                        <h1 className="text-xl font-bold">{t('settings.notif_title')}</h1>
                    </div>
                    <button onClick={handleNotificationSave} className="bg-blue-600 px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 active:scale-95 transition text-white"><Save size={14} /><span>{t('settings.save')}</span></button>
                </header>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2 mb-3">{t('settings.notif_events')}</h3>
                        <div className={`${commonCardClass} space-y-5`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4"><div className="bg-amber-500/20 p-2.5 rounded-xl text-amber-500"><Wrench size={20} /></div><div><div className="font-bold text-sm">{t('settings.notif_maint')}</div></div></div>
                                <label className="relative inline-flex items-center cursor-pointer p-2 -mr-2"><input type="checkbox" className="sr-only peer" checked={notifications.service} onChange={() => toggleNotification('service')} /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4"><div className="bg-blue-500/20 p-2.5 rounded-xl text-blue-500"><Fuel size={20} /></div><div><div className="font-bold text-sm">{t('settings.notif_fuel')}</div></div></div>
                                <label className="relative inline-flex items-center cursor-pointer p-2 -mr-2"><input type="checkbox" className="sr-only peer" checked={notifications.fuel} onChange={() => toggleNotification('fuel')} /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4"><div className="bg-purple-500/20 p-2.5 rounded-xl text-purple-500"><FileText size={20} /></div><div><div className="font-bold text-sm">{t('settings.notif_ins')}</div></div></div>
                                <label className="relative inline-flex items-center cursor-pointer p-2 -mr-2"><input type="checkbox" className="sr-only peer" checked={notifications.insurance} onChange={() => toggleNotification('insurance')} /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4"><div className="bg-green-500/20 p-2.5 rounded-xl text-green-500"><Wallet size={20} /></div><div><div className="font-bold text-sm">{t('settings.notif_tax')}</div></div></div>
                                <label className="relative inline-flex items-center cursor-pointer p-2 -mr-2"><input type="checkbox" className="sr-only peer" checked={notifications.tax} onChange={() => toggleNotification('tax')} /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4"><div className="bg-red-500/20 p-2.5 rounded-xl text-red-500"><AlertTriangle size={20} /></div><div><div className="font-bold text-sm">{t('settings.notif_dtc')}</div></div></div>
                                <label className="relative inline-flex items-center cursor-pointer p-2 -mr-2"><input type="checkbox" className="sr-only peer" checked={notifications.dtc} onChange={() => toggleNotification('dtc')} /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4"><div className="bg-yellow-500/20 p-2.5 rounded-xl text-yellow-500"><Zap size={20} /></div><div><div className="font-bold text-sm">{t('settings.notif_news')}</div></div></div>
                                <label className="relative inline-flex items-center cursor-pointer p-2 -mr-2"><input type="checkbox" className="sr-only peer" checked={notifications.news} onChange={() => toggleNotification('news')} /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2 mb-3">{t('settings.notif_channels')}</h3>
                        <div className={`${commonCardClass} space-y-6`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4"><div className="bg-blue-500/20 p-2.5 rounded-xl text-blue-500"><Bell size={20} /></div><div><div className="font-bold text-sm">{t('settings.notif_push')}</div></div></div>
                                <label className="relative inline-flex items-center cursor-pointer p-2 -mr-2"><input type="checkbox" className="sr-only peer" checked={notifications.push} onChange={() => toggleNotification('push')} /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'security') {
        return (
            <div className="p-5 space-y-6 animate-fadeIn pb-24">
                <header className="flex items-center space-x-3 pt-2">
                    <button onClick={() => setView('main')} className={commonHeaderBtnClass}><ChevronLeft size={24} /></button>
                    <h1 className="text-xl font-bold">{t('settings.sec_title')}</h1>
                </header>

                {/* Password Change Section */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">{t('settings.sec_change')}</h2>
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">{t('settings.sec_cur')}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">{t('settings.sec_new')}</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition"
                                    placeholder="En az 6 karakter"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">{t('settings.sec_confirm')}</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleUpdatePassword}
                            disabled={isUpdatingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition active:scale-95 flex items-center justify-center space-x-2"
                        >
                            {isUpdatingPassword ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <span>{t('settings.sec_update')}</span>}
                        </button>

                        {showPasswordSuccess && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-xl flex items-center space-x-2 text-sm animate-fadeIn">
                                <CheckCircle2 size={16} />
                                <span>t('settings.pass_success')</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2FA Section */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">{t('settings.sec_2fa')}</h2>
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2.5 rounded-xl ${twoFactorEnabled ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-400'}`}>
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{t('settings.sec_sms')}</h3>
                                    <p className="text-xs text-slate-400">{t('settings.sec_sms_desc')}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={twoFactorEnabled} onChange={handleToggle2FA} />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>

                        {twoFactorEnabled && (
                            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-start space-x-3">
                                <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={16} />
                                <p className="text-xs text-blue-400 leading-relaxed">
                                    {t('settings.sec_2fa_active')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-700/50 mt-6">
                    <h2 className="text-xs font-bold text-red-500 uppercase tracking-wider ml-1">{t('settings.danger')}</h2>
                    <button onClick={handleDataWipeRequest} className={`w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 p-5 rounded-xl border border-red-500/30 flex items-center justify-between group active:scale-95 transition`}><div className="flex items-center space-x-3"><Trash2 size={20} /><span className="font-medium">{t('settings.wipe')}</span></div><ChevronRight size={20} className="text-red-500/50" /></button>
                </div>
            </div>
        );
    }

    // Main View
    return (
        <div className="p-5 space-y-6">
            <header className="flex justify-between items-center pt-2">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/')} className={commonHeaderBtnClass}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">{t('settings.title')}</h1>
                </div>
                {isEditing && (
                    <button onClick={handleSave} className="bg-blue-600 px-5 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 active:scale-95 transition text-white"><Save size={16} /><span>{t('settings.save')}</span></button>
                )}
            </header>

            {/* Profile Section */}
            <div className={`${commonCardClass} flex flex-col items-center relative overflow-hidden`}>
                <div className="relative mb-6 group">
                    <div className={`w-28 h-28 rounded-full border-4 overflow-hidden shadow-xl flex items-center justify-center bg-slate-800 ${user.isPremium ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                        {(isEditing ? tempUser.avatar : user.avatar) ? (
                            <img src={isEditing ? tempUser.avatar : user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48} className="text-slate-600" />
                        )}
                    </div>

                    {user.isPremium && (
                        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full border-4 border-white dark:border-slate-800 z-10">
                            <Crown size={16} className="fill-white" />
                        </div>
                    )}

                    {isEditing && (
                        <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center space-x-2 animate-fadeIn">
                            <button
                                onClick={() => galleryInputRef.current?.click()}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition active:scale-95"
                                title={t('settings.upload_gallery')}
                            >
                                <Image size={20} />
                            </button>
                            <div className="w-[1px] h-6 bg-white/20"></div>
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition active:scale-95"
                                title={t('settings.take_photo')}
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                    )}

                    <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="user" onChange={handleAvatarChange} />
                </div>

                {!isEditing ? (
                    <div className="text-center w-full">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                            <h2 className="text-2xl font-bold">{user.name} {user.surname}</h2>
                            {user.isPremium && <span className="bg-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">{t('settings.badge_pro')}</span>}
                        </div>
                        <p className="text-slate-400 text-sm mb-1">{user.email}</p>
                        {user.phone && <p className="text-slate-500 text-xs mb-1">{user.phone}</p>}
                        {user.department && <p className="text-slate-500 text-xs mb-6 font-medium bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-full">{user.department}</p>}
                        {(!user.phone && !user.department) && <div className="mb-6"></div>}

                        <button
                            onClick={() => { setIsEditing(true); setTempUser(user); }}
                            className="text-blue-500 dark:text-blue-400 text-sm font-medium hover:text-blue-600 dark:hover:text-blue-300 py-3 px-6 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition w-full"
                        >
                            Profili Düzenle
                        </button>
                    </div>
                ) : (
                    <div className="w-full space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 ml-1">{t('settings.lbl_name')}</label>
                                <div className={commonInputClass}>
                                    <User size={20} className="text-slate-500 mr-3" />
                                    <input type="text" value={tempUser.name} onChange={(e) => setTempUser({ ...tempUser, name: e.target.value })} className="bg-transparent w-full outline-none text-slate-900 dark:text-white text-base" placeholder={t('settings.ph_name')} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 ml-1">{t('settings.lbl_surname')}</label>
                                <div className={commonInputClass}>
                                    <input type="text" value={tempUser.surname} onChange={(e) => setTempUser({ ...tempUser, surname: e.target.value })} className="bg-transparent w-full outline-none text-slate-900 dark:text-white text-base" placeholder={t('settings.ph_surname')} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-1">{t('settings.lbl_email')}</label>
                            <div className={commonInputClass}>
                                <Mail size={20} className="text-slate-500 mr-3" />
                                <input type="email" value={tempUser.email} onChange={(e) => setTempUser({ ...tempUser, email: e.target.value })} className="bg-transparent w-full outline-none text-slate-900 dark:text-white text-base" placeholder={t('settings.ph_email')} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-1">{t('settings.lbl_phone')}</label>
                            <div className={commonInputClass}>
                                <Smartphone size={20} className="text-slate-500 mr-3" />
                                <input type="tel" value={tempUser.phone} onChange={(e) => setTempUser({ ...tempUser, phone: e.target.value })} className="bg-transparent w-full outline-none text-slate-900 dark:text-white text-base" placeholder={t('settings.ph_phone')} />
                                {tempUser.phone && (
                                    <button onClick={() => setTempUser({ ...tempUser, phone: '' })} className="text-slate-400 hover:text-red-500 transition">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-1">{t('settings.lbl_dept')}</label>
                            <div className={commonInputClass}>
                                <ClipboardCheck size={20} className="text-slate-500 mr-3" />
                                <input type="text" value={tempUser.department} onChange={(e) => setTempUser({ ...tempUser, department: e.target.value })} className="bg-transparent w-full outline-none text-slate-900 dark:text-white text-base" placeholder={t('settings.ph_dept')} />
                                {tempUser.department && (
                                    <button onClick={() => setTempUser({ ...tempUser, department: '' })} className="text-slate-400 hover:text-red-500 transition">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <button onClick={() => setIsEditing(false)} className="w-full py-4 text-slate-400 text-sm font-medium hover:text-slate-600 dark:hover:text-white transition">{t('settings.cancel')}</button>
                    </div>
                )}
            </div>

            {/* Premium Banner (if free) */}
            {!user.isPremium && (
                <div
                    onClick={() => navigate('/premium')}
                    className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-500/20"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 animate-gradient-xy"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                        <Crown size={100} className="text-white rotate-12" />
                    </div>

                    <div className="relative z-10 p-6 text-white">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg shadow-inner">
                                <Star size={20} className="fill-white text-white animate-pulse" />
                            </div>
                            <span className="font-bold text-xs tracking-widest bg-black/20 px-2 py-1 rounded text-amber-100 border border-white/10">{t('settings.promo_features')}</span>
                        </div>

                        <h3 className="font-black text-2xl mb-2 tracking-tight">{t('settings.promo_title')}</h3>
                        <p className="text-sm text-orange-50 font-medium mb-6 max-w-[240px] leading-relaxed">
                            {t('settings.promo_desc')}
                        </p>

                        <button
                            onClick={(e) => { e.stopPropagation(); navigate('/premium'); }}
                            className="bg-white text-orange-600 text-sm font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-orange-50 transition-all flex items-center space-x-2 group-hover:translate-x-1"
                        >
                            <span>{t('settings.promo_btn')}</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Settings List */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">{t('settings.sec_general')}</h3>

                <button onClick={() => setView('notifications')} className={`w-full ${commonCardClass} flex items-center justify-between group active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700/80`}>
                    <div className="flex items-center space-x-3"><div className="bg-blue-500/10 p-2.5 rounded-lg text-blue-500"><Bell size={20} /></div><span className="font-medium">{t('settings.notifications')}</span></div><ChevronRight size={20} className="text-slate-400" />
                </button>

                {/* Font Size Selector */}
                <div className={`${commonCardClass} space-y-4`}>
                    <div className="flex items-center space-x-3"><div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-500"><Type size={20} /></div><span className="font-medium">{t('settings.font_size')}</span></div>
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg">
                        <button onClick={() => handleFontSizeChange('small')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${fontSize === 'small' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>{t('settings.font_small')}</button>
                        <button onClick={() => handleFontSizeChange('medium')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${fontSize === 'medium' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>{t('settings.font_medium')}</button>
                        <button onClick={() => handleFontSizeChange('large')} className={`flex-1 py-2 rounded-md text-base font-medium transition-all ${fontSize === 'large' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>{t('settings.font_large')}</button>
                    </div>
                </div>

                {/* Background Theme Selector */}
                <div className={`${commonCardClass} space-y-4`}>
                    <div className="flex items-center space-x-3"><div className="bg-cyan-500/10 p-2.5 rounded-lg text-cyan-500"><Palette size={20} /></div><span className="font-medium">{t('settings.bg_theme')}</span></div>
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg">
                        <button onClick={() => handleBackgroundChange('default')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${backgroundTheme === 'default' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>{t('settings.bg_default')}</button>
                        <button onClick={() => handleBackgroundChange('blue')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${backgroundTheme === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50 shadow text-blue-700 dark:text-blue-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>{t('settings.bg_blue')}</button>
                        <button onClick={() => handleBackgroundChange('mesh')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${backgroundTheme === 'mesh' ? 'bg-slate-200 dark:bg-slate-800 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>{t('settings.bg_mesh')}</button>
                    </div>
                </div>

                {/* Language Selector */}
                <div className={`${commonCardClass} space-y-4`}>
                    <div className="flex items-center space-x-3"><div className="bg-green-500/10 p-2.5 rounded-lg text-green-500"><Globe size={20} /></div><span className="font-medium">{t('settings.language')}</span></div>
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg">
                        <button onClick={() => i18n.changeLanguage('tr')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${i18n.language === 'tr' ? 'bg-green-600 text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>Türkçe</button>
                        <button onClick={() => i18n.changeLanguage('en')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${i18n.language === 'en' ? 'bg-green-600 text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>English</button>
                    </div>
                </div>

                <button onClick={() => setView('reminders')} className={`w-full ${commonCardClass} flex items-center justify-between group active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700/80`}>
                    <div className="flex items-center space-x-3"><div className="bg-amber-500/10 p-2.5 rounded-lg text-amber-500"><Clock size={20} /></div><span className="font-medium">{t('settings.reminders')}</span></div><ChevronRight size={20} className="text-slate-400" />
                </button>

                <div className={`${commonCardClass} flex items-center justify-between`}>
                    <div className="flex items-center space-x-3">
                        <div className="bg-purple-500/10 p-2.5 rounded-lg text-purple-500"><Moon size={20} /></div>
                        <span className="font-medium">{t('settings.dark_mode')}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} />
                        <div className="w-14 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>

                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2 pt-2">{t('settings.sec_sub')}</h3>

                <button
                    onClick={() => setView('premium')}
                    className={`w-full ${commonCardClass} flex items-center justify-between group active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700/80 ${user.isPremium ? 'border-amber-500/30 shadow-amber-500/10' : ''}`}
                >
                    <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-lg ${user.isPremium ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30' : 'bg-amber-500/10 text-amber-500'}`}>
                            <Crown size={20} className={user.isPremium ? 'fill-white' : ''} />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className={`font-bold ${user.isPremium ? 'text-amber-600 dark:text-amber-500' : ''}`}>{t('settings.prem_title')}</span>
                            <span className="text-xs text-slate-500">{user.isPremium ? 'Aktif: Yıllık Plan' : 'Ücretsiz Plan'}</span>
                        </div>
                    </div>
                    {user.isPremium && <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/20 mr-2">AKTİF</span>}
                    <ChevronRight size={20} className="text-slate-400" />
                </button>

                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2 pt-2">{t('settings.sec_data')}</h3>

                <div className={`${commonCardClass} space-y-3`}>
                    <button
                        onClick={handleExportVehiclesCSV}
                        className="w-full flex items-center justify-between group active:scale-95 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-500"><Table size={18} /></div>
                            <div className="flex flex-col items-start">
                                <span className="font-medium text-sm flex items-center gap-1.5">
                                    {t('settings.csv_vehicles')}
                                    {!user.isPremium && <LockIcon size={12} className="text-slate-400" />}
                                </span>
                            </div>
                        </div>
                        {!user.isPremium ? (
                            <span className="text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded shadow-sm shadow-amber-500/30">{t('settings.badge_pro')}</span>
                        ) : (
                            <FileDown size={18} className="text-slate-400" />
                        )}
                    </button>

                    <button
                        onClick={handleExportLogsCSV}
                        className="w-full flex items-center justify-between group active:scale-95 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500"><FileSpreadsheet size={18} /></div>
                            <div className="flex flex-col items-start">
                                <span className="font-medium text-sm flex items-center gap-1.5">
                                    {t('settings.csv_history')}
                                    {!user.isPremium && <LockIcon size={12} className="text-slate-400" />}
                                </span>
                            </div>
                        </div>
                        {!user.isPremium ? (
                            <span className="text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded shadow-sm shadow-amber-500/30">{t('settings.badge_pro')}</span>
                        ) : (
                            <FileDown size={18} className="text-slate-400" />
                        )}
                    </button>

                    <button
                        onClick={handleExportPDF}
                        className="w-full flex items-center justify-between group active:scale-95 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="bg-red-500/10 p-2 rounded-lg text-red-500"><FileText size={18} /></div>
                            <div className="flex flex-col items-start">
                                <span className="font-medium text-sm flex items-center gap-1.5">
                                    {t('settings.pdf_report')}
                                    {!user.isPremium && <LockIcon size={12} className="text-slate-400" />}
                                </span>
                            </div>
                        </div>
                        {!user.isPremium ? (
                            <span className="text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded shadow-sm shadow-amber-500/30">{t('settings.badge_pro')}</span>
                        ) : (
                            <FileDown size={18} className="text-slate-400" />
                        )}
                    </button>
                </div>

                <button onClick={() => setView('archived')} className={`w-full ${commonCardClass} flex items-center justify-between group active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700/80`}>
                    <div className="flex items-center space-x-3"><div className="bg-orange-500/10 p-2.5 rounded-lg text-orange-500"><Archive size={20} /></div><span className="font-medium">{t('settings.archived')}</span></div><ChevronRight size={20} className="text-slate-400" />
                </button>

                <button onClick={() => setView('security')} className={`w-full ${commonCardClass} flex items-center justify-between group active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700/80`}>
                    <div className="flex items-center space-x-3"><div className="bg-green-500/10 p-2.5 rounded-lg text-green-500"><Shield size={20} /></div><span className="font-medium">{t('settings.security')}</span></div><ChevronRight size={20} className="text-slate-400" />
                </button>

                <button onClick={() => setView('legal')} className={`w-full ${commonCardClass} flex items-center justify-between group active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700/80`}>
                    <div className="flex items-center space-x-3"><div className="bg-slate-500/10 p-2.5 rounded-lg text-slate-400"><Info size={20} /></div><span className="font-medium">{t('settings.legal')}</span></div><ChevronRight size={20} className="text-slate-400" />
                </button>
            </div>

            <button onClick={handleLogout} className="w-full mt-8 p-5 rounded-xl border border-red-500/30 text-red-500 flex items-center justify-center space-x-2 hover:bg-red-500/10 transition active:scale-95">
                <LogOut size={20} />
                <span className="font-medium">{t('settings.logout')}</span>
            </button>

            {/* Bottom Ad */}
            <AdBanner slotId="3991102196" format="fluid" layoutKey="-gw-3+1f-3d+2z" />

            {/* Wipe Data Modal */}
            {showWipeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setShowWipeModal(false)}>
                    <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5 mx-auto text-red-500 border border-red-500/20 animate-pulse">
                            <AlertOctagon size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2 text-white">{t('settings.wipe_modal_title')}</h3>
                        <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed px-2">
                            <Trans i18nKey="settings.wipe_modal_desc"><Trans i18nKey="settings.wipe_modal_desc">Bu işlem <strong className="text-white">geri alınamaz</strong>. Tüm araç kayıtlarınız, ayarlarınız ve geçmişiniz kalıcı olarak silinecektir. Uygulama başlangıç durumuna dönecektir.</Trans></Trans>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowWipeModal(false)}
                                className="py-3.5 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition active:scale-95"
                            >
                                İptal
                            </button>
                            <button
                                onClick={confirmDataWipe}
                                className="py-3.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition active:scale-95 shadow-lg shadow-red-900/30 flex items-center justify-center space-x-2"
                            >
                                <Trash2 size={18} />
                                <span>{t('settings.wipe_yes')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
          @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
              animation: fadeIn 0.3s ease-out forwards;
          }
      `}</style>
        </div>
    );
};