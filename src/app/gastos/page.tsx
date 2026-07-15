'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { writeLocal, uuid } from '@/lib/sync'
import { data } from '@/lib/data'
import { OwnerOnly } from '@/components/OwnerOnly'
import { useTheme } from 'next-themes'
import {
  Sun, Moon, X, Plus, Wallet, Trash2, Loader2, TrendingDown,
  Receipt, AlertCircle, CheckCircle2, Tag, Calendar,
} from 'lucide-react'

interface Expense {
  id: string
  concept: string
  category: string
  amount: number
  expense_date: string
  note: string | null
}

const CATEGORIES = ['Renta', 'Nómina', 'Proveedor', 'Servicios', 'Marketing', 'Transporte', 'Impuestos', 'Otro']

// Devuelve la fecha local del usuario en formato YYYY-MM-DD (sin desfase UTC)
function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Parsea YYYY-MM-DD como fecha LOCAL (no UTC) para evitar el desfase de 1 día
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export default function GastosPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null)
  const conceptRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    concept: '',
    category: 'Otro',
    amount: '',
    expense_date: localDateISO(),
    note: '',
  })

  useEffect(() => { setMounted(true) }, [])

  const load = async (bid: string) => {
    const expenses = await data.getExpenses(bid)
    setExpenses(expenses as Expense[])
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: b } = await supabase
        .from('boutiques').select('id').eq('owner_id', user.id).maybeSingle()
      const bid = b?.id ?? null
      if (!bid) { setError('No se encontró tu boutique'); setLoading(false); return }
      setBoutiqueId(bid)
      await load(bid)
    }
    init()
  }, [router])

  const total = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses])

  const handleAdd = async () => {
    const amount = parseFloat(form.amount)
    if (!form.concept.trim() || !amount || amount <= 0 || !boutiqueId) {
      setError('Completa concepto y monto válido')
      return
    }
    setSaving(true); setError('')
    try {
      const id = uuid()
      const row = {
        id,
        boutique_id: boutiqueId,
        concept: form.concept.trim(),
        category: form.category,
        amount,
        expense_date: form.expense_date,
        note: form.note.trim() || null,
      }
      await writeLocal('expenses', 'insert', row)
      setExpenses(prev => [{ ...row, amount: Number(amount) } as Expense, ...prev])
      setForm({ concept: '', category: 'Otro', amount: '', expense_date: localDateISO(), note: '' })
      setShowForm(false)
      setSuccess('Gasto registrado')
      setTimeout(() => setSuccess(''), 2000)
      conceptRef.current?.focus()
    } catch (e: any) {
      setError(`Error: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await writeLocal('expenses', 'delete', { id, boutique_id: boutiqueId } as any)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const fmt = (n: number) =>
    `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <OwnerOnly>
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300">
        <div className="max-w-5xl mx-auto pb-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              GASTOS
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              Registra los gastos de tu negocio para ver la salud real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-4 bg-white dark:bg-[#1a1a1a] rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun className="w-6 h-6 text-zinc-800 dark:text-zinc-200" /> : <Moon className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-5 py-4 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold rounded-2xl transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={3} />
              <span className="text-base md:text-lg">SALIR</span>
            </button>
          </div>
        </div>

        {/* Resumen total */}
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl shadow-xl p-6 md:p-8 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-7 h-7" />
            <span className="text-lg font-bold uppercase tracking-wider">Total de gastos</span>
          </div>
          <p className="text-4xl md:text-5xl font-black tracking-tight">{fmt(total)}</p>
          <p className="text-sm font-medium opacity-80 mt-1">{expenses.length} movimiento(s) registrado(s)</p>
        </div>

        {/* Botón agregar */}
        <button
          onClick={() => { setShowForm(!showForm); setTimeout(() => conceptRef.current?.focus(), 50) }}
          className="w-full min-h-[72px] bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mb-6"
        >
          <Plus className="w-7 h-7" strokeWidth={3} />
          AGREGAR GASTO
        </button>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Concepto *</label>
                <input ref={conceptRef} value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })}
                  placeholder="Ej: Renta de local"
                  className="w-full bg-white dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-base font-semibold text-zinc-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-zinc-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Categoría</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-white dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-base font-semibold text-zinc-900 dark:text-white focus:border-indigo-500 focus:outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Monto *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-white dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-7 pr-3 py-3 text-base font-semibold text-zinc-900 dark:text-white focus:border-indigo-500 focus:outline-none text-right" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Fecha</label>
                <input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })}
                  className="w-full bg-white dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-base font-semibold text-zinc-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Nota</label>
                <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="Opcional"
                  className="w-full bg-white dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-base font-semibold text-zinc-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-zinc-400" />
              </div>
            </div>
            <button onClick={handleAdd} disabled={saving}
              className="w-full mt-4 min-h-[64px] bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-60 text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              {saving ? 'GUARDANDO...' : 'GUARDAR GASTO'}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 font-semibold text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-400 font-semibold text-sm">{success}</p>
          </div>
        )}

        {/* Lista */}
        <div className="space-y-3">
          {expenses.length === 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
              <Receipt className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400 font-semibold">Aún no hay gastos registrados</p>
            </div>
          )}
          {expenses.map(e => (
            <div key={e.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-6 h-6 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-zinc-900 dark:text-white truncate">{e.concept}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">{e.category}</span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {parseLocalDate(e.expense_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">{fmt(Number(e.amount))}</span>
              <button onClick={() => handleDelete(e.id)}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>
      </OwnerOnly>
  )
}
