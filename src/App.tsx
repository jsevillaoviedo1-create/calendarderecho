/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CalendarProvider } from './context/CalendarContext';
import { AgendaProvider } from './context/AgendaContext';
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
} from 'lucide-react';

function CalendarApp() {
  const { currentUser, loading, isBiometricEnrolled, isBiometricSupported } = useAuth();

  // Tab state: 'calendar' | 'agenda'
  const [activeTab, setActiveTab] = useState<'calendar' | 'agenda'>('calendar');

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

            {/* HUD Container: Responsive with flex-wrap, auto margins, black background, yellow tones and todo correcto icon */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-6 bg-black border border-yellow-500/40 p-2 sm:p-3 rounded-2xl shadow-xl shadow-black/90 my-auto">
              {/* Tab Selector (Calendario vs Agenda) */}
              <div className="flex items-center gap-1.5 bg-black p-1 rounded-xl border border-yellow-500/30 w-full sm:w-auto flex-1 sm:flex-none my-auto mx-auto sm:mx-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendar')}
                  className={`flex-1 sm:flex-initial h-10 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer my-auto ${
                    activeTab === 'calendar'
                      ? 'bg-yellow-400 text-black font-extrabold shadow-md shadow-yellow-400/25'
                      : 'text-yellow-400/80 hover:text-yellow-300 hover:bg-neutral-900'
                  }`}
                >
                  <CalendarIcon className={`w-4 h-4 ${activeTab === 'calendar' ? 'text-black' : 'text-yellow-400'}`} />
                  <span>Calendario</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('agenda')}
                  className={`flex-1 sm:flex-initial h-10 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer my-auto ${
                    activeTab === 'agenda'
                      ? 'bg-yellow-400 text-black font-extrabold shadow-md shadow-yellow-400/25'
                      : 'text-yellow-400/80 hover:text-yellow-300 hover:bg-neutral-900'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${activeTab === 'agenda' ? 'text-black' : 'text-yellow-400'}`} />
                  <span>Agenda (Día a Día)</span>
                </button>
              </div>

              {/* Status Badge "Todo correcto" with check icon and yellow/black theme */}
              <div className="flex items-center justify-center gap-2 h-10 px-3.5 py-2 rounded-xl bg-black border border-yellow-500/40 text-xs font-bold text-yellow-400 w-full sm:w-auto my-auto mx-auto sm:mx-0 shadow-inner shrink-0">
                <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>Todo correcto</span>
              </div>

              {/* HUD Action Buttons - Responsive with flex-wrap and auto margins */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto my-auto mx-auto sm:mx-0 sm:ml-auto">
                {/* Button specifically to install/put widget onto mobile home screen */}
                <button
                  type="button"
                  onClick={() => setWidgetModalOpen(true)}
                  className="flex-1 sm:flex-none h-10 inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-black hover:bg-neutral-900 text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap my-auto"
                  title="Poner Widget en Pantalla de Inicio del móvil"
                >
                  <Smartphone className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span className="inline sm:hidden">Widget en Inicio</span>
                  <span className="hidden sm:inline">Poner Widget en Inicio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAgendaModalDate(undefined);
                    setTaskModalOpen(true);
                  }}
                  className="flex-1 sm:flex-none h-10 inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-black hover:bg-neutral-900 text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap my-auto"
                  title="Añadir tarea a la agenda"
                >
                  <Plus className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>+ Tarea</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenNewEvent}
                  className="flex-1 sm:flex-none h-10 inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs transition-all cursor-pointer shadow-md shadow-yellow-400/25 active:scale-95 whitespace-nowrap my-auto"
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
