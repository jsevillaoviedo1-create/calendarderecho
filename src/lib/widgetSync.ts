import { Preferences } from '@capacitor/preferences';
import { CalendarEventItem, AgendaTaskItem } from '../types/calendar';

export interface WidgetPayload {
  updatedAt: string;
  todayDate: string;
  todayFormatted: string;
  tasks: Array<{
    id: string;
    title: string;
    subject: string;
    completed: boolean;
    priority?: string;
    time: string;
    date: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    date: string;
    startTime: string;
    location: string;
    category: string;
    color: string;
  }>;
  followingDays: Array<{
    date: string;
    dayLabel: string;
    tasksCount: number;
    eventsCount: number;
    items: Array<{
      type: 'task' | 'event';
      title: string;
      subtitle: string;
      time: string;
      completed?: boolean;
    }>;
  }>;
}

/**
 * Synchronizes Calendar events and Agenda tasks to native shared storage
 * (Android SharedPreferences and iOS UserDefaults via Capacitor Preferences).
 * This allows native home screen widgets (Android Glance / RemoteViews and iOS WidgetKit)
 * to instantly render today's tasks and upcoming days offline.
 */
export async function syncWidgetData(events: CalendarEventItem[], tasks: AgendaTaskItem[]): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Filter today's tasks
    const todayTasks = tasks.filter((t) => t.date === today);

    // 2. Filter upcoming events (starting from today)
    const upcomingEvents = events.filter((e) => {
      const eventDate = e.start.split('T')[0];
      return eventDate >= today;
    });

    // 3. Prepare following 7 days feed for interactive multi-day widget display
    const followingDays = [];
    const baseDate = new Date();

    for (let i = 0; i < 7; i++) {
      const iter = new Date(baseDate);
      iter.setDate(baseDate.getDate() + i);
      const dateStr = iter.toISOString().split('T')[0];

      let dayLabel = iter.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      if (i === 0) dayLabel = 'Hoy';
      else if (i === 1) dayLabel = 'Mañana';
      else if (i === 2) dayLabel = 'Pasado mañana';

      const dayT = tasks.filter((t) => t.date === dateStr);
      const dayE = events.filter((e) => e.start.startsWith(dateStr));

      const items: Array<{
        type: 'task' | 'event';
        title: string;
        subtitle: string;
        time: string;
        completed?: boolean;
      }> = [
        ...dayT.map((t) => ({
          type: 'task' as const,
          title: t.title,
          subtitle: t.subject || 'Tarea de estudio',
          time: t.time || '',
          completed: t.completed,
        })),
        ...dayE.map((e) => ({
          type: 'event' as const,
          title: e.title,
          subtitle: e.category || 'Calendario',
          time: e.allDay ? 'Todo el día' : (e.start.includes('T') ? e.start.split('T')[1].substring(0, 5) : ''),
          completed: false,
        })),
      ];

      followingDays.push({
        date: dateStr,
        dayLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
        tasksCount: dayT.length,
        eventsCount: dayE.length,
        items,
      });
    }

    const payload: WidgetPayload = {
      updatedAt: new Date().toISOString(),
      todayDate: today,
      todayFormatted: new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      tasks: todayTasks.map((t) => ({
        id: t.id,
        title: t.title,
        subject: t.subject || 'Tarea',
        completed: t.completed,
        priority: t.priority,
        time: t.time || '',
        date: t.date,
      })),
      events: upcomingEvents.slice(0, 20).map((e) => ({
        id: e.id,
        title: e.title,
        date: e.start.split('T')[0],
        startTime: e.allDay ? 'Todo el día' : (e.start.includes('T') ? e.start.split('T')[1].substring(0, 5) : ''),
        location: e.location || '',
        category: e.category || 'General',
        color: e.color || '#3b82f6',
      })),
      followingDays,
    };

    const jsonString = JSON.stringify(payload);

    // Write to Capacitor Preferences (syncs to SharedPreferences on Android and UserDefaults on iOS)
    await Preferences.set({
      key: 'widget_data',
      value: jsonString,
    });

    await Preferences.set({
      key: 'widget_today_tasks',
      value: JSON.stringify(payload.tasks),
    });

    await Preferences.set({
      key: 'widget_calendar_events',
      value: JSON.stringify(payload.events),
    });

    // Fallback for Web / PWA
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('widget_data', jsonString);
      localStorage.setItem('widget_today_tasks', JSON.stringify(payload.tasks));
      localStorage.setItem('widget_calendar_events', JSON.stringify(payload.events));
    }
  } catch (error) {
    console.error('Failed to sync widget data:', error);
  }
}
