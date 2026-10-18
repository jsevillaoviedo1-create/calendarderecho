import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppLogo } from './AppLogo';
import { MobileDayWidget } from './MobileDayWidget';
import {
  X,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Download,
  Info,
  Calendar,
  Plus,
  BookOpen,
  Layers,
} from 'lucide-react';

interface HomeScreenWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewEvent: (prefillDate?: string) => void;
  onOpenNewTask: (prefillDate?: string) => void;
  onNavigateToCalendar?: (dateStr: string) => void;
}

export function HomeScreenWidgetModal({
  isOpen,
  onClose,
  onOpenNewEvent,
  onOpenNewTask,
  onNavigateToCalendar,
}: HomeScreenWidgetModalProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);
  const [modalTab, setModalTab] = useState<'widget' | 'guide'>('widget');

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        setInstallSuccess(true);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-neutral-900/98 via-zinc-900/98 to-neutral-900/98 border border-yellow-500/40 ring-1 ring-yellow-400/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_30px_rgba(234,179,8,0.15)] overflow-hidden flex flex-col max-h-[92vh] text-white backdrop-blur-2xl">
        {/* Glow ambient effects */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-yellow-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-yellow-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header with HUD Aesthetic */}
        <div className="px-5 py-4 border-b border-yellow-500/25 bg-neutral-950/70 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-yellow-400/35 text-black shrink-0">
              <Smartphone className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Widget en Pantalla de Inicio Móvil
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-400 text-black shrink-0">
                  INTERACTIVO
                </span>
              </div>
              <p className="text-xs text-yellow-300/80">
                Visualiza las tareas del día y baja para ver los siguientes días directamente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-yellow-400/70 hover:text-white hover:bg-neutral-800 border border-transparent hover:border-yellow-500/30 transition-colors cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Widget Live vs Instalación */}
        <div className="px-5 pt-3 pb-2 bg-neutral-950/40 border-b border-yellow-500/15 flex items-center gap-2 shrink-0 z-10">
          <button
            type="button"
            onClick={() => setModalTab('widget')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              modalTab === 'widget'
                ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-extrabold shadow-sm'
                : 'text-yellow-300/80 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Widget Interactivo</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('guide')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              modalTab === 'guide'
                ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-extrabold shadow-sm'
                : 'text-yellow-300/80 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cómo Poner en Teléfono</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4 relative z-10">
          {modalTab === 'widget' ? (
            /* Live Interactive Widget Component */
            <div className="space-y-4">
              <MobileDayWidget
                isOpen={true}
                onOpenNewEvent={onOpenNewEvent}
                onOpenNewTask={onOpenNewTask}
                onNavigateToCalendar={(d) => {
                  if (onNavigateToCalendar) onNavigateToCalendar(d);
                  onClose();
                }}
                isFloatingModal={false}
              />
            </div>
          ) : (
            /* Installation instructions for Home Screen */
            <div className="space-y-4 text-white">
              {/* Visual Preview */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-yellow-500/30 flex flex-col items-center text-center shadow-inner">
                <p className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider mb-3">
                  Icono en tu pantalla de inicio móvil
                </p>

                <div className="relative p-4 rounded-2xl bg-neutral-900 border border-yellow-500/25 flex flex-col items-center shadow-inner max-w-xs w-full">
                  <div className="relative group">
                    <AppLogo className="w-20 h-20 shadow-xl" />
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-400"></span>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white mt-2">Calendario Derecho</span>
                  <span className="text-[10px] text-yellow-400 font-semibold">Widget & Tareas del Día</span>
                </div>

                <p className="text-xs text-slate-300 mt-3 max-w-md">
                  Al añadirlo a tu pantalla de inicio, tienes acceso directo en un toque a todas tus tareas y eventos del día sin necesidad de buscar en el navegador.
                </p>
              </div>

              {/* Install Button if available */}
              {isInstallable && !installSuccess && !isInstalled && (
                <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/40 text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>Añadir a Pantalla de Inicio Ahora</span>
                  </button>
                  <p className="text-[11px] text-yellow-300/80">
                    Pulsa para abrir el instalador del sistema de tu teléfono
                  </p>
                </div>
              )}

              {(installSuccess || isInstalled) && (
                <div className="p-3.5 rounded-xl bg-yellow-400/15 border border-yellow-400/40 flex items-center gap-3 text-left">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">¡App lista en tu pantalla de inicio!</p>
                    <p className="text-[11px] text-yellow-300/80">
                      Busca el icono de la balanza amarilla en tu teléfono para abrir el widget al instante.
                    </p>
                  </div>
                </div>
              )}

              {/* Step by step instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-yellow-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pasos para {isIOS ? 'iPhone (Safari)' : 'Android (Chrome / Samsung Internet)'}</span>
                </h4>

                {isIOS ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-yellow-500/20 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-300 font-bold text-xs flex items-center justify-center shrink-0 border border-yellow-500/40">
                        1
                      </span>
                      <p className="text-xs text-slate-300">
                        Pulsa el botón <strong>Compartir</strong> en la barra inferior de Safari (el icono de un recuadro con flecha hacia arriba).
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-yellow-500/20 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-300 font-bold text-xs flex items-center justify-center shrink-0 border border-yellow-500/40">
                        2
                      </span>
                      <p className="text-xs text-slate-300">
                        Desplaza el menú hacia abajo y toca en <strong>"Añadir a la pantalla de inicio"</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-yellow-500/20 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-300 font-bold text-xs flex items-center justify-center shrink-0 border border-yellow-500/40">
                        1
                      </span>
                      <p className="text-xs text-slate-300">
                        Toca el menú de <strong>tres puntos (⋮)</strong> en la esquina superior derecha del navegador.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-yellow-500/20 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-300 font-bold text-xs flex items-center justify-center shrink-0 border border-yellow-500/40">
                        2
                      </span>
                      <p className="text-xs text-slate-300">
                        Selecciona <strong>"Añadir a pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-yellow-500/20 bg-neutral-950/70 flex items-center justify-between shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold text-yellow-400/80 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          {modalTab === 'guide' && (
            <button
              type="button"
              onClick={() => setModalTab('widget')}
              className="px-3.5 py-1.5 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-yellow-300 hover:text-white border border-yellow-500/35 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Ver Widget Interactivo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
