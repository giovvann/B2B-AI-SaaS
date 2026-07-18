'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getOrCreateBoutique } from '@/lib/boutique'
import { revalidatePath } from 'next/cache'

interface ManualProductInput {
  name: string
  brand?: string
  season?: string
  size?: string
  color?: string
  sku?: string
  purchase_price: number
  sale_price: number
  quantity: number
}

export async function saveManualProductAction(input: ManualProductInput) {
  const boutique = await getOrCreateBoutique()
  if ('error' in boutique) {
    return { error: boutique.error }
  }

  // Insertar producto con admin client (bypassa RLS)
  const admin = createAdminClient()
  const { error: insertError } = await admin
    .from('products')
    .insert({
      name: input.name,
      brand: input.brand || null,
      season: input.season || null,
      size: input.size || '',
      color: input.color || '',
      purchase_price: input.purchase_price,
      sale_price: input.sale_price,
      sku: input.sku || null,
      stock: input.quantity,
      boutique_id: boutique.boutiqueId,
    })

  if (insertError) {
    return { error: `Error al guardar: ${insertError.message}` }
  }

  revalidatePath('/ingresos')
  return { success: true }
}