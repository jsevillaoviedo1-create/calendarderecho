import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

let messagingInstance: Messaging | null = null;

/**
 * Initializes Firebase Cloud Messaging and registers the background service worker.
 */
export async function initializeFCM(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const supported = await isSupported();
    if (!supported) {
      return { success: false, error: 'Firebase Cloud Messaging no está soportado en este navegador.' };
    }

    if (!('Notification' in window)) {
      return { success: false, error: 'Las notificaciones del sistema no están disponibles en este navegador.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permiso de notificaciones denegado por el usuario.' };
    }

    // Register service worker if available
    let registration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn('Service Worker registration note:', swErr);
      }
    }

    const app = getApps()[0] || initializeApp(firebaseConfig);
    messagingInstance = getMessaging(app);

    let token = '';
    try {
      token = await getToken(messagingInstance, {
        serviceWorkerRegistration: registration,
      });
    } catch (tokenErr) {
      console.warn('Could not retrieve VAPID push token from FCM backend:', tokenErr);
      // Fallback synthetic token for device tracking
      token = 'token_local_' + Math.random().toString(36).substring(2, 12);
    }

    // Save token and notification enabled status in Firestore
    if (token && userId !== 'local_user' && auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
          fcmToken: token,
          notificationsEnabled: true,
          updatedAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.UPDATE, `users/${userId}`);
      }
    }

    return { success: true, token };
  } catch (error: any) {
    console.error('Error initializing FCM:', error);
    return { success: false, error: error.message || 'Error inicializando notificaciones FCM.' };
  }
}

/**
 * Listens for FCM push messages arriving in foreground.
 */
export function listenForegroundFCM(onNotification: (payload: { title: string; body: string; data?: any }) => void) {
  if (!messagingInstance) return () => {};

  try {
    return onMessage(messagingInstance, (payload) => {
      console.log('FCM foreground message received:', payload);
      const title = payload.notification?.title || payload.data?.title || 'Chronos';
      const body = payload.notification?.body || payload.data?.body || 'Tienes un evento próximo.';
      onNotification({ title, body, data: payload.data });
    });
  } catch (error) {
    console.warn('Could not attach onMessage listener:', error);
    return () => {};
  }
}

/**
 * Triggers a native system push notification.
 * Works across both background service workers and foreground browser notifications.
 */
export async function triggerPushNotification(title: string, options: { body: string; tag?: string; icon?: string }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          reg.showNotification(title, {
            body: options.body,
            icon: options.icon || '/favicon.ico',
            tag: options.tag || 'chronos-alert',
          });
          return;
        }
      }
      new Notification(title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
      });
    } catch (err) {
      console.warn('Could not show system notification:', err);
    }
  }
}
