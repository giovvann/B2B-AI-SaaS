import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SuperAdminClient } from './SuperAdminClient'

export const metadata = {
  title: 'SuperAdmin | Mi Boutique SaaS',
  description: 'Panel de administración del SaaS',
}

interface BoutiqueWithEmail {
  id: string
  name: string
  owner_id: string
  owner_email: string
  created_at: string
  subscription_expires_at: string | null
  is_active: boolean
}

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'Giovva729@hotmail.com'
  
  // 1. Verificar que sea el superadmin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== SUPERADMIN_EMAIL.toLowerCase()) {
    redirect('/')
  }
  
  // 2. Obtener todas las boutiques con email del dueño usando la vista
  const { data: boutiques, error } = await supabase
    .from('boutiques_with_emails')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error cargando boutiques:', error)
    // Si la vista no existe, intentar con boutiques normal (sin email)
    const { data: fallback } = await supabase
      .from('boutiques')
      .select('id, name, owner_id, created_at, subscription_expires_at, is_active')
      .order('created_at', { ascending: false })
    
    const boutiquesWithEmails: BoutiqueWithEmail[] = (fallback || []).map(b => ({
      ...b,
      owner_email: 'Email no disponible',
    }))
    
    return <SuperAdminClient boutiques={boutiquesWithEmails} />
  }
  
  return <SuperAdminClient boutiques={boutiques as BoutiqueWithEmail[]} />
}