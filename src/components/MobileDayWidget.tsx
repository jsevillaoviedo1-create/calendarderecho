import React, { useState, useMemo, useRef } from 'react';
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
  CalendarDays,
  Flame,
  ArrowDownCircle,
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
  const { events } = useCalendar();
  const { tasks, toggleTaskCompleted } = useAgenda();
  const { isInstallable, install, isIOS } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [daysWindow, setDaysWindow] = useState(7); // How many subsequent days to render
  const containerRef = useRef<HTMLDivElement>(null);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Quick 7-day strip (Starts today, or -1 to +5)
  const quickDays = useMemo(() => {
    const days = [];
    const base = new Date();

    for (let i = 0; i < 7; i++) {
      const iter = new Date(base);
      iter.setDate(base.getDate() + i);

      const yr = iter.getFullYear();
      const mo = String(iter.getMonth() + 1).padStart(2, '0');
      const dy = String(iter.getDate()).padStart(2, '0');
      const dateStr = `${yr}-${mo}-${dy}`;

      const dayShort = iter.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
      const dayNum = iter.getDate();
      const isToday = i === 0;
      const isSelected = dateStr === selectedDate;

      const evCount = events.filter((e) => e.start.startsWith(dateStr)).length;
      const tkCount = tasks.filter((t) => t.date === dateStr).length;

      days.push({
        dateStr,
        dayShort,
        dayNum,
        isToday,
        isSelected,
        hasItems: evCount + tkCount > 0,
        itemCount: evCount + tkCount,
      });
    }
    return days;
  }, [selectedDate, events, tasks]);

  // Generate continuous list of days (Today + following days) for the scrollable feed
  const feedDays = useMemo(() => {
    const days = [];
    const base = new Date();

    for (let offset = 0; offset < daysWindow; offset++) {
      const iter = new Date(base);
      iter.setDate(base.getDate() + offset);

      const yr = iter.getFullYear();
      const mo = String(iter.getMonth() + 1).padStart(2, '0');
      const dy = String(iter.getDate()).padStart(2, '0');
      const dateStr = `${yr}-${mo}-${dy}`;

      const isToday = offset === 0;
      const isTomorrow = offset === 1;
      const isDayAfter = offset === 2;

      let label = iter.toLocaleDateString('es-ES', { weekday: 'long' });
      label = label.charAt(0).toUpperCase() + label.slice(1);

      let badge = '';
      if (isToday) badge = 'HOY';
      else if (isTomorrow) badge = 'MAÑANA';
      else if (isDayAfter) badge = 'PASADO MAÑANA';

      const fullDate = iter.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      });

      const dayEvents = events
        .filter((ev) => ev.start.startsWith(dateStr))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      const dayTasks = tasks.filter((tk) => tk.date === dateStr);

      const completedTasks = dayTasks.filter((t) => t.completed).length;

      days.push({
        dateStr,
        label,
        badge,
        fullDate,
        isToday,
        dayEvents,
        dayTasks,
        completedTasks,
        totalTasks: dayTasks.length,
      });
    }

    return days;
  }, [daysWindow, events, tasks]);

  // Today's summary stats
  const todayTasks = useMemo(() => tasks.filter((t) => t.date === todayStr), [tasks, todayStr]);
  const todayCompleted = useMemo(() => todayTasks.filter((t) => t.completed).length, [todayTasks]);
  const todayProgress = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

  // Scroll to a specific day in the feed
  const scrollToDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    const targetEl = document.getElementById(`widget-day-${dateStr}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isFloatingModal && !isOpen) return null;

  const content = (
    <div
      ref={containerRef}
      className="w-full bg-gradient-to-b from-neutral-900/98 via-zinc-900/98 to-neutral-900/98 border border-yellow-500/40 ring-1 ring-yellow-400/20 rounded-3xl p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_30px_rgba(234,179,8,0.15)] relative overflow-hidden flex flex-col text-white backdrop-blur-2xl"
    >
      {/* Glow ambient effects */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-yellow-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header with HUD aesthetic */}
      <div className="flex items-center justify-between pb-3.5 border-b border-yellow-500/25 mb-3.5 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 flex items-center justify-center text-black shadow-md shadow-yellow-400/35 shrink-0">
            <Smartphone className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-yellow-400">
                Widget Móvil
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-500/35">
                PANTALLA DE INICIO
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-white truncate">
              Tareas de Hoy y Días Siguientes
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInstallable && (
            <button
              onClick={() => install()}
              className="px-2.5 py-1 rounded-xl bg-yellow-400 text-black font-extrabold text-[11px] shadow-sm hover:bg-yellow-300 transition-all flex items-center gap-1 cursor-pointer"
              title="Instalar en pantalla de inicio"
            >
              <Download className="w-3 h-3 stroke-[2.5]" />
              <span className="hidden sm:inline">Instalar</span>
            </button>
          )}

          {isFloatingModal && onClose && (
            <button
              onClick={onClose}
              title="Cerrar widget"
              className="p-1.5 text-yellow-400/70 hover:text-white rounded-xl hover:bg-neutral-800 border border-transparent hover:border-yellow-500/30 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Today's Quick Progress Bar Card */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-neutral-950/70 border border-yellow-500/30 mb-3.5 shadow-inner relative z-10">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-slate-200">
              Progreso de Hoy:{' '}
              <strong className="text-yellow-400">
                {todayCompleted} de {todayTasks.length} tareas
              </strong>
            </span>
          </div>
          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-300 border border-yellow-500/30">
            {todayProgress}%
          </span>
        </div>

        {/* Progress track */}
        <div className="w-full h-2 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]"
            style={{ width: `${Math.max(todayProgress, todayTasks.length > 0 ? 5 : 0)}%` }}
          />
        </div>
      </div>

      {/* 7-Day Quick Strip Switcher */}
      <div className="grid grid-cols-7 gap-1.5 mb-3.5 relative z-10">
        {quickDays.map((d) => (
          <button
            key={d.dateStr}
            type="button"
            onClick={() => scrollToDay(d.dateStr)}
            className={`py-2 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer relative ${
              d.isSelected
                ? 'bg-gradient-to-b from-yellow-400 to-amber-500 text-black font-extrabold shadow-md shadow-yellow-400/30 ring-2 ring-yellow-300 scale-102'
                : d.isToday
                ? 'bg-neutral-800/90 text-yellow-300 border border-yellow-500/40'
                : 'bg-neutral-950/60 hover:bg-neutral-800/60 text-slate-300 hover:text-white border border-yellow-500/20'
            }`}
          >
            <span className="text-[10px] font-semibold opacity-90">{d.dayShort}</span>
            <span className="text-xs sm:text-sm font-extrabold">{d.dayNum}</span>
            {d.hasItems && (
              <span
                className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                  d.isSelected ? 'bg-black' : 'bg-yellow-400'
                }`}
              />
            )}
          </button>
        ))}
      </div>

      {/* 2 Quick Action Buttons with HUD aesthetic */}
      <div className="grid grid-cols-2 gap-2 mb-3.5 relative z-10">
        <button
          type="button"
          onClick={() => onOpenNewTask(selectedDate)}
          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-md shadow-yellow-400/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span className="truncate">+ Añadir Tarea</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenNewEvent(selectedDate)}
          className="py-2.5 px-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-yellow-300 hover:text-white border border-yellow-500/35 font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CalendarIcon className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="truncate">+ Añadir al Calendario</span>
        </button>
      </div>

      {/* Continuous Scroll Downward Feed: Today + Following Days */}
      <div className="flex-1 overflow-y-auto space-y-4 max-h-[55vh] sm:max-h-[60vh] pr-1 custom-scrollbar relative z-10">
        <div className="flex items-center justify-between text-[11px] font-bold text-yellow-400/90 uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5">
            <ArrowDownCircle className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
            <span>Desplaza hacia abajo para ver siguientes días</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            {feedDays.length} días cargados
          </span>
        </div>

        {feedDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;

          return (
            <div
              key={day.dateStr}
              id={`widget-day-${day.dateStr}`}
              className={`p-3.5 rounded-2xl border transition-all ${
                day.isToday
                  ? 'bg-neutral-950/80 border-yellow-500/40 ring-1 ring-yellow-400/20 shadow-md'
                  : isSelected
                  ? 'bg-neutral-950/70 border-yellow-500/35'
                  : 'bg-neutral-950/50 border-neutral-800/80 hover:border-yellow-500/30'
              }`}
            >
              {/* Day Header Row */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {day.label}
                  </span>
                  <span className="text-xs text-yellow-400/80 font-medium">
                    {day.fullDate}
                  </span>
                  {day.badge && (
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        day.isToday
                          ? 'bg-yellow-400 text-black'
                          : 'bg-yellow-400/20 text-yellow-300 border border-yellow-500/30'
                      }`}
                    >
                      {day.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenNewTask(day.dateStr)}
                    className="p-1 rounded-lg text-yellow-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                    title={`Añadir tarea a ${day.label}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {onNavigateToCalendar && (
                    <button
                      type="button"
                      onClick={() => onNavigateToCalendar(day.dateStr)}
                      className="text-[10px] text-yellow-400/80 hover:text-white flex items-center gap-0.5 cursor-pointer ml-1"
                      title="Ver en vista de calendario"
                    >
                      <span>Ver día</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Day Tasks List */}
              <div className="space-y-1.5 mb-2.5">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-yellow-400/90 px-0.5">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-yellow-400" />
                    <span>Tareas ({day.dayTasks.length})</span>
                  </span>
                  {day.dayTasks.length > 0 && (
                    <span className="text-slate-400">
                      {day.completedTasks}/{day.dayTasks.length} listas
                    </span>
                  )}
                </div>

                {day.dayTasks.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-800/60 text-center text-[11px] text-slate-400">
                    Sin tareas programadas para este día
                  </div>
                ) : (
                  day.dayTasks.map((tk) => (
                    <div
                      key={tk.id}
                      onClick={() => toggleTaskCompleted(tk.id)}
                      className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                        tk.completed
                          ? 'bg-neutral-900/40 border-emerald-500/25 text-slate-400'
                          : 'bg-neutral-900/80 border-yellow-500/25 hover:border-yellow-400/50 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          className="shrink-0 text-yellow-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompleted(tk.id);
                          }}
                        >
                          {tk.completed ? (
                            <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-black" />
                          ) : (
                            <Circle className="w-4 h-4 text-yellow-400/70 hover:text-yellow-400" />
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
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                            {tk.subject && (
                              <span className="text-yellow-400/80 truncate font-medium">
                                {tk.subject}
                              </span>
                            )}
                            {tk.time && <span>• {tk.time}</span>}
                          </div>
                        </div>
                      </div>

                      {tk.priority === 'urgente' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/35 shrink-0">
                          Urgente
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Day Events List */}
              {day.dayEvents.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-neutral-800/60">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-yellow-400/90 px-0.5 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3 text-yellow-400" />
                    <span>Eventos del Calendario ({day.dayEvents.length})</span>
                  </div>

                  {day.dayEvents.map((ev) => {
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
                        className="p-2 rounded-xl bg-neutral-900/60 border border-yellow-500/20 flex items-start gap-2"
                      >
                        <span
                          className="w-2 h-2 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: ev.color || '#eab308' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <h5 className="text-[11px] font-bold text-white truncate">
                              {ev.title}
                            </h5>
                            {ev.category && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-neutral-950 text-yellow-300 border border-yellow-500/25 shrink-0">
                                {ev.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1 text-yellow-400/90 font-medium">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{timeStr}</span>
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1 truncate text-slate-400">
                                <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                <span className="truncate">{ev.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Load more days button */}
        <div className="pt-2 pb-1 text-center">
          <button
            type="button"
            onClick={() => setDaysWindow((prev) => prev + 7)}
            className="px-4 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-yellow-300 hover:text-white border border-yellow-500/35 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <ArrowDownCircle className="w-3.5 h-3.5 text-yellow-400" />
            <span>Cargar más días siguientes</span>
          </button>
        </div>
      </div>

      {/* Phone Widget Installation Instructions Drawer */}
      <div className="pt-3 border-t border-yellow-500/20 mt-3 relative z-10">
        <button
          type="button"
          onClick={() => {
            if (isInstallable) {
              install();
            } else {
              setShowInstallGuide(!showInstallGuide);
            }
          }}
          className="w-full py-2 px-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-yellow-500/30 text-xs font-semibold text-yellow-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer shadow-inner"
        >
          <span className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-yellow-400" />
            <span>Poner este Widget en la Pantalla de Inicio del Teléfono</span>
          </span>
          <span className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-wider">
            {isInstallable ? 'Instalar' : showInstallGuide ? 'Ocultar' : 'Ver cómo'}
          </span>
        </button>

        {showInstallGuide && (
          <div className="mt-2.5 p-3 rounded-2xl bg-neutral-950/90 border border-yellow-500/30 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-300 font-bold text-[11px] flex items-center justify-center shrink-0 border border-yellow-500/40">
                1
              </span>
              <p className="text-[11px]">
                {isIOS ? (
                  <>
                    En Safari en tu iPhone, pulsa el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) y selecciona <strong>"Añadir a la pantalla de inicio"</strong>.
                  </>
                ) : (
                  <>
                    En Chrome en tu Android, pulsa los <strong>3 puntos (⋮)</strong> y selecciona <strong>"Añadir a pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong>.
                  </>
                )}
              </p>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-300 font-bold text-[11px] flex items-center justify-center shrink-0 border border-yellow-500/40">
                2
              </span>
              <p className="text-[11px]">
                El icono aparecerá en tu pantalla de inicio junto a tus apps y te permitirá abrir directamente las tareas del día y ver los siguientes días.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isFloatingModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div className="w-full max-w-lg max-h-[92vh] overflow-hidden">{content}</div>
      </div>
    );
  }

  return content;
}
