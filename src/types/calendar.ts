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
  bgClass: string;
}

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 'work', name: 'Trabajo', color: '#6366f1', bgClass: 'bg-indigo-500' },
  { id: 'personal', name: 'Personal', color: '#10b981', bgClass: 'bg-emerald-500' },
  { id: 'study', name: 'Estudio', color: '#f59e0b', bgClass: 'bg-amber-500' },
  { id: 'health', name: 'Salud & Deporte', color: '#ec4899', bgClass: 'bg-pink-500' },
  { id: 'finance', name: 'Finanzas', color: '#8b5cf6', bgClass: 'bg-purple-500' },
  { id: 'important', name: 'Urgente', color: '#ef4444', bgClass: 'bg-red-500' },
];
