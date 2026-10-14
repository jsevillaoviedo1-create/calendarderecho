import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
import {
  CalendarEventItem,
  CategoryOption,
  CustomCategoryItem,
  DEFAULT_CATEGORIES,
} from '../types/calendar';

interface CalendarContextType {
  events: CalendarEventItem[];
  filteredEvents: CalendarEventItem[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  customCategories: CustomCategoryItem[];
  allCategories: CategoryOption[];
  createCustomCategory: (name: string, color: string) => Promise<string>;
  deleteCustomCategory: (id: string) => Promise<void>;
  createEvent: (data: Omit<CalendarEventItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEvent: (id: string, updates: Partial<CalendarEventItem>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  importEventsBatch: (newEvents: CalendarEventItem[]) => Promise<number>;
  clearAllEvents: () => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Firestore real-time listener for user-isolated events
  useEffect(() => {
    if (!currentUser) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const eventsPath = `users/${currentUser.uid}/events`;
    const eventsRef = collection(db, 'users', currentUser.uid, 'events');

    const unsubscribe = onSnapshot(
      eventsRef,
      (snapshot) => {
        const items: CalendarEventItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<CalendarEventItem, 'id'>),
          });
        });
        setEvents(items);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, eventsPath);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Firestore real-time listener for user custom categories
  useEffect(() => {
    if (!currentUser) {
      setCustomCategories([]);
      return;
    }

    const catPath = `users/${currentUser.uid}/categories`;
    const catRef = collection(db, 'users', currentUser.uid, 'categories');

    const unsubscribe = onSnapshot(
      catRef,
      (snapshot) => {
        const items: CustomCategoryItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<CustomCategoryItem, 'id'>),
          });
        });
        setCustomCategories(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, catPath);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Combined categories list (default preset categories + user custom categories)
  const allCategories = useMemo(() => {
    const customs: CategoryOption[] = customCategories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      isCustom: true,
    }));
    return [...DEFAULT_CATEGORIES, ...customs];
  }, [customCategories]);

  // Clean and sanitize string helpers
  const sanitize = (str: string | undefined, max: number) => {
    if (!str) return undefined;
    return str.trim().slice(0, max);
  };

  const createCustomCategory = async (name: string, color: string): Promise<string> => {
    if (!currentUser) throw new Error('No estás autenticado.');

    const catId = 'cat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const catPath = `users/${currentUser.uid}/categories/${catId}`;
    const nowISO = new Date().toISOString();

    const payload: CustomCategoryItem = {
      id: catId,
      name: name.trim().slice(0, 50),
      color: color.trim().slice(0, 32) || '#6366f1',
      userId: currentUser.uid,
      createdAt: nowISO,
    };

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'categories', catId);
      await setDoc(docRef, payload);
      return catId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, catPath);
    }
  };

  const deleteCustomCategory = async (id: string): Promise<void> => {
    if (!currentUser) throw new Error('No estás autenticado.');

    const catPath = `users/${currentUser.uid}/categories/${id}`;
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'categories', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, catPath);
    }
  };

  const createEvent = async (
    data: Omit<CalendarEventItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('No estás autenticado.');

    const eventId = 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const eventPath = `users/${currentUser.uid}/events/${eventId}`;
    const nowISO = new Date().toISOString();

    const payload: CalendarEventItem = {
      id: eventId,
      title: data.title.trim().slice(0, 200) || 'Nuevo Evento',
      start: data.start,
      allDay: Boolean(data.allDay),
      userId: currentUser.uid,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    if (data.description) payload.description = sanitize(data.description, 3000);
    if (data.location) payload.location = sanitize(data.location, 500);
    if (data.end) payload.end = data.end;
    if (data.color) payload.color = sanitize(data.color, 32);
    if (data.category) payload.category = sanitize(data.category, 50);

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'events', eventId);
      await setDoc(docRef, payload);
      return eventId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, eventPath);
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEventItem>): Promise<void> => {
    if (!currentUser) throw new Error('No estás autenticado.');

    const eventPath = `users/${currentUser.uid}/events/${id}`;
    const cleanUpdates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.title !== undefined) cleanUpdates.title = updates.title.trim().slice(0, 200);
    if (updates.start !== undefined) cleanUpdates.start = updates.start;
    if (updates.end !== undefined) cleanUpdates.end = updates.end;
    if (updates.allDay !== undefined) cleanUpdates.allDay = Boolean(updates.allDay);
    if (updates.description !== undefined) cleanUpdates.description = sanitize(updates.description, 3000) || '';
    if (updates.location !== undefined) cleanUpdates.location = sanitize(updates.location, 500) || '';
    if (updates.color !== undefined) cleanUpdates.color = sanitize(updates.color, 32);
    if (updates.category !== undefined) cleanUpdates.category = sanitize(updates.category, 50);

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'events', id);
      await updateDoc(docRef, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, eventPath);
    }
  };

  const deleteEvent = async (id: string): Promise<void> => {
    if (!currentUser) throw new Error('No estás autenticado.');

    const eventPath = `users/${currentUser.uid}/events/${id}`;
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'events', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, eventPath);
    }
  };

  const importEventsBatch = async (newEvents: CalendarEventItem[]): Promise<number> => {
    if (!currentUser) throw new Error('No estás autenticado.');
    if (newEvents.length === 0) return 0;

    let importedCount = 0;
    const chunkSize = 250;

    for (let i = 0; i < newEvents.length; i += chunkSize) {
      const chunk = newEvents.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      for (const ev of chunk) {
        const eventId =
          ev.id && ev.id.startsWith('evt_')
            ? ev.id
            : 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

        const docRef = doc(db, 'users', currentUser.uid, 'events', eventId);
        const nowISO = new Date().toISOString();

        const cleanDoc: Record<string, any> = {
          title: (ev.title || 'Evento importado').trim().slice(0, 200),
          start: ev.start,
          allDay: Boolean(ev.allDay),
          userId: currentUser.uid,
          createdAt: ev.createdAt || nowISO,
          updatedAt: nowISO,
        };

        if (ev.description) cleanDoc.description = sanitize(ev.description, 3000);
        if (ev.location) cleanDoc.location = sanitize(ev.location, 500);
        if (ev.end) cleanDoc.end = ev.end;
        if (ev.color) cleanDoc.color = sanitize(ev.color, 32);
        if (ev.category) cleanDoc.category = sanitize(ev.category, 50);

        batch.set(docRef, cleanDoc);
        importedCount++;
      }

      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}/events`);
      }
    }

    return importedCount;
  };

  const clearAllEvents = async (): Promise<void> => {
    if (!currentUser || events.length === 0) return;
    const batch = writeBatch(db);
    events.slice(0, 450).forEach((ev) => {
      const docRef = doc(db, 'users', currentUser.uid, 'events', ev.id);
      batch.delete(docRef);
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${currentUser.uid}/events`);
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        searchQuery === '' ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || ev.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory]);

  return (
    <CalendarContext.Provider
      value={{
        events,
        filteredEvents,
        loading,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        customCategories,
        allCategories,
        createCustomCategory,
        deleteCustomCategory,
        createEvent,
        updateEvent,
        deleteEvent,
        importEventsBatch,
        clearAllEvents,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}
