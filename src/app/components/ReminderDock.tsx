'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, Plus, Clock } from 'lucide-react'

interface Reminder {
  id: string
  title: string
  note?: string
  due: string // ISO
  done: boolean
}

const KEY = 'veliora_reminders_v1'

export function ReminderDock() {
  const [items, setItems] = useState<Reminder[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { setItems([]) }
  }, [])

  const save = (next: Reminder[]) => { setItems(next); localStorage.setItem(KEY, JSON.stringify(next)) }

  const add = () => {
    if (!title.trim()) return
    const r: Reminder = { id: crypto.randomUUID(), title: title.trim(), note: '', due: due || new Date().toISOString(), done: false }
    save([...items, r]); setTitle(''); setDue('')
  }
  const toggle = (id: string) => save(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
  const remove = (id: string) => save(items.filter(i => i.id !== id))

  const pending = items.filter(i => !i.done)
  if (pending.length === 0 && !open) return null

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
                <button onClick={() => toggle(r.id)} className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center ${r.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                  {r.done && <Check className="w-4 h-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{r.title}</div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.due).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <button onClick={() => remove(r.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"><X className="w-4 h-4 text-red-400" /></button>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-zinc-400 text-center py-3">Sin recordatorios</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Qué recordar?" className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-indigo-500" />
            <input type="datetime-local" value={due} onChange={e => setDue(e.target.value)} className="px-2 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none" />
            <button onClick={add} className="px-3 py-2 bg-indigo-500 text-white rounded-xl active:scale-95"><Plus className="w-4 h-4" /></button>
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
