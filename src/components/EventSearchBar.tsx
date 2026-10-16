import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { CalendarEventItem } from '../types/calendar';
import {
  Search,
  X,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Tag,
  History,
  CalendarDays,
} from 'lucide-react';

interface EventSearchBarProps {
  onSelectEvent?: (event: CalendarEventItem) => void;
  onNavigateToDate?: (dateStr: string) => void;
}

export function EventSearchBar({ onSelectEvent, onNavigateToDate }: EventSearchBarProps) {
  const { events, searchQuery, setSearchQuery } = useCalendar();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Split matches into Future / Upcoming vs Past
  const { upcomingMatches, pastMatches, totalMatches } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { upcomingMatches: [], pastMatches: [], totalMatches: 0 };
    }

    const q = searchQuery.toLowerCase().trim();
    const matches = events.filter((ev) => {
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchDesc = ev.description ? ev.description.toLowerCase().includes(q) : false;
      const matchLoc = ev.location ? ev.location.toLowerCase().includes(q) : false;
      const matchCat = ev.category ? ev.category.toLowerCase().includes(q) : false;
      return matchTitle || matchDesc || matchLoc || matchCat;
    });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const upcoming: CalendarEventItem[] = [];
    const past: CalendarEventItem[] = [];

    matches.forEach((ev) => {
      const evDate = ev.start.split('T')[0];
      if (evDate >= todayStr) {
        upcoming.push(ev);
      } else {
        past.push(ev);
      }
    });

    // Upcoming sorted earliest to latest
    upcoming.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    // Past sorted latest to earliest (most recent past first)
    past.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    return {
      upcomingMatches: upcoming,
      pastMatches: past,
      totalMatches: matches.length,
    };
  }, [events, searchQuery]);

  // Format date helper in Spanish
  const formatEventDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return { formatted: isoStr, badge: '', diffDays: 0 };

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let badge = '';
      if (diffDays === 0) badge = 'Hoy';
      else if (diffDays === 1) badge = 'Mañana';
      else if (diffDays === -1) badge = 'Ayer';
      else if (diffDays > 1 && diffDays < 7) badge = `En ${diffDays} días`;
      else if (diffDays < -1 && diffDays > -7) badge = `Hace ${Math.abs(diffDays)} días`;

      const formatted = d.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });

      return { formatted, badge, diffDays };
    } catch {
      return { formatted: isoStr, badge: '', diffDays: 0 };
    }
  };

  const formatEventTime = (ev: CalendarEventItem) => {
    if (ev.allDay) return 'Todo el día';
    try {
      const s = new Date(ev.start);
      const startStr = `${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`;
      if (ev.end) {
        const e = new Date(ev.end);
        const endStr = `${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`;
        return `${startStr} - ${endStr}`;
      }
      return startStr;
    } catch {
      return '';
    }
  };

  // Helper to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-400/30 text-amber-200 rounded px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleSelect = (ev: CalendarEventItem) => {
    setIsOpen(false);
    if (onNavigateToDate) {
      onNavigateToDate(ev.start.split('T')[0]);
    }
    if (onSelectEvent) {
      onSelectEvent(ev);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar citas, exámenes, aulas, notas..."
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          className="w-full bg-slate-950/70 hover:bg-slate-950/90 focus:bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition-all"
        />

        {searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            title="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Dropdown Results Popover */}
      {isOpen && searchQuery.trim() && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
          {/* Header count */}
          <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {totalMatches === 0
                  ? 'Sin resultados'
                  : `${totalMatches} ${totalMatches === 1 ? 'evento encontrado' : 'eventos encontrados'}`}
              </span>
            </span>
            <span className="text-[11px] text-slate-500">Filtrando por título y notas</span>
          </div>

          {/* Results list */}
          <div className="overflow-y-auto p-2 space-y-3 divide-y divide-slate-800/50">
            {totalMatches === 0 ? (
              <div className="py-8 text-center px-4">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300">
                  No se encontraron citas con "{searchQuery}"
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Prueba buscando por asignatura (ej. Romano, Civil), tipo de examen, aula o profesor.
                </p>
              </div>
            ) : (
              <>
                {/* Upcoming / Future events */}
                {upcomingMatches.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Próximas Citas y Futuras ({upcomingMatches.length})</span>
                    </div>

                    {upcomingMatches.map((ev) => {
                      const { formatted, badge } = formatEventDate(ev.start);
                      const timeStr = formatEventTime(ev);

                      return (
                        <div
                          key={ev.id}
                          onClick={() => handleSelect(ev)}
                          className="group p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: ev.color || '#6366f1' }}
                              />
                              <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                                {highlightMatch(ev.title, searchQuery)}
                              </span>
                              {ev.category && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80">
                                  {highlightMatch(ev.category, searchQuery)}
                                </span>
                              )}
                              {badge && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  {badge}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 font-medium text-slate-300">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{formatted}</span>
                              </span>
                              {timeStr && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{timeStr}</span>
                                </span>
                              )}
                              {ev.location && (
                                <span className="flex items-center gap-1 text-slate-400 truncate max-w-xs">
                                  <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span className="truncate">{highlightMatch(ev.location, searchQuery)}</span>
                                </span>
                              )}
                            </div>

                            {ev.description && (
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                                {highlightMatch(ev.description, searchQuery)}
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

                {/* Past events / History */}
                {pastMatches.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      <span>Citas Pasadas e Historial ({pastMatches.length})</span>
                    </div>

                    {pastMatches.map((ev) => {
                      const { formatted, badge } = formatEventDate(ev.start);
                      const timeStr = formatEventTime(ev);

                      return (
                        <div
                          key={ev.id}
                          onClick={() => handleSelect(ev)}
                          className="group p-2.5 rounded-xl bg-slate-950/30 hover:bg-slate-800/70 border border-slate-800/60 hover:border-slate-700 transition-all cursor-pointer flex items-start justify-between gap-3 opacity-90 hover:opacity-100"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 opacity-80"
                                style={{ backgroundColor: ev.color || '#6366f1' }}
                              />
                              <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors truncate">
                                {highlightMatch(ev.title, searchQuery)}
                              </span>
                              {ev.category && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-800">
                                  {highlightMatch(ev.category, searchQuery)}
                                </span>
                              )}
                              {badge && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                                  {badge}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-600" />
                                <span>{formatted}</span>
                              </span>
                              {timeStr && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-600" />
                                  <span>{timeStr}</span>
                                </span>
                              )}
                              {ev.location && (
                                <span className="flex items-center gap-1 text-slate-500 truncate max-w-xs">
                                  <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                                  <span className="truncate">{highlightMatch(ev.location, searchQuery)}</span>
                                </span>
                              )}
                            </div>

                            {ev.description && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                                {highlightMatch(ev.description, searchQuery)}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
