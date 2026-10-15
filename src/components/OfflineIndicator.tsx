import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 text-slate-950 font-semibold px-3 py-2 text-xs shadow-xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo sin conexión — Mostrando datos en caché local</span>
    </div>
  );
}
