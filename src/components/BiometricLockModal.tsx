import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Fingerprint, Lock, KeyRound, LogOut, AlertCircle, ShieldCheck } from 'lucide-react';

export function BiometricLockModal() {
  const {
    isSessionLocked,
    userProfile,
    currentUser,
    unlockWithBiometrics,
    unlockWithPassword,
    logout,
  } = useAuth();

  const [usePasswordFallback, setUsePasswordFallback] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isSessionLocked) return null;

  const handleBiometricUnlock = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await unlockWithBiometrics();
      if (!res.success) {
        setError(res.error || 'No se pudo verificar la biometría.');
      }
    } catch (err: any) {
      setError(err.message || 'Error en desbloqueo biométrico.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Ingresa tu contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await unlockWithPassword(password);
      if (!res.success) {
        setError(res.error || 'Contraseña incorrecta.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al verificar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-black border border-yellow-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-center relative text-white">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-yellow-400/10 blur-2xl pointer-events-none rounded-full" />

        {/* Biometric Icon */}
        <div className="relative mx-auto w-20 h-20 mb-5">
          <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping opacity-50" />
          <div className="relative w-full h-full rounded-2xl bg-yellow-400 flex items-center justify-center shadow-xl shadow-yellow-400/20 text-black">
            <Fingerprint className="w-10 h-10 animate-pulse text-black" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black border border-yellow-500/40 flex items-center justify-center text-yellow-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-white tracking-tight">Sesión Bloqueada</h2>
        <p className="text-sm text-slate-300 mt-1 mb-6">
          Hola, <span className="text-yellow-400 font-bold">{userProfile?.displayName || currentUser?.email}</span>.
          Tu sesión está protegida con seguridad biométrica local WebAuthn.
        </p>

        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!usePasswordFallback ? (
          <div className="space-y-3">
            <button
              onClick={handleBiometricUnlock}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-extrabold bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/25 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              <Fingerprint className="w-5 h-5 text-black" />
              <span>{loading ? 'Verificando...' : 'Desbloquear con Biometría'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUsePasswordFallback(true);
                setError(null);
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Usar contraseña o credencial principal</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordUnlock} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Ingresa tu contraseña para desbloquear
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Tu contraseña de Calendario Derecho Pro"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Verificando...' : 'Desbloquear Sesión'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsePasswordFallback(false);
                  setError(null);
                }}
                className="w-full py-2 px-3 text-xs text-slate-400 hover:text-indigo-300 transition-colors"
              >
                ← Volver al desbloqueo biométrico
              </button>
            </div>
          </form>
        )}

        {/* Footer actions */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>WebAuthn Biometrics</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
