'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sun, Moon, X, TrendingUp, DollarSign, Award, Receipt,
  Sparkles, Loader2, Send, BarChart3, PieChart as PieChartIcon, Activity
} from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

type Period = 'today' | 'week' | 'month' | 'year' | 'all'

interface Sale {
  id: string
  total_amount: number
  payment_method: string | null
  created_at: string
  sale_items: Array<{
    id: string
    quantity: number
    price_at_sale: number
    cost_at_sale: number
    product_id: string
    products: {
      id: string
      name: string
      brand: string | null
      season: string | null
      purchase_price: number
      sale_price: number
    } | null
  }> | null
}

interface Product {
  id: string
  name: string
  brand: string | null
  season: string | null
  sale_price: number
  purchase_price: number
  stock: number
}

interface MetricasClientProps {
  boutiqueName: string
  sales: Sale[]
  allProducts: Product[]
}

function ChartContainer({ children, height }: { children: React.ReactNode; height: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])
  
  if (!mounted) {
    return <div className="w-full rounded-2xl animate-pulse bg-zinc-100 dark:bg-zinc-800" style={{ height }} />
  }
  
  return (
    <div className="w-full" style={{ height, minHeight: height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

export function MetricasClient({ boutiqueName, sales, allProducts }: MetricasClientProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month')
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    let start = new Date(now)
    start.setHours(0, 0, 0, 0)
    
    switch (selectedPeriod) {
      case 'today': break
      case 'week': start.setDate(now.getDate() - 6); break
      case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); break
      case 'year': start = new Date(now.getFullYear(), 0, 1); break
      case 'all': start = new Date(2020, 0, 1); break
    }
    return { startDate: start, endDate: end }
  }, [selectedPeriod])

  const filteredSales = useMemo(() => 
    sales.filter(s => {
      const d = new Date(s.created_at)
      return d >= startDate && d <= endDate
    }),
    [sales, startDate, endDate]
  )

  const metrics = useMemo(() => {
    const totalVentas = filteredSales.reduce((sum, s) => sum + s.total_amount, 0)
    const totalTransacciones = filteredSales.length
    const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0
    let totalCostos = 0
    const productSales: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {}

    filteredSales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const product = item.products
        if (!product) return
        totalCostos += (item.cost_at_sale || 0) * item.quantity
        if (!productSales[product.id]) {
          productSales[product.id] = { name: product.name, quantity: 0, revenue: 0, profit: 0 }
        }
        productSales[product.id].quantity += item.quantity
        productSales[product.id].revenue += item.price_at_sale * item.quantity
        productSales[product.id].profit += (item.price_at_sale - item.cost_at_sale) * item.quantity
      })
    })

    const gananciaNeta = totalVentas - totalCostos
    const margen = totalVentas > 0 ? (gananciaNeta / totalVentas) * 100 : 0
    const productoEstrella = Object.values(productSales).sort((a, b) => b.quantity - a.quantity)[0]

    return { totalVentas, totalTransacciones, gananciaNeta, margen, ticketPromedio, productoEstrella, productSales }
  }, [filteredSales])

  const salesChartData = useMemo(() => {
    const grouped: Record<string, number> = {}
    filteredSales.forEach(sale => {
      const date = new Date(sale.created_at)
      let key = ''
      if (selectedPeriod === 'today') key = date.getHours().toString().padStart(2, '0') + ':00'
      else if (selectedPeriod === 'week') key = date.toLocaleDateString('es-MX', { weekday: 'short' })
      else if (selectedPeriod === 'month') key = date.getDate().toString()
      else if (selectedPeriod === 'year') key = date.toLocaleDateString('es-MX', { month: 'short' })
      else key = date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      grouped[key] = (grouped[key] || 0) + sale.total_amount
    })

    if (selectedPeriod === 'week') {
      return ['lun','mar','mié','jue','vie','sáb','dom'].map(d => ({ name: d, ventas: grouped[d] || 0 }))
    }
    if (selectedPeriod === 'year') {
      return ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'].map(m => ({ name: m, ventas: grouped[m] || 0 }))
    }
    return Object.entries(grouped).map(([n, v]) => ({ name: n, ventas: v })).sort((a, b) => parseInt(a.name) - parseInt(b.name))
  }, [filteredSales, selectedPeriod])

  const topProductsData = useMemo(() => 
    Object.values(metrics.productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3)
      .map(p => ({ 
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name, 
        quantity: p.quantity, 
        revenue: p.revenue 
      }))
      .reverse(),
    [metrics.productSales]
  )

  const seasonData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSales.forEach(s => s.sale_items?.forEach(i => {
      const season = i.products?.season || 'Sin temporada'
      map[season] = (map[season] || 0) + i.price_at_sale * i.quantity
    }))
    return Object.entries(map).map(([n, v]) => ({ name: n, value: Math.round(v * 100) / 100 }))
  }, [filteredSales])

  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']
  const isDark = theme === 'dark'
  const textColor = isDark ? '#a1a1aa' : '#71717a'
  const gridColor = isDark ? '#27272a' : '#e4e4e7'

  const suggestedQuestions = [
    '¿Qué día de la semana vendo más?',
    '¿Qué productos debería dejar de vender?',
    '¿Cuál es mi producto más rentable?',
    '¿Cómo me fue este mes comparado con el anterior?',
  ]

  const handleAskAI = async (question?: string) => {
    const q = question || aiQuestion
    if (!q.trim()) return
    if (cooldownSeconds > 0) return
    
    setAiLoading(true)
    setAiError(null)
    setAiAnswer(null)
    
    try {
      const res = await fetch('/api/analyze-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      })
      
      const ct = res.headers.get('content-type')
      const data = ct?.includes('application/json') ? await res.json() : null
      
      if (!res.ok) {
        if (data?.type === 'rate_limit' && data?.retryAfter) {
          setCooldownSeconds(data.retryAfter)
          const interval = setInterval(() => {
            setCooldownSeconds(prev => {
              if (prev <= 1) {
                clearInterval(interval)
                return 0
              }
              return prev - 1
            })
          }, 1000)
          throw new Error(`Has hecho muchas preguntas seguidas. Espera ${data.retryAfter} segundos.`)
        }
        throw new Error(data?.error || 'Error del servidor')
      }
      
      setAiAnswer(data.answer)
      if (!question) setAiQuestion('')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error al procesar la pregunta')
    } finally {
      setAiLoading(false)
    }
  }

  const periods: { value: Period; label: string }[] = [
    { value: 'today', label: 'HOY' },
    { value: 'week', label: 'SEMANA' },
    { value: 'month', label: 'MES' },
    { value: 'year', label: 'AÑO' },
    { value: 'all', label: 'HISTÓRICO' }
  ]

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-12 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-4" />
            <div className="h-6 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />)}
          </div>
        </div>
      </div>
    )
  }

  const hasSales = filteredSales.length > 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pb-8">
        <div className="fixed top-4 right-4 flex items-center gap-2 z-20">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-4 bg-white dark:bg-zinc-900 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 shadow-sm"
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
            {boutiqueName}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white mb-6">
            MI NEGOCIO
          </h1>
          <div className="flex flex-wrap gap-2">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setSelectedPeriod(p.value)}
                className={`px-5 py-3 rounded-2xl font-bold text-sm tracking-wider transition-all ${
                  selectedPeriod === p.value
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {!hasSales ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800">
            <Activity className="w-20 h-20 mx-auto mb-5 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
            <h2 className="text-2xl font-black text-zinc-700 dark:text-zinc-300 mb-2">
              Aún no hay ventas en este período
            </h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
              ¡Haz tu primera venta y vuelve aquí para ver tus métricas!
            </p>
            <button
              onClick={() => router.push('/ventas/nueva')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl transition-colors"
            >
              Ir a nueva venta
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 rounded-3xl p-6 border border-blue-200 dark:border-blue-900/50">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                  <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
                  Ventas totales
                </div>
                <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-1">
                  ${metrics.totalVentas.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold">
                  {metrics.totalTransacciones} transacción{metrics.totalTransacciones !== 1 ? 'es' : ''}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 rounded-3xl p-6 border border-emerald-200 dark:border-emerald-900/50">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
                  <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">
                  Ganancia neta
                </div>
                <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-1">
                  ${metrics.gananciaNeta.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                  Margen {metrics.margen.toFixed(1)}%
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 rounded-3xl p-6 border border-amber-200 dark:border-amber-900/50">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
                  <Award className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">
                  Producto estrella
                </div>
                <div className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-1 truncate">
                  {metrics.productoEstrella?.name || '—'}
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                  {metrics.productoEstrella?.quantity || 0} unidades vendidas
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 rounded-3xl p-6 border border-purple-200 dark:border-purple-900/50">
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
                  <Receipt className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">
                  Ticket promedio
                </div>
                <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-1">
                  ${metrics.ticketPromedio.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
                  Por transacción
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    VENTAS POR {selectedPeriod === 'today' ? 'HORA' : selectedPeriod === 'week' ? 'DÍA' : selectedPeriod === 'month' ? 'DÍA' : selectedPeriod === 'year' ? 'MES' : 'PERÍODO'}
                  </h2>
                </div>
                <ChartContainer height={320}>
                  <AreaChart data={salesChartData}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} />
                    <YAxis stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#18181b' : '#fff',
                        border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`,
                        borderRadius: '12px',
                        color: isDark ? '#fafafa' : '#18181b',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                      formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ventas']}
                    />
                    <Area type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                  </AreaChart>
                </ChartContainer>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    TOP 3 PRODUCTOS
                  </h2>
                </div>
                <ChartContainer height={320}>
                  <BarChart data={topProductsData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} />
                    <YAxis type="category" dataKey="name" stroke={textColor} style={{ fontSize: '11px', fontWeight: 600 }} tick={{ fill: textColor }} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#18181b' : '#fff',
                        border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`,
                        borderRadius: '12px',
                        color: isDark ? '#fafafa' : '#18181b',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                      formatter={(v: any, n: any) => n === 'quantity' ? [v, 'Unidades'] : [v, n]}
                    />
                    <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <PieChartIcon className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    VENTAS POR TEMPORADA
                  </h2>
                </div>
                {seasonData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                    Sin datos de temporada
                  </div>
                ) : (
                  <ChartContainer height={320}>
                    <PieChart>
                      <Pie
                        data={seasonData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                        labelLine={{ stroke: textColor }}
                      >
                        {seasonData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#18181b' : '#fff',
                          border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`,
                          borderRadius: '12px',
                          color: isDark ? '#fafafa' : '#18181b',
                          fontSize: '14px',
                          fontWeight: 600
                        }}
                        formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ventas']}
                      />
                    </PieChart>
                  </ChartContainer>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-3xl p-6 md:p-8 border border-indigo-200 dark:border-indigo-900/50 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    PREGÚNTALE A TU ASISTENTE IA
                  </h2>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold uppercase tracking-wider">
                    Analiza tus datos en segundos
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !aiLoading && cooldownSeconds === 0) handleAskAI()
                  }}
                  placeholder="Ej: ¿Qué productos me dan más ganancia?"
                  className="flex-1 bg-white dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-900/50 rounded-2xl px-5 py-4 text-base md:text-lg font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none transition-colors"
                  disabled={aiLoading || cooldownSeconds > 0}
                />
                <button
                  onClick={() => handleAskAI()}
                  disabled={aiLoading || !aiQuestion.trim() || cooldownSeconds > 0}
                  className="px-8 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 disabled:cursor-not-allowed text-white font-black text-base md:text-lg tracking-wider rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:shadow-none flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-w-[160px]"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>PENSANDO...</span>
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <span>ESPERA {cooldownSeconds}s</span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" strokeWidth={3} />
                      <span>PREGUNTAR</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2">
                  Preguntas sugeridas:
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleAskAI(q)}
                      disabled={aiLoading || cooldownSeconds > 0}
                      className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs md:text-sm font-bold rounded-xl border border-indigo-200 dark:border-indigo-900/50 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {aiLoading && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-900/50">
                  <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-semibold">Analizando tus datos...</span>
                  </div>
                </div>
              )}

              {cooldownSeconds > 0 && !aiLoading && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border-2 border-amber-300 dark:border-amber-900/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black text-lg">{cooldownSeconds}</span>
                    </div>
                    <div>
                      <p className="text-amber-800 dark:text-amber-300 font-bold mb-1">
                        Espera antes de hacer otra pregunta
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        El tier gratuito de la IA tiene límite de preguntas por minuto. Podrás preguntar de nuevo en {cooldownSeconds} segundos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {aiError && cooldownSeconds === 0 && !aiLoading && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 border-2 border-red-300 dark:border-red-900/50">
                  <p className="text-red-700 dark:text-red-400 font-semibold">{aiError}</p>
                </div>
              )}

              {aiAnswer && !aiLoading && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 border-2 border-indigo-300 dark:border-indigo-900/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <p className="text-base md:text-lg font-medium text-zinc-900 dark:text-white leading-relaxed flex-1">
                      {aiAnswer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}