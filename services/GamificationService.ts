import { GamificationData, Achievement } from '../types';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const XP_RULES = {
  FUEL_LOG: 50,
  SERVICE_LOG: 150,
  DAILY_CHECKIN: 25,
  OBD_CONNECTION: 40,
  ACHIEVEMENT_UNLOCK: 100,
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_vehicle', title: 'Hoş Geldin!', description: 'İlk aracını garaja ekledin.', icon: 'Car' },
  { id: 'eco_driver', title: 'Çevreci Sürücü', description: '5 kez yakıt kaydı girdin.', icon: 'Leaf' },
  { id: 'maintenance_pro', title: 'Bakım Uzmanı', description: 'Aracının 3 bakımını geciktirmeden tamamladın.', icon: 'Wrench' },
  { id: 'obd_master', title: 'Teknoloji Kurdu', description: 'OBD canlı veri bağlantısını başlattın.', icon: 'Zap' },
  { id: 'streak_3', title: 'İstikrarlı', description: '3 gün üst üste uygulamayı kullandın.', icon: 'Flame' },
];

class GamificationService {
  private static instance: GamificationService;

  private constructor() {}

  static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  getXPForNextLevel(currentLevel: number): number {
    return Math.pow(currentLevel, 2) * 100;
  }

  async triggerHapticSuccess() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch { /* ignored for web browser */ }
  }

  async triggerHapticError() {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch { /* ignored for web browser */ }
  }

  processAction(currentData: GamificationData, action: keyof typeof XP_RULES): { newData: GamificationData; unlockedAchievements: Achievement[] } {
    const xpToAdd = XP_RULES[action];
    const newXP = currentData.xp + xpToAdd;
    const newLevel = this.calculateLevel(newXP);
    
    let unlockedAchievements: Achievement[] = [];
    const currentAchievementIds = currentData.achievements.map(a => a.id);

    // Otomatik başarım kontrolü (basit mantık)
    const possibleAchievements = ACHIEVEMENTS.filter(a => !currentAchievementIds.includes(a.id));
    
    // achievement logic based on action and context
    if (action === 'OBD_CONNECTION' && !currentAchievementIds.includes('obd_master')) {
        const ach = ACHIEVEMENTS.find(a => a.id === 'obd_master');
        if (ach) unlockedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
    }

    if (action === 'FUEL_LOG' && !currentAchievementIds.includes('eco_driver')) {
        // Simple logic: if they have many logs in currentData, they might unlock it
        // In a real app we'd check history, but let's simulate growth
        if (Math.random() > 0.7) { // 30% chance on each fuel log for demo purposes/simplicity
            const ach = ACHIEVEMENTS.find(a => a.id === 'eco_driver');
            if (ach) unlockedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
        }
    }

    if (newLevel > currentData.level) {
        this.triggerHapticSuccess();
    }

    const newData: GamificationData = {
      ...currentData,
      xp: newXP,
      level: newLevel,
      achievements: [...currentData.achievements, ...unlockedAchievements],
    };

    return { newData, unlockedAchievements };
  }
}

export const gamificationService = GamificationService.getInstance();
