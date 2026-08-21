import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Anti fuerza bruta: 5 intentos por ventana de 15 minutos por usuario.
// (En serverless el contador es por instancia; suficiente como disuasión real.)
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const attemptsMap = new Map<string, { count: number; first: number }>()

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS * 2
  for (const [k, v] of attemptsMap) {
    if (v.first < cutoff) attemptsMap.delete(k)
  }
}, 5 * 60 * 1000)

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
      // Sin PIN configurado (ej. cuentas creadas con Google): el cliente
      // puede ofrecer crearlo en este momento.
      return NextResponse.json(
        { error: 'Aún no tienes PIN configurado.', noPin: true },
        { status: 400 }
      )
    }

    // Rate limit por intentos fallidos
    const now = Date.now()
    const att = attemptsMap.get(user.id) || { count: 0, first: now }
    if (now - att.first > WINDOW_MS) {
      attemptsMap.set(user.id, { count: 1, first: now })
    } else {
      if (att.count >= MAX_ATTEMPTS) {
        const mins = Math.ceil((WINDOW_MS - (now - att.first)) / 60000)
        return NextResponse.json(
          { error: `Demasiados intentos. Espera ${mins} minuto(s) e inténtalo de nuevo.` },
          { status: 429 }
        )
      }
      att.count++
      attemptsMap.set(user.id, att)
    }

    const hash = crypto.createHash('sha256').update(String(pin)).digest('hex')
    const ok = hash === boutique.owner_pin

    if (!ok) return NextResponse.json({ error: 'PIN incorrecto' }, { status: 403 })

    attemptsMap.delete(user.id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Error verify-pin:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
