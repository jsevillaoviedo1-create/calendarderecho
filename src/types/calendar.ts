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

// Initial requested categories: keep 'Trabajo' and add requested ones with distinctive colors
export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 'cat_trabajo', name: 'Trabajo', color: '#3b82f6' },
  { id: 'cat_estudio', name: 'Estudio', color: '#8b5cf6' },
  { id: 'cat_citas_salud', name: 'Citas salud', color: '#10b981' },
  { id: 'cat_autoescuela', name: 'Autoescuela', color: '#f97316' },
  { id: 'cat_gimnasio', name: 'Gimnasio', color: '#ec4899' },
  { id: 'cat_pesca', name: 'Pesca', color: '#06b6d4' },
  { id: 'cat_urgencia', name: 'Urgencia', color: '#ef4444' },
  { id: 'cat_parciales', name: 'Parciales', color: '#a855f7' },
  { id: 'cat_examen_final', name: 'Examen final', color: '#e11d48' },
];

export const SEMESTER_1_SUBJECTS = [
  'Derecho Romano',
  'Historia del Derecho',
  'Derecho Eclesiástico del Estado',
  'Economía y Contabilidad',
  'Teoría del Derecho',
] as const;

export const SEMESTER_2_SUBJECTS = [
  'Derecho Constitucional I',
  'Derecho Civil I',
  'Derecho Penal I',
  'Derecho Internacional Público',
] as const;

export type SemesterType = '1er semestre' | '2o semestre' | 'General';
export type SubjectType = (typeof SEMESTER_1_SUBJECTS)[number] | (typeof SEMESTER_2_SUBJECTS)[number] | string;

export interface AgendaTaskItem {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (opcional)
  semester?: SemesterType;
  subject?: SubjectType;
  completed: boolean;
  completedAt?: string;
  priority?: 'baja' | 'media' | 'alta' | 'urgente';
  userId: string;
  createdAt: string;
  updatedAt?: string;
}
