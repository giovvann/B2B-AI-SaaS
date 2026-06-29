'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { registrarAction } from './actions'
import { Mail, Lock, UserPlus, Sparkles, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react'

function RegistroForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const trial = searchParams.get('trial') !== 'false'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    formData.append('trial', String(trial))

    const result = await registrarAction(formData)

    if (result.error) {
      setError(result.error)
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

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 3000)
  }

  const whatsappLink = `https://wa.me/528342177709?text=${encodeURIComponent(
    `Hola, acabo de registrarme en Veliora. Quiero activar mi membresía.${
      trial ? ' Ya tengo 7 días de prueba.' : ''
    }`
  )}`

  if (success) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            {trial ? 'Bienvenida a tu prueba gratis' : 'Cuenta creada exitosamente'}
          </h1>
          <p className="text-gray-400 mb-6">
            {trial
              ? 'Disfruta de 7 días gratis con todas las funciones de Veliora.'
              : 'Tu cuenta está lista. Actívala para empezar a usar Veliora.'}
          </p>
          {!trial && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all active:scale-95 mb-4 w-full justify-center"
            >
              <MessageCircle className="w-6 h-6" strokeWidth={2.5} />
              Pagar por WhatsApp ahora
            </a>
          )}
          <p className="text-sm text-gray-500">
            Te redirigimos a la app en unos segundos...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center space-x-1 mb-2">
            <span className="text-4xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, letterSpacing: '0.02em' }}>Veliora</span>
            <span className="text-sm text-cyan-400" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: '0.1em' }}>.lat</span>
          </div>
          <p className="text-gray-400 text-lg">Crea tu cuenta para empezar</p>
        </div>

        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-3xl p-8 border border-white/[0.06]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                CORREO ELECTRÓNICO
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 text-base rounded-2xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="tu@correo.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                CONTRASEÑA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-5 py-4 text-base rounded-2xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-2xl font-semibold text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[64px] bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-lg tracking-wide rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="text-base">CREANDO CUENTA...</span>
              ) : (
                <>
                  <UserPlus className="w-6 h-6" strokeWidth={2.5} />
                  <span>CREAR CUENTA</span>
                </>
              )}
            </button>
          </form>

          {trial ? (
            <div className="mt-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">7 días gratis</p>
                  <p className="text-gray-400 text-xs mt-1">Sin compromiso. Cancela cuando quieras.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-green-500/5 border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Pago vía WhatsApp</p>
                  <p className="text-gray-400 text-xs mt-1">Después de crear tu cuenta te contactamos para activar tu membresía.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function RegistroPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-gray-400">Cargando...</div>
      </main>
    }>
      <RegistroForm />
    </Suspense>
  )
}
