'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorCode = params.get('error');
    const errorDesc = params.get('error_description');

    const supabase = createClient({ detectSessionInUrl: false });

    async function finish() {
      if (errorCode) {
        if (errorCode === 'access_denied') {
          setError('Acceso denegado. Si cancelaste el inicio de sesión con Google, inténtalo de nuevo.');
        } else {
          setError(errorDesc || 'No se pudo completar el inicio de sesión.');
        }
        setBusy(false);
        return;
      }

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          const { data } = await supabase.auth.getSession();
          if (data.session) {
            router.replace('/dashboard');
            router.refresh();
            return;
          }
          setError('No se encontró una sesión activa. Intenta iniciar sesión de nuevo.');
          setBusy(false);
          return;
        } catch (err: any) {
          console.error('Auth callback error:', err);
          setError(
            err?.message?.includes('code_verifier') || err?.message?.includes('PKCE')
              ? 'El inicio de sesión se interrumpió entre servidores. Vuelve a intentarlo y si persiste, entra desde velioralat.vercel.app.'
              : 'No se pudo completar el inicio de sesión. El enlace pudo expirar o ya fue usado. Inténtalo de nuevo.'
          );
          setBusy(false);
          return;
        }
      }

      // No code: if already logged in, continue; otherwise send to login
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/dashboard');
        router.refresh();
      } else {
        router.replace('/login');
      }
    }

    finish();
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fdfaf5',
        color: '#2a2420',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '.15rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Playfair Display',Georgia,serif" }}>Veliora</span>
          <em style={{ fontSize: '.7rem', color: '#c8a476', fontStyle: 'normal', fontWeight: 300 }}>· lat</em>
        </div>

        {busy ? (
          <div>
            <div
              style={{
                width: 44,
                height: 44,
                margin: '0 auto 1rem',
                borderRadius: '50%',
                border: '3px solid rgba(200,164,118,.2)',
                borderTopColor: '#c8a476',
                animation: 'velioraSpin .8s linear infinite',
              }}
            />
            <p style={{ fontSize: '.9rem', color: 'rgba(42,36,32,.6)' }}>Verificando tu acceso...</p>
            <style>{'@keyframes velioraSpin{to{transform:rotate(360deg)}}'}</style>
          </div>
        ) : (
          <div
            style={{
              background: '#fff',
              border: '1px solid rgba(200,164,118,.12)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 15px 40px -20px rgba(42,36,32,.08)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ marginBottom: '.6rem' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
            </svg>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '.4rem' }}>No se pudo iniciar sesión</h1>
            <p style={{ fontSize: '.82rem', color: 'rgba(42,36,32,.6)', lineHeight: 1.6, marginBottom: '1.2rem' }}>{error}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              <Link
                href="/login"
                style={{
                  background: 'linear-gradient(135deg,#c8a476,#b8925e)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '.85rem',
                  borderRadius: '.75rem',
                  padding: '.8rem 1rem',
                  textDecoration: 'none',
                }}
              >
                Volver a intentar
              </Link>
              <Link href="/" style={{ color: 'rgba(42,36,32,.45)', fontSize: '.8rem', textDecoration: 'none' }}>
                Ir al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
