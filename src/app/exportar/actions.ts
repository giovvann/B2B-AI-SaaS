'use server'

import { createClient } from '@/lib/supabase/server'

async function getBoutique() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('No estás autenticado')
  }
  
  const { data: boutique, error } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()
  
  if (error || !boutique) {
    throw new Error('Boutique no encontrada')
  }
  
  return { supabase, boutique, user }
}

export async function exportInventory() {
  const { supabase, boutique } = await getBoutique()
  
  const { data: products, error } = await supabase
    .from('products')
    .select('name, brand, season, purchase_price, sale_price, stock, created_at')
    .eq('boutique_id', boutique.id)
    .order('name')
  
  if (error) {
    throw new Error('Error al obtener productos')
  }
  
  // Transformar a formato plano para exportar
  const exportData = (products || []).map(p => ({
    Nombre: p.name,
    Marca: p.brand || '',
    Temporada: p.season || '',
    Precio_Compra: p.purchase_price,
    Precio_Venta: p.sale_price,
    Stock: p.stock,
    Fecha_Creacion: p.created_at,
  }))
  
  return {
    data: exportData,
    boutiqueName: boutique.name,
    count: exportData.length,
  }
}

export async function exportSales() {
  const { supabase, boutique } = await getBoutique()
  
  const { data: sales, error } = await supabase
    .from('sales')
    .select(`
      id,
      total_amount,
      payment_method,
      created_at,
      sale_items (
        quantity,
        price_at_sale,
        cost_at_sale,
        products (name, brand)
      )
    `)
    .eq('boutique_id', boutique.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    throw new Error('Error al obtener ventas')
  }
  
  // Expandir cada item de venta como una fila
  const exportData: any[] = []
  
  for (const sale of (sales || [])) {
    for (const item of (sale.sale_items || [])) {
      const product = item.products as any
      exportData.push({
        Venta_ID: sale.id,
        Fecha: sale.created_at,
        Metodo_Pago: sale.payment_method,
        Producto: product?.name || 'Producto eliminado',
        Marca: product?.brand || '',
        Cantidad: item.quantity,
        Precio_Unitario: item.price_at_sale,
        Costo_Unitario: item.cost_at_sale,
        Subtotal: item.price_at_sale * item.quantity,
        Ganancia: (item.price_at_sale - item.cost_at_sale) * item.quantity,
        Total_Venta: sale.total_amount,
      })
    }
  }
  
  return {
    data: exportData,
    boutiqueName: boutique.name,
    count: exportData.length,
  }
}