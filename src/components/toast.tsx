'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <Toaster>')
  return ctx
}

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" strokeWidth={2.2} />,
  error: <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" strokeWidth={2.2} />,
  info: <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" strokeWidth={2.2} />,
}

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-500/30',
  error: 'border-red-500/30',
  info: 'border-blue-500/30',
}

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++idRef.current
    setToasts((t) => [...t.slice(-3), { id, type, title, message }])
    setTimeout(() => dismiss(id), 4200)
  }, [dismiss])

  const value: ToastContextValue = {
    toast,
    success: (title, message) => toast('success', title, message),
    error: (title, message) => toast('error', title, message),
    info: (title, message) => toast('info', title, message),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Stack de toasts */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-[#1c1813] border ${STYLES[t.type]} shadow-[0_8px_30px_rgba(42,36,32,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] animate-[toast-in_0.25s_ease-out]`}
          >
            <div className="flex-shrink-0 mt-0.5">{ICONS[t.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#2a2420] dark:text-white leading-snug">{t.title}</p>
              {t.message && (
                <p className="text-xs text-[rgba(42,36,32,0.55)] dark:text-zinc-400 mt-0.5 leading-snug">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 p-1 rounded-lg text-[rgba(42,36,32,0.35)] dark:text-zinc-500 hover:text-[#2a2420] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
