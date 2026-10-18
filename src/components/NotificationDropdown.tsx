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
        className="relative p-2 rounded-xl text-yellow-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-yellow-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
      >
        <Bell className="w-4 h-4 text-yellow-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 text-[10px] font-extrabold text-black flex items-center justify-center animate-pulse shadow-sm shadow-yellow-400/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gradient-to-b from-neutral-900/98 via-zinc-900/98 to-neutral-900/98 backdrop-blur-2xl border border-yellow-500/40 ring-1 ring-yellow-400/20 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_28px_rgba(234,179,8,0.12)] py-3 z-50 animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-4 pb-3 border-b border-yellow-500/25 bg-neutral-950/60 -mt-3 pt-3 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-yellow-400/20 text-yellow-400 border border-yellow-500/30">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  title="Marcar todas como leídas"
                  className="text-yellow-400/80 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors text-xs"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearNotifications()}
                  title="Limpiar todas"
                  className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-neutral-800 transition-colors text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* FCM Push Banner if not enabled */}
          {!fcmEnabled && (
            <div className="m-3 p-3 bg-neutral-900/90 border border-yellow-500/30 rounded-xl shadow-inner">
              <div className="flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">Notificaciones Push (FCM)</p>
                  <p className="text-[11px] text-yellow-300/80 mt-0.5 leading-snug">
                    Recibe avisos antes de que comiencen tus clases o cuando haya cambios importantes.
                  </p>
                  {errorMsg && <p className="text-[10px] text-red-400 mt-1">{errorMsg}</p>}
                  <button
                    onClick={handleEnableFCM}
                    disabled={enabling}
                    className="mt-2 text-xs font-extrabold px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black shadow-md shadow-yellow-400/20 transition-all cursor-pointer disabled:opacity-60"
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
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-yellow-400" />
                <p className="text-xs font-semibold text-slate-400">No hay notificaciones recientes</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Te avisaremos cuando se acerque un evento</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                    n.read
                      ? 'bg-neutral-900/40 border-transparent text-slate-400'
                      : 'bg-neutral-900/80 border-yellow-500/30 text-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.read ? 'bg-transparent' : 'bg-yellow-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${n.read ? 'text-slate-300' : 'text-white'}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 break-words">{n.body}</p>
                        <span className="text-[10px] text-yellow-400/70 mt-1 block font-medium">
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
                        className="text-yellow-400/70 hover:text-yellow-300 p-1"
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
          <div className="px-4 pt-2.5 mt-1 border-t border-yellow-500/20 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-yellow-400/80 font-medium">
              <ShieldCheck className="w-3 h-3 text-yellow-400" />
              <span>Firebase Cloud Messaging</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-yellow-400 hover:text-white font-semibold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
