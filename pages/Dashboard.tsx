import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Settings, Fuel, Wrench, Wallet, Calendar, ChevronRight, AlertCircle, RefreshCw, TrendingUp, Activity, Search, ShieldAlert, Sparkles, CheckCircle2, Receipt, MessageCircle, AlertTriangle, Info, XCircle, Gauge, Droplet, RotateCw, Battery, Camera, Car, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Sliders } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { fetchVehicles, fetchLogs, fetchAppointments, addAppointment, deleteAppointment, updateLog, updateVehicle } from '../services/firestoreService';
import { getHealthInsight, explainTroubleCodes, getMaintenanceRecommendations } from '../services/geminiService';
import { OnboardingGuide } from '../components/OnboardingGuide';
import { AdBanner } from '../components/AdBanner';
import { PaymentModal } from '../components/PaymentModal';
import { Vehicle, ServiceLog, Appointment, WidgetConfig } from '../types';
import { toast } from '../services/toast';
import { getSetting, saveSetting } from '../services/settingsService';
import { triggerConfetti } from '../services/confetti';

interface DtcResult {
    code: string;
    meaning: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    causes: string[];
    solutions: string[];
}

export const Dashboard: React.FC = () => {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [logs, setLogs] = useState<ServiceLog[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [lastLog, setLastLog] = useState<ServiceLog | null>(null);
    const [loading, setLoading] = useState(true);

    const [insight, setInsight] = useState<string>(t('dashboard.analyzing_history'));

    // Appointment Modal State
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [appointmentForm, setAppointmentForm] = useState({
        serviceType: t('dashboard.periodic_maintenance'),
        date: '',
        notes: ''
    });

    // Maintenance Tips State
    const [maintenanceTips, setMaintenanceTips] = useState<string[]>([]);
    const [tipsLoading, setTipsLoading] = useState(true);

    // DTC State
    const [dtcCode, setDtcCode] = useState('');
    const [dtcResult, setDtcResult] = useState<DtcResult | null>(null);
    const [analyzingDtc, setAnalyzingDtc] = useState(false);
    const [dtcError, setDtcError] = useState(false);

    // Health Score Animation State
    const [animatedHealthScore, setAnimatedHealthScore] = useState(0);

    // Fuel Stats State
    const [fuelStats, setFuelStats] = useState<{ avg: string, totalLiters: string, distance: number } | null>(null);

    // Widget State
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
    const [showWidgetSettings, setShowWidgetSettings] = useState(false);

    // Payment Modal State
    const [selectedLogForPayment, setSelectedLogForPayment] = useState<ServiceLog | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const compressImage = (dataUrl: string, maxWidth = 400, quality = 0.7): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) {
                    h = (h * maxWidth) / w;
                    w = maxWidth;
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !vehicle) return;

        let currentImages = vehicle.images ? [...vehicle.images] : [];
        if (currentImages.length === 0 && vehicle.image) {
            currentImages.push(vehicle.image);
        }

        if (currentImages.length >= 4) {
            toast.error(t('dashboard.image_limit_error'));
            event.target.value = '';
            return;
        }

        const availableSlots = 4 - currentImages.length;
        const filesToProcess = Array.from(files).slice(0, availableSlots);

        if (files.length > availableSlots) {
            toast.warning(t('dashboard.image_limit_warning', { count: availableSlots }));
        }

        const newBase64Images: string[] = [];

        // Process all files
        for (let i = 0; i < filesToProcess.length; i++) {
            const file = filesToProcess[i];
            const reader = new FileReader();

            const base64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
            const compressed = await compressImage(base64);
            newBase64Images.push(compressed);
        }

        const newImages = [...currentImages, ...newBase64Images];

        // Optimistic update
        setVehicle({ ...vehicle, images: newImages });

        try {
            await updateVehicle(vehicle.id, { images: newImages });
        } catch (error) {
            console.error(t('dashboard.image_upload_error'), error);
            toast.error(t('dashboard.image_upload_error'));
        }
        event.target.value = '';
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [vehicles, allLogs, allAppointments] = await Promise.all([
                    fetchVehicles(),
                    fetchLogs(),
                    fetchAppointments()
                ]);

                const foundVehicle = id ? vehicles.find(v => v.id === id) : vehicles[0];

                if (foundVehicle) {
                    setVehicle(foundVehicle);

                    // Filter logs for this vehicle
                    const vehicleLogs = allLogs.filter(log => log.vehicleId === foundVehicle.id);
                    setLogs(vehicleLogs);

                    // Filter appointments
                    const vehicleAppointments = allAppointments.filter(appt => appt.vehicleId === foundVehicle.id && appt.status !== 'Cancelled');
                    setAppointments(vehicleAppointments);

                    // Set last log
                    if (vehicleLogs.length > 0) {
                        const sortedLogs = [...vehicleLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        setLastLog(sortedLogs[0]);
                    }

                    // Calculate Fuel Stats (Last 6 Months)
                    calculateFuelStats(vehicleLogs);

                    // AI Insights
                    getHealthInsight(foundVehicle.model, foundVehicle.mileage, foundVehicle.lastLogDate).then(setInsight);

                    setTipsLoading(true);
                    getMaintenanceRecommendations(`${foundVehicle.year} ${foundVehicle.brand} ${foundVehicle.model}`, foundVehicle.mileage)
                        .then((tips) => {
                            setMaintenanceTips(tips);
                            setTipsLoading(false);
                        });

                    // Animate Health Score
                    setAnimatedHealthScore(0);
                    setTimeout(() => {
                        setAnimatedHealthScore(foundVehicle.healthScore);
                    }, 300);

                    // Load Dashboard Widgets
                    const defaultWidgets: WidgetConfig[] = [
                        { id: 'health', enabled: true, order: 0 },
                        { id: 'dtc', enabled: true, order: 1 },
                        { id: 'stats', enabled: true, order: 2 },
                        { id: 'fuel_analysis', enabled: true, order: 3 },
                        { id: 'expense_chart', enabled: true, order: 4 },
                        { id: 'market_value', enabled: true, order: 5 },
                        { id: 'maintenance', enabled: true, order: 6 },
                        { id: 'last_log', enabled: true, order: 7 },
                        { id: 'appointments', enabled: true, order: 8 },
                        { id: 'recent_logs', enabled: true, order: 9 }
                    ];
                    const savedWidgets = getSetting<WidgetConfig[]>('dashboard_widgets', defaultWidgets);
                    setWidgets(savedWidgets.sort((a, b) => a.order - b.order));
                }
            } catch (error) {
                console.error(t('dashboard.data_load_error'), error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleAddAppointment = async () => {
        if (!vehicle || !appointmentForm.date) return;

        try {
            const newAppt: Omit<Appointment, 'id'> = {
                vehicleId: vehicle.id,
                serviceType: appointmentForm.serviceType,
                date: appointmentForm.date,
                status: 'Pending',
                notes: appointmentForm.notes
            };

            const id = await addAppointment(newAppt);
            setAppointments([...appointments, { ...newAppt, id }]);
            setShowAppointmentModal(false);
            setAppointmentForm({ serviceType: t('dashboard.periodic_maintenance'), date: '', notes: '' });
            toast.success(t('dashboard.appt_success'));
            triggerConfetti();
        } catch (error) {
            console.error(t('dashboard.appt_add_error'), error);
        }
    };

    const handleDeleteAppointment = async (apptId: string) => {
        if (window.confirm(t('dashboard.appt_cancel_confirm'))) {
            try {
                await deleteAppointment(apptId);
                setAppointments(appointments.filter(a => a.id !== apptId));
            } catch (error) {
                console.error(t('dashboard.appt_delete_error'), error);
            }
        }
    };

    const calculateFuelStats = (vehicleLogs: ServiceLog[]) => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const fuelLogs = vehicleLogs.filter(log =>
            (log.type === 'Yakıt' || log.type === 'Yakıt Alımı') &&
            new Date(log.date) >= sixMonthsAgo &&
            log.liters && log.mileage
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (fuelLogs.length >= 2) {
            const totalLiters = fuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0);
            const minMileage = fuelLogs[0].mileage;
            const maxMileage = fuelLogs[fuelLogs.length - 1].mileage;
            const distance = maxMileage - minMileage;

            if (distance > 0) {
                const avg = (totalLiters / distance) * 100;
                setFuelStats({
                    avg: avg.toFixed(1),
                    totalLiters: totalLiters.toFixed(0),
                    distance: distance
                });
            }
        } else {
            setFuelStats(null);
        }
    };

    const handleDtcAnalyze = async () => {
        if (!dtcCode.trim() || !vehicle) return;
        setAnalyzingDtc(true);
        setDtcResult(null);
        setDtcError(false);

        const result = await explainTroubleCodes(dtcCode, `${vehicle.year} ${vehicle.brand} ${vehicle.model}`);

        if (result && result.meaning) {
            setDtcResult(result);
        } else {
            setDtcError(true);
        }
        setAnalyzingDtc(false);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Kritik':
            case 'Critical': return 'bg-red-500 text-black dark:text-white';
            case 'Yüksek':
            case 'High': return 'bg-orange-500 text-black dark:text-white';
            case 'Orta':
            case 'Medium': return 'bg-yellow-500 text-black';
            case 'Düşük':
            case 'Low': return 'bg-blue-500 text-black dark:text-white';
            default: return 'bg-slate-500 text-black dark:text-white';
        }
    };

    const handleReorderWidget = (index: number, direction: 'up' | 'down') => {
        const newWidgets = [...widgets];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newWidgets.length) return;

        const temp = newWidgets[index];
        newWidgets[index] = newWidgets[targetIndex];
        newWidgets[targetIndex] = temp;

        // Update orders
        const updatedWidgets = newWidgets.map((w, i) => ({ ...w, order: i }));
        setWidgets(updatedWidgets);
        saveSetting('dashboard_widgets', updatedWidgets);
    };

    const handleToggleWidget = (id: string) => {
        const updatedWidgets = widgets.map(w =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
        );
        setWidgets(updatedWidgets);
        saveSetting('dashboard_widgets', updatedWidgets);
    };

    if (loading || !vehicle) {
        return <div className="flex items-center justify-center h-screen text-black dark:text-white">{t('dashboard.loading')}</div>;
    }

    const isServiceNeeded = ['Servis Gerekli', 'Acil'].includes(vehicle.status);

    // Calculate Simple Cost History for Chart
    // Group logs by month for the chart
    const chartData = logs.reduce((acc: any[], log) => {
        const month = new Date(log.date).toLocaleString(i18n.language, { month: 'short' });
        const existing = acc.find(item => item.name === month);
        if (existing) {
            existing.total += log.cost;
        } else {
            acc.push({ name: month, total: log.cost });
        }
        return acc;
    }, []).slice(-6); // Last 6 months

    const onboardingSteps = [
        {
            title: t('dashboard.onboarding.step1_title'),
            description: t('dashboard.onboarding.step1_desc'),
            icon: Activity
        },
        {
            title: t('dashboard.onboarding.step2_title'),
            description: t('dashboard.onboarding.step2_desc'),
            icon: MessageCircle
        },
        {
            title: t('dashboard.onboarding.step3_title'),
            description: t('dashboard.onboarding.step3_desc'),
            icon: Fuel
        },
        {
            title: t('dashboard.onboarding.step4_title'),
            description: t('dashboard.onboarding.step4_desc'),
            icon: Search
        }
    ];

    // Helper for circle circumference
    const radius = 36;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="space-y-5 pb-24 relative">
            <OnboardingGuide tourKey="tour_dashboard_v1" steps={onboardingSteps} />

            {/* ── HERO SECTION ─────────────────────────────────────── */}
            <div className="relative w-full overflow-hidden" style={{ height: 'min(58vh, 420px)' }}>

                {/* Vehicle image carousel */}
                <div className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                    {(vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.image]).map((img, idx) => (
                        <div key={idx} className="flex-shrink-0 w-full h-full snap-center bg-slate-900">
                            {img
                                ? <img src={img} alt={vehicle.model} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Car size={80} className="text-slate-700" /></div>
                            }
                        </div>
                    ))}
                </div>

                {/* Full gradient overlay */}
                <div className="absolute inset-0 hero-gradient pointer-events-none" />

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-4 z-10">
                    <button onClick={() => navigate(-1)} className="glass-chip w-10 h-10 flex items-center justify-center active:scale-90 transition">
                        <ChevronRight className="rotate-180 text-black dark:text-white" size={20} />
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/notifications')} className="glass-chip w-10 h-10 flex items-center justify-center active:scale-90 transition relative">
                            <Bell size={18} className="text-black dark:text-white" />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black/40" />
                        </button>
                        <button onClick={() => navigate('/settings')} className="glass-chip w-10 h-10 flex items-center justify-center active:scale-90 transition">
                            <Settings size={18} className="text-black dark:text-white" />
                        </button>
                        <button onClick={() => setShowWidgetSettings(true)} className="glass-chip w-10 h-10 flex items-center justify-center active:scale-90 transition">
                            <Sliders size={18} className="text-black dark:text-white" />
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="glass-chip w-10 h-10 flex items-center justify-center active:scale-90 transition">
                            <Camera size={18} className="text-black dark:text-white" />
                        </button>
                    </div>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-10">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <p className="text-[11px] text-black dark:text-white/50 font-semibold tracking-widest uppercase mb-0.5">{vehicle.brand} · {vehicle.year}</p>
                            <h1 className="text-2xl font-black text-black dark:text-white leading-tight drop-shadow-lg">{vehicle.model}</h1>
                            <div className="tr-plate mt-2">
                                <span className="tr-plate-flag">🇹🇷<br />TR</span>
                                {vehicle.plate}
                            </div>
                        </div>
                        {/* Animated health ring */}
                        <div className={`relative flex-shrink-0 ${animatedHealthScore >= 90 ? 'ring-glow-green' : ''}`}>
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth="6" fill="transparent" />
                                <circle
                                    cx="40" cy="40" r={radius}
                                    stroke={animatedHealthScore >= 90 ? '#10b981' : animatedHealthScore >= 70 ? '#f59e0b' : '#ef4444'}
                                    strokeWidth="6" fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (animatedHealthScore / 100) * circumference}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-black dark:text-white animate-count">{animatedHealthScore}</span>
                                <span className="text-[9px] text-black dark:text-white/50 font-bold uppercase tracking-wider -mt-0.5">{t('common.health')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Floating action pills */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/add-record', { state: { serviceType: 'Yakıt Alımı', date: new Date().toISOString().split('T')[0] } })}
                            className="flex-1 btn-premium-3d !shadow-blue-900/40"
                            style={{ padding: '12px 0' }}
                        >
                            <Fuel size={16} />{t('dashboard.add_fuel')}
                        </button>
                        <button
                            onClick={() => navigate('/add-record', { state: { serviceType: t('dashboard.periodic_maintenance'), date: new Date().toISOString().split('T')[0] } })}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/20 text-black dark:text-white font-bold text-sm active:scale-95 transition"
                        >
                            <Wrench size={16} />{t('dashboard.maintenance')}
                        </button>
                        <button
                            onClick={() => navigate(`/chat/${vehicle.id}`)}
                            className="w-14 btn-premium-3d bg-gradient-to-br from-violet-600 to-indigo-600 !shadow-indigo-900/40"
                        >
                            <MessageCircle size={18} className="text-black dark:text-white" fill="white" fillOpacity={0.15} />
                        </button>
                    </div>
                </div>

                {/* Image dot indicators */}
                {vehicle.images && vehicle.images.length > 1 && (
                    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {vehicle.images.map((_, idx) => (<div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/40" />))}
                    </div>
                )}
            </div>

            {/* ── CONTENT (padded) ─────────────────────────────────── */}
            <div className="px-4 sm:px-5 space-y-5">

                {/* Health & DTC Grid */}
                <div className="bento-grid">
                    {widgets.map((widget, idx) => {
                        if (!widget.enabled && !showWidgetSettings) return null;
                        const delayClass = `delay-${Math.min(idx, 7)}`;
                        const widgetContent = (() => {
                            switch (widget.id) {
                                case 'health':
                                    return (
                                        <div key="health" className={`animate-card ${delayClass} bento-col-span-4 lg:col-span-2`}>
                                            <div className="glass-panel-premium p-6 relative overflow-hidden h-full flex items-center">
                                                <div className="flex justify-between items-center relative z-10 h-full">
                                                    <div className="flex-1 pr-6">
                                                        <h3 className="font-bold text-lg text-black dark:text-white mb-1">{t('dashboard.health_score')}</h3>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                            {vehicle.healthScore >= 90 ? t('dashboard.health_perfect') :
                                                                vehicle.healthScore >= 70 ? t('dashboard.health_good') :
                                                                    t('dashboard.health_attention')}
                                                        </p>
                                                    </div>

                                                    <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                                                        <svg className="w-full h-full transform -rotate-90">
                                                            <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-700/50" />
                                                            <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference - (animatedHealthScore / 100) * circumference} strokeLinecap="round" className={`transition-all duration-1000 ease-out ${animatedHealthScore >= 90 ? 'text-emerald-500' : animatedHealthScore >= 70 ? 'text-amber-500' : 'text-red-500'}`} />
                                                        </svg>
                                                        <div className="absolute flex flex-col items-center"><span className="text-xl font-black text-black dark:text-white">{animatedHealthScore}</span></div>
                                                    </div>
                                                </div>
                                                <div className={`absolute -top-10 -right-10 w-40 h-40 blur-[60px] opacity-10 pointer-events-none ${vehicle.healthScore >= 90 ? 'bg-emerald-500' : vehicle.healthScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                            </div>
                                        </div>
                                    );
                                case 'dtc':
                                    return (
                                        <div key="dtc" className={`glass-panel-premium overflow-hidden border ${isServiceNeeded ? 'border-red-500/30' : 'border-slate-700/50'} animate-card ${delayClass} bento-col-span-4 lg:col-span-2 relative`}>
                                            {isServiceNeeded && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 shadow-[0_0_15px_#ef4444]"></div>}
                                            <div className="p-5 flex flex-col h-full">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <Activity className={isServiceNeeded ? "text-red-500" : "text-blue-500"} size={20} />
                                                    <h3 className="font-bold text-lg text-black dark:text-white">{t('dashboard.dtc_title')}</h3>
                                                </div>
                                                <div className="flex space-x-2 mb-4">
                                                    <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 flex items-center focus-within:border-blue-500 transition-colors h-12">
                                                        <input type="text" value={dtcCode} onChange={(e) => setDtcCode(e.target.value.toUpperCase())} placeholder={t('dashboard.dtc_placeholder')} className="bg-transparent w-full outline-none text-black dark:text-white placeholder-slate-500 text-base font-mono uppercase" onKeyDown={(e) => e.key === 'Enter' && handleDtcAnalyze()} />
                                                    </div>
                                                    <button onClick={handleDtcAnalyze} disabled={analyzingDtc || !dtcCode} className={`${isServiceNeeded ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} disabled:bg-slate-700 disabled:text-slate-500 text-black dark:text-white rounded-xl px-5 h-12 flex items-center justify-center transition active:scale-95`}>
                                                        {analyzingDtc ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <Search size={20} />}
                                                    </button>
                                                </div>
                                                {dtcResult && (
                                                    <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 animate-fadeIn space-y-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono font-bold text-lg text-black dark:text-white">{dtcResult.code}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getSeverityColor(dtcResult.severity)}`}>
                                                                {(dtcResult.severity as string) === 'Kritik' ? t('common.critical') :
                                                                    (dtcResult.severity as string) === 'Yüksek' ? t('common.high') :
                                                                        (dtcResult.severity as string) === 'Orta' ? t('common.medium') :
                                                                            (dtcResult.severity as string) === 'Düşük' ? t('common.low') :
                                                                                dtcResult.severity}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug font-medium">{dtcResult.meaning}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                case 'stats':
                                    return (
                                        <div key="stats" className={`grid grid-cols-2 gap-4 animate-card ${delayClass} bento-col-span-4 lg:col-span-2`}>
                                            <div className="glass-panel-premium p-5 flex flex-col justify-between h-32 hover:border-gold/30 transition-colors">
                                                <div className="flex items-center space-x-2 text-gold"><RefreshCw size={16} /><span className="text-xs uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300">{t('dashboard.mileage')}</span></div>
                                                <div className="text-2xl font-black text-black dark:text-white"><span className="animate-count ">{vehicle.mileage.toLocaleString(i18n.language)}</span> <span className="text-sm font-bold text-slate-500">km</span></div>
                                            </div>
                                            <div className="glass-panel-premium p-5 flex flex-col justify-between h-32 hover:border-gold/30 transition-colors">
                                                <div className="flex items-center space-x-2 text-gold"><Fuel size={16} /><span className="text-xs uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300">{t('dashboard.avg_fuel')}</span></div>
                                                <div className="text-2xl font-black text-black dark:text-white">{fuelStats ? fuelStats.avg : '--'} <span className="text-sm font-bold text-slate-500">L/100</span></div>
                                            </div>
                                        </div>
                                    );
                                case 'fuel_analysis':
                                    return fuelStats && (
                                        <div key="fuel_analysis" className={`glass-panel-premium p-5 animate-card ${delayClass} lg:col-span-2`}>
                                            <div className="flex items-center justify-between mb-4"><div className="flex items-center space-x-2"><div className="bg-green-500/20 p-2 rounded-xl border border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><Fuel size={16} /></div><h3 className="text-sm font-bold text-black dark:text-white tracking-wide">{t('dashboard.fuel_analysis')}</h3></div></div>
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div className="bg-slate-100 dark:bg-slate-700/30 p-3 rounded-xl"><div className="text-xs text-slate-600 dark:text-slate-400 mb-1">{t('dashboard.total_consumption')}</div><div className="font-bold text-black dark:text-white">{fuelStats.totalLiters} L</div></div>
                                                <div className="bg-slate-100 dark:bg-slate-700/30 p-3 rounded-xl"><div className="text-xs text-slate-600 dark:text-slate-400 mb-1">{t('dashboard.distance')}</div><div className="font-bold text-black dark:text-white">{fuelStats.distance} km</div></div>
                                                <div className="bg-slate-100 dark:bg-slate-700/30 p-3 rounded-xl border border-green-500/20"><div className="text-xs text-green-400 mb-1">{t('dashboard.average')}</div><div className="font-bold text-green-500">{fuelStats.avg} L/100</div></div>
                                            </div>
                                        </div>
                                    );
                                case 'expense_chart':
                                    return (
                                        <div key="expense_chart" className={`glass-panel-premium p-5 animate-card ${delayClass} lg:col-span-2`}>
                                            <div className="flex items-center justify-between mb-4"><div className="flex items-center space-x-2"><div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"><Wallet size={16} /></div><h3 className="text-sm font-bold text-black dark:text-white tracking-wide">{t('dashboard.expense_summary')}</h3></div></div>
                                            <div className="h-40 w-full min-w-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData}>
                                                        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={5} />
                                                        <Tooltip cursor={{ fill: '#334155', opacity: 0.2 }} contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                case 'market_value':
                                    return (
                                        <div key="market_value" className={`glass-panel-premium p-5 animate-card ${delayClass} lg:col-span-2`}>
                                            <div className="flex justify-between items-start mb-2"><div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400"><TrendingUp size={18} className="text-indigo-400" /><span className="text-xs uppercase font-bold tracking-wider">{t('dashboard.market_value')}</span></div><span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] px-2 py-1 rounded font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)]">{t('dashboard.current').toUpperCase()}</span></div>
                                            <div className="flex items-baseline space-x-1 mt-1"><span className="text-lg font-bold text-black dark:text-white">₺{vehicle.marketValueMin.toLocaleString(i18n.language)}</span><span className="text-slate-500 mx-1">-</span><span className="text-lg font-bold text-black dark:text-white">₺{vehicle.marketValueMax.toLocaleString(i18n.language)}</span></div>
                                            <div className="mt-4 relative h-3 bg-slate-700 rounded-full overflow-hidden"><div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-blue-600/30 rounded-full"></div><div className="absolute left-[40%] top-0 bottom-0 w-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div></div>
                                        </div>
                                    );
                                case 'maintenance':
                                    return (
                                        <div key="maintenance" className={`glass-panel-premium p-5 animate-card ${delayClass} lg:col-span-2`}>
                                            <div className="flex justify-between items-end mb-3"><h3 className="font-bold text-lg text-black dark:text-white">{t('dashboard.maintenance_status')}</h3><button onClick={() => navigate('/logs')} className="text-blue-400 hover:text-blue-300 transition text-sm font-bold">{t('dashboard.view_calendar')}</button></div>
                                            <div className="flex justify-between items-center mb-4"><div className="flex items-center space-x-3"><div className="bg-amber-500/20 p-2.5 rounded-xl"><img src="https://img.icons8.com/color/48/oil-industry.png" className="w-6 h-6" alt="Oil" /></div><span className="font-bold text-black dark:text-white">{t('dashboard.oil_life')}</span></div><span className="font-bold text-black dark:text-white">%12</span></div>
                                            <div className="w-full bg-slate-700 rounded-full h-3 mb-2 overflow-hidden"><div className="bg-red-500 h-3 rounded-full" style={{ width: '12%' }}></div></div>
                                        </div>
                                    );
                                case 'last_log':
                                    return lastLog && (
                                        <div key="last_log" className={`glass-panel-premium p-5 flex items-center justify-between shadow-lg shadow-black/20 animate-card ${delayClass} lg:col-span-2`}>
                                            <div className="flex items-center space-x-4"><div className="bg-emerald-500/10 p-3.5 rounded-2xl text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"><Receipt size={24} /></div><div><p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider mb-0.5">{t('dashboard.last_transaction')}</p><h3 className="font-bold text-black dark:text-white text-base">{lastLog.type}</h3></div></div>
                                            <div className="text-right"><div className="text-xl font-bold text-emerald-400">₺{lastLog.cost.toLocaleString(i18n.language)}</div><div className="text-xs text-slate-500 font-medium mt-0.5">{new Date(lastLog.date).toLocaleDateString(i18n.language)}</div></div>
                                        </div>
                                    );
                                case 'appointments':
                                    return appointments.length > 0 && (
                                        <div key="appointments" className={`glass-panel-premium p-5 animate-card ${delayClass} lg:col-span-2`}>
                                            <div className="flex items-center space-x-2 mb-4"><div className="bg-blue-500/20 p-2 border border-blue-500/30 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]"><Calendar size={18} className="text-blue-400" /></div><h3 className="font-bold text-lg text-black dark:text-white">{t('dashboard.upcoming_appts')}</h3></div>
                                            <div className="space-y-3">
                                                {appointments.map(appt => (
                                                    <div key={appt.id} className="bg-slate-100 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                                                        <div className="flex items-center space-x-3"><div className="bg-blue-500/20 p-2.5 rounded-lg text-blue-500"><Calendar size={20} /></div><div><div className="font-bold text-sm text-black dark:text-white text-sm">{appt.serviceType}</div><div className="text-xs text-slate-600 dark:text-slate-400">{new Date(appt.date).toLocaleDateString(i18n.language)}</div></div></div>
                                                        <button onClick={() => handleDeleteAppointment(appt.id)} className="p-2 text-slate-500 hover:text-red-400 transition"><XCircle size={20} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                case 'recent_logs':
                                    return (
                                        <div key="recent_logs" className={`animate-card ${delayClass} lg:col-span-2`}>
                                            <div className="flex justify-between items-center mb-3 px-1"><h3 className="font-bold text-lg text-black dark:text-white">{t('dashboard.recent_logs')}</h3><button className="text-blue-400 hover:text-blue-300 transition text-sm font-bold" onClick={() => navigate('/logs')}>{t('dashboard.history')}</button></div>
                                            <div className="space-y-3">
                                                {logs.slice(0, 5).map(log => (
                                                    <div key={log.id} className="glass-panel-premium p-4 flex justify-between items-center hover:border-gold/30 transition-colors cursor-pointer" onClick={() => navigate('/logs')}>
                                                        <div className="flex items-center space-x-4"><div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]"><Wrench size={20} /></div><div><div className="font-bold text-sm text-black dark:text-white mb-0.5">{log.type}</div><div className="text-xs text-slate-600 dark:text-slate-400">{new Date(log.date).toLocaleDateString(i18n.language)}</div></div></div>
                                                        <div className="font-black text-slate-200 text-base">₺{log.cost.toLocaleString(i18n.language)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                default:
                                    return null;
                            }
                        })();

                        return (
                            <React.Fragment key={widget.id}>
                                {widgetContent}
                                {idx === 3 && (
                                    <div key="mid-ad" className="bento-col-span-4 lg:col-span-4 scale-95 opacity-90 mx-auto w-full">
                                        <AdBanner slotId="7103291209" format="fluid" layoutKey="-gw-3+1f-3d+2z" />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Bottom Ad */}
                <AdBanner slotId="7103291209" format="fluid" layoutKey="-gw-3+1f-3d+2z" />

                {/* Multiplex (Content Recommendation) Ad */}
                <AdBanner slotId="1311433112" format="autorelaxed" label="Önerilen İçerikler" />

                {/* Widget Personalization Modal */}
                {showWidgetSettings && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn" onClick={() => setShowWidgetSettings(false)}>
                        <div className="bg-slate-900 rounded-[32px] border border-slate-800 w-full max-w-md shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <div>
                                    <h3 className="text-xl font-black text-black dark:text-white">{t('dashboard.customize_layout')}</h3>
                                    <p className="text-xs text-slate-500 mt-1">{t('dashboard.customize_desc')}</p>
                                </div>
                                <button onClick={() => setShowWidgetSettings(false)} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-black dark:text-white transition">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {widgets.map((widget, index) => (
                                    <div key={widget.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${widget.enabled ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/30 border-slate-800 opacity-50'}`}>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => handleReorderWidget(index, 'up')} disabled={index === 0} className="p-1 text-slate-500 hover:text-blue-400 disabled:opacity-20"><ChevronUp size={16} /></button>
                                            <button onClick={() => handleReorderWidget(index, 'down')} disabled={index === widgets.length - 1} className="p-1 text-slate-500 hover:text-blue-400 disabled:opacity-20"><ChevronDown size={16} /></button>
                                        </div>

                                        <div className="flex-1 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                <GripVertical size={16} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-black dark:text-white capitalize">{t(`dashboard.widget_${widget.id}`)}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-tight">{widget.enabled ? t('common.visible') : t('common.hidden')}</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggleWidget(widget.id)}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${widget.enabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${widget.enabled ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-slate-950/50 border-t border-slate-800">
                                <button
                                    onClick={() => setShowWidgetSettings(false)}
                                    className="w-full bg-white text-black font-black py-4 rounded-2xl active:scale-95 transition"
                                >
                                    {t('common.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Appointment Modal */}
                {showAppointmentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setShowAppointmentModal(false)}>
                        <div className="bg-slate-800 rounded-3xl border border-slate-700 w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 space-y-5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-black dark:text-white">{t('dashboard.maintenance_appt')}</h3>
                                    <button onClick={() => setShowAppointmentModal(false)} className="p-2 bg-slate-700/50 rounded-full hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition">
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">{t('common.service_type')}</label>
                                        <select
                                            value={appointmentForm.serviceType}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, serviceType: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-black dark:text-white outline-none focus:border-blue-500 transition"
                                        >
                                            <option value="Periyodik Bakım">{t('analytics.periodic_maintenance')}</option>
                                            <option value="Yağ Değişimi">{t('analytics.oil_change')}</option>
                                            <option value="Lastik Değişimi">{t('analytics.tire_change')}</option>
                                            <option value="Fren Balatası">{t('analytics.brake_service')}</option>
                                            <option value="Akü Kontrolü">{t('analytics.battery_check')}</option>
                                            <option value="Genel Kontrol">{t('analytics.general_check')}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">{t('common.date')}</label>
                                        <input
                                            type="date"
                                            value={appointmentForm.date}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-black dark:text-white outline-none focus:border-blue-500 transition"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">{t('common.notes_optional')}</label>
                                        <textarea
                                            value={appointmentForm.notes}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-black dark:text-white outline-none focus:border-blue-500 transition h-24 resize-none"
                                            placeholder={t('common.enter_notes')}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddAppointment}
                                    disabled={!appointmentForm.date}
                                    className="w-full btn-premium-3d py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('common.create_appt')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Payment Modal */}
                {selectedLogForPayment && (
                    <PaymentModal
                        amount={selectedLogForPayment.cost}
                        description={`${selectedLogForPayment.type} - ${selectedLogForPayment.date}`}
                        onClose={() => setSelectedLogForPayment(null)}
                        onSuccess={async () => {
                            await updateLog(selectedLogForPayment.id, { paymentStatus: 'Paid', paymentMethod: 'Credit Card' });
                            setLogs(prev => prev.map(l => l.id === selectedLogForPayment.id ? { ...l, paymentStatus: 'Paid' } : l));
                            setSelectedLogForPayment(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};
