import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertCircle, LogOut, MessageCircle } from 'lucide-react'
import { logoutAction } from './actions'

export const metadata = {
  title: 'Suscripción Expirada | Mi Boutique',
  description: 'Tu acceso ha expirado. Contacta al administrador.',
}

export default async function SuscripcionExpiradaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const WHATSAPP_NUMBER = process.env.SUPERADMIN_WHATSAPP || '521234567890'
  const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'Giovva729@hotmail.com'
  
  const whatsappMessage = encodeURIComponent(
    `Hola, soy ${user.email} y mi suscripción ha expirado. Me gustaría renovarla.`
  )
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors">
      <div className="flex items-center justify-center min-h-[calc(100vh-2rem)]">
        <div className="max-w-lg w-full">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 md:p-12 border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-6">
              <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" strokeWidth={2} />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">
              Tu acceso ha expirado
            </h1>
            
            <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Tu suscripción ya no está activa. Para seguir usando la plataforma, 
              contacta al administrador para renovarla.
            </p>
            
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[70px] bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black text-lg tracking-wider rounded-2xl shadow-xl shadow-green-500/30 hover:shadow-green-500/50 flex items-center justify-center gap-3 transition-all active:scale-[0.98] mb-4"
            >
              <MessageCircle className="w-6 h-6" strokeWidth={2.5} />
              <span>CONTACTAR PARA RENOVAR</span>
            </a>
            
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-semibold text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </form>
          </div>
          
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-6">
            Email de soporte: {SUPERADMIN_EMAIL}
          </p>
        </div>
      </div>
    </div>
  )
}