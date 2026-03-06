import React, { useState } from 'react';
import {
    Plus, Search, Edit3, Trash2,
    Filter, MoreVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { SubCategory, Category } from '../types';

export const SubCategories: React.FC = () => {
    // Mock categories for the dropdown
    const categories: Category[] = [
        { id: '1', name: 'General Knowledge', status: 'Enabled' },
        { id: '2', name: 'Science', status: 'Enabled' },
        { id: '3', name: 'Sports', status: 'Enabled' },
    ];

    const [subCategories, setSubCategories] = useState<SubCategory[]>([
        { id: '1', categoryId: '1', name: 'History', status: 'Enabled', order: 1 },
        { id: '2', categoryId: '1', name: 'Geography', status: 'Enabled', order: 2 },
        { id: '3', categoryId: '2', name: 'Physics', status: 'Enabled', order: 1 },
    ]);

    const [newName, setNewName] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !selectedCategoryId) {
            toast.error('Lütfen isim ve kategori seçin');
            return;
        }
        const newSub: SubCategory = {
            id: (subCategories.length + 1).toString(),
            categoryId: selectedCategoryId,
            name: newName,
            status: 'Enabled',
            order: subCategories.length + 1
        };
        setSubCategories([...subCategories, newSub]);
        setNewName('');
        toast.success('Alt kategori eklendi');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Emin misiniz?')) {
            setSubCategories(subCategories.filter(s => s.id !== id));
            toast.success('Silindi');
        }
    };

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

    const filtered = subCategories.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(s.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Sub Categories</h1>
                <p className="text-white/40 text-sm">Define specialized sub-categories for your quiz categories.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form */}
                <div className="lg:col-span-4">
                    <div className="glass p-8 rounded-[32px] border-white/5 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Main Category</label>
                                <select
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-gold/50 transition-all appearance-none"
                                >
                                    <option value="" className="bg-[#1a1a1a]">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id} className="bg-[#1a1a1a]">{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Sub Category Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Ancient Revolutions"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-gold/50 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleAdd}
                                className="w-full bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> Add Sub Category
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="glass rounded-[32px] border-white/5 overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <div className="relative w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search sub-categories..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 px-10 text-sm text-white focus:outline-none focus:border-gold/50 transition-all"
                                />
                            </div>
                            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                                <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Filter size={16} /></button>
                                <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><MoreVertical size={16} /></button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider">Main Category</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider">Sub Category</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/5 px-2 py-1 rounded-md border border-gold/10">
                                                    {getCategoryName(sub.categoryId)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 font-bold text-white tracking-tight">{sub.name}</td>
                                            <td className="px-8 py-5">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${sub.status === 'Enabled' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 text-white/40">
                                                    <button className="p-2 hover:bg-white/5 hover:text-white rounded-xl transition-all"><Edit3 size={16} /></button>
                                                    <button
                                                        onClick={() => handleDelete(sub.id)}
                                                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
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
