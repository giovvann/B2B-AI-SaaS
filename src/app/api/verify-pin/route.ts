import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json()
    if (!pin) return NextResponse.json({ error: 'PIN requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const admin = createAdminClient()
    const { data: boutique } = await admin
      .from('boutiques')
      .select('owner_pin')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!boutique?.owner_pin) {
      return NextResponse.json({ error: 'No hay PIN configurado. Regístrate primero.' }, { status: 400 })
    }

    const hash = crypto.createHash('sha256').update(pin).digest('hex')
    const ok = hash === boutique.owner_pin

    if (!ok) return NextResponse.json({ error: 'PIN incorrecto' }, { status: 403 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Error verify-pin:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
