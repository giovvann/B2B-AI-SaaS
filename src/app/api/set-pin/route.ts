import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json()
    if (!pin || pin.length < 4 || pin.length > 6) {
      return NextResponse.json({ error: 'El PIN debe tener 4-6 dígitos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Hash del PIN
    const hash = crypto.createHash('sha256').update(pin).digest('hex')

    const admin = createAdminClient()
    const { error } = await admin
      .from('boutiques')
      .update({ owner_pin: hash })
      .eq('owner_id', user.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Error set-pin:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
