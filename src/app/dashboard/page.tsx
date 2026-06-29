import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoleSelector } from '@/app/RoleSelector'
import { HomePageContent } from './HomePageContent'

export const metadata = {
  title: 'Inicio | Mi Boutique',
  description: 'Gestiona tu boutique de forma inteligente',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener el rol de la metadata del usuario
  const role = user.user_metadata?.role as 'owner' | 'employee' | undefined

  // Si no tiene rol, mostrar selector
  if (!role) {
    return <RoleSelector />
  }

  // Obtener nombre de la boutique para mostrarlo
  const { data: boutique } = await supabase
    .from('boutiques')
    .select('name')
    .eq('owner_id', user.id)
    .maybeSingle()

  return (
    <HomePageContent 
      role={role} 
      userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'}
      boutiqueName={boutique?.name || 'Mi Boutique'}
    />
  )
}
