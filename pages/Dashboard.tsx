import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Settings, Fuel, Wrench, Wallet, Calendar, ChevronRight, AlertCircle, RefreshCw, TrendingUp, Activity, Search, ShieldAlert, Sparkles, CheckCircle2, Receipt, MessageCircle, AlertTriangle, Info, XCircle, Gauge, Droplet, RotateCw, Battery, Camera, Car } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { fetchVehicles, fetchLogs, fetchAppointments, addAppointment, deleteAppointment, updateLog, updateVehicle } from '../services/firestoreService';
import { getHealthInsight, explainTroubleCodes, getMaintenanceRecommendations } from '../services/geminiService';
import { OnboardingGuide } from '../components/OnboardingGuide';
import { AdBanner } from '../components/AdBanner';
import { PaymentModal } from '../components/PaymentModal';
import { Vehicle, ServiceLog, Appointment } from '../types';
import { toast } from '../services/toast';

interface DtcResult {
    code: string;
    meaning: string;
    severity: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';
    causes: string[];
    solutions: string[];
}

export const Dashboard: React.FC = () => {
    const { id } = useParams();
    const { t } = useTranslation();
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

    // Payment Modal State
    const [selectedLogForPayment, setSelectedLogForPayment] = useState<ServiceLog | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !vehicle) return;

        const newBase64Images: string[] = [];

        // Process all files
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            const base64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
            newBase64Images.push(base64);
        }

        let newImages = vehicle.images ? [...vehicle.images] : [];
        if (newImages.length === 0 && vehicle.image) {
            newImages.push(vehicle.image);
        }
        newImages = [...newImages, ...newBase64Images];

        // Optimistic update
        setVehicle({ ...vehicle, images: newImages });

        try {
            await updateVehicle(vehicle.id, { images: newImages });
        } catch (error) {
            console.error("Resim yükleme hatası:", error);
            toast.error(t('dashboard.image_upload_error'));
        }
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
                }
            } catch (error) {
                console.error("Dashboard veri yükleme hatası:", error);
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
        } catch (error) {
            console.error('Randevu ekleme hatası:', error);
        }
    };

    const handleDeleteAppointment = async (apptId: string) => {
        if (window.confirm(t('dashboard.appt_cancel_confirm'))) {
            try {
                await deleteAppointment(apptId);
                setAppointments(appointments.filter(a => a.id !== apptId));
            } catch (error) {
                console.error('Randevu silme hatası:', error);
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
            case 'Kritik': return 'bg-red-500 text-white';
            case 'Yüksek': return 'bg-orange-500 text-white';
            case 'Orta': return 'bg-yellow-500 text-black';
            case 'Düşük': return 'bg-blue-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    if (loading || !vehicle) {
        return <div className="flex items-center justify-center h-screen text-white">{t('dashboard.loading')}</div>;
    }

    const isServiceNeeded = ['Servis Gerekli', 'Acil'].includes(vehicle.status);

    // Calculate Simple Cost History for Chart
    // Group logs by month for the chart
    const chartData = logs.reduce((acc: any[], log) => {
        const month = new Date(log.date).toLocaleString('tr-TR', { month: 'short' });
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
            title: 'Araç Paneli',
            description: 'Aracınızın sağlık durumu, yaklaşan bakımları ve tahmini piyasa değeri gibi kritik bilgilere buradan ulaşın.',
            icon: Activity
        },
        {
            title: 'Aracınla Sohbet Et',
            description: 'Yeni! Sağ alttaki butonu kullanarak aracınla yapay zeka destekli sohbet edebilirsin.',
            icon: MessageCircle
        },
        {
            title: 'Hızlı İşlemler',
            description: 'Yakıt veya servis kaydı eklemek için buradaki kısayolları kullanabilirsiniz.',
            icon: Fuel
        },
        {
            title: 'Arıza Tanılama (DTC)',
            description: 'Arıza kodlarını girerek yapay zeka destekli çözüm önerileri ve açıklamalar alın.',
            icon: Search
        }
    ];

    // Helper for circle circumference
    const radius = 36;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="p-4 sm:p-5 space-y-5 pb-24 relative">
            <OnboardingGuide tourKey="tour_dashboard_v1" steps={onboardingSteps} />

            {/* Header */}
            <header className="flex justify-between items-center pt-2">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition border border-slate-700">
                        <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold leading-tight">{vehicle.model}</h1>
                        <span className="text-xs text-slate-400">{vehicle.brand} • {vehicle.year}</span>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => navigate('/notifications')}
                        className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 border border-slate-700 relative"
                    >
                        <Bell size={20} className="text-slate-300" />
                        {/* Corrected position: right-3 ensures it stays inside the button */}
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-800"></div>
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 border border-slate-700">
                        <Settings size={20} className="text-slate-300" />
                    </button>
                </div>
            </header>

            {/* Vehicle Image Gallery */}
            <div className="relative h-56 -mx-4 sm:-mx-5 overflow-hidden group">
                {/* Add Photo Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70 transition z-20 border border-white/20 active:scale-95"
                >
                    <Camera size={20} />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                />

                <div className="flex h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                    {(vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.image]).map((img, idx) => (
                        <div key={idx} className="flex-shrink-0 w-full h-full snap-center relative flex items-center justify-center bg-slate-900">
                            {img ? (
                                <img
                                    src={img}
                                    alt={`${vehicle.model} ${idx}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Car size={64} className="text-slate-700" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                        </div>
                    ))}
                </div>

                {/* Image Indicators */}
                {vehicle.images && vehicle.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5">
                        {vehicle.images.map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                        ))}
                    </div>
                )}

                {/* Plate Overlay */}
                <div className="absolute bottom-4 left-4">
                    <div className="bg-slate-200 text-slate-900 border-2 border-slate-300 rounded px-2 py-0.5 shadow-lg flex items-center space-x-2 select-none scale-110 origin-left">
                        <div className="bg-blue-600 w-3 h-4 flex flex-col justify-end items-center pb-[1px] rounded-[1px]">
                            <span className="text-[4px] text-white font-bold leading-none">TR</span>
                        </div>
                        <span className="font-mono text-xs font-bold tracking-wider leading-none">{vehicle.plate}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions - Larger Touch Targets */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => navigate('/add-record', {
                        state: {
                            serviceType: 'Yakıt Alımı',
                            date: new Date().toISOString().split('T')[0]
                        }
                    })}
                    className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 shadow-lg shadow-blue-900/30 transition-all active:scale-95 border border-blue-500/20"
                >
                    <div className="bg-white/20 p-2.5 rounded-full">
                        <Fuel size={28} className="text-white" />
                    </div>
                    <span className="font-bold text-white text-base">{t('dashboard.add_fuel')}</span>
                </button>
                <button
                    onClick={() => navigate('/add-record', {
                        state: {
                            serviceType: t('dashboard.periodic_maintenance'),
                            date: new Date().toISOString().split('T')[0]
                        }
                    })}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 shadow-lg transition-all active:scale-95"
                >
                    <div className="bg-slate-700 p-2.5 rounded-full text-slate-300">
                        <Wrench size={28} />
                    </div>
                    <span className="font-bold text-slate-200 text-base">{t('dashboard.maintenance')}</span>
                </button>
            </div>

            {/* Health & DTC Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Animated Health Score Card */}
                <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl relative overflow-hidden animate-fadeIn h-full">
                    <div className="flex justify-between items-center relative z-10 h-full">
                        <div className="flex-1 pr-6">
                            <h3 className="font-bold text-lg text-white mb-1">{t('dashboard.health_score')}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {vehicle.healthScore >= 90 ? t('dashboard.health_perfect') :
                                    vehicle.healthScore >= 70 ? t('dashboard.health_good') :
                                        t('dashboard.health_attention')}
                            </p>
                        </div>

                        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                {/* Background Circle */}
                                <circle
                                    cx="40"
                                    cy="40"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    className="text-slate-700/50"
                                />
                                {/* Animated Foreground Circle */}
                                <circle
                                    cx="40"
                                    cy="40"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (animatedHealthScore / 100) * circumference}
                                    strokeLinecap="round"
                                    className={`transition-all duration-1000 ease-out ${animatedHealthScore >= 90 ? 'text-emerald-500' :
                                            animatedHealthScore >= 70 ? 'text-amber-500' : 'text-red-500'
                                        }`}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-xl font-black text-white">{animatedHealthScore}</span>
                            </div>
                        </div>
                    </div>

                    {/* Ambient Glow based on score */}
                    <div className={`absolute -top-10 -right-10 w-40 h-40 blur-[60px] opacity-10 pointer-events-none ${vehicle.healthScore >= 90 ? 'bg-emerald-500' :
                            vehicle.healthScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        }`}></div>
                </div>

                {/* Diagnostic Trouble Codes Section - Enhanced Input Area */}
                <div className={`bg-slate-800 rounded-3xl overflow-hidden border ${isServiceNeeded ? 'border-red-500/30' : 'border-slate-700'} animate-fadeIn relative transition-colors duration-300 h-full`}>
                    {isServiceNeeded && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>}
                    <div className="p-5 flex flex-col h-full">
                        <div className="flex items-center space-x-2 mb-3">
                            <Activity className={isServiceNeeded ? "text-red-500" : "text-blue-500"} size={20} />
                            <h3 className="font-bold text-lg text-white">{t('dashboard.dtc_title')}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                            OBD-II hata kodlarını (örn. P0300) girerek yapay zeka destekli detaylı analiz ve çözüm önerileri alın.
                        </p>

                        <div className="flex space-x-2 mb-4">
                            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 flex items-center focus-within:border-blue-500 transition-colors h-12">
                                <input
                                    type="text"
                                    value={dtcCode}
                                    onChange={(e) => setDtcCode(e.target.value.toUpperCase())}
                                    placeholder={t('dashboard.dtc_placeholder')}
                                    className="bg-transparent w-full outline-none text-white placeholder-slate-500 text-base font-mono uppercase"
                                    onKeyDown={(e) => e.key === 'Enter' && handleDtcAnalyze()}
                                />
                            </div>
                            <button
                                onClick={handleDtcAnalyze}
                                disabled={analyzingDtc || !dtcCode}
                                className={`${isServiceNeeded ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl px-5 h-12 flex items-center justify-center transition active:scale-95`}
                            >
                                {analyzingDtc ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <Search size={20} />}
                            </button>
                        </div>

                        {dtcError && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 animate-fadeIn">
                                <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-200">{t('dashboard.dtc_error')}</p>
                            </div>
                        )}

                        {dtcResult && (
                            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 animate-fadeIn space-y-4 mt-auto">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-bold text-lg text-white">{dtcResult.code}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getSeverityColor(dtcResult.severity)}`}>
                                                {dtcResult.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-snug font-medium">{dtcResult.meaning}</p>
                                    </div>
                                </div>

                                {/* Causes */}
                                <div className="bg-slate-800/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-2 text-amber-500">
                                        <ShieldAlert size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wide">{t('dashboard.possible_causes')}</span>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {dtcResult.causes.map((cause, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                                <span className="text-amber-500/50 mt-1">•</span>
                                                <span>{cause}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Solutions */}
                                <div className="bg-slate-800/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-2 text-emerald-500">
                                        <Wrench size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wide">{t('dashboard.solutions')}</span>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {dtcResult.solutions.map((solution, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                                <CheckCircle2 size={12} className="text-emerald-500/50 flex-shrink-0 mt-0.5" />
                                                <span>{solution}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid - Unified Layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col justify-between h-32">
                    <div className="flex items-center space-x-2 text-slate-400">
                        <RefreshCw size={16} />
                        <span className="text-xs uppercase font-bold tracking-wider">{t('dashboard.mileage')}</span>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white">{vehicle.mileage.toLocaleString()} <span className="text-sm font-normal text-slate-500">km</span></div>
                        <div className="text-xs text-green-500 mt-1 font-medium bg-green-500/10 px-2 py-0.5 rounded w-fit">↗ +200km</div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col justify-between h-32">
                    <div className="flex items-center space-x-2 text-slate-400">
                        <Fuel size={16} />
                        <span className="text-xs uppercase font-bold tracking-wider">{t('dashboard.avg_fuel')}</span>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white">
                            {fuelStats ? fuelStats.avg : '--'} <span className="text-sm font-normal text-slate-500">L/100</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 font-medium bg-slate-700/50 px-2 py-0.5 rounded w-fit">
                            {fuelStats ? t('dashboard.last_6_months') : t('dashboard.no_data')}
                        </div>
                    </div>
                </div>

                <div className="col-span-2 md:col-span-1 bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col justify-between h-32">
                    <div className="flex items-center space-x-2 text-slate-400 mb-1">
                        <Wallet size={16} />
                        <span className="text-xs uppercase font-bold tracking-wider">{t('dashboard.monthly_expense')}</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="text-2xl font-bold text-white">
                            ₺{chartData.length > 0 ? chartData[chartData.length - 1].total.toLocaleString() : '0'}
                        </div>
                        <span className="text-green-500 text-xs font-bold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">{t('dashboard.current')}</span>
                    </div>
                </div>
            </div>

            {/* Fuel Consumption Analysis Card */}
            {fuelStats && (
                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="bg-green-500/20 p-1.5 rounded-lg text-green-500"><Fuel size={16} /></div>
                            <h3 className="text-sm font-bold text-white">{t('dashboard.fuel_analysis')}</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-slate-700/30 p-3 rounded-xl">
                            <div className="text-xs text-slate-400 mb-1">{t('dashboard.total_consumption')}</div>
                            <div className="font-bold text-white">{fuelStats.totalLiters} L</div>
                        </div>
                        <div className="bg-slate-700/30 p-3 rounded-xl">
                            <div className="text-xs text-slate-400 mb-1">{t('dashboard.distance')}</div>
                            <div className="font-bold text-white">{fuelStats.distance} km</div>
                        </div>
                        <div className="bg-slate-700/30 p-3 rounded-xl border border-green-500/20">
                            <div className="text-xs text-green-400 mb-1">{t('dashboard.average')}</div>
                            <div className="font-bold text-green-500">{fuelStats.avg} L/100</div>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 text-center">
                        *Veriler son 6 aydaki yakıt kayıtlarınıza ve kilometre girişlerinize dayanmaktadır.
                    </p>
                </div>
            )}

            {/* Cost History Summary Chart */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <div className="bg-blue-500/20 p-1.5 rounded-lg text-blue-500"><Wallet size={16} /></div>
                        <h3 className="text-sm font-bold text-white">{t('dashboard.expense_summary')}</h3>
                    </div>
                </div>
                <div className="h-32 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={5} />
                            <Tooltip
                                cursor={{ fill: '#334155', opacity: 0.2 }}
                                contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                formatter={(value: number) => [`₺${value}`, t('dashboard.total')]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Middle Ad */}
            <AdBanner slotId="3991102196" format="fluid" layoutKey="-gw-3+1f-3d+2z" className="my-2" />

            {/* Market Value Section */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2 text-slate-400">
                        <TrendingUp size={18} />
                        <span className="text-xs uppercase font-bold tracking-wider">{t('dashboard.market_value')}</span>
                    </div>
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded font-bold">GÜNCEL</span>
                </div>
                <div className="flex items-baseline space-x-1 mt-1">
                    <span className="text-lg font-bold text-white">₺{vehicle.marketValueMin.toLocaleString()}</span>
                    <span className="text-slate-500 mx-1">-</span>
                    <span className="text-lg font-bold text-white">₺{vehicle.marketValueMax.toLocaleString()}</span>
                </div>
                <div className="mt-4 relative h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-blue-600/30 rounded-full"></div>
                    <div className="absolute left-[40%] top-0 bottom-0 w-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-medium">
                    <span>{t('dashboard.low')}</span>
                    <span>{t('dashboard.average')}</span>
                    <span>{t('dashboard.high')}</span>
                </div>
            </div>

            {/* Maintenance Status */}
            <div>
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="font-bold text-lg text-white">{t('dashboard.maintenance_status')}</h3>
                    <button onClick={() => navigate('/logs')} className="text-blue-500 text-sm font-medium p-2 -mr-2">{t('dashboard.view_calendar')}</button>
                </div>
                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="bg-amber-500/20 p-2.5 rounded-xl">
                                <img src="https://img.icons8.com/color/48/oil-industry.png" className="w-6 h-6" alt="Oil" />
                            </div>
                            <span className="font-bold text-white">{t('dashboard.oil_life')}</span>
                        </div>
                        <span className="font-bold text-white">%12</span>
                    </div>

                    <div className="w-full bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
                        <div className="bg-red-500 h-3 rounded-full" style={{ width: '12%' }}></div>
                    </div>

                    <div className="flex justify-between text-xs mt-3">
                        <span className="text-red-500 font-bold uppercase tracking-wider">{t('dashboard.critical_attention')}</span>
                        <span className="text-slate-400 font-medium">Yaklaşık 450 km kaldı</span>
                    </div>

                    {/* AI Recommendations Section */}
                    <div className="mt-6 pt-5 border-t border-slate-700/50">
                        <div className="flex items-center space-x-2 mb-3">
                            <Sparkles size={16} className="text-purple-400" />
                            <span className="text-xs font-bold text-purple-200 uppercase tracking-wide">{t('dashboard.recommended_checks')}</span>
                        </div>

                        <div className="space-y-3">
                            {tipsLoading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-10 bg-slate-700/50 rounded-xl animate-pulse"></div>
                                ))
                            ) : (
                                maintenanceTips.length > 0 ? (
                                    maintenanceTips.map((tip, idx) => (
                                        <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-700/20 hover:bg-slate-700/40 rounded-xl transition-colors group">
                                            <CheckCircle2 size={18} className="text-slate-500 group-hover:text-green-500 mt-0.5 transition-colors flex-shrink-0" />
                                            <span className="text-sm text-slate-300 leading-snug">{tip}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-slate-500 italic p-2">{t('dashboard.no_recommendations')}</div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* LAST TRANSACTION CARD */}
            {lastLog && (
                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 flex items-center justify-between shadow-lg shadow-black/20 animate-fadeIn">
                    <div className="flex items-center space-x-4">
                        <div className="bg-emerald-500/10 p-3.5 rounded-2xl text-emerald-500 ring-1 ring-emerald-500/20">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">{t('dashboard.last_transaction')}</p>
                            <h3 className="font-bold text-white text-base">{lastLog.type}</h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-emerald-400">₺{lastLog.cost.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{lastLog.date}</div>
                    </div>
                </div>
            )}

            {/* Upcoming Appointments */}
            {appointments.length > 0 && (
                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeIn">
                    <div className="flex items-center space-x-2 mb-4">
                        <Calendar size={20} className="text-blue-500" />
                        <h3 className="font-bold text-lg text-white">{t('dashboard.upcoming_appts')}</h3>
                    </div>
                    <div className="space-y-3">
                        {appointments.map(appt => (
                            <div key={appt.id} className="bg-slate-700/30 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-500/20 p-2.5 rounded-lg text-blue-500">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{appt.serviceType}</div>
                                        <div className="text-xs text-slate-400">{new Date(appt.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteAppointment(appt.id)}
                                    className="p-2 text-slate-500 hover:text-red-400 transition"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat FAB - Positioned higher to clear nav */}
            <button
                onClick={() => navigate(`/chat/${vehicle.id}`)}
                className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-900/50 z-40 active:scale-95 transition-transform animate-fadeIn hover:scale-105 border-2 border-white/20"
            >
                <MessageCircle size={28} className="text-white" fill="white" fillOpacity={0.2} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </button>

            {/* Recent Logs List - Larger Rows */}
            <div className="pb-4">
                <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="font-bold text-lg text-white">{t('dashboard.recent_logs')}</h3>
                    <button className="text-slate-500 text-sm font-medium p-2 -mr-2 hover:text-white transition" onClick={() => navigate('/logs')}>{t('dashboard.history')}</button>
                </div>
                <div className="space-y-3">
                    {logs.length > 0 ? (
                        logs.slice(0, 5).map(log => (
                            <div key={log.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center active:scale-[0.99] transition-transform">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-xl ${log.icon === 'fuel' || log.type.includes('Yakıt') ? 'bg-green-500/20 text-green-500' :
                                            log.icon === 'oil' || log.type.includes('Yağ') ? 'bg-amber-500/20 text-amber-500' :
                                                log.icon === 'tire' || log.type.includes('Lastik') ? 'bg-purple-500/20 text-purple-500' :
                                                    log.icon === 'battery' || log.type.includes('Akü') ? 'bg-yellow-500/20 text-yellow-500' :
                                                        'bg-blue-500/20 text-blue-500'
                                        }`}>
                                        {log.icon === 'fuel' || log.type.includes('Yakıt') ? <Fuel size={22} /> :
                                            log.icon === 'oil' || log.type.includes('Yağ') ? <Droplet size={22} /> :
                                                log.icon === 'tire' || log.type.includes('Lastik') ? <RotateCw size={22} /> :
                                                    log.icon === 'battery' || log.type.includes('Akü') ? <Battery size={22} /> :
                                                        <Wrench size={22} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-white mb-0.5">{log.type}</div>
                                        <div className="text-xs text-slate-400">{log.date}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="font-bold text-slate-200 text-base">₺{log.cost.toLocaleString()}</div>
                                    {log.paymentStatus === 'Pending' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedLogForPayment(log); }}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition active:scale-95 shadow-lg shadow-blue-900/30"
                                        >
                                            Öde
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            Henüz kayıt bulunmuyor.
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Ad */}
            <AdBanner slotId="3991102196" format="fluid" layoutKey="-gw-3+1f-3d+2z" />

            {/* Appointment Modal */}
            {showAppointmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setShowAppointmentModal(false)}>
                    <div className="bg-slate-800 rounded-3xl border border-slate-700 w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 space-y-5">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">Bakım Randevusu</h3>
                                <button onClick={() => setShowAppointmentModal(false)} className="p-2 bg-slate-700/50 rounded-full hover:bg-slate-700 text-slate-400 transition">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 ml-1">SERVİS TÜRÜ</label>
                                    <select
                                        value={appointmentForm.serviceType}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, serviceType: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition"
                                    >
                                        <option value="Periyodik Bakım">Periyodik Bakım</option>
                                        <option value="Yağ Değişimi">Yağ Değişimi</option>
                                        <option value="Lastik Değişimi">Lastik Değişimi</option>
                                        <option value="Fren Balatası">Fren Balatası</option>
                                        <option value="Akü Kontrolü">Akü Kontrolü</option>
                                        <option value="Genel Kontrol">Genel Kontrol</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 ml-1">TARİH</label>
                                    <input
                                        type="date"
                                        value={appointmentForm.date}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 ml-1">NOTLAR (OPSİYONEL)</label>
                                    <textarea
                                        value={appointmentForm.notes}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition h-24 resize-none"
                                        placeholder="Eklemek istediğiniz notlar..."
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddAppointment}
                                disabled={!appointmentForm.date}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/40 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Randevu Oluştur
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
    );
};
