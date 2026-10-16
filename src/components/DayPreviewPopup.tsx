import React, { useMemo, useEffect, useRef } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { useAgenda } from '../context/AgendaContext';
import { CalendarEventItem } from '../types/calendar';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  BookOpen,
  CheckCircle2,
  Circle,
  X,
  ExternalLink,
  Sparkles,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface DayPreviewPopupProps {
  isOpen: boolean;
  dateStr: string | null;
  onClose: () => void;
  onSelectEvent: (event: CalendarEventItem) => void;
  onOpenNewEvent: (dateStr: string) => void;
  onOpenNewTask: (dateStr: string) => void;
}

export function DayPreviewPopup({
  isOpen,
  dateStr,
  onClose,
  onSelectEvent,
  onOpenNewEvent,
  onOpenNewTask,
}: DayPreviewPopupProps) {
  const { events } = useCalendar();
  const { tasks, toggleTaskCompleted } = useAgenda();
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Events for that date
  const dayEvents = useMemo(() => {
    if (!dateStr) return [];
    return events
      .filter((ev) => ev.start.startsWith(dateStr))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events, dateStr]);

  // Tasks for that date
  const dayTasks = useMemo(() => {
    if (!dateStr) return [];
    return tasks.filter((tk) => tk.date === dateStr);
  }, [tasks, dateStr]);

  // Format header
  const formattedHeader = useMemo(() => {
    if (!dateStr) return { weekday: '', fullDate: '', isToday: false };
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const curr = new Date(y, m - 1, d);
      const now = new Date();
      const isToday =
        now.getFullYear() === curr.getFullYear() &&
        now.getMonth() === curr.getMonth() &&
        now.getDate() === curr.getDate();

      const weekday = curr.toLocaleDateString('es-ES', { weekday: 'long' });
      const fullDate = curr.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      return {
        weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
        fullDate,
        isToday,
      };
    } catch {
      return { weekday: 'Día', fullDate: dateStr, isToday: false };
    }
  }, [dateStr]);

  if (!isOpen || !dateStr) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg bg-black border border-yellow-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150 relative text-white"
      >
        {/* Glow ambient effects */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-zinc-950/95 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-black shadow-md shadow-yellow-400/30 shrink-0">
              <CalendarIcon className="w-5 h-5 text-black" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                  {formattedHeader.weekday}
                </h3>
                {formattedHeader.isToday && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-400 text-black shrink-0">
                    HOY
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-500/30 shrink-0 hidden sm:inline">
                  VISTA PREVIA
                </span>
              </div>
              <p className="text-xs text-yellow-300/80 font-medium truncate">
                {formattedHeader.fullDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Cerrar vista previa (Esc)"
            className="text-yellow-400/70 hover:text-white p-2 rounded-xl hover:bg-neutral-900 border border-transparent hover:border-yellow-500/30 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 relative z-10">
          {/* Summary badge row */}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Total en este día:{' '}
              <strong className="text-white">
                {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
              </strong>{' '}
              y{' '}
              <strong className="text-white">
                {dayTasks.length} {dayTasks.length === 1 ? 'tarea' : 'tareas'}
              </strong>
            </span>
          </div>

          {/* Events list */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Eventos del Calendario ({dayEvents.length})</span>
            </div>

            {dayEvents.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
                No hay eventos programados para este día.
              </div>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((ev) => {
                  let timeStr = 'Todo el día';
                  if (!ev.allDay && ev.start) {
                    try {
                      const s = new Date(ev.start);
                      const sh = String(s.getHours()).padStart(2, '0');
                      const sm = String(s.getMinutes()).padStart(2, '0');
                      if (ev.end) {
                        const e = new Date(ev.end);
                        const eh = String(e.getHours()).padStart(2, '0');
                        const em = String(e.getMinutes()).padStart(2, '0');
                        timeStr = `${sh}:${sm} - ${eh}:${em}`;
                      } else {
                        timeStr = `${sh}:${sm}`;
                      }
                    } catch {}
                  }

                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        onClose();
                        onSelectEvent(ev);
                      }}
                      className="group p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: ev.color || '#6366f1' }}
                          />
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                            {ev.title}
                          </h4>
                          {ev.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                              {ev.category}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-semibold text-slate-300">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            <span>{timeStr}</span>
                          </span>
                          {ev.location && (
                            <span className="flex items-center gap-1 text-slate-400 truncate max-w-xs">
                              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                              <span className="truncate">{ev.location}</span>
                            </span>
                          )}
                        </div>

                        {ev.description && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agenda tasks list */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tareas y Asignaturas de la Agenda ({dayTasks.length})</span>
            </div>

            {dayTasks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
                No hay tareas asignadas en la agenda para este día.
              </div>
            ) : (
              <div className="space-y-1.5">
                {dayTasks.map((tk) => (
                  <div
                    key={tk.id}
                    onClick={() => toggleTaskCompleted(tk.id)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      tk.completed
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-400'
                        : 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/40 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        className="shrink-0 text-emerald-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompleted(tk.id);
                        }}
                      >
                        {tk.completed ? (
                          <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-slate-900" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 hover:text-emerald-400" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            tk.completed ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {tk.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {tk.subject && <span className="truncate">{tk.subject}</span>}
                          {tk.time && <span>• {tk.time}</span>}
                        </div>
                      </div>
                    </div>

                    {tk.priority === 'urgente' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">
                        Urgente
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-zinc-950/95 flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewTask(dateStr);
              }}
              className="px-3.5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-yellow-400 border border-yellow-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
              <span>+ Tarea</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewEvent(dateStr);
              }}
              className="px-4 py-2 text-xs font-extrabold bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl shadow-md shadow-yellow-400/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
              <span>+ Evento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
