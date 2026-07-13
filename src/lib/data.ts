import { createClient } from './supabase'
import { db } from './db'

/**
 * Fetch desde Supabase → cachea en Dexie; si falla (offline), lee de Dexie.
 */
async function fetchToCache<T extends { id: string }>(
  table: 'products' | 'sales' | 'sale_items' | 'expenses' | 'boutiques',
  qb: (supabase: ReturnType<typeof createClient>) => any,
): Promise<T[]> {
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const supabase = createClient()
      const { data, error } = await qb(supabase)
      if (error) throw error
      if (data && data.length > 0) {
        const now = new Date().toISOString()
        await db.transaction('rw', db[table], async () => {
          for (const row of data) {
            const cached = { ...row, _synced: 1, updated_at: (row as any).updated_at ?? now }
            await (db[table] as any).put(cached)
          }
        })
      }
      return (data ?? []) as T[]
    } catch {
      // fallback a Dexie
    }
  }
  return (await (db[table] as any).where('_deleted').notEqual(1).toArray()) as T[]
}

export const data = {
  async getProducts(boutiqueId: string) {
    return fetchToCache('products', s =>
      s.from('products').select('*').eq('boutique_id', boutiqueId).order('name')
    )
  },
  async getSales(boutiqueId: string) {
    return fetchToCache('sales', s =>
      s.from('sales').select('*').eq('boutique_id', boutiqueId).order('created_at', { ascending: false }).limit(500)
    )
  },
  async getExpenses(boutiqueId: string) {
    return fetchToCache('expenses', s =>
      s.from('expenses').select('*').eq('boutique_id', boutiqueId).order('expense_date', { ascending: false })
    )
  },
  async getSaleItems(saleIds: string[]) {
    if (saleIds.length === 0) return []
    return fetchToCache('sale_items', s =>
      s.from('sale_items').select('*').in('sale_id', saleIds)
    )
  },
  async getBoutique() {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        const { data: b } = await supabase.from('boutiques').select('*').eq('owner_id', user.id).maybeSingle()
        if (b) await db.boutiques.put({ ...b, _synced: 1 })
        return b
      } catch { /* fallback */ }
    }
    const { data: { user } } = await createClient().auth.getUser()
    if (!user) return null
    return (await db.boutiques.where({ owner_id: user.id }).first()) ?? null
  },
}
