'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function registrarAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const trial = formData.get('trial') === 'true'

  if (!email || !password) {
    return { error: 'Email y contraseña son obligatorios' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const supabase = await createClient()

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!signUpData.user) {
    return { error: 'No se pudo crear el usuario' }
  }

  const admin = createAdminClient()

  const { error: confirmError } = await admin.auth.admin.updateUserById(
    signUpData.user.id,
    {
      email_confirm: true,
      user_metadata: {
        full_name: email.split('@')[0],
        role: 'owner',
      },
    }
  )

  if (confirmError) {
    return { error: confirmError.message }
  }

  const subscriptionExpiresAt = trial
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { error: boutiqueError } = await admin.from('boutiques').upsert({
    owner_id: signUpData.user.id,
    name: 'Mi Boutique',
    subscription_expires_at: subscriptionExpiresAt,
    is_active: trial ? true : false,
    is_trial: trial ? true : false,
    plan_type: trial ? 'trial' : 'free',
  }, { onConflict: 'owner_id', ignoreDuplicates: true })

  if (boutiqueError) {
    return { error: boutiqueError.message }
  }

  return { success: true, email, password }
}
