import { createClient } from '@/lib/supabase/server'
import { getOrCreateBoutique } from '@/lib/boutique'
import { redirect } from 'next/navigation'
import { MetricasClient } from './MetricasClient'

export const metadata = {
  title: 'Métricas | Mi Boutique',
  description: 'Análisis visual del rendimiento de tu negocio',
}

export default async function MetricasPage() {
  const supabase = await createClient()

  // 1. Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Verificar que sea dueño (solo dueños ven métricas)
  const role = user.user_metadata?.role
  if (role !== 'owner') {
    redirect('/dashboard')
  }

  // 3. Obtener o crear boutique (atómico, sin race condition)
  const result = await getOrCreateBoutique()
  if ('error' in result) {
    redirect('/dashboard')
  }
  const boutique = { id: result.boutiqueId, name: result.name }

  // 4. Cargar ventas de los últimos 2 años con sus items y productos
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select(`
      id,
      total_amount,
      payment_method,
      created_at,
      sale_items (
        id,
        quantity,
        price_at_sale,
        cost_at_sale,
        product_id,
        products (
          id,
          name,
          brand,
          season,
          size,
          color,
          purchase_price,
          sale_price
        )
      )
    `)
    .eq('boutique_id', boutique.id)
    .gte('created_at', twoYearsAgo.toISOString())
    .order('created_at', { ascending: true })

  if (salesError) {
    console.error('Error cargando ventas:', salesError)
  }

  // 5. Cargar todos los productos del inventario (para producto estrella histórico)
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, brand, season, size, color, sku, sale_price, purchase_price, stock')
    .eq('boutique_id', boutique.id)

  return (
    <MetricasClient
      boutiqueName={boutique.name}
      sales={(sales || []) as any}
      allProducts={allProducts || []}
    />
  )
}