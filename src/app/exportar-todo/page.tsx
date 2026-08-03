import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DownloadAllButton } from './DownloadAllButton'
import { Info, Download, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Exportar Todo | Veliora',
  description: 'Descarga todos tus datos de Veliora en un solo archivo',
}

export default async function ExportarTodoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!boutique) redirect('/login')

  // Contar registros para mostrar
  const { count: productCount } = await supabase
    .from('products').select('*', { count: 'exact', head: true })
    .eq('boutique_id', boutique.id)

  const { count: salesCount } = await supabase
    .from('sales').select('*', { count: 'exact', head: true })
    .eq('boutique_id', boutique.id)

  const { count: expensesCount } = await supabase
    .from('expenses').select('*', { count: 'exact', head: true })
    .eq('boutique_id', boutique.id)

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[rgba(42,36,32,0.5)] dark:text-zinc-500 hover:text-[#2a2420] dark:hover:text-zinc-300 mb-8 transition-colors group text-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al panel
        </Link>

        <div className="bg-white dark:bg-[#16130f] rounded-3xl p-8 border border-[rgba(200,164,118,0.14)] dark:border-white/[0.06] shadow-[0_1px_2px_rgba(42,36,32,0.04),0_8px_24px_rgba(42,36,32,0.05)] dark:shadow-none">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
            <Download className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>

          <h1 className="text-2xl font-bold text-[#2a2420] dark:text-white text-center mb-2">Exportar Todos mis Datos</h1>
          <p className="text-[rgba(42,36,32,0.55)] dark:text-zinc-400 text-sm text-center mb-8">
            Descarga un archivo ZIP con todos los datos de <strong className="text-[#2a2420] dark:text-white">{boutique.name}</strong> en formato CSV.
            Compatible con Excel, Google Sheets y la mayoría de apps de inventario.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#f5efe7] dark:bg-white/[0.03] rounded-2xl p-5 text-center border border-[rgba(200,164,118,0.14)] dark:border-white/[0.06]">
              <div className="text-3xl font-black text-[#2a2420] dark:text-white mb-1">{productCount ?? 0}</div>
              <div className="text-xs text-[rgba(42,36,32,0.45)] dark:text-zinc-500 font-semibold uppercase tracking-wider">Productos</div>
            </div>
            <div className="bg-[#f5efe7] dark:bg-white/[0.03] rounded-2xl p-5 text-center border border-[rgba(200,164,118,0.14)] dark:border-white/[0.06]">
              <div className="text-3xl font-black text-[#2a2420] dark:text-white mb-1">{salesCount ?? 0}</div>
              <div className="text-xs text-[rgba(42,36,32,0.45)] dark:text-zinc-500 font-semibold uppercase tracking-wider">Ventas</div>
            </div>
            <div className="bg-[#f5efe7] dark:bg-white/[0.03] rounded-2xl p-5 text-center border border-[rgba(200,164,118,0.14)] dark:border-white/[0.06]">
              <div className="text-3xl font-black text-[#2a2420] dark:text-white mb-1">{expensesCount ?? 0}</div>
              <div className="text-xs text-[rgba(42,36,32,0.45)] dark:text-zinc-500 font-semibold uppercase tracking-wider">Gastos</div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
              Este ZIP contiene todos tus datos para que puedas migrar a cualquier otra plataforma en cualquier momento. 
              Tus datos son tuyos.
            </p>
          </div>

          <DownloadAllButton boutiqueName={boutique.name} />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-[rgba(42,36,32,0.4)] dark:text-zinc-600 hover:text-[#2a2420] dark:hover:text-zinc-400 transition-colors"
          >
            No quiero exportar, volver al panel
          </Link>
        </div>
      </div>
    </div>
  )
}
