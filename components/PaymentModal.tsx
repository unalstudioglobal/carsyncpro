import React, { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle, Smartphone, Calendar } from 'lucide-react';

interface PaymentModalProps {
    amount: number;
    description: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ amount, description, onClose, onSuccess }) => {
    const [step, setStep] = useState<'card' | 'processing' | 'success'>('card');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');

    const handlePayment = () => {
        setStep('processing');
        // Simulate API call
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onSuccess();
            }, 2000);
        }, 2000);
    };

    const formatCardNumber = (val: string) => {
        return val.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
    };

    const formatExpiry = (val: string) => {
        return val.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2').slice(0, 5);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">Ödeme Yap</h3>
                        <p className="text-slate-400 text-xs mt-1">{description}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-700/50 rounded-full hover:bg-slate-700 text-slate-400 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'card' && (
                        <div className="space-y-5">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <CreditCard size={100} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <Smartphone size={24} />
                                        <span className="font-mono text-lg font-bold">₺{amount.toLocaleString()}</span>
                                    </div>
                                    <div className="font-mono text-xl tracking-widest mb-4">{cardNumber || '•••• •••• •••• ••••'}</div>
                                    <div className="flex justify-between text-xs opacity-80 uppercase">
                                        <div>
                                            <div className="text-[10px] mb-0.5">Kart Sahibi</div>
                                            <div className="font-bold text-sm">{name || 'AD SOYAD'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] mb-0.5">SKT</div>
                                            <div className="font-bold text-sm">{expiry || 'AA/YY'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 ml-1 mb-1 block">KART SAHİBİ</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={e => setName(e.target.value.toUpperCase())}
                                        placeholder="Kart üzerindeki isim"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 ml-1 mb-1 block">KART NUMARASI</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={cardNumber}
                                            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pl-12 text-white outline-none focus:border-blue-500 transition font-mono"
                                            maxLength={19}
                                        />
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 ml-1 mb-1 block">SON KULLANMA</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={expiry}
                                                onChange={e => setExpiry(formatExpiry(e.target.value))}
                                                placeholder="AA/YY"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pl-12 text-white outline-none focus:border-blue-500 transition font-mono"
                                                maxLength={5}
                                            />
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 ml-1 mb-1 block">CVV</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={cvv}
                                                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                placeholder="123"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pl-12 text-white outline-none focus:border-blue-500 transition font-mono"
                                                maxLength={3}
                                            />
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handlePayment}
                                disabled={!cardNumber || !expiry || !cvv || !name}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/40 transition active:scale-95 flex items-center justify-center space-x-2"
                            >
                                <Lock size={18} />
                                <span>Güvenli Ödeme Yap (₺{amount.toLocaleString()})</span>
                            </button>
                            
                            <div className="flex justify-center space-x-4 opacity-50 grayscale">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-6" alt="Visa" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-6" alt="PayPal" />
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                                <Smartphone className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Ödeme İşleniyor</h3>
                                <p className="text-slate-400 text-sm">Lütfen bekleyiniz, bankanızla iletişim kuruluyor...</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
                            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                                <CheckCircle size={48} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Ödeme Başarılı!</h3>
                                <p className="text-slate-400 text-sm">İşleminiz onaylandı. Makbuzunuz e-posta adresinize gönderildi.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
