import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/add-stock
 * 
 * Agrega stock a un producto existente (usado cuando se escanea
 * un código de barras de un producto ya registrado).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { productId, quantity } = await request.json()

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'productId y quantity > 0 requeridos' }, { status: 400 })
    }

    // Obtener el producto actual
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, stock, boutique_id')
      .eq('id', productId)
      .single()

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Verificar que el producto pertenece a la boutique del usuario
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('id')
      .eq('owner_id', user.id)
      .eq('id', product.boutique_id)
      .single()

    if (!boutique) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Actualizar stock
    const newStock = (product.stock || 0) + quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)

    if (updateError) {
      return NextResponse.json({ error: 'Error actualizando stock' }, { status: 500 })
    }

    return NextResponse.json({ success: true, newStock })
  } catch (error) {
    console.error('Error en add-stock:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
