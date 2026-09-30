import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/revisar — { payment_id, action: "approve" | "reject" }
 * Solo superadmin (mismo patrón que src/lib/superadmin.ts).
 * Aprueba la cola de comprobantes dudosos (status pending) y activa premium.
 */

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'Giovva729@hotmail.com').toLowerCase()
    if (!user || user.email?.toLowerCase() !== SUPERADMIN_EMAIL) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    const { payment_id, action } = await req.json()
    if (!payment_id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'payment_id y action approve|reject requeridos' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data: pay } = await admin.from('payments')
      .select('id, boutique_id, status').eq('id', payment_id).maybeSingle()
    if (!pay) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    if (pay.status !== 'pending') {
      return NextResponse.json({ error: `Ya fue procesado (${pay.status})` }, { status: 409 })
    }

    if (action === 'reject') {
      await admin.from('payments').update({
        status: 'rejected', reviewed_by: user.email, decided_at: new Date().toISOString(),
      }).eq('id', payment_id)
      return NextResponse.json({ ok: true, action: 'rejected' })
    }

    const { data: expires } = await admin.rpc('activate_premium', {
      p_boutique_id: pay.boutique_id, p_days: 30,
    })
    await admin.from('payments').update({
      status: 'approved', reviewed_by: user.email, decided_at: new Date().toISOString(),
    }).eq('id', payment_id)
    return NextResponse.json({ ok: true, action: 'approved', expires_at: expires })
  } catch (e: any) {
    console.error('payments/revisar:', e)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}

/** GET /api/payments/revisar — cola de pendientes (solo superadmin).
 * Para el riel oxxo_giftcard incluye el código descifrado para canjearlo
 * en tienda. Nunca exponer fuera de este endpoint. */
export async function GET() {
  const { createClient: mk } = await import('@/lib/supabase/server')
  const { decryptCode } = await import('@/lib/payment-crypto')
  const supabase = await mk()
  const { data: { user } } = await supabase.auth.getUser()
  const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'Giovva729@hotmail.com').toLowerCase()
  if (!user || user.email?.toLowerCase() !== SUPERADMIN_EMAIL) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  const admin = createAdminClient()
  const { data } = await admin.from('payments')
    .select('id, rail, amount_mxn, ai_confidence, ai_reason, created_at, boutique_id, code_enc')
    .eq('status', 'pending').order('created_at', { ascending: true }).limit(50)
  const pending = (data || []).map((p: any) => {
    let code: string | null = null
    if (p.code_enc) {
      try { code = decryptCode(p.code_enc) } catch { code = null }
    }
    const { code_enc, ...rest } = p
    return { ...rest, code }
  })
  return NextResponse.json({ pending })
}
