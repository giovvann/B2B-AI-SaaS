'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sun, Moon, X, Store, Activity, AlertTriangle, DollarSign,
  Search, CalendarPlus, Clock, Ban, CheckCircle, Eye, Loader2,
  TrendingUp, Package, ShoppingBag
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  extendSubscription,
  disableBoutique,
  enableBoutique,
  getBoutiqueDetails,
} from '@/lib/superadmin'

interface Boutique {
  id: string
  name: string
  owner_id: string
  owner_email: string
  created_at: string
  subscription_expires_at: string | null
  is_active: boolean
}

interface SuperAdminClientProps {
  boutiques: Boutique[]
}

type Filter = 'all' | 'active' | 'expired' | 'expiring'

export function SuperAdminClient({ boutiques }: SuperAdminClientProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedBoutique, setSelectedBoutique] = useState<Boutique | null>(null)
  const [detailsData, setDetailsData] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  
  // Patrón mounted para evitar errores de hidratación con el tema
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const now = new Date()
  
  const boutiquesWithStatus = useMemo(() => {
    return boutiques.map(b => {
      const expires = b.subscription_expires_at ? new Date(b.subscription_expires_at) : null
      const daysRemaining = expires 
        ? Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      const isExpired = !b.is_active || (expires !== null && expires < now)
      const isExpiring = !isExpired && daysRemaining <= 7 && daysRemaining > 0
      
      return {
        ...b,
        daysRemaining,
        isExpired,
        isExpiring,
        status: isExpired ? 'expired' as const : isExpiring ? 'expiring' as const : 'active' as const,
      }
    })
  }, [boutiques])
  
  const metrics = useMemo(() => {
    const total = boutiquesWithStatus.length
    const active = boutiquesWithStatus.filter(b => b.status === 'active').length
    const expired = boutiquesWithStatus.filter(b => b.status === 'expired').length
    const potentialIncome = active * 449
    return { total, active, expired, potentialIncome }
  }, [boutiquesWithStatus])
  
  const filteredBoutiques = useMemo(() => {
    let filtered = boutiquesWithStatus
    
    if (filter === 'active') filtered = filtered.filter(b => b.status === 'active')
    if (filter === 'expired') filtered = filtered.filter(b => b.status === 'expired')
    if (filter === 'expiring') filtered = filtered.filter(b => b.status === 'expiring')
    
    if (search.trim()) {
      const s = search.toLowerCase()
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(s) || 
        b.owner_email.toLowerCase().includes(s)
      )
    }
    
    return filtered
  }, [boutiquesWithStatus, filter, search])
  
  const handleExtend = (boutique: Boutique, days: number) => {
    startTransition(async () => {
      try {
        const result = await extendSubscription(boutique.id, days)
        toast.success(`Licencia extendida ${days} días para ${result.boutiqueName}`)
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }
  
  const handleDisable = (boutique: Boutique) => {
    if (!confirm(`¿Deshabilitar ${boutique.name}? El dueño perderá acceso.`)) return
    
    startTransition(async () => {
      try {
        const result = await disableBoutique(boutique.id)
        toast.success(`${result.boutiqueName} deshabilitada`)
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }
  
  const handleEnable = (boutique: Boutique) => {
    startTransition(async () => {
      try {
        const result = await enableBoutique(boutique.id)
        toast.success(`${result.boutiqueName} habilitada`)
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }
  
  const handleViewDetails = async (boutique: Boutique) => {
    setSelectedBoutique(boutique)
    setDetailsLoading(true)
    try {
      const data = await getBoutiqueDetails(boutique.id)
      setDetailsData(data)
    } catch (err) {
      toast.error((err as Error).message)
      setSelectedBoutique(null)
    } finally {
      setDetailsLoading(false)
    }
  }
  
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'TODAS', count: metrics.total },
    { value: 'active', label: 'ACTIVAS', count: metrics.active },
    { value: 'expiring', label: 'POR EXPIRAR', count: boutiquesWithStatus.filter(b => b.status === 'expiring').length },
    { value: 'expired', label: 'EXPIRADAS', count: metrics.expired },
  ]
  
  const getBadgeStyles = (status: 'active' | 'expired' | 'expiring') => {
    if (status === 'active') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'
    if (status === 'expiring') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
  }
  
  const getBadgeLabel = (status: 'active' | 'expired' | 'expiring') => {
    if (status === 'active') return 'ACTIVA'
    if (status === 'expiring') return 'POR EXPIRAR'
    return 'EXPIRADA'
  }
  
  // Skeleton mientras no está montado (evita hidratación)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-12 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-4" />
            <div className="h-6 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pb-8">
        <div className="fixed top-4 right-4 flex items-center gap-2 z-20">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-4 bg-white dark:bg-zinc-900 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 shadow-sm"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
            ) : (
              <Moon className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
            )}
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-5 py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-colors border border-red-200 dark:border-red-900/50 shadow-sm"
          >
            <X className="w-4 h-4" strokeWidth={3} />
            <span className="text-sm md:text-base">CERRAR</span>
          </button>
        </div>
        
        <div className="mb-8 pr-32">
          <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2">
            Panel secreto
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
            SUPERADMIN
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400">
            Gestiona todas las boutiques del SaaS
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 rounded-3xl p-6 border border-blue-200 dark:border-blue-900/50">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
              <Store className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
              Total Boutiques
            </div>
            <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">
              {metrics.total}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20 rounded-3xl p-6 border border-green-200 dark:border-green-900/50">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 mb-4">
              <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider mb-1">
              Boutiques Activas
            </div>
            <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">
              {metrics.active}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/20 rounded-3xl p-6 border border-red-200 dark:border-red-900/50">
            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 mb-4">
              <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">
              Boutiques Expiradas
            </div>
            <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">
              {metrics.expired}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 rounded-3xl p-6 border border-purple-200 dark:border-purple-900/50">
            <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
              <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">
              Ingresos Potenciales
            </div>
            <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">
              ${metrics.potentialIncome.toLocaleString('es-MX')}
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre de boutique o email del dueño..."
              className="w-full pl-14 pr-5 py-4 text-base border-2 rounded-2xl focus:border-blue-500 focus:outline-none bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs tracking-wider transition-all flex items-center gap-2 ${
                  filter === f.value
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {f.label}
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  filter === f.value 
                    ? 'bg-white/20' 
                    : 'bg-zinc-200 dark:bg-zinc-700'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
          {filteredBoutiques.length === 0 ? (
            <div className="text-center py-20">
              <Store className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
              <p className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                No se encontraron boutiques
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Negocio</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Registro</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Días restantes</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredBoutiques.map(boutique => (
                    <tr key={boutique.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white">{boutique.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">{boutique.owner_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {new Date(boutique.created_at).toLocaleDateString('es-MX')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold ${
                          boutique.status === 'active' ? 'text-zinc-900 dark:text-white' :
                          boutique.status === 'expiring' ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {boutique.daysRemaining} días
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black border ${getBadgeStyles(boutique.status)}`}>
                          {getBadgeLabel(boutique.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleExtend(boutique, 30)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-xs font-bold rounded-xl transition-colors"
                            title="Extender 30 días"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" strokeWidth={3} />
                            <span>+30d</span>
                          </button>
                          <button
                            onClick={() => handleExtend(boutique, 7)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl transition-colors"
                            title="Dar prueba 7 días"
                          >
                            <Clock className="w-3.5 h-3.5" strokeWidth={3} />
                            <span>+7d</span>
                          </button>
                          {boutique.is_active ? (
                            <button
                              onClick={() => handleDisable(boutique)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs font-bold rounded-xl transition-colors"
                              title="Deshabilitar"
                            >
                              <Ban className="w-3.5 h-3.5" strokeWidth={3} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnable(boutique)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-xs font-bold rounded-xl transition-colors"
                              title="Habilitar"
                            >
                              <CheckCircle className="w-3.5 h-3.5" strokeWidth={3} />
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDetails(boutique)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white text-xs font-bold rounded-xl transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-3.5 h-3.5" strokeWidth={3} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {selectedBoutique && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setSelectedBoutique(null); setDetailsData(null) }}>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Detalles de boutique
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
                    {selectedBoutique.name}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono mt-1">
                    {selectedBoutique.owner_email}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedBoutique(null); setDetailsData(null) }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : detailsData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                      <Package className="w-5 h-5 text-blue-500 mb-2" />
                      <div className="text-2xl font-black text-zinc-900 dark:text-white">
                        {detailsData.productsCount}
                      </div>
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Productos
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                      <ShoppingBag className="w-5 h-5 text-emerald-500 mb-2" />
                      <div className="text-2xl font-black text-zinc-900 dark:text-white">
                        {detailsData.salesCount}
                      </div>
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Ventas
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                      <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
                      <div className="text-2xl font-black text-zinc-900 dark:text-white">
                        ${detailsData.totalSales.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Total vendido
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                      <CalendarPlus className="w-5 h-5 text-purple-500 mb-2" />
                      <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {detailsData.lastSale 
                          ? new Date(detailsData.lastSale.created_at).toLocaleDateString('es-MX')
                          : 'N/A'}
                      </div>
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Última venta
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Suscripción
                    </div>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                      Expira: <span className="font-bold">
                        {selectedBoutique.subscription_expires_at 
                          ? new Date(selectedBoutique.subscription_expires_at).toLocaleString('es-MX')
                          : 'Sin fecha'}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
                      Estado: <span className={`font-bold ${selectedBoutique.is_active ? 'text-green-500' : 'text-red-500'}`}>
                        {selectedBoutique.is_active ? 'Activa' : 'Deshabilitada'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}