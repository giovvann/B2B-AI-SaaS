import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageCircle, LogOut, ArrowRight, Sparkles } from 'lucide-react'
import { logoutAction, switchToFreePlanAction } from './actions'

export const metadata = {
  title: 'Membresía | Veliora',
  description: 'Activa tu membresía para seguir usando Veliora.',
}

export default async function SuscripcionExpiradaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const WHATSAPP_NUMBER = '528342177709'
  const SUBSCRIPTION_PRICE = process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE || '449'

  const whatsappMessage = encodeURIComponent(
    `Hola, soy ${user.email} y quiero activar mi membresía en Veliora.`
  )
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-3xl p-8 md:p-10 border border-white/[0.06] text-center">
          <div className="flex items-baseline justify-center space-x-1 mb-8">
            <span className="text-4xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, letterSpacing: '0.02em' }}>Veliora</span>
            <span className="text-sm text-cyan-400" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: '0.1em' }}>.lat</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Membresía requerida
          </h1>

          <p className="text-gray-400 mb-6 leading-relaxed">
            Para usar Veliora necesitas una membresía activa de <strong className="text-white">${SUBSCRIPTION_PRICE} MXN/mes</strong>.
            Paga una vez y accede a todas las funciones sin límites.
          </p>

          <div className="bg-gradient-to-br from-blue-500/[0.08] to-cyan-500/[0.08] rounded-2xl p-5 mb-6 border border-blue-500/20 text-left">
            <p className="text-sm text-gray-300 font-semibold mb-2 text-center">Todo incluido en Premium:</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Escaneo IA de facturas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Asistente IA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Alertas WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Métricas avanzadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Dashboard de Salud</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Código de barras</span>
              </div>
            </div>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[64px] bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg tracking-wide rounded-2xl shadow-xl shadow-green-500/30 hover:shadow-green-500/50 flex items-center justify-center gap-3 transition-all active:scale-[0.98] mb-3"
          >
            <MessageCircle className="w-6 h-6" strokeWidth={2.5} />
            <span>PAGAR POR WHATSAPP — ${SUBSCRIPTION_PRICE} MXN/mes</span>
          </a>

          <p className="text-xs text-gray-500 mb-6">
            Pago único mensual. Te contactamos por WhatsApp para procesar tu pago y activar tu membresía al instante.
          </p>

          {/* Separador */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">O continúa gratis</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <form action={switchToFreePlanAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-white font-semibold rounded-2xl transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" />
              CONTINUAR CON PLAN GRATUITO
            </button>
          </form>

          <p className="text-xs text-gray-600 mt-3">
            Plan gratuito: inventario manual, ventas, gastos, 1 dispositivo. Sin funciones IA.
          </p>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-300 font-semibold text-sm transition-colors"
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
