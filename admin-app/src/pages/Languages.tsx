import React, { useState } from 'react';
import {
    Search, Edit3, Trash2, Globe,
    RefreshCw, Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Language {
    id: string;
    name: string;
    status: 'Enabled' | 'Disabled';
}

export const Languages: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<'admin' | 'app' | 'web'>('admin');
    const [languages, setLanguages] = useState<Language[]>([
        { id: '1', name: 'English', status: 'Enabled' },
        { id: '2', name: 'Marathi', status: 'Enabled' },
        { id: '3', name: 'Nepali', status: 'Enabled' },
        { id: '4', name: 'Turkish', status: 'Enabled' },
    ]);
    const [newName, setNewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = [
        { id: 'admin', label: 'Admin Panel' },
        { id: 'app', label: 'App' },
        { id: 'web', label: 'Web' }
    ];

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        const newLang: Language = {
            id: (languages.length + 1).toString(),
            name: newName,
            status: 'Enabled'
        };
        setLanguages([...languages, newLang]);
        setNewName('');
        toast.success(`${categories.find(c => c.id === activeCategory)?.label} dili başarıyla eklendi`);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bu dili silmek istediğinize emin misiniz?')) {
            setLanguages(languages.filter(l => l.id !== id));
            toast.success('Dil silindi');
        }
    };

    const toggleStatus = (id: string) => {
        setLanguages(languages.map(l =>
            l.id === id ? { ...l, status: l.status === 'Enabled' ? 'Disabled' : 'Enabled' } : l
        ));
    };

    const filteredLanguages = languages.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <header>
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-gold/10 rounded-2xl border border-gold/20">
                        <Globe className="text-gold" size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">System Languages</h1>
                        <p className="text-white/40 text-sm">Tüm platformlar için dil deskteğini buradan yönetin.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Categories */}
                <div className="lg:col-span-3">
                    <div className="glass p-4 rounded-[32px] border-white/5 space-y-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id as any)}
                                className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-between ${activeCategory === cat.id
                                    ? 'bg-gold text-black shadow-lg shadow-gold/20'
                                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {cat.label}
                                {activeCategory === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-black/40" />}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 p-6 rounded-[32px] bg-gold/5 border border-gold/10">
                        <p className="text-[11px] text-gold/60 leading-relaxed font-medium">
                            <span className="font-black block mb-1">BİLGİ</span>
                            Seçili kategori için eklenen diller hemen aktif hale gelir. Manuel çeviri dosyalarını güncellemeyi unutmayın.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9 space-y-8">
                    {/* Add Form Area */}
                    <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Add {categories.find(c => c.id === activeCategory)?.label} Languages</h2>
                            <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                                <span className="text-[10px] font-black text-gold uppercase tracking-widest">{activeCategory} mode</span>
                            </div>
                        </div>

                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-10 space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Language Name *</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Örn: English, Turkish..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-6 text-white focus:outline-none focus:border-gold/50 transition-all placeholder:text-white/10"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    className="w-full bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest py-3.5 rounded-2xl transition-all shadow-xl shadow-gold/10 active:scale-95"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table Area */}
                    <div className="glass rounded-[32px] border-white/5 overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex flex-wrap justify-between items-center bg-white/[0.01] gap-4">
                            <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">
                                {categories.find(c => c.id === activeCategory)?.label} Languages List
                                <span className="ml-3 text-[10px] text-white/20 font-bold whitespace-nowrap">View / Update / Delete</span>
                            </h3>

                            <div className="flex items-center gap-4 flex-1 md:flex-none justify-end">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Ara..."
                                        className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-gold/50 transition-all w-full md:w-32 lg:w-48"
                                    />
                                </div>
                                <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><RefreshCw size={14} /></button>
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><Filter size={14} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto text-[13px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-8 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider w-20">Sr No.</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">Language Name</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase text-white/40 tracking-wider text-right w-32">Operate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredLanguages.map((lang, index) => (
                                        <tr key={lang.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-4 text-white/20 font-mono">{index + 1}</td>
                                            <td className="px-8 py-4 font-bold text-white uppercase tracking-tight">{lang.name}</td>
                                            <td className="px-8 py-4">
                                                <button
                                                    onClick={() => toggleStatus(lang.id)}
                                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${lang.status === 'Enabled'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                        }`}
                                                >
                                                    <div className={`w-1 h-1 rounded-full ${lang.status === 'Enabled' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                                                    {lang.status}
                                                </button>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"><Edit3 size={12} /></button>
                                                    <button
                                                        onClick={() => handleDelete(lang.id)}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                                    ><Trash2 size={12} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-white/5 text-[10px] font-bold text-white/10 uppercase tracking-[0.2em] bg-white/[0.01]">
                            Showing 1 to {filteredLanguages.length} of {filteredLanguages.length} rows
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
