'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ProductInput {
  name: string
  brand?: string
  season?: string
  size?: string
  color?: string
  purchase_price: number
  sale_price: number
  quantity: number
}

export async function saveProductsAction(products: ProductInput[]) {
  if (products.length === 0) {
    return { error: 'No hay productos para guardar' }
  }

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

  // Insertar productos con admin client
  const admin = createAdminClient()
  const productRows = products.map(p => ({
    name: p.name,
    brand: p.brand || null,
    season: p.season || null,
    size: p.size || 'Unitalla',
    color: p.color || 'Único',
    purchase_price: p.purchase_price,
    sale_price: p.sale_price,
    stock: p.quantity,
    boutique_id: boutique.id,
  }))

  const { error: insertError } = await admin
    .from('products')
    .insert(productRows)

  if (insertError) {
    return { error: `Error al guardar: ${insertError.message}` }
  }

  revalidatePath('/ingresos')
  return { success: true, count: products.length }
}