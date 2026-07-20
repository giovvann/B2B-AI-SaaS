'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, Check, Plus, Clock, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Reminder {
  id: string
  title: string
  note?: string | null
  due: string
  done: boolean
  priority: 'low' | 'normal' | 'high'
}

export function ReminderDock() {
  const [items, setItems] = useState<Reminder[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    const supabase = createClient()
    const loadAll = async (userId: string) => {
      if (!alive) return
      let bId: string | null = null
      const { data: b } = await supabase
        .from('boutiques')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle()
      bId = b?.id ?? null
      if (!bId && alive) {
        const { data: nb } = await supabase
          .from('boutiques')
          .insert({ owner_id: userId, name: 'Mi Boutique', currency: 'MXN' })
          .select('id')
          .single()
        bId = nb?.id ?? null
      }
      if (!bId || !alive) return
      setBoutiqueId(bId)
      const { data: rem } = await supabase
        .from('reminders')
        .select('*')
        .eq('boutique_id', bId)
        .order('due', { ascending: true })
      if (rem && alive) setItems(rem as Reminder[])
      setLoaded(true)
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && alive) loadAll(session.user.id)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user && alive) loadAll(session.user.id)
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  const load = useCallback(async () => {
    if (!boutiqueId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('due', { ascending: true })
    if (data) setItems(data as Reminder[])
  }, [boutiqueId])

  const add = async () => {
    if (!title.trim() || !boutiqueId) return
    const supabase = createClient()
    const row = {
      boutique_id: boutiqueId,
      title: title.trim(),
      due: due ? new Date(due).toISOString() : new Date().toISOString(),
      priority,
      done: false,
    }
    const { data } = await supabase.from('reminders').insert(row).select().single()
    if (data) setItems(prev => [...prev, data as Reminder])
    setTitle(''); setDue(''); setPriority('normal')
  }

  const toggle = async (r: Reminder) => {
    const supabase = createClient()
    const next = !r.done
    await supabase.from('reminders').update({ done: next }).eq('id', r.id)
    setItems(prev => prev.map(i => i.id === r.id ? { ...i, done: next } : i))
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    await supabase.from('reminders').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const pending = items.filter(i => !i.done)
  if (loaded && pending.length === 0 && !open && items.length === 0) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl hover:border-indigo-300 transition-colors">
          <Bell className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Recordatorios</span>
        </button>
      </div>
    )
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm">
      {open ? (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white">
              <Bell className="w-5 h-5 text-indigo-500" /> Recordatorios
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2 max-h-60 overflow-auto">
            {items.map(r => (
              <div key={r.id} className={`flex items-center gap-2 p-2 rounded-xl border ${r.done ? 'border-zinc-200 dark:border-zinc-800 opacity-50' : 'border-zinc-200 dark:border-zinc-700'}`}>
                <button onClick={() => toggle(r)} className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center ${r.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                  {r.done && <Check className="w-4 h-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate flex items-center gap-1">
                    {r.priority === 'high' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    {r.title}
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(r.due)}</div>
                </div>
                <button onClick={() => remove(r.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"><X className="w-4 h-4 text-red-400" /></button>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-zinc-400 text-center py-3">Sin recordatorios</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="¿Qué recordar?"
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#2a2a2a] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="px-2 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#2a2a2a] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="datetime-local"
              value={due}
              onChange={e => setDue(e.target.value)}
              className="flex-1 px-2 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#2a2a2a] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 [color-scheme:light_dark]"
            />
            <button onClick={add} className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl active:scale-95 transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl hover:border-indigo-300 transition-colors">
          <Bell className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{pending.length} pendiente{pending.length !== 1 ? 's' : ''}</span>
        </button>
      )}
    </div>
  )
}
