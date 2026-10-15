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
import { ICSImportModal } from './components/ICSImportModal';
import { BiometricLockModal } from './components/BiometricLockModal';
import { BiometricSettingsModal } from './components/BiometricSettingsModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
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
  const [bannerDismissed, setBannerDismissed] = useState(false);

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 animate-bounce">
          <CalendarIcon className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-medium text-slate-300">Cargando Calendario Derecho Pro...</p>
        <p className="text-xs text-slate-500 mt-1">Cargando tu calendario privado...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser ? (
          <>
            {/* Biometric encouragement banner if not enrolled and hardware supports it */}
            {!isBiometricEnrolled && isBiometricSupported && !bannerDismissed && (
              <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Protege tu sesión local con Biometría (WebAuthn)</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded-full font-semibold border border-emerald-500/30">
                        Recomendado
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Desbloquea instantáneamente tu calendario con Touch ID, Face ID o Windows Hello
                      sin volver a ingresar contraseñas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setBannerDismissed(true)}
                    className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5"
                  >
                    Más tarde
                  </button>
                  <button
                    onClick={() => setBiometricsModalOpen(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Configurar ahora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* View Switcher Bar (Calendario vs Agenda) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 bg-slate-900/60 border border-slate-800 p-2 sm:p-2.5 rounded-2xl">
              <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer flex-1 sm:flex-none ${
                    activeTab === 'calendar'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>Calendario</span>
                </button>
                <button
                  onClick={() => setActiveTab('agenda')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer flex-1 sm:flex-none ${
                    activeTab === 'agenda'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Agenda (Día a Día)</span>
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400 px-2">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Semanas Lun - Dom</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">1er y 2o Semestre</span>
              </div>
            </div>

            {/* Active Tab Component */}
            {activeTab === 'calendar' ? (
              <CalendarView
                onSelectDate={handleSelectDate}
                onSelectEvent={handleSelectEvent}
                onOpenCategoryManager={() => setCategoryModalOpen(true)}
              />
            ) : (
              <AgendaView />
            )}
          </>
        ) : (
          /* Welcome Hero for Unauthenticated User */
          <div className="py-12 sm:py-20 flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 mb-6">
              <CalendarIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Bienvenido a <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Calendario Derecho Pro</span>
            </h1>
            <p className="text-base text-slate-400 mt-3 leading-relaxed">
              Tu calendario completamente privado con FullCalendar, importación de archivos ICS y desbloqueo biométrico local.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <AuthModal isOpen={true} />
            </div>

            {/* Architecture pill cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 w-full text-left">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <Shield className="w-5 h-5 text-indigo-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Privacidad Total</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Acceso exclusivo a tu agenda con aislamiento de seguridad garantizado.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <Fingerprint className="w-5 h-5 text-violet-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Biometría WebAuthn</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Desbloqueo rápido mediante huella dactilar o reconocimiento facial.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <CalendarIcon className="w-5 h-5 text-emerald-400 mb-2" />
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">hecho por Jorge Sevilla</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>informacion guardada en local no se sube informacion a la nube</span>
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
