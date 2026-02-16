const SETTINGS_KEY = 'notification_settings';

type NotificationType = 'verification_complete' | 'maintenance_reminder' | 'marketing';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

export function getNotificationSetting(type: NotificationType): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return settings[type] ?? false;
  } catch {
    return false;
  }
}

export function setNotificationSetting(type: NotificationType, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    settings[type] = enabled;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export async function sendVerificationCompleteNotification(
  status: 'appropriate' | 'review_needed' | string
): Promise<void> {
  if (!getNotificationSetting('verification_complete')) return;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const title = '카비 - 견적 검증 완료';
    const body =
      status === 'appropriate'
        ? '적정 견적이에요. 결과를 확인해보세요.'
        : '재검토가 필요한 항목이 있어요. 결과를 확인해보세요.';

    await reg.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'verification-complete',
    });
  } catch {
    // notification failed silently
  }
}
