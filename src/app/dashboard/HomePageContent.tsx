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
  History,
  Calculator,
  Wallet,
  Smartphone,
  Settings,
  Activity,
  Download,
  ToggleLeft,
  UserX,
  Lock,
  CheckCircle2,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase'
import { CalculatorModal } from '../components/CalculatorModal'
import { AdminPanel } from '@/components/AdminPanel'
import { AssistantPanel } from '../components/AssistantPanel'

interface HomePageContentProps {
  role: 'owner' | 'employee'
  userName: string
  boutiqueName: string
  showAdmin?: boolean
}

export function HomePageContent({ role, userName, boutiqueName, showAdmin }: HomePageContentProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [sellerAutoAccept, setSellerAutoAccept] = useState(true)
  const [pinRequired, setPinRequired] = useState(true)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)
  const [toggleMsg, setToggleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (showAdmin) loadConfigToggles()
  }, [])

  const loadConfigToggles = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: boutique } = await supabase
        .from('boutiques')
        .select('auto_accept_employees, pin_required')
        .eq('owner_id', user.id)
        .single()
      if (boutique) {
        setSellerAutoAccept(boutique.auto_accept_employees !== false)
        setPinRequired(boutique.pin_required !== false)
      }
    } catch {}
  }

  const handleToggleSetting = async (setting: string, value: boolean) => {
    setToggleLoading(setting)
    setToggleMsg(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      
      const updateData: any = {}
      if (setting === 'auto_accept') updateData.auto_accept_employees = value
      if (setting === 'pin_required') updateData.pin_required = value

      const { error } = await supabase
        .from('boutiques')
        .update(updateData)
        .eq('owner_id', user.id)

      if (error) throw error

      if (setting === 'auto_accept') setSellerAutoAccept(value)
      if (setting === 'pin_required') setPinRequired(value)
      setToggleMsg({ type: 'success', text: `Configuración actualizada` })
      setTimeout(() => setToggleMsg(null), 2500)
    } catch (err: any) {
      setToggleMsg({ type: 'error', text: err.message || 'Error al guardar' })
    } finally {
      setToggleLoading(null)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    sessionStorage.removeItem('veliora_pin_verified')
    router.push('/login')
    router.refresh()
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
      href: '/metricas',
      gradient: 'from-gold-500 to-espresso-600',
      shadowColor: 'shadow-gold-400/30',
    },
    {
      id: 'income',
      title: 'INGRESO EXPRESS',
      description: 'Agregar productos al inventario con IA',
      icon: Sparkles,
      href: '/ingresos/nuevo',
      gradient: 'from-espresso-500 to-gold-600',
      shadowColor: 'shadow-gold-400/30',
    },
    {
      id: 'inventory',
      title: 'INVENTARIO',
      description: 'Ver y gestionar todos los productos',
      icon: Package,
      href: '/ingresos',
      gradient: 'from-gold-500 to-gold-600',
      shadowColor: 'shadow-gold-500/30',
    },
    {
      id: 'gastos',
      title: 'GASTOS',
      description: 'Registra gastos y ve la salud real del negocio',
      icon: Wallet,
      href: '/gastos',
      gradient: 'from-rose-500 to-red-600',
      shadowColor: 'shadow-rose-500/30',
    },
    {
      id: 'salud',
      title: 'SALUD',
      description: 'Semáforo inteligente y recomendaciones IA',
      icon: Activity,
      href: '/salud',
      gradient: 'from-gold-500 to-gold-600',
      shadowColor: 'shadow-gold-400/30',
    },
  ]

  const employeeActions = [
    {
      id: 'sale',
      title: 'NUEVA VENTA',
      description: 'Registrar una venta al cliente',
      icon: ShoppingCart,
      href: '/ventas/nueva',
      gradient: 'from-gold-500 to-espresso-600',
      shadowColor: 'shadow-gold-400/30',
    },
    {
      id: 'income',
      title: 'INGRESO EXPRESS',
      description: 'Agregar productos al inventario con IA',
      icon: Sparkles,
      href: '/ingresos/nuevo',
      gradient: 'from-espresso-500 to-gold-600',
      shadowColor: 'shadow-gold-400/30',
    },
  ]

  const actions = role === 'owner' ? ownerActions : employeeActions

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] p-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto pb-8">
        <div className="mb-10 md:mb-12 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-bold text-[rgba(42,36,32,0.5)] dark:text-espresso-500 uppercase tracking-[0.2em] mb-2">
              {role === 'owner' ? 'Panel del dueño' : 'Panel del empleado'}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#2a2420] dark:text-white">
              {boutiqueName}
            </h1>
            <p className="text-sm md:text-base text-[rgba(42,36,32,0.62)] dark:text-espresso-400 mt-1">
              Hola, <span className="font-bold text-[#2a2420] dark:text-espresso-300">{userName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setCalcOpen(true)}
              className="p-4 bg-white dark:bg-[#16130f] rounded-2xl hover:bg-[rgba(200,164,118,0.06)] dark:hover:bg-espresso-800 transition-colors border border-[rgba(200,164,118,0.12)] dark:border-[rgba(200,164,118,0.16)]"
              aria-label="Calculadora"
            >
              <Calculator className="w-5 h-5 text-[#2a2420] dark:text-espresso-200" />
            </button>
            <button
              onClick={() => mounted && setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-4 bg-white dark:bg-[#16130f] rounded-2xl hover:bg-[rgba(200,164,118,0.06)] dark:hover:bg-espresso-800 transition-colors border border-[rgba(200,164,118,0.12)] dark:border-[rgba(200,164,118,0.16)]"
              aria-label="Cambiar tema"
              disabled={!mounted}
            >
              {!mounted ? (
                <div className="w-5 h-5" />
              ) : theme === 'dark' ? (
                <Sun className="w-5 h-5 text-[#2a2420] dark:text-espresso-200" />
              ) : (
                <Moon className="w-5 h-5 text-[#2a2420] dark:text-espresso-200" />
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-4 bg-white dark:bg-[#16130f] rounded-2xl hover:bg-[rgba(200,164,118,0.06)] dark:hover:bg-espresso-800 transition-colors border border-[rgba(200,164,118,0.12)] dark:border-[rgba(200,164,118,0.16)]"
                aria-label="Configuración"
              >
                <MoreVertical className="w-5 h-5 text-[#2a2420] dark:text-espresso-200" />
              </button>
              {showSettings && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSettings(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#16130f] rounded-2xl shadow-xl border border-[rgba(200,164,118,0.12)] dark:border-[rgba(200,164,118,0.16)] p-2 z-20">
                    {showAdmin && (
                      <>
                        <button
                          onClick={() => { setShowSettings(false); setAdminOpen(true) }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-espresso-700 dark:text-espresso-300 hover:bg-espresso-100 dark:hover:bg-espresso-800 rounded-xl transition-colors"
                        >
                          <Smartphone className="w-4 h-4" />
                          Gestionar empleados
                        </button>
                        <button
                          onClick={() => { setShowSettings(false); router.push('/configuracion') }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-espresso-700 dark:text-espresso-300 hover:bg-espresso-100 dark:hover:bg-espresso-800 rounded-xl transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Configuración
                        </button>
                        <div className="border-t border-espresso-200 dark:border-[rgba(200,164,118,0.16)] my-2" />
                        <div className="px-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-espresso-600 dark:text-espresso-400 flex items-center gap-1.5">
                              <UserX className="w-3.5 h-3.5" />
                              Aceptar empleados
                            </span>
                            <button
                              onClick={() => handleToggleSetting('auto_accept', !sellerAutoAccept)}
                              disabled={toggleLoading === 'auto_accept'}
                              className={`relative w-10 h-5 rounded-full transition-colors ${sellerAutoAccept ? 'bg-gold-500' : 'bg-espresso-300 dark:bg-espresso-600'}`}
                            >
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sellerAutoAccept ? 'translate-x-5' : 'translate-x-0.5'}`} style={{ transform: sellerAutoAccept ? 'translateX(20px)' : 'translateX(2px)' }} />
                            </button>
                          </div>
                          <p className="text-[10px] text-espresso-600 dark:text-espresso-500">{sellerAutoAccept ? 'Auto-aprobar nuevos empleados' : 'Requiere aprobación manual'}</p>
                        </div>
                        <div className="px-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-espresso-600 dark:text-espresso-400 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              PIN del dueño
                            </span>
                            <button
                              onClick={() => handleToggleSetting('pin_required', !pinRequired)}
                              disabled={toggleLoading === 'pin_required'}
                              className={`relative w-10 h-5 rounded-full transition-colors ${pinRequired ? 'bg-gold-400' : 'bg-espresso-300 dark:bg-espresso-600'}`}
                            >
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${pinRequired ? 'translate-x-5' : 'translate-x-0.5'}`} style={{ transform: pinRequired ? 'translateX(20px)' : 'translateX(2px)' }} />
                            </button>
                          </div>
                          <p className="text-[10px] text-espresso-600 dark:text-espresso-500">{pinRequired ? 'PIN requerido para acceder' : 'Acceso sin PIN'}</p>
                        </div>
                        {toggleMsg && (
                          <div className={`mx-4 px-3 py-2 rounded-xl text-xs font-semibold mb-1 ${toggleMsg.type === 'success' ? 'bg-gold-500/10 text-gold-600 dark:text-gold-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                            {toggleMsg.text}
                          </div>
                        )}
                        <div className="border-t border-espresso-200 dark:border-[rgba(200,164,118,0.16)] my-2" />
                        <button
                          onClick={() => { setShowSettings(false); router.push('/exportar-todo') }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-espresso-700 dark:text-espresso-300 hover:bg-espresso-100 dark:hover:bg-espresso-800 rounded-xl transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Exportar todos mis datos
                        </button>
                      </>
                    )}
                    {!showAdmin && (
                      <button
                        onClick={handleChangeRole}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-espresso-700 dark:text-espresso-300 hover:bg-espresso-100 dark:hover:bg-espresso-800 rounded-xl transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Cambiar rol
                      </button>
                    )}
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
                className="group bg-white dark:bg-[#16130f] rounded-3xl p-8 md:p-10 border border-[rgba(200,164,118,0.12)] dark:border-[rgba(200,164,118,0.16)] hover:border-[rgba(200,164,118,0.3)] dark:hover:border-transparent shadow-xl shadow-[rgba(200,164,118,0.04)] hover:shadow-2xl transition-all duration-200 active:scale-[0.98] text-left relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <div className={`relative w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center shadow-xl ${action.shadowColor} mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>

                <h2 className="relative text-2xl md:text-3xl font-black tracking-tight text-[#2a2420] dark:text-white mb-2">
                  {action.title}
                </h2>
                <p className="relative text-sm md:text-base text-[rgba(42,36,32,0.62)] dark:text-espresso-400 leading-relaxed">
                  {action.description}
                </p>

                <div className="relative mt-6 flex items-center gap-2 text-sm font-bold text-[rgba(42,36,32,0.55)] dark:text-espresso-500 group-hover:text-[#2a2420] dark:group-hover:text-espresso-300 transition-colors">
                  <span>ACCEDER</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>

        <button onClick={() => router.push('/ventas')}
          className="mt-5 w-full md:w-auto md:min-w-[260px] flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-[#16130f] hover:bg-[rgba(200,164,118,0.06)] dark:hover:bg-espresso-800 border-2 border-[rgba(200,164,118,0.12)] dark:border-[rgba(200,164,118,0.16)] hover:border-[#c8a476] dark:hover:border-gold-500 rounded-2xl transition-colors group"
        >
          <History className="w-6 h-6 text-espresso-500" strokeWidth={2.5} />
          <span className="text-lg font-black tracking-tight text-[#2a2420] dark:text-white">VER HISTORIAL DE VENTAS</span>
        </button>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#16130f] rounded-full border border-[rgba(200,164,118,0.12)] dark:border-[rgba(200,164,118,0.16)]">
            <div className={`w-2 h-2 rounded-full ${role === 'owner' ? 'bg-gold-400' : 'bg-gold-500'}`} />
            <span className="text-xs font-bold text-[rgba(42,36,32,0.55)] dark:text-espresso-400 uppercase tracking-wider">
              Sesión activa como {role === 'owner' ? 'Dueño' : 'Empleado'}
            </span>
          </div>
        </div>
      </div>

      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />
      <AssistantPanel boutiqueName={boutiqueName} />
    </div>
  )
}
