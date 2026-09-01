// Ciclo de vida del trial (corre dentro del cron diario /api/push/send).
//
// Tres acciones, todas idempotentes (tabla trial_notifications, unique
// boutique+evento+periodo):
// - Aviso D-1  : UNA sola notificación en las últimas 24h antes de expirar.
//                Push + registro WhatsApp (el worker externo los recoge; si
//                no está configurado quedan 'pending' sin romperse).
// - Aviso fin  : en la primera corrida tras expirar, avisa que la prueba
//                terminó y lleva al paywall (/suscripcion-expirada).
// - Downgrade  : trial expirado → is_active=false. El middleware ya
//                redirige a /suscripcion-expirada (isExpiredPremium).
//
// Se conserva plan_type='trial': pasarlo a 'free' mandaría al usuario al
// dashboard con el banner de canje en vez del paywall de renovación.
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPush } from './push'

const DAY = 24 * 60 * 60 * 1000

export interface TrialLifecycleResult {
  trialD1Sent: number
  trialExpiredSent: number
  trialDowngraded: number
  trialErrors: string[]
}

/** Intenta registrar el aviso; false si ya se envió para este periodo. */
async function notifyOnce(
  admin: SupabaseClient,
  boutiqueId: string,
  event: string,
  periodEnd: string
): Promise<boolean> {
  const { data: existing } = await admin
    .from('trial_notifications')
    .select('id')
    .eq('boutique_id', boutiqueId)
    .eq('event', event)
    .eq('period_end', periodEnd)
    .maybeSingle()
  if (existing) return false

  const { error } = await admin
    .from('trial_notifications')
    .insert({ boutique_id: boutiqueId, event, period_end: periodEnd })
  if (error) {
    // 23505 = carrera entre dos corridas: otro proceso lo registró primero.
    if ((error as { code?: string }).code !== '23505') {
      console.error(`TrialLifecycle: insert falló (${event}):`, error.message)
    }
    return false
  }
  return true
}

/** Push a todas las suscripciones de la boutique; limpia las muertas. */
async function pushToBoutique(
  admin: SupabaseClient,
  boutiqueId: string,
  payload: { title: string; body: string; url: string; tag: string }
): Promise<number> {
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint,keys_p256dh,keys_auth')
    .eq('boutique_id', boutiqueId)
  if (!subs || subs.length === 0) return 0

  const results = await Promise.all(
    subs.map((s) =>
      sendPush(
        { endpoint: s.endpoint, keys: { p256dh: s.keys_p256dh, auth: s.keys_auth } },
        payload
      )
    )
  )
  const dead = results
    .map((ok, i) => (ok ? null : subs[i].endpoint))
    .filter(Boolean) as string[]
  if (dead.length > 0) {
    await admin.from('push_subscriptions').delete().in('endpoint', dead)
  }
  return results.filter(Boolean).length
}

/**
 * Registro WhatsApp: el envío real lo hace el worker externo
 * (WHATSAPP_WORKER_URL). Si está configurado y la boutique tiene número,
 * se intenta el envío directo; si no, queda 'pending' en el log para que
 * el worker lo recoja cuando exista. Nunca lanza.
 */
async function logWhatsApp(
  admin: SupabaseClient,
  boutique: { id: string; name: string; whatsapp_number: string | null },
  type: string,
  message: string
): Promise<void> {
  try {
    await admin.from('whatsapp_alerts_log').insert({
      boutique_id: boutique.id,
      alert_type: type,
      message,
      status: 'pending',
    })

    const workerUrl = process.env.WHATSAPP_WORKER_URL
    if (workerUrl && boutique.whatsapp_number) {
      const res = await fetch(`${workerUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: boutique.whatsapp_number, text: message }),
      })
      if (res.ok) {
        await admin
          .from('whatsapp_alerts_log')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('boutique_id', boutique.id)
          .eq('alert_type', type)
          .eq('status', 'pending')
      }
    }
  } catch (e) {
    console.error(`TrialLifecycle: WhatsApp log falló (${type}):`, e)
  }
}

export async function runTrialLifecycle(
  admin: SupabaseClient
): Promise<TrialLifecycleResult> {
  const result: TrialLifecycleResult = {
    trialD1Sent: 0,
    trialExpiredSent: 0,
    trialDowngraded: 0,
    trialErrors: [],
  }

  const { data: trials, error } = await admin
    .from('boutiques')
    .select('id, name, whatsapp_number, subscription_expires_at, is_active')
    .eq('plan_type', 'trial')
    .not('subscription_expires_at', 'is', null)

  if (error) {
    console.error('TrialLifecycle: no pudo listar trials', error.message)
    result.trialErrors.push(error.message)
    return result
  }

  const now = Date.now()

  for (const b of trials ?? []) {
    // try/catch POR boutique: una falla no deja al resto sin su aviso.
    try {
      const exp = new Date(b.subscription_expires_at as string).getTime()
      const msLeft = exp - now

      // ── 1) Aviso D-1: expira dentro de las próximas 24h ──
      if (msLeft > 0 && msLeft <= DAY) {
        if (await notifyOnce(admin, b.id, 'trial_ending', b.subscription_expires_at as string)) {
          await pushToBoutique(admin, b.id, {
            title: 'Tu prueba de Veliora termina mañana',
            body: 'Activa tu membresía para conservar tus métricas, alertas y escaneo IA. Tus datos siguen intactos.',
            url: '/dashboard',
            tag: `trial-ending-${b.id}`,
          })
          await logWhatsApp(
            admin,
            b,
            'trial_ending',
            `*PRUEBA POR TERMINAR* - ${b.name}\n\nTu prueba gratuita de Veliora termina mañana. Activa tu membresía para seguir con todas las funciones. Responde este mensaje para activarla.`
          )
          result.trialD1Sent++
        }
      }

      // ── 2) Aviso de expiración: primera corrida tras vencer ──
      if (msLeft <= 0) {
        if (await notifyOnce(admin, b.id, 'trial_expired', b.subscription_expires_at as string)) {
          await pushToBoutique(admin, b.id, {
            title: 'Tu prueba de Veliora terminó',
            body: 'Tus datos están seguros. Activa tu membresía para recuperar las funciones premium.',
            url: '/suscripcion-expirada',
            tag: `trial-expired-${b.id}`,
          })
          await logWhatsApp(
            admin,
            b,
            'trial_expired',
            `*PRUEBA TERMINADA* - ${b.name}\n\nTu prueba gratuita de Veliora terminó. Tus datos están seguros; activa tu membresía para recuperar las funciones premium. Responde este mensaje para activarla.`
          )
          result.trialExpiredSent++
        }

        // ── 3) Downgrade: trial expirado se desactiva ──
        if (b.is_active) {
          const { error: upErr } = await admin
            .from('boutiques')
            .update({ is_active: false })
            .eq('id', b.id)
          if (upErr) {
            result.trialErrors.push(`${String(b.id).slice(0, 8)}: ${upErr.message}`)
          } else {
            result.trialDowngraded++
          }
        }
      }
    } catch (e: any) {
      console.error(`TrialLifecycle: error en boutique ${b.id}`, e)
      result.trialErrors.push(`${String(b.id).slice(0, 8)}: ${e?.message ?? String(e)}`)
    }
  }

  return result
}
