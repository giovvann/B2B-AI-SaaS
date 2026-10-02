import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptCode, hashCode, isCodeKeyReady, isVisionReady } from '@/lib/payment-crypto'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/oxxo-giftcard
 * Riel tarjetas de regalo compradas en OXXO ($200, al portador, en efectivo).
 * Dos variantes: tarjeta propia OXXO (se canjea en tienda con código+PIN) y
 * Google Play (canje 100% por código, sin depender del cajero; cuenta Google
 * propia desde los 13 años en México). La clienta sube foto del ticket +
 * tarjeta con código visible. La IA valida monto + fecha + comercio y extrae
 * el código; el código se guarda CIFRADO (nunca en claro) y solo el
 * superadmin lo ve para canjearlo. Anti doble-uso: hash del código (único).
 *
 * Form-data: image (File ticket), image2 (File tarjeta, opcional pero recomendada)
 * Env: GOOGLE_GEMINI_API_KEY / NVIDIA_NIM_* (mismo patrón que comprobante),
 *   PAY_CODE_KEY (64 hex, obligatoria)
 */

const EXPECTED = 200
const WINDOW_HOURS = 30

const PROMPT = `Eres auditor de pagos con tarjeta de regalo en México. Analiza la(s) imagen(es) y devuelve SOLO JSON:
{"monto": number, "fecha_iso": string|null, "comercio": string|null, "producto": string|null, "codigo": string|null, "pin": string|null, "confianza": number}
Reglas: monto = cantidad pagada en MXN por la tarjeta. comercio = comercio del ticket (esperado OXXO). producto = "oxxo" si es tarjeta de regalo OXXO, "play" si es Google Play, otro texto si es otra marca. codigo = código de la tarjeta si visible. pin = PIN del reverso si visible (Google Play no tiene PIN). confianza 0-1 según legibilidad y completitud. Solo JSON puro.`

async function visionValidate(images: { base64: string; mime: string }[]): Promise<any> {
  const nvKey = process.env.NVIDIA_NIM_API_KEY
  const nvBase = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1'
  const nvModel = process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'
  let text = ''
  if (nvKey) {
    try {
      const res = await fetch(nvBase + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + nvKey },
        body: JSON.stringify({
          model: nvModel,
          messages: [{ role: 'user', content: [
            { type: 'text', text: PROMPT },
            ...images.map((im) => ({ type: 'image_url', image_url: { url: `data:${im.mime};base64,${im.base64}` } })),
          ] }],
          max_tokens: 800, temperature: 0.1,
        }),
      })
      if (res.ok) text = (await res.json()).choices?.[0]?.message?.content || ''
    } catch { /* fallback abajo */ }
  }
  if (!text) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const out = await model.generateContent([
      PROMPT,
      ...images.map((im) => ({ inlineData: { data: im.base64, mimeType: im.mime } })),
    ])
    text = (await out.response).text()
  }
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
  return JSON.parse(m ? (m[1] || m[0]) : text)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: boutique } = await supabase
      .from('boutiques').select('id').eq('owner_id', user.id).maybeSingle()
    if (!boutique) return NextResponse.json({ error: 'Boutique no encontrada' }, { status: 404 })

    // Config incompleta (típico: env solo en local, falta en Vercel) →
    // 503 honesto que dirige a rieles vivos en vez de un 500 muerto.
    if (!isVisionReady() || !isCodeKeyReady()) {
      return NextResponse.json({ error: 'Riel OXXO en mantenimiento. Usa ficha o USDC.' }, { status: 503 })
    }

    const form = await req.formData()
    const files = [form.get('image'), form.get('image2')].filter((f): f is File => f instanceof File)
    if (files.length === 0) {
      return NextResponse.json({ error: 'Sube la foto del ticket y de la tarjeta' }, { status: 400 })
    }
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Imagen muy pesada (máx 10MB c/u)' }, { status: 400 })
      }
    }

    const images = await Promise.all(files.map(async (f) => ({
      base64: Buffer.from(await f.arrayBuffer()).toString('base64'),
      mime: f.type || 'image/jpeg',
    })))

    let v: any
    try { v = await visionValidate(images) }
    catch { return NextResponse.json({ error: 'No pude leer las fotos. Sube imágenes más claras.', retry: true }, { status: 422 }) }

    const monto = Number(v.monto) || 0
    const confianza = Number(v.confianza) || 0
    const codigo: string | null = v.codigo ? String(v.codigo).trim().toUpperCase() : null
    const pin: string | null = v.pin ? String(v.pin).trim() : null
    const fecha = v.fecha_iso ? new Date(v.fecha_iso) : null
    const producto = String(v.producto || '').toLowerCase()
    const rail = producto.includes('play') ? 'play_giftcard' : 'oxxo_giftcard'
    const razones: string[] = []

    if (Math.abs(monto - EXPECTED) > 1) razones.push(`monto ${monto} ≠ esperado ${EXPECTED}`)
    if (fecha && (Date.now() - fecha.getTime()) / 36e5 > WINDOW_HOURS) razones.push('ticket vencido (>30h)')
    if (!fecha) razones.push('fecha ilegible')
    if (v.comercio && !/oxxo/i.test(String(v.comercio))) razones.push('comercio no es OXXO')
    if (!/oxxo|play|google/.test(producto)) razones.push('producto no reconocido (solo tarjeta OXXO o Google Play)')
    if (!codigo) razones.push('código de tarjeta ilegible')

    const admin = createAdminClient()
    const codePayload = codigo ? JSON.stringify({ codigo, pin }) : null
    const hash = codigo ? hashCode(codigo) : null

    // Anti doble-uso: mismo código = mismo pago
    if (hash) {
      const { data: dup } = await admin.from('payments')
        .select('id').eq('folio_hash', hash).maybeSingle()
      if (dup) {
        return NextResponse.json({ ok: false, error: 'Esta tarjeta ya está registrada.' }, { status: 409 })
      }
    }

    if (codePayload && hash && razones.length === 0 && confianza >= 0.75) {
      // El insert VA PRIMERO: el unique index es el candado contra doble
      // activación concurrente (si no, dos peticiones = 60 días gratis).
      const { error: insErr } = await admin.from('payments').insert({
        boutique_id: boutique.id, user_id: user.id, rail,
        amount_mxn: EXPECTED, status: 'approved', folio_hash: hash,
        code_enc: encryptCode(codePayload),
        ai_confidence: confianza, ai_reason: `oxxo $${monto} ${fecha?.toISOString()?.slice(0, 10) ?? ''}`.slice(0, 200),
        reviewed_by: 'auto', decided_at: new Date().toISOString(),
      })
      if (insErr) {
        if ((insErr as { code?: string }).code === '23505') {
          return NextResponse.json({ ok: true, auto: true, already: true })
        }
        throw insErr
      }
      const { data: expires } = await admin.rpc('activate_premium', {
        p_boutique_id: boutique.id, p_days: 30,
      })
      return NextResponse.json({ ok: true, auto: true, expires_at: expires })
    }

    // Dudoso o sin código legible → revisión (se guarda cifrado para canje manual)
    await admin.from('payments').insert({
      boutique_id: boutique.id, user_id: user.id, rail,
      amount_mxn: EXPECTED, status: 'pending', folio_hash: hash,
      code_enc: codePayload ? encryptCode(codePayload) : null,
      ai_confidence: confianza,
      ai_reason: razones.join('; ').slice(0, 500) || 'revisión manual',
      reviewed_by: 'auto',
    })
    return NextResponse.json({
      ok: false, pending: true,
      error: 'Quedó en revisión (máx 12h). Tip: para activación inmediata, que en la foto se vean ticket, código y PIN.',
    }, { status: 202 })
  } catch (e: any) {
    console.error('payments/oxxo-giftcard:', e?.message || e)
    return NextResponse.json({ error: 'Error interno. Intenta de nuevo.' }, { status: 500 })
  }
}
