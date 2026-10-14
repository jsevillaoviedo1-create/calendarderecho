import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X, Monitor, Sparkles } from 'lucide-react';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed or running as standalone app, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Instalar Calendario Derecho Pro como aplicación en tu PC o móvil"
        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
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
          title="Instalar en iPhone / iPad"
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 text-white shadow-lg shadow-indigo-600/30">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-white text-center">Instalar en iPhone o iPad</h3>
              <p className="text-xs text-slate-400 text-center mt-1 mb-5">
                Disfruta de Calendario Derecho Pro a pantalla completa y con desbloqueo Face ID / Touch ID.
              </p>

              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <p className="text-slate-300">
                    En Safari, pulsa el botón de <strong>Compartir</strong>{' '}
                    <Share className="w-3.5 h-3.5 inline text-indigo-400 ml-1" /> en la barra inferior.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <p className="text-slate-300">
                    Desplázate hacia abajo y selecciona{' '}
                    <strong className="text-white">Añadir a la pantalla de inicio</strong>{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 ml-1" />.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <p className="text-slate-300">
                    Pulsa <strong className="text-white">Añadir</strong> en la esquina superior derecha.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-5 py-2.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white text-xs shadow-md transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback indicator for desktop browsers where prompt isn't fired yet
  return (
    <button
      onClick={() => {
        alert('Para instalar Calendario Derecho Pro en tu PC o Mac, haz clic en el icono de instalación ⊕ en la barra de direcciones de tu navegador (Chrome o Edge).');
      }}
      title="Instalar aplicación en PC"
      className="hidden lg:flex px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-all items-center gap-1.5 cursor-pointer shrink-0"
    >
      <Monitor className="w-3.5 h-3.5 text-indigo-400" />
      <span>Instalar en PC</span>
    </button>
  );
}
