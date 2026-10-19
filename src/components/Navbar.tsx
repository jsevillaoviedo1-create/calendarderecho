import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCalendar } from '../context/CalendarContext';
import { CalendarEventItem } from '../types/calendar';
import { EventSearchBar } from './EventSearchBar';
import { AppLogo } from './AppLogo';
import {
  Calendar as CalendarIcon,
  Search,
  Plus,
  Upload,
  Lock,
  Fingerprint,
  LogOut,
  User,
  Shield,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Tag,
  BookOpen,
  Camera,
  Smartphone,
  X,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenNewEvent: () => void;
  onOpenICS: () => void;
  onOpenBiometrics: () => void;
  onOpenCategories?: () => void;
  onOpenImageScanner?: () => void;
  onOpenWidget?: () => void;
  onSelectEvent?: (event: CalendarEventItem) => void;
  onNavigateToDate?: (dateStr: string) => void;
  activeTab?: 'calendar' | 'agenda' | 'widget';
  onSelectTab?: (tab: 'calendar' | 'agenda' | 'widget') => void;
}

export function Navbar({
  onOpenNewEvent,
  onOpenICS,
  onOpenBiometrics,
  onOpenCategories,
  onOpenImageScanner,
  onOpenWidget,
  onSelectEvent,
  onNavigateToDate,
  activeTab = 'calendar',
  onSelectTab,
}: NavbarProps) {
  const { currentUser, userProfile, logout, lockSession, isBiometricEnrolled } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-black/95 backdrop-blur-md border-b border-yellow-500/20 shadow-md shadow-black/80 transition-all">
      {/* Primary Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* If mobile search is open, show full-width search input instead */}
        {mobileSearchOpen ? (
          <div className="flex-1 flex items-center gap-2 animate-in fade-in duration-150">
            <div className="flex-1">
              <EventSearchBar
                onSelectEvent={(ev) => {
                  setMobileSearchOpen(false);
                  onSelectEvent?.(ev);
                }}
                onNavigateToDate={(d) => {
                  setMobileSearchOpen(false);
                  onNavigateToDate?.(d);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 rounded-xl text-yellow-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
              title="Cerrar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            {/* Left: Brand with official 3D Logo */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <AppLogo className="w-8 h-8 sm:w-10 sm:h-10" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="font-extrabold text-xs sm:text-base tracking-tight text-white whitespace-nowrap">
                    <span className="sm:hidden">CalDerecho</span>
                    <span className="hidden sm:inline">Calendario Derecho</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-yellow-400 text-black">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-yellow-300/80 font-medium hidden sm:block">
                  Modo Oscuro & Privado
                </p>
              </div>
            </div>

            {/* Center: Desktop Search Bar */}
            <div className="flex-1 max-w-sm lg:max-w-md hidden md:block mx-2">
              <EventSearchBar
                onSelectEvent={onSelectEvent}
                onNavigateToDate={onNavigateToDate}
              />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
              {/* Mobile search toggle button */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                title="Buscar citas y eventos"
                className="p-2 rounded-xl text-yellow-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-yellow-500/30 transition-colors md:hidden cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Center/Right: Tabs Switcher (Calendario vs Agenda) */}
              {onSelectTab && (
                <div className="flex items-center bg-zinc-950 p-0.5 sm:p-1 rounded-xl border border-yellow-500/30 text-xs shadow-inner shrink-0">
                  <button
                    onClick={() => onSelectTab('calendar')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer text-xs ${
                      activeTab === 'calendar'
                        ? 'bg-yellow-400 text-black shadow-sm font-extrabold'
                        : 'text-yellow-400/80 hover:text-white'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden xs:inline">Calendario</span>
                    <span className="xs:hidden">Cal</span>
                  </button>
                  <button
                    onClick={() => onSelectTab('agenda')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer text-xs ${
                      activeTab === 'agenda'
                        ? 'bg-yellow-400 text-black shadow-sm font-extrabold'
                        : 'text-yellow-400/80 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>Agenda</span>
                  </button>
                </div>
              )}

              {/* Widget to Home Screen Button */}
              {onOpenWidget && (
                <button
                  type="button"
                  onClick={onOpenWidget}
                  title="Poner Widget en Pantalla de Inicio del móvil"
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                  <span className="hidden sm:inline">Widget en Inicio</span>
                </button>
              )}

              {/* PWA Install Button */}
              <div className="hidden sm:block">
                <PWAInstallButton />
              </div>

              {/* Notifications Dropdown */}
              {currentUser && <NotificationDropdown />}

              {/* Scan Schedule Photo (AI) - Desktop only */}
              {onOpenImageScanner && (
                <button
                  onClick={onOpenImageScanner}
                  title="Pegar o subir foto de un horario o cuadrante para añadirlo con IA"
                  className="hidden lg:flex p-2 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-yellow-500/30 text-yellow-400 hover:text-yellow-300 transition-all items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <Camera className="w-4 h-4 text-yellow-400" />
                  <span className="hidden xl:inline">Foto Cuadrante</span>
                </button>
              )}

              {/* Import ICS - Desktop only */}
              <button
                onClick={onOpenICS}
                title="Importar calendario desde archivo .ICS"
                className="hidden lg:flex p-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-all items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Upload className="w-4 h-4 text-yellow-400" />
                <span className="hidden xl:inline">.ICS</span>
              </button>

              {/* New Event Button */}
              <button
                onClick={onOpenNewEvent}
                className="py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-xl text-xs font-extrabold bg-yellow-400 hover:bg-yellow-300 text-black shadow-md shadow-yellow-400/25 transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 text-black stroke-[2.5]" />
                <span className="hidden sm:inline">+ Evento</span>
              </button>

              {/* User Profile / Menu */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-yellow-500/30 text-white transition-all cursor-pointer"
                  >
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || 'Avatar'}
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-yellow-400"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-yellow-400 text-black font-extrabold flex items-center justify-center text-xs">
                        {(userProfile?.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-yellow-400 hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-gradient-to-b from-neutral-900/98 via-zinc-900/98 to-neutral-900/98 backdrop-blur-2xl border border-yellow-500/40 ring-1 ring-yellow-400/20 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_28px_rgba(234,179,8,0.12)] py-2 z-50 animate-in fade-in duration-150"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-yellow-500/25 bg-neutral-950/60">
                        <p className="text-xs font-bold text-white truncate">
                          {userProfile?.displayName || currentUser.displayName || 'Usuario'}
                        </p>
                        <p className="text-[11px] text-yellow-300/80 truncate">{currentUser.email}</p>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-yellow-400 font-semibold">
                          <Shield className="w-3 h-3 text-yellow-400" />
                          <span>Sesión Privada Local</span>
                        </div>
                      </div>

                      <div className="p-1 space-y-0.5">
                        {onOpenWidget && (
                          <button
                            onClick={onOpenWidget}
                            className="w-full px-3 py-2 text-xs text-left text-slate-200 hover:text-white hover:bg-neutral-800/80 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-transparent hover:border-yellow-500/30"
                          >
                            <Smartphone className="w-4 h-4 text-yellow-400" />
                            <div>
                              <span className="font-bold text-white">Poner Widget en Inicio</span>
                              <p className="text-[10px] text-yellow-300/80">Instalar icono en el móvil</p>
                            </div>
                          </button>
                        )}

                        {onOpenImageScanner && (
                          <button
                            onClick={onOpenImageScanner}
                            className="w-full px-3 py-2 text-xs text-left text-slate-200 hover:text-white hover:bg-neutral-800/80 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-transparent hover:border-yellow-500/30"
                          >
                            <Camera className="w-4 h-4 text-yellow-400" />
                            <div>
                              <span className="font-semibold text-white">Foto Cuadrante (IA)</span>
                              <p className="text-[10px] text-yellow-300/70">Escanear foto de horario</p>
                            </div>
                          </button>
                        )}

                        {onOpenCategories && (
                          <button
                            onClick={onOpenCategories}
                            className="w-full px-3 py-2 text-xs text-left text-slate-200 hover:text-white hover:bg-neutral-800/80 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-transparent hover:border-yellow-500/30"
                          >
                            <Tag className="w-4 h-4 text-yellow-400" />
                            <div>
                              <span className="font-semibold text-white">Gestionar Categorías</span>
                              <p className="text-[10px] text-yellow-300/70">Crear y personalizar etiquetas</p>
                            </div>
                          </button>
                        )}

                        <button
                          onClick={onOpenICS}
                          className="w-full px-3 py-2 text-xs text-left text-slate-200 hover:text-white hover:bg-neutral-800/80 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-transparent hover:border-yellow-500/30"
                        >
                          <Upload className="w-4 h-4 text-yellow-400" />
                          <div>
                            <span className="font-semibold text-white">Importar archivo .ICS</span>
                            <p className="text-[10px] text-yellow-300/70">Sincronizar calendario externo</p>
                          </div>
                        </button>

                        <button
                          onClick={onOpenBiometrics}
                          className="w-full px-3 py-2 text-xs text-left text-slate-200 hover:text-white hover:bg-neutral-800/80 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-transparent hover:border-yellow-500/30"
                        >
                          <Fingerprint className="w-4 h-4 text-yellow-400" />
                          <div>
                            <span className="font-semibold text-white">Seguridad Biométrica</span>
                            <p className="text-[10px] text-yellow-300/70">
                              {isBiometricEnrolled ? 'Enrolado en este equipo' : 'Configurar WebAuthn'}
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={lockSession}
                          className="w-full px-3 py-2 text-xs text-left text-slate-200 hover:text-white hover:bg-neutral-800/80 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-transparent hover:border-yellow-500/30"
                        >
                          <Lock className="w-4 h-4 text-yellow-400" />
                          <span className="font-semibold text-white">Bloquear Pantalla</span>
                        </button>

                        <button
                          onClick={() => logout()}
                          className="w-full px-3 py-2 text-xs text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl flex items-center gap-2 transition-colors cursor-pointer border border-transparent"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
