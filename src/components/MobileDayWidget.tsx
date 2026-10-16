import React, { useState, useMemo } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { useAgenda } from '../context/AgendaContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Smartphone,
  Check,
  Tag,
  ArrowRight,
  Layers,
  X,
  Download,
  Share,
  HelpCircle,
} from 'lucide-react';

interface MobileDayWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenNewEvent: (prefillDate?: string) => void;
  onOpenNewTask: (prefillDate?: string) => void;
  onNavigateToCalendar?: (dateStr: string) => void;
  isFloatingModal?: boolean;
}

export function MobileDayWidget({
  isOpen = true,
  onClose,
  onOpenNewEvent,
  onOpenNewTask,
  onNavigateToCalendar,
  isFloatingModal = false,
}: MobileDayWidgetProps) {
  const { events, allCategories } = useCalendar();
  const { tasks, toggleTaskCompleted } = useAgenda();
  const { isInstallable, install, isIOS } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Selected date in widget: defaults to today
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Compute 7 days surrounding the selected date for the carousel
  const carouselDays = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    const days = [];

    for (let offset = -3; offset <= 3; offset++) {
      const iter = new Date(curr);
      iter.setDate(curr.getDate() + offset);

      const yr = iter.getFullYear();
      const mo = String(iter.getMonth() + 1).padStart(2, '0');
      const dy = String(iter.getDate()).padStart(2, '0');
      const dateStr = `${yr}-${mo}-${dy}`;

      const dayShort = iter.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
      const dayNum = iter.getDate();
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;

      // Count events and tasks
      const evCount = events.filter((e) => e.start.startsWith(dateStr)).length;
      const tkCount = tasks.filter((t) => t.date === dateStr).length;

      days.push({
        dateStr,
        dayShort,
        dayNum,
        isToday,
        isSelected,
        hasItems: evCount + tkCount > 0,
      });
    }

    return days;
  }, [selectedDate, todayStr, events, tasks]);

  // Navigate day by -1 or +1
  const changeDay = (delta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + delta);
    const yr = curr.getFullYear();
    const mo = String(curr.getMonth() + 1).padStart(2, '0');
    const dy = String(curr.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${dy}`);
  };

  // Events for selected day
  const dayEvents = useMemo(() => {
    return events
      .filter((ev) => ev.start.startsWith(selectedDate))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events, selectedDate]);

  // Agenda tasks for selected day
  const dayTasks = useMemo(() => {
    return tasks.filter((tk) => tk.date === selectedDate);
  }, [tasks, selectedDate]);

  // Format header date
  const headerDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const curr = new Date(y, m - 1, d);
      const weekday = curr.toLocaleDateString('es-ES', { weekday: 'long' });
      const dayMonth = curr.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      return {
        weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
        dayMonth,
        isToday: selectedDate === todayStr,
      };
    } catch {
      return { weekday: 'Día', dayMonth: selectedDate, isToday: false };
    }
  }, [selectedDate, todayStr]);

  if (isFloatingModal && !isOpen) return null;

  const content = (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider uppercase text-indigo-400">
                Widget del Teléfono
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MÓVIL
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-white">
              {headerDate.weekday},{' '}
              <span className="text-slate-300 font-medium">{headerDate.dayMonth}</span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-[11px] font-bold px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer"
            >
              Hoy
            </button>
          )}

          <div className="flex items-center bg-slate-950/70 rounded-xl border border-slate-800 p-0.5">
            <button
              onClick={() => changeDay(-1)}
              title="Día anterior"
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => changeDay(1)}
              title="Día siguiente"
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {isFloatingModal && onClose && (
            <button
              onClick={onClose}
              title="Cerrar widget"
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 7-Days Quick Strip */}
      <div className="grid grid-cols-7 gap-1.5 mb-4 relative z-10">
        {carouselDays.map((d) => (
          <button
            key={d.dateStr}
            type="button"
            onClick={() => setSelectedDate(d.dateStr)}
            className={`py-2 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer relative ${
              d.isSelected
                ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400 scale-102'
                : d.isToday
                ? 'bg-slate-800/90 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-950/50 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
            }`}
          >
            <span className="text-[10px] font-semibold opacity-80">{d.dayShort}</span>
            <span className="text-sm font-extrabold">{d.dayNum}</span>
            {d.hasItems && (
              <span
                className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                  d.isSelected ? 'bg-white' : 'bg-indigo-400'
                }`}
              />
            )}
          </button>
        ))}
      </div>

      {/* THE 2 FUNCTIONAL BUTTONS REQUESTED BY THE USER */}
      <div className="grid grid-cols-2 gap-2.5 mb-4 relative z-10">
        {/* Button 1: Add Event to Calendar */}
        <button
          type="button"
          onClick={() => onOpenNewEvent(selectedDate)}
          className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-400/30"
        >
          <CalendarIcon className="w-4 h-4 shrink-0" />
          <span className="truncate">+ Añadir al Calendario</span>
        </button>

        {/* Button 2: Add Task to Agenda */}
        <button
          type="button"
          onClick={() => onOpenNewTask(selectedDate)}
          className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-400/30"
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">+ Añadir Tarea</span>
        </button>
      </div>

      {/* Feed of what happens that specific day */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-72 pr-0.5 relative z-10">
        {/* Section: Calendar Events for this day */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
            <span className="flex items-center gap-1 text-indigo-400">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Eventos del Calendario ({dayEvents.length})</span>
            </span>
            {onNavigateToCalendar && (
              <button
                onClick={() => onNavigateToCalendar(selectedDate)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Ver calendario</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {dayEvents.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
              Sin eventos para este día
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
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex items-start gap-2.5"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 shadow-sm"
                      style={{ backgroundColor: ev.color || '#6366f1' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-white truncate">{ev.title}</h5>
                        {ev.category && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300 shrink-0">
                            {ev.category}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          <span>{timeStr}</span>
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1 text-slate-400 truncate">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </span>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Agenda Tasks for this day */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
            <span className="flex items-center gap-1 text-emerald-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tareas y Asignaturas de la Agenda ({dayTasks.length})</span>
            </span>
          </div>

          {dayTasks.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
              Sin tareas pendientes en la agenda para este día
            </div>
          ) : (
            <div className="space-y-1.5">
              {dayTasks.map((tk) => (
                <div
                  key={tk.id}
                  onClick={() => toggleTaskCompleted(tk.id)}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
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

      {/* Phone Widget Installation Drawer & Instructions */}
      <div className="pt-3 border-t border-slate-800/80 mt-2 relative z-10">
        <button
          type="button"
          onClick={() => {
            if (isInstallable) {
              install();
            } else {
              setShowInstallGuide(!showInstallGuide);
            }
          }}
          className="w-full py-2 px-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Añadir este Widget al Teléfono</span>
          </span>
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
            {isInstallable ? 'Instalar' : showInstallGuide ? 'Ocultar' : 'Ver cómo'}
          </span>
        </button>

        {showInstallGuide && (
          <div className="mt-2.5 p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                1
              </span>
              <p className="text-[11px]">
                {isIOS ? (
                  <>En Safari en tu iPhone, pulsa el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) y selecciona <strong>"Añadir a la pantalla de inicio"</strong>.</>
                ) : (
                  <>En Chrome en tu Android, pulsa los <strong>3 puntos (⋮)</strong> y selecciona <strong>"Añadir a pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong>.</>
                )}
              </p>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                2
              </span>
              <p className="text-[11px]">
                Al mantener pulsado el icono en tu pantalla tendrás accesos directos para <strong>+ Añadir al Calendario</strong> y <strong>+ Añadir Tarea</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isFloatingModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-md max-h-[92vh] overflow-hidden">{content}</div>
      </div>
    );
  }

  return content;
}
