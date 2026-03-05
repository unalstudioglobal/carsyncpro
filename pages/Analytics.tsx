import React, { useState, useMemo, useEffect } from 'react';
import { usePremium } from '../context/PremiumContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Calendar, Fuel, CreditCard, Route, ArrowRightLeft, X, TrendingUp, Download, FileText, Wrench, Shield, MoreHorizontal, Lock, Crown, Droplet, FileCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, CartesianGrid, LineChart, Line, TooltipProps } from 'recharts';
import { fetchVehicles, fetchLogs } from '../services/firestoreService';
import { Vehicle, ServiceLog } from '../types';
import { OnboardingGuide } from '../components/OnboardingGuide';
import { toast } from '../services/toast';
import { exportLogsCsv, exportMonthlySummaryCsv, exportFullBackupJson } from '../services/exportService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Custom Tooltip Components ---

const CustomAreaTooltip = ({ active, payload, label, t }: any) => {
    if (active && payload && payload.length) {
        // Calculate total for the stacked chart on the fly
        const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
        return (
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-2xl min-w-[180px]">
                <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">{label}</p>
                <div className="mb-3 pb-3 border-b border-slate-700">
                    <span className="text-2xl font-bold text-white block">₺{total.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{t ? t('analytics.total_expense') : 'Toplam Harcama'}</span>
                </div>
                <div className="space-y-1.5">
                    {payload.slice().reverse().map((entry, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-300">{entry.name}</span>
                            </div>
                            <span className="font-mono text-white font-medium">₺{entry.value?.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const CustomComparisonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-xl">
                <p className="text-slate-400 text-xs font-bold mb-2 text-center">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between space-x-4 bg-slate-800/50 p-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-200 text-xs font-medium">{entry.name}</span>
                            </div>
                            <span className="text-white font-bold text-sm">{entry.value} <span className="text-[10px] text-slate-500 font-normal">L/100km</span></span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const CustomFuelTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 p-3 rounded-xl shadow-xl text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">{label}</p>
                <div className="text-xl font-bold text-cyan-400">
                    {payload[0].value} <span className="text-sm text-slate-500">L/100km</span>
                </div>
            </div>
        );
    }
    return null;
};

export const Analytics: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isComparing, setIsComparing] = useState(false);

    // Firestore verisi
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [logs, setLogs] = useState<ServiceLog[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchVehicles(), fetchLogs()]).then(([v, l]) => {
            if (v.length > 0) setVehicles(v);
            setLogs(l);
            // v1/v2 başlangıç değerlerini gerçek araçlara ayarla
            if (v.length > 0) setV1Id(v[0].id);
            if (v.length > 1) setV2Id(v[1].id);
        }).finally(() => setDataLoading(false));
    }, []);

    const [v1Id, setV1Id] = useState('');
    const [v2Id, setV2Id] = useState('');

    // Premium Check
    const { isPremium, activate, cancel: cancelPremium } = usePremium();

    // Time Range State
    const [timeRange, setTimeRange] = useState<'1A' | '3A' | '6A' | '1Y' | 'Tümü'>('1Y');

    // Report State
    const [reportPeriod, setReportPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const v1 = vehicles.find(v => v.id === v1Id) || vehicles[0];
    const v2 = vehicles.find(v => v.id === v2Id) || vehicles[0];



    // Gerçek log verisinden aylık harcama grafiği oluştur
    const DYNAMIC_COST_HISTORY = useMemo(() => {
        if (logs.length === 0) return [];

        const months: Record<string, { fuel: number; maintenance: number; insurance: number; other: number }> = {};
        const TR_MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

        // Sort logs by date ascending
        const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sortedLogs.forEach(log => {
            let label = log.date;
            if (/^\d{4}-\d{2}-\d{2}$/.test(log.date)) {
                const d = new Date(log.date + 'T00:00:00');
                label = `${TR_MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
            }
            if (!months[label]) months[label] = { fuel: 0, maintenance: 0, insurance: 0, other: 0 };
            const type = log.type;
            if (type === 'Yakıt Alımı') months[label].fuel += log.cost;
            else if (['Yağ Değişimi', 'Periyodik Bakım', 'Lastik Değişimi', 'Fren Servisi'].includes(type))
                months[label].maintenance += log.cost;
            else if (type === 'Sigorta') months[label].insurance += log.cost;
            else months[label].other += log.cost;
        });

        return Object.entries(months)
            .map(([name, vals]) => ({ name, ...vals }));
    }, [logs]);

    // Calculate stats for the main view
    const currentMonthData = DYNAMIC_COST_HISTORY.length > 0
        ? DYNAMIC_COST_HISTORY[DYNAMIC_COST_HISTORY.length - 1]
        : { fuel: 0, maintenance: 0, insurance: 0, other: 0 };

    const currentMonthTotal = currentMonthData.fuel + currentMonthData.maintenance + currentMonthData.insurance + currentMonthData.other;

    const totalCostAllMonths = DYNAMIC_COST_HISTORY.reduce((acc, curr) => acc + curr.fuel + curr.maintenance + curr.insurance + curr.other, 0);
    const averageMonthlyCost = DYNAMIC_COST_HISTORY.length > 0 ? totalCostAllMonths / DYNAMIC_COST_HISTORY.length : 0;

    // Filter Logic for Chart
    const chartData = useMemo(() => {
        const src = DYNAMIC_COST_HISTORY;
        const total = src.length;
        if (total === 0) return [];

        switch (timeRange) {
            case '1A': return src.slice(Math.max(0, total - 2));
            case '3A': return src.slice(Math.max(0, total - 3));
            case '6A': return src.slice(Math.max(0, total - 6));
            case '1Y': return src.slice(Math.max(0, total - 13));
            case 'Tümü': return src;
            default: return src;
        }
    }, [timeRange, DYNAMIC_COST_HISTORY]);

    // Calculate totals for the selected time range
    const rangeTotals = useMemo(() => {
        return chartData.reduce((acc, curr) => ({
            fuel: acc.fuel + curr.fuel,
            maintenance: acc.maintenance + curr.maintenance,
            insurance: acc.insurance + curr.insurance,
            other: acc.other + curr.other
        }), { fuel: 0, maintenance: 0, insurance: 0, other: 0 });
    }, [chartData]);

    const lastPoint = chartData[chartData.length - 1];
    const lastPointTotal = lastPoint ? (lastPoint.fuel + lastPoint.maintenance + lastPoint.insurance + lastPoint.other) : 0;

    // Report Logic
    const getReportData = () => {
        if (reportPeriod === 'monthly') {
            const data = currentMonthData;
            const total = data.fuel + data.maintenance + data.insurance + data.other;
            const distance = logs.length > 0
                ? logs.reduce((s, l) => s + (l.mileage || 0), 0) / Math.max(1, logs.length) * 1
                : 1;
            return {
                title: 'Aylık Finansal Özeti',
                total,
                avgPerKm: distance > 0 ? total / distance : 0,
                distance,
                items: [
                    { label: 'Yakıt', value: data.fuel, color: 'bg-blue-500' },
                    { label: 'Bakım', value: data.maintenance, color: 'bg-amber-500' },
                    { label: 'Sigorta', value: data.insurance, color: 'bg-purple-500' },
                    { label: 'Diğer', value: data.other, color: 'bg-slate-500' }
                ]
            };
        } else {
            const totalFuel = DYNAMIC_COST_HISTORY.reduce((a, b) => a + b.fuel, 0);
            const totalMaint = DYNAMIC_COST_HISTORY.reduce((a, b) => a + b.maintenance, 0);
            const totalIns = DYNAMIC_COST_HISTORY.reduce((a, b) => a + b.insurance, 0);
            const totalOther = DYNAMIC_COST_HISTORY.reduce((a, b) => a + b.other, 0);
            const total = totalFuel + totalMaint + totalIns + totalOther;
            const distance = logs.length > 0 ? logs.reduce((s, l) => s + (l.mileage || 0), 0) : 1;

            return {
                title: 'Yıllık Finansal Rapor',
                total,
                avgPerKm: distance > 0 ? total / distance : 0,
                distance,
                items: [
                    { label: 'Yakıt', value: totalFuel, color: 'bg-blue-500' },
                    { label: 'Bakım', value: totalMaint, color: 'bg-amber-500' },
                    { label: 'Sigorta', value: totalIns, color: 'bg-purple-500' },
                    { label: 'Diğer', value: totalOther, color: 'bg-slate-500' }
                ]
            };
        }
    };

    const reportData = getReportData();

    // Mock comparison data removed, now using empty array if no data
    // Calculate Fuel Consumption Trend
    const fuelData = useMemo(() => {
        if (logs.length === 0) return [];

        // Group by month and calculate average consumption if liters and mileage are available
        // For simplicity, let's just show the last 6 fuel logs with consumption data
        const fuelLogs = logs
            .filter(l => l.type === 'Yakıt Alımı' && l.liters && l.mileage)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate consumption between consecutive logs
        const trend = [];
        for (let i = 1; i < fuelLogs.length; i++) {
            const curr = fuelLogs[i];
            const prev = fuelLogs[i - 1];
            const dist = curr.mileage - prev.mileage;
            if (dist > 0 && curr.liters) {
                const consumption = (curr.liters / dist) * 100;
                if (consumption > 0 && consumption < 30) { // Filter unrealistic values
                    let label = curr.date;
                    if (/^\d{4}-\d{2}-\d{2}$/.test(curr.date)) {
                        const d = new Date(curr.date);
                        label = `${d.getDate()}/${d.getMonth() + 1}`;
                    }
                    trend.push({ name: label, value: parseFloat(consumption.toFixed(1)) });
                }
            }
        }
        return trend.slice(-10); // Last 10 points
    }, [logs]);

    const comparisonData: any[] = [];

    const handleDownload = () => {
        if (!isPremium) {
            toast.warning(t('analytics.pdf_premium_toast'), { duration: 4000 });
            navigate('/premium');
            return;
        }

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("CarSync Pro - Finansal Rapor", 14, 22);

        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(reportData.title, 14, 32);

        doc.setLineWidth(0.5);
        doc.line(14, 36, 196, 36);

        // Summary Box
        doc.setFillColor(245, 247, 250);
        doc.rect(14, 42, 182, 35, 'F');

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text("OZET VERILER", 18, 50);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        doc.text(`Toplam Mesafe: ${reportData.distance.toLocaleString()} km`, 18, 60);
        doc.text(`Toplam Harcama: ${reportData.total.toLocaleString()} TL`, 18, 67);
        doc.text(`KM Basina Maliyet: ${reportData.avgPerKm.toFixed(2)} TL`, 100, 60);

        // Breakdown Table
        const rows = reportData.items.map(item => [
            item.label,
            `${item.value.toLocaleString()} TL`,
            `%${((item.value / reportData.total) * 100).toFixed(1)}`
        ]);

        autoTable(doc, {
            startY: 85,
            head: [['Kategori', 'Tutar', 'Oran']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('CarSync Pro Finansal Analiz Modulu', 14, doc.internal.pageSize.height - 10);

        doc.save("carsync_finansal_rapor.pdf");
    };

    const handleSaleReport = () => {
        if (!isPremium) {
            toast.warning(t('analytics.sale_report_premium_toast'), { duration: 4000 });
            navigate('/premium');
            return;
        }

        const doc = new jsPDF();
        const vehicle = vehicles.find(v => v.id === v1Id) || vehicles[0];
        if (!vehicle) return;

        // Header
        doc.setFillColor(30, 41, 59); // Slate 800
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text(t('analytics.sale_report').toUpperCase(), 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(t('analytics.expert_summary'), 105, 28, { align: 'center' });

        // Vehicle Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(t('analytics.vehicle_info'), 14, 50);

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Marka/Model: ${vehicle.brand} ${vehicle.model}`, 14, 60);
        doc.text(`${t('analytics.year')}: ${vehicle.year}`, 14, 66);
        doc.text(`Plaka: ${vehicle.plate}`, 14, 72);
        doc.text(`Kilometre: ${vehicle.mileage.toLocaleString()} km`, 14, 78);

        // Health Score Badge
        doc.setFillColor(vehicle.healthScore >= 90 ? 34 : 234, vehicle.healthScore >= 90 ? 197 : 179, vehicle.healthScore >= 90 ? 94 : 8);
        doc.roundedRect(140, 50, 50, 30, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.text(`${vehicle.healthScore}`, 165, 68, { align: 'center' });
        doc.setFontSize(8);
        doc.text(t('analytics.health_title'), 165, 75, { align: 'center' });

        // Service History
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(t('analytics.history_summary'), 14, 100);

        const vehicleLogs = logs.filter(l => l.vehicleId === vehicle.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const totalSpent = vehicleLogs.reduce((acc, curr) => acc + curr.cost, 0);
        const lastService = vehicleLogs[0];

        doc.setFontSize(10);
        doc.text(`${t('analytics.total_spent')}: ${totalSpent.toLocaleString()} TL`, 14, 110);
        doc.text(`${t('analytics.last_op')}: ${lastService ? `${lastService.type} (${lastService.date})` : t('analytics.no_record')}`, 14, 116);
        doc.text(`${t('analytics.total_records')}: ${vehicleLogs.length}`, 14, 122);

        // Recent Services Table
        const tableRows = vehicleLogs.slice(0, 10).map(log => [
            log.date,
            log.type,
            `${log.mileage} km`,
            `${log.cost.toLocaleString()} TL`
        ]);

        autoTable(doc, {
            startY: 135,
            head: [[t('analytics.date_col'), t('analytics.op_col'), t('analytics.km_col'), t('analytics.cost_col')]],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
        });

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`${t('analytics.report_date')}: ${new Date().toLocaleDateString('tr-TR')}`, 14, pageHeight - 10);
        doc.text(t('analytics.report_footer'), 196, pageHeight - 10, { align: 'right' });

        doc.save(`satis_raporu_${vehicle.plate}.pdf`);
    };

    const toggleComparison = () => {
        if (!isPremium) {
            toast.warning(t('analytics.comparison_premium_toast'), { duration: 4000 });
            navigate('/premium');
            return;
        }
        setIsComparing(!isComparing);
    };

    const [exporting, setExporting] = React.useState(false);
    const handleCsvExport = async (type: 'logs' | 'monthly' | 'backup') => {
        setExporting(true);
        try {
            if (type === 'logs') await exportLogsCsv();
            if (type === 'monthly') await exportMonthlySummaryCsv();
            if (type === 'backup') await exportFullBackupJson();
            toast.success(t('analytics.export_success'));
        } catch (error) {
            toast.error(t('analytics.export_error'));
        }
        finally {
            setExporting(false);
        }
    };

    const onboardingSteps = [
        {
            title: 'Finansal Analiz',
            description: 'Yakıt, bakım ve sigorta giderlerinizi detaylı grafiklerle zaman bazlı olarak inceleyin.',
            icon: TrendingUp
        },
        {
            title: 'Araç Karşılaştırma',
            description: 'Yeni! Sayfanın en üstündeki kartı kullanarak iki farklı aracınızın maliyet ve performans verilerini kıyaslayın (Premium).',
            icon: ArrowRightLeft
        },
        {
            title: 'Rapor Oluşturma',
            description: 'Aylık veya yıllık finansal raporlarınızı görüntüleyin ve PDF olarak indirin.',
            icon: FileText
        }
    ];

    // Karşılaştırma için araç bazlı toplam ve ortalama maliyet hesapla
    const v1Cost = useMemo(() => {
        const vLogs = logs.filter(l => l.vehicleId === v1Id);
        if (vLogs.length === 0) return null;
        const total = vLogs.reduce((s, l) => s + (l.cost || 0), 0);
        return Math.round(total / Math.max(1, vLogs.length > 1 ?
            (() => {
                const dates = vLogs.map(l => l.date).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
                if (dates.length < 2) return 1;
                const diff = (new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()) / (1000 * 60 * 60 * 24 * 30);
                return Math.max(1, Math.round(diff));
            })() : 1
        ));
    }, [logs, v1Id]);

    const v2Cost = useMemo(() => {
        const vLogs = logs.filter(l => l.vehicleId === v2Id);
        if (vLogs.length === 0) return null;
        const total = vLogs.reduce((s, l) => s + (l.cost || 0), 0);
        return Math.round(total / Math.max(1, vLogs.length > 1 ?
            (() => {
                const dates = vLogs.map(l => l.date).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
                if (dates.length < 2) return 1;
                const diff = (new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()) / (1000 * 60 * 60 * 24 * 30);
                return Math.max(1, Math.round(diff));
            })() : 1
        ));
    }, [logs, v2Id]);

    const renderComparison = () => (
        <div className="animate-fadeIn space-y-6">
            {/* Selectors */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t('analytics.v1')}</label>
                    <select
                        value={v1Id}
                        onChange={(e) => setV1Id(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-sm rounded-xl p-4 outline-none focus:border-blue-500 appearance-none"
                    >
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t('analytics.v2')}</label>
                    <select
                        value={v2Id}
                        onChange={(e) => setV2Id(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-sm rounded-xl p-4 outline-none focus:border-blue-500 appearance-none"
                    >
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}
                    </select>
                </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl">
                <h3 className="text-sm font-bold mb-4 flex items-center">
                    <Fuel size={18} className="mr-2 text-blue-500" /> {t('analytics.fuel_consumption_label')}
                </h3>
                <div className="h-48 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                            <Tooltip
                                content={<CustomComparisonTooltip />}
                                cursor={{ fill: '#334155', opacity: 0.2 }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar name={v1.model} dataKey="v1" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={0} />
                            <Bar name={v2.model} dataKey="v2" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={300} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Stat Cards Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cost Comparison */}
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-slate-400">
                            <CreditCard size={18} />
                            <span className="text-xs font-bold uppercase">{t('analytics.monthly_cost')}</span>
                        </div>
                        <span className="text-xs text-slate-500">{t('analytics.average')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 relative">
                        <div className="text-center">
                            <div className="text-lg font-bold text-white">₺{(v1Cost ?? 3425).toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500 truncate mt-1">{v1.model}</div>
                        </div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-10 bg-slate-700"></div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-green-400">₺{(v2Cost ?? 2100).toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500 truncate mt-1">{v2.model}</div>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        {v1Cost && v2Cost && v1Cost !== v2Cost && (
                            <span className="bg-green-500/10 text-green-500 text-xs px-3 py-1.5 rounded font-medium">
                                {v2Cost < v1Cost
                                    ? t('analytics.more_efficient', { model: v2.model, percent: Math.round((1 - v2Cost / v1Cost) * 100) })
                                    : t('analytics.more_efficient', { model: v1.model, percent: Math.round((1 - v1Cost / v2Cost) * 100) })
                                }
                            </span>
                        )}
                    </div>
                </div>

                {/* Health Score Comparison */}
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-slate-400">
                            <TrendingUp size={18} />
                            <span className="text-xs font-bold uppercase">{t('analytics.health_score')}</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-slate-300">{v1.model}</span>
                                <span className="font-bold">{v1.healthScore}/100</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${v1.healthScore}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-slate-300">{v2.model}</span>
                                <span className={`font-bold ${v2.healthScore < 90 ? 'text-yellow-500' : 'text-green-500'}`}>{v2.healthScore}/100</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className={`h-2 rounded-full ${v2.healthScore < 90 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${v2.healthScore}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (dataLoading) {
        return (
            <div className="p-5 h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (vehicles.length === 0) {
        return (
            <div className="p-5 h-full flex flex-col items-center justify-center text-center">
                <TrendingUp size={48} className="text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">{t('analytics.no_data')}</h2>
                <p className="text-slate-400 mb-6">{t('analytics.no_data_desc')}</p>
                <button onClick={() => navigate('/')} className="text-blue-500 font-medium">{t('analytics.go_to_garage')}</button>
            </div>
        );
    }

    const timeFilters: Array<'1A' | '3A' | '6A' | '1Y' | 'Tümü'> = ['1A', '3A', '6A', '1Y', 'Tümü'];

    return (
        <div className="p-5 space-y-6">
            <OnboardingGuide tourKey="tour_analytics_v1" steps={onboardingSteps} />
            <header className="flex justify-between items-center pt-2">
                <div className="flex items-center space-x-3">
                    <button onClick={() => isComparing ? setIsComparing(false) : navigate(-1)} className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
                        {isComparing ? <ChevronRight className="rotate-180" size={24} /> : <CreditCard size={22} className="text-blue-500" />}
                    </button>
                    <div>
                        <div className="text-xs text-slate-400">{isComparing ? t('analytics.analysis_mode') : (vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model}` : t('analytics.vehicle'))}</div>
                        <h1 className="text-xl font-bold">{isComparing ? t('analytics.comparison') : t('analytics.title')}</h1>
                    </div>
                </div>
            </header>

            {!isComparing ? (
                <>
                    {/* NEW SECTION: Vehicle Comparison Entry Card */}
                    <div
                        onClick={toggleComparison}
                        className="relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] group shadow-lg shadow-slate-900/50 border border-slate-700 hover:border-amber-500/50"
                    >
                        {/* Premium Gradient Background (Subtle) */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"></div>

                        {/* Decorative Elements */}
                        <div className="absolute -right-6 -top-6 text-amber-500/5 transform rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                            <ArrowRightLeft size={140} />
                        </div>
                        {!isPremium && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-shimmer"></div>}

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-2.5 rounded-xl text-blue-400 border border-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                                    <ArrowRightLeft size={24} />
                                </div>
                                {!isPremium && (
                                    <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg shadow-amber-900/20 flex items-center tracking-wide border border-amber-400/20">
                                        <Lock size={10} className="mr-1.5" /> PREMIUM
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{t('analytics.comparison')}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-[85%] mb-4">
                                İki aracın yakıt tüketimi, bakım maliyetleri ve sağlık puanlarını yan yana kıyaslayın.
                            </p>

                            <div className="flex items-center text-blue-400 text-xs font-bold group-hover:translate-x-1 transition-transform bg-blue-500/10 w-fit px-3 py-1.5 rounded-lg">
                                <span>{isPremium ? t('analytics.start_comparison') : t('analytics.explore_feature')}</span>
                                <ChevronRight size={14} className="ml-1" />
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-slate-800 p-1.5 rounded-xl">
                        {timeFilters.map((p) => (
                            <button
                                key={p}
                                onClick={() => setTimeRange(p)}
                                className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition ${timeRange === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* Main Chart (Stacked Area) */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl animate-fadeIn">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <div className="text-slate-400 text-xs font-medium mb-1">{t('analytics.total_expense')} ({timeRange})</div>
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-3xl font-bold text-white">₺{lastPointTotal.toLocaleString()}</span>
                                    <span className="text-sm text-green-500 font-medium">↑ %12</span>
                                </div>
                            </div>
                            {/* Legend-like items */}
                            <div className="flex flex-col items-end space-y-1">
                                <div className="flex items-center text-[10px] text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Yakıt
                                </div>
                                <div className="flex items-center text-[10px] text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>Bakım
                                </div>
                                <div className="flex items-center text-[10px] text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>Sigorta
                                </div>
                            </div>
                        </div>

                        <div className="h-64 w-full min-w-0 -ml-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                        </linearGradient>
                                        <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                                        </linearGradient>
                                        <linearGradient id="colorIns" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                                        </linearGradient>
                                        <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#64748b" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid vertical={false} stroke="#334155" strokeDasharray="3 3" opacity={0.4} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} minTickGap={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => `₺${val / 1000}k`} />
                                    <Tooltip
                                        content={<CustomAreaTooltip t={t} />}
                                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />

                                    <Area type="monotone" name={t('analytics.other')} dataKey="other" stackId="1" stroke="#64748b" fill="url(#colorOther)" strokeWidth={2} animationDuration={1800} animationBegin={300} animationEasing="ease-in-out" />
                                    <Area type="monotone" name={t('analytics.insurance')} dataKey="insurance" stackId="1" stroke="#8b5cf6" fill="url(#colorIns)" strokeWidth={2} animationDuration={1600} animationBegin={200} animationEasing="ease-in-out" />
                                    <Area type="monotone" name={t('analytics.maintenance')} dataKey="maintenance" stackId="1" stroke="#f59e0b" fill="url(#colorMaint)" strokeWidth={2} animationDuration={1400} animationBegin={100} animationEasing="ease-in-out" />
                                    <Area type="monotone" name={t('analytics.fuel')} dataKey="fuel" stackId="1" stroke="#3b82f6" fill="url(#colorFuel)" strokeWidth={2} animationDuration={1200} animationBegin={0} animationEasing="ease-in-out" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detailed Stats Cards - 4 Grid Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Fuel size={40} className="text-blue-500" />
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500"><Fuel size={16} /></div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('analytics.fuel')}</span>
                            </div>
                            <div className="text-lg font-bold text-white">₺{rangeTotals.fuel.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{t('analytics.expense_period')}</div>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Wrench size={40} className="text-amber-500" />
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500"><Wrench size={16} /></div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('analytics.maintenance')}</span>
                            </div>
                            <div className="text-lg font-bold text-white">₺{rangeTotals.maintenance.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{t('analytics.expense_period')}</div>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Shield size={40} className="text-purple-500" />
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-500"><Shield size={16} /></div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('analytics.insurance')}</span>
                            </div>
                            <div className="text-lg font-bold text-white">₺{rangeTotals.insurance.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{t('analytics.expense_period')}</div>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 relative overflow-hidden group hover:border-slate-500/30 transition-colors">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <MoreHorizontal size={40} className="text-slate-500" />
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1.5 bg-slate-500/10 rounded-lg text-slate-500"><MoreHorizontal size={16} /></div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('analytics.other')}</span>
                            </div>
                            <div className="text-lg font-bold text-white">₺{rangeTotals.other.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{t('analytics.expense_period')}</div>
                        </div>
                    </div>

                    {/* NEW: Fuel Consumption Trend Chart */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl animate-fadeIn">
                        <div className="flex items-center space-x-2 mb-4">
                            <Droplet size={18} className="text-cyan-500" />
                            <h3 className="text-sm font-bold text-white">{t('analytics.fuel_trend')}</h3>
                        </div>
                        <div className="h-40 w-full min-w-0">
                            {fuelData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={fuelData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                        <Tooltip
                                            content={<CustomFuelTooltip />}
                                            cursor={{ stroke: '#475569', strokeWidth: 1 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#06b6d4"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                                    {t('analytics.no_fuel_data')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Breakdown Chart */}
                    <div className="pt-2 animate-fadeIn">
                        <h3 className="text-lg font-bold mb-4">{t('analytics.detailed_distribution')}</h3>
                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 relative">
                            <div className="h-64 w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Tooltip
                                            content={<CustomAreaTooltip />}
                                            cursor={{ fill: '#334155', opacity: 0.2 }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} iconType='circle' />
                                        <Bar dataKey="fuel" stackId="a" fill="#3b82f6" name={t('analytics.yakit')} radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="maintenance" stackId="a" fill="#f59e0b" name={t('analytics.bakim')} radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="insurance" stackId="a" fill="#8b5cf6" name={t('analytics.insurance')} radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="other" stackId="a" fill="#64748b" name={t('analytics.diger')} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-slate-700">
                                <div>
                                    <div className="text-xs text-slate-400 mb-1 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Bu Ay Toplam
                                    </div>
                                    <div className="font-bold text-lg">₺{currentMonthTotal.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 mb-1 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-slate-500 mr-2"></span> {t('analytics.average_monthly_cost')}
                                    </div>
                                    <div className="font-bold text-lg text-slate-300">₺{averageMonthlyCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Report Section */}
                    <div className="pt-4 pb-6 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Finansal Rapor</h3>
                            <div className="bg-slate-800 p-1 rounded-lg flex space-x-1">
                                <button
                                    onClick={() => setReportPeriod('monthly')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${reportPeriod === 'monthly' ? 'bg-slate-600 text-white shadow-sm scale-105' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    {t('analytics.monthly')}
                                </button>
                                <button
                                    onClick={() => setReportPeriod('yearly')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${reportPeriod === 'yearly' ? 'bg-slate-600 text-white shadow-sm scale-105' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    {t('analytics.yearly')}
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden relative">
                            {/* Decorative Header */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"></div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('analytics.report_summary')}</div>
                                        <h2 className="text-xl font-bold text-white">{reportData.title}</h2>
                                        <p className="text-slate-500 text-sm mt-1">{reportData.distance.toLocaleString()} km yol katedildi</p>
                                    </div>
                                    <div className="bg-slate-700/50 p-3 rounded-xl">
                                        <FileText className="text-slate-300" size={24} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <div className="text-sm text-slate-400 mb-1">Toplam Maliyet</div>
                                        <div className="text-2xl font-bold text-white">₺{reportData.total.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-slate-400 mb-1">{t('analytics.cost_per_km')}</div>
                                        <div className="text-2xl font-bold text-white">₺{reportData.avgPerKm.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {reportData.items.map((item) => (
                                        <div key={item.label} className="flex items-center justify-between group">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                                <span className="text-sm text-slate-300">{item.label}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-sm font-semibold mr-3">₺{item.value.toLocaleString()}</span>
                                                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color}`} style={{ width: `${(item.value / reportData.total) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleDownload}
                                    className={`btn-premium-3d w-full py-4 !shadow-blue-900/30 group relative overflow-hidden ${!isPremium
                                        ? '!bg-slate-800 border border-slate-700 !text-slate-400 hover:!border-amber-500/50 hover:!text-amber-500 !shadow-amber-900/10'
                                        : '!bg-blue-600 !text-white'
                                        }`}
                                >
                                    {!isPremium && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer"></div>}

                                    {!isPremium ? <Lock size={18} className="text-amber-500 transition-transform group-hover:scale-110" /> : <Download size={18} />}
                                    <span className="relative z-10">{t('analytics.download_pdf')}</span>
                                    {!isPremium && (
                                        <span className="relative z-10 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white px-2 py-0.5 rounded ml-2 shadow-sm border border-amber-400/20">
                                            PRO
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Sale Report Card */}
                    <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden group mb-6 animate-fadeIn">
                        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileCheck size={120} className="text-emerald-500" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
                                    <FileCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{t('analytics.sale_report_title')}</h3>
                                    <p className="text-slate-400 text-xs">{t('analytics.sale_report_desc')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-slate-500 mb-1">{t('analytics.content')}</div>
                                    <div className="text-sm font-medium text-slate-300">Servis Geçmişi & Bakımlar</div>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-slate-500 mb-1">{t('analytics.analysis')}</div>
                                    <div className="text-sm font-medium text-slate-300">Sağlık Puanı & Durum</div>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-slate-500 mb-1">{t('analytics.format')}</div>
                                    <div className="text-sm font-medium text-slate-300">Profesyonel PDF</div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaleReport}
                                className="btn-premium-3d w-full !bg-emerald-600 !shadow-emerald-900/40 text-white"
                            >
                                <FileText size={18} />
                                <span>{t('analytics.create_sale_report')}</span>
                                {!isPremium && <Lock size={14} className="ml-2 text-emerald-200" />}
                            </button>
                        </div>
                    </div>
                </>
            ) : renderComparison()}

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
