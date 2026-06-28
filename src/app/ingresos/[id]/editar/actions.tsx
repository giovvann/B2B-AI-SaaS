'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProduct(formData: FormData) {
  const productId = formData.get('productId') as string
  const name = formData.get('name') as string
  const brand = formData.get('brand') as string
  const season = formData.get('season') as string
  const size = formData.get('size') as string
  const color = formData.get('color') as string
  const sku = formData.get('sku') as string
  const purchasePrice = parseFloat(formData.get('purchase_price') as string)
  const salePrice = parseFloat(formData.get('sale_price') as string)
  const stock = parseInt(formData.get('stock') as string)

  if (!productId || !name || !name.trim()) throw new Error('Escribe el nombre del producto')
  if (isNaN(purchasePrice) || purchasePrice <= 0) throw new Error('El precio de compra debe ser mayor a 0')
  if (isNaN(salePrice) || salePrice <= 0) throw new Error('El precio de venta debe ser mayor a 0')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No estás autenticado')

  const { data: boutique } = await supabase.from('boutiques').select('id').eq('owner_id', user.id).single()
  if (!boutique) throw new Error('Boutique no encontrada')

  const { error } = await supabase.from('products').update({
    name: name.trim(),
    brand: brand?.trim() || null,
    season: season?.trim() || null,
    size: size?.trim() || null,
    color: color?.trim() || null,
    sku: sku?.trim() || null,
    purchase_price: purchasePrice,
    sale_price: salePrice,
    stock,
  }).eq('id', productId).eq('boutique_id', boutique.id)

  if (error) throw new Error(`Error al guardar: ${error.message}`)
  revalidatePath('/ingresos')
}
