import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/push/subscribe
 * Guarda la suscripción push del dispositivo actual (usuario autenticado).
 * Body: { endpoint, keys: { p256dh, auth } }
 */
export async function POST(req: NextRequest) {
  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    }

    const { endpoint, keys } = body
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Suscripción incompleta' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: boutique } = await supabase
      .from('boutiques')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!boutique) {
      return NextResponse.json({ error: 'Boutique no encontrada' }, { status: 404 })
    }

    // Upsert por endpoint (UNIQUE) → re-suscribir el mismo dispositivo no duplica
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        boutique_id: boutique.id,
        endpoint,
        keys_p256dh: keys.p256dh,
        keys_auth: keys.auth,
      },
      { onConflict: 'endpoint' }
    )

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Error push/subscribe:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/push/subscribe
 * Elimina la suscripción del dispositivo actual (endpoint en el body).
 */
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json().catch(() => ({ endpoint: null }))
    if (!endpoint) return NextResponse.json({ error: 'endpoint requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // RLS ya limita a user_id = auth.uid()
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
