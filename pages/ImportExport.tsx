import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Copy, Share2, Info, Camera, Zap, Image as ImageIcon, ChevronRight, RefreshCw, FileText, Fuel, ShieldCheck, Car } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { fetchVehicles } from '../services/firestoreService';
import { Vehicle } from '../types';
import { toast } from '../services/toast';

export const TransferHistory: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [transferCode, setTransferCode] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadVehicles = async () => {
            try {
                const data = await fetchVehicles();
                setVehicles(data);
            } catch (error) {
                console.error("Failed to fetch vehicles:", error);
            } finally {
                setLoading(false);
            }
        };
        loadVehicles();
    }, []);

    const vehicle = vehicles[currentIndex];

    useEffect(() => {
        if (vehicle) {
            generateNewCode();
        }
    }, [currentIndex, vehicle]);

    const generateNewCode = () => {
        setIsRegenerating(true);
        setTimeout(() => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const part1 = Array(3).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
            const part2 = Array(3).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
            setTransferCode(`TR-${part1}-${part2}`);
            setIsRegenerating(false);
        }, 300);
    };

    const handlePrev = () => {
        setCurrentIndex(prev => (prev === 0 ? vehicles.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev === vehicles.length - 1 ? 0 : prev + 1));
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${transferCode}&bgcolor=ffffff`;

    if (loading) {
        return <div className="p-5 h-full flex items-center justify-center text-slate-400">{t('docs.m_saving')}</div>;
    }

    if (vehicles.length === 0) {
        return (
            <div className="p-5 h-full flex flex-col items-center justify-center text-center">
                <Car size={48} className="text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">{t('importExport.no_vehicle')}</h2>
                <p className="text-slate-400 mb-6">{t('importExport.no_vehicle_desc')}</p>
                <button onClick={() => navigate('/')} className="text-blue-500 font-medium">{t('importExport.return_garage')}</button>
            </div>
        );
    }

    return (
        <div className="p-5 h-full flex flex-col">
            <header className="flex justify-between items-center pt-2 relative mb-2">
                <button onClick={() => navigate(-1)} className="text-blue-500 flex items-center text-sm font-medium p-2 -ml-2 active:text-blue-400">
                    <ChevronLeft size={24} /> <span className="text-base ml-1">{t('importExport.back')}</span>
                </button>
                <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">{t('importExport.title')}</h1>
            </header>

            {/* Vehicle Selection & Info */}
            <div className="mt-4 flex flex-col items-center animate-fadeIn">
                <div className="flex items-center justify-between w-full mb-4 px-4">
                    <button onClick={handlePrev} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition active:scale-95" disabled={vehicles.length <= 1}>
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full border-2 border-slate-700 overflow-hidden mb-2 shadow-lg flex items-center justify-center bg-slate-800">
                            {vehicle.image ? (
                                <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover" />
                            ) : (
                                <Car size={32} className="text-slate-600" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-center leading-tight">{vehicle.year} {vehicle.brand}</h2>
                        <p className="text-slate-400 text-sm">{vehicle.model}</p>
                    </div>

                    <button onClick={handleNext} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition active:scale-95" disabled={vehicles.length <= 1}>
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-slate-300">
                    <span>{vehicle.plate}</span>
                    <span className="text-slate-600">|</span>
                    <span>{vehicle.mileage.toLocaleString()} km</span>
                </div>
            </div>

            {/* QR Card */}
            <div className="mt-6 bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl flex flex-col items-center relative overflow-hidden animate-fadeIn">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"></div>

                <div className="flex items-center space-x-2 mb-6">
                    <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-green-500/20 flex items-center">
                        <ShieldCheck size={12} className="mr-1" /> {t('importExport.ready')}
                    </span>
                </div>

                <div className="flex items-center space-x-3 mb-6 relative">
                    <span className={`text-3xl font-mono text-blue-500 font-bold tracking-widest transition-opacity duration-300 ${isRegenerating ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
                        {transferCode || '...'}
                    </span>
                    <button onClick={generateNewCode} className="absolute -right-12 text-slate-500 hover:text-white transition p-2" disabled={isRegenerating}>
                        <RefreshCw size={18} className={isRegenerating ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="w-48 h-48 bg-white p-3 rounded-xl mb-6 shadow-inner relative group mx-auto transition-transform hover:scale-105 duration-300">
                    {!isRegenerating && transferCode ? (
                        <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <RefreshCw size={24} className="text-slate-300 animate-spin" />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3 w-full border-t border-slate-700/50 pt-4">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-500/10 p-2 rounded-lg mb-1"><FileText size={16} className="text-blue-400" /></div>
                        <span className="text-[10px] text-slate-400">{t('importExport.srv_rec')}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-amber-500/10 p-2 rounded-lg mb-1"><Fuel size={16} className="text-amber-400" /></div>
                        <span className="text-[10px] text-slate-400">{t('importExport.fuel_data')}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-purple-500/10 p-2 rounded-lg mb-1"><ImageIcon size={16} className="text-purple-400" /></div>
                        <span className="text-[10px] text-slate-400">{t('importExport.docs')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                    onClick={() => { navigator.clipboard.writeText(transferCode); toast.success(t('importExport.code_copied')); }}
                    className="btn-premium-3d !bg-slate-800 !shadow-slate-900/40 text-sm py-4"
                >
                    <Copy size={18} /> <span>{t('importExport.copy_code')}</span>
                </button>
                <button className="btn-premium-3d bg-blue-600 !shadow-blue-900/40 text-sm py-4">
                    <Share2 size={18} /> <span>{t('importExport.share')}</span>
                </button>
            </div>

            <div className="mt-6 flex items-start space-x-3 px-2 opacity-70">
                <Info className="text-slate-500 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                    {t('importExport.info_txt')}
                </p>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
             `}</style>
        </div>
    );
};

export const ScanImport: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [status, setStatus] = useState<'idle' | 'scanning' | 'found' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [scannedCode, setScannedCode] = useState('');
    const [importing, setImporting] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [showManual, setShowManual] = useState(false);

    const handleScan = (result: string) => {
        if (!result || status === 'found') return;
        const match = result.match(/TR-[A-Z0-9]{3}-[A-Z0-9]{3}/i);
        const extracted = match ? match[0].toUpperCase() : result.toUpperCase();
        setScannedCode(extracted);
        setStatus('found');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    };

    const handleError = (error: unknown) => {
        console.error('QR Scanner Error:', error);
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('permission') || msg.includes('NotAllowed')) {
            setErrorMsg(t('importExport.err_cam_denied'));
        } else if (msg.includes('NotFound')) {
            setErrorMsg(t('importExport.err_cam_notfound'));
        } else {
            setErrorMsg(t('importExport.err_cam_fail') + ' ' + msg);
        }
        setStatus('error');
    };

    const handleImport = async (code: string) => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return;
        const codeRegex = /^TR-[A-Z0-9]{3}-[A-Z0-9]{3}$/;
        if (!codeRegex.test(trimmed)) {
            toast.warning(t('importExport.err_invalid'));
            return;
        }
        setImporting(true);
        setTimeout(() => {
            setImporting(false);
            toast.success(t('importExport.success_import', { c: trimmed }));
            navigate('/');
        }, 1500);
    };

    return (
        <div className="h-screen bg-black flex flex-col relative overflow-hidden">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-20 p-5 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
                    <ChevronLeft size={32} />
                </button>
                <h2 className="text-white font-bold text-sm drop-shadow-lg">{t('importExport.scan_qr')}</h2>
                <button
                    onClick={() => setShowManual(v => !v)}
                    className="text-xs text-blue-300 underline underline-offset-2"
                >
                    {t('importExport.manual_fallback')}
                </button>
            </header>

            {/* Idle */}
            {status === 'idle' && !showManual && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                        <Camera size={40} className="text-blue-400" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white">{t('importExport.import_qr')}</h2>
                        <p className="text-slate-400 text-sm mt-2 leading-relaxed">{t('importExport.import_qr_desc')}</p>
                    </div>
                    <button
                        onClick={() => setStatus('scanning')}
                        className="btn-premium-3d w-full py-4 !bg-blue-600 !shadow-blue-900/40"
                    >
                        <Camera size={20} />
                        <span>{t('importExport.start_cam')}</span>
                    </button>
                    <button
                        onClick={() => setShowManual(true)}
                        className="text-sm text-slate-400 hover:text-slate-200 transition underline underline-offset-2"
                    >
                        {t('importExport.manual_fallback')}
                    </button>
                </div>
            )}

            {/* Scanner */}
            {status === 'scanning' && !showManual && (
                <div className="absolute inset-0">
                    <Scanner
                        onScan={(results) => { if (results[0]) handleScan(results[0].rawValue); }}
                        onError={handleError}
                        styles={{ container: { width: '100%', height: '100%' }, video: { width: '100%', height: '100%', objectFit: 'cover' } }}
                        components={{ finder: false }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-white font-bold text-lg mb-8 drop-shadow-lg">{t('importExport.scan_hint')}</p>
                        <div className="relative w-64 h-64">
                            <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] rounded-3xl" />
                            <div className="absolute inset-0 border-2 border-blue-400/60 rounded-3xl" />
                            {['top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl', 'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl',
                                'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl', 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl'
                            ].map((cls, i) => (
                                <div key={i} className={`absolute w-8 h-8 border-blue-400 ${cls}`} />
                            ))}
                            <div className="absolute left-2 right-2 h-0.5 bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)] animate-[scan_2s_ease-in-out_infinite] rounded-full" />
                        </div>
                    </div>
                </div>
            )}


            {/* Error */}
            {status === 'error' && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-8 space-y-5">
                    <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                        <Camera size={30} className="text-red-400" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-white mb-1">{t('importExport.cam_failed')}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{errorMsg}</p>
                    </div>
                    <button
                        onClick={() => { setStatus('idle'); setShowManual(true); }}
                        className="btn-premium-3d w-full py-4 !bg-blue-600 !shadow-blue-900/40"
                    >
                        {t('importExport.manual_btn')}
                    </button>
                </div>
            )}

            {/* Found */}
            {status === 'found' && (
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center animate-bounce">
                        <ShieldCheck size={36} className="text-green-400" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white">{t('importExport.code_scanned')}</h2>
                        <div className="mt-3 bg-slate-800 border border-slate-700 rounded-xl px-5 py-3">
                            <span className="font-mono text-2xl font-black text-blue-400 tracking-widest">{scannedCode}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => handleImport(scannedCode)}
                        disabled={importing}
                        className="btn-premium-3d w-full py-4 !bg-green-600 !shadow-green-900/40 disabled:opacity-60"
                    >
                        {importing
                            ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{t('importExport.importing')}</span></>
                            : <><ShieldCheck size={20} /><span>{t('importExport.confirm')}</span></>
                        }
                    </button>
                    <button onClick={() => setStatus('scanning')} className="text-sm text-slate-400 hover:text-slate-200 underline underline-offset-2 transition">
                        {t('importExport.scan_again')}
                    </button>
                </div>
            )}

            {/* Manual entry */}
            {showManual && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col">
                    <div className="flex-1" />
                    <div className="bg-slate-900 p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white text-lg">{t('importExport.manual_title')}</h3>
                            <button
                                onClick={() => { setShowManual(false); setStatus('scanning'); }}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                            >
                                <Camera size={14} /><span>{t('importExport.switch_cam')}</span>
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="TR-XXX-XXX"
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value.toUpperCase())}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-center font-mono text-2xl tracking-widest uppercase outline-none focus:border-blue-500 transition-colors text-white"
                            maxLength={10}
                        />
                        <p className="text-xs text-slate-500 text-center">{t('importExport.manual_hint')}</p>
                        <button
                            onClick={() => handleImport(manualCode)}
                            disabled={importing || manualCode.length < 9}
                            className="btn-premium-3d w-full py-4 !bg-blue-600 !shadow-blue-900/40 disabled:opacity-40"
                        >
                            {importing
                                ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{t('importExport.processing')}</span></>
                                : <><ChevronRight size={20} /><span>{t('importExport.confirm_import_btn')}</span></>
                            }
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scan {
                    0%   { top: 8%;  opacity: 0; }
                    10%  { opacity: 1; }
                    90%  { opacity: 1; }
                    100% { top: 88%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};
