'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  ShoppingBag, Search, Sun, Moon, Plus, ChevronDown, ChevronUp,
  CreditCard, Banknote, Wallet, ArrowLeft, Eye, X, Calendar
} from 'lucide-react'
import { displaySize, displayColor } from '@/lib/product-utils'

interface SaleItem {
  id: string
  product_id: string
  quantity: number
  price_at_sale: number
  cost_at_sale: number
  products: {
    name: string
    brand: string | null
    size: string | null
    color: string | null
  } | null
}

interface Sale {
  id: string
  created_at: string
  total_amount: number
  payment_method: 'Efectivo' | 'Transferencia' | 'Tarjeta'
  notes: string | null
  sale_items: SaleItem[]
}

type FilterMethod = 'all' | 'Efectivo' | 'Transferencia' | 'Tarjeta'

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const METHOD_ICON = {
  Efectivo: Banknote,
  Transferencia: Wallet,
  Tarjeta: CreditCard,
} as const

const METHOD_COLOR = {
  Efectivo: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
  Transferencia: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50',
  Tarjeta: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50',
} as const

export function VentasClient() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [methodFilter, setMethodFilter] = useState<FilterMethod>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data: { user } } = await createClient().auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: boutique } = await createClient()
        .from('boutiques')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (!boutique) { setLoading(false); return }

      const { data } = await createClient()
        .from('sales')
        .select(`
          id, created_at, total_amount, payment_method, notes,
          sale_items (
            id, product_id, quantity, price_at_sale, cost_at_sale,
            products ( name, brand, size, color )
          )
        `)
        .eq('boutique_id', boutique.id)
        .order('created_at', { ascending: false })

      if (active && data) setSales(data as unknown as Sale[])
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [router])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return sales.filter(s => {
      if (methodFilter !== 'all' && s.payment_method !== methodFilter) return false
      if (!term) return true
      // buscar en notas o en nombre/marca de productos
      if (s.notes && s.notes.toLowerCase().includes(term)) return true
      return (s.sale_items || []).some(it => {
        const p = it.products
        return p && (
          (p.name || '').toLowerCase().includes(term) ||
          (p.brand || '').toLowerCase().includes(term) ||
          (displaySize(p.size) || '').toLowerCase().includes(term) ||
          (displayColor(p.color) || '').toLowerCase().includes(term)
        )
      })
    })
  }, [sales, searchTerm, methodFilter])

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, s) => sum + s.total_amount, 0)
    const count = filtered.length
    const items = filtered.reduce((sum, s) => sum + (s.sale_items || []).reduce((a, i) => a + i.quantity, 0), 0)
    const ticket = count > 0 ? total / count : 0
    return { total, count, items, ticket }
  }, [filtered])

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id)

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <button onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-500" strokeWidth={2.5} />
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Historial de Ventas</h1>
          </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/20">
            <div className="text-xs font-bold uppercase tracking-wider text-white/70">Total</div>
            <div className="text-2xl font-black">{fmt(stats.total)}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ventas</div>
            <div className="text-2xl font-black text-zinc-900 dark:text-white">{stats.count}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Piezas</div>
            <div className="text-2xl font-black text-zinc-900 dark:text-white">{stats.items}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ticket prom.</div>
            <div className="text-2xl font-black text-zinc-900 dark:text-white">{fmt(stats.ticket)}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input type="text" placeholder="Buscar por producto, marca, nota..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 text-base border-2 rounded-2xl focus:border-indigo-500 focus:outline-none bg-white dark:bg-[#1a1a1a] border-zinc-300 dark:border-zinc-700" />
          </div>
          <div className="flex gap-2">
            {(['all', 'Efectivo', 'Transferencia', 'Tarjeta'] as FilterMethod[]).map(m => (
              <button key={m} onClick={() => setMethodFilter(m)}
                className={`px-4 py-3.5 text-sm font-bold rounded-2xl border transition-colors ${
                  methodFilter === m
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white dark:bg-[#1a1a1a] text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400'
                }`}>
                {m === 'all' ? 'Todas' : m}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-20 text-zinc-400 font-semibold">Cargando ventas...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-semibold">No hay ventas que mostrar</p>
            <button onClick={() => router.push('/ventas/nueva')}
              className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl">
              <Plus className="w-5 h-5" /> Registrar primera venta
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => {
              const MethodIcon = METHOD_ICON[s.payment_method]
              const expanded = expandedId === s.id
              return (
                <div key={s.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <button onClick={() => toggle(s.id)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${METHOD_COLOR[s.payment_method]}`}>
                        <MethodIcon className="w-3.5 h-3.5" /> {s.payment_method}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-900 dark:text-white">{formatDate(s.created_at)} · {formatTime(s.created_at)}</div>
                        <div className="text-xs text-zinc-400">{(s.sale_items || []).reduce((a, i) => a + i.quantity, 0)} piezas · {s.sale_items?.length || 0} líneas</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-lg font-black text-zinc-900 dark:text-white">{fmt(s.total_amount)}</span>
                      {expanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-black/20">
                      <div className="space-y-2">
                        {s.sale_items?.map(item => {
                          const p = item.products
                          const label = p ? `${p.name}${displaySize(p.size) ? ' (' + displaySize(p.size) : ''}${displayColor(p.color) ? ' ' + displayColor(p.color) : ''}${displaySize(p.size) || displayColor(p.color) ? ')' : ''}` : 'Producto'
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                              <div className="min-w-0">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{label}</span>
                                {p?.brand && <span className="text-zinc-400 text-xs ml-1">· {p.brand}</span>}
                                <span className="text-zinc-400 text-xs ml-1">×{item.quantity}</span>
                              </div>
                              <span className="font-bold text-zinc-700 dark:text-zinc-300 shrink-0">{fmt(item.price_at_sale * item.quantity)}</span>
                            </div>
                          )
                        })}
                      </div>
                      {s.notes && (
                        <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 italic border-l-2 border-zinc-300 dark:border-zinc-700 pl-3">
                          {s.notes}
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-black text-zinc-900 dark:text-white">
                        <span>TOTAL</span>
                        <span>{fmt(s.total_amount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB nueva venta */}
      <button onClick={() => router.push('/ventas/nueva')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-500/30 flex items-center justify-center active:scale-95 transition-all">
        <Plus className="w-7 h-7" />
      </button>
    </div>
  )
}
