import React, { useState, useEffect } from 'react';
import {
  AgendaTaskItem,
  SEMESTER_1_SUBJECTS,
  SEMESTER_2_SUBJECTS,
  SemesterType,
  SubjectType,
} from '../types/calendar';
import { useAgenda } from '../context/AgendaContext';
import {
  X,
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: AgendaTaskItem | null;
  defaultDate?: string;
}

export function AgendaModal({ isOpen, onClose, taskToEdit, defaultDate }: AgendaModalProps) {
  const { createTask, updateTask, selectedDate } = useAgenda();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || selectedDate);
  const [time, setTime] = useState('');
  const [semester, setSemester] = useState<SemesterType>('1er semestre');
  const [subject, setSubject] = useState<SubjectType>(SEMESTER_1_SUBJECTS[0]);
  const [priority, setPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>('media');
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setDate(taskToEdit.date);
      setTime(taskToEdit.time || '');
      const sem = taskToEdit.semester || '1er semestre';
      setSemester(sem);
      setSubject(
        taskToEdit.subject || (sem === '1er semestre' ? SEMESTER_1_SUBJECTS[0] : SEMESTER_2_SUBJECTS[0])
      );
      setPriority(taskToEdit.priority || 'media');
      setIsCompleted(taskToEdit.completed);
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate || selectedDate);
      setTime('');
      setSemester('1er semestre');
      setSubject(SEMESTER_1_SUBJECTS[0]);
      setPriority('media');
      setIsCompleted(false);
    }
    setError(null);
  }, [taskToEdit, defaultDate, selectedDate, isOpen]);

  // Handle semester switch and auto-select default subject for that semester
  const handleSemesterChange = (newSem: SemesterType) => {
    setSemester(newSem);
    if (newSem === '1er semestre') {
      setSubject(SEMESTER_1_SUBJECTS[0]);
    } else if (newSem === '2o semestre') {
      setSubject(SEMESTER_2_SUBJECTS[0]);
    } else {
      setSubject('General');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor introduce un título para la tarea o apunte.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (taskToEdit) {
        await updateTask(taskToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          date,
          time: time || undefined,
          semester,
          subject,
          priority,
          completed: isCompleted,
        });
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          date,
          time: time || undefined,
          semester,
          subject,
          priority,
          completed: false,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error guardando la tarea.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[92vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {taskToEdit ? 'Editar Tarea / Asignatura' : 'Nueva Tarea en Agenda'}
            </h3>
            <p className="text-xs text-slate-400">
              Planifica tu estudio día a día según el semestre y la asignatura de Derecho.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Título o apunte del día *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Resumen lección 3, Casos prácticos, Repaso sentencias..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Semestre Selector (1er semestre o 2o semestre) */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Seleccionar Semestre *</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSemesterChange('1er semestre')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  semester === '1er semestre'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-1 ring-indigo-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                1er Semestre
              </button>
              <button
                type="button"
                onClick={() => handleSemesterChange('2o semestre')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  semester === '2o semestre'
                    ? 'bg-violet-600 text-white border-violet-500 shadow-md ring-1 ring-violet-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                2o Semestre
              </button>
              <button
                type="button"
                onClick={() => handleSemesterChange('General')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  semester === 'General'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-1 ring-emerald-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                General / Libre
              </button>
            </div>

            {/* Asignatura Selector according to semester */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                <span>Asignatura asignada</span>
              </label>

              {semester === '1er semestre' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {SEMESTER_1_SUBJECTS.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubject(sub)}
                      className={`text-left p-2 rounded-lg text-xs font-medium transition-all border cursor-pointer flex items-center justify-between ${
                        subject === sub
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{sub}</span>
                      {subject === sub && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {semester === '2o semestre' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {SEMESTER_2_SUBJECTS.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubject(sub)}
                      className={`text-left p-2 rounded-lg text-xs font-medium transition-all border cursor-pointer flex items-center justify-between ${
                        subject === sub
                          ? 'bg-violet-500/20 text-violet-300 border-violet-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{sub}</span>
                      {subject === sub && <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {semester === 'General' && (
                <input
                  type="text"
                  placeholder="Ej. Tareas varias, Prácticas del bufete..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Fecha día a día *</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Hora / Franja (Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej. 10:00 - 12:30 o Mañana"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Prioridad
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'baja', label: 'Baja', color: 'border-slate-700 text-slate-400 active:bg-slate-800' },
                { id: 'media', label: 'Normal', color: 'border-indigo-500 text-indigo-400 active:bg-indigo-950/40' },
                { id: 'alta', label: 'Alta', color: 'border-amber-500 text-amber-400 active:bg-amber-950/40' },
                { id: 'urgente', label: 'Urgente', color: 'border-red-500 text-red-400 active:bg-red-950/40' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                    priority === p.id
                      ? 'bg-slate-800 text-white font-bold ring-2 ring-indigo-500'
                      : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Notas adicionales / Contenido de la tarea
            </label>
            <textarea
              rows={3}
              placeholder="Añade lo que quieras: capítulos del manual, artículos del código, jurisprudencia, dudas a preguntar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Completed checkbox if editing */}
          {taskToEdit && (
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-semibold text-slate-200">
                Marcar como completada
              </span>
            </label>
          )}

          {/* Footer action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{taskToEdit ? 'Guardar Cambios' : 'Añadir a la Agenda'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
