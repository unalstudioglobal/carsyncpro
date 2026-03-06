import React, { useState } from 'react';
import {
    Plus, Search, Edit3, Trash2,
    HelpCircle, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Question, Category, SubCategory } from '../types';

export const Questions: React.FC = () => {
    // Mock data for relationships
    const categories: Category[] = [
        { id: '1', name: 'General Knowledge', status: 'Enabled' },
        { id: '2', name: 'Science', status: 'Enabled' },
    ];

    const subCategories: SubCategory[] = [
        { id: '1', categoryId: '1', name: 'History', status: 'Enabled' },
        { id: '2', categoryId: '1', name: 'Geography', status: 'Enabled' },
        { id: '3', categoryId: '2', name: 'Physics', status: 'Enabled' },
    ];

    const [questions, setQuestions] = useState<Question[]>([
        {
            id: '1',
            categoryId: '1',
            subCategoryId: '1',
            question: 'Who was the first president of the United States?',
            questionType: 'Options',
            optionA: 'George Washington',
            optionB: 'Thomas Jefferson',
            optionC: 'Abraham Lincoln',
            optionD: 'John Adams',
            correctAnswer: 'A',
            status: 'Enabled'
        },
        {
            id: '2',
            categoryId: '2',
            subCategoryId: '3',
            question: 'The earth is flat.',
            questionType: 'True/False',
            optionA: 'True',
            optionB: 'False',
            correctAnswer: 'False',
            status: 'Enabled'
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const handleDelete = (id: string) => {
        if (window.confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
            setQuestions(questions.filter(q => q.id !== id));
            toast.success('Soru silindi');
        }
    };

    const toggleStatus = (id: string) => {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, status: q.status === 'Enabled' ? 'Disabled' : 'Enabled' } : q
        ));
    };

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';
    const getSubCategoryName = (id?: string) => subCategories.find(s => s.id === id)?.name || 'N/A';

    const filtered = questions.filter(q =>
        (q.question.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterCategory === '' || q.categoryId === filterCategory)
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Question Bank</h1>
                    <p className="text-white/40 text-sm">Manage all quiz questions, options, and correct answers.</p>
                </div>
                <button className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-xl shadow-gold/10 flex items-center gap-2">
                    <Plus size={20} /> Add New Question
                </button>
            </header>

            {/* Filters Bar */}
            <div className="glass p-6 rounded-[32px] border-white/5 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 items-center">
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search questions..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 px-10 text-sm text-white focus:outline-none focus:border-gold/50 transition-all"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl py-2 px-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all appearance-none"
                    >
                        <option value="" className="bg-[#1a1a1a]">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id} className="bg-[#1a1a1a]">{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{questions.filter(q => q.status === 'Enabled').length} Active</span>
                    <span className="mx-2 opacity-20">|</span>
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>{questions.filter(q => q.status === 'Disabled').length} Disabled</span>
                </div>
            </div>

            {/* Questions Table */}
            <div className="glass rounded-[32px] border-white/5 overflow-hidden flex flex-col shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider">Category / Sub</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider w-1/3">Question</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider">Type</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-white/40 tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((q) => (
                                <tr key={q.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gold">{getCategoryName(q.categoryId)}</span>
                                            <span className="text-[10px] font-bold text-white/30 truncate max-w-[120px]">{getSubCategoryName(q.subCategoryId)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-bold text-white tracking-tight leading-tight">{q.question}</span>
                                            <div className="flex flex-wrap gap-2">
                                                {q.questionType === 'Options' && (
                                                    <>
                                                        {['A', 'B', 'C', 'D'].map(opt => (
                                                            <span key={opt} className={`text-[9px] px-2 py-0.5 rounded border ${q.correctAnswer === opt ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                                {opt}: {(q as any)[`option${opt}`]}
                                                            </span>
                                                        ))}
                                                    </>
                                                )}
                                                {q.questionType === 'True/False' && (
                                                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                        Correct: {q.correctAnswer}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                                            {q.questionType === 'Options' ? <HelpCircle size={14} className="text-blue-400" /> : <CheckCircle2 size={14} className="text-purple-400" />}
                                            {q.questionType}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button
                                            onClick={() => toggleStatus(q.id)}
                                            className={`mx-auto w-3 h-3 rounded-full transition-all hover:scale-150 ${q.status === 'Enabled' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 opacity-30 shadow-none'}`}
                                            title={q.status}
                                        />
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 text-white/40">
                                            <button className="p-2 hover:bg-white/5 hover:text-white rounded-xl transition-all"><Edit3 size={16} /></button>
                                            <button
                                                onClick={() => handleDelete(q.id)}
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
    );
};
