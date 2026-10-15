import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { AppNotification, CalendarEventItem } from '../types/calendar';
import { initializeFCM, listenForegroundFCM, triggerPushNotification } from '../lib/fcm';

import { useCalendar } from './CalendarContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  fcmEnabled: boolean;
  enableNotifications: () => Promise<{ success: boolean; error?: string }>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  notifyEventChange: (title: string, body: string, eventId?: string, type?: AppNotification['type']) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({
  children,
  events: propEvents,
}: {
  children: React.ReactNode;
  events?: CalendarEventItem[];
}) {
  const { currentUser, userProfile } = useAuth();
  const calendar = useCalendar();
  const events = propEvents || calendar.events;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [fcmEnabled, setFcmEnabled] = useState<boolean>(false);
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  // Track FCM status from user profile and browser permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setFcmEnabled(Notification.permission === 'granted' && Boolean(userProfile?.notificationsEnabled));
    }
  }, [userProfile]);

  // Firestore real-time listener for user-isolated notifications
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const path = `users/${currentUser.uid}/notifications`;
    const notifRef = collection(db, 'users', currentUser.uid, 'notifications');

    const unsubscribe = onSnapshot(
      notifRef,
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((snap) => {
          list.push({
            id: snap.id,
            ...(snap.data() as Omit<AppNotification, 'id'>),
          });
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Listen for FCM foreground messages
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribeFCM = listenForegroundFCM((payload) => {
      triggerPushNotification(payload.title, { body: payload.body });
    });
    return () => unsubscribeFCM();
  }, [currentUser]);

  // Automated Upcoming Event Detector (Scans every 20 seconds)
  useEffect(() => {
    if (!currentUser || events.length === 0) return;

    const checkUpcomingEvents = () => {
      const nowMs = Date.now();
      const fifteenMinutesMs = 15 * 60 * 1000;

      for (const ev of events) {
        if (!ev.start) continue;
        const eventStartMs = new Date(ev.start).getTime();
        if (isNaN(eventStartMs)) continue;

        const diffMs = eventStartMs - nowMs;

        // If event is starting in 0 to 15 minutes
        if (diffMs > 0 && diffMs <= fifteenMinutesMs) {
          const key = `${ev.id}_15m_${ev.start}`;
          if (!notifiedEventsRef.current.has(key)) {
            notifiedEventsRef.current.add(key);
            const minutesLeft = Math.max(1, Math.round(diffMs / 60000));
            const timeStr = new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const title = `⏰ Evento próximo: "${ev.title}"`;
            const body = `Comienza en ${minutesLeft} minuto${minutesLeft > 1 ? 's' : ''} (${timeStr})${
              ev.location ? ` en ${ev.location}` : ''
            }.`;

            // Trigger system push notification via FCM / Web Notification
            triggerPushNotification(title, { body });

            // Persist to user's notifications in Firestore
            notifyEventChange(title, body, ev.id, 'upcoming_event');
          }
        }
      }
    };

    checkUpcomingEvents();
    const interval = setInterval(checkUpcomingEvents, 20000);
    return () => clearInterval(interval);
  }, [currentUser, events]);

  const enableNotifications = async () => {
    if (!currentUser) return { success: false, error: 'Inicia sesión primero.' };
    const res = await initializeFCM(currentUser.uid);
    if (res.success) {
      setFcmEnabled(true);
      await notifyEventChange(
        '🔔 Notificaciones Push Activadas',
        'Firebase Cloud Messaging está configurado. Recibirás avisos antes de tus eventos.',
        undefined,
        'event_updated'
      );
    }
    return res;
  };

  const notifyEventChange = async (
    title: string,
    body: string,
    eventId?: string,
    type: AppNotification['type'] = 'event_updated'
  ) => {
    if (!currentUser) return;
    const notifId = 'notif_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const path = `users/${currentUser.uid}/notifications/${notifId}`;
    const nowISO = new Date().toISOString();

    const notifDoc: AppNotification = {
      id: notifId,
      title: title.slice(0, 200),
      body: body.slice(0, 1000),
      type,
      eventId: eventId ? eventId.slice(0, 128) : undefined,
      read: false,
      userId: currentUser.uid,
      createdAt: nowISO,
    };

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'notifications', notifId);
      await setDoc(docRef, notifDoc);
      // Trigger system push notification banner as well
      await triggerPushNotification(title, { body });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const markAsRead = async (id: string) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}/notifications/${id}`;
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach((n) => {
      if (!n.read) {
        const docRef = doc(db, 'users', currentUser.uid, 'notifications', n.id);
        batch.update(docRef, { read: true });
      }
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}/notifications`);
    }
  };

  const clearNotifications = async () => {
    if (!currentUser || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.slice(0, 400).forEach((n) => {
      const docRef = doc(db, 'users', currentUser.uid, 'notifications', n.id);
      batch.delete(docRef);
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${currentUser.uid}/notifications`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fcmEnabled,
        enableNotifications,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        notifyEventChange,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
