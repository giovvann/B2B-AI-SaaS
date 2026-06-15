import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EditarProductoClient } from './EditarProductoClient'

export const metadata = {
  title: 'Editar Producto | Mi Boutique',
  description: 'Edita la información de un producto de tu inventario',
}

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Verificar que el usuario esté autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Obtener la boutique del usuario
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (boutiqueError || !boutique) {
    redirect('/')
  }

  // 3. Obtener el producto específico (solo si pertenece a su boutique)
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, brand, season, purchase_price, sale_price, stock, created_at, boutique_id')
    .eq('id', id)
    .eq('boutique_id', boutique.id)
    .single()

  if (productError || !product) {
    // Producto no existe o no pertenece a esta boutique
    notFound()
  }

  return (
    <EditarProductoClient 
      product={product} 
      boutiqueName={boutique.name}
    />
  )
}