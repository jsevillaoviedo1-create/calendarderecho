import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Shield, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function AuthModal({ isOpen }: AuthModalProps) {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, continueAsLocalUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);

    try {
      if (isReset) {
        if (!email) throw new Error('Ingresa tu correo electrónico.');
        await resetPassword(email);
        setInfoMessage('Se ha enviado un enlace de restablecimiento a tu correo.');
      } else if (isRegister) {
        if (!email || !password) throw new Error('Completa todos los campos obligatorios.');
        if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
        await registerWithEmail(email, password, displayName || email.split('@')[0]);
      } else {
        if (!email || !password) throw new Error('Ingresa tu correo y contraseña.');
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Error en la autenticación.';
      if (err.code === 'auth/operation-not-allowed') {
        msg = '⚠️ El método de Correo/Contraseña está desactivado en tu proyecto de Firebase. Debes activarlo en Firebase Console → Authentication → Sign-in method → Correo electrónico/contraseña.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = `⚠️ El dominio actual (${typeof window !== 'undefined' ? window.location.hostname : 'Netlify'}) no está autorizado en Firebase. Añádelo en Firebase Console → Authentication → Settings → Authorized domains.`;
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Credenciales inválidas. Comprueba tu correo y contraseña.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Ya existe una cuenta registrada con este correo.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No se encontró ninguna cuenta con este correo.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Inicio de sesión con Google cancelado.';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(
          `⚠️ Dominio no autorizado: Debes añadir "${typeof window !== 'undefined' ? window.location.hostname : 'tu-sitio.netlify.app'}" en Firebase Console → Authentication → Settings → Authorized domains.`
        );
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Error iniciando sesión con Google.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/25 mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isReset
              ? 'Recuperar Contraseña'
              : isRegister
              ? 'Crear Cuenta en Calendario Derecho Pro'
              : 'Iniciar Sesión'}
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            {isReset
              ? 'Te enviaremos las instrucciones de restablecimiento a tu correo.'
              : 'accede a tu calendario completamente privado'}
          </p>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {infoMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        {!isReset && (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <div className="relative my-5 flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-500 font-semibold absolute">
                o con correo
              </span>
            </div>
          </>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Nombre completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Tu nombre o alias"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Correo electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {!isReset && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">Contraseña</label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsReset(true);
                      setError(null);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg shadow-amber-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <span>
              {submitting
                ? 'Procesando...'
                : isReset
                ? 'Enviar Enlace de Recuperación'
                : isRegister
                ? 'Crear Cuenta'
                : 'Iniciar Sesión'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isReset ? (
            <button
              onClick={() => {
                setIsReset(false);
                setError(null);
                setInfoMessage(null);
              }}
              className="text-amber-400 hover:underline font-medium"
            >
              Volver al inicio de sesión
            </button>
          ) : isRegister ? (
            <span>
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="text-amber-400 hover:underline font-medium"
              >
                Inicia sesión
              </button>
            </span>
          ) : (
            <span>
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="text-amber-400 hover:underline font-medium"
              >
                Regístrate gratis
              </button>
            </span>
          )}
        </div>

        {/* Local Mode Direct Entry */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
          <button
            type="button"
            onClick={continueAsLocalUser}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Acceder en modo local privado (sin nube)</span>
          </button>
          <p className="text-[10px] text-slate-500 mt-1">
            Recomendado para uso en local o si estás desplegado en Netlify sin configurar dominios en Firebase.
          </p>
        </div>

        {/* Security badge footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-500 text-[11px]">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>informacion guardada en local no se sube informacion a la nube</span>
        </div>
      </div>
    </div>
  );
}
