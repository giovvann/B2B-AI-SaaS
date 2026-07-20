'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const DISMISS_KEY = 'veliora_offline_dismissed';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [confirmed, setConfirmed] = useState(false);  // true after first successful ping
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });
  const pingRef = useRef<{ active: boolean; failCount: number }>({ active: false, failCount: 0 });
  const mountedRef = useRef(true);

  // Reliable connectivity check with retry logic
  const checkConnectivity = useCallback(async () => {
    if (pingRef.current.active) return; // avoid concurrent pings
    pingRef.current.active = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('/api/ping', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        // Successfully connected
        pingRef.current.failCount = 0;
        if (mountedRef.current) {
          setIsOffline(false);
          setConfirmed(true);
        }
      } else {
        // Server responded but not OK — rare, treat as online to avoid false positive
        if (mountedRef.current) {
          setIsOffline(false);
          setConfirmed(true);
        }
      }
    } catch {
      // Network error — could be real offline or transient
      pingRef.current.failCount++;

      if (pingRef.current.failCount >= 5) {
        // 5 consecutive failures = probably really offline
        if (!navigator.onLine && mountedRef.current) {
          setIsOffline(true);
        }
      }
      // If less than 3 failures, don't change state (avoid false positives)
    } finally {
      pingRef.current.active = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    pingRef.current = { active: false, failCount: 0 };

    // Read dismissed state from sessionStorage (survives page nav, not full session)
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) {
        setDismissed(true);
      }
    } catch {}

    // Wait for full page hydration + service worker before first check (longer to avoid false positives)
    const initTimer = setTimeout(checkConnectivity, 6000);

    // Browser native events (instant)
    const handleOnline = () => {
      if (mountedRef.current) {
        setIsOffline(false);
        setConfirmed(true);
        pingRef.current.failCount = 0;
      }
    };
    const handleOffline = () => {
      if (mountedRef.current) {
        setIsOffline(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 90s (less aggressive to avoid false positives)
    const interval = setInterval(checkConnectivity, 90000);

    // Extra safety: check after visibility change (user returns to tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkConnectivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkConnectivity]);

  // Drag handlers
  const initDrag = (clientX: number, clientY: number) => {
    setDragging(true);
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      origX: position.x,
      origY: position.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    initDrag(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    initDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, dragRef.current.origX + e.clientX - dragRef.current.startX),
        y: Math.max(0, dragRef.current.origY + e.clientY - dragRef.current.startY),
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setPosition({
        x: Math.max(0, dragRef.current.origX + touch.clientX - dragRef.current.startX),
        y: Math.max(0, dragRef.current.origY + touch.clientY - dragRef.current.startY),
      });
    };

    const stopDrag = () => setDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', stopDrag);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [dragging, position]);

  // Dismiss handler — stores in sessionStorage so it lasts across SPA navigations
  const handleDismiss = () => {
    setDismissed(true);
    setMinimized(false);
    setIsOffline(false);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
  };

  const handleReopen = () => {
    setDismissed(false);
    try { sessionStorage.removeItem(DISMISS_KEY); } catch {}
    // Re-check connectivity
    checkConnectivity();
  };

  // Don't show anything until first connectivity check completes
  if (!confirmed && !isOffline) return null;

  // Fully dismissed — show small re-open pill
  if (dismissed) {
    return (
      <button
        onClick={handleReopen}
        className="fixed bottom-4 left-4 z-[9999] flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-lg border border-zinc-200 dark:border-zinc-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all text-xs font-medium text-zinc-600 dark:text-zinc-300"
        aria-label="Revisar conexión"
        title="Revisar conexión"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414M12 19h.01" />
        </svg>
        <span>Conexión</span>
      </button>
    );
  }

  if (!isOffline) return null;

  // Minimized floating icon
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'fixed',
          left: position.x,
          bottom: position.y,
          zIndex: 9999,
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-xl border border-amber-400/30 shadow-2xl hover:shadow-amber-500/20 hover:scale-105 transition-all"
        aria-label="Abrir banner de conexión"
      >
        <svg className="w-4 h-4 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414M12 19h.01" />
        </svg>
        <span className="text-xs font-semibold text-amber-900">Sin conexión</span>
        <svg className="w-3 h-3 text-amber-800/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  // Full banner
  return (
    <div
      ref={null}
      style={{
        position: 'fixed',
        left: position.x,
        bottom: position.y,
        zIndex: 9999,
        cursor: dragging ? 'grabbing' : 'default',
        userSelect: 'none',
        maxWidth: 'calc(100vw - 2rem)',
      }}
      className="drop-shadow-2xl"
    >
      <div
        onMouseDown={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest('button')) return; // don't drag from buttons
          handleMouseDown(e);
        }}
        onTouchStart={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest('button')) return;
          handleTouchStart(e);
        }}
        className="bg-amber-500/95 dark:bg-amber-600/95 backdrop-blur-xl border border-amber-400/30 rounded-xl shadow-2xl shadow-amber-500/20 overflow-hidden"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-600/30 dark:bg-amber-700/30">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-900/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414M12 19h.01" />
            </svg>
            <span className="text-[11px] font-bold text-amber-900/80 tracking-wide uppercase">Sin conexión</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Minimize */}
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500/30 hover:bg-amber-500/50 text-amber-900/60 hover:text-amber-900 transition-all"
              aria-label="Minimizar"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500/30 hover:bg-red-500/40 text-amber-900/60 hover:text-red-600 transition-all"
              aria-label="Cerrar"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 py-2.5">
          <p className="text-xs text-amber-900/80 leading-relaxed">
            Tus cambios se guardan localmente y se sincronizarán al recuperar la conexión.
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <svg className="w-3 h-3 text-amber-800/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-[11px] text-amber-900/60">Reconectando automáticamente...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
