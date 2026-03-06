import React, { useState } from 'react';
import { Save, CreditCard, Landmark, DollarSign, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const PaymentSettings: React.FC = () => {
    const [config, setConfig] = useState({
        gateway: 'iyzico',
        apiKey: '••••••••••••••••',
        secretKey: '••••••••••••••••',
        testMode: true,
        currency: 'TRY'
    });

    const handleSave = () => {
        toast.success('Payment gateway settings updated!');
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Payment Gateways</h1>
                    <p className="text-white/30 text-sm font-medium">Configure transaction processors and billing credentials.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> Save Credentials
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[32px] border-white/5 space-y-8">
                    <div className="flex items-center gap-3 text-gold">
                        <CreditCard size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Active Processor</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'iyzico', name: 'Iyzico', logo: 'Landmark' },
                            { id: 'stripe', name: 'Stripe', logo: 'DollarSign' }
                        ].map(gw => (
                            <button
                                key={gw.id}
                                onClick={() => setConfig({ ...config, gateway: gw.id })}
                                className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-4 ${config.gateway === gw.id ? 'bg-gold/10 border-gold/40 shadow-lg shadow-gold/5' : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'}`}
                            >
                                <div className={`p-4 rounded-full ${config.gateway === gw.id ? 'bg-gold text-black' : 'bg-white/5 text-white/40'}`}>
                                    {gw.id === 'iyzico' ? <Landmark size={24} /> : <DollarSign size={24} />}
                                </div>
                                <span className={`text-xs font-black uppercase tracking-[0.2em] ${config.gateway === gw.id ? 'text-white' : 'text-white/20'}`}>{gw.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">API Key (Live/Sandbox)</label>
                            <input
                                type="password"
                                value={config.apiKey}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Secret Key</label>
                            <input
                                type="password"
                                value={config.secretKey}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-mono"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                        <div className="flex items-center gap-3 text-gold">
                            <DollarSign size={20} />
                            <h2 className="text-sm font-black uppercase tracking-widest">Transaction Config</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div>
                                    <h4 className="text-sm font-bold text-white">Sandbox Mode</h4>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Enable test environment</p>
                                </div>
                                <button
                                    onClick={() => setConfig({ ...config, testMode: !config.testMode })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${config.testMode ? 'bg-amber-500' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.testMode ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Default Currency</label>
                                <select className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none">
                                    <option>TRY - Turkish Lira</option>
                                    <option>USD - US Dollar</option>
                                    <option>EUR - Euro</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[32px] border-emerald-500/10 bg-emerald-500/[0.02] flex items-center gap-4">
                        <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
                        <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Gateway Verified</h4>
                            <p className="text-[10px] text-white/40 font-medium">Communication with Iyzico API v2.0 is successful.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
