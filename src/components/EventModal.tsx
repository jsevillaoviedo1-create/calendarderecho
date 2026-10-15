import React, { useState, useEffect } from 'react';
import { CalendarEventItem, DEFAULT_CATEGORIES } from '../types/calendar';
import { useCalendar } from '../context/CalendarContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlignLeft,
  Tag,
  Trash2,
  X,
  Check,
  ExternalLink,
  Navigation,
  SlidersHorizontal,
  Sparkles,
  Plus,
} from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  event: Partial<CalendarEventItem> | null;
  onClose: () => void;
  onOpenCategoryManager?: () => void;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#64748b', // Slate
];

export function EventModal({ isOpen, event, onClose, onOpenCategoryManager }: EventModalProps) {
  const { createEvent, updateEvent, deleteEvent, allCategories, createCustomCategory } = useCalendar();
  const { notifyEventChange } = useNotifications();

  const isEditing = Boolean(event?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState('Trabajo');
  const [color, setColor] = useState('#6366f1');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Quick custom category creation
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');
  const [creatingCat, setCreatingCat] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setLocation(event.location || '');
      setCategory(event.category || 'Trabajo');
      setColor(event.color || '#6366f1');
      setAllDay(Boolean(event.allDay));

      if (event.start) {
        const startObj = new Date(event.start);
        if (!isNaN(startObj.getTime())) {
          setStartDate(startObj.toISOString().split('T')[0]);
          const hours = String(startObj.getHours()).padStart(2, '0');
          const minutes = String(startObj.getMinutes()).padStart(2, '0');
          setStartTime(`${hours}:${minutes}`);
        }
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setStartDate(todayStr);
        setStartTime('09:00');
      }

      if (event.end) {
        const endObj = new Date(event.end);
        if (!isNaN(endObj.getTime())) {
          setEndDate(endObj.toISOString().split('T')[0]);
          const hours = String(endObj.getHours()).padStart(2, '0');
          const minutes = String(endObj.getMinutes()).padStart(2, '0');
          setEndTime(`${hours}:${minutes}`);
        }
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setEndDate(todayStr);
        setEndTime('10:00');
      }
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('Trabajo');
      setColor('#6366f1');
      setStartDate(todayStr);
      setStartTime('09:00');
      setEndDate(todayStr);
      setEndTime('10:00');
      setAllDay(false);
    }
    setError(null);
    setConfirmDelete(false);
  }, [event, isOpen]);

  // Handle escape key to close modal cleanly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCategorySelect = (catName: string, catColor: string) => {
    setCategory(catName);
    setColor(catColor);
  };

  const handleSaveInlineCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    setError(null);
    try {
      await createCustomCategory(newCatName.trim(), newCatColor);
      handleCategorySelect(newCatName.trim(), newCatColor);
      setNewCatName('');
      setShowNewCatInput(false);
    } catch (err: any) {
      setError(err.message || 'Error creando la categoría');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleOpenGoogleMaps = () => {
    const query = location.trim();
    const url = query
      ? (query.startsWith('http://') || query.startsWith('https://')
          ? query
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`)
      : 'https://www.google.com/maps';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }
    setGpsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { signal: AbortSignal.timeout(3500) }
          );
          const data = await resp.json();
          if (data && data.display_name) {
            setLocation(data.display_name);
          } else {
            setLocation(`Ubicación GPS (${lat}, ${lng})`);
          }
        } catch {
          setLocation(`Ubicación GPS (${lat}, ${lng})`);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setError(`No se pudo obtener la ubicación GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor indica un título para el evento.');
      return;
    }
    if (!startDate) {
      setError('Por favor selecciona una fecha de inicio.');
      return;
    }

    let startIso: string;
    let endIso: string | undefined;

    if (allDay) {
      startIso = startDate;
      endIso = endDate || startDate;
    } else {
      startIso = new Date(`${startDate}T${startTime || '00:00'}:00`).toISOString();
      const endCandidate = new Date(`${endDate || startDate}T${endTime || '01:00'}:00`);
      endIso = isNaN(endCandidate.getTime()) ? undefined : endCandidate.toISOString();
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEditing && event?.id) {
        await updateEvent(event.id, {
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          start: startIso,
          end: endIso,
          allDay,
          category,
          color,
        });
        await notifyEventChange(
          '📝 Evento Modificado',
          `Se actualizaron los detalles de "${title.trim()}".`,
          event.id,
          'event_updated'
        );
      } else {
        const newId = await createEvent({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          start: startIso,
          end: endIso,
          allDay,
          category,
          color,
        });
        await notifyEventChange(
          '✨ Nuevo Evento Creado',
          `"${title.trim()}" programado para el ${new Date(startIso).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`,
          newId,
          'event_created'
        );
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error guardando el evento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    setSubmitting(true);
    try {
      await deleteEvent(event.id);
      await notifyEventChange(
        '🗑️ Evento Eliminado',
        `Se eliminó "${title || 'Evento'}" del calendario.`,
        undefined,
        'event_updated'
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error eliminando el evento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl md:max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] relative animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Fixed & Always Visible */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800/90 bg-slate-900/95 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-4 h-4 rounded-full shadow-md shrink-0 ring-2 ring-slate-800"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
              </h3>
              <p className="text-xs text-slate-400 hidden sm:block truncate">
                {isEditing
                  ? 'Modifica los detalles y horarios del evento'
                  : 'Añade una clase, examen o actividad a tu calendario'}
              </p>
            </div>
          </div>

          {/* Close button with clear title and escape support */}
          <button
            type="button"
            onClick={onClose}
            title="Cerrar ventana (Esc)"
            aria-label="Cerrar"
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700/80 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form with scrollable body and sticky footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Title input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Título del evento *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ej. Derecho Romano, Clase de cálculo, Examen Parcial..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>

            {/* Category Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Categoría</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                      showNewCatInput
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear propia</span>
                  </button>

                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      onClick={onOpenCategoryManager}
                      className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                      title="Abrir gestor de categorías"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Gestionar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* List of Category Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {allCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.name, cat.color)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                      category === cat.name
                        ? 'bg-slate-800 text-white border-indigo-400/80 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                    {cat.isCustom && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                        propia
                      </span>
                    )}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowNewCatInput(!showNewCatInput)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    showNewCatInput
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 border-dashed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nueva Categoría</span>
                </button>
              </div>

              {/* Inline new category form */}
              {showNewCatInput && (
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-3 shadow-xl animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Crear categoría propia</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewCatInput(false)}
                      className="text-xs text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Nombre de la categoría *
                    </label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ej. Audiencias, Clientes VIP, Expedientes, Juicios..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Color distintivo</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">{newCatColor}</span>
                        <input
                          type="color"
                          value={newCatColor}
                          onChange={(e) => setNewCatColor(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          title="Elegir color personalizado"
                        />
                      </div>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewCatColor(c)}
                          className={`w-6 h-6 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                            newCatColor === c ? 'scale-110 ring-2 ring-white shadow-md' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                        >
                          {newCatColor === c && <Check className="w-3 h-3 text-white drop-shadow" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Vista previa:</span>
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm"
                        style={{ backgroundColor: newCatColor }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        <span>{newCatName.trim() || 'Nombre de categoría'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewCatInput(false)}
                        className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveInlineCategory}
                        disabled={!newCatName.trim() || creatingCat}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{creatingCat ? 'Guardando...' : 'Crear y Asignar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time selection with integrated Todo el día toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Fechas y Horario</span>
                </span>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-300">¿Todo el día?</span>
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={allDay}
                      onChange={(e) => setAllDay(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Inicio</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                  />
                  {!allDay && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Fin</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                  />
                  {!allDay && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location & Google Maps */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lugar / Ubicación (Google Maps)</span>
                </label>

                <button
                  type="button"
                  onClick={handleOpenGoogleMaps}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-indigo-500/10 transition-colors cursor-pointer"
                  title="Abrir Google Maps para buscar y copiar una ubicación"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir Google Maps</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej. Juzgado de 1ª Instancia nº 4, Plaza Castilla, aula 110..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-3 pr-24 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />

                {/* Action buttons inside input */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {location.trim() && (
                    <button
                      type="button"
                      onClick={handleOpenGoogleMaps}
                      title="Ver este lugar en Google Maps"
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleGetGPS}
                    disabled={gpsLoading}
                    title="Obtener ubicación actual con GPS del dispositivo"
                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Google Maps quick access and action chips */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleOpenGoogleMaps}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  <span className="text-rose-400">📍</span>
                  <span>{location.trim() ? 'Ver en Google Maps' : 'Buscar en Maps'}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={gpsLoading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  <Navigation className={`w-3 h-3 text-indigo-400 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'Obteniendo GPS...' : 'Usar mi GPS'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.open('https://www.google.com/maps/search/Juzgados+y+tribunales', '_blank', 'noopener,noreferrer');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  <span>🏛️ Juzgados cercanos</span>
                </button>

                {location.trim() && (
                  <button
                    type="button"
                    onClick={() => setLocation('')}
                    className="text-[11px] text-slate-500 hover:text-rose-400 px-1 py-0.5 cursor-pointer ml-auto"
                  >
                    Limpiar lugar
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Notas o descripción</span>
              </label>
              <textarea
                rows={2}
                placeholder="Detalles adicionales, temario o recordatorios..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Sticky Footer - Always Visible and Clickable */}
          <div className="px-5 sm:px-6 py-3 sm:py-3.5 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0 z-10">
            {isEditing ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting}
                    className="px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    Confirmar Borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Añadir Evento'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
