import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  AgendaTaskItem,
  SemesterType,
  SubjectType,
  SEMESTER_1_SUBJECTS,
  SEMESTER_2_SUBJECTS,
} from '../types/calendar';

interface AgendaContextType {
  tasks: AgendaTaskItem[];
  filteredTasks: AgendaTaskItem[];
  todayTasks: AgendaTaskItem[];
  selectedDateTasks: AgendaTaskItem[];
  loading: boolean;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  selectedSemester: string;
  setSelectedSemester: (sem: string) => void;
  selectedSubject: string;
  setSelectedSubject: (subj: string) => void;
  statusFilter: 'all' | 'pending' | 'completed';
  setStatusFilter: (status: 'all' | 'pending' | 'completed') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  createTask: (data: Omit<AgendaTaskItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<AgendaTaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompleted: (id: string) => Promise<void>;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'derecho_agenda_tasks_v1';

export function AgendaProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  
  // Format today's local date as YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [tasks, setTasks] = useState<AgendaTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Firestore real-time listener for authenticated user
  useEffect(() => {
    if (!currentUser) {
      // Load from localStorage for guest / offline / local-only
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        setTasks(saved ? JSON.parse(saved) : []);
      } catch {
        setTasks([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    const tasksPath = `users/${currentUser.uid}/agenda_tasks`;
    const tasksRef = collection(db, 'users', currentUser.uid, 'agenda_tasks');

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const items: AgendaTaskItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AgendaTaskItem, 'id'>),
          });
        });
        
        // Sort by date then time
        items.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (a.time || '').localeCompare(b.time || '');
        });

        setTasks(items);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
          console.error(e);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, tasksPath);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Sync to local storage
  const syncLocal = (newTasks: AgendaTaskItem[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTasks));
    } catch (e) {
      console.error(e);
    }
  };

  const createTask = async (
    data: Omit<AgendaTaskItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const taskId = 'tsk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const nowISO = new Date().toISOString();
    const userId = currentUser ? currentUser.uid : 'local_user';

    const payload: AgendaTaskItem = {
      id: taskId,
      title: data.title.trim().slice(0, 200),
      date: data.date,
      completed: Boolean(data.completed),
      userId,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    if (data.description) payload.description = data.description.trim().slice(0, 2000);
    if (data.time) payload.time = data.time.trim().slice(0, 50);
    if (data.semester) payload.semester = data.semester;
    if (data.subject) payload.subject = data.subject;
    if (data.priority) payload.priority = data.priority;
    if (data.completed) payload.completedAt = nowISO;

    // Update state & localStorage
    setTasks((prev) => {
      const next = [...prev, payload];
      syncLocal(next);
      return next;
    });

    if (currentUser) {
      const taskPath = `users/${currentUser.uid}/agenda_tasks/${taskId}`;
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'agenda_tasks', taskId);
        await setDoc(docRef, payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, taskPath);
      }
    }

    return taskId;
  };

  const updateTask = async (id: string, updates: Partial<AgendaTaskItem>): Promise<void> => {
    const nowISO = new Date().toISOString();
    const cleanUpdates: Partial<AgendaTaskItem> = {
      ...updates,
      updatedAt: nowISO,
    };

    if (updates.title) cleanUpdates.title = updates.title.trim().slice(0, 200);
    if (updates.description !== undefined) cleanUpdates.description = updates.description.trim().slice(0, 2000);

    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...cleanUpdates } : t));
      syncLocal(next);
      return next;
    });

    if (currentUser) {
      const taskPath = `users/${currentUser.uid}/agenda_tasks/${id}`;
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'agenda_tasks', id);
        await updateDoc(docRef, cleanUpdates as any);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, taskPath);
      }
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      syncLocal(next);
      return next;
    });

    if (currentUser) {
      const taskPath = `users/${currentUser.uid}/agenda_tasks/${id}`;
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'agenda_tasks', id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, taskPath);
      }
    }
  };

  const toggleTaskCompleted = async (id: string): Promise<void> => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    const nowISO = new Date().toISOString();

    await updateTask(id, {
      completed: newCompleted,
      completedAt: newCompleted ? nowISO : undefined,
    });
  };

  // Today tasks
  const todayStr = getTodayStr();
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === todayStr);
  }, [tasks, todayStr]);

  // Selected date tasks
  const selectedDateTasks = useMemo(() => {
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  // Filtered tasks by search, semester, subject, status
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Semester filter
      if (selectedSemester !== 'all') {
        if (t.semester !== selectedSemester) return false;
      }

      // Subject filter
      if (selectedSubject !== 'all') {
        if (t.subject !== selectedSubject) return false;
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
  }, [tasks, selectedSemester, selectedSubject, statusFilter, searchQuery]);

  return (
    <AgendaContext.Provider
      value={{
        tasks,
        filteredTasks,
        todayTasks,
        selectedDateTasks,
        loading,
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
        createTask,
        updateTask,
        deleteTask,
        toggleTaskCompleted,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
}

export function useAgenda() {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgenda must be used within an AgendaProvider');
  }
  return context;
}
