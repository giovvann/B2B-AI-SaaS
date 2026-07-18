'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, MessageCircle, Loader2, CheckCircle, XCircle, Bell, Smartphone } from 'lucide-react'

export default function ConfiguracionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [boutiqueName, setBoutiqueName] = useState('')
  const [subscription, setSubscription] = useState<{ plan: string; expiresAt: string | null }>({ plan: '', expiresAt: null })
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testSending, setTestSending] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: boutique } = await supabase
        .from('boutiques')
        .select('id, name, whatsapp_alerts_enabled, whatsapp_number, plan_type, subscription_expires_at, is_active')
        .eq('owner_id', user.id)
        .single()

      if (!boutique) { router.push('/login'); return }

      setBoutiqueName(boutique.name || 'Mi Boutique')
      setWhatsappEnabled(boutique.whatsapp_alerts_enabled !== false)
      setWhatsappNumber(boutique.whatsapp_number || '')

      const expiresAt = boutique.subscription_expires_at ? new Date(boutique.subscription_expires_at) : null
      const isExpired = !boutique.is_active || (expiresAt && expiresAt < new Date())
      setSubscription({
        plan: isExpired ? 'expirado' : (boutique.plan_type || 'trial'),
        expiresAt: expiresAt?.toLocaleDateString('es-MX') || null,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error } = await supabase
        .from('boutiques')
        .update({
          whatsapp_alerts_enabled: whatsappEnabled,
          whatsapp_number: whatsappNumber.replace(/[^\d]/g, ''),
        })
        .eq('owner_id', user.id)

      if (error) throw error
      setSaveMsg({ type: 'success', text: 'Configuración guardada ✅' })
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message || 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  const testWhatsApp = async () => {
    setTestSending(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/whatsapp-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          boutique: boutiqueName,
          data: { message: '🔔 Mensaje de prueba desde Veliora. Las alertas funcionan correctamente.' }
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      setSaveMsg({ type: 'success', text: '✅ Mensaje de prueba enviado a WhatsApp' })
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message || 'Error. ¿El worker de WhatsApp está activo?' })
    } finally {
      setTestSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const isPremium = subscription.plan === 'premium' || subscription.plan === 'trial'

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al panel</span>
        </button>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Configuración</h1>
        <p className="text-zinc-400 mb-10">
          {boutiqueName} — Plan: <span className="font-semibold text-white capitalize">{subscription.plan}</span>
          {subscription.expiresAt && <span className="text-zinc-500"> (expira {subscription.expiresAt})</span>}
        </p>

        {/* WhatsApp Alerts */}
        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-3xl p-6 md:p-8 border border-white/[0.06] mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Alertas por WhatsApp</h2>
              <p className="text-sm text-zinc-400">
                Recibe notificaciones de stock crítico, productos sin vender, y resúmenes semanales directamente en tu WhatsApp.
                {!isPremium && (
                  <span className="block mt-2 text-amber-400 font-semibold">
                    ⭐ Función PREMIUM — Activa tu membresía para usar alertas WhatsApp
                  </span>
                )}
              </p>
            </div>
          </div>

          {isPremium && (
            <div className="space-y-6">
              {/* Toggle */}
              <label className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/[0.06] cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-semibold text-sm">Alertas activadas</p>
                    <p className="text-zinc-500 text-xs">Stock crítico, dead stock, resumen semanal</p>
                  </div>
                </div>
                <button
                  onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    whatsappEnabled ? 'bg-green-500' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    whatsappEnabled ? 'translate-x-7.5' : 'translate-x-0.5'
                  }`} style={{ transform: whatsappEnabled ? 'translateX(28px)' : 'translateX(2px)' }} />
                </button>
              </label>

              {/* Número */}
              <div>
                <label className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-green-400" />
                  TU NÚMERO DE WHATSAPP
                </label>
                <div className="flex gap-2">
                  <span className="px-4 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-mono text-sm">+52</span>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                    placeholder="834217709"
                    className="flex-1 px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors font-mono text-lg"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Número de 10 dígitos (sin LADA internacional). Ej: 834217709
                </p>
              </div>

              {/* Botón de prueba */}
              <button
                onClick={testWhatsApp}
                disabled={testSending || !whatsappNumber || whatsappNumber.length < 10}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {testSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
                {testSending ? 'ENVIANDO...' : 'ENVIAR MENSAJE DE PRUEBA'}
              </button>
            </div>
          )}
        </div>

        {/* Mensaje de guardado */}
        {saveMsg && (
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl mb-6 ${
            saveMsg.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {saveMsg.type === 'success' 
              ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> 
              : <XCircle className="w-5 h-5 flex-shrink-0" />
            }
            <span className="text-sm font-semibold">{saveMsg.text}</span>
          </div>
        )}

        {/* Guardar */}
        {isPremium && (
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {saving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}
          </button>
        )}

        {/* Información del plan */}
        <div className="mt-8 p-6 bg-gradient-to-br from-white/[0.02] to-white/[0.01] rounded-3xl border border-white/[0.06]">
          <h3 className="text-white font-bold mb-3">Información de la membresía</h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>Plan actual: <span className="text-white capitalize font-semibold">{subscription.plan}</span></p>
            {subscription.expiresAt && (
              <p>Expira: <span className="text-white">{subscription.expiresAt}</span></p>
            )}
            <p className="mt-4">
              Para cambiar de plan o resolver dudas sobre tu membresía, contáctanos por WhatsApp:
            </p>
            <a
              href="https://wa.me/528342177709"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar mensaje
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
