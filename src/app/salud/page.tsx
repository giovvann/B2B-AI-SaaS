'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  ArrowLeft, Activity, TrendingUp, TrendingDown, DollarSign,
  Package, ShoppingCart, AlertTriangle, Lightbulb, Loader2,
  Sparkles, Wallet
} from 'lucide-react'

export default function SaludPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<{
    score: number
    status: 'green' | 'yellow' | 'red'
    label: string
    metrics: {
      revenue: number
      profit: number
      margin: number
      expenses: number
      totalProducts: number
      totalSales: number
      avgTicket: number
      deadStockPercent: number
      criticalStockCount: number
    }
    recommendations: string[]
  } | null>(null)

  useEffect(() => {
    loadHealth()
  }, [])

  const loadHealth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: boutique } = await supabase
        .from('boutiques')
        .select('id, name')
        .eq('owner_id', user.id)
        .single()

      if (!boutique) { router.push('/login'); return }

      // Cargar datos de los útlimos 90 días
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount, created_at, sale_items(quantity, price_at_sale, cost_at_sale, products(name, purchase_price, sale_price))')
        .eq('boutique_id', boutique.id)
        .gte('created_at', ninetyDaysAgo.toISOString())

      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('boutique_id', boutique.id)
        .gte('expense_date', ninetyDaysAgo.toISOString())

      const { data: inventory } = await supabase
        .from('products')
        .select('id, name, stock, sale_price, purchase_price')
        .eq('boutique_id', boutique.id)

      // Calcular métricas
      const totalVentas = sales?.reduce((s, sale: any) => s + (sale.total_amount || 0), 0) || 0
      const totalTransacciones = sales?.length || 0
      const totalGastos = expenses?.reduce((s, e: any) => s + (e.amount || 0), 0) || 0
      const profit = totalVentas - totalGastos
      const margin = totalVentas > 0 ? (profit / totalVentas) * 100 : 0
      const avgTicket = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0

      // Dead stock
      const nowMs = Date.now()
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
      const lastSold: Record<string, number> = {}
      sales?.forEach((sale: any) => {
        const t = new Date(sale.created_at).getTime()
        sale.sale_items?.forEach((item: any) => {
          if (item.products?.name && (!lastSold[item.products.name] || t > lastSold[item.products.name])) {
            lastSold[item.products.name] = t
          }
        })
      })

      const totalItems = inventory?.length || 0
      const deadItems = inventory?.filter((p: any) => {
        if (!p.stock || p.stock <= 0) return false
        const last = lastSold[p.name]
        if (!last) return true
        return (nowMs - last) > THIRTY_DAYS
      }) || []
      const criticalItems = inventory?.filter((p: any) => (p.stock || 0) <= 3 && (p.stock || 0) > 0) || []
      const deadStockPercent = totalItems > 0 ? (deadItems.length / totalItems) * 100 : 0

      // Calcular score (0-100)
      let score = 50 // base

      // Profit margin (0-30 pts)
      if (margin >= 30) score += 30
      else if (margin >= 20) score += 20
      else if (margin >= 10) score += 10
      else if (margin > 0) score += 5
      else score -= 10

      // Dead stock (0-20 pts)
      if (deadStockPercent <= 5) score += 20
      else if (deadStockPercent <= 15) score += 10
      else if (deadStockPercent <= 30) score += 5
      else score -= 10

      // Critical stock (0-20 pts)
      if (criticalItems.length === 0) score += 20
      else if (criticalItems.length <= 3) score += 10
      else if (criticalItems.length <= 10) score += 5
      else score -= 5

      // Transaction volume (0-30 pts)
      if (totalTransacciones >= 100) score += 30
      else if (totalTransacciones >= 50) score += 20
      else if (totalTransacciones >= 20) score += 10
      else if (totalTransacciones >= 5) score += 5

      // Clamp
      score = Math.max(0, Math.min(100, score))

      let status: 'green' | 'yellow' | 'red'
      let label: string
      if (score >= 70) { status = 'green'; label = 'Saludable' }
      else if (score >= 40) { status = 'yellow'; label = 'Precaución' }
      else { status = 'red'; label = 'En riesgo' }

      // Generar recomendaciones automáticas
      const recommendations: string[] = []
      if (margin < 15) recommendations.push('Tu margen de ganancia es bajo. Revisa tus precios de venta o negocia mejores precios con proveedores.')
      if (deadStockPercent > 20) recommendations.push(`Tienes ${deadItems.length} productos sin vender en 30+ días. Considera una promoción o descuento por temporada.`)
      if (criticalItems.length > 5) recommendations.push(`Hay ${criticalItems.length} productos con stock crítico. Prioriza reabastecer tus bestsellers.`)
      if (totalTransacciones < 20) recommendations.push('El volumen de ventas es bajo. Intenta promocionar tu tienda en redes sociales o crear programas de fidelidad.')
      if (margin >= 25 && deadStockPercent < 10 && criticalItems.length === 0) recommendations.push('Todo va excelente. Considera expandir tu inventario con nuevas temporadas o marcas.')
      if (avgTicket < 200) recommendations.push('Tu ticket promedio es bajo. Ofrece combos o productos complementarios al momento de la venta.')
      if (totalGastos > totalVentas * 0.7) recommendations.push('Tus gastos representan más del 70% de tus ingresos. Revisa gastos innecesarios.')
      if (recommendations.length === 0) recommendations.push('No hay recomendaciones específicas. Sigue así y monitorea tus métricas regularmente.')

      setHealth({
        score,
        status,
        label,
        metrics: {
          revenue: totalVentas,
          profit,
          margin,
          expenses: totalGastos,
          totalProducts: totalItems,
          totalSales: totalTransacciones,
          avgTicket,
          deadStockPercent,
          criticalStockCount: criticalItems.length,
        },
        recommendations,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!health) return null

  const statusColors = {
    green: { bg: 'from-green-500 to-emerald-600', text: 'text-green-400', glow: 'shadow-green-500/30' },
    yellow: { bg: 'from-amber-500 to-orange-600', text: 'text-amber-400', glow: 'shadow-amber-500/30' },
    red: { bg: 'from-red-500 to-rose-600', text: 'text-red-400', glow: 'shadow-red-500/30' },
  }

  const colors = statusColors[health.status]

  const formatMoney = (n: number) => `$${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al panel</span>
        </button>

        {/* Score card */}
        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-3xl p-8 border border-white/[0.06] mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Activity className="w-6 h-6 text-blue-400" />
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Salud de la empresa</span>
          </div>

          <div className={`w-36 h-36 mx-auto rounded-full bg-gradient-to-br ${colors.bg} ${colors.glow} shadow-2xl flex items-center justify-center mb-4`}>
            <span className="text-5xl font-black text-white">{health.score}</span>
          </div>

          <div className={`text-2xl font-black ${colors.text} mb-2`}>{health.label}</div>
          <p className="text-zinc-500 text-sm">
            Score basado en margen, rotación de inventario y volumen de ventas (últimos 90 días)
          </p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: DollarSign, label: 'Ingresos', value: formatMoney(health.metrics.revenue), color: 'text-green-400' },
            { icon: TrendingUp, label: 'Ganancia neta', value: formatMoney(health.metrics.profit), color: health.metrics.profit >= 0 ? 'text-green-400' : 'text-red-400' },
            { icon: Wallet, label: 'Gastos', value: formatMoney(health.metrics.expenses), color: 'text-rose-400' },
            { icon: TrendingUp, label: 'Margen', value: `${health.metrics.margin.toFixed(1)}%`, color: health.metrics.margin >= 20 ? 'text-green-400' : health.metrics.margin >= 10 ? 'text-amber-400' : 'text-red-400' },
            { icon: ShoppingCart, label: 'Ventas (90d)', value: String(health.metrics.totalSales), color: 'text-blue-400' },
            { icon: DollarSign, label: 'Ticket promedio', value: formatMoney(health.metrics.avgTicket), color: 'text-cyan-400' },
            { icon: Package, label: 'Productos', value: String(health.metrics.totalProducts), color: 'text-purple-400' },
            { icon: AlertTriangle, label: 'Stock crítico', value: String(health.metrics.criticalStockCount), color: health.metrics.criticalStockCount > 0 ? 'text-amber-400' : 'text-green-400' },
          ].map((metric, i) => (
            <div key={i} className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{metric.label}</span>
              </div>
              <div className={`text-2xl font-black ${metric.color}`}>{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-3xl p-6 md:p-8 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Recomendaciones</h2>
          </div>
          <div className="space-y-3">
            {health.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/[0.04]">
                <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-zinc-300 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/metricas')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98]"
          >
            <Activity className="w-5 h-5" />
            VER MÉTRICAS DETALLADAS
          </button>
        </div>
      </div>
    </div>
  )
}
