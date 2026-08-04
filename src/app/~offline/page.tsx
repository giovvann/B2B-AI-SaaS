'use client';

import { useEffect, useRef, useState } from 'react';

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);
  const retryRef = useRef(false);

  useEffect(() => {
    document.title = 'Sin conexión';
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const tryReconnect = async () => {
      if (cancelled || retryRef.current) return;
      retryRef.current = true;
      setRetrying(true);
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('/api/ping', { cache: 'no-store', signal: controller.signal });
        clearTimeout(t);
        if (cancelled) return;
        if (res.ok) {
          // Back online: reload the page the user was trying to open.
          // If the SW served this fallback for a real path, the URL bar still has it.
          const target = window.location.pathname === '/~offline' ? '/' : window.location.pathname + window.location.search;
          window.location.replace(target);
          return;
        }
      } catch {
        // still offline, keep polling
      }
      if (!cancelled) {
        retryRef.current = false;
        setRetrying(false);
      }
    };

    const handleOnline = () => {
      if (!cancelled) tryReconnect();
    };
    const handleOffline = () => {
      if (!cancelled) {
        retryRef.current = false;
        setRetrying(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll every 4s while offline
    timer = setInterval(tryReconnect, 4000);
    tryReconnect();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] flex items-center justify-center p-6 transition-colors duration-300">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[#2a2420] dark:text-white mb-3">Sin conexión</h1>
        <p className="text-[rgba(42,36,32,0.55)] dark:text-gray-400 leading-relaxed mb-6">
          No tienes internet en este momento. No te preocupes — las operaciones que realices se guardarán localmente y se sincronizarán automáticamente cuando recuperes la señal.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-600 dark:text-blue-400">
          <svg className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {retrying ? 'Reconectando automáticamente...' : 'Esperando conexión...'}
        </div>
        <div className="mt-6">
          <button
            onClick={() => {
              retryRef.current = false;
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2a2420] text-[#fdfaf5] text-sm font-semibold hover:bg-[#1a1612] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 9a8 8 0 00-14.32-3.68M4 15a8 8 0 0014.32 3.68" />
            </svg>
            Reintentar ahora
          </button>
        </div>
        <div className="mt-8 text-xs text-[rgba(42,36,32,0.35)] dark:text-gray-600">
          Veliora funciona sin conexión gracias a sincronización local.
        </div>
      </div>
    </div>
  );
}
