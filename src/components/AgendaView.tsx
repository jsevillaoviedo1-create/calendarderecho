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
} from 'lucide-react';

export function AgendaView() {
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

      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Agenda Día a Día</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Grado en Derecho
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">
              {friendlyDate}
            </p>
          </div>
        </div>

        {/* View Mode Switcher & New Task Button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Día a Día
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semana (Lun-Dom)
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Week Strip (Starts Monday, Ends Sunday) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        {/* Day Jump Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSetToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              Hoy
            </button>
            <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-0.5">
              <button
                onClick={handlePrevDay}
                title="Día anterior"
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDay}
                title="Día siguiente"
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs font-semibold text-slate-200 capitalize hidden sm:inline ml-1">
              {friendlyDate}
            </span>
          </div>

          {/* Direct Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Ir a fecha:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500 shadow-md'
                  : day.isToday
                  ? 'bg-slate-800/90 border-slate-700 text-white'
                  : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[11px] font-medium uppercase tracking-wider block">
                {day.shortName}
              </span>
              <span
                className={`text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                  day.isSelected
                    ? 'bg-indigo-600 text-white'
                    : day.isToday
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-200'
                }`}
              >
                {day.dayNum}
              </span>
              <div className="flex items-center gap-1 h-2">
                {day.count > 0 ? (
                  <span
                    className={`text-[9px] font-bold px-1 rounded-full ${
                      day.completedCount === day.count
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {day.completedCount}/{day.count}
                  </span>
                ) : (
                  <span className="w-1 h-1 rounded-full bg-slate-800" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-3">
        {/* Semester selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Semestre:</span>
            </span>
            <button
              onClick={() => {
                setSelectedSemester('all');
                setSelectedSubject('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                selectedSemester === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => {
                setSelectedSemester('1er semestre');
                setSelectedSubject('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                selectedSemester === '1er semestre'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              1er Semestre
            </button>
            <button
              onClick={() => {
                setSelectedSemester('2o semestre');
                setSelectedSubject('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                selectedSemester === '2o semestre'
                  ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              2o Semestre
            </button>
          </div>

          {/* Status selector (all, pending, completed) */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
              }`}
            >
              Todas ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'pending' ? 'bg-slate-800 text-amber-300 font-medium' : 'text-slate-400'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'completed' ? 'bg-slate-800 text-emerald-300 font-medium' : 'text-slate-400'
              }`}
            >
              Completadas
            </button>
          </div>
        </div>

        {/* Subjects bar according to selected semester */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-medium text-slate-500 mr-1">Asignatura:</span>
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-2.5 py-0.5 rounded-lg text-xs font-medium cursor-pointer border ${
              selectedSubject === 'all'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'text-slate-400 border-transparent hover:bg-slate-800/40'
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
                    ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/50 font-semibold'
                    : 'text-slate-400 border-slate-800/60 hover:text-slate-200 hover:bg-slate-800/40'
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
                    ? 'bg-violet-500/25 text-violet-300 border-violet-500/50 font-semibold'
                    : 'text-slate-400 border-slate-800/60 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {sub}
              </button>
            ))}
        </div>
      </div>

      {/* Progress & Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Progreso de estudio:</span>
            </span>
            <span className="font-bold text-white">
              {stats.completed} de {stats.total} completadas ({stats.percent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
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
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all shrink-0 active:scale-95 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir</span>
          </button>
        </form>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {displayedTasks.length === 0 ? (
          <div className="py-14 px-4 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <ListTodo className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">No hay tareas para este criterio</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Añade tareas, apuntes o temas de estudio para este día seleccionando el semestre y las asignaturas de Derecho.
            </p>
            <button
              onClick={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
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
                    className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
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
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              : isSem2
                              ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
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
                    className="p-1.5 text-xs text-slate-400 hover:text-indigo-300 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-indigo-400" />
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
