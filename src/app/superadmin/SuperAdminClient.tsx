'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sun, Moon, X, Store, Activity, AlertTriangle, DollarSign,
  Search, CalendarPlus, Clock, Ban, CheckCircle, Eye, Loader2,
  TrendingUp, Package, ShoppingBag, Ticket
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  extendSubscription,
  disableBoutique,
  enableBoutique,
  getBoutiqueDetails,
  cancelTrial,
} from '@/lib/superadmin'

interface Boutique {
  id: string
  name: string
  owner_id: string
  owner_email: string
  created_at: string
  subscription_expires_at: string | null
  is_active: boolean
  is_trial: boolean
}

interface SuperAdminClientProps {
  boutiques: Boutique[]
}

type Filter = 'all' | 'active' | 'expired' | 'expiring' | 'trial'

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
  const [pendingPays, setPendingPays] = useState<any[]>([])
  const [paysLoading, setPaysLoading] = useState(false)

  const loadPendingPays = async () => {
    setPaysLoading(true)
    try {
      const r = await fetch('/api/payments/revisar')
      const j = await r.json()
      setPendingPays(j.pending || [])
    } catch { /* sin conexión: se reintenta manual */ }
    setPaysLoading(false)
  }

  const handlePayDecision = (id: string, action: 'approve' | 'reject') => {
    startTransition(async () => {
      try {
        const r = await fetch('/api/payments/revisar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: id, action }),
        })
        const j = await r.json()
        if (!r.ok) throw new Error(j.error || 'Error al decidir')
        toast.success(action === 'approve' ? 'Pago aprobado, premium activado' : 'Pago rechazado')
        loadPendingPays()
        router.refresh()
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }
  
  // Patrón mounted para evitar errores de hidratación con el tema
  useEffect(() => {
    setMounted(true)
    loadPendingPays()
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
      
      let status: 'active' | 'expired' | 'expiring' | 'trial' = isExpired ? 'expired' : isExpiring ? 'expiring' : 'active'
      if (b.is_trial && status === 'active') status = 'trial'
      
      return {
        ...b,
        daysRemaining,
        isExpired,
        isExpiring,
        status,
      }
    })
  }, [boutiques])
  
  const SUBSCRIPTION_PRICE = Number(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE) || 199

  const metrics = useMemo(() => {
    const total = boutiquesWithStatus.length
    const active = boutiquesWithStatus.filter(b => b.status === 'active' || b.status === 'trial').length
    const expired = boutiquesWithStatus.filter(b => b.status === 'expired').length
    const trial = boutiquesWithStatus.filter(b => b.status === 'trial').length
    const paid = boutiquesWithStatus.filter(b => b.status === 'active').length
    const potentialIncome = paid * SUBSCRIPTION_PRICE
    return { total, active, expired, trial, paid, potentialIncome }
  }, [boutiquesWithStatus, SUBSCRIPTION_PRICE])
  
  const filteredBoutiques = useMemo(() => {
    let filtered = boutiquesWithStatus
    
    if (filter === 'active') filtered = filtered.filter(b => b.status === 'active' || b.status === 'trial')
    if (filter === 'expired') filtered = filtered.filter(b => b.status === 'expired')
    if (filter === 'expiring') filtered = filtered.filter(b => b.status === 'expiring')
    if (filter === 'trial') filtered = filtered.filter(b => b.status === 'trial')
    
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
  
  const handleCancelTrial = (boutique: Boutique) => {
    if (!confirm(`¿Cancelar trial de ${boutique.name}? El usuario quedará como prueba gratuita expirada.`)) return
    startTransition(async () => {
      try {
        const result = await cancelTrial(boutique.id)
        toast.success(`Trial cancelado para ${result.boutiqueName}`)
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
    } finally {
      setDetailsLoading(false)
    }
  }
  
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'TODAS', count: metrics.total },
    { value: 'active', label: 'ACTIVAS', count: metrics.active },
    { value: 'trial', label: 'TRIAL', count: metrics.trial },
    { value: 'expiring', label: 'POR EXPIRAR', count: boutiquesWithStatus.filter(b => b.status === 'expiring').length },
    { value: 'expired', label: 'EXPIRADAS', count: metrics.expired },
  ]
  
  const getBadgeStyles = (status: 'active' | 'expired' | 'expiring' | 'trial') => {
    if (status === 'active') return 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 border-gold-200 dark:border-gold-900/50'
    if (status === 'trial') return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50'
    if (status === 'expiring') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
  }
  
  const getBadgeLabel = (status: 'active' | 'expired' | 'expiring' | 'trial') => {
    if (status === 'active') return 'ACTIVA'
    if (status === 'trial') return 'TRIAL'
    if (status === 'expiring') return 'POR EXPIRAR'
    return 'EXPIRADA'
  }
  
  // Skeleton mientras no está montado (evita hidratación)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-espresso-50 dark:bg-espresso-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-12 w-64 bg-espresso-200 dark:bg-[#201b16] rounded-2xl mb-4" />
            <div className="h-6 w-96 bg-espresso-200 dark:bg-[#201b16] rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-40 bg-espresso-200 dark:bg-[#201b16] rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-espresso-50 dark:bg-espresso-900 p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pb-8">
        <div className="fixed top-4 right-4 flex items-center gap-2 z-20">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-4 bg-white dark:bg-[#16130f] rounded-2xl hover:bg-espresso-100 dark:hover:bg-espresso-800 transition-colors border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] shadow-sm"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-espresso-800 dark:text-espresso-200" />
            ) : (
              <Moon className="w-5 h-5 text-espresso-800 dark:text-espresso-200" />
            )}
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-5 py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-colors border border-red-200 dark:border-red-900/50 shadow-sm"
          >
            <X className="w-4 h-4" strokeWidth={3} />
            <span className="text-sm md:text-base">CERRAR</span>
          </button>
        </div>
        
        <div className="mb-8 pr-32">
          <div className="text-xs font-bold text-espresso-600 dark:text-espresso-500 uppercase tracking-[0.2em] mb-2">
            Panel secreto
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-espresso-900 dark:text-white mb-2">
            SUPERADMIN
          </h1>
          <p className="text-base text-espresso-600 dark:text-espresso-400">
            Gestiona todas las boutiques del SaaS
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-900/40 dark:to-gold-900/20 rounded-3xl p-6 border border-gold-200 dark:border-gold-800/50">
            <div className="w-12 h-12 bg-gold-400 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-400/30 mb-4">
              <Store className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-xs font-bold text-gold-700 dark:text-gold-300 uppercase tracking-wider mb-1">
              Total Boutiques
            </div>
            <div className="text-3xl md:text-4xl font-black text-espresso-900 dark:text-white">
              {metrics.total}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-900/40 dark:to-gold-900/20 rounded-3xl p-6 border border-gold-200 dark:border-gold-900/50">
            <div className="w-12 h-12 bg-gold-500 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-500/30 mb-4">
              <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-xs font-bold text-gold-700 dark:text-gold-300 uppercase tracking-wider mb-1">
              Boutiques Activas
            </div>
            <div className="text-3xl md:text-4xl font-black text-espresso-900 dark:text-white">
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
            <div className="text-3xl md:text-4xl font-black text-espresso-900 dark:text-white">
              {metrics.expired}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/20 rounded-3xl p-6 border border-orange-200 dark:border-orange-900/50">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4">
              <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-1">
              En Trial
            </div>
            <div className="text-3xl md:text-4xl font-black text-espresso-900 dark:text-white">
              {metrics.trial}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gold-50 to-gold-100 dark:from-espresso-900/40 dark:to-espresso-900/20 rounded-3xl p-6 border border-gold-200 dark:border-espresso-900/50">
            <div className="w-12 h-12 bg-gold-400 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-400/30 mb-4">
              <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-xs font-bold text-espresso-700 dark:text-gold-300 uppercase tracking-wider mb-1">
              Ingresos Potenciales
            </div>
            <div className="text-3xl md:text-4xl font-black text-espresso-900 dark:text-white">
              ${metrics.potentialIncome.toLocaleString('es-MX')}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16130f] rounded-3xl p-6 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-espresso-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gold-500" />
              Pagos pendientes ({pendingPays.length})
            </h2>
            <button
              onClick={loadPendingPays}
              disabled={paysLoading}
              className="px-4 py-2 rounded-2xl font-bold text-xs bg-espresso-100 dark:bg-[#201b16] text-espresso-600 dark:text-espresso-300 hover:bg-espresso-200 transition-all"
            >
              {paysLoading ? 'Cargando…' : 'Recargar'}
            </button>
          </div>
          {pendingPays.length === 0 ? (
            <p className="text-sm text-espresso-500 dark:text-espresso-400">
              Sin comprobantes por revisar. Los pagos con IA de alta confianza se aprueban solos.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingPays.map((p) => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-2xl bg-espresso-50 dark:bg-espresso-900/40 border border-espresso-200 dark:border-[rgba(200,164,118,0.12)]">
                  <div className="flex-1 text-sm text-espresso-700 dark:text-espresso-200">
                    <div className="font-bold">${p.amount_mxn} MXN · {p.rail}</div>
                    <div className="opacity-70">confianza IA: {p.ai_confidence ?? '—'} · {p.ai_reason || 'sin detalle'}</div>
                    {p.code && (
                      <div className="mt-1 font-mono text-xs bg-black/10 dark:bg-white/10 rounded-lg px-2 py-1 break-all flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 flex-shrink-0" /> {p.code} <span className="opacity-60 font-sans">(cánjealo en OXXO y luego aprueba)</span>
                      </div>
                    )}
                    <div className="opacity-50 text-xs">{new Date(p.created_at).toLocaleString('es-MX')}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePayDecision(p.id, 'approve')}
                      disabled={isPending}
                      className="px-4 py-2.5 rounded-2xl font-bold text-xs bg-green-600 hover:bg-green-700 text-white transition-all flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> Aprobar
                    </button>
                    <button
                      onClick={() => handlePayDecision(p.id, 'reject')}
                      disabled={isPending}
                      className="px-4 py-2.5 rounded-2xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1"
                    >
                      <Ban className="w-4 h-4" /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-[#16130f] rounded-3xl p-6 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] shadow-xl mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-espresso-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre de boutique o email del dueño..."
              className="w-full pl-14 pr-5 py-4 text-base border-2 rounded-2xl focus:border-gold-400 focus:outline-none bg-white dark:bg-espresso-900 border-espresso-200 dark:border-[rgba(200,164,118,0.16)] text-espresso-900 dark:text-white placeholder:text-espresso-400"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs tracking-wider transition-all flex items-center gap-2 ${
                  filter === f.value
                    ? 'bg-espresso-900 dark:bg-white text-white dark:text-espresso-900 shadow-lg'
                    : 'bg-espresso-100 dark:bg-[#201b16] text-espresso-600 dark:text-espresso-400 hover:bg-espresso-200 dark:hover:bg-espresso-700'
                }`}
              >
                {f.label}
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  filter === f.value 
                    ? 'bg-white/20' 
                    : 'bg-espresso-200 dark:bg-[#262019]'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#16130f] rounded-3xl border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] shadow-xl overflow-hidden">
          {filteredBoutiques.length === 0 ? (
            <div className="text-center py-20">
              <Store className="w-16 h-16 mx-auto mb-4 text-espresso-300 dark:text-espresso-700" />
              <p className="text-lg font-semibold text-espresso-600 dark:text-espresso-400">
                No se encontraron boutiques
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-espresso-50 dark:bg-espresso-900 border-b border-espresso-200 dark:border-[rgba(200,164,118,0.16)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-espresso-600 dark:text-espresso-400 uppercase tracking-wider">Negocio</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-espresso-600 dark:text-espresso-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-espresso-600 dark:text-espresso-400 uppercase tracking-wider">Registro</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-espresso-600 dark:text-espresso-400 uppercase tracking-wider">Días restantes</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-espresso-600 dark:text-espresso-400 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-espresso-600 dark:text-espresso-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso-100 dark:divide-espresso-800">
                  {filteredBoutiques.map(boutique => (
                    <tr key={boutique.id} className="hover:bg-espresso-50 dark:hover:bg-espresso-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-espresso-900 dark:text-white">{boutique.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-espresso-600 dark:text-espresso-400 font-mono">{boutique.owner_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-espresso-600 dark:text-espresso-400">
                          {new Date(boutique.created_at).toLocaleDateString('es-MX')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold ${
                          boutique.status === 'active' ? 'text-espresso-900 dark:text-white' :
                          boutique.status === 'trial' ? 'text-orange-600 dark:text-orange-400' :
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
                            className="flex items-center gap-1.5 px-3 py-2 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-300 text-white text-xs font-bold rounded-xl transition-colors"
                            title="Extender 30 días"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" strokeWidth={3} />
                            <span>+30d</span>
                          </button>
                          <button
                            onClick={() => handleExtend(boutique, 7)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-2 bg-espresso-700 hover:bg-espresso-800 disabled:bg-gold-200 text-white text-xs font-bold rounded-xl transition-colors"
                            title="Dar prueba 7 días"
                          >
                            <Clock className="w-3.5 h-3.5" strokeWidth={3} />
                            <span>+7d</span>
                          </button>
                          {boutique.status === 'trial' && (
                            <button
                              onClick={() => handleCancelTrial(boutique)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xs font-bold rounded-xl transition-colors"
                              title="Cancelar trial"
                            >
                              <Ban className="w-3.5 h-3.5" strokeWidth={3} />
                            </button>
                          )}
                          {boutique.is_active && boutique.status !== 'trial' && (
                            <button
                              onClick={() => handleDisable(boutique)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs font-bold rounded-xl transition-colors"
                              title="Deshabilitar"
                            >
                              <Ban className="w-3.5 h-3.5" strokeWidth={3} />
                            </button>
                          )}
                          {!boutique.is_active && (
                            <button
                              onClick={() => handleEnable(boutique)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 px-3 py-2 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-300 text-white text-xs font-bold rounded-xl transition-colors"
                              title="Habilitar"
                            >
                              <CheckCircle className="w-3.5 h-3.5" strokeWidth={3} />
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDetails(boutique)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-200 text-white text-xs font-bold rounded-xl transition-colors"
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
            <div className="bg-white dark:bg-[#16130f] rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs font-bold text-espresso-400 uppercase tracking-wider mb-1">
                    Detalles de boutique
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-espresso-900 dark:text-white">
                    {selectedBoutique.name}
                  </h2>
                  <p className="text-sm text-espresso-600 dark:text-espresso-400 font-mono mt-1">
                    {selectedBoutique.owner_email}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedBoutique(null); setDetailsData(null) }}
                  className="p-2 hover:bg-espresso-100 dark:hover:bg-espresso-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-espresso-500" />
                </button>
              </div>
              
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                </div>
              ) : detailsData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-espresso-50 dark:bg-espresso-900 rounded-2xl p-4 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)]">
                      <Package className="w-5 h-5 text-gold-500 mb-2" />
                      <div className="text-2xl font-black text-espresso-900 dark:text-white">
                        {detailsData.productsCount}
                      </div>
                      <div className="text-xs font-bold text-espresso-500 uppercase tracking-wider">
                        Productos
                      </div>
                    </div>
                    <div className="bg-espresso-50 dark:bg-espresso-900 rounded-2xl p-4 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)]">
                      <ShoppingBag className="w-5 h-5 text-gold-500 mb-2" />
                      <div className="text-2xl font-black text-espresso-900 dark:text-white">
                        {detailsData.salesCount}
                      </div>
                      <div className="text-xs font-bold text-espresso-500 uppercase tracking-wider">
                        Ventas
                      </div>
                    </div>
                    <div className="bg-espresso-50 dark:bg-espresso-900 rounded-2xl p-4 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)]">
                      <TrendingUp className="w-5 h-5 text-gold-500 mb-2" />
                      <div className="text-2xl font-black text-espresso-900 dark:text-white">
                        ${detailsData.totalSales.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs font-bold text-espresso-500 uppercase tracking-wider">
                        Total vendido
                      </div>
                    </div>
                    <div className="bg-espresso-50 dark:bg-espresso-900 rounded-2xl p-4 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)]">
                      <CalendarPlus className="w-5 h-5 text-espresso-500 mb-2" />
                      <div className="text-sm font-bold text-espresso-900 dark:text-white truncate">
                        {detailsData.lastSale 
                          ? new Date(detailsData.lastSale.created_at).toLocaleDateString('es-MX')
                          : 'N/A'}
                      </div>
                      <div className="text-xs font-bold text-espresso-500 uppercase tracking-wider">
                        Última venta
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-espresso-50 dark:bg-espresso-900 rounded-2xl p-4 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)]">
                    <div className="text-xs font-bold text-espresso-500 uppercase tracking-wider mb-2">
                      Suscripción
                    </div>
                    <div className="text-sm text-espresso-700 dark:text-espresso-300">
                      Expira: <span className="font-bold">
                        {selectedBoutique.subscription_expires_at 
                          ? new Date(selectedBoutique.subscription_expires_at).toLocaleString('es-MX')
                          : 'Sin fecha'}
                      </span>
                    </div>
                    <div className="text-sm text-espresso-700 dark:text-espresso-300 mt-1">
                      Estado: <span className={`font-bold ${selectedBoutique.is_active ? 'text-gold-500' : 'text-red-500'}`}>
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