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
  const [activeView, setActiveView] = useState('dayGridMonth');
  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const isPeekingRef = useRef(false);

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
      backgroundColor: ev.color || '#eab308',
      borderColor: ev.color || '#eab308',
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
    if (isPeekingRef.current) return;
    onSelectDate(arg.dateStr, arg.allDay);
  };

  const handleEventClick = (clickInfo: any) => {
    if (isPeekingRef.current) return;
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
    setActiveView(viewName);
  };

  // 1-Second Desktop (Mouse Click Hold) & Mobile (Touch Hold) Preview Pop-up
  // Pop-up disappears immediately when releasing click or lifting finger!
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let holdTimer: any = null;
    let hoveredDate: string | null = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let isMouseDown = false;

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

    const triggerPreview = (dateStr: string) => {
      isPeekingRef.current = true;
      setPreviewDate(dateStr);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 50, 40]);
        } catch {}
      }
    };

    const closePreviewIfPeeking = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (isPeekingRef.current || previewDate) {
        setPreviewDate(null);
        // Retain isPeekingRef briefly so synthesized click on release doesn't open edit modal
        setTimeout(() => {
          isPeekingRef.current = false;
        }, 300);
      }
    };

    // Desktop: mousedown (hold click 700ms to preview)
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      isMouseDown = true;
      const target = e.target as HTMLElement;
      const dateStr = extractDateFromEl(target);
      if (!dateStr) return;

      hoveredDate = dateStr;
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (isMouseDown) {
          triggerPreview(dateStr);
        }
      }, 700);
    };

    // Desktop: right-click on any day to instantly open Day Preview Popup
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const dateStr = extractDateFromEl(target);
      if (dateStr) {
        e.preventDefault();
        triggerPreview(dateStr);
      }
    };

    // Desktop hover over a day: staying over a cell for 800ms triggers preview
    const handleMouseMove = (e: MouseEvent) => {
      if (previewDate || isPeekingRef.current) return;

      const target = e.target as HTMLElement;
      const dateStr = extractDateFromEl(target);

      // If user is holding mouse button and drags into another day
      if (isMouseDown) {
        if (!dateStr || dateStr !== hoveredDate) {
          if (holdTimer) clearTimeout(holdTimer);
          hoveredDate = dateStr;
          if (dateStr) {
            holdTimer = setTimeout(() => {
              if (isMouseDown) {
                triggerPreview(dateStr);
              }
            }, 700);
          }
        }
        return;
      }

      // If cursor moved away from any day cell
      if (!dateStr) {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        hoveredDate = null;
        return;
      }

      // Cursor moved onto a new day cell
      if (dateStr !== hoveredDate) {
        if (holdTimer) clearTimeout(holdTimer);
        hoveredDate = dateStr;
        holdTimer = setTimeout(() => {
          triggerPreview(dateStr);
        }, 800);
      }
    };

    const handleMouseLeave = () => {
      // If modal is open, leave it open so user can interact!
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      hoveredDate = null;
    };

    // Mobile touchstart: hold finger 750ms to preview
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      const target = e.target as HTMLElement;
      const dateStr = extractDateFromEl(target);
      if (!dateStr) return;

      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        triggerPreview(dateStr);
      }, 750);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!holdTimer) return;
      const touch = e.touches[0];
      const diffX = Math.abs(touch.clientX - touchStartX);
      const diffY = Math.abs(touch.clientY - touchStartY);
      if (diffX > 16 || diffY > 16) {
        if (holdTimer) clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    // Release listeners: clear pending hold timers.
    const handleGlobalRelease = () => {
      isMouseDown = false;
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    // Listeners on calendar container
    container.addEventListener('mousedown', handleMouseDown, { capture: true });
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);

    return () => {
      if (holdTimer) clearTimeout(holdTimer);
      container.removeEventListener('mousedown', handleMouseDown, { capture: true } as any);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
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
      {/* Category filter strip + quick stats with HUD aesthetic */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-zinc-900/95 via-neutral-900/95 to-zinc-900/95 backdrop-blur-2xl border border-yellow-500/40 ring-1 ring-yellow-400/20 p-3 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_24px_rgba(234,179,8,0.1)]">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black border-yellow-400 font-extrabold shadow-sm'
                : 'bg-neutral-800/80 text-yellow-400/80 border-yellow-500/30 hover:text-white hover:bg-neutral-700/80'
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
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black border-yellow-400 font-extrabold shadow-sm'
                  : 'bg-neutral-800/80 text-slate-300 border-neutral-700 hover:text-white hover:bg-neutral-700/80'
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
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer bg-neutral-800/80 hover:bg-neutral-700/80 text-yellow-400 hover:text-white border border-yellow-500/30"
            >
              <span>+ Categoría</span>
            </button>
          )}
        </div>

        {/* Quick stats badge */}
        <div className="flex items-center gap-3 shrink-0 text-xs text-slate-300 self-end sm:self-center">
          <div className="flex items-center gap-1.5 bg-neutral-800/80 px-2.5 py-1 rounded-xl border border-yellow-500/30 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            <span>Hoy: <strong className="text-white">{stats.today}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-800/80 px-2.5 py-1 rounded-xl border border-yellow-500/30 shadow-inner">
            <CalendarIcon className="w-3.5 h-3.5 text-yellow-400" />
            <span>Total: <strong className="text-white">{stats.total}</strong></span>
          </div>
        </div>
      </div>

      {/* Main FullCalendar Card with HUD Aesthetic */}
      <div className="bg-gradient-to-r from-zinc-900/95 via-neutral-900/95 to-zinc-900/95 backdrop-blur-2xl border border-yellow-500/40 ring-1 ring-yellow-400/20 rounded-2xl p-4 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_24px_rgba(234,179,8,0.1)] relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="flex items-center gap-2.5 text-yellow-400 text-sm font-semibold bg-neutral-900 px-4 py-2 rounded-xl border border-yellow-500/30 shadow-lg">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <span>Sincronizando con Firestore...</span>
            </div>
          </div>
        )}

        {/* Calendar custom bar with HUD aesthetic */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-neutral-900/80 hover:bg-neutral-800 text-yellow-400 hover:text-white border border-yellow-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Hoy
            </button>
            <div className="flex items-center bg-neutral-900/80 rounded-xl border border-yellow-500/25 p-0.5 backdrop-blur-sm">
              <button
                onClick={handlePrev}
                aria-label="Mes anterior"
                className="p-1.5 text-yellow-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Mes siguiente"
                className="p-1.5 text-yellow-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {onOpenImageScanner && (
              <button
                onClick={onOpenImageScanner}
                title="Pegar o subir foto de un horario o cuadrante para añadirlo con IA"
                className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-neutral-900/80 hover:bg-neutral-800 border border-yellow-500/40 text-yellow-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-yellow-400" />
                <span>Pegar Horario (Foto)</span>
              </button>
            )}
          </div>

          {/* View Mode Buttons with HUD aesthetic */}
          <div className="flex items-center bg-neutral-900/80 p-1 rounded-xl border border-yellow-500/25 text-xs font-medium backdrop-blur-sm">
            <button
              onClick={() => handleChangeView('dayGridMonth')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === 'dayGridMonth'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold shadow-sm'
                  : 'text-yellow-400/80 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => handleChangeView('timeGridWeek')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === 'timeGridWeek'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold shadow-sm'
                  : 'text-yellow-400/80 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => handleChangeView('timeGridDay')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === 'timeGridDay'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold shadow-sm'
                  : 'text-yellow-400/80 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => handleChangeView('listWeek')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === 'listWeek'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold shadow-sm'
                  : 'text-yellow-400/80 hover:text-white hover:bg-neutral-800'
              }`}
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
