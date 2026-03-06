import React, { useState } from 'react';
import { Save, Lock, Smartphone, Mail, Globe, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AuthSettings: React.FC = () => {
    const [providers, setProviders] = useState({
        google: true,
        email: true,
        phone: false,
        anonymous: false
    });

    const handleSave = () => {
        toast.success('Authentication settings updated!');
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Identity & Access</h1>
                    <p className="text-white/30 text-sm font-medium">Manage authentication providers and security protocols.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> Save Settings
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-gold mb-2">
                        <Lock size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Auth Providers</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { id: 'google', label: 'Google Sign-In', icon: Globe, color: 'text-blue-400' },
                            { id: 'email', label: 'Email & Password', icon: Mail, color: 'text-emerald-400' },
                            { id: 'phone', label: 'Phone Verification', icon: Smartphone, color: 'text-amber-400' },
                            { id: 'anonymous', label: 'Guest Access', icon: ShieldCheck, color: 'text-purple-400' }
                        ].map((provider) => (
                            <div key={provider.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl bg-white/5 ${provider.color}`}>
                                        <provider.icon size={18} />
                                    </div>
                                    <h4 className="text-sm font-bold text-white">{provider.label}</h4>
                                </div>
                                <button
                                    onClick={() => setProviders({ ...providers, [provider.id]: !providers[provider.id as keyof typeof providers] })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${providers[provider.id as keyof typeof providers] ? 'bg-gold' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${providers[provider.id as keyof typeof providers] ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-gold mb-2">
                        <ShieldCheck size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Security Policy</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Session Timeout</h4>
                            <select className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none">
                                <option>24 Hours (Default)</option>
                                <option>7 Days</option>
                                <option>30 Days</option>
                                <option>Unlimited</option>
                            </select>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Minimum Password Strength</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {['Weak', 'Medium', 'Strong'].map(s => (
                                    <button key={s} className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${s === 'Strong' ? 'border-gold bg-gold/10 text-gold shadow-lg shadow-gold/10' : 'border-white/5 text-white/20'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
