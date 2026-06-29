'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sun, Moon, X, TrendingUp, DollarSign, Award, Receipt, Package, Calendar,
  Sparkles, Loader2, Send, BarChart3, PieChart as PieChartIcon, Activity, Wallet
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

interface ChatMessage {
  question: string
  answer: string
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48']
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [showQuestions, setShowQuestions] = useState(true)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

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

  const prevPeriodSales = useMemo(() => {
    if (selectedPeriod === 'all') return []
    const periodMs = endDate.getTime() - startDate.getTime()
    const prevEnd = new Date(startDate.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - periodMs)
    return sales.filter(s => {
      const d = new Date(s.created_at)
      return d >= prevStart && d <= prevEnd
    })
  }, [sales, startDate, endDate, selectedPeriod])

  const metrics = useMemo(() => {
    const totalVentas = filteredSales.reduce((sum, s) => sum + s.total_amount, 0)
    const totalTransacciones = filteredSales.length
    const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0
    const prevTicket = prevPeriodSales.length > 0
      ? prevPeriodSales.reduce((sum, s) => sum + s.total_amount, 0) / prevPeriodSales.length
      : 0
    const ticketDiff = prevTicket > 0 ? ((ticketPromedio - prevTicket) / prevTicket) * 100 : 0

    let totalCostos = 0
    let totalUnitsSold = 0
    const productSales: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {}
    const dayTotals: Record<number, { sales: number; count: number }> = {}

    filteredSales.forEach(sale => {
      const day = new Date(sale.created_at).getDay()
      if (!dayTotals[day]) dayTotals[day] = { sales: 0, count: 0 }
      dayTotals[day].sales += sale.total_amount
      dayTotals[day].count++

      sale.sale_items?.forEach(item => {
        const product = item.products
        if (!product) return
        totalCostos += (item.cost_at_sale || 0) * item.quantity
        totalUnitsSold += item.quantity
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

    const sorted = Object.values(productSales).sort((a, b) => b.quantity - a.quantity)
    const productoEstrella = sorted[0] || null

    const bestDayEntry = Object.entries(dayTotals).sort(([, a], [, b]) => b.sales - a.sales)[0]
    const bestDay = bestDayEntry
      ? { name: DAY_NAMES[parseInt(bestDayEntry[0])], sales: bestDayEntry[1].sales, avg: bestDayEntry[1].sales / bestDayEntry[1].count }
      : null

    const totalInventoryStock = allProducts.reduce((sum, p) => sum + (p.stock || 0), 0)

    return { totalVentas, totalTransacciones, gananciaNeta, margen, ticketPromedio, ticketDiff, totalUnitsSold, totalInventoryStock, productoEstrella, bestDay, productSales }
  }, [filteredSales, prevPeriodSales, allProducts])

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
      return ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(d => ({ name: d, ventas: grouped[d] || 0 }))
    }
    if (selectedPeriod === 'year') {
      return ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'].map(m => ({ name: m, ventas: grouped[m] || 0 }))
    }
    return Object.entries(grouped).map(([n, v]) => ({ name: n, ventas: v })).sort((a, b) => parseInt(a.name) - parseInt(b.name))
  }, [filteredSales, selectedPeriod])

  const topProductsData = useMemo(() =>
    Object.values(metrics.productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
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

  const paymentData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSales.forEach(s => {
      const method = s.payment_method || 'Desconocido'
      map[method] = (map[method] || 0) + s.total_amount
    })
    return Object.entries(map).map(([n, v]) => ({ name: n, value: Math.round(v * 100) / 100 }))
  }, [filteredSales])

  const dayOfWeekData = useMemo(() => {
    const map: Record<number, number> = {}
    filteredSales.forEach(s => {
      const day = new Date(s.created_at).getDay()
      map[day] = (map[day] || 0) + s.total_amount
    })
    return DAY_NAMES.map((name, i) => ({
      name: name.substring(0, 3),
      ventas: map[i] || 0
    }))
  }, [filteredSales])

  const profitByProductData = useMemo(() =>
    Object.values(metrics.productSales)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
      .map(p => ({
        name: p.name.length > 22 ? p.name.substring(0, 22) + '...' : p.name,
        ganancia: Math.round(p.profit * 100) / 100
      }))
      .reverse(),
    [metrics.productSales]
  )

  const questionCategories = [
    {
      title: 'VENTAS',
      questions: ['¿Qué día vendo más?', '¿A qué hora vendo más?', '¿Cuál es mi ticket promedio?', '¿Qué método de pago usan más?']
    },
    {
      title: 'PRODUCTOS',
      questions: ['¿Qué producto se vende más?', '¿Qué producto dejo de vender?', '¿Cuál es mi producto más rentable?', '¿Qué debería comprar más?']
    },
    {
      title: 'NEGOCIO',
      questions: ['¿Estoy ganando dinero?', '¿Cómo puedo mejorar mis ventas?', '¿Qué consejo me das para hoy?', '¿Cómo van las ventas hoy?']
    },
    {
      title: 'TENDENCIAS',
      questions: ['¿Qué temporada vende más?', '¿Hay patrones en mis ventas?', '¿Cómo voy vs el mes pasado?']
    },
  ]

  const handleAskAI = async (question?: string) => {
    const q = question || aiQuestion
    if (!q.trim()) return
    if (cooldownSeconds > 0) return

    setAiLoading(true)
    setAiError(null)

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
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          cooldownRef.current = setInterval(() => {
            setCooldownSeconds(prev => {
              if (prev <= 1) {
                if (cooldownRef.current) clearInterval(cooldownRef.current)
                return 0
              }
              return prev - 1
            })
          }, 1000)
          throw new Error(`Has hecho muchas preguntas seguidas. Espera ${data.retryAfter} segundos.`)
        }
        throw new Error(data?.error || 'Error del servidor')
      }

      setChatHistory(prev => [...prev, { question: q, answer: data.answer }])
      if (!question) setAiQuestion('')
      setShowQuestions(false)
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

  const isDark = theme === 'dark'
  const textColor = isDark ? '#a1a1aa' : '#71717a'
  const gridColor = isDark ? '#27272a' : '#e4e4e7'

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-12 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-4" />
            <div className="h-6 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />)}
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
            onClick={() => router.push('/dashboard')}
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
            {/* 3 Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                  <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Ventas totales
                </div>
                <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-1">
                  ${metrics.totalVentas.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  {metrics.totalTransacciones} transacción{metrics.totalTransacciones !== 1 ? 'es' : ''}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
                  <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Ganancia neta
                </div>
                <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-1">
                  ${metrics.gananciaNeta.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Margen {metrics.margen.toFixed(1)}%
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 bg-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
                  <Package className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Productos vendidos
                </div>
                <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-1">
                  {metrics.totalUnitsSold.toLocaleString()}
                </div>
                <div className="text-xs text-violet-600 dark:text-violet-400 font-semibold">
                  {metrics.totalInventoryStock} en inventario
                </div>
              </div>
            </div>

            {/* Area Chart (full width) */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
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

            {/* 3 Bottom Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
                  <Receipt className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Ticket promedio
                </div>
                <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-1">
                  ${metrics.ticketPromedio.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </div>
                <div className={`text-xs font-semibold ${metrics.ticketDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {metrics.ticketDiff !== 0 ? `${metrics.ticketDiff > 0 ? '+' : ''}${metrics.ticketDiff.toFixed(1)}% vs período anterior` : 'Sin datos previos'}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 mb-4">
                  <Award className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Producto estrella
                </div>
                <div className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-1 truncate">
                  {metrics.productoEstrella?.name || '---'}
                </div>
                <div className="text-xs text-pink-600 dark:text-pink-400 font-semibold">
                  {metrics.productoEstrella ? `${metrics.productoEstrella.quantity} uds · $${metrics.productoEstrella.profit.toLocaleString('es-MX', { maximumFractionDigits: 0 })} gan` : 'Sin datos'}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-4">
                  <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Mejor día de venta
                </div>
                <div className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-1 capitalize">
                  {metrics.bestDay?.name || '---'}
                </div>
                <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">
                  {metrics.bestDay ? `$${metrics.bestDay.sales.toLocaleString('es-MX', { maximumFractionDigits: 0 })} · $${Math.round(metrics.bestDay.avg).toLocaleString()} ticket` : 'Sin datos'}
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-violet-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    TOP 5 PRODUCTOS
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

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    VENTAS POR DÍA DE SEMANA
                  </h2>
                </div>
                <ChartContainer height={320}>
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
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
                    <Bar dataKey="ventas" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <PieChartIcon className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    VENTAS POR TEMPORADA
                  </h2>
                </div>
                {seasonData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-semibold">
                    Sin datos de temporada
                  </div>
                ) : (
                  <ChartContainer height={320}>
                    <PieChart>
                      <Pie
                        data={seasonData}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={100}
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

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Wallet className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    MÉTODOS DE PAGO
                  </h2>
                </div>
                {paymentData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-semibold">
                    Sin datos de pago
                  </div>
                ) : (
                  <ChartContainer height={320}>
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                        labelLine={{ stroke: textColor }}
                      >
                        {paymentData.map((_, i) => (
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

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  GANANCIA POR PRODUCTO
                </h2>
              </div>
              {profitByProductData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-semibold">
                  Sin datos de ganancia
                </div>
              ) : (
                <ChartContainer height={400}>
                  <BarChart data={profitByProductData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" stroke={textColor} style={{ fontSize: '11px', fontWeight: 600 }} tick={{ fill: textColor }} width={140} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#18181b' : '#fff',
                        border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`,
                        borderRadius: '12px',
                        color: isDark ? '#fafafa' : '#18181b',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                      formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ganancia']}
                    />
                    <Bar dataKey="ganancia" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </div>

            {/* Assistant */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  ASESOR DE VENTAS PRIVADO
                </h2>
              </div>

              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="max-h-80 overflow-y-auto space-y-3 mb-4 pr-2">
                  {chatHistory.map((msg, i) => (
                    <div key={i}>
                      <div className="flex justify-end mb-2">
                        <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] text-sm font-medium">
                          {msg.question}
                        </div>
                      </div>
                      <div className="flex justify-start mb-2">
                        <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] text-sm font-medium leading-relaxed">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" strokeWidth={2.5} />
                            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Asesor</span>
                          </div>
                          {msg.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Welcome */}
              {chatHistory.length === 0 && !aiLoading && !aiError && cooldownSeconds === 0 && (
                <div className="text-center py-6 mb-4">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-indigo-300 dark:text-indigo-600" strokeWidth={1.5} />
                  <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    Hola! Soy tu asesor de ventas privado
                  </p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    Pregúntame lo que quieras sobre tu boutique
                  </p>
                </div>
              )}

              {/* Typing Animation */}
              {aiLoading && (
                <div className="flex items-center gap-3 mb-4 px-2 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm font-semibold text-indigo-500 dark:text-indigo-400">Analizando tus datos...</span>
                </div>
              )}

              {/* Cooldown */}
              {cooldownSeconds > 0 && !aiLoading && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 mb-4 border border-amber-200 dark:border-amber-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black text-sm">{cooldownSeconds}</span>
                    </div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      Espera {cooldownSeconds} segundos antes de hacer otra pregunta
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {aiError && cooldownSeconds === 0 && !aiLoading && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 mb-4 border border-red-200 dark:border-red-900/50">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">{aiError}</p>
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !aiLoading && cooldownSeconds === 0) handleAskAI()
                  }}
                  placeholder="Ej: ¿Qué productos me dan más ganancia?"
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none transition-colors"
                  disabled={aiLoading || cooldownSeconds > 0}
                />
                <button
                  onClick={() => handleAskAI()}
                  disabled={aiLoading || !aiQuestion.trim() || cooldownSeconds > 0}
                  className="px-6 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 disabled:cursor-not-allowed text-white font-black text-sm tracking-wider rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:shadow-none flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : cooldownSeconds > 0 ? (
                    <span>{cooldownSeconds}s</span>
                  ) : (
                    <Send className="w-4 h-4" strokeWidth={3} />
                  )}
                </button>
              </div>

              {/* 100% GRATUITO E ILIMITADO badge below input */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 text-amber-700 dark:text-amber-300 text-[10px] font-black rounded-full border border-amber-200 dark:border-amber-900/50">
                  <Sparkles className="w-3 h-3" strokeWidth={3} />
                  <span>100% GRATUITO E ILIMITADO</span>
                </div>
              </div>

              {/* Suggested Questions */}
              {showQuestions && (
                <div>
                  <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                    Preguntas sugeridas
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {questionCategories.map(cat => (
                      <div key={cat.title}>
                        <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1.5">
                          {cat.title}
                        </div>
                        <div className="flex flex-col gap-1">
                          {cat.questions.map(q => (
                            <button
                              key={q}
                              onClick={() => handleAskAI(q)}
                              disabled={aiLoading || cooldownSeconds > 0}
                              className="text-left px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-zinc-600 dark:text-zinc-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all disabled:opacity-50 truncate"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show questions again button */}
              {!showQuestions && (
                <button
                  onClick={() => setShowQuestions(true)}
                  className="text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                >
                  + Mostrar preguntas sugeridas
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
