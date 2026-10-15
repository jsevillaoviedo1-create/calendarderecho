import React, { useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useCalendar } from '../context/CalendarContext';
import { CalendarEventItem, DEFAULT_CATEGORIES } from '../types/calendar';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle,
  Filter,
} from 'lucide-react';

interface CalendarViewProps {
  onSelectDate: (dateStr: string, allDay: boolean) => void;
  onSelectEvent: (event: CalendarEventItem) => void;
  onOpenCategoryManager?: () => void;
}

export function CalendarView({ onSelectDate, onSelectEvent, onOpenCategoryManager }: CalendarViewProps) {
  const { filteredEvents, updateEvent, selectedCategory, setSelectedCategory, allCategories, loading } = useCalendar();
  const calendarRef = useRef<FullCalendar | null>(null);

  // FullCalendar event source transformation
  const calendarEvents = useMemo(() => {
    return filteredEvents.map((ev) => ({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
      backgroundColor: ev.color || '#6366f1',
      borderColor: ev.color || '#6366f1',
      textColor: '#ffffff',
      extendedProps: {
        description: ev.description,
        location: ev.location,
        category: ev.category,
        createdAt: ev.createdAt,
      },
    }));
  }, [filteredEvents]);

  // Handlers for FullCalendar actions
  const handleDateClick = (arg: { dateStr: string; allDay: boolean }) => {
    onSelectDate(arg.dateStr, arg.allDay);
  };

  const handleEventClick = (clickInfo: any) => {
    const rawId = clickInfo.event.id;
    const found = filteredEvents.find((e) => e.id === rawId);
    if (found) {
      onSelectEvent(found);
    }
  };

  const handleEventDrop = async (dropInfo: any) => {
    const eventId = dropInfo.event.id;
    const newStart = dropInfo.event.start?.toISOString();
    const newEnd = dropInfo.event.end ? dropInfo.event.end.toISOString() : undefined;
    const isAllDay = dropInfo.event.allDay;

    try {
      await updateEvent(eventId, {
        start: isAllDay && newStart ? newStart.split('T')[0] : newStart,
        end: isAllDay && newEnd ? newEnd.split('T')[0] : newEnd,
        allDay: isAllDay,
      });
    } catch (error) {
      dropInfo.revert();
      console.error('Error updating moved event:', error);
    }
  };

  const handleEventResize = async (resizeInfo: any) => {
    const eventId = resizeInfo.event.id;
    const newStart = resizeInfo.event.start?.toISOString();
    const newEnd = resizeInfo.event.end?.toISOString();
    const isAllDay = resizeInfo.event.allDay;

    try {
      await updateEvent(eventId, {
        start: isAllDay && newStart ? newStart.split('T')[0] : newStart,
        end: isAllDay && newEnd ? newEnd.split('T')[0] : newEnd,
        allDay: isAllDay,
      });
    } catch (error) {
      resizeInfo.revert();
      console.error('Error updating resized event:', error);
    }
  };

  // Custom toolbar navigation wrappers
  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };

  const handleChangeView = (viewName: string) => {
    calendarRef.current?.getApi().changeView(viewName);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayCount = filteredEvents.filter((e) => e.start.startsWith(todayStr)).length;
    return {
      total: filteredEvents.length,
      today: todayCount,
    };
  }, [filteredEvents]);

  return (
    <div className="flex flex-col gap-4">
      {/* Category Filter Pills & Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Todas ({filteredEvents.length})
          </button>

          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                selectedCategory === cat.name
                  ? 'bg-slate-800 text-white border-slate-600 shadow-sm ring-1 ring-slate-600'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
            </button>
          ))}

          {onOpenCategoryManager && (
            <button
              onClick={onOpenCategoryManager}
              title="Gestionar y crear categorías personalizadas"
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1 cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30"
            >
              <span>+ Categoría</span>
            </button>
          )}
        </div>

        {/* Quick stats badge */}
        <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400 self-end sm:self-center">
          <div className="flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hoy: <strong className="text-white">{stats.today}</strong></span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60">
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total: <strong className="text-white">{stats.total}</strong></span>
          </div>
        </div>
      </div>

      {/* Main FullCalendar Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="flex items-center gap-2.5 text-indigo-400 text-sm font-semibold bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 shadow-lg">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Sincronizando con Firestore...</span>
            </div>
          </div>
        )}

        {/* Calendar custom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-0.5">
              <button
                onClick={handlePrev}
                aria-label="Mes anterior"
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Mes siguiente"
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => handleChangeView('dayGridMonth')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Mes
            </button>
            <button
              onClick={() => handleChangeView('timeGridWeek')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Semana
            </button>
            <button
              onClick={() => handleChangeView('timeGridDay')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Día
            </button>
            <button
              onClick={() => handleChangeView('listWeek')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Vertical
            </button>
          </div>
        </div>

        {/* FullCalendar Component */}
        <div className="chronos-calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            firstDay={1}
            headerToolbar={{
              left: 'title',
              center: '',
              right: '',
            }}
            locale="es"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            weekends={true}
            events={calendarEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            height="auto"
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              list: 'Vertical',
            }}
            nowIndicator={true}
          />
        </div>
      </div>
    </div>
  );
}
