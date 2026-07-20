'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('¡Revisa tu correo para confirmar tu cuenta!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ background: '#fdfaf5', color: '#2a2420', minHeight: '100vh' }}>
      {/* V5 Header */}
      <header
        className="sticky top-0 z-50"
        style={{ borderBottom: '1px solid rgba(42,36,32,.06)', backdropFilter: 'blur(12px)', background: 'rgba(253,250,245,.85)' }}
      >
        <div style={{ maxWidth: '980px', margin: '0 auto', padding: '.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '.15rem', textDecoration: 'none', color: '#2a2420' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: "'Playfair Display',Georgia,serif" }}>Veliora</span>
            <em style={{ fontSize: '.65rem', color: '#c8a476', fontStyle: 'normal', fontFamily: "'Inter',sans-serif", fontWeight: 300 }}> · lat</em>
          </Link>
        </div>
      </header>

      {/* Auth Form */}
      <div style={{ maxWidth: '420px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.3rem 1rem', borderRadius: '100px', background: 'rgba(200,164,118,.1)', border: '1px solid rgba(200,164,118,.2)', marginBottom: '.8rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 8v6m-3-3h6" />
            </svg>
            <span style={{ fontSize: '.6rem', fontWeight: 600, color: '#c8a476', letterSpacing: '.12em', textTransform: 'uppercase' }}>
              {mode === 'login' ? 'ACCEDER' : 'REGISTRO'}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem,3.5vw,2rem)', fontWeight: 800, color: '#2a2420', marginBottom: '.4rem', letterSpacing: '-.02em', fontFamily: "'Playfair Display',Georgia,serif" }}>
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
          </h1>
          <p style={{ color: 'rgba(42,36,32,.5)', fontSize: '.85rem' }}>
            {mode === 'login' ? 'Accede a tu panel de control' : 'Empieza a gestionar tu boutique'}
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid rgba(200,164,118,.12)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#2a2420', marginBottom: '.35rem', display: 'block', letterSpacing: '.04em' }}>
                CORREO ELECTRÓNICO
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                style={{ width: '100%', padding: '.85rem 1rem', fontSize: '.9rem', borderRadius: '.75rem', border: '1px solid rgba(42,36,32,.1)', background: '#fdfaf5', color: '#2a2420', outline: 'none', transition: 'border-color .2s' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#c8a476'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(42,36,32,.1)'}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.15)', borderRadius: '.75rem', padding: '.75rem 1rem', fontSize: '.8rem', color: '#dc2626', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#c8a476,#b8925e)', color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: '.75rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .5 : 1, letterSpacing: '.04em', transition: 'all .2s' }}
            >
              {loading
                ? 'CARGANDO...'
                : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'
              }
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{ background: 'none', border: 'none', color: 'rgba(200,164,118,1)', fontWeight: 600, fontSize: '.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.8rem', color: 'rgba(42,36,32,.4)', textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Volver al inicio</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
