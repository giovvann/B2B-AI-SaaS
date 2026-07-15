import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoleSelector } from '@/app/RoleSelector'
import { DashboardShell } from '@/components/DashboardShell'

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

  // Obtener el rol de la metadata (para compatibilidad con cuentas antiguas)
  const role = user.user_metadata?.role as 'owner' | 'employee' | undefined

  // Si no tiene rol, mostrar selector (cuentas antiguas / migración)
  if (!role) {
    return <RoleSelector />
  }

  // Obtener boutique
  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!boutique) {
    redirect('/login')
  }

  return (
    <DashboardShell
      userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'}
      boutiqueName={boutique.name}
      boutiqueId={boutique.id}
    />
  )
}
