import { createClient } from '@/lib/supabase/server'
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
    redirect('/')
  }

  // 3. Obtener boutique
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (boutiqueError || !boutique) {
    redirect('/')
  }

  // 4. Cargar TODAS las ventas históricas con sus items y productos
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
          purchase_price,
          sale_price
        )
      )
    `)
    .eq('boutique_id', boutique.id)
    .order('created_at', { ascending: true })

  if (salesError) {
    console.error('Error cargando ventas:', salesError)
  }

  // 5. Cargar todos los productos del inventario (para producto estrella histórico)
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, brand, season, sale_price, purchase_price, stock')
    .eq('boutique_id', boutique.id)

  return (
    <MetricasClient
      boutiqueName={boutique.name}
      sales={sales || []}
      allProducts={allProducts || []}
    />
  )
}