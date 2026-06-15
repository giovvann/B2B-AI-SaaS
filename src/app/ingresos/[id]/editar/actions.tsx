'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProduct(formData: FormData) {
  const productId = formData.get('productId') as string
  const name = formData.get('name') as string
  const brand = formData.get('brand') as string
  const season = formData.get('season') as string
  const purchasePrice = parseFloat(formData.get('purchase_price') as string)
  const salePrice = parseFloat(formData.get('sale_price') as string)
  const stock = parseInt(formData.get('stock') as string)

  // Validaciones
  if (!productId || !name || !name.trim()) {
    throw new Error('El nombre del producto es requerido')
  }
  if (isNaN(purchasePrice) || purchasePrice <= 0) {
    throw new Error('El precio de compra debe ser mayor a 0')
  }
  if (isNaN(salePrice) || salePrice <= 0) {
    throw new Error('El precio de venta debe ser mayor a 0')
  }
  if (isNaN(stock) || stock < 0) {
    throw new Error('El stock no puede ser negativo')
  }

  const supabase = await createClient()

  // 1. Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('No estás autenticado')
  }

  // 2. Obtener la boutique del usuario
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (boutiqueError || !boutique) {
    throw new Error('No se encontró tu boutique')
  }

  // 3. Verificar que el producto pertenece a la boutique
  const { data: existingProduct, error: checkError } = await supabase
    .from('products')
    .select('id, boutique_id')
    .eq('id', productId)
    .single()

  if (checkError || !existingProduct) {
    throw new Error('Producto no encontrado')
  }

  if (existingProduct.boutique_id !== boutique.id) {
    throw new Error('No tienes permiso para editar este producto')
  }

  // 4. Actualizar el producto
  const { error } = await supabase
    .from('products')
    .update({
      name: name.trim(),
      brand: brand?.trim() || null,
      season: season?.trim() || null,
      purchase_price: purchasePrice,
      sale_price: salePrice,
      stock: stock,
    })
    .eq('id', productId)
    .eq('boutique_id', boutique.id)

  if (error) {
    console.error('Error actualizando producto:', error)
    throw new Error('Error al actualizar el producto')
  }

  // 5. Revalidar la página de inventario
  revalidatePath('/ingresos')
}