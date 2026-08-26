import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { RoleSelector } from '@/app/RoleSelector'
import { DashboardShell } from '@/components/DashboardShell'
import { TrialClaimBanner } from '@/components/TrialClaimBanner'

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
  let { data: boutique } = await supabase
    .from('boutiques')
    .select('id, name, plan_type')
    .eq('owner_id', user.id)
    .maybeSingle()

  // Cuentas nuevas sin boutique (ej. registro con Google): nacen en plan FREE.
  // ANTI-ABUSO: el trial de 7 días se canjea una sola vez por dispositivo
  // desde el banner del dashboard (/api/claim-trial → claim_trial()).
  if (!boutique) {
    if (role === 'employee') {
      // Empleado sin boutique propia (ej. cuenta Google nueva): re-elegir rol
      return <RoleSelector />
    }
    const admin = createAdminClient()
    const { data: created } = await admin
      .from('boutiques')
      .upsert({
        owner_id: user.id,
        name: (user.user_metadata?.boutique_name as string) || 'Mi Boutique',
        subscription_expires_at: null,
        is_active: true,
        is_trial: false,
        plan_type: 'free',
      }, { onConflict: 'owner_id' })
      .select('id, name, plan_type')
      .single()
    boutique = created
    if (!boutique) redirect('/login')
  }

  return (
    <DashboardShell
      userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'}
      boutiqueName={boutique.name}
      boutiqueId={boutique.id}
    >
      {(boutique as { plan_type?: string }).plan_type === 'free' && <TrialClaimBanner />}
    </DashboardShell>
  )
}
