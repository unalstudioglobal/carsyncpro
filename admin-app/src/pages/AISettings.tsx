import React, { useState } from 'react';
import { Save, Cpu, Zap, Sparkles, Code } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AISettings: React.FC = () => {
    const [aiConfig, setAIConfig] = useState({
        model: 'gemini-1.5-pro',
        apiKey: '••••••••••••••••',
        temperature: 0.7,
        maxTokens: 2048
    });

    const handleSave = () => {
        toast.success('AI Engine configuration updated!');
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">AI Engine Settings</h1>
                    <p className="text-white/30 text-sm font-medium">Configure LLM models and intelligence parameters.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2"
                >
                    <Save size={18} /> Update Engine
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 glass p-8 rounded-[32px] border-white/5 space-y-8">
                    <div className="flex items-center gap-3 text-gold">
                        <Cpu size={20} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Model Configuration</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Primary Model</label>
                            <select
                                value={aiConfig.model}
                                onChange={(e) => setAIConfig({ ...aiConfig, model: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-bold"
                            >
                                <option value="gemini-1.5-pro" className="bg-[#1a1a1a]">Gemini 1.5 Pro</option>
                                <option value="gemini-1.5-flash" className="bg-[#1a1a1a]">Gemini 1.5 Flash</option>
                                <option value="gpt-4o" className="bg-[#1a1a1a]">GPT-4 Omni</option>
                                <option value="claude-3-sonnet" className="bg-[#1a1a1a]">Claude 3.5 Sonnet</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">API Key</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={aiConfig.apiKey}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-mono"
                                />
                                <Code size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-white/5">
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Temperature ({aiConfig.temperature})</label>
                                <span className="text-[10px] text-white/20 font-bold uppercase italic">{aiConfig.temperature > 0.8 ? 'Creative' : 'Precise'}</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.1"
                                value={aiConfig.temperature}
                                onChange={(e) => setAIConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-gold"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="glass p-8 rounded-[32px] border-white/5 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold mb-2">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">AI Diagnostic</h3>
                        <p className="text-xs text-white/40 font-medium leading-relaxed">System is running optimally. Latency: <span className="text-gold">142ms</span></p>
                        <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-gold/10 hover:border-gold/20 hover:text-gold transition-all">
                            Run Latency Test
                        </button>
                    </div>

                    <div className="glass p-8 rounded-[32px] border-emerald-500/10 bg-emerald-500/[0.02] space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Zap size={16} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Intelligence Level</h4>
                        </div>
                        <p className="text-xs text-white/40 font-medium">Predictive maintenance accuracy is currently at <span className="text-emerald-400 font-bold">94.8%</span>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
