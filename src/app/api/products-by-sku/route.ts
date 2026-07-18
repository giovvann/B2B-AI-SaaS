import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/products-by-sku?sku=xxx&boutiqueId=xxx
 * 
 * Busca un producto por SKU en la boutique del usuario.
 * Si se encuentra, devuelve los datos para agregar stock.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sku = searchParams.get('sku')?.trim().toUpperCase()
    const boutiqueId = searchParams.get('boutiqueId')

    if (!sku) {
      return NextResponse.json({ error: 'SKU requerido' }, { status: 400 })
    }

    if (!boutiqueId) {
      return NextResponse.json({ error: 'boutiqueId requerido' }, { status: 400 })
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, brand, size, color, sale_price, purchase_price, stock, sku')
      .eq('boutique_id', boutiqueId)
      .eq('sku', sku)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Error buscando producto' }, { status: 500 })
    }

    return NextResponse.json({ found: !!product, product })
  } catch (error) {
    console.error('Error en products-by-sku:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
