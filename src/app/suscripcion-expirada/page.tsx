import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageCircle, LogOut, Check, Sparkles, Crown } from 'lucide-react'
import { logoutAction, switchToFreePlanAction } from './actions'

export const metadata = {
  title: 'Membresía | Veliora',
  description: 'Activa tu membresía para seguir usando Veliora.',
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

export default async function SuscripcionExpiradaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const WHATSAPP_NUMBER = '528342177709'
  const SUBSCRIPTION_PRICE = process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE || '199'

  const whatsappMessage = encodeURIComponent(
    `Hola, soy ${user.email} y quiero activar mi membresía en Veliora.`
  )
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-[#16130f] rounded-3xl p-8 md:p-10 border border-[rgba(200,164,118,0.14)] dark:border-white/[0.06] shadow-[0_1px_2px_rgba(42,36,32,0.04),0_8px_24px_rgba(42,36,32,0.05)] dark:shadow-none text-center">
          {/* Logo */}
          <div className="flex items-baseline justify-center space-x-1 mb-8">
            <span
              className="text-4xl text-espresso-700 dark:text-white"
              style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif", fontWeight: 600, letterSpacing: '0.02em' }}
            >
              Veliora
            </span>
            <span className="text-sm font-semibold text-gold-500 dark:text-gold-400">Premium</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-400/20 mb-6">
            <Crown className="w-3.5 h-3.5 text-gold-500 dark:text-gold-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700 dark:text-gold-300">
              Tu membresía expiró
            </span>
          </div>

          <h1
            className="text-3xl md:text-4xl text-espresso-800 dark:text-white mb-3"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
          >
            Sigue haciendo crecer tu negocio
          </h1>
          <p className="text-sm text-espresso-500 dark:text-espresso-300 mb-8">
            Reactiva tu membresía y recupera el acceso completo a todas las herramientas de Veliora.
          </p>

          {/* Precio */}
          <div className="flex items-end justify-center gap-1.5 mb-8">
            <span
              className="text-6xl text-espresso-800 dark:text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}
            >
              ${SUBSCRIPTION_PRICE}
            </span>
            <span className="text-sm text-espresso-400 mb-2">MXN / mes</span>
          </div>

          {/* Beneficios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-left text-sm text-espresso-600 dark:text-espresso-200 bg-gold-50/60 dark:bg-white/[0.03] border border-gold-100 dark:border-white/[0.06] rounded-2xl p-5 mb-8">
            {BENEFICIOS.map((b) => (
              <div key={b} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gold-400/15 dark:bg-gold-400/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-gold-600 dark:text-gold-400" strokeWidth={3} />
                </span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          {/* CTA WhatsApp */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[56px] flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 hover:from-gold-500 hover:via-gold-600 hover:to-gold-700 text-white font-bold rounded-2xl shadow-lg shadow-gold-400/30 transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
            ACTIVAR MEMBRESÍA POR WHATSAPP
          </a>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[rgba(200,164,118,0.14)] dark:bg-white/[0.08]" />
            <span className="text-xs text-espresso-400 font-semibold uppercase tracking-widest">O continúa gratis</span>
            <div className="flex-1 h-px bg-[rgba(200,164,118,0.14)] dark:bg-white/[0.08]" />
          </div>

          {/* Plan gratuito */}
          <form action={switchToFreePlanAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#f5efe2] dark:bg-white/[0.05] hover:bg-gold-100 dark:hover:bg-white/[0.08] border border-[rgba(200,164,118,0.14)] dark:border-white/[0.08] text-espresso-700 dark:text-espresso-200 dark:hover:text-white font-semibold rounded-2xl transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5 text-gold-500 dark:text-gold-400" />
              CONTINUAR CON PLAN GRATUITO
            </button>
          </form>

          <p className="text-xs text-espresso-400 mt-3">
            Plan gratuito: inventario manual, ventas, gastos, 1 dispositivo. Sin funciones IA.
          </p>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-espresso-400 hover:text-espresso-700 dark:hover:text-espresso-200 font-semibold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
