import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppLogo } from './AppLogo';
import { Download, Smartphone, Share, PlusSquare, X, Monitor, CheckCircle2 } from 'lucide-react';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // If already installed or running as standalone app, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Instalar Calendario Derecho Pro con el icono oficial en tu teléfono o PC"
        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-black shadow-md shadow-yellow-400/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
      >
        <Download className="w-3.5 h-3.5 text-black stroke-[2.5]" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Instalar en iPhone / iPad con el icono oficial"
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-black hover:bg-neutral-900 text-yellow-400 border border-yellow-500/40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-black border border-yellow-500/40 rounded-3xl shadow-2xl p-6 relative text-white">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-yellow-400/70 hover:text-white p-1 rounded-lg hover:bg-neutral-900 transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center mb-3">
                <AppLogo className="w-16 h-16" />
              </div>

              <h3 className="text-base font-extrabold text-white text-center">
                Instalar en iPhone o iPad
              </h3>
              <p className="text-xs text-yellow-300/80 text-center mt-1 mb-5">
                Añade el widget con este icono directamente a tu pantalla de inicio.
              </p>

              <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-yellow-500/30 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-extrabold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <p className="text-slate-200">
                    En Safari, pulsa el botón de <strong>Compartir</strong>{' '}
                    <Share className="w-3.5 h-3.5 inline text-yellow-400 ml-1" /> en la barra inferior.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-extrabold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <p className="text-slate-200">
                    Desplázate hacia abajo y selecciona{' '}
                    <strong className="text-white">Añadir a la pantalla de inicio</strong>{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-yellow-400 ml-1" />.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-extrabold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <p className="text-slate-200">
                    Pulsa <strong className="text-white">Añadir</strong> en la esquina superior derecha.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-5 py-2.5 rounded-xl font-extrabold bg-yellow-400 hover:bg-yellow-300 text-black text-xs shadow-md shadow-yellow-400/25 transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop browser flow (guide popup without alert())
  return (
    <>
      <button
        onClick={() => setShowDesktopGuide(true)}
        title="Instalar aplicación en PC o Mac"
        className="hidden lg:flex px-2.5 py-1.5 rounded-xl text-xs font-bold text-yellow-400 hover:text-yellow-300 bg-black hover:bg-neutral-900 border border-yellow-500/30 transition-all items-center gap-1.5 cursor-pointer shrink-0"
      >
        <Monitor className="w-3.5 h-3.5 text-yellow-400" />
        <span>Instalar en PC</span>
      </button>

      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-black border border-yellow-500/40 rounded-3xl shadow-2xl p-6 relative text-white">
            <button
              onClick={() => setShowDesktopGuide(false)}
              className="absolute top-4 right-4 text-yellow-400/70 hover:text-white p-1 rounded-lg hover:bg-neutral-900 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-3">
              <AppLogo className="w-16 h-16" />
            </div>

            <h3 className="text-base font-extrabold text-white text-center">
              Instalar en PC o Mac
            </h3>
            <p className="text-xs text-yellow-300/80 text-center mt-1 mb-4">
              Disfruta de Calendario Derecho Pro con acceso directo desde tu escritorio.
            </p>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-yellow-500/30 text-xs text-slate-300 space-y-2">
              <p>
                Haz clic en el icono de instalación <strong>⊕</strong> en la barra de direcciones de tu navegador (Chrome, Edge o Brave) arriba a la derecha.
              </p>
              <p className="text-yellow-400 font-semibold">
                La aplicación se abrirá en una ventana independiente con el nuevo icono.
              </p>
            </div>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="w-full mt-5 py-2.5 rounded-xl font-extrabold bg-yellow-400 hover:bg-yellow-300 text-black text-xs shadow-md shadow-yellow-400/25 transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
