import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/crypto-webhook
 * Riel USDC en Solana — 100% automático, sin KYC, sin adultos, sin bancos.
 * Helius (plan gratis) vigila tu dirección y avisa aquí por cada pago.
 * Este endpoint verifica firma + monto y activa premium 30 días al instante.
 *
 * Setup: Helius.dev → webhook a https://TU-DOMINIO/api/payments/crypto-webhook
 * con header Authorization: Bearer <HELIUS_AUTH>.
 * Env: PAY_WALLET_SOLANA, HELIUS_AUTH, PAY_USDC_CENTS (default 1050)
 */

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  if (!process.env.HELIUS_AUTH || auth !== `Bearer ${process.env.HELIUS_AUTH}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const txs = Array.isArray(body) ? body : [body]
    const admin = createAdminClient()
    const wallet = process.env.PAY_WALLET_SOLANA!
    const minUsdc = (Number(process.env.PAY_USDC_CENTS) || 1050) / 100
    const activated: string[] = []

    for (const tx of txs) {
      const sig: string | undefined = tx.signature
      if (!sig) continue
      // Memo = boutique_id (el QR de /pagar lo incluye). Sin memo no se puede asignar → se ignora.
      const memo: string | undefined =
        tx?.memo || tx?.description?.match?.(/[0-9a-f-]{36}/i)?.[0]
      const transfers: any[] =
        tx?.tokenTransfers || tx?.token_transfers || []
      const hit = transfers.find((t) =>
        (t.mint === USDC_MINT || t.tokenMint === USDC_MINT) &&
        (t.toUserAccount === wallet || t.to === wallet || t.destination === wallet) &&
        Number(t.tokenAmount || t.amount || 0) >= minUsdc - 0.05
      )
      if (!hit || !memo) continue

      const { data: boutique } = await admin.from('boutiques')
        .select('id').eq('id', memo).maybeSingle()
      if (!boutique) continue

      const { data: exists } = await admin.from('payments')
        .select('id').eq('tx_signature', sig).maybeSingle()
      if (exists) continue

      const { data: owner } = await admin.from('boutiques')
        .select('owner_id').eq('id', boutique.id).single()
      // Insert PRIMERO (tx_signature único = candado): entregas duplicadas
      // de Helius no duplican la activación.
      const { error: insErr } = await admin.from('payments').insert({
        boutique_id: boutique.id,
        user_id: owner?.owner_id,
        rail: 'usdc_solana', amount_mxn: 199, status: 'approved',
        tx_signature: sig, ai_confidence: 1,
        ai_reason: `usdc ${hit.tokenAmount ?? hit.amount} sig ${sig.slice(0, 12)}`,
        reviewed_by: 'helius', decided_at: new Date().toISOString(),
      })
      if (insErr) continue // 23505 u otro: ya registrado o fila inválida
      const { data: expires } = await admin.rpc('activate_premium', {
        p_boutique_id: boutique.id, p_days: 30,
      })
      activated.push(`${boutique.id}→${expires}`)
    }
    return NextResponse.json({ ok: true, activated })
  } catch (e: any) {
    console.error('payments/crypto-webhook:', e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
