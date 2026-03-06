import React, { useState } from 'react';
import {
    Save, Globe, Layout, Image as ImageIcon,
    Eye, EyeOff, ChevronRight, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { WebHomeConfig, WebHomeSection } from '../types';

export const WebHomeSettings: React.FC = () => {
    const [selectedLanguage, setSelectedLanguage] = useState('en');

    const initialSection = (id: string): WebHomeSection => ({
        id,
        isEnabled: true,
        title1: '',
        title2: '',
        heading: '',
        description1: '',
        description2: '',
    });

    const [config, setConfig] = useState<WebHomeConfig>({
        language: 'en',
        section1: initialSection('1'),
        section2: initialSection('2'),
        section3: initialSection('3')
    });

    const handleSave = () => {
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            {
                loading: 'Saving web settings...',
                success: 'Web home settings updated successfully!',
                error: 'Failed to save settings.',
            }
        );
    };

    const updateSection = (sectionKey: keyof Omit<WebHomeConfig, 'language'>, fields: Partial<WebHomeSection>) => {
        setConfig(prev => ({
            ...prev,
            [sectionKey]: { ...prev[sectionKey], ...fields }
        }));
    };

    const SectionForm = ({ title, sectionKey, section }: { title: string, sectionKey: keyof Omit<WebHomeConfig, 'language'>, section: WebHomeSection }) => (
        <div className="glass rounded-[32px] border-white/5 overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${section.isEnabled ? 'bg-gold/10 text-gold' : 'bg-white/5 text-white/20'}`}>
                        <Layout size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-white">{title}</h2>
                        <p className="text-[10px] text-white/40 font-medium">Configure content for this landing section</p>
                    </div>
                </div>
                <button
                    onClick={() => updateSection(sectionKey, { isEnabled: !section.isEnabled })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all border ${section.isEnabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/20'}`}
                >
                    {section.isEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{section.isEnabled ? 'Visible' : 'Hidden'}</span>
                </button>
            </div>

            <div className={`p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-300 ${!section.isEnabled && 'opacity-30 pointer-events-none'}`}>
                {/* Heading & Titles */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold mb-2">
                        <Info size={12} /> Text Content
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Main Heading</label>
                            <input
                                type="text"
                                value={section.heading}
                                onChange={(e) => updateSection(sectionKey, { heading: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium"
                                placeholder="Section Heading..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Title 1</label>
                                <input
                                    type="text"
                                    value={section.title1}
                                    onChange={(e) => updateSection(sectionKey, { title1: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium"
                                    placeholder="Mini Title..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Title 2</label>
                                <input
                                    type="text"
                                    value={section.title2}
                                    onChange={(e) => updateSection(sectionKey, { title2: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium"
                                    placeholder="Subtitle..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Descriptions */}
                <div className="space-y-6 lg:border-x lg:border-white/5 lg:px-8">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold mb-2">
                        <Layout size={12} /> Detailed Description
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Description 1</label>
                            <textarea
                                value={section.description1}
                                onChange={(e) => updateSection(sectionKey, { description1: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium min-h-[100px] resize-none"
                                placeholder="Primary description text..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Description 2</label>
                            <textarea
                                value={section.description2}
                                onChange={(e) => updateSection(sectionKey, { description2: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-medium min-h-[100px] resize-none"
                                placeholder="Secondary description text..."
                            />
                        </div>
                    </div>
                </div>

                {/* Media */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold mb-2">
                        <ImageIcon size={12} /> Media Assets
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Asset 1 (Banner)</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={section.image1 || ''}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white/50 focus:outline-none focus:border-gold/50 transition-all pr-24"
                                    placeholder="Image URL or path..."
                                    readOnly
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 text-white/60 text-[9px] font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-all uppercase tracking-widest">
                                    Browse
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Asset 2 (Icon/Small)</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={section.image2 || ''}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white/50 focus:outline-none focus:border-gold/50 transition-all pr-24"
                                    placeholder="Secondary asset..."
                                    readOnly
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 text-white/60 text-[9px] font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-all uppercase tracking-widest">
                                    Browse
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-gold uppercase opacity-80 mb-1">
                        <Globe size={12} /> Web Application CMS
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight leading-none">WEB HOME SETTINGS</h1>
                    <p className="text-white/30 text-sm font-medium">Customize your landing page experience for every language.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="glass px-4 py-2.5 rounded-2xl border-white/10 flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Active Language</span>
                        <div className="h-4 w-[1px] bg-white/10" />
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none appearance-none cursor-pointer pr-6 relative"
                        >
                            <option value="en" className="bg-[#1a1a1a]">English (EN)</option>
                            <option value="tr" className="bg-[#1a1a1a]">Turkish (TR)</option>
                            <option value="de" className="bg-[#1a1a1a]">German (DE)</option>
                        </select>
                        <ChevronRight className="rotate-90 text-white/20 -ml-5 pointer-events-none" size={14} />
                    </div>
                    <button
                        onClick={handleSave}
                        className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/5 flex items-center gap-2 group"
                    >
                        <Save size={18} className="group-hover:scale-110 transition-transform" /> Save Changes
                    </button>
                </div>
            </header>

            <div className="space-y-8 pb-12">
                <SectionForm title="Section 1: Hero & Vision" sectionKey="section1" section={config.section1} />
                <SectionForm title="Section 2: Key Features" sectionKey="section2" section={config.section2} />
                <SectionForm title="Section 3: Call to Action" sectionKey="section3" section={config.section3} />
            </div>

            {/* Note Area */}
            <div className="glass p-6 rounded-[32px] border-emerald-500/10 bg-emerald-500/[0.02]">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <Info size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">CMS Guidelines</h4>
                        <p className="text-xs text-white/40 leading-relaxed font-medium">
                            All changes made here will be reflected on the main web application instantly upon save.
                            Ensure high-resolution assets are used for Section 1 (Hero) to maintain premium visual quality.
                            Language-specific content is managed independently.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
