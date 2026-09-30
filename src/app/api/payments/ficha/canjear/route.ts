import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/ficha/canjear — { code: "VEL-XXXX-XXXX" }
 * Fichas prepago de 30 días: las generas tú (superadmin), las vendes en
 * efectivo o por WhatsApp + transferencia, el cliente la canjea y se activa
 * solo. Canje atómico de un solo uso.
 */

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const { data: boutique } = await supabase
      .from('boutiques').select('id').eq('owner_id', user.id).maybeSingle()
    if (!boutique) return NextResponse.json({ error: 'Boutique no encontrada' }, { status: 404 })

    const { code } = await req.json()
    const normalized = String(code || '').trim().toUpperCase()
    if (!/^VEL-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) {
      return NextResponse.json({ error: 'Código inválido. Formato: VEL-XXXX-XXXX' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data: ficha } = await admin.from('fichas')
      .select('code, days, redeemed_at').eq('code', normalized).maybeSingle()
    if (!ficha) return NextResponse.json({ error: 'Código inexistente.' }, { status: 404 })
    if (ficha.redeemed_at) return NextResponse.json({ error: 'Código ya usado.' }, { status: 409 })

    // Canje atómico: solo la primera petición concurrente actualiza la fila.
    const { data: locked, error: lock } = await admin.from('fichas')
      .update({ redeemed_at: new Date().toISOString(), boutique_id: boutique.id })
      .eq('code', normalized).is('redeemed_at', null)
      .select('code')
    if (lock) throw lock
    if (!locked || locked.length === 0) {
      return NextResponse.json({ error: 'Código ya usado.' }, { status: 409 })
    }

    const { data: expires } = await admin.rpc('activate_premium', {
      p_boutique_id: boutique.id, p_days: ficha.days ?? 30,
    })
    await admin.from('payments').insert({
      boutique_id: boutique.id, user_id: user.id, rail: 'ficha',
      amount_mxn: 199, status: 'approved', ai_reason: normalized,
      reviewed_by: 'ficha', decided_at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, expires_at: expires })
  } catch (e: any) {
    console.error('payments/ficha:', e)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
