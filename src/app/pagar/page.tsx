'use client'
import { useState } from 'react'
import { Store, Landmark, Zap, Ticket } from 'lucide-react'

/**
 * /pagar — rieles sin adultos: 1) OXXO $200 (tarjeta al portador, IA activa),
 * 2) USDC Solana (instantáneo), 3) Ficha VEL-XXXX. Transferencia/SPEI solo
 * visible con CLABE configurada (pausado por restricción N2). Sin Stripe.
 * Env pública: NEXT_PUBLIC_PAY_CLABE, NEXT_PUBLIC_PAY_TITULAR, NEXT_PUBLIC_PAY_WALLET
 */
const CLABE = process.env.NEXT_PUBLIC_PAY_CLABE || '0000 0000 0000 000000'
const TITULAR = process.env.NEXT_PUBLIC_PAY_TITULAR || 'Veliora'
const WALLET = process.env.NEXT_PUBLIC_PAY_WALLET || ''
const MONTO = 199

export default function PagarPage() {
  const [tab, setTab] = useState<'oxxo' | 'spei' | 'usdc' | 'ficha'>('oxxo')
  const [file, setFile] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const speiConfigured = CLABE && !CLABE.startsWith('0000')
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

  async function subirOxxo() {
    if (!file) return setMsg('Toma foto del ticket y de la tarjeta.')
    setBusy(true); setMsg('Revisando tu tarjeta…')
    const fd = new FormData()
    fd.append('image', file)
    if (file2) fd.append('image2', file2)
    try {
      const r = await fetch('/api/payments/oxxo-giftcard', { method: 'POST', body: fd })
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
      <div style={{ display: 'flex', gap: 8, margin: '16px 0', flexWrap: 'wrap' }}>
        {(speiConfigured
          ? [{ id: 'oxxo', label: 'OXXO $200', Icon: Store }, { id: 'spei', label: 'Transferencia', Icon: Landmark }, { id: 'usdc', label: 'USDC', Icon: Zap }, { id: 'ficha', label: 'Tengo ficha', Icon: Ticket }]
          : [{ id: 'oxxo', label: 'OXXO $200', Icon: Store }, { id: 'usdc', label: 'USDC', Icon: Zap }, { id: 'ficha', label: 'Tengo ficha', Icon: Ticket }]
        ).map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)} disabled={busy}
            style={{ flex: 1, padding: 12, borderRadius: 10, border: tab === id ? '2px solid #000' : '1px solid #ccc', fontWeight: tab === id ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {tab === 'oxxo' && (
        <section>
          <p>1. En cualquier OXXO pide una <b>tarjeta de regalo OXXO de $200</b> (se paga en efectivo, 2 min).</p>
          <p>2. Raspa el PIN del reverso y tómale foto <b>al ticket y a la tarjeta</b> (que se vean código y PIN).</p>
          <p>3. Súbelas aquí:</p>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <input type="file" accept="image/*" onChange={(e) => setFile2(e.target.files?.[0] || null)} style={{ marginTop: 8 }} />
          <button onClick={subirOxxo} disabled={busy || !file}
            style={{ display: 'block', width: '100%', marginTop: 12, padding: 14, borderRadius: 10, background: '#000', color: '#fff', fontWeight: 700 }}>
            {busy ? 'Revisando…' : 'Activar mi Premium'}
          </button>
        </section>
      )}

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
