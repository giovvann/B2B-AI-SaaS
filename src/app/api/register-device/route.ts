import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { device_id, device_name, role = 'employee', pin } = await req.json()
    if (!device_id) {
      return NextResponse.json({ error: 'device_id requerido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const admin = createAdminClient()

    // Obtener boutique (con sus ajustes de seguridad)
    const { data: boutique } = await admin
      .from('boutiques')
      .select('id, owner_pin, pin_required, auto_accept_employees')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!boutique) return NextResponse.json({
      error: 'No se encontró la boutique. Si eres empleado, usa el correo y contraseña del dueño para iniciar sesión.'
    }, { status: 404 })

    // SEGURIDAD: el rol de dueño solo se otorga con PIN válido verificado en el
    // servidor (impide que un cliente escale a dueño mintiendo en el body).
    // Excepción: la boutique desactivó el PIN desde configuración.
    if (role === 'owner' && boutique.pin_required !== false) {
      if (!boutique.owner_pin || !pin) {
        return NextResponse.json({ error: 'PIN requerido para acceder como dueño' }, { status: 403 })
      }
      const hash = crypto.createHash('sha256').update(String(pin)).digest('hex')
      if (hash !== boutique.owner_pin) {
        return NextResponse.json({ error: 'PIN incorrecto' }, { status: 403 })
      }
    }

    // Verificar límite de 6 dispositivos aprobados (solo para dispositivos NUEVOS)
    const { data: existingDevice } = await admin
      .from('dispositivos')
      .select('id, status')
      .eq('boutique_id', boutique.id)
      .eq('device_id', device_id)
      .maybeSingle()

    // Si el dispositivo ya existe y está aprobado, permitir actualización sin contar límite
    const isExistingAndApproved = existingDevice?.status === 'approved'
    if (!isExistingAndApproved) {
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
    }

    // Estado del dispositivo:
    // - Dueño con PIN verificado arriba -> aprobado
    // - Empleado -> aprobado automático si el dueño lo activó (default), si no pendiente
    // - Dispositivo revocado NO puede auto-reaprobarse (salvo dueño con PIN)
    const autoAccept = boutique.auto_accept_employees !== false
    let status: 'approved' | 'pending' | 'revoked'
    if (existingDevice?.status === 'revoked' && role !== 'owner') {
      status = 'revoked'
    } else if (role === 'owner') {
      status = 'approved'
    } else {
      status = autoAccept ? 'approved' : 'pending'
    }

    // Upsert: si el dispositivo ya existe, actualiza; si no, crea
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
