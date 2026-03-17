import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Award, Flame, Zap, ZapOff, Sparkles, Car, Leaf, Wrench } from 'lucide-react';
import { useData } from '../context/DataContext';
import { gamificationService } from '../services/GamificationService';

interface AchievementsModalProps {
  onClose: () => void;
}

const ICON_MAP: Record<string, any> = {
  Car, Leaf, Wrench, Zap, Flame, Sparkles
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { gamification } = useData();
  const nextLevelXP = gamificationService.getXPForNextLevel(gamification.level);
  const progress = (gamification.xp / nextLevelXP) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
              <Award size={40} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black">{t('common.level', { level: gamification.level })}</h2>
              <p className="text-blue-100 font-bold opacity-80 uppercase tracking-widest text-[10px]">{t('achievements.leaderboard_tip')}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2 relative z-10">
            <div className="flex justify-between text-xs font-black uppercase tracking-wider">
              <span>{t('common.xp')}: {gamification.xp}</span>
              <span>{t('common.next')}: {nextLevelXP}</span>
            </div>
            <div className="h-2.5 bg-black/20 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-blue-400" />
            <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">{t('achievements.earned_title')}</h3>
          </div>

          <div className="grid gap-3">
            {gamification.achievements.length > 0 ? (
              gamification.achievements.map((ach) => {
                const Icon = ICON_MAP[ach.icon] || Award;
                return (
                  <div key={ach.id} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-800/50 border border-slate-700/50 group hover:border-blue-500/30 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{t(ach.title)}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{t(ach.description)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-600">
                  <ZapOff size={32} />
                </div>
                <p className="text-slate-500 text-xs font-medium" dangerouslySetInnerHTML={{ __html: t('achievements.earned_none').replace('\n', '<br/>') }} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950/50 border-t border-slate-800/50 flex justify-center">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
            <Flame size={12} />
            <span>{t('achievements.streak_days', { days: gamification.streakDays })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
