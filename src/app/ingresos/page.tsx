import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Sparkles, Home } from 'lucide-react'
import Link from 'next/link'
import { InventarioClient } from './InventarioClient'

export const metadata = {
  title: 'Ingresos | Mi Boutique',
  description: 'Gestiona el inventario completo de tu boutique',
}

export default async function IngresosPage() {
  const supabase = await createClient()

  // 1. Verificar que el usuario esté autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Obtener la boutique del usuario autenticado
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (boutiqueError || !boutique) {
    // El usuario no tiene boutique, redirigir al onboarding
    redirect('/')
  }

  // 3. Obtener SOLO los productos de la boutique del usuario
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, season, sale_price, stock')
    .eq('boutique_id', boutique.id)
    .order('name')

  if (error) {
    console.error('Error cargando productos:', error)
  }

  const productList = products || []

  // 4. Calcular estadísticas
  const totalProducts = productList.length
  const inventoryValue = productList.reduce(
    (sum, p) => sum + ((p.sale_price ?? 0) * (p.stock ?? 0)),
    0
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
                INGRESOS
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">
                Inventario de <span className="text-blue-500">{boutique.name}</span>
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Inicio
          </Link>
        </div>

        {/* Botón gigante NUEVO INGRESO (IA) */}
        <Link
          href="/ingresos/nuevo"
          className="block w-full mb-8 group"
        >
          <div className="min-h-[120px] md:min-h-[140px] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-black text-2xl md:text-3xl tracking-wider rounded-3xl shadow-2xl shadow-blue-500/40 group-hover:shadow-blue-500/60 flex items-center justify-center gap-4 transition-all duration-200 active:scale-[0.99] border-2 border-white/20">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
            <span>NUEVO INGRESO (IA)</span>
          </div>
        </Link>

        {/* Client Component con interactividad */}
        <InventarioClient
          products={productList}
          totalProducts={totalProducts}
          inventoryValue={inventoryValue}
        />
      </div>
    </div>
  )
}