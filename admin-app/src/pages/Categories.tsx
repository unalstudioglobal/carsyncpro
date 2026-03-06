import React, { useState } from 'react';
import {
    Plus, Search, Edit3, Trash2, Image as ImageIcon,
    Filter, MoreVertical, LayoutGrid
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Category } from '../types';

export const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([
        { id: '1', name: 'General Knowledge', status: 'Enabled', order: 1, image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=100&h=100&fit=crop' },
        { id: '2', name: 'Science', status: 'Enabled', order: 2, image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=100&h=100&fit=crop' },
        { id: '3', name: 'Sports', status: 'Disabled', order: 3, image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100&h=100&fit=crop' },
    ]);
    const [newName, setNewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        const newCat: Category = {
            id: (categories.length + 1).toString(),
            name: newName,
            status: 'Enabled',
            order: categories.length + 1
        };
        setCategories([...categories, newCat]);
        setNewName('');
        toast.success('Kategori başarıyla eklendi');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
            setCategories(categories.filter(c => c.id !== id));
            toast.success('Kategori silindi');
        }
    };

    const toggleStatus = (id: string) => {
        setCategories(categories.map(c =>
            c.id === id ? { ...c, status: c.status === 'Enabled' ? 'Disabled' : 'Enabled' } : c
        ));
    };

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Quiz Categories</h1>
                    <p className="text-white/40 text-sm">Manage your quiz categories and their visibility.</p>
                </div>
                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                    <button className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold text-white transition-all">All Categories</button>
                    <button className="px-4 py-2 hover:bg-white/5 rounded-xl text-xs font-bold text-white/40 transition-all">Archived</button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Create Category */}
                <div className="lg:col-span-4">
                    <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                        <div className="w-full aspect-square rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-gold/50 transition-all">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-gold transition-all">
                                <Plus size={32} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/60 transition-all">Upload Image</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Category Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. History"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-gold/50 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleAdd}
                                className="w-full bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-gold/10 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> Create Category
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categories Table */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass rounded-[32px] border-white/5 overflow-hidden flex flex-col shadow-2xl">
                        {/* Control Bar */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <div className="relative w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search categories..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 px-10 text-sm text-white focus:outline-none focus:border-gold/50 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                                    <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Filter size={16} /></button>
                                    <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><LayoutGrid size={16} /></button>
                                    <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><MoreVertical size={16} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider">Image</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider">Name</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider text-center">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map((cat) => (
                                        <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-5">
                                                {cat.image ? (
                                                    <img src={cat.image} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white tracking-tight">{cat.name}</span>
                                                    <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">ID: {cat.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => toggleStatus(cat.id)}
                                                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${cat.status === 'Enabled'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                            }`}
                                                    >
                                                        {cat.status}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 text-white/40">
                                                    <button className="p-2 hover:bg-white/5 hover:text-white rounded-xl transition-all"><Edit3 size={16} /></button>
                                                    <button
                                                        onClick={() => handleDelete(cat.id)}
                                                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
                                                    ><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
