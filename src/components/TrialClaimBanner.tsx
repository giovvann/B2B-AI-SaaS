'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import { getDeviceId, getDeviceFingerprint } from '@/lib/device'

/**
 * Banner del dashboard para cuentas en plan FREE.
 * Ofrece canjear los 7 días de prueba UNA sola vez por dispositivo:
 * /api/claim-trial → claim_trial() en Postgres rechaza el canje si el
 * device_id o el fingerprint del navegador ya lo usaron (tabla
 * trial_redemptions). Si lo rechaza, se muestra el mensaje honesto —
 * la cuenta sigue funcionando en plan gratuito.
 */
export function TrialClaimBanner() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'claimed' | 'denied' | 'error'>('idle')

  const handleClaim = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/claim-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: getDeviceId(),
          fingerprint: await getDeviceFingerprint(),
        }),
      })
      const data = await res.json()
      if (data.claimed) {
        setStatus('claimed')
        router.refresh()
      } else {
        setStatus('denied')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'claimed') {
    return (
      <div className="max-w-5xl mx-auto mb-6 px-1">
        <div className="rounded-2xl border border-gold-400/40 bg-gold-50 dark:bg-gold-500/10 px-5 py-4">
          <p className="text-sm font-bold text-gold-700 dark:text-gold-400">
            Tu prueba gratuita está activa — 7 días con todas las funciones premium.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto mb-6 px-1">
      <div className="rounded-2xl border border-gold-400/30 bg-gradient-to-r from-gold-50 to-espresso-50 dark:from-gold-500/10 dark:to-espresso-800/40 px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Sparkles className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-espresso-800 dark:text-espresso-200">
              Activa tu prueba gratuita de 7 días
            </p>
            <p className="text-xs text-espresso-600 dark:text-espresso-400 mt-0.5">
              {status === 'denied'
                ? 'Este dispositivo ya usó su prueba gratuita. Tu cuenta sigue activa en plan gratuito; las funciones premium se desbloquean con la membresía.'
                : status === 'error'
                  ? 'No se pudo activar la prueba. Revisa tu conexión e inténtalo de nuevo.'
                  : 'Métricas, escaneo de facturas con IA y alertas para tu boutique. Una prueba por dispositivo.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleClaim}
          disabled={status === 'loading' || status === 'denied'}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-white text-sm font-bold shadow-lg shadow-gold-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:from-gold-600 hover:to-gold-700 transition-colors flex items-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Activando...
            </>
          ) : (
            'Activar 7 días gratis'
          )}
        </button>
      </div>
    </div>
  )
}
