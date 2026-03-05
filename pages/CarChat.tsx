import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft, Send, Sparkles, Trash2, Mic, Volume2, VolumeX, Car,
    Wrench, Fuel, BarChart2, CalendarClock, AlertCircle, ShieldCheck, Zap
} from 'lucide-react';
import { fetchVehicles, fetchLogs } from '../services/firestoreService';
import { chatWithVehicle } from '../services/geminiService';
import { Vehicle, ServiceLog } from '../types';
import { toast } from '../services/toast';

interface Message {
    id: string;
    sender: 'user' | 'car';
    text: string;
    timestamp: Date;
    action?: { label: string; route: string };
}

interface QuickAction {
    icon: React.ElementType;
    label: string;
    message: string;
    action?: { label: string; route: string };
    color: string;
}

const buildQuickActions = (vehicle: Vehicle, t: any): QuickAction[] => [
    {
        icon: Wrench,
        label: t('car_chat.qa_service'),
        message: t('car_chat.qa_service_msg'),
        action: { label: t('car_chat.qa_schedule'), route: '/service-appointment' },
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
        icon: Fuel,
        label: t('car_chat.qa_fuel'),
        message: t('car_chat.qa_fuel_msg'),
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
        icon: BarChart2,
        label: t('car_chat.qa_spending'),
        message: t('car_chat.qa_spending_msg'),
        action: { label: t('car_chat.qa_view_analytics'), route: '/analytics' },
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
        icon: ShieldCheck,
        label: t('car_chat.qa_docs'),
        message: t('car_chat.qa_docs_msg'),
        action: { label: t('car_chat.qa_view_ins'), route: '/insurance-calendar' },
        color: 'text-green-400 bg-green-500/10 border-green-500/20',
    },
    {
        icon: AlertCircle,
        label: t('car_chat.qa_health'),
        message: t('car_chat.qa_health_msg'),
        color: 'text-red-400 bg-red-500/10 border-red-500/20',
    },
    {
        icon: Zap,
        label: t('car_chat.qa_tips'),
        message: t('car_chat.qa_tips_msg'),
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
];

export const CarChat: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);
    const { t, i18n } = useTranslation();

    const [vehicle, setVehicle] = useState<Vehicle | undefined>(undefined);
    const [logs, setLogs] = useState<ServiceLog[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [showQuickActions, setShowQuickActions] = useState(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        fetchVehicles().then(vehicles => {
            const v = vehicles.find(v => v.id === id);
            setVehicle(v);
        });
        if (id) {
            fetchLogs(id).then(setLogs).catch(() => { });
        }
    }, [id]);

    const speakText = (text: string) => {
        if (!isSpeakerOn || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = i18n.language === 'en' ? 'en-US' : 'tr-TR';
        if (vehicle?.year && vehicle.year < 2000) {
            utterance.pitch = 0.8;
            utterance.rate = 0.9;
        } else {
            utterance.pitch = 1.0;
            utterance.rate = 1.1;
        }
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (vehicle && messages.length === 0) {
            setIsTyping(true);
            setTimeout(() => {
                const initialGreeting = vehicle.status === 'Servis Gerekli'
                    ? t('car_chat.greeting_maint', { mileage: vehicle.mileage.toLocaleString() })
                    : t('car_chat.greeting_ok');
                setMessages([{ id: 'init', sender: 'car', text: initialGreeting, timestamp: new Date() }]);
                setIsTyping(false);
            }, 1000);
        }
    }, [vehicle]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isTyping]);

    if (!vehicle) return <div className="flex items-center justify-center h-screen text-slate-400">{t('car_chat.not_found')}</div>;

    const quickActions = buildQuickActions(vehicle, t);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            recorder.ondataavailable = (evt) => { if (evt.data.size > 0) audioChunksRef.current.push(evt.data); };
            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => handleSend(undefined, (reader.result as string).split(',')[1]);
                stream.getTracks().forEach(t => t.stop());
            };
            recorder.start();
            setIsRecording(true);
        } catch {
            toast.error(t('car_chat.mic_error'));
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const dispatchMessage = async (text: string, audioBase64?: string, attachedAction?: { label: string; route: string }) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: audioBase64 ? t('car_chat.voice_msg') : text,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        setShowQuickActions(false);

        // Build rich system context with service log data
        const recentLogs = logs.slice(0, 5).map(l =>
            `- ${l.date}: ${l.type} (${l.mileage ?? '?'} km, ₺${l.cost ?? 0}${l.notes ? ' — ' + l.notes : ''})`
        ).join('\n');

        const history = messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        try {
            const responseText = await chatWithVehicle(
                audioBase64 ? '' : text,
                { ...vehicle, _contextLogs: recentLogs } as any,
                history,
                audioBase64
            );
            const carMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'car',
                text: responseText || '...',
                timestamp: new Date(),
                action: attachedAction,
            };
            setMessages(prev => [...prev, carMsg]);
            if (responseText) speakText(responseText);
        } catch {
            // silent
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = (textOverride?: string, audioBase64?: string) => {
        const text = textOverride ?? input;
        if (!text.trim() && !audioBase64) return;
        dispatchMessage(text, audioBase64);
    };

    const handleQuickAction = (qa: QuickAction) => {
        dispatchMessage(qa.message, undefined, qa.action);
    };

    const clearChat = () => {
        if (window.confirm(t('car_chat.confirm_clear'))) {
            setMessages([]);
            setShowQuickActions(true);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950">
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shadow-lg z-10">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-800 text-slate-300 transition">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center bg-slate-800">
                            {vehicle.image
                                ? <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover" />
                                : <Car size={20} className="text-slate-600" />
                            }
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-slate-900" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white text-base leading-tight">{vehicle.year} {vehicle.brand} {vehicle.model}</h1>
                        <div className="flex items-center text-[10px] space-x-1.5">
                            <span className="text-blue-400 font-medium">{t('car_chat.ai')}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400">{vehicle.mileage.toLocaleString()} km</span>
                            {logs.length > 0 && (
                                <>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-emerald-400">{logs.length} kayıt</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-1">
                    <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className="p-2 text-slate-400 hover:text-white transition">
                        {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button onClick={clearChat} className="p-2 text-slate-500 hover:text-red-400 transition">
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 relative"
                style={{ background: 'radial-gradient(ellipse at top, rgba(30,41,59,0.5) 0%, rgb(2,6,23) 70%)' }}
            >
                <div className="text-center py-2">
                    <span className="bg-slate-800/80 text-slate-400 text-[10px] px-3 py-1 rounded-full border border-slate-700">
                        {t('car_chat.encryption_note')}
                    </span>
                </div>

                {/* Quick Action Chips */}
                {showQuickActions && messages.length <= 1 && (
                    <div className="space-y-3 pb-2">
                        <p className="text-xs text-slate-500 text-center font-medium tracking-wide uppercase">{t('car_chat.quick_actions')}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {quickActions.map((qa, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickAction(qa)}
                                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition active:scale-95 ${qa.color}`}
                                >
                                    <qa.icon size={16} className="flex-shrink-0" />
                                    <span className="text-xs font-medium leading-tight">{qa.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[85%] space-y-2">
                            <div className={`rounded-2xl p-4 shadow-md text-sm leading-relaxed relative group ${msg.sender === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                }`}>
                                {msg.text}
                                <span className={`text-[9px] absolute bottom-1 ${msg.sender === 'user' ? 'left-2 text-blue-200' : 'right-2 text-slate-500'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {/* Action button attached to car response */}
                            {msg.sender === 'car' && msg.action && (
                                <button
                                    onClick={() => navigate(msg.action!.route)}
                                    className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 transition active:scale-95"
                                >
                                    <CalendarClock size={13} />
                                    {msg.action.label}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-4 flex items-center space-x-1.5 shadow-md">
                            {[0, 75, 150].map(delay => (
                                <div key={delay} className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recording Overlay */}
                {isRecording && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] z-10 relative">
                                    <Mic size={40} className="text-red-500" />
                                </div>
                                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30" />
                            </div>
                            <span className="text-white font-bold text-lg animate-pulse">{t('car_chat.recording')}</span>
                            <p className="text-slate-400 text-xs mt-2">{t('car_chat.release_to_send')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-900 border-t border-slate-800">
                {/* Smart suggestion bar if no message sent yet */}
                {showQuickActions && messages.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                        {quickActions.slice(0, 4).map((qa, i) => (
                            <button
                                key={i}
                                onClick={() => handleQuickAction(qa)}
                                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full hover:border-blue-500/50 hover:text-blue-300 transition"
                            >
                                <qa.icon size={12} />
                                {qa.label}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded-full border border-slate-700 focus-within:border-blue-500/50 transition-colors shadow-lg">
                    <div className="p-2 bg-slate-700/50 rounded-full text-slate-400">
                        <Sparkles size={20} />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isRecording ? t('car_chat.listening') : t('car_chat.chat_ph', { model: vehicle.model })}
                        className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none px-2"
                        disabled={isRecording}
                    />
                    {input.trim() ? (
                        <button
                            onClick={() => handleSend()}
                            disabled={isTyping}
                            className="p-3 rounded-full transition-all transform active:scale-95 bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                        >
                            <Send size={18} className="translate-x-0.5" />
                        </button>
                    ) : (
                        <button
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`p-3 rounded-full transition-all transform active:scale-95 ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-900/40 scale-110' : 'bg-slate-700 text-slate-400 hover:text-white'
                                }`}
                        >
                            <Mic size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};