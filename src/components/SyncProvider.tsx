'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { startSyncEngine, pendingCount, type SyncState } from '@/lib/sync'
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react'

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

    // refresca el contador de pendientes cada 5s
    const tick = setInterval(refresh, 5000)
    return () => {
      stop()
      clearInterval(tick)
    }
  }, [])

  return (
    <Ctx.Provider value={state}>
      {!state.online && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-black text-center text-xs font-bold py-1.5 px-3 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Modo sin conexión — tus cambios se guardan y se sincronizarán al volver
        </div>
      )}
      {state.online && state.pending > 0 && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-emerald-600 text-white text-center text-xs font-bold py-1.5 px-3 flex items-center justify-center gap-2">
          {state.syncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Sincronizando {state.pending} cambio(s)…
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" /> {state.pending} cambio(s) por sincronizar
            </>
          )}
        </div>
      )}
      {state.error && (
        <div className="fixed bottom-0 inset-x-0 z-[100] bg-red-600 text-white text-center text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Sync: {state.error}
        </div>
      )}
      {children}
    </Ctx.Provider>
  )
}
