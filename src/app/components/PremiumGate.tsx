'use client'

import { Crown, MessageCircle, Check, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PremiumGateProps {
  /** Nombre de la función premium bloqueada */
  feature: string
  /** Descripción de lo que el usuario se pierde */
  description?: string
}

const BENEFICIOS = [
  'Vende escaneando en segundos',
  'Asistente IA de negocios',
  'Alertas WhatsApp automáticas',
  'Dashboard de Salud con semáforo',
  'Métricas avanzadas con gráficas',
  'Código de barras',
  'Multi-dispositivo (hasta 6)',
  'Soporte WhatsApp',
]

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
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-espresso-400 hover:text-espresso-700 dark:hover:text-gold-300 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Volver al panel</span>
        </button>

        <div className="bg-white dark:bg-[#16130f] rounded-3xl p-8 border border-[rgba(200,164,118,0.14)] dark:border-white/[0.06] shadow-[0_1px_2px_rgba(42,36,32,0.04),0_8px_24px_rgba(42,36,32,0.05)] dark:shadow-none text-center">
          {/* Icono */}
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600 rounded-3xl flex items-center justify-center shadow-lg shadow-gold-400/30 mb-6">
            <Crown className="w-10 h-10 text-white" strokeWidth={2} />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-400/20 mb-5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700 dark:text-gold-300">
              Función Premium
            </span>
          </div>

          <h2
            className="text-2xl md:text-3xl text-espresso-800 dark:text-white mb-2"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
          >
            {feature}
          </h2>
          <p className="text-sm text-espresso-500 dark:text-espresso-300 mb-6">
            {description || 'Esta función forma parte de tu membresía Premium de Veliora.'}
          </p>

          {/* Beneficios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-left text-sm text-espresso-600 dark:text-espresso-200 bg-gold-50/60 dark:bg-white/[0.03] border border-gold-100 dark:border-white/[0.06] rounded-2xl p-5 mb-6">
            {BENEFICIOS.map((b) => (
              <div key={b} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gold-400/15 dark:bg-gold-400/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-gold-600 dark:text-gold-400" strokeWidth={3} />
                </span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[56px] bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 hover:from-gold-500 hover:via-gold-600 hover:to-gold-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-gold-400/30 transition-all active:scale-[0.98] mb-4"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
            ACTIVAR PREMIUM POR WHATSAPP
          </a>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-espresso-400 hover:text-espresso-700 dark:hover:text-gold-300 transition-colors flex items-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Seguir con plan gratuito
          </button>
        </div>
      </div>
    </div>
  )
}
