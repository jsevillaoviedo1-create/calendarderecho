import ICAL from 'ical.js';
import { CalendarEventItem } from '../types/calendar';

/**
 * Parses an iCalendar (.ics) string using ical.js and converts it to Chronos CalendarEventItem list.
 */
export function parseICS(icsString: string, userId: string): CalendarEventItem[] {
  const events: CalendarEventItem[] = [];

  try {
    const jcalData = ICAL.parse(icsString);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents('vevent');

    const nowISO = new Date().toISOString();

    for (const vevent of vevents) {
      try {
        const event = new ICAL.Event(vevent);
        const title = event.summary || 'Evento sin título';
        const description = event.description || '';
        const location = event.location || '';

        const isAllDay = Boolean(event.startDate?.isDate);
        let startDate: Date;
        let endDate: Date | undefined;

        if (event.startDate) {
          startDate = event.startDate.toJSDate();
        } else {
          startDate = new Date();
        }

        if (event.endDate) {
          endDate = event.endDate.toJSDate();
        } else if (isAllDay) {
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        } else {
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour default
        }

        // Detect category and color automatically from summary/description
        const lower = `${title} ${description}`.toLowerCase();
        let category = 'Trabajo';
        let color = '#6366f1';

        if (lower.includes('cumple') || lower.includes('personal') || lower.includes('fiesta') || lower.includes('cena')) {
          category = 'Personal';
          color = '#10b981';
        } else if (lower.includes('examen') || lower.includes('clase') || lower.includes('curso') || lower.includes('estudio')) {
          category = 'Estudio';
          color = '#f59e0b';
        } else if (lower.includes('gym') || lower.includes('médic') || lower.includes('salud') || lower.includes('entren')) {
          category = 'Salud & Deporte';
          color = '#ec4899';
        } else if (lower.includes('banco') || lower.includes('pago') || lower.includes('factura') || lower.includes('finanz')) {
          category = 'Finanzas';
          color = '#8b5cf6';
        } else if (lower.includes('urgente') || lower.includes('importante') || lower.includes('deadline')) {
          category = 'Urgente';
          color = '#ef4444';
        }

        const safeId = 'ics_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);

        events.push({
          id: safeId,
          title: title.slice(0, 200),
          description: description.slice(0, 3000),
          location: location.slice(0, 500),
          start: isAllDay ? startDate.toISOString().split('T')[0] : startDate.toISOString(),
          end: isAllDay ? (endDate ? endDate.toISOString().split('T')[0] : undefined) : endDate?.toISOString(),
          allDay: isAllDay,
          color,
          category,
          userId,
          createdAt: nowISO,
          updatedAt: nowISO,
        });
      } catch (innerError) {
        console.warn('Skipping unparseable vevent component:', innerError);
      }
    }
  } catch (error) {
    console.error('Failed to parse ICS string with ical.js:', error);
    throw new Error('El archivo no tiene un formato iCalendar (.ics) válido o está dañado.');
  }

  return events;
}

/**
 * Generates an RFC 5545 iCalendar string from a list of CalendarEventItem.
 */
export function exportToICS(events: CalendarEventItem[], calendarName: string = 'Chronos Calendar'): string {
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

  const formatICSDate = (dateStr: string, isAllDay: boolean) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    if (isAllDay) {
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
    }
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  };

  const escapeICSText = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chronos//Calendar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const ev of events) {
    const dtStart = formatICSDate(ev.start, ev.allDay);
    if (!dtStart) continue;

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${ev.id}@chronos.app`);
    ics.push(`DTSTAMP:${formatICSDate(ev.createdAt || new Date().toISOString(), false)}`);
    
    if (ev.allDay) {
      ics.push(`DTSTART;VALUE=DATE:${dtStart}`);
      if (ev.end) {
        ics.push(`DTEND;VALUE=DATE:${formatICSDate(ev.end, true)}`);
      }
    } else {
      ics.push(`DTSTART:${dtStart}`);
      if (ev.end) {
        ics.push(`DTEND:${formatICSDate(ev.end, false)}`);
      }
    }

    ics.push(`SUMMARY:${escapeICSText(ev.title)}`);
    if (ev.description) {
      ics.push(`DESCRIPTION:${escapeICSText(ev.description)}`);
    }
    if (ev.location) {
      ics.push(`LOCATION:${escapeICSText(ev.location)}`);
    }
    if (ev.category) {
      ics.push(`CATEGORIES:${escapeICSText(ev.category)}`);
    }
    ics.push('STATUS:CONFIRMED');
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

/**
 * Triggers a browser download of an .ics file.
 */
export function downloadICS(content: string, filename: string = 'chronos-calendar.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
