import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Obtiene la boutique del usuario autenticado, creándola de forma ATÓMICA si no existe.
 *
 * Usa UPSERT con onConflict: 'owner_id' para evitar el race condition que creaba
 * boutiques duplicadas cuando varias peticiones concurrían (get-or-create inseguro).
 * Requiere el constraint UNIQUE(owner_id) en la tabla boutiques.
 *
 * @returns { boutiqueId, name } o { error }
 */
export async function getOrCreateBoutique() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No hay sesión activa', needsLogin: true as const }
  }

  // 1. Intentar leer la boutique existente (camino rápido, la mayoría de las veces)
  const { data: existing } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (existing) {
    return { boutiqueId: existing.id, name: existing.name }
  }

  // 2. No existe: crear de forma atómica con UPSERT.
  //    Si dos peticiones corren a la vez, onConflict garantiza que solo haya una fila.
  const admin = createAdminClient()
  const { data: upserted, error: upsertError } = await admin
    .from('boutiques')
    .upsert(
      { owner_id: user.id, name: 'Mi Boutique', is_active: true, is_trial: true },
      { onConflict: 'owner_id', ignoreDuplicates: false }
    )
    .select('id, name')
    .single()

  if (upsertError || !upserted) {
    return { error: `Error creando boutique: ${upsertError?.message ?? 'desconocido'}` }
  }

  // Asegurar el rol de dueño en la metadata (idempotente)
  if (!user.user_metadata?.role) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role: 'owner' },
    })
  }

  return { boutiqueId: upserted.id, name: upserted.name }
}
