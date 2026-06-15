'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteProduct(formData: FormData) {
  const productId = formData.get('productId') as string

  if (!productId) {
    throw new Error('ID de producto inválido')
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

  // 3. Eliminar SOLO si el producto pertenece a la boutique del usuario
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('boutique_id', boutique.id) // ← Seguridad: no se puede borrar productos de otros

  if (error) {
    console.error('Error eliminando producto:', error)
    throw new Error('Error al eliminar el producto')
  }

  // 4. Revalidar la página para que se actualice el cache
  revalidatePath('/ingresos')
}