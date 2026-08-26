import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Canjea la prueba de 7 días. Anti-abuso: claim_trial() en Postgres solo
// permite UNA redención por device_id y por fingerprint (tabla
// trial_redemptions). Si cualquiera de las dos señales ya fue usada,
// devuelve false y la cuenta se queda en plan free (sin bloquearla).
export async function POST(req: NextRequest) {
  try {
    const { device_id, fingerprint } = await req.json()
    if (!device_id || typeof device_id !== 'string') {
      return NextResponse.json({ claimed: false, reason: 'device_id requerido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ claimed: false, reason: 'No autenticado' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: boutique } = await admin
      .from('boutiques')
      .select('id, plan_type, subscription_expires_at')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!boutique) {
      return NextResponse.json({ claimed: false, reason: 'Boutique no encontrada' }, { status: 404 })
    }

    // Trial ya activo: respuesta idempotente, NO extiende el periodo.
    const expiresAt = boutique.subscription_expires_at ? new Date(boutique.subscription_expires_at) : null
    if (boutique.plan_type === 'trial' && expiresAt && expiresAt > new Date()) {
      return NextResponse.json({ claimed: true, already: true })
    }

    // Canje atómico en Postgres (race-safe por unique indexes).
    const { data: claimed, error } = await admin.rpc('claim_trial', {
      p_device_id: device_id,
      p_fingerprint: typeof fingerprint === 'string' && fingerprint.trim() ? fingerprint.trim() : null,
      p_user_id: user.id,
      p_boutique_id: boutique.id,
    })
    if (error) throw error

    return NextResponse.json({ claimed: claimed === true })
  } catch (err: any) {
    console.error('Error claim-trial:', err)
    return NextResponse.json({ claimed: false, reason: err.message }, { status: 500 })
  }
}
