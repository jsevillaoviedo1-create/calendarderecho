import React, { useRef, useMemo, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useCalendar } from '../context/CalendarContext';
import { CalendarEventItem, DEFAULT_CATEGORIES } from '../types/calendar';
import { DayPreviewPopup } from './DayPreviewPopup';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle,
  Filter,
  Camera,
} from 'lucide-react';

interface CalendarViewProps {
  onSelectDate: (dateStr: string, allDay: boolean) => void;
  onSelectEvent: (event: CalendarEventItem) => void;
  onOpenCategoryManager?: () => void;
  onOpenImageScanner?: () => void;
  onOpenNewTask?: (dateStr: string) => void;
  navigateToDate?: string | null;
}

export function CalendarView({
  onSelectDate,
  onSelectEvent,
  onOpenCategoryManager,
  onOpenImageScanner,
  onOpenNewTask,
  navigateToDate,
}: CalendarViewProps) {
  const { filteredEvents, updateEvent, selectedCategory, setSelectedCategory, allCategories, loading } = useCalendar();
  const calendarRef = useRef<FullCalendar | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [previewDate, setPreviewDate] = useState<string | null>(null);

  // Navigate to target date when triggered from search or widget
  useEffect(() => {
    if (navigateToDate && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(navigateToDate);
    }
  }, [navigateToDate]);

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

  // 1-Second Desktop Hover & Mobile Long-Press Day Preview Pop-up
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let hoverTimer: any = null;
    let hoveredDate: string | null = null;
    let touchTimer: any = null;
    let touchStartX = 0;
    let touchStartY = 0;

    const extractDateFromEl = (target: HTMLElement | null): string | null => {
      if (!target) return null;

      // 1. Check data-date attribute on day cell
      const dayEl = target.closest('[data-date]') as HTMLElement | null;
      if (dayEl && dayEl.dataset.date) {
        return dayEl.dataset.date;
      }

      // 2. Check if hovering/touching an event element
      const eventEl = target.closest('.fc-event') as HTMLElement | null;
      if (eventEl) {
        const parentDay = eventEl.closest('[data-date]') as HTMLElement | null;
        if (parentDay?.dataset?.date) return parentDay.dataset.date;
      }

      return null;
    };

    // Desktop hover: exactly 1 second (1000ms) uninterrupted delay
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const dateStr = extractDateFromEl(target);

      if (!dateStr) {
        if (hoveredDate) {
          clearTimeout(hoverTimer);
          hoveredDate = null;
        }
        return;
      }

      // If moving inside the same day cell or event, keep existing timer running!
      if (hoveredDate === dateStr) {
        return;
      }

      clearTimeout(hoverTimer);
      hoveredDate = dateStr;
      hoverTimer = setTimeout(() => {
        setPreviewDate(dateStr);
      }, 1000);
    };

    const handleMouseLeave = () => {
      clearTimeout(hoverTimer);
      hoveredDate = null;
    };

    // Mobile touch: long press (touch & hold for 500ms with haptic vibration)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      const target = e.target as HTMLElement;
      const dateStr = extractDateFromEl(target);
      if (!dateStr) return;

      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([35, 45, 35]);
          } catch {}
        }
        setPreviewDate(dateStr);
      }, 500);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchTimer) return;
      const touch = e.touches[0];
      const diffX = Math.abs(touch.clientX - touchStartX);
      const diffY = Math.abs(touch.clientY - touchStartY);
      if (diffX > 10 || diffY > 10) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    };

    const handleTouchEnd = () => {
      clearTimeout(touchTimer);
      touchTimer = null;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      clearTimeout(hoverTimer);
      clearTimeout(touchTimer);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

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
      {/* Category filter strip + quick stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-black border border-yellow-500/25 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm'
                : 'bg-neutral-900 text-yellow-400/80 border-neutral-800 hover:text-white'
            }`}
          >
            Todas ({filteredEvents.length})
          </button>

          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                selectedCategory === cat.name
                  ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm'
                  : 'bg-neutral-900 text-slate-300 border-neutral-800 hover:text-white'
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
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer bg-neutral-900 hover:bg-neutral-800 text-yellow-400 hover:text-yellow-300 border border-yellow-500/30"
            >
              <span>+ Categoría</span>
            </button>
          )}
        </div>

        {/* Quick stats badge */}
        <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400 self-end sm:self-center">
          <div className="flex items-center gap-1 bg-neutral-900 px-2.5 py-1 rounded-lg border border-yellow-500/20">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            <span>Hoy: <strong className="text-white">{stats.today}</strong></span>
          </div>
          <div className="flex items-center gap-1 bg-neutral-900 px-2.5 py-1 rounded-lg border border-yellow-500/20">
            <CalendarIcon className="w-3.5 h-3.5 text-yellow-400" />
            <span>Total: <strong className="text-white">{stats.total}</strong></span>
          </div>
        </div>
      </div>

      {/* Main FullCalendar Card */}
      <div className="bg-black border border-yellow-500/30 rounded-2xl p-4 sm:p-6 shadow-xl shadow-black/80 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="flex items-center gap-2.5 text-yellow-400 text-sm font-semibold bg-neutral-900 px-4 py-2 rounded-xl border border-yellow-500/30 shadow-lg">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <span>Sincronizando con Firestore...</span>
            </div>
          </div>
        )}

        {/* Calendar custom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-yellow-400 hover:text-yellow-300 border border-yellow-500/30 transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <div className="flex items-center bg-neutral-900 rounded-xl border border-yellow-500/20 p-0.5">
              <button
                onClick={handlePrev}
                aria-label="Mes anterior"
                className="p-1 text-yellow-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Mes siguiente"
                className="p-1 text-yellow-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {onOpenImageScanner && (
              <button
                onClick={onOpenImageScanner}
                title="Pegar o subir foto de un horario o cuadrante para añadirlo con IA"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-yellow-500/40 text-yellow-400 hover:text-yellow-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-yellow-400" />
                <span>Pegar Horario (Foto)</span>
              </button>
            )}
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

        {/* FullCalendar Component wrapped with containerRef for 1s hover and mobile long-press detection */}
        <div ref={containerRef} className="chronos-calendar-container select-none">
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
            eventMouseEnter={(info: any) => {
              const d = info.event.startStr ? info.event.startStr.split('T')[0] : null;
              if (d) {
                const timer = setTimeout(() => {
                  setPreviewDate(d);
                }, 1000);
                (info.el as any)._previewTimer = timer;
              }
            }}
            eventMouseLeave={(info: any) => {
              if ((info.el as any)._previewTimer) {
                clearTimeout((info.el as any)._previewTimer);
              }
            }}
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

      {/* Day Preview Pop-up on 1s hover or mobile touch-and-hold */}
      <DayPreviewPopup
        isOpen={Boolean(previewDate)}
        dateStr={previewDate}
        onClose={() => setPreviewDate(null)}
        onSelectEvent={onSelectEvent}
        onOpenNewEvent={(dateStr) => onSelectDate(dateStr, false)}
        onOpenNewTask={(dateStr) => {
          if (onOpenNewTask) {
            onOpenNewTask(dateStr);
          } else {
            onSelectDate(dateStr, false);
          }
        }}
      />
    </div>
  );
}
