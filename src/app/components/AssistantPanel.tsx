'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2, Bot, User } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolResults?: { name: string; output: string }[]
  timestamp: number
}

interface AssistantPanelProps {
  boutiqueName?: string
}

export function AssistantPanel({ boutiqueName }: AssistantPanelProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      if (!messages.length) {
        setMessages([{
          role: 'assistant',
          content: `¡Hola! 👋 Soy Tipsy, tu asistente de ${boutiqueName || 'tu boutique'}. Puedo ayudarte a:\n\n• 📦 Agregar productos ("compré 5 camisas blancas a $80")\n• 💰 Registrar ventas ("vendí 2 playeras")\n• 📝 Guardar notas y recordatorios\n• 📊 Decirte cómo va tu negocio\n\n¿Qué necesitas?`,
          timestamp: Date.now(),
        }])
      }
    }
  }, [open, messages.length, boutiqueName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError('')

    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() }
    const history = messages.map(({ role, content }) => ({ role, content }))
    setMessages((m) => [...m, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al comunicarme con Tipsy')
      }
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: data.answer,
          toolResults: data.toolResults || [],
          timestamp: Date.now(),
        },
      ])
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: '⚠️ Ocurrió un error. Intenta de nuevo.', timestamp: Date.now() },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-[#c8a476] to-[#b8925e] text-white shadow-2xl shadow-[rgba(200,164,118,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
        aria-label="Abrir Tipsy"
      >
        <div className="relative">
          <Sparkles className="w-7 h-7" strokeWidth={2.2} />
          <span className="absolute -top-1 -right-2 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#c8a476]" />
        </div>
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-md h-[560px] max-h-[calc(100vh-8rem)] bg-white dark:bg-[#141210] rounded-3xl shadow-2xl border border-[rgba(200,164,118,0.2)] dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#c8a476] to-[#b8925e] text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-lg leading-none tracking-tight">Tipsy</div>
                <div className="text-[11px] text-white/80 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full inline-block" />
                  Asistente IA de Veliora
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#fdfaf5] dark:bg-[#0e0d0b]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-[#c8a476] to-[#b8925e] text-white rounded-br-md shadow-md shadow-[rgba(200,164,118,0.25)]'
                    : 'bg-white dark:bg-[#1a1815] border border-[rgba(200,164,118,0.15)] dark:border-zinc-800 text-[#2a2420] dark:text-zinc-100 rounded-bl-md shadow-sm'
                }`}>
                  {msg.content}
                  {msg.toolResults && msg.toolResults.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[rgba(200,164,118,0.15)] dark:border-zinc-800 space-y-1">
                      {msg.toolResults.map((tr, j) => (
                        <div key={j} className="text-[11px] font-semibold text-[#b8925e] dark:text-[#c8a476]">
                          ⚡ {tr.name}: {tr.output.split('\n')[0].slice(0, 80)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#1a1815] border border-[rgba(200,164,118,0.15)] dark:border-zinc-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#c8a476] animate-spin" />
                  <span className="text-xs text-[rgba(42,36,32,0.5)] dark:text-zinc-400 font-semibold">Tipsy está pensando...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white dark:bg-[#141210] border-t border-[rgba(200,164,118,0.12)] dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Escribe en lenguaje natural..."
                className="flex-1 bg-[#fdfaf5] dark:bg-[#0e0d0b] border border-[rgba(200,164,118,0.2)] dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-[#2a2420] dark:text-white placeholder-[rgba(42,36,32,0.35)] dark:placeholder-zinc-500 focus:outline-none focus:border-[#c8a476] dark:focus:border-[#c8a476] transition-colors"
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="w-11 h-11 bg-gradient-to-br from-[#c8a476] to-[#b8925e] text-white rounded-xl flex items-center justify-center hover:from-[#b8925e] hover:to-[#a8814d] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[rgba(200,164,118,0.3)]"
                aria-label="Enviar"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-center">
              <span className="text-[10px] text-[rgba(42,36,32,0.3)] dark:text-zinc-600 font-semibold uppercase tracking-wider">
                Tipsy · IA con DeepSeek V4 Flash
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
