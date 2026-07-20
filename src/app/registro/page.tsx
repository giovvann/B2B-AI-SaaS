'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { registrarAction } from './actions'
import { Mail, Lock, UserPlus, Sparkles, MessageCircle, CheckCircle, Loader2, Store } from 'lucide-react'
import { getDeviceId, getDeviceName } from '@/lib/device'
import Link from 'next/link'

function RegistroForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [boutiqueName, setBoutiqueName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'pin' | 'ready'>('form')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const trial = searchParams.get('trial') !== 'false'

  // Connectivity check on mount
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const check = async () => {
      try {
        const c = new AbortController();
        setTimeout(() => c.abort(), 5000);
        const r = await fetch('/api/ping', { method: 'GET', signal: c.signal, cache: 'no-store' });
        setOnline(r.ok);
      } catch {
        setOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    return () => { clearInterval(interval); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!boutiqueName.trim()) {
      setError('El nombre de la boutique es obligatorio');
      setLoading(false);
      return;
    }

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    formData.append('trial', String(trial))
    formData.append('boutique_name', boutiqueName.trim())

    const result = await registrarAction(formData)

    if (result.error) {
      if (result.error.includes('already registered') || result.error.includes('already exists')) {
        setError('Este correo ya está registrado. Si usaste Google, inicia sesión con Google.');
      } else {
        setError(result.error)
      }
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: result.email!,
      password: result.password!,
    })

    if (signInError) {
      setError('Cuenta creada pero no se pudo iniciar sesión. Intenta iniciar sesión manualmente.')
      setLoading(false)
      return
    }

    setStep('pin')
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar con Google');
      setGoogleLoading(false);
    }
  };

  const handleSetPin = async () => {
    setPinError('')
    if (pin.length < 4 || pin.length > 6) {
      setPinError('El PIN debe tener entre 4 y 6 dígitos')
      return
    }
    setPinLoading(true)
    try {
      const res = await fetch('/api/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const devRes = await fetch('/api/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: getDeviceId(),
          device_name: getDeviceName(),
          role: 'owner',
        }),
      })
      const devData = await devRes.json()
      if (!devRes.ok) throw new Error(devData.error)

      sessionStorage.setItem('veliora_pin_verified', 'true')

      setStep('ready')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setPinError(err.message || 'Error al guardar el PIN')
    } finally {
      setPinLoading(false)
    }
  }

  const whatsappLink = `https://wa.me/528342177709?text=${encodeURIComponent(
    `Hola, acabo de registrarme en Veliora. Quiero activar mi membresía.${
      trial ? ' Ya tengo 7 días de prueba.' : ''
    }`
  )}`

  // V5 Header
  const v5Header = (
    <header className="sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(42,36,32,.06)', backdropFilter: 'blur(12px)', background: 'rgba(253,250,245,.85)' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '.15rem', textDecoration: 'none', color: '#2a2420' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: "'Playfair Display',Georgia,serif" }}>Veliora</span>
          <em style={{ fontSize: '.65rem', color: '#c8a476', fontStyle: 'normal', fontFamily: "'Inter',sans-serif", fontWeight: 300 }}> · lat</em>
        </Link>
        <Link href="/login" style={{ fontSize: '.85rem', color: 'rgba(200,164,118,1)', fontWeight: 600, textDecoration: 'none' }}>
          Iniciar sesión
        </Link>
      </div>
    </header>
  );

  if (step === 'pin') {
    return (
      <main style={{ background: '#fdfaf5', color: '#2a2420', minHeight: '100vh' }}>
        {v5Header}
        <div style={{ maxWidth: '420px', margin: '0 auto', padding: '3rem 1.5rem 5rem', textAlign: 'center' }}>
          <div style={{ width: '5rem', height: '5rem', background: 'linear-gradient(135deg,#c8a476,#b8925e)', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2a2420', marginBottom: '.6rem', fontFamily: "'Playfair Display',Georgia,serif" }}>Crea tu PIN</h1>
          <p style={{ color: 'rgba(42,36,32,.5)', fontSize: '.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Este PIN protegerá el acceso a métricas, gastos y configuración. Compártelo solo con personas de confianza.
          </p>
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid rgba(200,164,118,.12)' }}>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="4-6 dígitos"
              disabled={pinLoading}
              style={{ width: '100%', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '.5em', background: '#fdfaf5', border: '1px solid rgba(42,36,32,.1)', borderRadius: '.75rem', padding: '.85rem 1rem', color: '#2a2420', outline: 'none' }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#c8a476'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(42,36,32,.1)'}
              autoFocus
            />
            {pinError && <p style={{ color: '#dc2626', fontSize: '.8rem', marginTop: '.5rem' }}>{pinError}</p>}
            <button
              onClick={handleSetPin}
              disabled={pinLoading || pin.length < 4}
              style={{ width: '100%', marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg,#c8a476,#b8925e)', color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: '.75rem', border: 'none', cursor: (pinLoading || pin.length < 4) ? 'not-allowed' : 'pointer', opacity: (pinLoading || pin.length < 4) ? .5 : 1, boxShadow: pinLoading ? 'none' : '0 4px 12px rgba(200,164,118,.3)' }}
            >
              {pinLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </span>
              ) : 'CONTINUAR'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'ready') {
    return (
      <main style={{ background: '#fdfaf5', color: '#2a2420', minHeight: '100vh' }}>
        {v5Header}
        <div style={{ maxWidth: '420px', margin: '0 auto', padding: '3rem 1.5rem 5rem', textAlign: 'center' }}>
          <div style={{ width: '5rem', height: '5rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2a2420', marginBottom: '.6rem', fontFamily: "'Playfair Display',Georgia,serif" }}>
            {trial ? '¡Todo listo!' : 'Cuenta creada'}
          </h1>
          <p style={{ color: 'rgba(42,36,32,.5)', fontSize: '.85rem', marginBottom: '1.5rem' }}>
            Tu boutique está configurada. Serás redirigido a tu panel.
          </p>
          {!trial && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: '.75rem', textDecoration: 'none', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(34,197,94,.3)' }}
            >
              <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
              Pagar por WhatsApp ahora
            </a>
          )}
          <p style={{ fontSize: '.8rem', color: 'rgba(42,36,32,.35)' }}>
            <Loader2 className="w-4 h-4 inline animate-spin" style={{ marginRight: '.3rem' }} />
            Abriendo tu panel...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ background: '#fdfaf5', color: '#2a2420', minHeight: '100vh' }}>
      {/* Offline banner */}
      {!online && (
        <div style={{ background: 'rgba(200,164,118,.9)', backdropFilter: 'blur(12px)', textAlign: 'center', padding: '.4rem', fontSize: '.75rem', color: '#fff' }}>
          Sin conexión — los cambios se guardarán localmente
          <button onClick={() => window.location.reload()} style={{ marginLeft: '.5rem', textDecoration: 'underline', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>Reintentar</button>
        </div>
      )}
      {v5Header}
      <div style={{ maxWidth: '420px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.3rem 1rem', borderRadius: '100px', background: 'rgba(200,164,118,.1)', border: '1px solid rgba(200,164,118,.2)', marginBottom: '.8rem' }}>
            <Sparkles className="w-3 h-3" style={{ color: '#c8a476' }} />
            <span style={{ fontSize: '.6rem', fontWeight: 600, color: '#c8a476', letterSpacing: '.12em', textTransform: 'uppercase' }}>REGISTRO</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem,3.5vw,2rem)', fontWeight: 800, color: '#2a2420', marginBottom: '.4rem', letterSpacing: '-.02em', fontFamily: "'Playfair Display',Georgia,serif" }}>Crear cuenta</h1>
          <p style={{ color: 'rgba(42,36,32,.5)', fontSize: '.85rem' }}>Empieza a gestionar tu boutique</p>
        </div>

        <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid rgba(200,164,118,.12)' }}>
          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{ width: '100%', padding: '.85rem 1rem', background: '#fff', color: '#2a2420', fontWeight: 600, fontSize: '.9rem', borderRadius: '.75rem', border: '1px solid rgba(42,36,32,.12)', cursor: googleLoading ? 'not-allowed' : 'pointer', opacity: googleLoading ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem', transition: 'all .2s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#c8a476'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(200,164,118,.15)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(42,36,32,.12)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span>{googleLoading ? 'CONECTANDO...' : 'Registrarse con Google'}</span>
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(42,36,32,.08)' }} />
            <span style={{ fontSize: '.75rem', color: 'rgba(42,36,32,.3)' }}>o con correo</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(42,36,32,.08)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#2a2420', marginBottom: '.35rem', display: 'block', letterSpacing: '.04em' }}>
                NOMBRE DE LA BOUTIQUE
              </label>
              <div style={{ position: 'relative' }}>
                <Store className="w-4 h-4" style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(200,164,118,.6)' }} strokeWidth={1.5} />
                <input
                  type="text"
                  value={boutiqueName}
                  onChange={(e) => setBoutiqueName(e.target.value)}
                  required
                  disabled={loading}
                  style={{ width: '100%', padding: '.85rem 1rem .85rem 2.5rem', fontSize: '.9rem', borderRadius: '.75rem', border: '1px solid rgba(42,36,32,.1)', background: '#fdfaf5', color: '#2a2420', outline: 'none', transition: 'border-color .2s' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#c8a476'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(42,36,32,.1)'}
                  placeholder="Ej: Boutique Elegance"
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#2a2420', marginBottom: '.35rem', display: 'block', letterSpacing: '.04em' }}>
                CORREO ELECTRÓNICO
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{ width: '100%', padding: '.85rem 1rem', fontSize: '.9rem', borderRadius: '.75rem', border: '1px solid rgba(42,36,32,.1)', background: '#fdfaf5', color: '#2a2420', outline: 'none', transition: 'border-color .2s' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#c8a476'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(42,36,32,.1)'}
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#2a2420', marginBottom: '.35rem', display: 'block', letterSpacing: '.04em' }}>
                CONTRASEÑA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                style={{ width: '100%', padding: '.85rem 1rem', fontSize: '.9rem', borderRadius: '.75rem', border: '1px solid rgba(42,36,32,.1)', background: '#fdfaf5', color: '#2a2420', outline: 'none', transition: 'border-color .2s' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#c8a476'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(42,36,32,.1)'}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.15)', borderRadius: '.75rem', padding: '.75rem 1rem', fontSize: '.8rem', color: '#dc2626', fontWeight: 600, lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#c8a476,#b8925e)', color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: '.75rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .5 : 1, letterSpacing: '.04em', transition: 'all .2s', boxShadow: loading ? 'none' : '0 4px 12px rgba(200,164,118,.3)' }}
            >
              {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
            </button>
          </form>

          {trial && (
            <div style={{ marginTop: '1rem', background: 'rgba(200,164,118,.06)', borderRadius: '.85rem', padding: '1rem', border: '1px solid rgba(200,164,118,.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#c8a476' }} />
                <div>
                  <p style={{ fontSize: '.8rem', color: '#2a2420', fontWeight: 600, marginBottom: '.1rem' }}>7 días gratis</p>
                  <p style={{ fontSize: '.75rem', color: 'rgba(42,36,32,.45)' }}>Sin compromiso. Cancela cuando quieras.</p>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link href="/login" style={{ color: '#c8a476', fontWeight: 600, fontSize: '.85rem', textDecoration: 'underline' }}>
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>

          <div style={{ marginTop: '.75rem', textAlign: 'center' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.8rem', color: 'rgba(42,36,32,.4)', textDecoration: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function RegistroPage() {
  return (
    <Suspense fallback={
      <main style={{ background: '#fdfaf5', color: '#2a2420', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(42,36,32,.5)' }}>Cargando...</p>
      </main>
    }>
      <RegistroForm />
    </Suspense>
  )
}
