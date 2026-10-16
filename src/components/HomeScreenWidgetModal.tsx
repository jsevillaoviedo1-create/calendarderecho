import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppLogo } from './AppLogo';
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
  BookOpen
} from 'lucide-react';

interface HomeScreenWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HomeScreenWidgetModal({ isOpen, onClose }: HomeScreenWidgetModalProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'auto' | 'android' | 'ios'>(isIOS ? 'ios' : 'android');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-black border border-yellow-500/40 rounded-3xl shadow-2xl shadow-yellow-500/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-yellow-500/20 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <AppLogo className="w-10 h-10" />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-white">
                  Poner Widget en Pantalla de Inicio
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-black">
                  Móvil
                </span>
              </div>
              <p className="text-xs text-yellow-300/80">
                Instala el widget con este icono directamente en tu teléfono
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-yellow-400/70 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-white">
          {/* Visual Preview of Home Screen Icon & Widget */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-yellow-500/30 flex flex-col items-center text-center">
            <p className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider mb-3">
              Vista previa en tu pantalla de inicio
            </p>

            <div className="relative p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col items-center shadow-inner max-w-xs w-full">
              {/* Phone App Icon */}
              <div className="relative group">
                <AppLogo className="w-20 h-20 shadow-xl" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-400"></span>
                </span>
              </div>
              <span className="text-xs font-bold text-white mt-2">CalDerecho</span>
              <span className="text-[10px] text-yellow-400 font-medium">Widget & Accesos Rápidos</span>

              {/* Quick shortcut preview */}
              <div className="w-full mt-3 pt-3 border-t border-neutral-800 grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-black/60 border border-yellow-500/20">
                  <Calendar className="w-3.5 h-3.5 text-yellow-400 mx-auto mb-0.5" />
                  <span className="text-[9px] text-white font-medium block">Agenda</span>
                </div>
                <div className="p-1.5 rounded-lg bg-black/60 border border-yellow-500/20">
                  <Plus className="w-3.5 h-3.5 text-yellow-400 mx-auto mb-0.5" />
                  <span className="text-[9px] text-white font-medium block">+ Evento</span>
                </div>
                <div className="p-1.5 rounded-lg bg-black/60 border border-yellow-500/20">
                  <BookOpen className="w-3.5 h-3.5 text-yellow-400 mx-auto mb-0.5" />
                  <span className="text-[9px] text-white font-medium block">+ Tarea</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3">
              Al colocarlo en tu pantalla de inicio, tienes acceso directo en un solo toque y menú de accesos rápidos al mantener pulsado el icono.
            </p>
          </div>

          {/* Action Button: One-Click Android/Chrome Install if available */}
          {isInstallable && !installSuccess && !isInstalled && (
            <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/40 text-center space-y-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/25 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Añadir a Pantalla de Inicio Ahora</span>
              </button>
              <p className="text-[11px] text-yellow-300/80">
                Pulsa para abrir el instalador del sistema del teléfono
              </p>
            </div>
          )}

          {/* Success state */}
          {(installSuccess || isInstalled) && (
            <div className="p-3.5 rounded-xl bg-yellow-400/15 border border-yellow-400/40 flex items-center gap-3 text-left">
              <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">¡App lista en tu pantalla de inicio!</p>
                <p className="text-[11px] text-yellow-300/80">
                  Busca el icono del calendario amarillo con el 15 en tu teléfono.
                </p>
              </div>
            </div>
          )}

          {/* Device Tabs (Android vs iOS instructions) */}
          <div>
            <div className="flex rounded-xl bg-zinc-950 p-1 border border-yellow-500/30 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'android'
                    ? 'bg-yellow-400 text-black'
                    : 'text-yellow-400/70 hover:text-white'
                }`}
              >
                Android (Chrome)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'ios'
                    ? 'bg-yellow-400 text-black'
                    : 'text-yellow-400/70 hover:text-white'
                }`}
              >
                iPhone / iPad (Safari)
              </button>
            </div>

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="space-y-3 bg-zinc-950/70 p-4 rounded-2xl border border-neutral-800 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="text-slate-200">
                    Pulsa los <strong>tres puntos verticales (⋮)</strong> en la esquina superior derecha del navegador Chrome.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="text-slate-200">
                    Selecciona <strong>"Añadir a la pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="text-slate-200">
                    Confirma pulsando <strong>"Añadir"</strong>. El icono oficial amarillo con el 15 aparecerá en tu escritorio móvil.
                  </p>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-3 bg-zinc-950/70 p-4 rounded-2xl border border-neutral-800 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="text-slate-200 flex items-center gap-1.5 flex-wrap">
                    <span>En Safari, pulsa el botón</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-yellow-400 font-bold border border-neutral-700">
                      <Share className="w-3.5 h-3.5" /> Compartir
                    </span>
                    <span>(icono cuadrado con flecha hacia arriba).</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="text-slate-200 flex items-center gap-1.5 flex-wrap">
                    <span>Desliza hacia abajo y pulsa</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-white font-bold border border-neutral-700">
                      <PlusSquare className="w-3.5 h-3.5 text-yellow-400" /> Añadir a pantalla de inicio
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="text-slate-200">
                    Pulsa <strong>"Añadir"</strong> arriba a la derecha. ¡El widget del calendario quedará fijado en tu pantalla de inicio!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-yellow-500/20 bg-zinc-950/90 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
