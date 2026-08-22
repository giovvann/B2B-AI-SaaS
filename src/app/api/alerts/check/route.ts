import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateAlerts, notifyAlerts } from '@/lib/alerts'

export const dynamic = 'force-dynamic'

/**
 * POST /api/alerts/check
 * Disparado por AlertsWatcher tras sincronizar una venta o al abrir la app.
 * Evalúa récord 7 días / agotado / stock bajo, crea las alertas faltantes
 * (idempotente por dedupe_key) y las notifica por push.
 *
 * Funciona para dueños Y empleados: si el usuario no es dueño de ninguna
 * boutique, se resuelve su boutique vía la tabla dispositivos (device_id).
 * El push llega a las suscripciones de la boutique (el dueño).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    let boutiqueId: string | null = null

    // 1) Dueño directo
    const { data: own } = await supabase
      .from('boutiques')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
    if (own) boutiqueId = own.id

    // 2) Empleado: resolver boutique vía dispositivo aprobado
    if (!boutiqueId) {
      let deviceId: string | null = null
      try {
        const body = await req.json()
        deviceId = body?.deviceId || null
      } catch { /* sin body */ }

      if (deviceId) {
        const { data: disp } = await supabase
          .from('dispositivos')
          .select('boutique_id, status')
          .eq('device_id', deviceId)
          .eq('status', 'approved')
          .maybeSingle()
        if (disp) boutiqueId = disp.boutique_id
      }
    }

    if (!boutiqueId) {
      return NextResponse.json({ error: 'Boutique no encontrada' }, { status: 404 })
    }

    const admin = createAdminClient()
    const { created } = await evaluateAlerts(admin, boutiqueId)
    const delivered = await notifyAlerts(admin, boutiqueId, created)

    return NextResponse.json({
      ok: true,
      created: created.map((a) => ({ title: a.title, body: a.body, url: a.url })),
      delivered,
    })
  } catch (err: any) {
    console.error('Error alerts/check:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
