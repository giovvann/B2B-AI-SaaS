import Dexie, { type Table } from 'dexie'

/**
 * Esquema local-first. Toda lectura/escritura de la UI pasa por aquí.
 * La columna `_synced` marca si el registro ya está replicado en Supabase.
 * `_local` indica si fue creado offline (id local, aún sin id remoto).
 */

export interface LocalProduct {
  id: string
  boutique_id: string
  name: string
  brand?: string | null
  season?: string | null
  size?: string | null
  color?: string | null
  purchase_price: number
  sale_price: number
  stock: number
  updated_at?: string
  _synced?: number // 0 = pendiente, 1 = sincronizado
  _deleted?: number
}

export interface LocalSale {
  id: string
  boutique_id: string
  total_amount: number
  payment_method: string
  created_at?: string
  updated_at?: string
  _synced?: number
  _deleted?: number
}

export interface LocalSaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  price_at_sale: number
  cost_at_sale: number
  _synced?: number
  _deleted?: number
}

export interface LocalExpense {
  id: string
  boutique_id: string
  concept: string
  category: string
  amount: number
  expense_date: string
  note?: string | null
  updated_at?: string
  _synced?: number
  _deleted?: number
}

export interface LocalBoutique {
  id: string
  owner_id: string
  name: string
  updated_at?: string
  _synced?: number
}

/** Op pendiente de empujar a Supabase. */
export interface SyncOp {
  id?: number
  table: 'products' | 'sales' | 'sale_items' | 'expenses' | 'boutiques'
  op: 'insert' | 'update' | 'delete'
  rowId: string
  payload: unknown
  created_at: number
  attempts: number
  status: 'pending' | 'done' | 'error'
  error?: string
}

export class VelioraDB extends Dexie {
  products!: Table<LocalProduct, string>
  sales!: Table<LocalSale, string>
  sale_items!: Table<LocalSaleItem, string>
  expenses!: Table<LocalExpense, string>
  boutiques!: Table<LocalBoutique, string>
  sync_queue!: Table<SyncOp, number>

  constructor() {
    super('veliora')
    this.version(1).stores({
      products: 'id, boutique_id, _synced, _deleted',
      sales: 'id, boutique_id, _synced, _deleted',
      sale_items: 'id, sale_id, _synced, _deleted',
      expenses: 'id, boutique_id, _synced, _deleted',
      boutiques: 'id, owner_id, _synced',
      sync_queue: '++id, table, rowId, status, created_at',
    })
  }
}

export const db = new VelioraDB()

export const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'l-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
