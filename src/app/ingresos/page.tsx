import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, Upload, Download } from 'lucide-react'
import Link from 'next/link'
import { InventarioClient } from './InventarioClient'
import { ExportButton } from './ExportButton'

export const metadata = {
  title: 'Ingresos | Mi Boutique',
  description: 'Gestiona el inventario completo de tu boutique',
}

export default async function IngresosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!boutique) redirect('/')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, season, size, color, sku, purchase_price, sale_price, stock')
    .eq('boutique_id', boutique.id)
    .order('name')

  const productList = products || []

  const inventoryValue = productList.reduce((sum, p) =>
    sum + ((p.sale_price || 0) * (p.stock || 0)), 0
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pb-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              INVENTARIO
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              {boutique.name} · {productList.length} producto{productList.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Link href="/ingresos/nuevo" className="block w-full mb-4 group">
          <div className="min-h-[120px] md:min-h-[140px] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-black text-xl md:text-3xl tracking-wider rounded-3xl shadow-2xl shadow-blue-500/40 group-hover:shadow-blue-500/60 flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.99] border-2 border-white/20">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
            <span>NUEVO INGRESO (IA)</span>
          </div>
        </Link>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-6">
          <Link href="/importar" className="group block">
            <div className="min-h-[70px] md:min-h-[90px] bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold md:font-black text-sm md:text-lg tracking-wider rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] border border-white/20">
              <Upload className="w-4 h-4 md:w-6 md:h-6" strokeWidth={2.5} />
              <span className="hidden md:inline">IMPORTAR</span>
              <span className="md:hidden">Importar</span>
            </div>
          </Link>
          <ExportButton type="inventory" />
          <ExportButton type="sales" />
        </div>

        <InventarioClient
          products={productList}
          totalProducts={productList.length}
          inventoryValue={inventoryValue}
        />
      </div>
    </div>
  )
}
