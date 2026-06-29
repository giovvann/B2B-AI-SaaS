'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function verifySuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'Giovva729@hotmail.com'
  
  if (!user || user.email !== SUPERADMIN_EMAIL) {
    throw new Error('Acceso denegado: solo el superadmin puede realizar esta acción')
  }
  
  return { supabase, user }
}

export async function extendSubscription(boutiqueId: string, days: number) {
  const { supabase } = await verifySuperAdmin()
  
  const { data: boutique, error: fetchError } = await supabase
    .from('boutiques')
    .select('subscription_expires_at, name, is_active')
    .eq('id', boutiqueId)
    .single()
  
  if (fetchError || !boutique) {
    throw new Error('Boutique no encontrada')
  }
  
  const baseDate = boutique.subscription_expires_at && new Date(boutique.subscription_expires_at) > new Date()
    ? new Date(boutique.subscription_expires_at)
    : new Date()
  
  baseDate.setDate(baseDate.getDate() + days)
  
  const { error: updateError } = await supabase
    .from('boutiques')
    .update({
      subscription_expires_at: baseDate.toISOString(),
      is_active: true,
    })
    .eq('id', boutiqueId)
  
  if (updateError) {
    throw new Error('Error al actualizar la suscripción')
  }
  
  revalidatePath('/superadmin')
  return { boutiqueName: boutique.name, days }
}

export async function disableBoutique(boutiqueId: string) {
  const { supabase } = await verifySuperAdmin()
  
  const { data: boutique, error: fetchError } = await supabase
    .from('boutiques')
    .select('name')
    .eq('id', boutiqueId)
    .single()
  
  if (fetchError || !boutique) {
    throw new Error('Boutique no encontrada')
  }
  
  const { error: updateError } = await supabase
    .from('boutiques')
    .update({ is_active: false })
    .eq('id', boutiqueId)
  
  if (updateError) {
    throw new Error('Error al deshabilitar la boutique')
  }
  
  revalidatePath('/superadmin')
  return { boutiqueName: boutique.name }
}

export async function cancelTrial(boutiqueId: string) {
  const { supabase } = await verifySuperAdmin()

  const { data: boutique, error: fetchError } = await supabase
    .from('boutiques')
    .select('name')
    .eq('id', boutiqueId)
    .single()

  if (fetchError || !boutique) {
    throw new Error('Boutique no encontrada')
  }

  const { error: updateError } = await supabase
    .from('boutiques')
    .update({
      is_trial: false,
      is_active: false,
      subscription_expires_at: new Date().toISOString(),
    })
    .eq('id', boutiqueId)

  if (updateError) {
    throw new Error('Error al cancelar el trial')
  }

  revalidatePath('/superadmin')
  return { boutiqueName: boutique.name }
}

export async function enableBoutique(boutiqueId: string) {
  const { supabase } = await verifySuperAdmin()
  
  const { data: boutique, error: fetchError } = await supabase
    .from('boutiques')
    .select('name')
    .eq('id', boutiqueId)
    .single()
  
  if (fetchError || !boutique) {
    throw new Error('Boutique no encontrada')
  }
  
  const { error: updateError } = await supabase
    .from('boutiques')
    .update({ is_active: true })
    .eq('id', boutiqueId)
  
  if (updateError) {
    throw new Error('Error al habilitar la boutique')
  }
  
  revalidatePath('/superadmin')
  return { boutiqueName: boutique.name }
}

export async function getBoutiqueDetails(boutiqueId: string) {
  const { supabase } = await verifySuperAdmin()
  
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('*, owner:auth.users!owner_id(email)')
    .eq('id', boutiqueId)
    .single()
  
  if (boutiqueError || !boutique) {
    throw new Error('Boutique no encontrada')
  }
  
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('boutique_id', boutiqueId)
  
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('id, total_amount, created_at')
    .eq('boutique_id', boutiqueId)
    .order('created_at', { ascending: false })
  
  const totalSales = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0
  const lastSale = sales?.[0] || null
  
  return {
    boutique,
    productsCount: productsCount || 0,
    salesCount: sales?.length || 0,
    totalSales,
    lastSale,
  }
}