import React, { useState, useMemo } from 'react';
import { useAgenda } from '../context/AgendaContext';
import { useCalendar } from '../context/CalendarContext';
import {
  AgendaTaskItem,
  SEMESTER_1_SUBJECTS,
  SEMESTER_2_SUBJECTS,
} from '../types/calendar';
import { AgendaModal } from './AgendaModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  BookOpen,
  GraduationCap,
  Sparkles,
  Search,
  Filter,
  CheckSquare,
  ListTodo,
  ArrowRight,
  CalendarPlus,
  Clock,
  Layers,
  Camera,
} from 'lucide-react';

interface AgendaViewProps {
  onOpenImageScanner?: () => void;
}

export function AgendaView({ onOpenImageScanner }: AgendaViewProps = {}) {
  const {
    tasks,
    todayTasks,
    selectedDate,
    setSelectedDate,
    selectedSemester,
    setSelectedSemester,
    selectedSubject,
    setSelectedSubject,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    toggleTaskCompleted,
    deleteTask,
    createTask,
  } = useAgenda();

  const { createEvent } = useCalendar();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AgendaTaskItem | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [syncedEventNotice, setSyncedEventNotice] = useState<string | null>(null);

  // View mode: 'day' (Dia a dia) | 'week' (Semana Completa Lun-Dom) | 'all' (Todas las asignaturas)
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'all'>('day');

  // Format today's string
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Compute Monday-Sunday week dates for the current selected date
  const weekDays = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    // getDay() gives 0 for Sunday, 1 for Monday... 6 for Saturday
    const dayOfWeek = curr.getDay();
    // Monday offset (if Sunday=0, it's 6 days from Monday; otherwise dayOfWeek - 1)
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - diffToMonday);

    const days = [];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dayShorts = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const iter = new Date(monday);
      iter.setDate(monday.getDate() + i);
      const year = iter.getFullYear();
      const month = String(iter.getMonth() + 1).padStart(2, '0');
      const day = String(iter.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const count = tasks.filter((t) => t.date === dateStr).length;
      const completedCount = tasks.filter((t) => t.date === dateStr && t.completed).length;

      days.push({
        dateStr,
        dayNum: iter.getDate(),
        name: dayNames[i],
        shortName: dayShorts[i],
        count,
        completedCount,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }
    return days;
  }, [selectedDate, tasks, todayStr]);

  // Navigate dates
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    const year = prev.getFullYear();
    const month = String(prev.getMonth() + 1).padStart(2, '0');
    const day = String(prev.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, '0');
    const day = String(next.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleSetToday = () => {
    setSelectedDate(todayStr);
  };

  // Friendly date label
  const friendlyDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Filter tasks based on viewMode and active filters
  const displayedTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Date filter
      if (viewMode === 'day') {
        if (t.date !== selectedDate) return false;
      } else if (viewMode === 'week') {
        const weekDates = weekDays.map((w) => w.dateStr);
        if (!weekDates.includes(t.date)) return false;
      }

      // Semester filter
      if (selectedSemester !== 'all' && t.semester !== selectedSemester) {
        return false;
      }

      // Subject filter
      if (selectedSubject !== 'all' && t.subject !== selectedSubject) {
        return false;
      }

      // Status filter
      if (statusFilter === 'pending' && t.completed) return false;
      if (statusFilter === 'completed' && !t.completed) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchSubj = t.subject?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSubj) return false;
      }

      return true;
    });
  }, [tasks, viewMode, selectedDate, weekDays, selectedSemester, selectedSubject, statusFilter, searchQuery]);

  // Stats for the active view
  const stats = useMemo(() => {
    const total = displayedTasks.length;
    const completed = displayedTasks.filter((t) => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [displayedTasks]);

  // Quick add task for the active date
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    await createTask({
      title: quickInput.trim(),
      date: selectedDate,
      semester: selectedSemester !== 'all' ? (selectedSemester as any) : '1er semestre',
      subject: selectedSubject !== 'all' ? selectedSubject : SEMESTER_1_SUBJECTS[0],
      priority: 'media',
      completed: false,
    });
    setQuickInput('');
  };

  // Sync / Copy an Agenda task to the main Calendar
  const handleSyncToCalendar = async (task: AgendaTaskItem) => {
    try {
      await createEvent({
        title: `[Agenda] ${task.title}`,
        start: task.date,
        allDay: true,
        category: 'Estudio',
        description: `Asignatura: ${task.subject || 'Sin asignar'} (${task.semester || ''})\n\n${task.description || ''}`,
        color: task.semester === '1er semestre' ? '#6366f1' : '#8b5cf6',
      });
      setSyncedEventNotice(`¡Tarea añadida al Calendario para el ${task.date}!`);
      setTimeout(() => setSyncedEventNotice(null), 3500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeletePrompt = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar la tarea "${title}"?`)) return;
    await deleteTask(id);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Toast Notice */}
      {syncedEventNotice && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncedEventNotice}</span>
          </div>
          <button
            onClick={() => setSyncedEventNotice(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card with HUD Aesthetic */}
      <div className="bg-gradient-to-r from-zinc-900/95 via-neutral-900/95 to-zinc-900/95 backdrop-blur-2xl border border-yellow-500/40 ring-1 ring-yellow-400/20 rounded-2xl p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_24px_rgba(234,179,8,0.1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 flex items-center justify-center text-black shadow-lg shadow-yellow-400/25 shrink-0">
            <BookOpen className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Agenda Día a Día</h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-500/30">
                Grado en Derecho
              </span>
            </div>
            <p className="text-xs text-yellow-300/80 mt-0.5 capitalize font-medium">
              {friendlyDate}
            </p>
          </div>
        </div>

        {/* View Mode Switcher & New Task Button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center bg-neutral-900/80 p-1 rounded-xl border border-yellow-500/25 text-xs font-medium backdrop-blur-sm">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold shadow-sm'
                  : 'text-yellow-400/80 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Día a Día
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold shadow-sm'
                  : 'text-yellow-400/80 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Semana (Lun-Dom)
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold shadow-sm'
                  : 'text-yellow-400/80 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Todas
            </button>
          </div>

          {onOpenImageScanner && (
            <button
              onClick={onOpenImageScanner}
              title="Pegar o subir foto de un horario o cuadrante para añadir tareas con IA"
              className="py-2 px-3 rounded-xl text-xs font-extrabold bg-neutral-900/80 hover:bg-neutral-800 border border-yellow-500/40 text-yellow-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <Camera className="w-4 h-4 text-yellow-400" />
              <span className="hidden sm:inline">Pegar Horario (Foto)</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            className="py-2 px-3.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-black shadow-md shadow-yellow-400/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Week Strip (Starts Monday, Ends Sunday) with HUD Aesthetic */}
      <div className="bg-gradient-to-r from-zinc-900/95 via-neutral-900/95 to-zinc-900/95 backdrop-blur-2xl border border-yellow-500/40 ring-1 ring-yellow-400/20 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_24px_rgba(234,179,8,0.1)] space-y-3">
        {/* Day Jump Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSetToday}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black border-yellow-400 shadow-sm'
                  : 'bg-neutral-900/80 text-yellow-400/80 hover:text-white hover:bg-neutral-800 border-yellow-500/25'
              }`}
            >
              Hoy
            </button>
            <div className="flex items-center bg-neutral-900/80 rounded-xl border border-yellow-500/25 p-0.5 backdrop-blur-sm">
              <button
                onClick={handlePrevDay}
                title="Día anterior"
                className="p-1.5 text-yellow-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDay}
                title="Día siguiente"
                className="p-1.5 text-yellow-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs font-bold text-white capitalize hidden sm:inline ml-1">
              {friendlyDate}
            </span>
          </div>

          {/* Direct Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-yellow-300/80 font-medium">Ir a fecha:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-neutral-900/90 border border-yellow-500/30 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
            />
          </div>
        </div>

        {/* Week Strip (Lunes a Domingo) */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {weekDays.map((day) => (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              className={`p-2 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center gap-1 ${
                day.isSelected
                  ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-md'
                  : day.isToday
                  ? 'bg-neutral-900/90 border-yellow-500/40 text-yellow-400 font-bold'
                  : 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${day.isSelected ? 'text-black' : 'text-slate-400'}`}>
                {day.shortName}
              </span>
              <span className={`text-xs font-bold block ${day.isSelected ? 'text-black' : 'text-white'}`}>
                {day.dayNum}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {day.count > 0 ? (
                  <span
                    className={`text-[10px] font-bold px-1.5 rounded-full ${
                      day.isSelected
                        ? 'bg-black text-yellow-400'
                        : day.completedCount === day.count
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}
                  >
                    {day.completedCount}/{day.count}
                  </span>
                ) : (
                  <span className={`w-1 h-1 rounded-full ${day.isSelected ? 'bg-black' : 'bg-neutral-800'}`} />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Search Toolbar with HUD Aesthetic */}
      <div className="bg-gradient-to-r from-zinc-900/95 via-neutral-900/95 to-zinc-900/95 backdrop-blur-2xl border border-yellow-500/40 ring-1 ring-yellow-400/20 p-3.5 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_24px_rgba(234,179,8,0.1)] flex flex-col gap-3">
        {/* Semester selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-yellow-300/80 mr-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Semestre:</span>
            </span>
            <button
              onClick={() => {
                setSelectedSemester('all');
                setSelectedSubject('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                selectedSemester === 'all'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black border-yellow-400 font-extrabold shadow-sm'
                  : 'bg-neutral-900/80 text-yellow-400/80 border-yellow-500/25 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => {
                setSelectedSemester('1er semestre');
                setSelectedSubject('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                selectedSemester === '1er semestre'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black border-yellow-400 font-extrabold shadow-sm'
                  : 'bg-neutral-900/80 text-yellow-400/80 border-yellow-500/25 hover:text-white hover:bg-neutral-800'
              }`}
            >
              1er Semestre
            </button>
            <button
              onClick={() => {
                setSelectedSemester('2o semestre');
                setSelectedSubject('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                selectedSemester === '2o semestre'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black border-yellow-400 font-extrabold shadow-sm'
                  : 'bg-neutral-900/80 text-yellow-400/80 border-yellow-500/25 hover:text-white hover:bg-neutral-800'
              }`}
            >
              2o Semestre
            </button>
          </div>

          {/* Status selector (all, pending, completed) */}
          <div className="flex items-center bg-neutral-900/80 p-0.5 rounded-xl border border-yellow-500/25 text-xs backdrop-blur-sm">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold shadow-xs' : 'text-yellow-400/80 hover:text-white'
              }`}
            >
              Todas ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold shadow-xs' : 'text-yellow-400/80 hover:text-white'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'completed' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold shadow-xs' : 'text-yellow-400/80 hover:text-white'
              }`}
            >
              Completadas
            </button>
          </div>
        </div>

        {/* Subjects bar according to selected semester */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-yellow-500/20 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-semibold text-yellow-300/70 mr-1">Asignatura:</span>
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold cursor-pointer border ${
              selectedSubject === 'all'
                ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-xs'
                : 'text-yellow-400/80 border-transparent hover:bg-neutral-800 hover:text-white'
            }`}
          >
            Todas las asignaturas
          </button>

          {(selectedSemester === 'all' || selectedSemester === '1er semestre') &&
            SEMESTER_1_SUBJECTS.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium cursor-pointer border transition-all ${
                  selectedSubject === sub
                    ? 'bg-yellow-400/20 text-yellow-300 border-yellow-500/40 font-bold'
                    : 'text-slate-300 border-neutral-800 hover:text-white hover:bg-neutral-800/80'
                }`}
              >
                {sub}
              </button>
            ))}

          {(selectedSemester === 'all' || selectedSemester === '2o semestre') &&
            SEMESTER_2_SUBJECTS.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium cursor-pointer border transition-all ${
                  selectedSubject === sub
                    ? 'bg-yellow-400/20 text-yellow-300 border-yellow-500/40 font-bold'
                    : 'text-slate-300 border-neutral-800 hover:text-white hover:bg-neutral-800/80'
                }`}
              >
                {sub}
              </button>
            ))}
        </div>
      </div>

      {/* Progress & Summary Banner with HUD Aesthetic */}
      <div className="bg-gradient-to-r from-zinc-900/95 via-neutral-900/95 to-zinc-900/95 backdrop-blur-2xl border border-yellow-500/40 ring-1 ring-yellow-400/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_24px_rgba(234,179,8,0.1)]">
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-yellow-400" />
              <span>Progreso de estudio:</span>
            </span>
            <span className="font-extrabold text-yellow-400">
              {stats.completed} de {stats.total} completadas ({stats.percent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden border border-yellow-500/20">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>

        {/* Quick Add Input Bar */}
        <form onSubmit={handleQuickAdd} className="w-full sm:w-auto sm:min-w-[320px] flex items-center gap-1.5">
          <input
            type="text"
            placeholder={`Añadir tarea rápida para ${selectedDate}...`}
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            className="flex-1 bg-neutral-900/90 border border-yellow-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-yellow-300/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
          />
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="px-3.5 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-black rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-50 transition-all shrink-0 active:scale-95 flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
            <span>Añadir</span>
          </button>
        </form>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {displayedTasks.length === 0 ? (
          <div className="py-14 px-4 text-center rounded-2xl bg-neutral-900/40 border border-dashed border-yellow-500/30 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center mb-3">
              <ListTodo className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No hay tareas para este criterio</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Añade tareas, apuntes o temas de estudio para este día seleccionando el semestre y las asignaturas de Derecho.
            </p>
            <button
              onClick={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-yellow-400/20 active:scale-95"
            >
              <Plus className="w-4 h-4 text-black stroke-[3]" />
              <span>Crear primera tarea</span>
            </button>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isSem1 = task.semester === '1er semestre';
            const isSem2 = task.semester === '2o semestre';

            return (
              <div
                key={task.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group ${
                  task.completed
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left side: Checkbox + Title + Meta */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => toggleTaskCompleted(task.id)}
                    title={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    className="mt-0.5 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4
                        className={`text-sm font-semibold transition-all ${
                          task.completed
                            ? 'line-through text-slate-500'
                            : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Semester badge */}
                      {task.semester && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isSem1
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : isSem2
                              ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {task.semester}
                        </span>
                      )}

                      {/* Subject badge */}
                      {task.subject && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700">
                          {task.subject}
                        </span>
                      )}

                      {/* Priority badge if urgent or high */}
                      {task.priority === 'urgente' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                          Urgente
                        </span>
                      )}
                      {task.priority === 'alta' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Alta
                        </span>
                      )}
                    </div>

                    {/* Description notes if any */}
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1 whitespace-pre-line leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Date and time badges */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-slate-400" />
                        <span>{task.date}</span>
                      </div>
                      {task.time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{task.time}</span>
                        </div>
                      )}
                      {task.completed && task.completedAt && (
                        <span className="text-emerald-400/80 font-medium">
                          ✓ Completada
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                  {/* Sync to Calendar button */}
                  <button
                    onClick={() => handleSyncToCalendar(task)}
                    title="Añadir como evento en el Calendario principal"
                    className="p-1.5 text-xs text-slate-400 hover:text-amber-300 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline text-[11px]">Al Calendario</span>
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setModalOpen(true);
                    }}
                    title="Editar tarea"
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeletePrompt(task.id, task.title)}
                    title="Eliminar tarea"
                    className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-950/60 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Agenda Task Modal */}
      <AgendaModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        taskToEdit={editingTask}
        defaultDate={selectedDate}
      />
    </div>
  );
}
