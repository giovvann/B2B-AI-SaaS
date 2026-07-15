import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { device_id, device_name, role = 'employee' } = await req.json()
    if (!device_id) {
      return NextResponse.json({ error: 'device_id requerido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const admin = createAdminClient()

    // Obtener boutique
    const { data: boutique } = await admin
      .from('boutiques')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!boutique) return NextResponse.json({ error: 'Boutique no encontrada' }, { status: 404 })

    // Verificar límite de 6 dispositivos aprobados
    const { count } = await admin
      .from('dispositivos')
      .select('*', { count: 'exact', head: true })
      .eq('boutique_id', boutique.id)
      .eq('status', 'approved')

    const maxDevices = 6
    if (count !== null && count >= maxDevices) {
      return NextResponse.json({
        error: `Límite de ${maxDevices} dispositivos alcanzado. Revoca alguno desde el panel del dueño.`
      }, { status: 403 })
    }

    // Upsert: si el dispositivo ya existe, actualiza; si no, crea
    const status = role === 'owner' ? 'approved' : 'pending'
    const { data: dispositivo, error } = await admin
      .from('dispositivos')
      .upsert({
        boutique_id: boutique.id,
        device_id,
        device_name: device_name || 'Navegador',
        role,
        status,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: 'boutique_id, device_id',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, dispositivo, status })
  } catch (err: any) {
    console.error('Error register-device:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
