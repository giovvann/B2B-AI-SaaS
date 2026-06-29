import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EditarProductoClient } from './EditarProductoClient'

export const metadata = {
  title: 'Editar Producto | Mi Boutique',
  description: 'Edita la información de un producto de tu inventario',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!boutique) redirect('/dashboard')

  const { data: product } = await supabase
    .from('products')
    .select('id, name, brand, season, size, color, sku, purchase_price, sale_price, stock')
    .eq('id', id)
    .eq('boutique_id', boutique.id)
    .single()

  if (!product) notFound()

  return (
    <EditarProductoClient
      product={product}
      boutiqueName={boutique.name}
    />
  )
}
