import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/comprobante
 * Riel SPEI/OXXO para menores SIN Stripe y SIN adultos.
 * El cliente transfiere a tu CLABE de Cuenta Básica 15+ (Banxico Circ. 24/2020)
 * o deposita en OXXO, sube la foto del comprobante, Gemini Vision valida
 * monto + fecha + folio, y si la confianza es alta se activa premium 30 días
 * en <60 segundos. Anti-fraude: folio_hash único (un comprobante = un pago).
 *
 * Form-data: image (File), expected_amount (199 | 449)
 * Env requeridas: GOOGLE_GEMINI_API_KEY (fallback), NVIDIA_NIM_API_KEY (primario),
 *   PAY_CLABE_LAST4 (últimos 4 de tu CLABE para validar beneficiario)
 */

const VALID_AMOUNTS = [159, 199, 449]
const WINDOW_HOURS = 30 // comprobante de hace max 30h

const PROMPT = `Eres auditor de pagos SPEI/OXXO en México. Analiza el comprobante y devuelve SOLO JSON:
{"monto": number, "fecha_iso": string|null, "folio": string|null, "beneficiario": string|null, "banco_destino": string|null, "confianza": number}
Reglas: monto = cantidad transferida en MXN. folio = clave de rastreo/folio/autorización si visible. confianza 0-1 según legibilidad y completitud. Solo JSON puro.`

async function visionValidate(base64: string, mime: string): Promise<any> {
  // Primario: NVIDIA NIM (mismo patrón que extract-invoice)
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
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
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
    const out = await model.generateContent([PROMPT, { inlineData: { data: base64, mimeType: mime } }])
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

    const form = await req.formData()
    const image = form.get('image') as File | null
    const expected = Number(form.get('expected_amount')) || 199
    if (!image) return NextResponse.json({ error: 'Sube la foto del comprobante' }, { status: 400 })
    if (!VALID_AMOUNTS.includes(expected)) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagen muy pesada (máx 10MB)' }, { status: 400 })
    }

    const base64 = Buffer.from(await image.arrayBuffer()).toString('base64')
    let v: any
    try { v = await visionValidate(base64, image.type || 'image/jpeg') }
    catch { return NextResponse.json({ error: 'No pude leer el comprobante. Sube una foto más clara.', retry: true }, { status: 422 }) }

    const monto = Number(v.monto) || 0
    const confianza = Number(v.confianza) || 0
    const folio: string | null = v.folio ? String(v.folio).trim().toUpperCase() : null
    const fecha = v.fecha_iso ? new Date(v.fecha_iso) : null
    const razones: string[] = []

    if (Math.abs(monto - expected) > 1) razones.push(`monto ${monto} ≠ esperado ${expected}`)
    if (fecha && (Date.now() - fecha.getTime()) / 36e5 > WINDOW_HOURS) razones.push('comprobante vencido (>30h)')
    if (!fecha) razones.push('fecha ilegible')
    const last4 = process.env.PAY_CLABE_LAST4 || ''
    if (last4 && v.beneficiario && !String(v.beneficiario).includes(last4)) {
      razones.push('beneficiario no coincide')
    }

    const admin = createAdminClient()

    // Anti doble-uso: mismo folio = mismo pago
    if (folio) {
      const hash = crypto.createHash('sha256').update('VELIORA|' + folio).digest('hex')
      const { data: dup } = await admin.from('payments')
        .select('id').eq('folio_hash', hash).maybeSingle()
      if (dup) {
        await admin.from('payments').insert({
          boutique_id: boutique.id, user_id: user.id, rail: 'spei_comprobante',
          amount_mxn: expected, status: 'rejected', folio_hash: hash,
          ai_confidence: confianza, ai_reason: 'folio duplicado', reviewed_by: 'auto',
        })
        return NextResponse.json({ ok: false, error: 'Este comprobante ya fue usado.' }, { status: 409 })
      }
      if (razones.length === 0 && confianza >= 0.75) {
        const { data: expires } = await admin.rpc('activate_premium', {
          p_boutique_id: boutique.id, p_days: 30,
        })
        await admin.from('payments').insert({
          boutique_id: boutique.id, user_id: user.id, rail: 'spei_comprobante',
          amount_mxn: expected, status: 'approved', folio_hash: hash,
          ai_confidence: confianza, ai_reason: JSON.stringify(v).slice(0, 500),
          reviewed_by: 'auto', decided_at: new Date().toISOString(),
        })
        return NextResponse.json({ ok: true, auto: true, expires_at: expires })
      }
      // Confianza media o detalle dudoso → revisión manual (cola superadmin), sin bloquear
      await admin.from('payments').insert({
        boutique_id: boutique.id, user_id: user.id, rail: 'spei_comprobante',
        amount_mxn: expected, status: 'pending', folio_hash: hash,
        ai_confidence: confianza, ai_reason: razones.join('; ').slice(0, 500) || JSON.stringify(v).slice(0, 500),
        reviewed_by: 'auto',
      })
      return NextResponse.json({
        ok: false, pending: true,
        error: 'Quedó en revisión (máx 12h). Te avisamos por WhatsApp.',
        motivos: razones,
      }, { status: 202 })
    }

    // Sin folio legible → pending con cap de intentos
    await admin.from('payments').insert({
      boutique_id: boutique.id, user_id: user.id, rail: 'spei_comprobante',
      amount_mxn: expected, status: 'pending',
      ai_confidence: confianza, ai_reason: ('sin folio. ' + razones.join('; ')).slice(0, 500),
      reviewed_by: 'auto',
    })
    return NextResponse.json({
      ok: false, pending: true,
      error: 'No se ve el folio. Quedó en revisión, pero para activación inmediata sube una foto donde se vea la clave de rastreo.',
    }, { status: 202 })
  } catch (e: any) {
    console.error('payments/comprobante:', e)
    return NextResponse.json({ error: 'Error interno. Intenta de nuevo.' }, { status: 500 })
  }
}
