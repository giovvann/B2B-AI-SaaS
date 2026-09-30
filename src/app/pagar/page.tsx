'use client'
import { useState } from 'react'

/**
 * /pagar — 3 rieles sin adultos: 1) Transferencia/OXXO + comprobante (IA activa),
 * 2) USDC Solana (instantáneo), 3) Ficha VEL-XXXX. Sin Stripe.
 * Env pública: NEXT_PUBLIC_PAY_CLABE, NEXT_PUBLIC_PAY_TITULAR, NEXT_PUBLIC_PAY_WALLET
 */
const CLABE = process.env.NEXT_PUBLIC_PAY_CLABE || '0000 0000 0000 000000'
const TITULAR = process.env.NEXT_PUBLIC_PAY_TITULAR || 'Veliora'
const WALLET = process.env.NEXT_PUBLIC_PAY_WALLET || ''
const MONTO = 199

export default function PagarPage() {
  const [tab, setTab] = useState<'spei' | 'usdc' | 'ficha'>('spei')
  const [file, setFile] = useState<File | null>(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function subirComprobante() {
    if (!file) return setMsg('Primero transfiere y toma foto del comprobante.')
    setBusy(true); setMsg('La IA está revisando tu comprobante…')
    const fd = new FormData()
    fd.append('image', file); fd.append('expected_amount', String(MONTO))
    try {
      const r = await fetch('/api/payments/comprobante', { method: 'POST', body: fd })
      const j = await r.json()
      if (j.ok) { window.location.href = '/dashboard?bienvenida=premium' }
      else setMsg(j.error || 'Quedó en revisión, te avisamos por WhatsApp.')
    } catch {
      setMsg('Error de red. Intenta de nuevo.')
    }
    setBusy(false)
  }

  async function canjear() {
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/payments/ficha/canjear', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const j = await r.json()
      if (j.ok) window.location.href = '/dashboard?bienvenida=premium'
      else setMsg(j.error || 'No se pudo canjear.')
    } catch {
      setMsg('Error de red. Intenta de nuevo.')
    }
    setBusy(false)
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Activa Veliora Premium — ${MONTO}/mes</h1>
      <p>Sin tarjeta. Sin vueltas. El acceso se activa solo.</p>
      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        {(['spei', 'usdc', 'ficha'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} disabled={busy}
            style={{ flex: 1, padding: 12, borderRadius: 10, border: tab === t ? '2px solid #000' : '1px solid #ccc', fontWeight: tab === t ? 700 : 400 }}>
            {t === 'spei' ? '🏦 Transferencia / OXXO' : t === 'usdc' ? '⚡ USDC instantáneo' : '🎟️ Tengo ficha'}
          </button>
        ))}
      </div>

      {tab === 'spei' && (
        <section>
          <p>1. Transfiere <b>${MONTO}</b> a:</p>
          <div style={{ background: '#f4f4f5', padding: 12, borderRadius: 10 }}>
            <div>CLABE: <b>{CLABE}</b></div>
            <div>Titular: <b>{TITULAR}</b></div>
            <div>Concepto: <b>tu WhatsApp</b></div>
          </div>
          <p>2. Sube la foto del comprobante (donde se vea folio y monto):</p>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button onClick={subirComprobante} disabled={busy || !file}
            style={{ display: 'block', width: '100%', marginTop: 12, padding: 14, borderRadius: 10, background: '#000', color: '#fff', fontWeight: 700 }}>
            {busy ? 'Revisando…' : 'Activar mi Premium'}
          </button>
        </section>
      )}

      {tab === 'usdc' && (
        <section>
          <p>Envía <b>$10.50 USDC (red Solana)</b> a:</p>
          <div style={{ background: '#f4f4f5', padding: 12, borderRadius: 10, wordBreak: 'break-all' }}><b>{WALLET || 'Wallet en configuración'}</b></div>
          <p>Incluye en el memo tu ID de boutique (te lo muestra tu dashboard). La activación es instantánea al confirmarse la red.</p>
          <div style={{ background: '#fffbeb', padding: 12, borderRadius: 10, marginTop: 12 }}>
            <p style={{ margin: 0 }}><b>¿Primera vez? Solo tardas ~10 min una vez:</b></p>
            <p style={{ margin: '8px 0 0' }}>1. Si tienes <b>Bitso</b>: deposita por SPEI, compra USDC y retíralo por la <b>red Solana</b> a la dirección de arriba.</p>
            <p style={{ margin: '8px 0 0' }}>2. Si no: descarga <b>Phantom</b>, compra USDC con tu tarjeta y envíalo aquí escaneando el QR.</p>
            <p style={{ margin: '8px 0 0' }}>Los siguientes pagos te toman 1 minuto.</p>
          </div>
        </section>
      )}

      {tab === 'ficha' && (
        <section>
          <p>¿Compraste ficha en efectivo o por WhatsApp? Canjéala:</p>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="VEL-XXXX-XXXX" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
          <button onClick={canjear} disabled={busy || !code}
            style={{ display: 'block', width: '100%', marginTop: 12, padding: 14, borderRadius: 10, background: '#000', color: '#fff', fontWeight: 700 }}>
            Canjear y activar
          </button>
        </section>
      )}
      {msg && <p style={{ marginTop: 16 }}>{msg}</p>}
    </main>
  )
}
