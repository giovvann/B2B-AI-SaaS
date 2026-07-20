'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Correo no confirmado. Revisa tu bandeja de entrada.');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <main style={{ background: '#fdfaf5', color: '#2a2420', minHeight: '100vh' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(42,36,32,.06)', backdropFilter: 'blur(12px)', background: 'rgba(253,250,245,.85)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', padding: '.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '.15rem', textDecoration: 'none', color: '#2a2420' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: "'Playfair Display',Georgia,serif" }}>Veliora</span>
            <em style={{ fontSize: '.65rem', color: '#c8a476', fontStyle: 'normal', fontFamily: "'Inter',sans-serif", fontWeight: 300 }}> · lat</em>
          </Link>
          <Link href="/registro" style={{ fontSize: '.85rem', color: 'rgba(200,164,118,1)', fontWeight: 600, textDecoration: 'none' }}>
            Registrarse
          </Link>
        </div>
      </header>

      {/* Form */}
      <div style={{ maxWidth: '420px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.3rem 1rem', borderRadius: '100px', background: 'rgba(200,164,118,.1)', border: '1px solid rgba(200,164,118,.2)', marginBottom: '.8rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 8v6m-3-3h6" />
            </svg>
            <span style={{ fontSize: '.6rem', fontWeight: 600, color: '#c8a476', letterSpacing: '.12em', textTransform: 'uppercase' }}>ACCEDER</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem,3.5vw,2rem)', fontWeight: 800, color: '#2a2420', marginBottom: '.4rem', letterSpacing: '-.02em', fontFamily: "'Playfair Display',Georgia,serif" }}>
            Bienvenido de vuelta
          </h1>
          <p style={{ color: 'rgba(42,36,32,.6)', fontSize: '.85rem' }}>
            Accede a tu panel de control
          </p>
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
            <span>{googleLoading ? 'CONECTANDO...' : 'Continuar con Google'}</span>
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(42,36,32,.08)' }} />
            <span style={{ fontSize: '.75rem', color: 'rgba(42,36,32,.4)' }}>o con correo</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(42,36,32,.08)' }} />
          </div>

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
                placeholder="••••••••"
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
              style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#c8a476,#b8925e)', color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: '.75rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .5 : 1, letterSpacing: '.04em', transition: 'all .2s', boxShadow: loading ? 'none' : '0 4px 12px rgba(200,164,118,.3)' }}
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link href="/registro" style={{ color: '#c8a476', fontWeight: 600, fontSize: '.85rem', textDecoration: 'underline' }}>
              ¿No tienes cuenta? Regístrate
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
  );
}
