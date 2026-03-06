import React, { useState } from 'react';
import {
    Plus, Search, Edit3, Trash2, Globe,
    RefreshCw, Filter, MoreVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Language {
    id: string;
    name: string;
    status: 'Enabled' | 'Disabled';
}

export const Languages: React.FC = () => {
    const [languages, setLanguages] = useState<Language[]>([
        { id: '1', name: 'English', status: 'Enabled' },
        { id: '2', name: 'Marathi', status: 'Enabled' },
        { id: '3', name: 'Nepali', status: 'Enabled' },
        { id: '4', name: 'Turkish', status: 'Enabled' },
        { id: '5', name: 'Romana', status: 'Enabled' },
        { id: '6', name: 'Arabic', status: 'Enabled' },
        { id: '7', name: 'French', status: 'Enabled' },
        { id: '8', name: 'Catalan', status: 'Enabled' },
    ]);
    const [newName, setNewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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
        toast.success('Dil başarıyla eklendi');
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
                <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Create Language</h1>
                <p className="text-white/40 text-sm">Sistem dillerini ve durumlarını yönetin.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Add Form */}
                <div className="lg:col-span-4">
                    <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Language Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Örn: Almanca"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-gold/50 transition-all"
                            />
                        </div>
                        <button
                            onClick={handleAdd}
                            className="w-full bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-gold/10 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> Add New
                        </button>
                    </div>
                </div>

                {/* Table Area */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="glass rounded-[32px] border-white/5 overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <div className="relative w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Dil ara..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 px-10 text-sm text-white focus:outline-none focus:border-gold/50 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-white/5 rounded-xl text-white/40 transition-all"><RefreshCw size={18} /></button>
                                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                                    <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Filter size={16} /></button>
                                    <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><MoreVertical size={16} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider w-20">ID</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider">Language Name</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider text-right">Options</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredLanguages.map((lang) => (
                                        <tr key={lang.id} className="hover:bg-white/[0.02] transition-colors group text-sm">
                                            <td className="px-8 py-5 text-white/40 font-mono">{lang.id}</td>
                                            <td className="px-8 py-5 font-bold text-white uppercase tracking-tight">{lang.name}</td>
                                            <td className="px-8 py-5">
                                                <button
                                                    onClick={() => toggleStatus(lang.id)}
                                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${lang.status === 'Enabled'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${lang.status === 'Enabled' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                                                    {lang.status}
                                                </button>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"><Edit3 size={14} /></button>
                                                    <button
                                                        onClick={() => handleDelete(lang.id)}
                                                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                                    ><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-white/5 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] bg-white/[0.01]">
                            Showing 1 to {filteredLanguages.length} of {filteredLanguages.length} rows | 10 rows per page
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-blue-400">
                        <Globe size={18} className="shrink-0" />
                        <p className="text-[11px] font-medium leading-relaxed">
                            Burada tanımlanan diller, mobil ve web uygulamalarındaki çoklu dil desteği için temel oluşturur.
                            Dil isimlerini doğru girdiğinizden emin olun.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
