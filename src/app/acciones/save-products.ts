'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getOrCreateBoutique } from '@/lib/boutique'
import { revalidatePath } from 'next/cache'

interface ProductInput {
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

export async function saveProductsAction(products: ProductInput[]) {
  if (products.length === 0) {
    return { error: 'No hay productos para guardar' }
  }

  const boutique = await getOrCreateBoutique()
  if ('error' in boutique) {
    return { error: boutique.error }
  }

  // Insertar productos con admin client
  const admin = createAdminClient()
  const productRows = products.map(p => ({
    name: p.name,
    brand: p.brand || null,
    season: p.season || null,
    size: p.size || '',
    color: p.color || '',
    purchase_price: p.purchase_price,
    sale_price: p.sale_price,
    sku: p.sku || null,
    stock: p.quantity,
    boutique_id: boutique.boutiqueId,
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