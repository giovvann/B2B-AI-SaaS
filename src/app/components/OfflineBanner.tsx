'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });
  const bannerRef = useRef<HTMLDivElement>(null);
  const pingIntervalRef = useRef<number | null>(null);

  // Reliable connectivity check
  const checkConnectivity = useCallback(async () => {
    // Primary check: navigator.onLine (fast, but can be unreliable)
    if (!navigator.onLine) {
      setIsOffline(true);
      return;
    }

    // Secondary check: ping the server to confirm real internet
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch('/api/ping', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      setIsOffline(!res.ok);
    } catch {
      // If fetch fails, check navigator.onLine one more time
      // to avoid false positives from brief network glitches
      setTimeout(() => {
        if (!navigator.onLine) {
          setIsOffline(true);
        }
      }, 2000);
    }
  }, []);

  useEffect(() => {
    // Initial check after a small delay (let the page load first)
    const initTimer = setTimeout(checkConnectivity, 1500);

    // Listen for browser online/offline events
    const handleOnline = () => {
      // Don't immediately set online — verify with ping
      checkConnectivity();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic ping every 30 seconds
    pingIntervalRef.current = window.setInterval(checkConnectivity, 30000);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [checkConnectivity]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      origX: position.x,
      origY: position.y,
    };
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.origX + dx),
        y: Math.max(0, dragRef.current.origY + dy),
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.origX + dx),
        y: Math.max(0, dragRef.current.origY + dy),
      });
    };

    const stopDrag = () => setDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', stopDrag);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [dragging, position]);

  if (!isOffline) return null;

  // Minimized state: small icon floating in viewport
  if (minimized) {
    return (
      <div
        ref={bannerRef}
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
          transition: dragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="group"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-500/80 backdrop-blur-md border border-blue-400/30 shadow-lg shadow-blue-500/20 hover:bg-blue-500/90 transition-all">
          {/* Wifi-off icon */}
          <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l20 20" />
            <circle cx="12" cy="19" r="1" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium text-white/90 whitespace-nowrap">Sin conexión</span>
        </div>
      </div>
    );
  }

  // Expanded state: full banner
  return (
    <div
      ref={bannerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'fixed',
        left: position.x,
        bottom: position.y,
        zIndex: 9999,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        maxWidth: 'calc(100vw - 32px)',
        transition: dragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="bg-blue-500/60 backdrop-blur-xl border border-blue-400/20 rounded-2xl shadow-2xl shadow-blue-500/20 max-w-sm">
        {/* Drag handle bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-blue-400/10">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
            <span className="text-xs font-semibold text-white/80 tracking-wide">SIN CONEXIÓN</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/90 transition-all"
            aria-label="Minimizar"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-sm text-white/80 leading-relaxed">
            Tus cambios se guardan localmente y se sincronizarán automáticamente cuando recuperes la conexión.
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-200/70">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Reconectando automáticamente...
          </div>
        </div>
      </div>
    </div>
  );
}
