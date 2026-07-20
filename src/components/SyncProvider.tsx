'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { startSyncEngine, pendingCount, type SyncState } from '@/lib/sync'
import { WifiOff, Wifi, RefreshCw, AlertTriangle, X } from 'lucide-react'

const Ctx = createContext<SyncState>({
  online: true,
  pending: 0,
  syncing: false,
  lastSync: null,
  error: null,
})

export const useSync = () => useContext(Ctx)

export function SyncProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SyncState>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pending: 0,
    syncing: false,
    lastSync: null,
    error: null,
  })
  const [dismissed, setDismissed] = useState<'offline' | 'error' | null>(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    const refresh = async () => {
      const p = await pendingCount()
      setState(s => ({ ...s, pending: p }))
    }

    const stop = startSyncEngine(s => {
      setState(prev => ({ ...prev, ...s }))
      void refresh()
    })

    // More reliable connectivity check via ping
    const checkOnline = async () => {
      try {
        const controller = new AbortController()
        setTimeout(() => controller.abort(), 5000)
        const res = await fetch('/api/ping', { method: 'GET', signal: controller.signal, cache: 'no-store' })
        if (res.ok) {
          setState(prev => ({ ...prev, online: true }))
        }
      } catch {
        // If ping fails but navigator says online, trust navigator
        // Only set offline if both ping AND navigator agree
        if (!navigator.onLine) {
          setState(prev => ({ ...prev, online: false }))
        }
      }
    }

    // Initial check after page load
    const initTimer = setTimeout(checkOnline, 5000)
    const interval = setInterval(checkOnline, 60000)

    // Browser events are still useful for instant feedback
    const handleOnline = () => {
      setState(prev => ({ ...prev, online: true }))
    }
    const handleOffline = () => {
      // Don't immediately set offline - let ping confirm
      checkOnline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const tick = setInterval(refresh, 5000)

    return () => {
      stop()
      clearTimeout(initTimer)
      clearInterval(interval)
      clearInterval(tick)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const dismissBanner = (type: 'offline' | 'error') => {
    setDismissed(type)
    // Auto-reopen after 2 minutes
    setTimeout(() => setDismissed(prev => prev === type ? null : prev), 120000)
  }

  return (
    <Ctx.Provider value={state}>
      {!state.online && dismissed !== 'offline' && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-black text-center text-xs font-bold py-1.5 px-3 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="flex-1">Modo sin conexión — tus cambios se guardan y se sincronizarán al volver</span>
          <button
            onClick={() => dismissBanner('offline')}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-amber-400/50 hover:bg-amber-400/80 text-amber-900 transition-all"
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
        </div>
      )}
      {state.online && state.pending > 0 && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-emerald-600 text-white text-center text-xs font-bold py-1.5 px-3 flex items-center justify-center gap-2">
          {state.syncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> Sincronizando {state.pending} cambio(s)…
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 shrink-0" /> {state.pending} cambio(s) por sincronizar
            </>
          )}
        </div>
      )}
      {state.error && dismissed !== 'error' && (
        <div className="fixed bottom-0 inset-x-0 z-[100] bg-red-600 text-white text-center text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">Sync: {state.error}</span>
          <button
            onClick={() => dismissBanner('error')}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/50 hover:bg-red-500/80 text-white transition-all"
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
        </div>
      )}
      {children}
    </Ctx.Provider>
  )
}
