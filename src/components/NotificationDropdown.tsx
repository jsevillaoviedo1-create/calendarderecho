import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  Check,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    fcmEnabled,
    enableNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEnableFCM = async () => {
    setEnabling(true);
    setErrorMsg(null);
    try {
      const res = await enableNotifications();
      if (!res.success) {
        setErrorMsg(res.error || 'No se pudieron activar las notificaciones.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al solicitar permisos.');
    } finally {
      setEnabling(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Centro de Notificaciones y Push FCM"
        className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all cursor-pointer shadow-sm active:scale-95"
      >
        <Bell className="w-4 h-4 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse shadow-sm shadow-amber-500/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-4 pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  title="Marcar todas como leídas"
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearNotifications()}
                  title="Limpiar todas"
                  className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* FCM Push Banner if not enabled */}
          {!fcmEnabled && (
            <div className="m-3 p-3 bg-gradient-to-r from-amber-950/80 to-purple-950/60 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">Notificaciones Push (FCM)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Recibe avisos antes de que comiencen tus reuniones o cuando haya cambios importantes.
                  </p>
                  {errorMsg && <p className="text-[10px] text-red-400 mt-1">{errorMsg}</p>}
                  <button
                    onClick={handleEnableFCM}
                    disabled={enabling}
                    className="mt-2 text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    {enabling ? 'Activando...' : 'Permitir Notificaciones'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of notifications */}
          <div className="max-h-72 overflow-y-auto px-2 py-1 space-y-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No hay notificaciones recientes</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Te avisaremos cuando se acerque un evento</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                    n.read
                      ? 'bg-slate-950/30 border-transparent text-slate-400'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.read ? 'bg-transparent' : 'bg-amber-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${n.read ? 'text-slate-300' : 'text-white'}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 break-words">{n.body}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                          {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n.id);
                        }}
                        title="Marcar como leída"
                        className="text-slate-500 hover:text-amber-400 p-1"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pt-2.5 mt-1 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Firebase Cloud Messaging</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
