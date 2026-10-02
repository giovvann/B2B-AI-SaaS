import { createAdminClient } from '@/lib/supabase/admin'
import { isPlanActive } from './plan-utils'

/**
 * Límite de productos del plan Gratis.
 * Premium y trial activo = ilimitado. Todo lo demás (free, expirado) = tope.
 * Se verifica en las 3 vías de creación: manual, escaneo IA e importación.
 */

export const FREE_PRODUCT_LIMIT = 150

/** Decisión pura (testeable): ¿current + incoming rebasa el tope? */
export function wouldExceedLimit(
  current: number,
  incoming: number,
  limit: number = FREE_PRODUCT_LIMIT
): boolean {
  return current + incoming > limit
}

export function limitMessage(current: number): string {
  return `Plan Gratis: hasta ${FREE_PRODUCT_LIMIT} productos (tienes ${current}). Activa Premium para ilimitados.`
}

export interface LimitBlock {
  error: string
  type: 'limit_reached'
  current: number
}

/**
 * Devuelve null si puede guardar, o LimitBlock si el plan lo impide.
 * Usa admin client (las server actions ya corren del lado servidor).
 */
export async function assertProductLimit(
  boutiqueId: string,
  incomingCount: number
): Promise<LimitBlock | null> {
  const admin = createAdminClient()
  const { data: boutique } = await admin
    .from('boutiques')
    .select('plan_type, subscription_expires_at, is_active')
    .eq('id', boutiqueId)
    .maybeSingle()

  // Sin boutique o con plan activo: no limitar aquí (el flujo normal decide).
  if (!boutique || isPlanActive(boutique)) return null

  const { count } = await admin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('boutique_id', boutiqueId)
  const current = count ?? 0

  if (wouldExceedLimit(current, incomingCount)) {
    return { error: limitMessage(current), type: 'limit_reached', current }
  }
  return null
}
