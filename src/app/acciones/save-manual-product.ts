'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ManualProductInput {
  name: string
  brand?: string
  season?: string
  size?: string
  color?: string
  purchase_price: number
  sale_price: number
  quantity: number
}

export async function saveManualProductAction(input: ManualProductInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No hay sesión activa' }
  }

  // Obtener o crear boutique
  let { data: boutique } = await supabase
    .from('boutiques')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!boutique) {
    const admin = createAdminClient()
    const { data: newBoutique, error: insertError } = await admin
      .from('boutiques')
      .insert({ owner_id: user.id, name: 'Mi Boutique', is_active: true, is_trial: true })
      .select('id')
      .single()

    if (insertError || !newBoutique) {
      return { error: 'Error creando boutique' }
    }

    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role: 'owner' },
    })

    boutique = newBoutique
  }

  // Insertar producto con admin client (bypassa RLS)
  const admin = createAdminClient()
  const { error: insertError } = await admin
    .from('products')
    .insert({
      name: input.name,
      brand: input.brand || null,
      season: input.season || null,
      size: input.size || 'Unitalla',
      color: input.color || 'Único',
      purchase_price: input.purchase_price,
      sale_price: input.sale_price,
      stock: input.quantity,
      boutique_id: boutique.id,
    })

  if (insertError) {
    return { error: `Error al guardar: ${insertError.message}` }
  }

  revalidatePath('/ingresos')
  return { success: true }
}