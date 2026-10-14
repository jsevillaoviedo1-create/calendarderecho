export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO 8601 string
  end?: string;   // ISO 8601 string
  allDay: boolean;
  color?: string;
  category?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  email: string;
  displayName?: string;
  photoURL?: string;
  biometricEnabled?: boolean;
  biometricCredentialId?: string;
  defaultView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  fcmToken?: string;
  notificationsEnabled?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'upcoming_event' | 'event_created' | 'event_updated' | 'ics_imported';
  eventId?: string;
  read: boolean;
  userId: string;
  createdAt: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  color: string;
  isCustom?: boolean;
}

export interface CustomCategoryItem {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
}

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 'work', name: 'Trabajo', color: '#6366f1' },
  { id: 'personal', name: 'Personal', color: '#10b981' },
  { id: 'study', name: 'Estudio', color: '#f59e0b' },
  { id: 'health', name: 'Salud & Deporte', color: '#ec4899' },
  { id: 'finance', name: 'Finanzas', color: '#8b5cf6' },
  { id: 'important', name: 'Urgente', color: '#ef4444' },
];
