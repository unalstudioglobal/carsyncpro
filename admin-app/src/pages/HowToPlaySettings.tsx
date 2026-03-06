import React, { useState } from 'react';
import { Save, Play, List } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const HowToPlaySettings: React.FC = () => {
    const [steps] = useState([
        { id: '1', title: 'Connect Your Vehicle', description: 'Plug in your OBD-II device and pair it with the app.' },
        { id: '2', title: 'Run Diagnostics', description: 'Start the AI scan to identify potential issues.' },
        { id: '3', title: 'Earn Rewards', description: 'Complete maintenance logs to climb the leaderboard.' }
    ]);

    const handleSave = () => {
        toast.success('How To Play guide updated!');
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Platform Guide CMS</h1>
                    <p className="text-white/30 text-sm font-medium">Customize the "How It Works" instructions for new users.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> Sync Guide
                </button>
            </header>

            <div className="space-y-6">
                {steps.map((step, index) => (
                    <div key={step.id} className="glass p-8 rounded-[32px] border-white/5 flex gap-8 items-start relative group">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <span className="text-2xl font-black text-gold/40">{index + 1}</span>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Step Title</label>
                                    <input type="text" value={step.title} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Step Description</label>
                                    <input type="text" value={step.description} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium" />
                                </div>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gold/10 hidden group-hover:flex items-center justify-center text-gold cursor-pointer transition-all border border-gold/20">
                            <List size={20} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass p-8 rounded-[32px] border-white/5 bg-white/[0.01] flex items-center justify-center border-dashed">
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-gold transition-all">
                    <Play size={14} /> Add New Step to Guide
                </button>
            </div>
        </div>
    );
};
