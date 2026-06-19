'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ProductImport {
  name: string
  brand?: string
  season?: string
  purchase_price: number
  sale_price: number
  stock: number
}

export async function importProducts(products: ProductImport[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('No estás autenticado')
  }
  
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()
  
  if (boutiqueError || !boutique) {
    throw new Error('Boutique no encontrada')
  }
  
  // Validar y limpiar datos
  const validProducts = products
    .filter(p => p.name && p.name.trim().length > 0)
    .map(p => ({
      name: p.name.trim(),
      brand: p.brand?.trim() || null,
      season: p.season?.trim() || null,
      purchase_price: Number(p.purchase_price) || 0,
      sale_price: Number(p.sale_price) || 0,
      stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
      boutique_id: boutique.id,
      created_at: new Date().toISOString(),
    }))
  
  if (validProducts.length === 0) {
    throw new Error('No hay productos válidos para importar')
  }
  
  // Insertar en lotes de 100 para evitar timeouts
  const BATCH_SIZE = 100
  let totalInserted = 0
  
  for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
    const batch = validProducts.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('products')
      .insert(batch)
    
    if (error) {
      console.error('Error insertando lote:', error)
      throw new Error(`Error importando productos: ${error.message}`)
    }
    
    totalInserted += batch.length
  }
  
  revalidatePath('/ingresos')
  
  return {
    count: totalInserted,
    boutiqueName: boutique.name,
  }
}