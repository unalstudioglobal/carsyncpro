import React, { useState } from 'react';
import { Save, Megaphone, Monitor, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdsSettings: React.FC = () => {
    const [ads, setAds] = useState({
        webBanner: 'ca-pub-3940256099942544/6300978111',
        mobileBanner: 'ca-app-pub-3940256099942544/6300978111',
        interstitial: 'ca-app-pub-3940256099942544/1033173712',
        rewarded: 'ca-app-pub-3940256099942544/5224354917'
    });

    const handleSave = () => {
        toast.success('Ad units configuration updated!');
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Advertising Panel</h1>
                    <p className="text-white/30 text-sm font-medium">Manage AdMob and AdSense placements across platforms.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> Save Ad Units
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[32px] border-white/5 space-y-8">
                    <div className="flex items-center gap-3 text-gold">
                        <Monitor size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Web Placements</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Desktop Banner ID</label>
                            <input
                                type="text"
                                value={ads.webBanner}
                                onChange={(e) => setAds({ ...ads, webBanner: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-mono"
                            />
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-gold/5 border border-gold/10">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold shrink-0">
                                <Megaphone size={20} />
                            </div>
                            <p className="text-xs text-white/40 leading-relaxed font-medium">Web ads are automatically HIDDEN for <span className="text-gold font-bold">Premium Users</span> based on the current subscription logic.</p>
                        </div>
                    </div>
                </div>

                <div className="glass p-8 rounded-[32px] border-white/5 space-y-8">
                    <div className="flex items-center gap-3 text-gold">
                        <Smartphone size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Mobile Placements</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">App Banner ID</label>
                            <input
                                type="text"
                                value={ads.mobileBanner}
                                onChange={(e) => setAds({ ...ads, mobileBanner: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">App Interstitial ID</label>
                            <input
                                type="text"
                                value={ads.interstitial}
                                onChange={(e) => setAds({ ...ads, interstitial: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Rewarded Video ID</label>
                            <input
                                type="text"
                                value={ads.rewarded}
                                onChange={(e) => setAds({ ...ads, rewarded: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
