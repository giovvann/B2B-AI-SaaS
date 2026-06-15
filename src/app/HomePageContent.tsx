'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  BarChart3,
  Sparkles,
  Package,
  ShoppingCart,
  Sun,
  Moon,
  LogOut,
  RotateCcw,
  MoreVertical,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase'

interface HomePageContentProps {
  role: 'owner' | 'employee'
  userName: string
  boutiqueName: string
}

export function HomePageContent({ role, userName, boutiqueName }: HomePageContentProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ✅ CRÍTICO: Esperar a que el componente se monte en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleChangeRole = async () => {
    if (!confirm('¿Seguro que quieres cambiar de rol? Volverás a la pantalla de selección.')) return
    
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: { role: null }
    })
    
    if (!error) {
      router.refresh()
    }
  }

  const ownerActions = [
    {
      id: 'metrics',
      title: 'MÉTRICAS',
      description: 'Ventas, ganancias y estadísticas del negocio',
      icon: BarChart3,
      href: '/dashboard',
      gradient: 'from-blue-500 to-indigo-600',
      shadowColor: 'shadow-blue-500/30',
    },
    {
      id: 'income',
      title: 'INGRESO EXPRESS',
      description: 'Agregar productos al inventario con IA',
      icon: Sparkles,
      href: '/ingresos/nuevo',
      gradient: 'from-purple-500 to-pink-600',
      shadowColor: 'shadow-purple-500/30',
    },
    {
      id: 'inventory',
      title: 'INVENTARIO',
      description: 'Ver y gestionar todos los productos',
      icon: Package,
      href: '/ingresos',
      gradient: 'from-emerald-500 to-teal-600',
      shadowColor: 'shadow-emerald-500/30',
    },
  ]

  const employeeActions = [
    {
      id: 'sale',
      title: 'NUEVA VENTA',
      description: 'Registrar una venta al cliente',
      icon: ShoppingCart,
      href: '/ventas/nueva',
      gradient: 'from-blue-500 to-indigo-600',
      shadowColor: 'shadow-blue-500/30',
    },
    {
      id: 'income',
      title: 'INGRESO EXPRESS',
      description: 'Agregar productos al inventario con IA',
      icon: Sparkles,
      href: '/ingresos/nuevo',
      gradient: 'from-purple-500 to-pink-600',
      shadowColor: 'shadow-purple-500/30',
    },
  ]

  const actions = role === 'owner' ? ownerActions : employeeActions

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto pb-8">
        {/* Header */}
        <div className="mb-10 md:mb-12 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2">
              {role === 'owner' ? 'Panel del dueño' : 'Panel del empleado'}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
              {boutiqueName}
            </h1>
            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-1">
              Hola, <span className="font-bold text-zinc-700 dark:text-zinc-300">{userName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* ✅ Botón de tema con protección contra hydration mismatch */}
            <button
              onClick={() => mounted && setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-4 bg-white dark:bg-[#1a1a1a] rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
              aria-label="Cambiar tema"
              disabled={!mounted}
            >
              {!mounted ? (
                <div className="w-5 h-5" /> // Placeholder del mismo tamaño
              ) : theme === 'dark' ? (
                <Sun className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
              ) : (
                <Moon className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-4 bg-white dark:bg-[#1a1a1a] rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
                aria-label="Configuración"
              >
                <MoreVertical className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
              </button>
              {showSettings && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSettings(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 z-20">
                    <button
                      onClick={handleChangeRole}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Cambiar rol
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className={`grid gap-5 ${
          role === 'owner' 
            ? 'grid-cols-1 md:grid-cols-3' 
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => router.push(action.href)}
                className="group bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 md:p-10 border border-zinc-200 dark:border-zinc-800 hover:border-transparent shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-[0.98] text-left relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <div className={`relative w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center shadow-xl ${action.shadowColor} mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>

                <h2 className="relative text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
                  {action.title}
                </h2>
                <p className="relative text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {action.description}
                </p>

                <div className="relative mt-6 flex items-center gap-2 text-sm font-bold text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                  <span>ACCEDER</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1a] rounded-full border border-zinc-200 dark:border-zinc-800">
            <div className={`w-2 h-2 rounded-full ${role === 'owner' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Sesión activa como {role === 'owner' ? 'Dueño' : 'Empleado'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}