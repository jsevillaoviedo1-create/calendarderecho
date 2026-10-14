import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCalendar } from '../context/CalendarContext';
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
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenNewEvent: () => void;
  onOpenICS: () => void;
  onOpenBiometrics: () => void;
}

export function Navbar({ onOpenNewEvent, onOpenICS, onOpenBiometrics }: NavbarProps) {
  const { currentUser, userProfile, logout, lockSession, isBiometricEnrolled } = useAuth();
  const { searchQuery, setSearchQuery } = useCalendar();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">Calendario Derecho</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Privado & Seguro</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar eventos, ubicaciones o notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Notifications Dropdown */}
          {currentUser && <NotificationDropdown />}

          {/* Quick Lock Button */}
          {currentUser && (
            <button
              onClick={lockSession}
              title={
                isBiometricEnrolled
                  ? 'Bloquear sesión (desbloqueable con Touch ID / Face ID)'
                  : 'Bloquear sesión localmente'
              }
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              {isBiometricEnrolled ? (
                <Fingerprint className="w-4 h-4 text-indigo-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400" />
              )}
              <span className="hidden lg:inline">Bloquear</span>
            </button>
          )}

          {/* Import ICS */}
          <button
            onClick={onOpenICS}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Upload className="w-4 h-4 text-violet-400" />
            <span className="hidden sm:inline">Importar .ICS</span>
          </button>

          {/* New Event Button */}
          <button
            onClick={onOpenNewEvent}
            className="py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Evento</span>
          </button>

          {/* User Profile / Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-all cursor-pointer"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Avatar'}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs">
                    {(userProfile?.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in duration-150"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white truncate">
                      {userProfile?.displayName || currentUser.displayName || 'Usuario'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                      <Shield className="w-3 h-3" />
                      <span>Sesión Privada Local</span>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={onOpenBiometrics}
                      className="w-full px-3 py-2 text-xs text-left text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Fingerprint className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span>Seguridad Biométrica</span>
                        <p className="text-[10px] text-slate-400">
                          {isBiometricEnrolled ? 'Enrolado en este equipo' : 'Configurar WebAuthn'}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={lockSession}
                      className="w-full px-3 py-2 text-xs text-left text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Bloquear Pantalla</span>
                    </button>

                    <button
                      onClick={() => logout()}
                      className="w-full px-3 py-2 text-xs text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
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
      </div>
    </header>
  );
}
