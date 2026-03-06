import React, { useState } from 'react';
import { Save, Coins, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const CoinStoreSettings: React.FC = () => {
    const [packages] = useState([
        { id: '1', units: 100, price: 4.99, isBestSeller: false },
        { id: '2', units: 500, price: 19.99, isBestSeller: true },
        { id: '3', units: 1500, price: 49.99, isBestSeller: false },
    ]);

    const handleSave = () => {
        toast.success('In-app store inventory updated!');
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">CarSync Store Management</h1>
                    <p className="text-white/30 text-sm font-medium">Manage virtual currency bundles and in-app purchase offers.</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2">
                        <Plus size={18} /> Add Bundle
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                    >
                        <Save size={18} /> Sync Store
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {packages.map(pkg => (
                    <div key={pkg.id} className={`glass p-8 rounded-[32px] border-white/5 space-y-8 relative overflow-hidden transition-all hover:scale-[1.02] ${pkg.isBestSeller ? 'ring-2 ring-gold/40' : ''}`}>
                        {pkg.isBestSeller && (
                            <div className="absolute top-4 right-[-32px] rotate-45 bg-gold text-black text-[9px] font-black uppercase tracking-widest px-10 py-1 shadow-lg shadow-gold/20">
                                Best Seller
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold mb-4">
                                <Coins size={24} />
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{pkg.units} COINS</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Virtual Credit Bundle</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Bundle Price ($)</label>
                                <input
                                    type="number"
                                    value={pkg.price}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-white/20">Status: <span className="text-emerald-400">Published</span></span>
                            <button className="text-white/40 hover:text-white transition-colors flex items-center gap-1">
                                <TrendingUp size={12} /> Analytics
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass p-10 rounded-[40px] border-white/5 bg-gradient-to-br from-gold/[0.03] to-transparent flex flex-col md:flex-row items-center gap-10">
                <div className="w-20 h-20 rounded-3xl bg-gold/10 flex items-center justify-center text-gold shrink-0 border border-gold/20">
                    <Sparkles size={40} />
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Economic Balancer</h2>
                    <p className="text-sm text-white/40 font-medium leading-relaxed">
                        The virtual coin system is synced with Google Play Console and App Store Connect SKUs.
                        Modifying prices here will notify users of a <span className="text-gold">Market Update</span>.
                    </p>
                </div>
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-10 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap">
                    Economic Insights
                </button>
            </div>
        </div>
    );
};
