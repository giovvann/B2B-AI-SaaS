'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function switchToFreePlanAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect('/login'); return }

  const { error } = await supabase
    .from('boutiques')
    .update({
      plan_type: 'free',
      is_active: true,
      subscription_expires_at: null,
      is_trial: false,
    })
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)
  redirect('/dashboard')
}