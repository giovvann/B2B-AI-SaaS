import { db, uuid, type SyncOp } from './db'
import { createClient } from './supabase'

/**
 * Motor de sincronización local-first.
 * - pushQueue(): empuja cada op pendiente a Supabase (respetando RLS).
 * - pull(): al reconectar, baja registros remotos modificados después del
 *   último updated_at local (last-write-wins con updated_at).
 * - writeLocal(): escribe en Dexie y encola op. Única vía de mutación de la UI.
 */

const TABLE_TO_REMOTE: Record<string, string> = {
  products: 'products',
  sales: 'sales',
  sale_items: 'sale_items',
  expenses: 'expenses',
  boutiques: 'boutiques',
}

export type SyncState = {
  online: boolean
  pending: number
  syncing: boolean
  lastSync: number | null
  error: string | null
}

export const MAX_ATTEMPTS = 5

function stripMeta<T extends object>(row: T): Partial<T> {
  const { _synced, _deleted, ...rest } = row as Record<string, unknown>
  return rest as Partial<T>
}

/** Escribe localmente y encola la operación para empujar luego. */
export async function writeLocal(
  table: SyncOp['table'],
  op: SyncOp['op'],
  row: Record<string, unknown>
) {
  const now = new Date().toISOString()
  const rowWithMeta = { ...row, updated_at: now, _synced: 0 }

  await db.transaction('rw', db[table], db.sync_queue, async () => {
    // @ts-expect-error índice dinámico por nombre de tabla
    await db[table].put(rowWithMeta)
    await db.sync_queue.add({
      table,
      op,
      rowId: String(row.id),
      payload: stripMeta(rowWithMeta),
      created_at: Date.now(),
      attempts: 0,
      status: 'pending',
    } as SyncOp)
  })

  // Si hay red, dispara push en segundo plano (no bloquea la UI).
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    void pushQueue()
  }
}

/** Empuja todas las ops pendientes a Supabase. */
export async function pushQueue(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  const pending = await db.sync_queue
    .where('status')
    .anyOf('pending', 'error')
    .toArray()

  if (pending.length === 0) return

  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return // sin sesión, reintenta después

  for (const op of pending) {
    try {
      const remote = TABLE_TO_REMOTE[op.table]
      const payload = op.payload as Record<string, unknown>

      if (op.op === 'delete') {
        await supabase.from(remote).delete().eq('id', op.rowId)
      } else if (op.op === 'insert' || op.op === 'update') {
        // upsert: idempotente. onConflict por id.
        await (supabase.from(remote).upsert(payload) as unknown as Promise<unknown>)
      }

      await db.transaction('rw', db[op.table], db.sync_queue, async () => {
        await db[op.table].update(op.rowId, { _synced: 1 })
        await db.sync_queue.update(op.id!, { status: 'done' })
      })
    } catch (e: unknown) {
      const attempts = op.attempts + 1
      const msg = e instanceof Error ? e.message : String(e)
      if (attempts >= MAX_ATTEMPTS) {
        await db.sync_queue.update(op.id!, { status: 'error', error: msg, attempts })
      } else {
        await db.sync_queue.update(op.id!, { attempts, error: msg })
      }
    }
  }

  // Limpia ops completadas.
  await db.sync_queue.where('status').equals('done').delete()
}

/** Pull incremental: baja remotos modificados tras el último updated_at local. */
export async function pull(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  const tables: SyncOp['table'][] = ['products', 'sales', 'sale_items', 'expenses', 'boutiques']

  for (const t of tables) {
    const remote = TABLE_TO_REMOTE[t]
    // último updated_at local conocido
    const localRows = await (db[t] as unknown as { toArray: () => Promise<{ updated_at?: string }[]> }).toArray()
    const maxLocal = localRows
      .map(r => r.updated_at)
      .filter(Boolean)
      .sort()
      .slice(-1)[0]

    let q = supabase.from(remote).select('*')
    if (maxLocal) q = q.gt('updated_at', maxLocal)

    const { data, error } = await q
    if (error || !data) continue

    await db.transaction('rw', db[t], async () => {
      for (const row of data as Record<string, unknown>[]) {
        // @ts-expect-error índice dinámico
        await db[t].put({ ...row, _synced: 1 })
      }
    })
  }
}

/** Arranca el motor: pull inicial + listeners de reconexión. */
export function startSyncEngine(onState?: (s: Partial<SyncState>) => void) {
  const go = async () => {
    onState?.({ syncing: true, online: true })
    try {
      await pull()
      await pushQueue()
      onState?.({ lastSync: Date.now(), pending: await pendingCount(), error: null })
    } catch (e) {
      onState?.({ error: e instanceof Error ? e.message : String(e) })
    } finally {
      onState?.({ syncing: false })
    }
  }

  if (typeof window === 'undefined') return () => {}

  if (navigator.onLine) void go()
  window.addEventListener('online', go)
  const onOffline = () => onState?.({ online: false })
  window.addEventListener('offline', onOffline)
  return () => {
    window.removeEventListener('online', go)
    window.removeEventListener('offline', onOffline)
  }
}

export async function pendingCount(): Promise<number> {
  return db.sync_queue.where('status').anyOf('pending', 'error').count()
}

export { uuid }
