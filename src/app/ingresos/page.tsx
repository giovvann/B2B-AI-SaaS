import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { InventarioClient } from './InventarioClient'
import { ImportExportButtons } from './ImportExportButtons'

export const metadata = {
  title: 'Ingresos | Mi Boutique',
  description: 'Gestiona el inventario completo de tu boutique',
}

export default async function IngresosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (boutiqueError || !boutique) {
    redirect('/')
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, season, sale_price, stock')
    .eq('boutique_id', boutique.id)
    .order('name')

  if (error) {
    console.error('Error cargando productos:', error)
  }

  const productList = products || []
  const totalProducts = productList.length
  const inventoryValue = productList.reduce(
    (sum, p) => sum + ((p.sale_price ?? 0) * (p.stock ?? 0)),
    0
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pb-8">
        {/* Header MINIMALISTA */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              INVENTARIO
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              {boutique.name} · {totalProducts} producto{totalProducts !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Botón gigante NUEVO INGRESO (IA) */}
        <Link
          href="/ingresos/nuevo"
          className="block w-full mb-4 group"
        >
          <div className="min-h-[110px] md:min-h-[130px] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-black text-xl md:text-2xl tracking-wider rounded-3xl shadow-2xl shadow-blue-500/40 group-hover:shadow-blue-500/60 flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.99] border-2 border-white/20">
            <Sparkles className="w-7 h-7 md:w-8 md:h-8 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
            <span>NUEVO INGRESO (IA)</span>
          </div>
        </Link>

        {/* Botones de Importar/Exportar */}
        <ImportExportButtons />

        <InventarioClient
          products={productList}
          totalProducts={totalProducts}
          inventoryValue={inventoryValue}
        />
      </div>
    </div>
  )
}