import React, { useState } from 'react';
import {
    Calendar as CalendarIcon, Plus, Search,
    ChevronRight, Trophy, Clock, Users
} from 'lucide-react';

export const DailyQuiz: React.FC = () => {
    const [quizzes] = useState([
        { id: '1', date: '2024-03-20', questionCount: 10, participants: 1250, topScore: 1000 },
        { id: '2', date: '2024-03-19', questionCount: 10, participants: 980, topScore: 950 },
        { id: '3', date: '2024-03-18', questionCount: 10, participants: 1100, topScore: 1000 },
    ]);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Daily Quiz Portal</h1>
                    <p className="text-white/40 text-sm">Schedule and manage date-specific quiz contests for your users.</p>
                </div>
                <button className="bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-3 rounded-2xl transition-all border border-white/10 flex items-center gap-2">
                    <Plus size={20} /> Schedule Quiz
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-[32px] border-white/5 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold mb-4">
                        <Users size={20} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">3,450</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Total Participants Today</p>
                </div>
                <div className="glass p-6 rounded-[32px] border-white/5 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                        <Trophy size={20} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Turkish Quiz</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Active Contest</p>
                </div>
                <div className="glass p-6 rounded-[32px] border-white/5 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                        <Clock size={20} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">14:55:02</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Next Quiz Timer</p>
                </div>
            </div>

            <div className="glass rounded-[32px] border-white/5 overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <CalendarIcon size={14} /> Recent Contests
                    </h2>
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by date..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-10 text-xs text-white focus:outline-none focus:border-gold/50 transition-all"
                        />
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group cursor-pointer">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center group-hover:bg-gold/10 group-hover:border-gold/20 transition-all">
                                    <span className="text-[10px] font-black text-white/20 group-hover:text-gold/60">{quiz.date.split('-')[1]}</span>
                                    <span className="text-lg font-black text-white group-hover:text-gold">{quiz.date.split('-')[2]}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white tracking-tight">{quiz.date} Daily Contest</h4>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20 flex items-center gap-1">
                                            <HelpCircle size={10} /> {quiz.questionCount} Qs
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20 flex items-center gap-1">
                                            <Users size={10} /> {quiz.participants} Plays
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Top Score</p>
                                    <p className="font-mono text-emerald-400 font-bold">{quiz.topScore} pts</p>
                                </div>
                                <ChevronRight className="text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" size={24} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Simple HelpCircle SVG component as Lucide fails to load in some contexts if not imported
const HelpCircle = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
