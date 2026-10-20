/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CalendarProvider, useCalendar } from './context/CalendarContext';
import { AgendaProvider, useAgenda } from './context/AgendaContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { AgendaView } from './components/AgendaView';
import { EventModal } from './components/EventModal';
import { AgendaModal } from './components/AgendaModal';
import { HomeScreenWidgetModal } from './components/HomeScreenWidgetModal';
import { ICSImportModal } from './components/ICSImportModal';
import { BiometricLockModal } from './components/BiometricLockModal';
import { BiometricSettingsModal } from './components/BiometricSettingsModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { ImageScheduleScannerModal } from './components/ImageScheduleScannerModal';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AppLogo } from './components/AppLogo';
import { syncWidgetData } from './lib/widgetSync';
import { CalendarEventItem } from './types/calendar';
import {
  Shield,
  Fingerprint,
  Calendar as CalendarIcon,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  BookOpen,
  RefreshCw,
  Smartphone,
  Plus,
  CheckCircle2,
  Filter,
  ChevronDown,
  Check,
  Tag,
} from 'lucide-react';

function CalendarApp() {
  const { currentUser, loading, isBiometricEnrolled, isBiometricSupported } = useAuth();
  const { events, selectedCategory, setSelectedCategory, allCategories } = useCalendar();
  const { tasks } = useAgenda();

  // Tab state: 'calendar' | 'agenda'
  const [activeTab, setActiveTab] = useState<'calendar' | 'agenda'>('calendar');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterRef = React.useRef<HTMLDivElement | null>(null);

  // Close filter dropdown on click outside
  React.useEffect(() => {
    if (!filterDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterDropdownOpen]);

  const activeCategoryColor = React.useMemo(() => {
    if (selectedCategory === 'all') return undefined;
    const cat = allCategories.find((c) => c.name === selectedCategory);
    return cat?.color || '#eab308';
  }, [selectedCategory, allCategories]);

  // Automatically synchronize Calendar events and Agenda tasks to native shared storage
  // (Android SharedPreferences & iOS UserDefaults) whenever data changes
  React.useEffect(() => {
    syncWidgetData(events, tasks);
  }, [events, tasks]);

  // Modals state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEventItem> | null>(null);
  const [icsModalOpen, setIcsModalOpen] = useState(false);
  const [biometricsModalOpen, setBiometricsModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [imageScannerOpen, setImageScannerOpen] = useState(false);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [agendaModalDate, setAgendaModalDate] = useState<string | undefined>(undefined);
  const [calendarNavDate, setCalendarNavDate] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Handle PWA and mobile widget shortcut actions (?action=widget | new-event | new-task)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'widget') {
      setWidgetModalOpen(true);
    } else if (action === 'new-event') {
      setSelectedEvent(null);
      setEventModalOpen(true);
    } else if (action === 'new-task') {
      setAgendaModalDate(undefined);
      setTaskModalOpen(true);
    }
  }, []);

  // New event trigger
  const handleOpenNewEvent = () => {
    setSelectedEvent(null);
    setEventModalOpen(true);
  };

  // Click on date slot
  const handleSelectDate = (dateStr: string, allDay: boolean) => {
    setSelectedEvent({
      start: dateStr,
      allDay,
    });
    setEventModalOpen(true);
  };

  // Click on existing event
  const handleSelectEvent = (event: CalendarEventItem) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <AppLogo className="w-20 h-20 mb-4 animate-pulse" />
        <p className="text-sm font-bold text-white">Cargando Calendario Derecho Pro...</p>
        <p className="text-xs text-yellow-400 mt-1 font-medium">Modo Oscuro, Blanco y Amarillo</p>
      </div>
    );
  }

  const handleForceUpdate = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.warn('Error clearing caches', e);
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col relative">
      {/* Biometric lock screen overlay when session is locked */}
      <BiometricLockModal />

      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Main Navbar */}
      <Navbar
        onOpenNewEvent={handleOpenNewEvent}
        onOpenICS={() => setIcsModalOpen(true)}
        onOpenBiometrics={() => setBiometricsModalOpen(true)}
        onOpenCategories={() => setCategoryModalOpen(true)}
        onOpenImageScanner={() => setImageScannerOpen(true)}
        onOpenWidget={() => setWidgetModalOpen(true)}
        onSelectEvent={handleSelectEvent}
        onNavigateToDate={(d) => {
          setActiveTab('calendar');
          setCalendarNavDate(d);
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {currentUser ? (
          <>
            {/* Biometric encouragement banner if not enrolled and hardware supports it */}
            {!isBiometricEnrolled && isBiometricSupported && !bannerDismissed && (
              <div className="mb-5 p-4 rounded-2xl bg-zinc-950 border border-yellow-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl shadow-black/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-yellow-500/30 text-yellow-400 flex items-center justify-center shrink-0">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Protege tu sesión local con Biometría (WebAuthn)</span>
                      <span className="text-[10px] bg-yellow-400/20 text-yellow-400 px-2 py-0.2 rounded-full font-bold border border-yellow-500/30">
                        Recomendado
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Desbloquea instantáneamente tu calendario con Touch ID, Face ID o Windows Hello
                      sin volver a ingresar contraseñas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setBannerDismissed(true)}
                    className="text-xs text-yellow-400/70 hover:text-white px-2.5 py-1.5 cursor-pointer"
                  >
                    Más tarde
                  </button>
                  <button
                    onClick={() => setBiometricsModalOpen(true)}
                    className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black shadow-md shadow-yellow-400/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Configurar ahora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* HUD Container: Minimalist aesthetic dark glass with warm yellow accents */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-6 bg-gradient-to-r from-neutral-900/95 via-zinc-900/95 to-neutral-900/95 backdrop-blur-2xl border border-yellow-500/35 ring-1 ring-yellow-400/15 p-2 sm:p-2.5 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06),0_0_20px_rgba(234,179,8,0.08)]">
              {/* Left: Tab Selector (Calendario vs Agenda) */}
              <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-yellow-500/25 ring-1 ring-yellow-400/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendar')}
                  className={`h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-extrabold shadow-md shadow-yellow-400/30'
                      : 'text-yellow-400/80 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <CalendarIcon className={`w-3.5 h-3.5 ${activeTab === 'calendar' ? 'text-black' : 'text-yellow-400'}`} />
                  <span>Calendario</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('agenda')}
                  className={`h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'agenda'
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-extrabold shadow-md shadow-yellow-400/30'
                      : 'text-yellow-400/80 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'agenda' ? 'text-black' : 'text-yellow-400'}`} />
                  <span>Agenda</span>
                </button>
              </div>

              {/* Center: Category Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className={`h-8 sm:h-9 inline-flex items-center gap-2 px-3 sm:px-3.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 text-xs font-bold border ${
                    selectedCategory !== 'all'
                      ? 'bg-yellow-400/15 text-yellow-300 border-yellow-400/60 ring-1 ring-yellow-400/20 shadow-yellow-400/10'
                      : 'bg-neutral-900/90 hover:bg-neutral-800/90 text-yellow-300/90 hover:text-white border border-yellow-500/30 hover:border-yellow-400/50'
                  }`}
                  title="Filtrar eventos por categoría"
                >
                  <Filter className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span className="flex items-center gap-1.5 max-w-[130px] sm:max-w-[170px] truncate">
                    {selectedCategory !== 'all' && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black"
                        style={{ backgroundColor: activeCategoryColor }}
                      />
                    )}
                    <span className="truncate">
                      {selectedCategory === 'all' ? 'Todas las categorías' : selectedCategory}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-yellow-400/80 transition-transform duration-200 shrink-0 ${
                      filterDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {filterDropdownOpen && (
                  <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-64 rounded-2xl bg-neutral-950/98 backdrop-blur-2xl border border-yellow-500/40 ring-1 ring-yellow-400/20 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(234,179,8,0.15)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-neutral-800/90 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-yellow-400/90">
                        Filtrar por categoría
                      </span>
                      {selectedCategory !== 'all' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('all');
                            setFilterDropdownOpen(false);
                          }}
                          className="text-[10px] text-yellow-400 hover:text-white font-bold cursor-pointer transition-colors"
                        >
                          Mostrar todas
                        </button>
                      )}
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-yellow-500/30">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all');
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          selectedCategory === 'all'
                            ? 'bg-yellow-400/15 text-yellow-300 border border-yellow-500/30'
                            : 'text-slate-300 hover:text-white hover:bg-neutral-800/80'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80 border border-yellow-400/50" />
                          <span>Todas las categorías</span>
                        </span>
                        {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                      </button>

                      {allCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.name);
                            setFilterDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                            selectedCategory === cat.name
                              ? 'bg-yellow-400/15 text-yellow-300 border border-yellow-500/30'
                              : 'text-slate-300 hover:text-white hover:bg-neutral-800/80'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="truncate">{cat.name}</span>
                          </span>
                          {selectedCategory === cat.name && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-neutral-800/90 mt-1.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterDropdownOpen(false);
                          setCategoryModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-yellow-400 hover:text-yellow-300 hover:bg-neutral-900 border border-yellow-500/25 transition-colors cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Gestionar categorías</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Quick Action Buttons */}
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => {
                    setAgendaModalDate(undefined);
                    setTaskModalOpen(true);
                  }}
                  className="h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 text-yellow-300 hover:text-white border border-yellow-500/30 hover:border-yellow-400/50 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                  title="Añadir tarea a la agenda"
                >
                  <Plus className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>+ Tarea</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenNewEvent}
                  className="h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-black font-extrabold text-xs transition-all cursor-pointer shadow-md shadow-yellow-400/30 active:scale-95 whitespace-nowrap"
                  title="Añadir nuevo evento al calendario"
                >
                  <Plus className="w-3.5 h-3.5 text-black stroke-[3] shrink-0" />
                  <span>+ Evento</span>
                </button>
              </div>
            </div>

            {/* Active Tab Component */}
            {activeTab === 'calendar' ? (
              <CalendarView
                onSelectDate={handleSelectDate}
                onSelectEvent={handleSelectEvent}
                onOpenCategoryManager={() => setCategoryModalOpen(true)}
                onOpenImageScanner={() => setImageScannerOpen(true)}
                onOpenNewTask={(dateStr) => {
                  setAgendaModalDate(dateStr);
                  setTaskModalOpen(true);
                }}
                navigateToDate={calendarNavDate}
              />
            ) : (
              <AgendaView
                onOpenImageScanner={() => setImageScannerOpen(true)}
              />
            )}
          </>
        ) : (
          /* Welcome Hero for Unauthenticated User */
          <div className="py-12 sm:py-20 flex flex-col items-center text-center max-w-2xl mx-auto">
            <AppLogo className="w-24 h-24 mb-6 shadow-2xl" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Bienvenido a <span className="text-yellow-400">Calendario Derecho Pro</span>
            </h1>
            <p className="text-base text-slate-300 mt-3 leading-relaxed">
              Tu calendario completamente privado en Modo Oscuro, Blanco y Amarillo. Diseñado con FullCalendar, desbloqueo biométrico e instalación como widget en tu pantalla de inicio móvil.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <AuthModal isOpen={true} />
            </div>

            {/* Architecture pill cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 w-full text-left">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-yellow-500/30">
                <Shield className="w-5 h-5 text-yellow-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Privacidad Total</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Acceso exclusivo a tu agenda con aislamiento de seguridad local garantizado.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-yellow-500/30">
                <Fingerprint className="w-5 h-5 text-yellow-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Biometría WebAuthn</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Desbloqueo rápido mediante huella dactilar o reconocimiento facial.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-yellow-500/30">
                <CalendarIcon className="w-5 h-5 text-yellow-400 mb-2" />
                <h4 className="text-xs font-bold text-white">FullCalendar + ical.js</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Vistas mes, semana, día y exportación/importación ICS completa.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <EventModal
        isOpen={eventModalOpen}
        event={selectedEvent}
        onClose={() => {
          setEventModalOpen(false);
          setSelectedEvent(null);
        }}
        onOpenCategoryManager={() => setCategoryModalOpen(true)}
      />

      <ICSImportModal
        isOpen={icsModalOpen}
        onClose={() => setIcsModalOpen(false)}
      />

      <BiometricSettingsModal
        isOpen={biometricsModalOpen}
        onClose={() => setBiometricsModalOpen(false)}
      />

      <CategoryManagerModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
      />

      <ImageScheduleScannerModal
        isOpen={imageScannerOpen}
        onClose={() => setImageScannerOpen(false)}
      />

      {/* Mobile Home Screen Widget Installer Modal */}
      <HomeScreenWidgetModal
        isOpen={widgetModalOpen}
        onClose={() => setWidgetModalOpen(false)}
        onOpenNewEvent={handleOpenNewEvent}
        onOpenNewTask={(dateStr) => {
          setAgendaModalDate(dateStr);
          setTaskModalOpen(true);
        }}
        onNavigateToCalendar={(d) => {
          setActiveTab('calendar');
          setCalendarNavDate(d);
        }}
      />

      {/* Agenda Task Modal for creating/editing study tasks directly */}
      <AgendaModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setAgendaModalDate(undefined);
        }}
        defaultDate={agendaModalDate}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-black/90 py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppLogo className="w-5 h-5" />
            <span className="font-semibold text-slate-300">hecho por Jorge Sevilla</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleForceUpdate}
              title="Borra la caché del navegador y recarga la versión más reciente"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-yellow-500/20 text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer text-[11px] font-semibold"
            >
              <RefreshCw className="w-3 h-3 text-yellow-400" />
              <span>Forzar última versión</span>
            </button>
            <div className="flex items-center gap-1.5 text-yellow-400 font-semibold">
              <Shield className="w-3.5 h-3.5 text-yellow-400" />
              <span>informacion guardada en local no se sube informacion a la nube</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CalendarProvider>
        <AgendaProvider>
          <NotificationProvider>
            <CalendarApp />
          </NotificationProvider>
        </AgendaProvider>
      </CalendarProvider>
    </AuthProvider>
  );
}
