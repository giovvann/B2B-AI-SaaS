'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ProductImport {
  name: string
  brand?: string
  season?: string
  size?: string
  color?: string
  sku?: string
  purchase_price: number
  sale_price: number
  stock: number
}

export async function importProducts(products: ProductImport[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No estás autenticado')

  const { data: boutique } = await supabase
    .from('boutiques').select('id, name').eq('owner_id', user.id).single()
  if (!boutique) throw new Error('Boutique no encontrada')

  const validRows = products.filter(p => p.name && p.name.trim().length > 0)
  if (validRows.length === 0) throw new Error('No hay productos válidos para importar')

  const productsToInsert = validRows.map(row => ({
    name: row.name.trim(),
    brand: row.brand?.trim() || null,
    season: row.season?.trim() || null,
    size: row.size?.trim() || null,
    color: row.color?.trim() || null,
    sku: row.sku?.trim() || null,
    purchase_price: Number(row.purchase_price) || 0,
    sale_price: Number(row.sale_price) || 0,
    stock: Math.max(0, Math.floor(Number(row.stock) || 0)),
    boutique_id: boutique.id,
    created_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('products').insert(productsToInsert)

  if (error) {
    console.error('Error importando productos:', error)
    throw new Error(`Error al importar: ${error.message}`)
  }

  revalidatePath('/ingresos')
  return { count: productsToInsert.length, boutiqueName: boutique.name }
}
