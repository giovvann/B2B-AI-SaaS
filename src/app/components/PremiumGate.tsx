'use client'

import { Crown, Lock, MessageCircle, Sparkles, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PremiumGateProps {
  /** Nombre de la función premium bloqueada */
  feature: string
  /** Descripción de lo que el usuario se pierde */
  description?: string
}

/**
 * Componente que se muestra cuando un usuario FREE intenta acceder
 * a una función premium. Lo invita a actualizar.
 */
export function PremiumGate({ feature, description }: PremiumGateProps) {
  const router = useRouter()

  const whatsappMessage = encodeURIComponent(
    `Hola, quiero activar mi membresía Premium en Veliora para usar ${feature}.`
  )
  const whatsappLink = `https://wa.me/528342177709?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Volver al panel</span>
        </button>

        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-3xl p-8 border border-white/[0.06] text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-amber-500/30">
            <Crown className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Función Premium
          </h2>
          <p className="text-zinc-400 text-sm mb-2">
            <span className="font-semibold text-white">{feature}</span> está disponible solo en el plan Premium.
          </p>
          {description && (
            <p className="text-zinc-500 text-xs mb-6">{description}</p>
          )}

          <div className="bg-gradient-to-br from-blue-500/[0.08] to-cyan-500/[0.08] rounded-2xl p-5 mb-6 border border-blue-500/20 text-left">
            <p className="text-xs text-zinc-400 font-semibold mb-3 text-center uppercase tracking-wider">
              Plan Premium — $449/mes
            </p>
            <div className="space-y-2 text-sm text-zinc-400">
              {[
                'Escaneo IA de facturas y tickets',
                'Asistente IA de negocios',
                'Alertas WhatsApp automáticas',
                'Dashboard de Salud con semáforo',
                'Métricas avanzadas con gráficas',
                'Código de barras',
                'Multi-dispositivo (hasta 6)',
                'Primer mes solo $199 MXN',
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[56px] bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-green-500/30 transition-all active:scale-[0.98] mb-4"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
            ACTIVAR PREMIUM POR WHATSAPP
          </a>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Seguir con plan gratuito
          </button>
        </div>
      </div>
    </div>
  )
}
