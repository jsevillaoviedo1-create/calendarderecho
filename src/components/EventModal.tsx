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
} from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  event: Partial<CalendarEventItem> | null;
  onClose: () => void;
}

export function EventModal({ isOpen, event, onClose }: EventModalProps) {
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

  if (!isOpen) return null;

  const handleCategorySelect = (catName: string, catColor: string) => {
    setCategory(catName);
    setColor(catColor);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-4 h-4 rounded-full shadow-md"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-xl font-bold text-white">
            {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
          </h3>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Título del evento *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej. Reunión de proyecto, Clase de cálculo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Categoría</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.name, cat.color)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                    category === cat.name
                      ? 'bg-slate-800 text-white border-indigo-400/80 ring-2 ring-indigo-500/20'
                      : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowNewCatInput(!showNewCatInput)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>+ Nueva Categoría</span>
              </button>
            </div>

            {/* Inline new category form */}
            {showNewCatInput && (
              <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2 animate-in fade-in duration-150">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Añadir categoría personalizada
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nombre (ej. Audiencias, Clientes VIP)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent shrink-0"
                    title="Elegir color"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newCatName.trim()) return;
                      try {
                        await createCustomCategory(newCatName.trim(), newCatColor);
                        handleCategorySelect(newCatName.trim(), newCatColor);
                        setNewCatName('');
                        setShowNewCatInput(false);
                      } catch (err: any) {
                        setError(err.message || 'Error creando categoría');
                      }
                    }}
                    disabled={!newCatName.trim()}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(false)}
                    className="text-xs text-slate-400 hover:text-white px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between py-2 border-y border-slate-800/80">
            <span className="text-xs font-medium text-slate-300">¿Todo el día?</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Date & Time selection */}
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
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:dark]"
              />
              {!allDay && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
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
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:dark]"
              />
              {!allDay && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Ubicación o enlace</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Sala A, Zoom, Google Meet o dirección"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Notas o descripción</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detalles adicionales, temario o recordatorios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {isEditing ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting}
                    className="px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all cursor-pointer"
                  >
                    Confirmar Borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Evento'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
