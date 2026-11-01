import confetti from 'canvas-confetti';

export const NotificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  sendNotification: (title: string, body: string): void => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
        });
      } catch (e) {
        console.warn('Could not trigger native notification:', e);
      }
    }
  },

  triggerCelebration: (): void => {
    // Subtle joyful celebration burst
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#FF5E36', '#F59E0B', '#10B981', '#3B82F6'],
        disableForReducedMotion: true,
      });
    } catch (e) {
      // ignore
    }
  },
};
