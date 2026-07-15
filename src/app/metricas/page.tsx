'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { data } from '@/lib/data'
import { MetricasClient } from './MetricasClient'
import { OwnerOnly } from '@/components/OwnerOnly'

export default function MetricasPage() {
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [boutiqueName, setBoutiqueName] = useState('')
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/login'; return }

        const b = await data.getBoutique()
        if (!b) { setErr('No se encontró la boutique'); return }
        setBoutiqueName(b.name || 'Mi Boutique')

        const [p, s] = await Promise.all([
          data.getProducts(b.id),
          data.getSales(b.id),
        ])
        setProducts(p as any)
        setSales(s as any)
      } catch (e: any) {
        setErr(e?.message || 'Error cargando métricas')
      } finally {
        setReady(true)
      }
    }
    init()
  }, [])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-500">
        Cargando métricas…
      </div>
    )
  }

  if (err) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-zinc-500">
        <p className="text-red-500">{err}</p>
        <button onClick={() => window.location.reload()} className="text-sm underline">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <OwnerOnly>
      <MetricasClient boutiqueName={boutiqueName} sales={sales} allProducts={products} />
    </OwnerOnly>
  )
}
