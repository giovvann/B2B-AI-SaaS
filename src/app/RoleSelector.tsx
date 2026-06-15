'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Crown, User, Sun, Moon, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'

export function RoleSelector() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [selectedRole, setSelectedRole] = useState<'owner' | 'employee' | null>(null)

  const handleSelectRole = (role: 'owner' | 'employee') => {
    setSelectedRole(role)
    
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Guardar el rol en la metadata del usuario
      const { error } = await supabase.auth.updateUser({
        data: { role: role }
      })

      if (error) {
        console.error('Error guardando rol:', error)
        return
      }

      // Recargar la página para mostrar la vista correcta
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300 flex items-center justify-center">
      {/* Botón de tema (arriba derecha) */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-4 right-4 p-4 bg-white dark:bg-[#1a1a1a] rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 z-10"
        aria-label="Cambiar tema"
      >
        {theme === 'dark' ? (
          <Sun className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
        ) : (
          <Moon className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
        )}
      </button>

      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white mb-4">
            BIENVENIDO
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-medium">
            Selecciona tu rol para continuar
          </p>
        </div>

        {/* Opciones de rol */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dueño */}
          <button
            onClick={() => handleSelectRole('owner')}
            disabled={isPending}
            className={`group relative bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-8 md:p-10 border-2 transition-all duration-200 text-left active:scale-[0.98] ${
              selectedRole === 'owner'
                ? 'border-blue-500 shadow-blue-500/30'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Crown className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              {isPending && selectedRole === 'owner' && (
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
              DUEÑO
            </h2>
            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Acceso completo: métricas, inventario, ventas y configuración del negocio.
            </p>
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Accesos incluidos
              </div>
              <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                  Panel de métricas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                  Ingreso express (IA)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                  Inventario completo
                </li>
              </ul>
            </div>
          </button>

          {/* Empleado */}
          <button
            onClick={() => handleSelectRole('employee')}
            disabled={isPending}
            className={`group relative bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-8 md:p-10 border-2 transition-all duration-200 text-left active:scale-[0.98] ${
              selectedRole === 'employee'
                ? 'border-blue-500 shadow-blue-500/30'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <User className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              {isPending && selectedRole === 'employee' && (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
              EMPLEADO
            </h2>
            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Operación diaria: registrar ventas y agregar productos nuevos al inventario.
            </p>
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Accesos incluidos
              </div>
              <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                  Nueva venta
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                  Ingreso express (IA)
                </li>
              </ul>
            </div>
          </button>
        </div>

        {/* Info abajo */}
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-8">
          Tu rol se guarda en tu cuenta. Puedes cambiarlo más tarde desde configuración.
        </p>
      </div>
    </div>
  )
}