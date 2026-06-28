'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteProduct(formData: FormData) {
  const productId = formData.get('productId') as string

  if (!productId) throw new Error('ID de producto inválido')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No estás autenticado')

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!boutique) throw new Error('No se encontró tu boutique')

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('boutique_id', boutique.id)

  if (error) throw new Error('Error al eliminar el producto')

  revalidatePath('/ingresos')
}
