'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function registrarAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const boutiqueName = (formData.get('boutique_name') as string) || 'Mi Boutique'

  if (!email || !password) {
    return { error: 'Email y contraseña son obligatorios' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  if (!boutiqueName.trim()) {
    return { error: 'El nombre de la boutique es obligatorio' }
  }

  const supabase = await createClient()

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    // Check if user already exists (e.g. via Google OAuth)
    if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists') || signUpError.status === 400) {
      // Try to see if there's a user with this email already
      return { error: 'Este correo ya está registrado. Si usaste Google, inicia sesión con Google.' }
    }
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
        boutique_name: boutiqueName.trim(),
      },
    }
  )

  if (confirmError) {
    return { error: confirmError.message }
  }

  // ANTI-ABUSO (22-ago-2026): toda cuenta nueva nace en plan FREE. El trigger
  // on_user_created ya crea la boutique free durante signUp; esta upsert solo
  // fija el nombre (ignoreDuplicates:false = UPDATE en conflicto owner_id).
  // El trial de 7 días se canjea UNA sola vez por dispositivo vía
  // /api/claim-trial → función claim_trial (tabla trial_redemptions).
  const { error: boutiqueError } = await admin.from('boutiques').upsert({
    owner_id: signUpData.user.id,
    name: boutiqueName.trim(),
    subscription_expires_at: null,
    is_active: true,
    is_trial: false,
    plan_type: 'free',
  }, { onConflict: 'owner_id', ignoreDuplicates: false })

  if (boutiqueError) {
    return { error: boutiqueError.message }
  }

  return { success: true, email, password }
}
