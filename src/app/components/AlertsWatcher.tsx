'use client'

// Dispara /api/alerts/check en los momentos correctos:
// - Al abrir la app (una vez, con throttle de 10 min) → catch-up.
// - Tras sincronizar cambios (evento 'veliora-alerts-check' desde sync.ts) →
//   la venta acaba de llegar a Supabase.
// Throttle = cero spam de checks; el servidor además es idempotente (dedupe).
// Si el servidor crea alertas nuevas, las muestra como toast (la app está
// abierta) y el servidor ya las empujó por push (para la pantalla de bloqueo).

import { useCallback, useEffect, useRef } from 'react'
import { useToast } from '@/components/toast'
import { getDeviceId } from '@/lib/device'

const THROTTLE_MS = 10 * 60 * 1000 // check normal: máx 1 cada 10 min
const FORCE_THROTTLE_MS = 30 * 1000 // post-sync: máx 1 cada 30 s
const LS_KEY = 'veliora_alerts_check'

export function AlertsWatcher() {
  const { success } = useToast()
  const busy = useRef(false)

  const run = useCallback(
    async (force: boolean) => {
      if (busy.current) return
      const last = Number(localStorage.getItem(LS_KEY) || 0)
      const elapsed = Date.now() - last
      if (!force && elapsed < THROTTLE_MS) return
      if (force && elapsed < FORCE_THROTTLE_MS) return

      busy.current = true
      try {
        const res = await fetch('/api/alerts/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // device_id permite resolver la boutique también para empleados
          body: JSON.stringify({ deviceId: getDeviceId() }),
        })
        localStorage.setItem(LS_KEY, String(Date.now()))
        if (res.ok) {
          const data = await res.json()
          const created = (data.created || []) as { title: string; body: string }[]
          created.slice(0, 3).forEach((a) => success(a.title, a.body))
        }
      } catch {
        // sin red o error transitorio: el cron diario es el safety net
      } finally {
        busy.current = false
      }
    },
    [success]
  )

  useEffect(() => {
    const onCheck = (e: Event) => {
      const force = (e as CustomEvent).detail?.force === true
      // Pequeña espera: deja que el upsert de la venta termine de committear.
      setTimeout(() => void run(force), 1500)
    }
    window.addEventListener('veliora-alerts-check', onCheck)
    const t = setTimeout(() => void run(false), 8000)
    return () => {
      window.removeEventListener('veliora-alerts-check', onCheck)
      clearTimeout(t)
    }
  }, [run])

  return null
}
