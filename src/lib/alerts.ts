// Lógica de alertas inteligentes (server-side, admin client).
// Tres tipos, todos con dedupe idempotente:
// - record_7d : hoy superó el mejor día de los 7 anteriores. Anti cold-start:
//               exige >=3 días con ventas en los 7 previos (la primera semana
//               de uso NO suena todos los días).
// - stock_out : producto llegó a 0. Se "rearma" al reabastecer (resolved_at +
//               renombrado del dedupe_key para liberar la llave UNIQUE).
// - low_stock : quedan <=2 unidades.
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPush } from './push'
import { formatSize, formatColor } from './product-utils'

const TZ = 'America/Monterrey'
const LOW_STOCK_THRESHOLD = 2
const MIN_DAYS_FOR_RECORD = 3

export interface AlertRow {
  id: string
  boutique_id: string
  type: string
  title: string
  body: string
  url: string
  dedupe_key: string
}

function fmtMoney(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`
}

/** Fecha local del noreste de México como YYYY-MM-DD (Vercel corre en UTC). */
export function localDateKey(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

function productName(p: { name: string; size: string | null; color: string | null }): string {
  const s = formatSize(p.size)
  const c = formatColor(p.color)
  const extra = [s, c].filter(Boolean).join(' · ')
  return extra ? `${p.name} (${extra})` : p.name
}

/** Inserta la alerta solo si no existe (dedupe). Devuelve la fila creada o null. */
async function tryCreate(
  admin: SupabaseClient,
  row: Omit<AlertRow, 'id'>
): Promise<AlertRow | null> {
  const { data: existing } = await admin
    .from('alerts')
    .select('id')
    .eq('boutique_id', row.boutique_id)
    .eq('dedupe_key', row.dedupe_key)
    .maybeSingle()
  if (existing) return null

  const { data, error } = await admin.from('alerts').insert(row).select().single()
  // Carrera por llave UNIQUE (otro proceso la creó primero) → no es error
  if (error) return null
  return data as AlertRow
}

/**
 * Evalúa las condiciones de alerta para una boutique y crea las que falten.
 * Idempotente: correrlo 20 veces seguidas crea cada alerta una sola vez.
 */
export async function evaluateAlerts(
  admin: SupabaseClient,
  boutiqueId: string
): Promise<AlertRow[]> {
  const created: AlertRow[] = []
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()

  const [{ data: products, error: pErr }, { data: recentSales, error: sErr }] = await Promise.all([
    admin.from('products').select('id,name,size,color,stock').eq('boutique_id', boutiqueId),
    admin
      .from('sales')
      .select('id,total_amount,created_at')
      .eq('boutique_id', boutiqueId)
      .gte('created_at', eightDaysAgo),
  ])
  if (pErr) throw pErr
  if (sErr) throw sErr

  // ── Récord de 7 días ──
  const daily: Record<string, number> = {}
  for (const s of recentSales ?? []) {
    const k = localDateKey(new Date(s.created_at))
    daily[k] = (daily[k] || 0) + Number(s.total_amount || 0)
  }
  const todayKey = localDateKey(new Date())
  const todayTotal = daily[todayKey] || 0

  let daysWithSales = 0
  let bestPast = 0
  for (let i = 1; i <= 7; i++) {
    const k = localDateKey(new Date(Date.now() - i * 24 * 3600 * 1000))
    const t = daily[k] || 0
    if (t > 0) daysWithSales++
    if (t > bestPast) bestPast = t
  }

  // Anti cold-start: sin >=3 días con ventas en la semana previa, no hay
  // "récord" que celebrar (evita sonar diario la primera semana).
  if (daysWithSales >= MIN_DAYS_FOR_RECORD && todayTotal > bestPast && todayTotal > 0) {
    const a = await tryCreate(admin, {
      boutique_id: boutiqueId,
      type: 'record_7d',
      title: '¡Récord de ventas!',
      body: `Hoy llevas ${fmtMoney(todayTotal)}, superando tu mejor día de los últimos 7 días (${fmtMoney(bestPast)}).`,
      url: '/metricas',
      dedupe_key: `record_7d:${todayKey}`,
    })
    if (a) created.push(a)
  }

  // ── Agotado / stock bajo ──
  for (const p of products ?? []) {
    const stock = Number(p.stock || 0)
    const label = productName(p)
    if (stock <= 0) {
      const a = await tryCreate(admin, {
        boutique_id: boutiqueId,
        type: 'stock_out',
        title: 'Producto agotado',
        body: `${label} se quedó sin stock. Considera reponerlo.`,
        url: '/ingresos',
        dedupe_key: `stock_out:${p.id}`,
      })
      if (a) created.push(a)
    } else if (stock <= LOW_STOCK_THRESHOLD) {
      const a = await tryCreate(admin, {
        boutique_id: boutiqueId,
        type: 'low_stock',
        title: 'Stock bajo',
        body: `${label}: solo quedan ${stock} unidad(es).`,
        url: '/ingresos',
        dedupe_key: `low_stock:${p.id}`,
      })
      if (a) created.push(a)
    }
  }

  // ── Rearme: producto reabastecido resuelve su alerta y libera la llave ──
  const { data: open } = await admin
    .from('alerts')
    .select('id,type,dedupe_key')
    .eq('boutique_id', boutiqueId)
    .is('resolved_at', null)
    .in('type', ['stock_out', 'low_stock'])

  const stockById = new Map((products ?? []).map((p) => [p.id, Number(p.stock || 0)]))
  for (const al of open ?? []) {
    const pid = al.dedupe_key.split(':')[1]
    const stock = stockById.get(pid)
    if (stock === undefined) continue
    const healed = al.type === 'stock_out' ? stock > 0 : stock > LOW_STOCK_THRESHOLD
    if (healed) {
      // Renombrar dedupe_key libera la llave UNIQUE: si vuelve a agotarse,
      // se crea una alerta nueva.
      await admin
        .from('alerts')
        .update({ resolved_at: new Date().toISOString(), dedupe_key: `${al.dedupe_key}:r:${Date.now()}` })
        .eq('id', al.id)
    }
  }

  return created
}

/**
 * Envía push de cada alerta a las suscripciones de la boutique y marca
 * notified_at (aunque no haya suscripciones, para no reintentar en infinito).
 */
export async function notifyAlerts(
  admin: SupabaseClient,
  boutiqueId: string,
  alerts: AlertRow[]
): Promise<number> {
  if (alerts.length === 0) return 0

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint,keys_p256dh,keys_auth')
    .eq('boutique_id', boutiqueId)
  const targets = subs ?? []
  let delivered = 0

  for (const a of alerts) {
    if (targets.length > 0) {
      const results = await Promise.all(
        targets.map((s) =>
          sendPush(
            { endpoint: s.endpoint, keys: { p256dh: s.keys_p256dh, auth: s.keys_auth } },
            { title: a.title, body: a.body, url: a.url, tag: `veliora-alert-${a.id}` }
          )
        )
      )
      if (results.some(Boolean)) delivered++
      const dead = results
        .map((ok, i) => (ok ? null : targets[i].endpoint))
        .filter(Boolean) as string[]
      if (dead.length > 0) {
        await admin.from('push_subscriptions').delete().in('endpoint', dead)
      }
    }
    await admin.from('alerts').update({ notified_at: new Date().toISOString() }).eq('id', a.id)
  }

  return delivered
}
