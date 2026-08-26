import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  let { data: boutique } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!boutique) {
    const admin = createAdminClient()
    // ANTI-ABUSO: las boutiques nuevas nacen en plan free (el trial se canjea
    // una sola vez por dispositivo vía /api/claim-trial).
    const { data: newBoutique, error: insertError } = await admin
      .from('boutiques')
      .insert({ owner_id: user.id, name: 'Mi Boutique', is_active: true, is_trial: false, plan_type: 'free', subscription_expires_at: null })
      .select('id, name')
      .single()

    if (insertError || !newBoutique) redirect('/dashboard')

    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role: 'owner' },
    })

    boutique = newBoutique
  }

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
    <div className="min-h-screen bg-espresso-50 dark:bg-[#0d0b09] p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pb-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-espresso-900 dark:text-white">
              INVENTARIO
            </h1>
            <p className="text-sm text-espresso-600 dark:text-espresso-400 font-medium mt-0.5">
              {boutique.name} · {productList.length} producto{productList.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Link href="/ingresos/nuevo" className="block w-full mb-4 group">
          <div className="min-h-[120px] md:min-h-[140px] bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 hover:from-gold-500 hover:via-gold-600 hover:to-gold-700 text-white font-black text-xl md:text-3xl tracking-wider rounded-3xl shadow-2xl shadow-gold-400/40 group-hover:shadow-gold-400/60 flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.99] border-2 border-white/20">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
            <span>NUEVO INGRESO (IA)</span>
          </div>
        </Link>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-6">
          <Link href="/importar" className="group block">
            <div className="min-h-[70px] md:min-h-[90px] bg-gradient-to-br from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-bold md:font-black text-sm md:text-lg tracking-wider rounded-2xl shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] border border-white/20">
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
