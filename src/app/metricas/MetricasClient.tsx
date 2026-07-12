'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sun, Moon, X, TrendingUp, DollarSign, Award, Receipt, Package, Calendar,
  Sparkles, Loader2, Send, BarChart3, PieChart as PieChartIcon, Activity, Wallet,
  Target, AlertTriangle, Clock, Shirt, Palette, Building2, Trophy,
  ArrowUpRight, ArrowDownRight, Minus, Flame, Snowflake, Coins, ShoppingBag,
  Gauge, Lightbulb, TrendingDown
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
      size: string | null
      color: string | null
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
  size: string | null
  color: string | null
  sku: string | null
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

// Helper para formatear moneda
const fmt = (n: number) =>
  `$${Math.round(n).toLocaleString('es-MX')}`

// Helper para porcentaje con color
function PctBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (Math.abs(value) < 0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
        <Minus className="w-3 h-3" />
        {suffix === '%' ? '0%' : '0'}
      </span>
    )
  }
  const up = value > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {up ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
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

  // ============ MÉTRICAS PRINCIPALES ============
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
    const brandSales: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {}
    const sizeSales: Record<string, { quantity: number; revenue: number }> = {}
    const colorSales: Record<string, { quantity: number; revenue: number }> = {}
    const dayTotals: Record<number, { sales: number; count: number }> = {}
    const hourTotals: Record<number, { sales: number; count: number }> = {}

    filteredSales.forEach(sale => {
      const day = new Date(sale.created_at).getDay()
      const hour = new Date(sale.created_at).getHours()
      if (!dayTotals[day]) dayTotals[day] = { sales: 0, count: 0 }
      if (!hourTotals[hour]) hourTotals[hour] = { sales: 0, count: 0 }
      dayTotals[day].sales += sale.total_amount
      dayTotals[day].count++
      hourTotals[hour].sales += sale.total_amount
      hourTotals[hour].count++

      sale.sale_items?.forEach(item => {
        const product = item.products
        if (!product) return
        totalCostos += (item.cost_at_sale || 0) * item.quantity
        totalUnitsSold += item.quantity

        if (!productSales[product.id]) {
          productSales[product.id] = { name: product.name, quantity: 0, revenue: 0, profit: 0 }
        }
        productSales[product.id].quantity += item.quantity
        productSales[product.id].revenue += (item.price_at_sale || 0) * (item.quantity || 0)
        productSales[product.id].profit += ((item.price_at_sale || 0) - (item.cost_at_sale || 0)) * (item.quantity || 0)

        const brand = product.brand || 'Sin marca'
        if (!brandSales[brand]) brandSales[brand] = { name: brand, quantity: 0, revenue: 0, profit: 0 }
        brandSales[brand].quantity += item.quantity
        brandSales[brand].revenue += (item.price_at_sale || 0) * (item.quantity || 0)
        brandSales[brand].profit += ((item.price_at_sale || 0) - (item.cost_at_sale || 0)) * (item.quantity || 0)

        const size = product.size || 'Unitalla'
        if (!sizeSales[size]) sizeSales[size] = { quantity: 0, revenue: 0 }
        sizeSales[size].quantity += item.quantity
        sizeSales[size].revenue += (item.price_at_sale || 0) * (item.quantity || 0)

        const color = product.color || 'Único'
        if (!colorSales[color]) colorSales[color] = { quantity: 0, revenue: 0 }
        colorSales[color].quantity += item.quantity
        colorSales[color].revenue += (item.price_at_sale || 0) * (item.quantity || 0)
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

    const bestHourEntry = Object.entries(hourTotals).sort(([, a], [, b]) => b.sales - a.sales)[0]
    const bestHour = bestHourEntry
      ? { hour: parseInt(bestHourEntry[0]), sales: bestHourEntry[1].sales, count: bestHourEntry[1].count }
      : null

    const totalInventoryStock = allProducts.reduce((sum, p) => sum + (p.stock || 0), 0)
    const inventoryValue = allProducts.reduce((sum, p) => sum + (p.sale_price || 0) * (p.stock || 0), 0)

    return {
      totalVentas, totalTransacciones, gananciaNeta, margen, ticketPromedio, ticketDiff,
      totalUnitsSold, totalInventoryStock, inventoryValue, productoEstrella, bestDay, bestHour,
      totalCostos, productSales, brandSales, sizeSales, colorSales, dayTotals
    }
  }, [filteredSales, prevPeriodSales, allProducts])

  // ============ COMPARACIÓN VS PERÍODO ANTERIOR ============
  const comparison = useMemo(() => {
    const prevVentas = prevPeriodSales.reduce((s, v) => s + v.total_amount, 0)
    const prevTrans = prevPeriodSales.length
    const prevUnits = prevPeriodSales.reduce((sum, s) => {
      let u = 0
      s.sale_items?.forEach(i => { u += i.quantity })
      return sum + u
    }, 0)

    const ventasDiff = prevVentas > 0 ? ((metrics.totalVentas - prevVentas) / prevVentas) * 100 : 0
    const transDiff = prevTrans > 0 ? ((metrics.totalTransacciones - prevTrans) / prevTrans) * 100 : 0
    const unitsDiff = prevUnits > 0 ? ((metrics.totalUnitsSold - prevUnits) / prevUnits) * 100 : 0

    return { prevVentas, prevTrans, prevUnits, ventasDiff, transDiff, unitsDiff, hasPrev: prevPeriodSales.length > 0 }
  }, [prevPeriodSales, metrics])

  // ============ GANANCIA EN EL TIEMPO ============
  const profitChartData = useMemo(() => {
    const grouped: Record<string, number> = {}
    filteredSales.forEach(sale => {
      const date = new Date(sale.created_at)
      let key = ''
      if (selectedPeriod === 'today') key = date.getHours().toString().padStart(2, '0') + ':00'
      else if (selectedPeriod === 'week') key = date.toLocaleDateString('es-MX', { weekday: 'short' })
      else if (selectedPeriod === 'month') key = date.getDate().toString()
      else if (selectedPeriod === 'year') key = date.toLocaleDateString('es-MX', { month: 'short' })
      else key = date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      if (!grouped[key]) grouped[key] = 0
    })

    filteredSales.forEach(s => {
      const date = new Date(s.created_at)
      let key = ''
      if (selectedPeriod === 'today') key = date.getHours().toString().padStart(2, '0') + ':00'
      else if (selectedPeriod === 'week') key = date.toLocaleDateString('es-MX', { weekday: 'short' })
      else if (selectedPeriod === 'month') key = date.getDate().toString()
      else if (selectedPeriod === 'year') key = date.toLocaleDateString('es-MX', { month: 'short' })
      else key = date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      let cost = 0
      s.sale_items?.forEach(i => { cost += (i.cost_at_sale || 0) * i.quantity })
      grouped[key] += (s.total_amount - cost)
    })

    if (selectedPeriod === 'week') {
      return ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(d => ({ name: d, ganancia: Math.round(grouped[d] || 0) }))
    }
    if (selectedPeriod === 'year') {
      return ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'].map(m => ({ name: m, ganancia: Math.round(grouped[m] || 0) }))
    }
    return Object.entries(grouped).map(([n, v]) => ({ name: n, ganancia: Math.round(v) })).sort((a, b) => parseInt(a.name) - parseInt(b.name))
  }, [filteredSales, selectedPeriod])

  // ============ VENTAS POR HORA ============
  const hourData = useMemo(() => {
    const arr: { hour: string; ventas: number }[] = []
    for (let h = 0; h < 24; h++) {
      const key = h
      const val = (metrics.dayTotals && (metrics as any).hourTotals?.[key]) || 0
      arr.push({ hour: `${h.toString().padStart(2, '0')}:00`, ventas: Math.round(val as number) })
    }
    return arr
  }, [metrics])

  // ============ TOP PRODUCTOS (10) ============
  const topProductsData = useMemo(() =>
    Object.values(metrics.productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(p => ({
        name: p.name.length > 22 ? p.name.substring(0, 22) + '...' : p.name,
        quantity: p.quantity,
        revenue: p.revenue,
        profit: p.profit,
      }))
      .reverse(),
    [metrics.productSales]
  )

  // ============ TOP MARCAS (5) ============
  const topBrandsData = useMemo(() =>
    Object.values(metrics.brandSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(b => ({
        name: b.name.length > 18 ? b.name.substring(0, 18) + '...' : b.name,
        revenue: Math.round(b.revenue),
        profit: Math.round(b.profit),
      }))
      .reverse(),
    [metrics.brandSales]
  )

  // ============ VENTAS POR TALLA ============
  const sizeData = useMemo(() =>
    Object.entries(metrics.sizeSales)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 8)
      .map(([n, v]) => ({ name: n, ventas: v.quantity, revenue: Math.round(v.revenue) })),
    [metrics.sizeSales]
  )

  // ============ VENTAS POR COLOR ============
  const colorData = useMemo(() =>
    Object.entries(metrics.colorSales)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 8)
      .map(([n, v]) => ({ name: n, value: v.quantity })),
    [metrics.colorSales]
  )

  // ============ TEMPORADA ============
  const seasonData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSales.forEach(s => s.sale_items?.forEach(i => {
      const season = i.products?.season || 'Sin temporada'
      map[season] = (map[season] || 0) + i.price_at_sale * i.quantity
    }))
    return Object.entries(map).map(([n, v]) => ({ name: n, value: Math.round(v * 100) / 100 }))
  }, [filteredSales])

  // ============ MÉTODOS DE PAGO ============
  const paymentData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSales.forEach(s => {
      const method = s.payment_method || 'Desconocido'
      map[method] = (map[method] || 0) + s.total_amount
    })
    return Object.entries(map).map(([n, v]) => ({ name: n, value: Math.round(v * 100) / 100 }))
  }, [filteredSales])

  // ============ GANANCIA POR PRODUCTO ============
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

  // ============ INVENTARIO EN RIESGO ============
  const inventoryAlerts = useMemo(() => {
    const now = Date.now()
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

    // Última fecha de venta por producto
    const lastSold: Record<string, number> = {}
    sales.forEach(s => {
      const t = new Date(s.created_at).getTime()
      s.sale_items?.forEach(i => {
        if (!lastSold[i.product_id] || t > lastSold[i.product_id]) {
          lastSold[i.product_id] = t
        }
      })
    })

    const criticalStock = allProducts.filter(p => (p.stock || 0) <= 3).sort((a, b) => (a.stock || 0) - (b.stock || 0))
    const deadStock = allProducts.filter(p => {
      const last = lastSold[p.id]
      if (!last) return (p.stock || 0) > 0 // nunca se ha vendido y tiene stock
      return (now - last) > THIRTY_DAYS && (p.stock || 0) > 0
    })
    const deadValue = deadStock.reduce((sum, p) => sum + (p.sale_price || 0) * (p.stock || 0), 0)

    return { criticalStock, deadStock, deadValue, neverSold: deadStock.filter(p => !lastSold[p.id]) }
  }, [allProducts, sales])

  // ============ META DE VENTAS ============
  const salesGoal = useMemo(() => {
    if (selectedPeriod !== 'month' && selectedPeriod !== 'year') {
      // Para otros períodos, meta basada en proporción del mes
      return null
    }
    // Calcular promedio de ventas mensuales de los últimos 6 meses completos
    const now = new Date()
    const monthlyTotals: number[] = []
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startM = new Date(d.getFullYear(), d.getMonth(), 1)
      const endM = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      const total = sales.filter(s => {
        const sd = new Date(s.created_at)
        return sd >= startM && sd <= endM
      }).reduce((sum, s) => sum + s.total_amount, 0)
      monthlyTotals.push(total)
    }
    const avg = monthlyTotals.length > 0 ? monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length : 0
    const goal = avg > 0 ? Math.round(avg * 1.1) : 0 // meta = promedio + 10%

    if (goal === 0) return null

    const pct = Math.min(100, (metrics.totalVentas / goal) * 100)
    const color = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'red'

    return { goal, pct, color, avgMonthly: Math.round(avg) }
  }, [sales, metrics.totalVentas, selectedPeriod])

  // ============ HOY RESUMIDO ============
  const todaySummary = useMemo(() => {
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const startYesterday = new Date(startToday.getTime() - 24 * 60 * 60 * 1000)
    const endYesterday = new Date(startToday.getTime() - 1)

    const todaySales = sales.filter(s => new Date(s.created_at) >= startToday)
    const yestSales = sales.filter(s => {
      const d = new Date(s.created_at)
      return d >= startYesterday && d <= endYesterday
    })

    const todayTotal = todaySales.reduce((s, v) => s + v.total_amount, 0)
    const yestTotal = yestSales.reduce((s, v) => s + v.total_amount, 0)
    const diff = yestTotal > 0 ? ((todayTotal - yestTotal) / yestTotal) * 100 : (todayTotal > 0 ? 100 : 0)

    return {
      todayTotal,
      transactions: todaySales.length,
      diff,
      hasYesterday: yestTotal > 0 || todayTotal > 0,
    }
  }, [sales])

  // ============ ASESOR IA ============
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
      title: 'INVENTARIO',
      questions: ['¿Qué productos se están agotando?', '¿Qué tengo congelado en inventario?', '¿Qué tallas vendo más?', '¿Qué colores prefieren mis clientes?']
    },
    {
      title: 'NEGOCIO',
      questions: ['¿Estoy ganando dinero?', '¿Cómo puedo mejorar mis ventas?', '¿Voy a cumplir mi meta este mes?', '¿Cómo van las ventas hoy?']
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

  const hasSales = filteredSales.length > 0 || allProducts.length > 0
  const hasAnyData = sales.length > 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pb-8">
        {/* HEADER */}
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

        {!hasAnyData ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800">
            <Activity className="w-20 h-20 mx-auto mb-5 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
            <h2 className="text-2xl font-black text-zinc-700 dark:text-zinc-300 mb-2">
              Aún no hay datos
            </h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
              Registra tu primera venta o agrega productos al inventario para ver tus métricas.
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
            {/* ============ SECCIÓN 1: HOY RESUMIDO ============ */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-500/20 mb-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Gauge className="w-6 h-6" strokeWidth={2.5} />
                <h2 className="text-xl md:text-2xl font-black tracking-tight">HOY RESUMIDO</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Ventas de hoy</div>
                  <div className="text-3xl md:text-4xl font-black">{fmt(todaySummary.todayTotal)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Transacciones</div>
                  <div className="text-3xl md:text-4xl font-black">{todaySummary.transactions}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">vs Ayer</div>
                  <div className="text-3xl md:text-4xl font-black flex items-center gap-2">
                    {todaySummary.hasYesterday ? (
                      <>
                        {todaySummary.diff >= 0 ? <ArrowUpRight className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
                        {todaySummary.diff >= 0 ? '+' : ''}{todaySummary.diff.toFixed(0)}%
                      </>
                    ) : (
                      <span className="text-xl font-bold text-white/80">Sin datos previos</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ============ 3 TARJETAS SUPERIORES ============ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                  <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Ventas totales
                </div>
                <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-1">
                  {fmt(metrics.totalVentas)}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold">
                  {comparison.hasPrev ? (
                    <>
                      <PctBadge value={comparison.ventasDiff} />
                      <span className="text-zinc-400 dark:text-zinc-500">vs período anterior</span>
                    </>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500">{metrics.totalTransacciones} transacciones</span>
                  )}
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
                  {fmt(metrics.gananciaNeta)}
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

            {/* ============ GRÁFICA DE ÁREA: VENTAS ============ */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  VENTAS POR {selectedPeriod === 'today' ? 'HORA' : selectedPeriod === 'week' ? 'DÍA' : selectedPeriod === 'month' ? 'DÍA' : selectedPeriod === 'year' ? 'MES' : 'PERÍODO'}
                </h2>
              </div>
              <ChartContainer height={320}>
                <AreaChart data={
                  (() => {
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
                  })()
                }>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} />
                  <YAxis stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ventas']} />
                  <Area type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* ============ GRÁFICA DE ÁREA: GANANCIA EN EL TIEMPO ============ */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-6">
                <Coins className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  GANANCIA NETA EN EL TIEMPO
                </h2>
              </div>
              <ChartContainer height={320}>
                <AreaChart data={profitChartData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} />
                  <YAxis stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ganancia']} />
                  <Area type="monotone" dataKey="ganancia" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* ============ 3 TARJETAS INFERIORES ============ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
                  <Receipt className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Ticket promedio
                </div>
                <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-1">
                  {fmt(metrics.ticketPromedio)}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold">
                  <PctBadge value={metrics.ticketDiff} />
                  <span className="text-zinc-400 dark:text-zinc-500">vs período anterior</span>
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
                  {metrics.productoEstrella ? `${metrics.productoEstrella.quantity} uds · ${fmt(metrics.productoEstrella.profit)} gan` : 'Sin datos'}
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
                  {metrics.bestDay ? `${fmt(metrics.bestDay.sales)} · ${Math.round(metrics.bestDay.avg).toLocaleString()} ticket` : 'Sin datos'}
                </div>
              </div>
            </div>

            {/* ============ SECCIÓN: META DE VENTAS ============ */}
            {salesGoal && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                    <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                      META DE VENTAS
                    </h2>
                  </div>
                  <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                    {salesGoal.pct.toFixed(0)}% completada
                  </span>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">{fmt(metrics.totalVentas)}</span>
                    <span className="text-lg text-zinc-400 dark:text-zinc-500 font-semibold"> / {fmt(salesGoal.goal)}</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Meta = promedio 6 meses + 10%
                  </span>
                </div>
                <div className="w-full h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      salesGoal.color === 'emerald' ? 'bg-emerald-500' :
                      salesGoal.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${salesGoal.pct}%` }}
                  />
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 font-medium">
                  {salesGoal.pct >= 100
                    ? '🎉 ¡Meta alcanzada! Superaste tu objetivo de ventas.'
                    : `Te faltan ${fmt(salesGoal.goal - metrics.totalVentas)} para llegar a tu meta.`}
                </p>
              </div>
            )}

            {/* ============ SECCIÓN: INVENTARIO EN RIESGO ============ */}
            {allProducts.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    INVENTARIO EN RIESGO
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-5 border border-red-200 dark:border-red-900/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Snowflake className="w-5 h-5 text-red-500" />
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Stock crítico</span>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">{inventoryAlerts.criticalStock.length}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">productos con ≤3 uds</div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-200 dark:border-amber-900/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">No se mueve</span>
                    </div>
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{inventoryAlerts.deadStock.length}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">sin vender 30+ días</div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-5 border border-orange-200 dark:border-orange-900/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-5 h-5 text-orange-500" />
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Capital congelado</span>
                    </div>
                    <div className="text-3xl font-black text-orange-600 dark:text-orange-400">{fmt(inventoryAlerts.deadValue)}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">en productos parados</div>
                  </div>
                </div>

                {inventoryAlerts.criticalStock.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                      <Snowflake className="w-4 h-4 text-red-500" /> Reponer pronto
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {inventoryAlerts.criticalStock.slice(0, 8).map(p => (
                        <span key={p.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900/50">
                          {p.name} ({p.stock || 0})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {inventoryAlerts.deadStock.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" /> Líquida o promociona
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {inventoryAlerts.deadStock.slice(0, 8).map(p => (
                        <span key={p.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-900/50">
                          {p.name} ({p.stock || 0})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============ CHARTS GRID ============ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* TOP 10 PRODUCTOS */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-5 h-5 md:w-6 md:h-6 text-violet-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    TOP 10 PRODUCTOS MÁS VENDIDOS
                  </h2>
                </div>
                {topProductsData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-semibold">
                    Sin ventas en este período
                  </div>
                ) : (
                  <ChartContainer height={420}>
                    <BarChart data={topProductsData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} />
                      <YAxis type="category" dataKey="name" stroke={textColor} style={{ fontSize: '11px', fontWeight: 600 }} tick={{ fill: textColor }} width={140} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any, n: any) => n === 'quantity' ? [v, 'Unidades'] : [v, n]} />
                      <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              {/* TOP 5 MARCAS */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    TOP 5 MARCAS
                  </h2>
                </div>
                {topBrandsData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-semibold">
                    Sin datos de marca
                  </div>
                ) : (
                  <ChartContainer height={320}>
                    <BarChart data={topBrandsData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="name" stroke={textColor} style={{ fontSize: '11px', fontWeight: 600 }} tick={{ fill: textColor }} width={120} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ventas']} />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              {/* VENTAS POR DÍA DE SEMANA */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    VENTAS POR DÍA DE SEMANA
                  </h2>
                </div>
                {filteredSales.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-semibold">
                    Sin ventas en este período
                  </div>
                ) : (
                  <ChartContainer height={320}>
                    <BarChart data={DAY_NAMES.map((name, i) => ({ name: name.substring(0, 3), ventas: metrics.dayTotals[i]?.sales || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="name" stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} />
                      <YAxis stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ventas']} />
                      <Bar dataKey="ventas" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              {/* MEJORES HORARIOS */}
              {selectedPeriod === 'today' || selectedPeriod === 'week' ? (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                    <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                      MEJORES HORARIOS
                    </h2>
                  </div>
                  {filteredSales.length === 0 ? (
                    <div className="h-80 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-semibold">
                      Sin ventas en este período
                    </div>
                  ) : (
                    <ChartContainer height={320}>
                      <BarChart data={hourData.filter(h => h.ventas > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="hour" stroke={textColor} style={{ fontSize: '10px', fontWeight: 600 }} tick={{ fill: textColor }} interval={1} />
                        <YAxis stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ventas']} />
                        <Bar dataKey="ventas" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </div>
              ) : null}

              {/* VENTAS POR TALLA */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Shirt className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    VENTAS POR TALLA
                  </h2>
                </div>
                {sizeData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-semibold">
                    Sin datos de talla
                  </div>
                ) : (
                  <ChartContainer height={320}>
                    <BarChart data={sizeData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" stroke={textColor} style={{ fontSize: '12px', fontWeight: 600 }} tick={{ fill: textColor }} />
                      <YAxis type="category" dataKey="name" stroke={textColor} style={{ fontSize: '11px', fontWeight: 600 }} tick={{ fill: textColor }} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any, n: any) => n === 'quantity' ? [v, 'Unidades'] : [v, n]} />
                      <Bar dataKey="quantity" fill="#6366f1" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              {/* VENTAS POR COLOR */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Palette className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    VENTAS POR COLOR
                  </h2>
                </div>
                {colorData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-semibold">
                    Sin datos de color
                  </div>
                ) : (
                  <ChartContainer height={320}>
                    <PieChart>
                      <Pie
                        data={colorData}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                        labelLine={{ stroke: textColor }}
                      >
                        {colorData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any) => [v, 'Unidades']} />
                    </PieChart>
                  </ChartContainer>
                )}
              </div>

              {/* VENTAS POR TEMPORADA */}
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
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ventas']} />
                    </PieChart>
                  </ChartContainer>
                )}
              </div>

              {/* MÉTODOS DE PAGO */}
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
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ventas']} />
                    </PieChart>
                  </ChartContainer>
                )}
              </div>
            </div>

            {/* ============ GANANCIA POR PRODUCTO ============ */}
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
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', color: isDark ? '#fafafa' : '#18181b', fontSize: '14px', fontWeight: 600 }} formatter={(v: any) => [`$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ganancia']} />
                    <Bar dataKey="ganancia" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </div>

            {/* ============ ASESOR IA ============ */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  ASESOR DE VENTAS PRIVADO
                </h2>
              </div>

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

              {aiError && cooldownSeconds === 0 && !aiLoading && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 mb-4 border border-red-200 dark:border-red-900/50">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">{aiError}</p>
                </div>
              )}

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
