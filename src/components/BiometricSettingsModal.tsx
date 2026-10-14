import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  X,
  Lock,
  Smartphone,
  Cpu,
} from 'lucide-react';

interface BiometricSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BiometricSettingsModal({ isOpen, onClose }: BiometricSettingsModalProps) {
  const {
    userProfile,
    isBiometricSupported,
    isBiometricEnrolled,
    enrollBiometrics,
    disableBiometrics,
    lockSession,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleEnroll = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await enrollBiometrics();
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: '¡Biometría registrada exitosamente! Ahora puedes bloquear y desbloquear tu sesión con tu huella o rostro.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'No se pudo vincular la biometría local.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error inesperado al registrar biometría.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      await disableBiometrics();
      setStatusMessage({
        type: 'success',
        text: 'Desbloqueo biométrico desactivado.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error al desactivar biometría.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImmediateLock = () => {
    onClose();
    lockSession();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Seguridad Biométrica (WebAuthn)</h3>
            <p className="text-xs text-slate-400">
              Desbloqueo local rápido con Touch ID, Face ID o Windows Hello.
            </p>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Device Compatibility Card */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">
                Compatibilidad de hardware WebAuthn
              </span>
            </div>
            {isBiometricSupported ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Compatible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3 h-3" /> No detectado
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Utiliza el autenticador de plataforma integrado en tu dispositivo (chip Secure Enclave /
            TPM) sin enviar tus datos biométricos a la nube. Tu autenticación principal sigue siendo
            tu cuenta de Google o Email/Contraseña.
          </p>
        </div>

        {/* Current State & Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60">
            <div>
              <p className="text-sm font-medium text-white">Estado del desbloqueo biométrico</p>
              <p className="text-xs text-slate-400">
                {isBiometricEnrolled
                  ? 'Activo en este dispositivo y cuenta.'
                  : 'No configurado aún.'}
              </p>
            </div>

            {isBiometricEnrolled ? (
              <button
                onClick={handleDisable}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Desactivar
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Fingerprint className="w-4 h-4" />
                <span>{loading ? 'Activando...' : 'Activar Biometría'}</span>
              </button>
            )}
          </div>

          {isBiometricEnrolled && (
            <div className="pt-2">
              <button
                onClick={handleImmediateLock}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Probar bloqueo de sesión ahora</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-slate-400 text-xs">
          <span>Credencial: {userProfile?.biometricCredentialId ? 'Enrolada' : 'Ninguna'}</span>
          <button
            onClick={onClose}
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
