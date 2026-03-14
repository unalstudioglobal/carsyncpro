import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const hapticFeedback = {
  success: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) { /* Browser ignore */ }
  },
  error: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) { /* Browser ignore */ }
  },
  warning: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) { /* Browser ignore */ }
  },
  impactLight: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) { /* Browser ignore */ }
  },
  impactMedium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) { /* Browser ignore */ }
  },
  impactHeavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) { /* Browser ignore */ }
  }
};
