'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { syncBoutiqueAction } from '@/app/acciones/sync-boutique'

export default function SyncBoutiquePage() {
  const router = useRouter()
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await syncBoutiqueAction()
      if ('error' in res) {
        setResult(`Error: ${res.error}`)
      } else if ('alreadyExists' in res && res.alreadyExists) {
        setResult(`Ya tienes boutique: "${res.name}" (ID: ${res.boutiqueId})`)
      } else if ('created' in res && res.created) {
        setResult(`¡Boutique creada exitosamente! "${res.name}" (ID: ${res.boutiqueId})`)
      }
    } catch (err: any) {
      setResult(`Error inesperado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] flex items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-[#2a2420] dark:text-white mb-4">Sincronizar Boutique</h1>
        <p className="text-[rgba(42,36,32,0.55)] dark:text-gray-400 mb-8">
          Crea tu boutique si no existe aún
        </p>
        <button
          onClick={handleSync}
          disabled={loading}
          className="bg-gradient-to-br from-[#c8a476] to-[#b8925e] hover:from-[#b8925e] hover:to-[#a8814d] text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-[rgba(200,164,118,0.3)]"
        >
          {loading ? 'Sincronizando...' : 'Sincronizar Boutique'}
        </button>
        {result && (
          <div className={`mt-6 p-4 rounded-2xl border text-left ${
            result.startsWith('Error')
              ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              : 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
          }`}>
            {result}
          </div>
        )}
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 text-[#b8925e] dark:text-blue-400 hover:text-[#a8814d] dark:hover:text-blue-300 font-semibold text-sm block mx-auto"
        >
          Ir al dashboard
        </button>
      </div>
    </main>
  )
}
