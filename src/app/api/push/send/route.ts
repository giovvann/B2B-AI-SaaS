import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'

export const dynamic = 'force-dynamic'

/**
 * GET /api/push/send — CRON de Vercel (vercel.json).
 * Busca recordatorios vencidos que aún no se notificaron y envía un push a
 * las suscripciones de la boutique. Marca push_notified_at para no repetir.
 * Protegido por CRON_SECRET (Vercel lo manda automáticamente como
 * Authorization: Bearer cuando el cron se ejecuta).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const dayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Ventana de 48h: recordatorios atrasados (últimas 24h, para no revivir
    // viejísimos) + recordatorios del día (próximas 24h, "digest" matutino).
    // Hobby de Vercel solo permite 1 corrida de cron al día.
    const { data: dueReminders, error: remErr } = await admin
      .from('reminders')
      .select('id, boutique_id, title, note, due')
      .eq('done', false)
      .is('push_notified_at', null)
      .lte('due', dayAhead.toISOString())
      .gte('due', dayAgo.toISOString())
      .limit(100)

    if (remErr) throw remErr
    if (!dueReminders || dueReminders.length === 0) {
      return NextResponse.json({ ok: true, due: 0, deliveries: 0, message: 'Sin recordatorios vencidos' })
    }

    const boutiqueIds = [...new Set(dueReminders.map(r => r.boutique_id))]
    const { data: subs, error: subsErr } = await admin
      .from('push_subscriptions')
      .select('boutique_id, endpoint, keys_p256dh, keys_auth')
      .in('boutique_id', boutiqueIds)

    if (subsErr) throw subsErr

    const subsByBoutique = new Map<string, NonNullable<typeof subs>>()
    for (const s of subs || []) {
      const list = subsByBoutique.get(s.boutique_id) || []
      list.push(s)
      subsByBoutique.set(s.boutique_id, list)
    }

    const notifiedIds: string[] = []
    let skippedNoSubs = 0
    const tasks: Promise<{ ok: boolean; endpoint: string }>[] = []

    for (const rem of dueReminders) {
      // Se marca como procesado SIEMPRE para no re-notificar cada corrida
      notifiedIds.push(rem.id)

      const targets = subsByBoutique.get(rem.boutique_id)
      if (!targets || targets.length === 0) {
        skippedNoSubs++
        continue
      }

      const dueDate = new Date(rem.due)
      let title: string
      if (dueDate.getTime() > now.getTime()) {
        // Vercel corre en UTC: fijar la zona horaria del noreste de México
        // para que "hoy a las HH:MM" sea la hora real del dueño.
        const hora = dueDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Monterrey' })
        title = `Recordatorio hoy a las ${hora}`
      } else {
        const overdueH = Math.max(1, Math.round((now.getTime() - dueDate.getTime()) / 3600000))
        title = overdueH <= 24 ? 'Recordatorio pendiente' : `Recordatorio atrasado (${overdueH}h)`
      }
      const payload = {
        title,
        body: rem.note ? `${rem.title} — ${rem.note}` : rem.title,
        url: '/dashboard',
      }

      for (const s of targets) {
        tasks.push(
          sendPush(
            { endpoint: s.endpoint, keys: { p256dh: s.keys_p256dh, auth: s.keys_auth } },
            payload
          ).then((ok) => ({ ok, endpoint: s.endpoint }))
        )
      }
    }

    // Envíos en paralelo (duración acotada para el plan Hobby)
    const results = await Promise.all(tasks)
    const deliveries = results.filter((r) => r.ok).length
    const deadEndpoints = [...new Set(results.filter((r) => !r.ok).map((r) => r.endpoint))]

    if (notifiedIds.length > 0) {
      await admin
        .from('reminders')
        .update({ push_notified_at: now.toISOString() })
        .in('id', notifiedIds)
    }

    // Limpiar suscripciones muertas (404/410 del push service)
    if (deadEndpoints.length > 0) {
      await admin.from('push_subscriptions').delete().in('endpoint', deadEndpoints)
    }

    return NextResponse.json({
      ok: true,
      due: dueReminders.length,
      deliveries,
      skippedNoSubs,
      deadSubscriptionsRemoved: deadEndpoints.length,
    })
  } catch (err: any) {
    console.error('Error push/send:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
