'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function syncBoutiqueAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No hay sesión activa', needsLogin: true }
  }

  const { data: existing } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()

  const admin = createAdminClient()

  if (existing) {
    const role = user.user_metadata?.role
    if (!role) {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role: 'owner' },
      })
    }
    return { boutiqueId: existing.id, name: existing.name, alreadyExists: true }
  }

  const { data: inserted, error: insertError } = await admin
    .from('boutiques')
    .insert({
      owner_id: user.id,
      name: 'Mi Boutique',
      is_active: true,
      is_trial: true,
    })
    .select('id, name')
    .single()

  if (insertError) {
    return { error: `Error creando boutique: ${insertError.message}` }
  }

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, role: 'owner' },
  })

  return { boutiqueId: inserted.id, name: inserted.name, created: true }
}
