'use client'

import { useState, useCallback } from 'react'
import { X, Calculator } from 'lucide-react'

export function CalculatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [fresh, setFresh] = useState(true)

  const input = useCallback((v: string) => {
    if (fresh) { setDisplay(v); setFresh(false) }
    else setDisplay(display === '0' ? v : display + v)
  }, [display, fresh])

  const clear = () => { setDisplay('0'); setPrev(null); setOp(null); setFresh(true) }

  const compute = (a: number, b: number, o: string) => {
    switch (o) {
      case '+': return a + b
      case '-': return a - b
      case '×': return a * b
      case '÷': return b === 0 ? 0 : a / b
      default: return b
    }
  }

  const chooseOp = (o: string) => {
    const cur = parseFloat(display)
    if (prev === null) { setPrev(cur); setOp(o); setFresh(true) }
    else if (op) {
      const r = compute(prev, cur, op)
      setPrev(r); setDisplay(String(round(r))); setOp(o); setFresh(true)
    }
  }

  const equals = () => {
    if (prev !== null && op) {
      const r = compute(prev, parseFloat(display), op)
      setDisplay(String(round(r))); setPrev(null); setOp(null); setFresh(true)
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100

  if (!open) return null

  const keys = ['7','8','9','÷','4','5','6','×','1','2','3','-','0','.','=','+']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xs bg-white dark:bg-[#1a1a1a] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Calculator className="w-5 h-5" /> <span className="font-bold text-sm">Calculadora</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 mb-4 text-right">
            <div className="text-3xl font-black text-zinc-900 dark:text-white break-all min-h-[2.5rem]">{display}</div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {keys.map(k => {
              const isOp = ['÷','×','-','+'].includes(k)
              const isEq = k === '='
              return (
                <button key={k} onClick={() => {
                  if (k === '=') equals()
                  else if (isOp) chooseOp(k)
                  else if (k === '.') input(display.includes('.') ? '' : '.')
                  else input(k)
                }}
                  className={`h-14 rounded-2xl font-black text-lg active:scale-95 transition-all ${
                    isEq ? 'col-span-1 bg-indigo-500 text-white'
                    : isOp ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}>
                  {k}
                </button>
              )
            })}
            <button onClick={clear} className="col-span-4 h-12 rounded-2xl font-black bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 active:scale-95 transition-all">LIMPIAR</button>
          </div>
        </div>
      </div>
    </div>
  )
}
